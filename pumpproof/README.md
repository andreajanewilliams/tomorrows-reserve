# PumpProof

**Every litre. Less carbon.** A local ClimateChain prototype for water-first demand flexibility.

PumpProof forecasts water demand, schedules pumping into cleaner grid periods and makes a complete operating day earn its accounting receipt. A schedule cannot claim a benefit by draining the reservoir and leaving tomorrow to catch up.

## Run locally

Requires Node.js 20 or later. From this directory:

```sh
npm ci
npm start
```

Open **http://127.0.0.1:4317** in your preferred personal browser. Dependencies are already installed in this delivered copy, so `npm start` is sufficient here. The server binds only to loopback. No API keys, wallets, accounts or internet connection are needed after installation. `Ctrl-C` stops it. The local chain is intentionally ephemeral: restart clears receipts; downloaded evidence bundles remain verifiable.

On this Mac, you can also double-click `Launch PumpProof.command`. It starts the server and prints the address; it does not choose a browser profile.

## What works

- Real local inference with 140 gradient-boosted trees trained on public supplier-measured water demand.
- Chronological model evaluation, empirical uncertainty, comparison with weekly persistence and explicit undercoverage.
- Linear optimisation with reservoir, pump and terminal-volume constraints; idealised within-hour feedback replans with current measured demand and forecasts of later hours.
- Interactive historical days, reserve settings and demand shocks; comparison with an intentionally short-sighted plan.
- Executable Solidity on a local EVM: separate demo operator/auditor roles, plan commitment, evidence attestation, recomputed hourly balances and emissions, and one receipt per asset/day within a contract.
- Real reverted transactions for water debt, reserve breach, evidence tampering and duplicate settlement.
- Exported v2 evidence bundles with pinned source provenance, model hash, assumptions and transaction traces. Both demo addresses sign the entire bundle. A standalone verifier reproduces the scenario and executes the accounting on a fresh EVM.
- A separate **Hydraulic lab**: published Net3 network, pressure-dependent WNTR simulation, 40 alternative source-pump windows versus native controls, per-tank restoration, surprise demand and carbon/cost trade-offs. Downloadable results can be re-solved independently. This benchmark does not use the German demand forecaster or issue the single-tank Solidity receipt.

## Start with this demo

1. Select **4 February 2020**, 0% demand shock, 4,000 m³ reserve.
2. Switch to **Short-sighted plan**. Its apparently attractive carbon difference leaves a water debt.
3. Switch to **PumpProof**. The simulated operation restores 12,000 m³ and shows approximately **684 kg / 13.2% lower attributed operational CO₂** than demand-following pumping, under the stated scenario.
4. Click **Verify on local chain**, then download the evidence bundle.
5. Open **Attack lab** and try all four experiments. Inspect the reverted transaction traces.
6. Open **Model & evidence**, or select **24 February 2020**, to see a failed replication day. Its receipt is withheld.

The full presentation is in [docs/demo-script.md](docs/demo-script.md). Research, competitor distinctions and submission considerations are in [docs/research-and-positioning.md](docs/research-and-positioning.md).

The new [implementation audit](docs/implementation-audit.md) inspects actual competitor source and public workflows. Open **Hydraulic lab** to inspect the stronger engineering comparator; its [method and reproduction instructions](docs/hydraulic-benchmark.md) state the exact physical, economic and evidence boundaries. Carbon-first and bill-protected policies may recommend different actions. A positive carbon difference can cost more money.

## Evidence and results

The frozen water forecaster is trained on 2016–2018, reports Jan–Jun 2019 validation, calibrates on Jul–Dec 2019 and is evaluated on 346 complete days in 2020. Test MAE is **221.26 m³**, against **305.87 m³** for the same hour last week (27.7% lower). The empirical interval has **86.93% test coverage**, below its 90% calibration target. No observed future weather is used.

The controller was developed on the 11 source-complete days from 1–14 February, then evaluated unchanged on 14 later days. **13/14 replication days pass all accounting gates.** The 24 February replay has an adverse carbon difference and terminal mismatch. It remains visible and is rejected. These are development and replication simulations, not a field trial. Full machine-readable results: [data/evaluation.json](data/evaluation.json).

## Checks and reproduction

```sh
npm run compile
npm test
npm run evaluate
npm run verify -- /absolute/path/to/downloaded-evidence.json
```

With the server running, `npm run smoke` checks the HTTP routes, receipt reuse, changed-input rejection and evidence export. A verified example is included in `examples/receipt-2020-02-05.json`.

Startup and verification hash the actual model and every listed source before consuming those exact bytes. A changed file with stale provenance stops execution. The verifier checks the evidence digest, full reproduced simulation and both complete-envelope signatures, then runs the Solidity contract on a new local EVM. Signatures establish integrity under the declared demo addresses; they do **not** establish real-world identities, the old chain's consensus or a physical meter. Transaction traces are signed claims, not independently authenticated historical receipts. Rejected attack bundles intentionally fail accepted-receipt verification. The verifier accepts the v2 format; earlier unsigned v1 development exports must be regenerated.

Python is needed only to retrain. With Python 3.12:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/train.py
npm run provenance
npm run evaluate
npm test
```

`scripts/train.py` exports plain numerical trees and reference predictions; JavaScript inference is checked against those Python predictions. Retraining and regenerating provenance changes the pinned evidence version if any inputs change. Keep old evidence with its original source/model snapshot.

## Model and accounting boundary

This is **not an autonomous water-network controller**. German local-clock demand is mapped by hour index to a GB UTC grid scenario. The reservoir and pump are hypothetical. Demand is measured; pumping, feedback and storage are simulated. The model assumes one perfectly mixed tank, constant 0.5 kWh/m³, no hydraulic head changes, no pump switching costs, no travel time and ideal within-hour metering/actuation. The optimiser uses previous-day grid intensity persistence, not future actual values or an unverifiable archived forecast vintage.

The baseline pumps the same demand as it occurs; it is feasible only when demand is within pump capacity. Both operations must have identical starting and ending water volumes. NESO intensity is an **average generation-related CO₂ estimate**, not marginal emissions or a carbon-credit methodology. Reported differences are attributed operational CO₂ scenarios, not proven emissions avoided.

The contract checks integer litres and fixed 24-hour UTC slots. It trusts the auditor's input attestation. The local server controls both demonstration signers. A ledger cannot establish sensor truth, real water safety, truthful source inventory or uniqueness across unrelated deployments. A production pilot requires calibrated metering, hydraulic validation, independent organisational identities, a shared asset registry, corrections/disputes and agreed settlement governance. The frozen prototype has no money, escrow, tokens, credit issuance or device-control integration.

## Data attribution

- **Weyrauch et al. (2024), Hourly Water Demand of a Mixed District Recorded by Supplier**, supplied by Siemens AG and hosted on [Zenodo, DOI 10.5281/zenodo.11045013](https://zenodo.org/records/11045013), CC BY 4.0. We use the raw CSV; incomplete days, duplicated hours, missing and non-positive measurements are excluded. Derived feature rows and forecasts are our transformations. The raw file extends through 1 April 2021, although the source description states March.
- **National Energy System Operator (NESO), Carbon Intensity API**, [official documentation](https://carbon-intensity.github.io/api-definitions/), CC BY 4.0. Half-hourly actual estimates are averaged into hourly values and rounded to integer g CO₂/kWh. Source snapshots and transformations are identified in [data/provenance.json](data/provenance.json).

No external data is fetched during normal application use. No project was published, pushed, entered or submitted.
