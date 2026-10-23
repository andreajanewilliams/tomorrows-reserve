# PumpProof — does a greener claim leave tomorrow short of water?

Track: **Carbon Markets & Emissions Transparency**. No carbon credits are issued.

## Inspiration

A pumping trace can look greener simply because it stops refilling storage. The next day inherits the missing water and deferred pumping. A water-utility energy/operations analyst and an auditor need a complete-day accounting check before accepting that apparent saving.

## What it does

PumpProof checks externally supplied pumping traces against pinned demand, grid data and a declared hourly tank/pump policy. It previews the exact uploaded litres, commits that trace, attests evidence and settles on a real local Solidity EVM. The supplied depleted-storage example ends 7,000 m³ short and receives an actual WaterDebt refusal. An honest example restores starting storage and accepts. Signed v3 bundles independently reproduce both outcomes; verifying a refusal never turns it into a receipt.

## How we built it

A Node ESM application performs strict input validation and BigInt accounting. Solidity enforces roles, immutable commitments, evidence binding, hourly limits, terminal equality and positive carbon benefit. Separate local operator/auditor keys sign the complete bundle. A direct-trace verifier replays it on a fresh EVM without invoking the optimiser.

Supporting components include an exported gradient-boosted demand forecaster, a linear optimiser and explicit idealised within-hour feedback. The model was trained on 2016–2018 demand and calibrated on July–December 2019. German measured demand is paired by hour index with a GB grid scenario; pumping and storage are simulated.

## Results and climate relevance

Across 25 source-complete February days, the native model policy gives 9.44042% gross attributed CO₂ reduction, persistence 8.67546%, and an illustrative honest clock/tank rule 4.92450%. These gross figures include failed and negative days. The depleted rule appears to reduce 19.36190%, but every trace leaves a 7,000 m³ deficit. All 50 rule fixtures ran through the EVM: 22 honest acceptances, three honest NoCarbonBenefit refusals and 25 WaterDebt refusals.

This is exploratory retrospective evidence, not a blind field trial. The model policy changes both storage buffer and pump headroom; equivalent safety is not established. Model 24 February has terminal surplus and negative carbon benefit. Equal-volume pumping uses equal energy under the fixed intensity assumption: these are timing-based attributed emissions differences, not electricity savings or causal avoided emissions.

## Challenges and lessons

The difficult boundary was binding the uploaded array throughout preview, commitment, settlement and independent verification. Connecting an upload control to the old optimiser-derived commitment would have been incorrect. We also fixed stale proofs after input changes, tested delayed responses, and preserved subgram arithmetic behaviour. Native/Python results differ; grid rounding fully explains the rule discrepancy, while an optimised-policy residual remains documented.

## Accomplishments

The useful result is an inspectable refusal: an attractive carbon number cannot bypass complete-day water accounting. The demonstration includes real failed transactions, exact trace preservation, signed accepted/refused bundles, visible failed days and reproducible native results.

## Practical next step

A read-only shadow evaluation with a utility would need co-located tank, water, pump-power and grid measurements, agreed baselines, hydraulic validation and independent organisational roles. There is no pilot, customer validation or measured field saving today.

A shared contract can make an agreed policy and its outcomes inspectable across counterparties. A signed database could also support this single-operator demo; blockchain does not make input measurements true. Duplicate protection is per deployment, commitment is retrospective, and fresh replay does not authenticate original chain history.

Repository: **PENDING OWNER PUBLICATION**. Video: **PENDING RECORDING AND OWNER PUBLICATION**. Public demo/testnet: **not deployed; optional, separately authorised**.
