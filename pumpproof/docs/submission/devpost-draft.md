# Tomorrow’s Reserve — carbon savings without borrowing tomorrow’s water

**20% greener on paper. 7,000 m³ short by midnight.** Tomorrow’s Reserve checks pumping plans against whole-day water and carbon accounting, and refuses a saving claim that leaves tomorrow short of water.

## Track alignment

Track: **Carbon Markets & Emissions Transparency**.

This track names a lack of transparency, double counting and complex verification as the problems. Tomorrow’s Reserve tackles one specific form of a misleading claim: a carbon saving reported today but paid for tomorrow, because the tank was not refilled. A Solidity contract applies the same written rule to every trace, and a signed record lets anyone recheck the result. No carbon credits, tokens or payments are issued.

## The problem

Water utilities can cut the carbon of pumping by moving it into hours when the grid is cleaner. But a plan can also look greener just by not refilling the tank. The next day inherits the missing water and the pumping that was put off. A carbon figure for one day is only fair if the tank ends the day where it started.

## What it does

Tomorrow’s Reserve takes a 24-hour pumping trace (hourly litres, as CSV or JSON) and checks it against pinned demand and grid data and a declared tank and pump policy. It does not repair, optimise or replace the trace.

1. **Preview:** shows the exact uploaded litres, the hourly tank level and the attributed CO₂.
2. **Commit, attest, settle:** the trace is committed, its evidence is attested, and a Solidity contract settles it on a local EVM. The contract checks hourly reserve, capacity and pump limits, that the tank ends where it started, and that there is a real carbon benefit.
3. **Verify:** the result is exported as a signed bundle, plus a one-page claim report an auditor could file. A separate verifier replays the bundle on a fresh EVM without using the optimiser.

In the demo (4 February 2020), a plan that skips the evening refill looks about 20% greener but ends 7,000 m³ short. The contract refuses it with a real failed transaction (WaterDebt). An honest plan that restores storage is accepted. So is a plan from our trained AI forecaster: on the same day it cuts attributed CO₂ by 13.2% and still refills the tank. The AI plans a lower-carbon day; the contract makes sure that saving isn’t borrowed water. (Across all 25 days the model beats a simple weekly baseline by 0.76 percentage points, so this is one good day, not the average.) Verifying the refused bundle confirms the refusal; it never turns it into a receipt.

## Who it is for

A water-utility energy or operations analyst who wants to check a schedule, and an auditor who reviews an operating trace before a carbon claim is accepted.

## How we built it

- Node.js app with strict input checks and exact integer accounting.
- Solidity contract on a local EVM (Ganache, ethers) with separate operator and auditor roles.
- Signed evidence bundles and a command-line verifier (`npm run verify`).
- Supporting parts: a gradient-boosted demand forecaster and a linear-programming scheduler. These suggest plans; they do not decide whether an uploaded trace passes.

Data: measured German water demand, paired by hour with a GB grid carbon-intensity scenario (NESO Carbon Intensity API, CC BY 4.0). The tank, pumps and traces are simulated.

## Prior work

None of the ideas underneath is new. Restoring tank levels at the end of a pumping cycle is established practice, so that one day's schedule can be compared fairly with the next ([Behandish and Wu, 2014](https://arxiv.org/abs/1711.04988)). Carbon-aware pump scheduling has been studied too ([Menke et al., 2017](https://research.tudelft.nl/en/publications/investigating-trade-offs-between-the-operating-cost-and-green-hou/)), and platforms such as [Hedera Guardian](https://github.com/hashgraph/guardian) already run environmental policy workflows on a ledger.

Tomorrow’s Reserve’s contribution is putting these together into one inspectable check: an unchanged external trace, explicit whole-day water and carbon accounting, a real acceptance or refusal, and an evidence bundle that another reviewer can reproduce.

## Results

Across 25 retrospective simulated days in February 2020 (gross attributed CO₂ reduction against the baseline, including failed and negative days):

| Policy | Reduction | Numerically eligible days |
|---|---|---|
| Forecast model | 9.44042% | 24/25 |
| Weekly persistence | 8.67546% | 23/25 |
| Honest clock/tank rule | 4.92450% | 22/25 |
| Skips evening refill | 19.36190% (apparent) | 0/25 |

The model beats persistence by 0.76 percentage points. Because the storage buffer and pump headroom also differ, this does not isolate an AI effect or show equal safety.

The model and persistence rows are numerical evaluations. Separately, all 50 rule traces were run through the contract: 22 honest acceptances, 3 honest refusals for no carbon benefit (14, 22 and 24 February) and 25 water-debt refusals, each 7,000 m³ short. The model's failure on 24 February is kept visible: it ends with surplus storage and a negative carbon difference.

## Security and data integrity

The trust note in the repository lists each threat, the check that handles it and what remains open. In short: tampered files and changed traces are detected; the uploaded trace is kept exactly as supplied; changing the input clears old proofs. Tomorrow’s Reserve cannot prove that a pump actually ran or that a meter is honest.

## Scale and adoption

The input is small and plain: 24 hourly values plus a declared tank and pump policy. A utility that already logs hourly pumping could export a trace without new equipment. Policy values are per site, and a check runs in seconds on a laptop.

A realistic first step is a read-only shadow check alongside a utility's existing records. Wider use would need calibrated metering at the same site, agreed baselines, hydraulic validation, independently run operator and auditor roles, and a shared registry across sites. The current model is one tank and one pumping station, not a full network.

## Limits

- This is a retrospective simulation, not a field trial. There is no pilot, customer or measured saving.
- The figures are timing-based attributed CO₂ at average grid intensity. Equal volumes use equal energy here, so this is not electricity saved or proven avoided emissions. Peak pumping power rises.
- The model's smaller margins give a better simulated carbon result, but equal safety is not established.
- Both roles run on one machine. A signed database could also support this single-operator demo; blockchain does not make inputs true. Duplicate protection is per contract, and commitment is after the fact, not day-ahead.

## Challenges

The hard part was keeping the uploaded trace bound to every step — preview, commitment, settlement and verification — so that a check could never quietly use the optimiser's plan instead. We also made sure that editing the input clears any earlier proof or export.

## Links

Repository: **PENDING OWNER PUBLICATION**. Video: **PENDING RECORDING AND OWNER PUBLICATION**. Public demo/testnet: **not deployed** (local prototype; run with `npm ci` and `npm start`).
