package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Polite, identifiable UA so station operators can see who we are.
const userAgent = "airmon/0.2 (open radio airplay monitor; +https://github.com/HudsonGraeme/avif.io)"

// fetchMode declares how an adapter's output should be deduplicated. It lives with
// the adapter (not the station) because it's a property of the upstream feed.
type fetchMode int

const (
	// modeTimestamped: the feed returns a timestamped recent-history window, so we
	// keep everything strictly newer than the per-station cursor. Deeper
	// history_fetch closes the gap when polls slip.
	modeTimestamped fetchMode = iota
	// modeCurrent: the feed returns only the current track with no server time, so
	// we stamp with poll time and collapse unchanged repeats via last_key.
	modeCurrent
)

// adapter is one source type. Register a new broadcaster feed by adding an entry
// to the registry below — no changes to the main loop required.
type adapter struct {
	fetch func(st Station, eff Strategy) ([]Spin, error)
	mode  fetchMode
}

// registry maps a station's "adapter" key to its implementation.
var registry = map[string]adapter{
	"triton":  {fetch: fetchTritonAdapter, mode: modeTimestamped},
	"streamb": {fetch: fetchStreamBAdapter, mode: modeCurrent},
}

func fetchTritonAdapter(st Station, eff Strategy) ([]Spin, error) {
	n := eff.HistoryFetch
	if n <= 0 {
		n = 10
	}
	return fetchTriton(st, n)
}

func fetchStreamBAdapter(st Station, _ Strategy) ([]Spin, error) {
	return fetchStreamB(st)
}

var httpClient = &http.Client{Timeout: 15 * time.Second}

func httpGet(u string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("http %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

// --- Triton Digital (Bell Media / iHeartRadio Canada) ---
// Returns timestamped recent history, so we never miss a spin between polls.

type tritonList struct {
	Infos []tritonInfo `xml:"nowplaying-info"`
}
type tritonInfo struct {
	Timestamp string       `xml:"timestamp,attr"`
	Props     []tritonProp `xml:"property"`
}
type tritonProp struct {
	Name  string `xml:"name,attr"`
	Value string `xml:",chardata"`
}

func fetchTriton(st Station, n int) ([]Spin, error) {
	q := url.Values{}
	q.Set("mountName", st.Mount)
	q.Set("numberToFetch", strconv.Itoa(n))
	q.Set("eventType", "track")
	body, err := httpGet("https://np.tritondigital.com/public/nowplaying?" + q.Encode())
	if err != nil {
		return nil, err
	}
	var list tritonList
	if err := xml.Unmarshal(body, &list); err != nil {
		return nil, err
	}
	var out []Spin
	for _, info := range list.Infos {
		m := make(map[string]string, len(info.Props))
		for _, p := range info.Props {
			m[p.Name] = strings.TrimSpace(p.Value)
		}
		artist, title := m["track_artist_name"], m["cue_title"]
		if artist == "" || title == "" {
			continue
		}
		var at int64
		if v := m["cue_time_start"]; v != "" { // milliseconds
			if ms, err := strconv.ParseInt(v, 10, 64); err == nil {
				at = ms / 1000
			}
		}
		if at == 0 {
			if ts, err := strconv.ParseInt(info.Timestamp, 10, 64); err == nil {
				at = ts
			}
		}
		if at == 0 {
			at = time.Now().Unix()
		}
		out = append(out, Spin{Station: st.ID, Artist: artist, Title: title, At: at, Src: "triton"})
	}
	return out, nil
}

// --- StreamB / leanplayer (Evanov Communications) ---
// Returns only the current track, no server timestamp. We stamp with poll time
// and the caller collapses unchanged repeats.

func fetchStreamB(st Station) ([]Spin, error) {
	body, err := httpGet(st.URL)
	if err != nil {
		return nil, err
	}
	var d struct {
		Artist string `json:"artist"`
		Title  string `json:"title"`
	}
	if err := json.Unmarshal(body, &d); err != nil {
		return nil, err
	}
	a, t := strings.TrimSpace(d.Artist), strings.TrimSpace(d.Title)
	if a == "" || t == "" {
		return nil, nil
	}
	return []Spin{{Station: st.ID, Artist: a, Title: t, At: time.Now().Unix(), Src: "streamb"}}, nil
}
