package main

import "testing"

func boolp(b bool) *bool { return &b }

func TestResolvePrecedence(t *testing.T) {
	cfg := &Config{Defaults: Strategy{HistoryFetch: 20, MaxRetries: 3, RetryBackoffMs: 250}}

	tests := []struct {
		name string
		st   Station
		want Strategy
	}{
		{
			name: "defaults apply when station overrides nothing",
			st:   Station{ID: "a", Adapter: "triton"},
			want: Strategy{HistoryFetch: 20, MaxRetries: 3, RetryBackoffMs: 250},
		},
		{
			name: "station strategy overrides defaults field-by-field",
			st:   Station{ID: "b", Adapter: "triton", Strategy: &Strategy{HistoryFetch: 30}},
			want: Strategy{HistoryFetch: 30, MaxRetries: 3, RetryBackoffMs: 250},
		},
		{
			name: "deprecated top-level history_fetch still honored",
			st:   Station{ID: "c", Adapter: "triton", HistoryFetch: 15},
			want: Strategy{HistoryFetch: 15, MaxRetries: 3, RetryBackoffMs: 250},
		},
		{
			name: "station strategy wins over the deprecated field",
			st:   Station{ID: "d", Adapter: "triton", HistoryFetch: 15, Strategy: &Strategy{HistoryFetch: 40}},
			want: Strategy{HistoryFetch: 40, MaxRetries: 3, RetryBackoffMs: 250},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cfg.resolve(tt.st)
			if got.HistoryFetch != tt.want.HistoryFetch || got.MaxRetries != tt.want.MaxRetries || got.RetryBackoffMs != tt.want.RetryBackoffMs {
				t.Fatalf("resolve = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestResolveFallsBackToBuiltin(t *testing.T) {
	cfg := &Config{} // no defaults set
	got := cfg.resolve(Station{ID: "x", Adapter: "triton"})
	if got != builtinStrategy {
		t.Fatalf("resolve = %+v, want builtin %+v", got, builtinStrategy)
	}
}

func TestEnabledDefaultsTrueAndCanDisable(t *testing.T) {
	cfg := &Config{}
	if !cfg.resolve(Station{ID: "on", Adapter: "triton"}).enabled() {
		t.Fatal("station with no enabled flag should be enabled")
	}
	off := cfg.resolve(Station{ID: "off", Adapter: "triton", Strategy: &Strategy{Enabled: boolp(false)}})
	if off.enabled() {
		t.Fatal("station with enabled:false should be skipped")
	}
}

func TestDeprecatedConfigFieldFoldsIntoDefaults(t *testing.T) {
	// triton_history_fetch is folded into defaults only when defaults leaves it unset.
	c := Config{TritonHistoryFetch: 12}
	if c.Defaults.HistoryFetch == 0 && c.TritonHistoryFetch > 0 {
		c.Defaults.HistoryFetch = c.TritonHistoryFetch
	}
	if got := c.resolve(Station{Adapter: "triton"}).HistoryFetch; got != 12 {
		t.Fatalf("history_fetch = %d, want 12 from folded legacy field", got)
	}
}
