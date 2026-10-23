# Competitive implementation audit — 19 October 2026

## Decision

Keep PumpProof's water-service flexibility direction and strengthen its engineering evidence. The three independent research agents favoured this over a new concrete-mix optimiser, refrigerant custody ledger or computing scheduler. This is a feasibility judgement against accessible evidence, not a prediction of the judges or a guarantee against unknown entries. The official gallery is not yet a complete public census.

The buyer hypothesis is a utility operations manager and its flexibility buyer: decide whether moving pumping to cleaner hours preserves water service, and give both parties a reproducible account of the result. Customer demand, procurement willingness and field performance remain unvalidated.

## What was actually inspected

| Entry | Inspection | Strength | Limitation and implication |
|---|---|---|---|
| HourMatch | Public contract, JavaScript ledger, uploads, scenario generation, evaluation and tests at `d74c047e662e4984cddcbb716391a2380fe25cde`; live application inspected | Issuer and company permissions, same-hour retirement, shared balances; public Sepolia deployment manifest | Five browser examples use cached model parses; new sentences use keywords. Uploaded files construct a new local ledger. Real generation curves are scaled against fictional loads deliberately sized above 100% certificate coverage. PumpProof should compete on useful operational decisions and evaluated forecasting. |
| PLUME | Public contract, investigation pipeline, impact calculator, test and deployment source at `bb920d1ebfda04d90646c4b4181a54c1275d981c` | Substantive signed escrow, evidence-bound review rounds, disputes/refunds, clustering and negative tests | Hosted build uses saved snapshots and rejects writes; committed narrative evaluation exercised templates. Repair measurements are synthetic. PumpProof must demonstrate its own complete interactive pathway and avoid presenting simulated operations as observations. |
| CarbonTwin | Local read-only checkout at `ab0bd6204deca51485bb5f843b77136319432c3f`; screening, two-pass adjudication, grounding, Solidity and tests; public browser demo executed | Real Berkeley records; actual in-browser EVM deployment, issuance, linkage, `DoubleIssuance` revert, valid proof accepted and forged proof refused | Grounding checks source phrase membership, not physical asset identity. Shared country/developer/methodology are insufficient to prove duplicate serials. The website correctly labels findings as reconciliation questions. The vintage-wide issuance rule can also block legitimate split-vintage transfers. Do not mischaracterise this as a dashboard-only project. |
| Mizan | Devpost description and live browser example workflow | Clear exporter/verifier/importer roles, source-linked activity figures, conflicting electricity readings flagged, transparent example-document and simulation labels, strong buyer narrative | Advertised `abubokkor-cse/Mizan` repository returned 404. Contract, extraction and test claims remain source-unverified. Browser demo explicitly uses pre-read fictional documents and a simulated chain. Live Hedera transactions were not exercised. |

Competitor test **source** was inspected; their test suites were not independently executed. CarbonTwin's browser-local contract workflow was executed. HourMatch's displayed Sepolia transactions were observed but not independently read from an RPC or explorer. Mizan loaded successfully in the supported browser after web-tool retrieval had failed; an inaccessible retrieval path is not evidence of a broken product.

CarbonTwin's Devpost page also describes later GitLab release-automation work. This audit concerns the linked IEEE GitHub implementation and hosted demo, and does not attribute all later GitLab claims to that inspected snapshot.

## Source evidence

