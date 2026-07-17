package main

import (
	"encoding/json"
	"os"
)

// FeedHealth is the collector's own record of whether a station's feed is
// answering. Derived purely from data (last-spin age) can't tell "quiet feed"
// from "dead feed", so the collector records the poll outcome directly. Written
// to data/health.json each run and surfaced in the UI.
type FeedHealth struct {
	LastPollAt int64  `json:"last_poll_at"`         // unix seconds of the most recent poll attempt
	LastOKAt   int64  `json:"last_ok_at"`           // most recent poll that fetched without error
	LastSpinAt int64  `json:"last_spin_at"`         // played_at of the newest spin ever captured
	Fails      int    `json:"consec_fails"`         // consecutive failed polls (0 = healthy)
	LastError  string `json:"last_error,omitempty"` // message from the most recent failure
}

func loadHealth(path string) map[string]FeedHealth {
	m := map[string]FeedHealth{}
	b, err := os.ReadFile(path)
	if err != nil || len(b) == 0 {
		return m
	}
	_ = json.Unmarshal(b, &m) // a corrupt health file is non-fatal; start fresh
	return m
}

func saveHealth(path string, m map[string]FeedHealth) error {
	b, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append(b, '\n'), 0644)
}

// record folds one poll's outcome into a station's health entry.
func (h *FeedHealth) record(now int64, err error, newestSpinAt int64) {
	h.LastPollAt = now
	if err != nil {
		h.Fails++
		h.LastError = err.Error()
		return
	}
	h.Fails = 0
	h.LastError = ""
	h.LastOKAt = now
	if newestSpinAt > h.LastSpinAt {
		h.LastSpinAt = newestSpinAt
	}
}
