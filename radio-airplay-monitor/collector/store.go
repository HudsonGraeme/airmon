package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Station is one monitored broadcast station.
type Station struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Market       string `json:"market"`
	Owner        string `json:"owner"`
	Format       string `json:"format"`
	Adapter      string `json:"adapter"`           // "triton" | "streamb"
	Mount        string `json:"mount,omitempty"`   // triton mount name
	URL          string `json:"url,omitempty"`     // streamb endpoint
	HistoryFetch int    `json:"history_fetch,omitempty"`
}

// Config is data/stations.json.
type Config struct {
	TritonHistoryFetch int       `json:"triton_history_fetch"`
	Stations           []Station `json:"stations"`
	Analysis           struct {
		Focus    []string `json:"focus"`
		Controls []string `json:"controls"`
	} `json:"analysis"`
}

// Spin is one logged play. Field names are short because we store millions of
// these as NDJSON: s=station id, a=artist, t=title, at=unix seconds, src=adapter.
type Spin struct {
	Station string `json:"s"`
	Artist  string `json:"a"`
	Title   string `json:"t"`
	At      int64  `json:"at"`
	Src     string `json:"src"`
}

// StationState is per-station cursor used to avoid re-appending known spins.
type StationState struct {
	MaxAt   int64  `json:"max_at"`   // newest played_at we've stored (timestamped sources)
	LastKey string `json:"last_key"` // last artist|title seen (current-track sources)
}

func loadConfig(path string) (*Config, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var c Config
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, err
	}
	return &c, nil
}

func loadState(path string) (map[string]StationState, error) {
	b, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return map[string]StationState{}, nil
	}
	if err != nil {
		return nil, err
	}
	m := map[string]StationState{}
	if len(b) == 0 {
		return m, nil
	}
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, err
	}
	return m, nil
}

func saveState(path string, m map[string]StationState) error {
	b, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append(b, '\n'), 0644)
}

func normKey(artist, title string) string {
	return strings.ToLower(strings.TrimSpace(artist)) + "|" + strings.ToLower(strings.TrimSpace(title))
}

// Store appends spins to month-partitioned NDJSON files under data/spins/.
type Store struct{ dir string }

func NewStore(dataDir string) *Store { return &Store{dir: filepath.Join(dataDir, "spins")} }

func (s *Store) Append(spins []Spin) error {
	if err := os.MkdirAll(s.dir, 0755); err != nil {
		return err
	}
	byMonth := map[string][]Spin{}
	for _, sp := range spins {
		month := time.Unix(sp.At, 0).UTC().Format("2006-01")
		byMonth[month] = append(byMonth[month], sp)
	}
	for month, list := range byMonth {
		path := filepath.Join(s.dir, month+".ndjson")
		f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return err
		}
		enc := json.NewEncoder(f)
		for _, sp := range list {
			if err := enc.Encode(sp); err != nil {
				f.Close()
				return err
			}
		}
		if err := f.Close(); err != nil {
			return err
		}
	}
	return nil
}