- [Official competition and criteria](https://ieee-climatechain-hack.devpost.com/).
- HourMatch: [contract](https://github.com/StuartYo/hourmatch/blob/d74c047e662e4984cddcbb716391a2380fe25cde/contracts/HourlyCertificateRegistry.sol), [cached parsing](https://github.com/StuartYo/hourmatch/blob/d74c047e662e4984cddcbb716391a2380fe25cde/public/app.js#L123-L134), [constructed scenario](https://github.com/StuartYo/hourmatch/blob/d74c047e662e4984cddcbb716391a2380fe25cde/src/scenario.mjs#L98-L117), [upload ledger](https://github.com/StuartYo/hourmatch/blob/d74c047e662e4984cddcbb716391a2380fe25cde/src/upload.mjs#L87-L175), [evaluation](https://github.com/StuartYo/hourmatch/blob/d74c047e662e4984cddcbb716391a2380fe25cde/eval/RESULTS.md), [live demo](https://hourmatch.vercel.app).
- PLUME: [escrow](https://github.com/KaavinB/PLUME/blob/bb920d1ebfda04d90646c4b4181a54c1275d981c/contracts/src/RepairEscrow.sol), [snapshot build](https://github.com/KaavinB/PLUME/blob/bb920d1ebfda04d90646c4b4181a54c1275d981c/scripts/build_pages.sh), [template evaluation](https://github.com/KaavinB/PLUME/blob/bb920d1ebfda04d90646c4b4181a54c1275d981c/docs/eval/results.json), [synthetic repair evidence](https://github.com/KaavinB/PLUME/blob/bb920d1ebfda04d90646c4b4181a54c1275d981c/backend/app/demo.py#L169-L182).
- CarbonTwin: [contract](https://github.com/HyunsikParker/carbontwin/blob/ab0bd6204deca51485bb5f843b77136319432c3f/contracts/src/CreditClaimRegistry.sol), [grounding](https://github.com/HyunsikParker/carbontwin/blob/ab0bd6204deca51485bb5f843b77136319432c3f/pipeline/verify.py), [regression tests](https://github.com/HyunsikParker/carbontwin/blob/ab0bd6204deca51485bb5f843b77136319432c3f/pipeline/test_report_integrity.py), [live demo](https://hyunsikparker.github.io/carbontwin/).
- Mizan: [submission](https://devpost.com/software/mizan-the-carbon-passport-for-eu-bound-exports), [linked repository](https://github.com/abubokkor-cse/Mizan), [browser demo](https://mizan-cbam.vercel.app).

## Why this direction rather than a pivot

| Alternative | Obtainable evidence | Remaining scientific or product dependency |
|---|---|---|
| Concrete mix optimisation | [UCI concrete strength](https://archive.ics.uci.edu/dataset/165/concrete+compressive+strength), CC BY 4.0, 1,030 observations | New model and physical strength/workability uncertainty; actual material emission factors and producer validation missing. |
| Refrigerant recovery reconciliation | [EPA reclamation statistics](https://www.epa.gov/section608/summary-refrigerant-reclamation-trends) | Aggregate statistics do not supply genuine cylinder custody events; core workflow would be synthetic and AI less necessary. |
| Carbon-aware computing | [Google cluster data](https://github.com/google/cluster-data), CC BY 4.0 | Missing explicit flexibility permissions and causal energy attribution; mature [Carbon Aware SDK](https://carbon-aware-sdk.greensoftware.foundation/docs/overview) already supports shifting. |
| PumpProof engineering extension | [USEPA WNTR](https://github.com/USEPA/WNTR), Revised BSD; published Net3 example network | Hydraulic model is available now. It remains a benchmark, not a calibrated pilot or measured pumping savings. |

## Competitive standard

An entry needs more than a larger feature list. PumpProof's defensible contribution is forecast → constrained decision → explicit service and storage checks → reproducible evidence → narrow accounting receipt. Its original one-tank result does not establish hydraulic safety. The new benchmark must preserve native network controls except explicitly changed schedules, include all demand-bearing junctions and every tank, calculate energy from flow and head, retain adverse outcomes, and select schedules without future realised grid data.

Keep the measured-demand ML experiment separate from the published-network experiment until a defensible demand-to-network calibration exists. A benchmark qualification is not a carbon credit, a safety certification or a field-validated saving. No competitor source code was copied into PumpProof.


## Outcome of the local engineering experiment

The shipped Net3 benchmark qualifies 4/25 historical grid profiles under a carbon-first policy. Each of those cases increases the illustrative bill by £22.79; the bill-protected policy qualifies 0/25. The 5 February example has a 27.1 kg attributed CO₂ difference, 26.5 m minimum active-node pressure and no unmet demand. The 2× demand case fails pressure, delivery and storage checks. All results remain visible.

This weakens any assertion that the original 13.2% single-tank result establishes useful commercial savings. The strongest current positioning is **independently replayable verification of proposed water-flexibility outcomes**, including refusals and economic trade-offs. It is premature to claim the best optimiser or an overall winning entry. HourMatch has stronger public-chain deployment evidence, PLUME has a broader escrow lifecycle, and Mizan has a clearer commercial narrative. PumpProof's opportunity is a more inspectable operational and engineering evidence chain.

The next evidence that could materially change that judgement is an authorised utility model and matched water/electricity data, a prospective frozen evaluation against that utility's actual controls, and confirmation from an operations manager and flexibility buyer that the verified outcome is useful. More decorative features would not supply that evidence. No contact, public deployment or submission was performed in this local task.
