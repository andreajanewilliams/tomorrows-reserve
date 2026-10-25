# Recording handoff — target 3:10

Status: script, fixtures, screenshots and commands prepared. **No video has been recorded.** Record a playable 3–5 minute video, then inspect the actual exported duration and audio. Aim for 3:10–3:20 so trimming does not fall below three minutes. Available browser tooling captures screenshots, not a narrated recording.

## Before capture

Use a clean browser profile. Close unrelated windows from the recording area. Start `npm start` in the project and open http://127.0.0.1:4317/. Restart once before recording so the visible transactions are newly executed rather than labelled reused. Keep a second terminal ready in the same project. Use large readable text and captions. Do not show secrets, unrelated tabs or personal accounts.

Prepared assets:

- `examples/external/skips-evening-refill-2020-02-04.json`
- `examples/external/honest-rule-2020-02-04.json`
- `examples/evidence/` contains genuine signed accepted/refused bundles for every fixture.
- `screenshot-hero.jpg`, `screenshot-whole-day.jpg` and `screenshot-refused.jpg` capture the current UI; they are supporting stills, not a video.
- `architecture.svg` and editable `architecture.mmd` explain the trust boundary.

## Shot list and narration

| Time | Actual screen action | Narration |
|---|---|---|
| 0:00–0:25 | Open on the hero card (“The same day, counted two ways”), then click Check a plan; it opens on “Skips the evening refill” with the whole day shown. Point to the red verdict (“Doesn’t hold water: Looks 20.3% greener, but leaves tomorrow 7,000 m³ short”), the three figures and the red −7,000 gap on the tank chart | “This pumping plan claims a carbon saving: about twenty per cent on the fourth of February. But does that claim hold water? It starts with twelve thousand cubic metres in the tank and finishes with five thousand. That leaves seven thousand cubic metres to refill tomorrow. Tomorrow’s Reserve checks the unchanged trace and refuses the claim. It is built for a water-utility analyst and an auditor reviewing an operating trace.” |
| 0:25–1:05 | Optionally open Plan data to show the JSON. Click Run the contract check. Point to Refused, the “Refused: WaterDebt” code and the three steps (the last one red, status 0); open Technical details to show the contract scope | “The input is an external JSON trace with twenty-four hourly pumping values in litres. Tomorrow’s Reserve does not repair or replace them. The hourly limits pass, but starting storage is not restored. Now the exact trace is committed, its evidence is attested, and Solidity refuses settlement. This is an actual reverted transaction on a local EVM.” |
| 1:05–1:40 | Click Honest plan; the old decision disappears and the whole day updates (water owed 0 m³, three green checks). Run the contract check (“Accepted · receipt issued”) | “Changing the input clears the previous proof and export. This honest rule restores starting storage. It runs in a separately labelled comparison contract, so the earlier refusal cannot obscure the result. The contract recomputes hourly reserves, capacity, pump limits and complete-window carbon accounting. This trace accepts. Separate experiment contracts do not imply global duplicate protection.” |
| 1:40–2:20 | Click Download evidence file; terminal verifies the downloaded file, then the prepared refusal | “The signed bundle binds the trace, sources, policy, accounting, outcome and limitations. A separate process reproduces the exact trace and executes it on a fresh EVM without calling the optimiser. Verification of the refused bundle succeeds as evidence, while accounting accepted and receipt issued remain false. This does not authenticate a physical meter or the old chain's history.” |
| 2:20–2:50 | Results tab: native table and visible failed dates | “The supporting forecaster and optimiser are useful, but they do not own the verifier. Here are all twenty-five days and four policies. Gross figures include failures. All fifty rule fixtures actually ran: twenty-two honest acceptances, three carbon-benefit refusals and twenty-five water-debt refusals. The model's failed February twenty-fourth has surplus storage and a negative carbon difference. Smaller forecast margins are not proof of equal safety.” |
| 2:50–3:15 | Architecture/trust boundary; finish on external trace result | “Measured German demand is paired with a British grid scenario. The tank, pumping and constant energy intensity are hypothetical, with idealised hourly feedback. These are attributed carbon differences, not electricity savings or measured avoided emissions. Both local roles are controlled on one machine; source attestation remains trusted. A shared contract can make agreed rules inspectable, while a signed database is also a credible option. The next step is a read-only utility shadow evaluation with co-located metering and independent governance. A greener claim should not leave tomorrow short of water.” |

Read naturally; use the time blocks for actual interactions and short pauses. Check duration after export rather than inferring it from this script. Do not claim the default day doubles the model saving, physical safety, live sensor truth, public deployment or independent organisations.

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
