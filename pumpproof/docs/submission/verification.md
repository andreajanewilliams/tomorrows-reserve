# Local verification report

Working directory: `/Users/chadsmith/Documents/ChatGPT/IEEE Hackathon/pumpproof`.
Baseline: local Git commit `84f5c3c`, preserving the current non-Git source from `/Users/chadsmith/Documents/Codex/2026-10-17/se/outputs/pumpproof`. Existing hydraulic additions were preserved. No older snapshot files were overlaid. The older review archive and attached consolidated plan are preserved outside the publishable project in `../handoff-preserved/`.

The requested newer handoff archive could not be located. Its `PRIORITY-ADDENDUM.txt` and named `CODEX-IMPLEMENTATION-PROMPT.txt` were unavailable. The attached consolidated implementation plan was read, along with the older `START-HERE.txt`, review instructions, source/tests and reports. The later E4 scripts were recovered from the local fable-experiments archive and preserved unchanged. Historical research-only instructions did not override the user's explicit implementation request.

## Tier 0

Node v20.20.1 / npm 10.8.2. Reproduced clean Linux EBADPLATFORM on nested Ganache fsevents 2.3.2. Regenerating the lockfile retained the upstream bundled metadata defect; its Darwin-only optional flag was corrected with no dependency version changes and no force flag.

macOS and Linux: `npm ci --no-audit --no-fund`, `npm run compile`, `npm test` (34 tests passed at this gate), `npm run verify -- examples/receipt-2020-02-05.json` passed. `npm run smoke`, `node --check public/app.js`, and `zsh -n 'Launch PumpProof.command'` passed. Linux used official `node:20.20.1-bookworm-slim`, digest `sha256:17281e8d1dc4d671976c6b89a12f47a44c2f390b63a989e2e327631041f544fd`, fresh temporary files/dependencies. Its optional bigint native binding used the tested JS fallback.

UI handlers now invalidate proofs/exports immediately on relevant input changes and reject late responses using revision and input identity. Focused behavioural tests exercise actual application handlers. Tier 0 passed before Tier 1 began; see `verification/tier0-start.txt`.

## Tier 1

`node scripts/evaluate-comparisons.mjs`, `node scripts/present-results.mjs`, external/comparison/UI tests and external/legacy HTTP smoke passed. Exact settlement calldata matches the uploaded array; actual changed-after-attestation evidence refuses. The default honest acceptance and WaterDebt refusal use separate labelled contracts. All 50 fixtures and native margins/results were generated. External exports were disabled at this gate. See `verification/tier1-gate.txt`, `tier1-tests.txt` and `tier1-experiments.json`.

## Tier 2 evidence

`node scripts/execute-fixtures.mjs` executed all 50 actual EVM fixtures: 22 accepted, 28 refused (25 WaterDebt, three NoCarbonBenefit). `data/external-evm-results.json` records real transactions and bundle paths. The comparison report distinguishes numerical eligibility from executed outcomes.

Separate-process checks:

```sh
node --experimental-loader ./tests/no-optimiser-loader.mjs scripts/verify-bundle.mjs examples/evidence/honest-rule-2020-02-04.json
node --experimental-loader ./tests/no-optimiser-loader.mjs scripts/verify-bundle.mjs examples/evidence/skips-evening-refill-2020-02-04.json --expect rejected
```

Both passed with optimiser imports forbidden. The latter reports evidence valid, accounting not accepted, no receipt, WaterDebt and actual fresh status 0. Default accepted verification rejects a refused bundle. The loader's experimental warning is a Node test-harness warning; ordinary verification does not require it.

Tests cover strict schema/date/unit/integer inputs, no repair, exact calldata, commitments, tampered signatures and metadata, source/model integrity, altered policy/date/provenance/carbon/limitations, role separation, duplicate/missing commitments, reserve/pump/overflow/terminal bounds, one-litre debt/surplus, positive subgram acceptance and independently floored gram differences. HTTP smoke includes export and separate-process verification for both outcomes.

Current logs: `verification/final-macos-tests.txt`, `tier2-evidence-tests.txt`, `tier2-boundaries.txt`, `accepted-verification.json`, `refused-verification.json`, `fixture-execution.txt`, `tier2-http-experiments.json`. Final Linux and independent-review status are recorded in the release note after completion.

## Browser and release gaps

Browser discovery positively identified My Hero as `myherostudio.com`; no employer or Andrea session was used. Actual browser preview, refusal, honest acceptance, selection invalidation, download and result-table inspection were exercised. Screenshots are in this folder. Final browser checks and downloaded-file verification are recorded in the release note.

The existing hydraulic Python solver was not rerun: unchanged, outside the authorised new implementation scope. Its existing integrity tests pass. No new model training, public testnet, remote CI, public hosting, video recording or publication was performed. Recorded video, public repository, licence decision, eligibility resolution and actual submission remain owner actions. Optional Tier 3 was not started.

Native numerical differences and scientific limitations are detailed in `native-results-and-limits.md`. Original source/model hashes are in `data/provenance.json` and `data/model-report.json`; signed v3 bundles include contract and relevant executable source hashes. Fresh replay proves reproducibility under these declarations, not physical truth or historical consensus.
