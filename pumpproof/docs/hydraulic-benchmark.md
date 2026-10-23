# Hydraulic benchmark

This is an additional engineering experiment. It does **not** hydraulically validate the original German-demand/GB-grid single-tank replay. The two experiments use different demands and physical assumptions.

## Question and comparator

Can a different source-pump window lower attributed pumping CO₂ while meeting every active junction's pressure requirement, delivering all requested water and leaving every tank at least as full as both its own starting state and the original controls' closing state?

The input is the unmodified [Net3 example distributed with WNTR 1.3.2](https://github.com/USEPA/WNTR/blob/1.3.2/examples/networks/Net3.inp): 92 junctions, two reservoirs, three tanks and two pumps. Its input bytes and licence are supplied in `data/hydraulics/`. The baseline retains the original time and level controls. All scenarios share initial states, demand patterns, hydraulic settings and the accounting horizon. The original seven-day input is run for a declared first-day, 24-hour experiment.

Only pump 10's time windows are changed in candidates. Pump 335's tank-level controls and the coordinated bypass pipe 330 remain in place. Moving source availability outside its original window is an experimental permission, not evidence that a real utility has that freedom.

## Solver and physical boundary

The experiment uses **WNTRSimulator 1.3.2**, its pressure-dependent demand formulation and the published EPANET-format network. It does not use the native EPANET engine: the installed native library process terminated on this Mac, so the supported WNTR hydraulic solver was used instead. No operating-system protections were changed.

Settings: 0 m minimum pressure, 20 m required pressure, pressure exponent 0.5, maximum hydraulic step 300 seconds. The 20 m admission requirement is a declared scenario threshold, not a regulatory or utility safety standard. All solver event states are retained for admission. Only hourly summaries appear on the chart. Positive-demand junctions are checked when they request water; zero-demand connection nodes are not treated as customers.

Pump electricity is computed from simulated flow and head gain, water density and gravity, divided by the network's assumed 75% global efficiency. Energy integrates every solver interval using the left state, splitting at hourly grid boundaries; the last endpoint has zero duration. This is numerical integration of a hydraulic model, not measured electrical input. Pump wear, water quality, leakage, transient pressure waves, pump efficiency uncertainty, demand charges and field actuation are not modelled.

The nominal pump curves produce SciPy's warning that parameter covariance cannot be estimated from their supplied points. That specific warning is retained in the results; it is not a hydraulic non-convergence error. Other caught solver warnings, non-convergence, non-finite results and an incomplete horizon fail generation. The model does not provide a pump-curve uncertainty interval.

## Selection and reporting

The published search contains 40 time windows: durations 12, 14, 16 and 18 hours, at every integer start that ends by hour 24. It also includes the native controls and a source-pump-off adversarial case. This is a small exhaustive discrete search, not a global optimum over all possible pump controls.

Candidate hydraulic outcomes use the published nominal demand pattern, which is known to this model. Planning ranks service- and storage-feasible candidates using **previous-day** NESO intensity. It falls back to native controls when no predicted carbon improvement exists. Evaluation uses actual-day estimated grid intensity. Surprise-demand cases multiply the demand by 1.25 and 2.0 after selecting the nominal plan. They do not re-optimise with knowledge of the surprise.

Two policies are reported:

- **Carbon first:** a service/storage-qualified, positive realised carbon difference can qualify even if the illustrative electricity bill increases. The increase is displayed prominently.
- **Bill protected:** selection also requires no increase in the illustrative electricity bill. A more expensive alternative is refused and native controls may be retained.

The illustrative tariff is £0.35/kWh during 17:00–21:00 and £0.18 otherwise. It is a stated sensitivity scenario, not a tariff fetched from a supplier or a commercial saving. These two policies expose the economic trade-off; switching policy is not evidence of a universally better operation.

All source-complete current/prior-day profiles in 1–28 February 2020 are included, with both policies. A zero-carbon signal is a synthetic no-benefit control. The source-pump-off case is retained even if its raw carbon figure is worse. Refusal reasons remain visible, including failure of the comparator itself under extreme demand.

The benchmark is **exploratory**. We inspected initial results while deciding which engineering experiment to build. It is not a held-out validation, a prospective trial or evidence that a control strategy generalises. The original trained-demand model's chronological test remains separately documented. GB grid profiles are transplanted onto this example network; average attributed CO₂ is not causal marginal emissions avoided.

## Reproduce and tamper-check

Normal app use needs no Python: the Hydraulic lab explores saved, hash-checked results. To re-solve the experiment, use a separate Python 3.12 environment:

```sh
python3.12 -m venv .venv-hydraulics
.venv-hydraulics/bin/python -m pip install -r requirements-hydraulics.txt
.venv-hydraulics/bin/python scripts/test_hydraulics.py
.venv-hydraulics/bin/python scripts/hydraulics.py --verify data/hydraulics/results.json
```

Replay re-solves all 46 hydraulic runs and reconstructs every case, including all failed results. It compares field sets, discrete values and numerical results (absolute tolerance 0.000001, relative tolerance 0.00000001). Changed verdicts, omissions, non-finite numbers or changed results outside that tolerance are refused. Native floating-point differences on another platform may require investigation; do not loosen tolerances merely to accept a discrepancy.

`python scripts/hydraulics.py` explicitly regenerates results and their manifest. The local Node server checks the exact manifest file set and hashes the network, licence, source profiles, requirements, replay script and result bytes before serving them. A trusted original project/manifest is still required: hashes do not establish author identity or resist an attacker replacing both code and manifest.

## Relationship to the receipt

The existing Solidity contract recomputes the separate single-tank accounting experiment. The hydraulic lab does not issue a Solidity hydraulic receipt. Its standalone replay provides computational reproducibility; it is not a proof of sensor truth, independent organisational attestation, validated physical safety or production settlement. A next-stage pilot would need an authorised utility model, measured electricity and water, operational approval and independent counterparties before making an actual savings claim.
