# Recording handoff — target 3:10

Status: script, fixtures, screenshots and commands prepared. **No video has been recorded.** Record a playable 3–5 minute video, then inspect the actual exported duration and audio. Aim for 3:10–3:20 so trimming does not fall below three minutes. Available browser tooling captures screenshots, not a narrated recording.

## Before capture

Use a clean browser profile. Close unrelated windows from the recording area. Start `npm start` in the project and open http://127.0.0.1:4317/. Restart once before recording so the visible transactions are newly executed rather than labelled reused. Keep a second terminal ready in the same project. Use large readable text and captions. Do not show secrets, unrelated tabs or personal accounts.

Prepared assets:

- `examples/external/skips-evening-refill-2020-02-04.json`
- `examples/external/honest-rule-2020-02-04.json`
- `examples/evidence/` contains genuine signed accepted/refused bundles for every fixture.
- `screenshot-hero.jpg`, `screenshot-ai-accepted.jpg` and `screenshot-refused.jpg` capture the current UI; they are supporting stills, not a video.
- `architecture.svg` and editable `architecture.mmd` explain the trust boundary.

## Shot list and narration

Restart the server first (Ctrl-C, then `npm start`) so every contract run is fresh. Narration uses the product name Tomorrow’s Reserve.

| Time | Screen | Narration |
|---|---|---|
| 0:00–0:20 | Hero: “20% greener on paper. 7,000 m³ short by midnight.” and the “same day, counted two ways” card | “This pumping plan claims a carbon saving: about twenty per cent on the fourth of February. But does that claim hold water? It leaves tomorrow seven thousand cubic metres short.” |
| 0:20–0:50 | Click “Take the tour”. Step 2: the whole day — red verdict, 5,000 m³ at midnight, the −7,000 gap on the chart | “Tomorrow’s Reserve takes the exact hourly plan, without changing it, and follows the tank to midnight. The rule: a plan can’t claim a carbon saving by leaving tomorrow’s water missing.” |
| 0:50–1:25 | Step 3: the contract runs. Point to “Refused”, the numeric reason and the three chain steps (last one status 0) | “A Solidity contract re-checks every hour and refuses the claim. That refusal is a real reverted transaction on a local chain.” |
| 1:25–1:55 | Step 4: the AI-optimised plan is accepted (4 February example) | “Our trained forecaster moves pumping to cleaner hours and still refills the tank: 13.2 per cent lower on this day, and the contract accepts it. Across all 25 days the model’s gain over a simple baseline is smaller.” |
| 1:55–2:35 | Step 6, then Download evidence file; terminal: `npm run verify` on the download (passes), then edit one number in a copy and verify again (rejected), then the prepared refusal with `--expect rejected` | “Anyone can check this without our app. The verifier replays the exact plan on a fresh chain. Change one number and verification fails. A verified refusal stays a refusal.” |
| 2:35–2:55 | Step 5: “Across 25 days” — 3.9× and the four bars | “Across 25 simulated days, skipping the refill makes the saving look 3.9 times bigger than the honest rule, and no depleted plan qualifies. These are modelled attributed emissions, including the days that fail.” |
| 2:55–3:15 | Results strip “Who it’s for”; footer “What this does not claim” | “It’s built for a utility analyst and an auditor checking a pumping claim before relying on it. The tank is simulated, both roles run on one machine, and this isn’t measured avoided emissions. The next step is a read-only shadow trial with a utility. Lower carbon shouldn’t mean less water tomorrow.” |

Rehearse the tamper step before recording: copy the downloaded file, change one value in `pumpedLitres`, and confirm `npm run verify` rejects it. Check duration after export (aim 3:10–3:30).

## Terminal commands

Run these in the project directory. For the video, use the just-downloaded accepted file for the first command, replacing the path with its actual saved location:

```sh
npm run verify -- /absolute/path/to/downloaded-bundle.json
npm run verify -- examples/evidence/skips-evening-refill-2020-02-04.json --expect rejected
```

Rehearsal without downloading:

```sh
npm run verify -- examples/evidence/honest-rule-2020-02-04.json
npm run verify -- examples/evidence/skips-evening-refill-2020-02-04.json --expect rejected
```

Final owner checks: playback from start to finish, audible voice, readable statuses, correct 3–5 minute duration, no unrelated personal data. Publish only with explicit authorisation, then paste the real video link into the submission draft. The build was frozen on Saturday 24 October; on 25 October only the page layout, styling and result display changed, not the checks.
