// Command collector polls each station's public now-playing endpoint once,
// appends newly-seen spins to month-partitioned NDJSON, and updates a small
// per-station cursor so overlapping runs don't double-count. Designed to be run
// on a schedule (GitHub Actions cron) with the result committed back to the repo.
//
//	go run . -data ../data
package main

import (
	"flag"
	"log"
	"path/filepath"
	"sort"
	"time"
)

func main() {
	dataDir := flag.String("data", "data", "path to the data directory")
	flag.Parse()

	cfg, err := loadConfig(filepath.Join(*dataDir, "stations.json"))
	if err != nil {
		log.Fatalf("load config: %v", err)
	}
	statePath := filepath.Join(*dataDir, "state.json")
	state, err := loadState(statePath)
	if err != nil {
		log.Fatalf("load state: %v", err)
	}
	healthPath := filepath.Join(*dataDir, "health.json")
	health := loadHealth(healthPath)
	store := NewStore(*dataDir)

	total := 0
	for _, st := range cfg.Stations {
		eff := cfg.resolve(st)
		if !eff.enabled() {
			log.Printf("%-22s skipped (disabled)", st.ID)
			continue
		}
		ad, ok := registry[st.Adapter]
		if !ok {
			log.Printf("WARN %-22s unknown adapter %q", st.ID, st.Adapter)
			continue
		}

		ss := state[st.ID]
		fresh, perr := poll(ad, st, eff, &ss)

		h := health[st.ID]
		h.record(time.Now().Unix(), perr, ss.MaxAt)
		health[st.ID] = h
		state[st.ID] = ss

		if perr != nil {
			log.Printf("WARN %-22s %v", st.ID, perr) // one flaky station must not abort the run
			continue
		}
		if len(fresh) > 0 {
			if err := store.Append(fresh); err != nil {
				log.Printf("WARN %-22s append: %v", st.ID, err)
				continue
			}
			log.Printf("%-22s +%d", st.ID, len(fresh))
			total += len(fresh)
		}
	}

	if err := saveState(statePath, state); err != nil {
		log.Fatalf("save state: %v", err)
	}
	if err := saveHealth(healthPath, health); err != nil {
		log.Printf("WARN save health: %v", err)
	}
	log.Printf("done: %d new spins at %s", total, time.Now().UTC().Format(time.RFC3339))
}

// poll fetches a station and returns its genuinely-new spins, advancing the
// cursor. Current-track feeds expose only the song playing right now, so a single
// hourly poll captures ~1 of their dozen songs/hour; when a sample window is
// configured we keep re-sampling across the window to catch the changes in
// between. Timestamped feeds already return recent history, so one fetch suffices.
func poll(ad adapter, st Station, eff Strategy, ss *StationState) ([]Spin, error) {
	if ad.mode == modeCurrent && eff.SampleWindowS > 0 {
		every := eff.SampleEveryS
		if every <= 0 {
			every = 20
		}
		samples := eff.SampleWindowS / every
		if samples < 1 {
			samples = 1
		}
		var all []Spin
		var lastErr error
		gotOne := false
		for i := 0; i <= samples; i++ {
			if i > 0 {
				time.Sleep(time.Duration(every) * time.Second)
			}
			spins, err := fetchStation(ad, st, eff)
			if err != nil {
				lastErr = err
				continue
			}
			gotOne = true
			all = append(all, newSpins(ad.mode, spins, ss)...)
		}
		if !gotOne {
			return nil, lastErr // every sample failed → report the feed as down
		}
		return all, nil
	}

	spins, err := fetchStation(ad, st, eff)
	if err != nil {
		return nil, err
	}
	return newSpins(ad.mode, spins, ss), nil
}

// fetchStation runs an adapter with the station's retry strategy, so a transient
// network blip doesn't cost a whole poll interval of spins.
func fetchStation(ad adapter, st Station, eff Strategy) ([]Spin, error) {
	attempts := eff.MaxRetries + 1
	if attempts < 1 {
		attempts = 1
	}
	var lastErr error
	for i := 0; i < attempts; i++ {
		if i > 0 && eff.RetryBackoffMs > 0 {
			time.Sleep(time.Duration(eff.RetryBackoffMs*i) * time.Millisecond)
		}
		spins, err := ad.fetch(st, eff)
		if err == nil {
			return spins, nil
		}
		lastErr = err
	}
	return nil, lastErr
}

// newSpins filters a fetch down to genuinely new spins and advances the cursor.
func newSpins(mode fetchMode, spins []Spin, ss *StationState) []Spin {
	var fresh []Spin
	if mode == modeCurrent {
		// current-track only: append when it differs from the last stored track
		for _, sp := range spins {
			key := normKey(sp.Artist, sp.Title)
			if key != ss.LastKey {
				fresh = append(fresh, sp)
				ss.LastKey = key
				ss.MaxAt = sp.At
			}
		}
		return fresh
	}
	// timestamped: append anything strictly newer than the cursor
	sort.Slice(spins, func(i, j int) bool { return spins[i].At < spins[j].At })
	for _, sp := range spins {
		if sp.At > ss.MaxAt {
			fresh = append(fresh, sp)
		}
	}
	if len(spins) > 0 {
		if last := spins[len(spins)-1].At; last > ss.MaxAt {
			ss.MaxAt = last
		}
	}
	return fresh
}
