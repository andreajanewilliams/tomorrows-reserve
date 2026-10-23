# Research and entry strategy

Research date: **18 October 2026 (Africa/Johannesburg)**. This is a reasoned entry strategy, not a prediction or guarantee of winning.

## Competition constraints

The [official overview](https://ieee-climatechain-hack.devpost.com/) lists five judging dimensions: climate impact, innovation, technical execution, usefulness and presentation. PumpProof targets **Renewable Energy & Energy Trading**, with environmental-data accountability as a supporting theme. The requested submission includes a working prototype, source repository and 3–5 minute demo.

The displayed deadline is **25 October 2026, 17:00 UTC+3 = 16:00 SAST**. The [submission update](https://ieee-climatechain-hack.devpost.com/updates/46814-climatechain-hackathon-submissions-open-tomorrow-get-ready-to-submit) confirms an October submission period.

**Eligibility needs organiser clarification before entering:** the overview's participation box says students only and excludes companies, while the [detailed rules](https://ieee-climatechain-hack.devpost.com/rules) explicitly include independent developers, startups, academics and environmental professionals. The rules allow individual entries or 2–5 members and mention country restrictions without a complete list in the retrieved text. We have not assumed Chad's eligibility, contacted organisers or registered him. Local development is independent of that unresolved submission question.

## Observed public competition

The [official gallery](https://ieee-climatechain-hack.devpost.com/project-gallery) was unpublished. Search-indexed individual pages were still accessible. The following are **entrant-authored descriptions**, not independently audited software, rankings or a complete census. The first twelve pages identify IEEE ClimateChain in their submission section; ZKanopy is a GitHub self-identification.

| Public project | Described focus | Consequence for our positioning |
|---|---|---|
| [CarbonTwin](https://devpost.com/software/carbontwin) | Cross-registry carbon matching and duplicate checks | Avoid another generic carbon-registry guard. |
| [PLUME](https://devpost.com/software/plume-earth-s-first-climate-bug-bounty-network) | Satellite methane investigation and repair bounty workflow | Methane repair escrow is already directly represented. |
| [HourMatch](https://devpost.com/software/hourmatch) | Hourly renewable-energy claim matching | Differentiate active load scheduling from certificate allocation. |
| [CarbonShield](https://devpost.com/software/carbonshield) | REDD+ stress tests | Generic carbon red-teaming is crowded. |
| [CanopyProof](https://devpost.com/software/canopyproof-lwsvz4) | Forest permanence and retirement gates | Avoid a similar forest reversal gate. |
| [Kanopy](https://devpost.com/software/kanopy) | Verifiable forest measurements | Satellite forest metrics alone are insufficiently distinct. |
| [CarbonLens](https://devpost.com/software/carbonlens-vo3hut) | Forest segmentation and credit accounting | Prefer actual measured inputs and visible uncertainty. |
| [Mizan](https://devpost.com/software/mizan-the-carbon-passport-for-eu-bound-exports) | CBAM evidence for exports | A generic Turkish carbon passport would overlap. |
| [Uncounted](https://devpost.com/software/uncounted-verifiable-ledger-for-wildfire-war-emissions) | Wildfire/conflict emissions attribution | Avoid another broad emissions map. |
| [Grounded](https://devpost.com/software/grounded-test-tomorrow-before-it-arrives) | Infrastructure climate resilience | Keep the operational water/energy problem narrow. |
| [Cloud, Climate, Chain](https://devpost.com/software/cloud-climate-chain) | SME accounting and offsets | Avoid another all-in-one carbon dashboard. |
| [AquaQuest](https://devpost.com/software/aquaquest) | Citizen water observations | Water is represented, but utility pumping is a different workflow. |
| [ZKanopy](https://github.com/MrPrinceAli/zkanopy) | Private deforestation compliance attestations | Do not claim novelty merely from ZK climate proofs. |

No competitor code or design was copied. Research concerns public descriptions and gaps, not private submissions.

## Brainstorm and selection

Three read-only research agents challenged the idea space. The final decision was made by the primary implementer after checking data access and implementation feasibility. Scores below are **our qualitative assessment**, not official judging weights or empirical win probabilities.

| Candidate | Main strength | Main weakness | Decision |
|---|---|---|---|
| PumpProof | Real demand forecasting, intuitive water balance, executable rejection demo | Physical control and geography must remain clearly simulated | Selected |
| MixProof: scarce supplementary-material allocation | Real concrete laboratory dataset and finite-inventory coordination | Existing low-carbon mix systems; material factors and strength do not establish construction suitability | Strong alternative |
| Refrigerant recovery mass balance | High climate relevance and a clear double-allocation problem | Public operational custody data is scarce; OCR would carry most of the AI contribution | Future candidate with a reclaimer partner |
| Rebound-aware generic demand response | Useful complete-window accounting | Less memorable user story; authentic matched meter/grid data takes longer | Incorporated as PumpProof's terminal-water invariant |
| Methane repair bounty | Strong climate action story | Direct overlap with PLUME | Rejected |
| Carbon duplicate / forest guard | Easy blockchain connection | Several directly overlapping entrants | Rejected |

**Core differentiation:** carbon-aware scheduling is not new; a receipt that preserves a specific essential service throughout the full accounting window is the contribution demonstrated here. The pitch is “a water utility, flexibility buyer and auditor agree what the whole day must prove.”

Existing [Energy Web Green Proofs](https://energyweb.org/green-proofs/) and its [flexibility infrastructure](https://docs.energyweb.org/legacy-documentation/foundational-concepts/scaling-access-to-grid-flexibility) show that blockchain energy traceability is established. [Water-energy demand-side management research](https://arxiv.org/abs/1805.07626) predates this project. We do not claim first invention, global uniqueness or superiority over production systems. Our distinction is a bounded, inspectable workflow with real model evaluation, terminal-volume accounting and a demonstrable refusal to issue bad receipts.

## Why this problem matters

The [IEA's energy-and-water overview](https://www.iea.org/topics/energy-and-water) describes how pumping, treatment and delivery depend on energy. Its [2026 flexibility analysis](https://www.iea.org/reports/electricity-2026/flexibility) identifies unused demand-side opportunities and the role of incentives and aggregators. PumpProof asks whether water storage can make some pumping flexible while preserving a measurable service constraint. This is a plausible climate opportunity, not evidence that this prototype has reduced any real emissions.

The chosen [supplier-demand dataset](https://zenodo.org/records/11045013) directly supports studying pump scheduling. [NESO's API](https://carbon-intensity.github.io/api-definitions/) supplies a reproducible grid scenario. The deliberately separate geographies are disclosed in the product and evidence bundle. Pumping power and hydraulic behaviour remain assumptions.

## Judge-by-judge evidence

| Judging dimension | Concrete demonstration | Claim boundary |
|---|---|---|
| Climate impact | Same water volume, different pumping times, explicit operational CO₂ calculation | Attributed simulation difference; no marginal emissions or credits |
| Innovation | Terminal water debt exposes a false positive that a peak-only claim would hide | Novel composition and demonstration, not first demand response |
| Technical execution | Trained model, LP, causal feedback replay, real Solidity, standalone evidence verification | Local EVM and simulated signers |
| Practical usefulness | Utility ↔ flexibility buyer ↔ auditor; one asset/day receipt | Requires pilot partners and physical validation |
| Presentation | “This plan borrows tomorrow's water” followed by an actual revert | Keep limitations visible; avoid an overbroad platform pitch |

## Adoption path and next evidence

The first customer hypothesis is a water utility or pump-control integrator working with an electricity aggregator. Begin as a read-only shadow evaluator beside existing controls. Obtain local demand, pump power, tank level, constraints and electricity data; agree the comparator with an independent reviewer. Then evaluate historical and prospective performance across seasons, including failures and operational costs. Do not connect to actuators without engineering approval and hydraulic validation.

A business hypothesis is per-site software licensing plus audit/export integration. Neither willingness to pay nor commercial demand has been validated. The ledger is useful only if the participating organisations value a common rule set over a single administrator; a signed shared database remains a credible alternative. Explain this trade-off directly if challenged.

Before submission: resolve eligibility, record the actual demo, obtain permission to publish this local source, publish a repository only when instructed, and submit before the confirmed deadline. No contact, publication, push or submission has occurred.
