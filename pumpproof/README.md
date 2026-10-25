# Tomorrow’s Reserve

**Tomorrow’s Reserve checks pumping plans against whole-day water and carbon accounting, and refuses a saving claim that leaves tomorrow short of water.**

*Carbon savings without borrowing tomorrow’s water.* Built under the codename PumpProof; the Solidity contract, evidence formats, package and file names keep that name.

For a water-utility energy/operations analyst and an auditor, the question is whether an externally supplied 24-hour trace reduces attributed operational CO₂ while meeting declared hourly tank/pump limits and restoring starting storage. This historical demonstration treats uploads as simulated operating traces; an uploaded plan does not prove a pump actually ran.

![Tomorrow’s Reserve: the same day counted two ways](docs/submission/screenshot-hero.jpg)

**Key finding (25 retrospective simulated days, February 2020):** skipping the evening refill makes the apparent carbon saving look 3.9× bigger (19.36% against 4.92% for the honest rule), and every one of those plans leaves tomorrow 7,000 m³ short. The contract refuses all 25.

## Try it

- **Demo video:** [Watch the 3:07 walkthrough](https://youtu.be/upXa5j0Y3yI), with English subtitles.
- **Public demo:** [tomorrows-reserve.vercel.app](https://tomorrows-reserve.vercel.app/). The whole-day check runs live in your browser (paste or upload your own 24-hour plan); contract results are replayed from real recorded local runs. Built with `npm run build:static` into `site/`.
- **Source:** [andreajanewilliams/tomorrows-reserve](https://github.com/andreajanewilliams/tomorrows-reserve).
- **Locally, with live contract checks:** `npm ci` then `npm start`, and open http://127.0.0.1:4317/.
- **Completed public testnet runs:** the same contract ran on Sepolia with separate operator and auditor keys: [WaterDebt refusal](https://sepolia.etherscan.io/address/0xF839720718187039Afa75ceA1A09a7d57786BC84) and [honest acceptance](https://sepolia.etherscan.io/address/0xFf4489bd9f9d12658151B6b7d7222A99e4d3cA30). Matching transaction links appear in the demo. These are demonstration-controlled keys, not independent organisations. `npm run testnet` can create new experiments using faucet-funded test wallets configured in `.env`; it is not needed to inspect the completed runs.

## One-minute local setup

Node.js 20 or later; verified with Node 20.20.1 and npm 10.8.2 on macOS and a clean Linux container.

```sh
npm ci
npm start
```

Open **http://127.0.0.1:4317/** in your browser. The server binds to loopback. No wallet, account or API key is required. Stop with Ctrl-C. The local EVM and keys are ephemeral; exported bundles remain verifiable against this source snapshot. The Mac launcher is `Launch PumpProof.command`.

## Demonstrate the external trust boundary

1. Pick **Skips the evening refill**. The whole day previews automatically: it ends at 5,000 m³, leaving 7,000 m³ debt.
2. Select **Run the contract check**. Inspect the real status-0 WaterDebt transaction.
3. Choose **Honest plan**. The previous proof/export immediately disappears and the new plan previews automatically. Select **Run the contract check** for its separate labelled experiment; it restores 12,000 m³ and accepts.
4. Download a signed v3 bundle. Independently verify the actual downloaded file, or use these supplied examples:

```sh
npm run verify -- examples/evidence/honest-rule-2020-02-04.json
npm run verify -- examples/evidence/skips-evening-refill-2020-02-04.json --expect rejected
```

The second command reports evidenceValid true, accountingAccepted false and receiptIssued false. Default verification requires acceptance. Both commands use the exact trace and pinned inputs, without running the optimiser. A fresh EVM reproduces the outcome; it does not authenticate original chain history.

Each experiment label/date binds one trace in the running session. Identical requests reuse the result; changed inputs cannot replace its commitment, including after refusal. Different labels use separate contracts. This demonstrates per-contract duplicate protection, not a shared production registry.

## Input and API

JSON accepts only `schema`, `date` and `pumpedLitres`: schema `pumpproof-external-trace-v1`, a source-complete February date, and exactly 24 non-negative safe integers in litres. See `examples/external/`. No unknown fields, inferred units, paths, URLs, policy overrides or altered measured inputs. A well-formed trace outside the accounting limits is retained unchanged for a legitimate negative experiment.

- `POST /api/external/preview`: `{trace, experiment}`; labels are `honest-rule`, `skips-evening-refill`, `uploaded-trace`. Returns inputDigest and exact accounting.
- `POST /api/external/prove`: `{trace, inputDigest, experiment}`; labels are `honest-rule`, `skips-evening-refill`, `uploaded-trace`.
- `GET /api/export/:id`: signed evidence from this session.
- `GET /api/comparison`: the native report, including actual EVM annotations where executed.

The descriptor commits trace, date, experiment, fixed policy, source identities, baseline, units and contract source. Built-in experiment labels require the exact pinned rule output and bind its method/code hash; edited JSON switches to `uploaded-trace`. External evidence declares modelUsed false and uses a documented no-model hash sentinel. Authoritative accounting uses BigInt litres/scores and decimal-string JSON integers. Display kilograms derive from unrounded scores. Solidity separately floors baseline, operated and positive difference grams; a positive score difference can accept with zero saving grams.

## Native results

<!-- NATIVE-RESULTS:START -->
| Policy | Gross reduction, all 25 days | Numerically eligible |
|---|---:|---:|
| model | 9.44042% | 24/25 |
| persistence | 8.67546% | 23/25 |
| honest-rule | 4.92450% | 22/25 |
| skips-evening-refill | 19.36190% apparent | 0/25 |

Native baseline: 124946.871 kg attributed CO₂. Gross figures include refused and negative days. Eligibility is calculated; see the fixture execution report for actual EVM outcomes. Eligible-only and common-eligible denominators and dates are in `data/comparison-evaluation.json`.
<!-- NATIVE-RESULTS:END -->


The forecaster and optimiser remain supporting components. Original model MAE is 221.26 m³ versus 305.87 m³ for weekly persistence over 346 chronological test days. Calibrated model buffer/headroom are 2,676.28 m³ / 420.16 m³ per hour; persistence uses 4,649 / 683. Both margins change; equal operational safety is not established. Full-year daily cumulative error coverage is 71.39% versus 82.08%, and hourly absolute coverage 86.93% versus 89.98%.

The model's 24 February failure is terminal surplus (761.294 m³) plus adverse carbon benefit. Persistence 14 February is water-balanced and fails only carbon benefit. Honest-rule refusals are 14, 22 and 24 February. Every debt rule ends 7,000 m³ short. All failures remain in gross results.

See [native results and limits](docs/submission/native-results-and-limits.md) for eligible/common denominators, forecast coverage and quantified Python/native differences. Grid rounding explains the rule discrepancy; the remaining optimised-policy difference has not been fully isolated. The February comparison is exploratory retrospective evidence, repeatedly inspected during development.

## Reproduce and check

```sh
npm run compile
npm test
npm run compare
npm run fixtures:evm
npm run check:results
npm run verify -- examples/receipt-2020-02-05.json
```

With the server running: `npm run smoke` and `npm run smoke:external`. The latter exports and verifies accepted/refused evidence in separate processes with optimiser imports forbidden. Comparison regeneration clears EVM annotations, so execute fixtures afterwards. Original v2 verification is preserved; v2 rejected attacks are not accepted receipts. Source/model data were not retrained or rewritten.

## Limits and practical use

Measured German demand is paired by hour index with estimated average GB intensity. Tank/pump and constant 0.5 kWh/m³ are hypothetical. Generated policies use idealised within-hour feedback. Hourly model constraints are not hydraulic service, pressure or water-quality guarantees. Equal-volume pumping uses equal energy; reported differences are timing-based attributed CO₂, not electricity savings or causal avoided emissions. There is no utility pilot, customer validation or measured field saving.

The contract trusts attested inputs. Local demo roles are controlled on one machine, commitments are retrospective, and duplicate protection is per deployment. A shared contract can make agreed accounting and outcomes inspectable; a signed database could also support this single-operator demo. Production requires calibrated co-located metering, independent organisational identities, a shared registry, corrections/disputes and hydraulic validation. No device control, payment, tokens or carbon credits are issued.

The existing Hydraulic lab and its sources are preserved as a separate historical experiment. Its network results do not validate the external single-tank receipt. No new hydraulic work was added.

## Submission and recording

[Devpost draft](docs/submission/devpost-draft.md) · [Architecture](docs/submission/architecture.svg) · [Trust note](docs/submission/trust-note.md) · [Verification report](docs/submission/verification.md) · [Recording script and shot list](docs/submission/recording.md) · [Owner checklist](docs/submission/checklist.md).

Selected track: Carbon Markets & Emissions Transparency. The [source repository](https://github.com/andreajanewilliams/tomorrows-reserve) and [recorded static demo](https://tomorrows-reserve.vercel.app/) were published under Andrea’s accounts on 25 October with owner authorisation. Eligibility answers, competition terms and final submission require the entrant’s confirmation. The repository records technical evidence; submission status is confirmed in Devpost.

Two matching 4 February rule experiments also completed on public Sepolia (chain 11155111), using separate operator and auditor keys controlled for this demonstration: [WaterDebt refusal](https://sepolia.etherscan.io/address/0xF839720718187039Afa75ceA1A09a7d57786BC84) and [honest acceptance](https://sepolia.etherscan.io/address/0xFf4489bd9f9d12658151B6b7d7222A99e4d3cA30). These are separate keys on a public test network, not independent organisations. A public chain does not prove a pump ran. The downloadable signed v3 bundles still describe the local EVM; the Sepolia records provide public transaction links.

The original code freeze was Saturday 24 October at 18:00 SAST; subsequent verified fixes and publication are recorded in the release note. The checklist retains the dated deadline checks and remaining owner actions.

## Data attribution

- **Weyrauch et al. (2024), Hourly Water Demand of a Mixed District Recorded by Supplier**, supplied by Siemens AG and hosted on [Zenodo, DOI 10.5281/zenodo.11045013](https://zenodo.org/records/11045013), CC BY 4.0. We use the raw CSV; incomplete days, duplicated hours, missing and non-positive measurements are excluded. Derived feature rows and forecasts are our transformations. The raw file extends through 1 April 2021, although the source description states March.
- **National Energy System Operator (NESO), Carbon Intensity API**, [official documentation](https://carbon-intensity.github.io/api-definitions/), CC BY 4.0. Half-hourly actual estimates are averaged into hourly values and rounded to integer g CO₂/kWh. Source snapshots and transformations are identified in [data/provenance.json](data/provenance.json).

The application uses pinned data rather than fetching new environmental observations during normal use. The source, static demo and unlisted video are available through the links above; Devpost is the source of truth for the entry’s submission status.

## Licence

Code is MIT licensed (see the repository [LICENSE](../LICENSE)). Data keeps its own licence: the measured water demand and NESO carbon-intensity data are CC BY 4.0, and the Net3 network model is covered by `data/hydraulics/LICENCE-WNTR.txt`.
