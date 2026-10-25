# Local release candidate — 23 October 2026

The authorised local implementation has passed Tiers 0, 1 and 2 in order. The selected build retains the external trace route. Fallback was not required; optional Tier 3 was not started.

Reviewed snapshot: `c01bb1a` (executable implementation `725a65bf7e93394fbe7adc9892cf3600c6690833`), branch `codex/external-trace-verification`, original baseline `62ce499`. The local recording-candidate tag identifies the final implementation plus this handoff and final Linux log. No remote push, publication, deployment, contact, account creation, spending or submission occurred.

## Checks actually completed

- Tier 0: reproduced and fixed clean Linux `EBADPLATFORM`; preserved dependency versions; macOS/Linux clean installs, compilation and original 34-test gate passed. Relevant input changes immediately invalidate old results/exports and late asynchronous responses.
- Tier 1: strict external JSON, exact unmodified trace preview, actual commit/attest/settle, separately labelled honest acceptance and actual WaterDebt refusal, 50 generated fixtures and native four-policy report. Commitment, tampering, no-repair and invalidation checks passed before Tier 2 began.
- Tier 2: all 50 fixtures executed on actual local EVM contracts and produced signed v3 bundles. Final macOS `npm test`: **48 passed, zero failed**. Fresh official Node 20.20.1 Linux container: `npm ci --no-audit --no-fund`, `npm run compile`, `node --test --test-concurrency=2 tests/*.test.mjs` (**48 passed**), `npm run check:results`, original v2 verification and accepted/refused v3 verification all passed. Optional bigint native bindings used their tested pure-JS fallback.
- `npm run smoke:external` and `npm run smoke` passed against the loopback server: validation, named-policy mismatch rejection, genuine labelled execution, arbitrary unchanged uploaded trace, per-experiment idempotence/changed-input rejection, export, origin checks and separate-process evidence verification.
- Accepted and refused v3 verification passed with optimiser imports explicitly forbidden by `tests/no-optimiser-loader.mjs`. The final browser-downloaded refusal independently reproduced `evidenceValid: true`, `accountingAccepted: false`, `receiptIssued: false`, `WaterDebt`, fresh transaction status 0.
- All 50 final stored bundle signatures, version identities, exact preview claims, report commitments and all 22 accepted EVM gram totals reconcile. Separate flooring and positive subgram score tests prevent numerical misreporting.
- Browser: actual honest/debt preview and settlement, editing clears proof/export and changes label to Uploaded trace, export/download, and native comparison table inspected. Current stills are `screenshot-hero.jpg`, `screenshot-ai-accepted.jpg` and `screenshot-refused.jpg`.
- Required clean-context, read-only gpt-5.6-sol high review completed. The initial named-policy integrity finding was fixed and regressed; a follow-up README request-shape finding was corrected. The final targeted review at `c01bb1a` is clean, with no unresolved actionable in-scope findings. One initial review and two bounded fix/review rounds were used.

Final logs: `verification/review-fix-macos-tests.txt`, `verification/final-linux-tests.txt`, `verification/review-fix-fixtures.txt`, `verification/tier2-http-experiments.json`, `verification/browser-download-verification.json`, `verification/accepted-verification.json` and `verification/refused-verification.json`. Earlier gate logs are retained as historical evidence, not current signed exports.

## Native outcomes

All-day cohort baseline: **124,946.871 kg attributed operational CO₂**, 25 source-complete dates, 4–28 February 2020. Gross reductions include failed days:

| Policy | Gross reduction | Numerically eligible | Actual external EVM outcome |
|---|---:|---:|---|
| Model | 9.44042% | 24/25 | Numerical comparison; separate original-route regressions retained |
| Persistence | 8.67546% | 23/25 | Numerical comparison |
| Honest rule | 4.92450% | 22/25 | 22 accepted; three NoCarbonBenefit refusals |
| Skips evening refill | 19.36190% apparent | 0/25 | 25 WaterDebt refusals |

The honest failures are 14, 22 and 24 February. Every debt fixture closes 7,000 m³ below initial storage. Model 24 February has surplus storage, not debt. Smaller model margins do not establish equivalent safety. The unresolved cross-solver numerical difference and annual feature threshold sensitivity are disclosed in `native-results-and-limits.md`; native outputs were not replaced with Python reference values.

## Demo and verification

From this project directory:

```sh
npm ci --no-audit --no-fund
npm start
```

Open http://127.0.0.1:4317/ in a browser. Restart before recording to show new transactions instead of reused results. The signed examples remain independently usable after a restart:

```sh
npm run verify -- examples/evidence/honest-rule-2020-02-04.json
npm run verify -- examples/evidence/skips-evening-refill-2020-02-04.json --expect rejected
```

To regenerate native results and all actual EVM evidence, in order:

```sh
npm run compare
npm run fixtures:evm
npm run check:results
```

Do not regenerate the selected recording build without a demonstrated blocking defect. Regeneration changes signed evidence and requires renewed verification. The original fallback remains `npm run verify -- examples/receipt-2020-02-05.json`; if selected, hide the external route and revise claims consistently.

## Handoff and owner actions

Ready: `devpost-draft.md`, `recording.md`, `architecture.svg`, `architecture.mmd`, `trust-note.md`, `native-results-and-limits.md`, `verification.md`, `checklist.md`, all 50 external inputs and signed outputs. No video was recorded; screenshots and a timed script are preparation, not a playable submission video.

Preserve this selected candidate for the **Saturday 24 October, 18:00 SAST freeze**. No future unattended run or scheduled action is assumed. Record and inspect a 3–5 minute video; confirm eligibility and choose the project licence; review the public repository/video publication and final entry before separately authorising those external actions. Target readiness is **Sunday 25 October, 14:00 SAST**. Working deadline **16:00 SAST**; Devpost showed this on 23 October but showed **23:00 SAST** (26 October 00:00 UTC+3) when rechecked on 25 October. These owner actions mean the entry is not yet submission-complete.

The new requested archive could not be located, so `PRIORITY-ADDENDUM.txt` and `CODEX-IMPLEMENTATION-PROMPT.txt` could not be read. Work followed the user's consolidated tier instructions, the attached implementation plan, the available older START-HERE and preserved current source. The existing non-Git source was copied without overlaying the old snapshot; the original remains unchanged.

Remaining scientific limits: historical simulated traces, cross-country demand/grid pairing, hypothetical tank/pump, constant energy intensity, idealised feedback, trusted source attestation and locally controlled roles. Independent replay establishes reproducibility under declared inputs, not physical truth, historical chain consensus, field safety or causal avoided emissions. The unchanged hydraulic Python solver was not rerun; its integrity tests passed. No remote CI or public testnet was used.

## Post-freeze presentation changes (25 October)

After the frozen candidate, the contract, accounting, signing and verifier code stayed unchanged, but more than presentation changed: UI redesign and simplification, display rename to Tomorrow’s Reserve, AI-optimised plan card (the model’s native 4 February trace submitted as an uploaded plan), CSV input converted to the exact JSON trace before checking, a human-readable claim report, a static public demo build with recorded runs, a Sepolia-only testnet script (not yet run), MIT licence and CI workflow. Also changed: strict CSV parsing, static-demo input checks that mirror the server, a build that refuses reused or failed runs, Sepolia-only and explorer allow-list guards in the testnet script, a collapsed Explore menu, and a guided tour whose narration follows the actual result. Accounting, contract, signing and verification code are unchanged; the 48 tests, results check, both verifiers and both HTTP smoke checks were rerun after these changes.
