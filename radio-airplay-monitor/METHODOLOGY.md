# Over-rotation analysis — methodology

The dataset is neutral. The rotation panel in the web app (and the numbers in
`data/.../meta.json`, computed by `web/scripts/build-data.mjs`) is an **analyst's
interpretation** layered on top, with its assumptions exposed so anyone can rerun
it against the open data and disagree.

## The question

*Is a focus artist rotated more heavily than matched-era peers on a given set of
stations, and does that change over time?*

## Metrics

Configured under `analysis:` in `data/stations.json` (focus artist + control
peers). For each station, over the observed window:

- **spins(artist)** — logged plays.
- **share(artist)** = spins(artist) ÷ station total.
- **rotation index** = spins(focus) ÷ median(spins(control_i)).
  - ≈ 1 → played about as often as a typical peer.
  - \> 1 → more than peers; < 1 → less.

The median baseline stops one unusually heavy/light peer from skewing the
reference.

## What it can and cannot show

**Can:** whether, in the collected window, the focus artist's spin volume/share
deviates from peer norms per station, and how that moves over time.

**Cannot, on its own:**

- **Prove intent or coordination.** A high index is consistent with ordinary
  causes — format fit, label promotion, a music director's taste, listener
  requests, or the artist simply being culturally topical. Deviation ≠ payola.
- **Establish causation** from correlation with any external event/timeline.
  Overlaying dates is a prompt to investigate, not evidence of a link.
- **Capture untagged plays.** Metrics use station-reported metadata; a spin a
  station mislabels or omits is invisible. Audio fingerprinting would close this
  gap and is the recommended upgrade for evidentiary claims.

## Reading it responsibly

- **Short windows are noise.** Under ~a week means nothing; the app says so
  explicitly. Look for patterns that persist over *weeks* and **replicate across
  independent stations and owners** (Bell *and* Evanov), not a blip on one station.
- Always quote the **raw counts and the control set** next to the index.
- Treat any result as a **question to investigate**, not a conclusion to publish.
