> Historical 18 October document. Current positioning, results and recording instructions are in `docs/submission/`; this document is preserved as context and is not the submission script.

# Four-minute demo and pitch

Working title: **Tomorrow’s Reserve — Every litre. Less carbon.**

One sentence: **Tomorrow’s Reserve helps water utilities shift pumping into cleaner hours, then proves that the entire operating day preserved the water reserve and did not leave a debt for tomorrow.**

## 0:00–0:35 — A concrete problem

Show Operation on 4 February 2020, zero shock and a 4,000 m³ minimum reserve.

“Water needs electricity. A reservoir lets a utility choose when some pumping happens. But a green-looking schedule can cheat: switch the pumps off, show lower electricity use, and leave tomorrow to replace the missing water. We built Tomorrow’s Reserve to make the whole day accountable.”

Click **Short-sighted plan**. Point to the low ending reservoir and failed accounting gate. Do not describe the apparent carbon difference as a real saving.

## 0:35–1:20 — The useful AI and control

Click **Tomorrow’s Reserve**.

“The model predicts tomorrow's hourly demand from earlier consumption. The optimiser schedules pumping with a minimum reserve, tank capacity, pump limit and the same final water volume. It keeps headroom for forecast error. During this hourly simulation, measured flow updates the remaining schedule.”

Point to the tank curve, dirty evening grid hours and 12,000 m³ ending level. The default example shows roughly 684 kg less attributed operational CO₂, about 13.2%, under this scenario. These values are calculated, not typed into the UI.

“The water measurements are real. This reservoir and its operations are simulated, and the GB carbon signal is deliberately applied to a German demand profile. This is a transferable workflow demonstration, not a measured utility saving.”

## 1:20–2:10 — Make the receipt earn its place

Click **Verify on local chain**, wait for the receipt, then download the bundle.

“The utility commits a plan. A separate demo auditor attests evidence. Solidity then recomputes all 24 balances and the carbon comparison. It checks the reservoir, restores the starting volume and permits only one receipt for this asset and day in this contract. This is actual local EVM execution.”

Open **Attack lab**. Run **Water debt**, then **Changed evidence**. Show `WaterDebt`, `EvidenceMismatch` and status-0 transactions.

“Changing a chart label is easy. Changing these accounting rules is not. Here is the rejected transaction.”

## 2:10–2:50 — Be the team that shows the failures

Open **Model & evidence**.

“The model's held-out hourly MAE is 221 m³, compared with 306 for the same hour last week. The nominal 90% interval only covered 86.9% on the test period. We show that because a forecast is not a safety guarantee.”

Point to replication results, especially 24 February.

“We developed the controller on one period, then ran it unchanged on another. Thirteen of fourteen later days passed. This day increased attributed carbon and failed its final water balance. It gets no receipt.”

## 2:50–3:35 — Explain why a shared ledger

“The counterparties are a utility, a flexibility buyer and an auditor. They need the same operating window, comparator and rules. Our contract prevents inconsistent or duplicate claims within that shared deployment. It does not prove a sensor is honest. Production needs real metering, independent identities, an asset registry and a dispute process.”

Show the exported JSON. Optionally execute `npm run verify -- path/to/bundle.json` in a prepared terminal and show `valid: true`. This reproduces the local scenario and fresh EVM accounting; it does not certify the old chain's history.

## 3:35–4:00 — A credible next step

“The next step is a shadow pilot beside a utility's existing controls, with co-located water, power and grid data and agreed engineering constraints. No autonomous actuator control, no invented carbon credits. Our promise is simple: lower carbon should never mean less water tomorrow.”

## Likely judge questions

**Why blockchain instead of a database?** A shared contract can prevent one counterparty silently changing agreed accounting or issuing a second receipt in the same deployment. A signed database is a credible alternative if all parties accept one administrator. The prototype tests the rule set; it does not establish that every utility needs a chain.

**Is this really AI?** Yes: a locally trained gradient-boosted regressor predicts demand. The optimisation and verification arithmetic are deliberately deterministic and are not labelled AI.

**Are these avoided emissions?** No. They are scenario-based differences using average grid CO₂ intensity. Causal marginal emissions, actual site energy and credit eligibility require different evidence.

**Does the contract ensure safe drinking-water supply?** No. It verifies a simple hourly model. Pressure, water age, water quality, pump curves and intra-hour dynamics are outside this prototype.

**What stops a dishonest auditor?** Nothing in a local single-operator demo establishes real independence. Production needs calibrated devices, independent organisations and governance. The contract makes the attested arithmetic enforceable and inspectable.

**Does this beat every competing entry?** We cannot know. The public research shows a distinctive operational focus and a complete demonstration, but hidden entries, judging and execution quality determine the outcome.
