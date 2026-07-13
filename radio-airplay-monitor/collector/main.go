// Command collector polls each station's public now-playing endpoint once,
// appends newly-seen spins to month-partitioned NDJSON, and updates a small
// per-station cursor so overlapping runs don't double-count. Designed to be run
// on a schedule (GitHub Actions cron) with the result committed back to the repo.
//
//	go run . -data ../data
package main

import (
	"flag"
	"fmt"
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
	store := NewStore(*dataDir)

	total := 0
	for _, st := range cfg.Stations {
		spins, err := fetchStation(st, cfg)
		if err != nil {
			log.Printf("WARN %-22s %v", st.ID, err) // one flaky station must not abort the run
			continue
		}
		ss := state[st.ID]
		fresh := newSpins(st, spins, &ss)
		if len(fresh) > 0 {
			if err := store.Append(fresh); err != nil {
				log.Printf("WARN %-22s append: %v", st.ID, err)
				continue
			}
			log.Printf("%-22s +%d", st.ID, len(fresh))
			total += len(fresh)
		}
		state[st.ID] = ss
	}

	if err := saveState(statePath, state); err != nil {
		log.Fatalf("save state: %v", err)
	}
	log.Printf("done: %d new spins at %s", total, time.Now().UTC().Format(time.RFC3339))
}

func fetchStation(st Station, cfg *Config) ([]Spin, error) {
	switch st.Adapter {
	case "triton":
		n := st.HistoryFetch
		if n == 0 {
			n = cfg.TritonHistoryFetch
		}
		if n == 0 {
			n = 10
		}
		return fetchTriton(st, n)
	case "streamb":
		return fetchStreamB(st)
	default:
		return nil, fmt.Errorf("unknown adapter %q", st.Adapter)
	}
}

// newSpins filters a fetch down to genuinely new spins and advances the cursor.
func newSpins(st Station, spins []Spin, ss *StationState) []Spin {
	var fresh []Spin
	if st.Adapter == "streamb" {
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
