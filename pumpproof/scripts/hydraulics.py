"""Reproducible Net3 hydraulic experiment; never a field or carbon-credit claim.

Generate: python scripts/hydraulics.py
Replay:   python scripts/hydraulics.py --verify data/hydraulics/results.json
Uses WNTR's pressure-dependent solver, NOT the EPANET native engine.
"""
from __future__ import annotations

import argparse
from datetime import date, timedelta
import hashlib
import json
import math
import os
from pathlib import Path
import tempfile
import warnings

os.environ.setdefault('MPLCONFIGDIR', str(Path(tempfile.gettempdir()) / 'pumpproof-mpl'))
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
import numpy as np
from scipy.optimize import OptimizeWarning
import wntr
from wntr.network.controls import Control, ControlAction, SimTimeCondition

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/hydraulics'
NETWORK_HASH = 'ea3e825c4fef0b5cba47fb06301bc85253f18b6364dc96c44d9fb492c40faa52'
HORIZON = 86400
PRESSURE = 20.0  # Scenario threshold, metres head, not a jurisdictional standard.
TOLERANCE_M3 = 0.001
TARIFF = [0.35 if 17 <= h < 21 else 0.18 for h in range(24)]
SCHEDULES = [{'id': 'native', 'start': None, 'duration': None}]
SCHEDULES += [{'id': f'window-{s}-{d}', 'start': s, 'duration': d}
              for d in (12, 14, 16, 18) for s in range(25-d)]
SCHEDULES += [{'id': 'source-off', 'start': 0, 'duration': 0}]


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_sources():
    if wntr.__version__ != '1.3.2':
        raise ValueError('Expected WNTR 1.3.2; install requirements-hydraulics.txt')
    if sha(OUT / 'Net3.inp') != NETWORK_HASH:
        raise ValueError('Network input hash mismatch')
    manifest = json.loads((ROOT / 'data/provenance.json').read_text())
    carbon = {}
    sources = {}
    for name in ['carbon-2020-01.json', 'carbon-2020-02.json', 'carbon-2020-02-validation.json']:
        entries = [s for s in manifest['sources'] if s['file'] == name]
        if len(entries) != 1 or sha(ROOT / 'data' / name) != entries[0]['sha256']:
            raise ValueError(f'Carbon input hash mismatch: {name}')
        sources['data/'+name] = entries[0]['sha256']
        for r in json.loads((ROOT / 'data' / name).read_text())['data']:
            value = r['intensity']['actual']
            if value is not None:
                if r['from'] in carbon and carbon[r['from']] != value:
                    raise ValueError('Conflicting carbon observations')
                carbon[r['from']] = value
    return carbon, sources


def carbon_day(rows, day):
    result = []
    for h in range(24):
        vals = [rows.get(f'{day}T{h:02}:{m}Z') for m in ('00', '30')]
        if any(v is None or not math.isfinite(v) or v < 0 for v in vals):
            return None
        # Match the original JavaScript experiment's positive-number rounding.
        result.append(math.floor(sum(vals)/2 + 0.5))
    return result


def integrate_hourly(times, watts):
    """Left-rectangle integration at every solver event; split on hourly boundaries.

    The final endpoint has no duration. Values are W, seconds and output kWh.
    """
    if times[0] != 0 or times[-1] != HORIZON or len(times) != len(watts):
        raise ValueError('Incomplete hydraulic horizon')
    result = np.zeros(24)
    for i in range(len(times)-1):
        a, end = float(times[i]), float(times[i+1])
        if end <= a or not math.isfinite(watts[i]) or watts[i] < -1e-6:
            raise ValueError('Invalid hydraulic energy trace')
        while a < end:
            h = int(a // 3600)
            b = min(end, (h+1)*3600)
            result[h] += max(0, watts[i])*(b-a)/3_600_000
            a = b
    return result.tolist()


def run_network(schedule, multiplier=1.0):
    w = wntr.network.WaterNetworkModel(str(OUT / 'Net3.inp'))
    w.options.time.duration = HORIZON
    w.options.time.hydraulic_timestep = 300
    w.options.time.report_timestep = 'ALL'
    w.options.hydraulic.demand_model = 'PDA'
    w.options.hydraulic.minimum_pressure = 0
    w.options.hydraulic.required_pressure = PRESSURE
    w.options.hydraulic.pressure_exponent = 0.5
    w.options.hydraulic.demand_multiplier = multiplier
    if schedule['start'] is not None:
        # Only replace pump 10's time controls. Preserve pump 335 and bypass 330.
        for name, control in list(w.controls()):
            if any(a.target()[0].name == '10' for a in control.actions()):
                w.remove_control(name)
        p = w.get_link('10')
        start, duration = schedule['start'], schedule['duration']
        p.initial_status = wntr.network.LinkStatus.Closed
        if duration:
            # Explicit t=0 action is important in WNTR; initial status alone differs.
            w.add_control('window_on', Control(SimTimeCondition(w, '=', start*3600),
                          ControlAction(p, 'status', wntr.network.LinkStatus.Open)))
            w.add_control('window_off', Control(SimTimeCondition(w, '=', (start+duration)*3600),
                          ControlAction(p, 'status', wntr.network.LinkStatus.Closed)))
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        r = wntr.sim.WNTRSimulator(w).run_sim(convergence_error=True)
    # Three-point nominal pump curves have no residual degrees of freedom for a
    # covariance estimate. Retain that known fit warning; reject all others.
    unexpected = [x for x in caught if not (issubclass(x.category, OptimizeWarning)
                  and str(x.message) == 'Covariance of the parameters could not be estimated')]
    if unexpected:
        raise ValueError('Hydraulic solver warning: ' + '; '.join(str(x.message) for x in unexpected))
    if r.error_code is not None:
        raise ValueError(f'Hydraulic solver failure: {r.error_code}')
    times = r.node['head'].index.to_numpy()
    expected = wntr.metrics.expected_demand(w, timestep=300)
    # Demand patterns change at hourly boundaries. Evaluate at exact solver times.
    expected = expected.reindex(times, method='ffill')
    nodes = [n for n in w.junction_name_list if expected[n].max() > 0]
    demand = r.node['demand'][nodes]
    pressure = r.node['pressure'][nodes]
    exp = expected[nodes]
    if not np.isfinite(np.concatenate([demand.values.ravel(), pressure.values.ravel(), exp.values.ravel()])).all():
        raise ValueError('Non-finite hydraulic result')
    dt = np.diff(times)
    deficits = np.maximum(0, exp.iloc[:-1].to_numpy()-demand.iloc[:-1].to_numpy())
    per_node = (deficits * dt[:, None]).sum(axis=0)
    active_pressure = pressure.where(exp > 1e-8)
    pump_power = wntr.metrics.pump_power(r.link['flowrate'], r.node['head'], w)
    energy = integrate_hourly(times, pump_power.sum(axis=1).to_numpy())
    tank_volumes = {name: [float(tank.get_volume(float(h)-tank.elevation))
                          for h in r.node['head'][name]] for name, tank in w.tanks()}
    trace = []
    for h in range(25):
        idx = int(np.searchsorted(times, h*3600, side='right')-1)
        trace.append({'hour': h, 'minPressureM': float(active_pressure.iloc[idx].min()),
                      'tankM3': {n: v[idx] for n, v in tank_volumes.items()}})
    switches = sum(int((r.link['status'][name].iloc[:-1].diff().fillna(0) != 0).sum()) for name in w.pump_name_list)
    return {
        'schedule': schedule, 'multiplier': multiplier, 'solverSteps': len(times),
        'curveWarnings': sorted(set(str(x.message) for x in caught)),
        'minPressureM': float(active_pressure.min().min()),
        'pressureByNodeM': {n: float(active_pressure[n].min()) for n in nodes},
        'unmetM3': float(per_node.sum()), 'unmetByNodeM3': dict(zip(nodes, per_node.tolist())),
        'requestedM3': float((exp.iloc[:-1].to_numpy()*dt[:, None]).sum()),
        'energyKWh': float(sum(energy)), 'hourlyKWh': energy,
        'peakKW': float(pump_power.sum(axis=1).iloc[:-1].max()/1000), 'switches': switches,
        'initialTankM3': {n: v[0] for n, v in tank_volumes.items()},
        'finalTankM3': {n: v[-1] for n, v in tank_volumes.items()},
        'trace': trace,
    }


def hydraulic_failures(run, baseline):
    failures = []
    for label, item in [('CANDIDATE', run), ('BASELINE', baseline)]:
        if item['minPressureM'] < PRESSURE - 1e-6:
            failures.append(label+'_PRESSURE')
        if item['unmetM3'] > TOLERANCE_M3:
            failures.append(label+'_UNMET_DEMAND')
    for n, end in run['finalTankM3'].items():
        # Every tank must meet BOTH its start and native comparator end state.
        target = max(run['initialTankM3'][n], baseline['finalTankM3'][n])
        if end < target - TOLERANCE_M3:
            failures.append('TANK_'+n+'_DEFICIT')
    return failures


def score(run, carbon):
    return sum(e*c/1000 for e, c in zip(run['hourlyKWh'], carbon))


def cost(run):
    return sum(e*p for e, p in zip(run['hourlyKWh'], TARIFF))


def assess(run, baseline, signal, bill_protected=False):
    failures = hydraulic_failures(run, baseline)
    saving = score(baseline, signal)-score(run, signal)
    bill = cost(baseline)-cost(run)
    if saving <= 0.001:
        failures.append('NO_CARBON_BENEFIT')
    if bill_protected and bill < -0.001:
        failures.append('SCENARIO_COST_INCREASE')
    return {'eligible': not failures, 'failures': failures, 'savingKg': saving,
            'billProtected': bill_protected, 'billIncreases': bill < -0.001,
            'baselineKg': score(baseline, signal), 'operationKg': score(run, signal),
            'costSavingGBP': bill, 'baselineCostGBP': cost(baseline), 'operationCostGBP': cost(run)}


def build():
    carbon, source_hashes = load_sources()
    runs = {}
    for s in SCHEDULES:
        print('Hydraulic replay:', s['id'], flush=True)
        runs[s['id']] = run_network(s)
    baseline = runs['native']
    service_candidates = [r for r in runs.values() if not hydraulic_failures(r, baseline)]
    cases = []
    selections = {}
    # Fixed observation window; include every complete current + prior-day profile.
    for n in range(28):
        d = date(2020, 2, 1)+timedelta(days=n)
        actual, planned = carbon_day(carbon, d), carbon_day(carbon, d-timedelta(days=1))
        if actual is None or planned is None:
            continue
        ranked = sorted(service_candidates, key=lambda r: (score(r, planned), r['schedule']['id']))
        best = ranked[0] if ranked and score(ranked[0], planned) < score(baseline, planned)-0.001 else baseline
        rid = best['schedule']['id']
        selections[str(d)] = rid
        cases.append({'id': str(d), 'date': str(d), 'kind': 'historical-grid',
                      'run': rid, 'baseline': 'native', 'actualCarbon': actual,
                      'planningCarbon': planned, **assess(best, baseline, actual)})
        affordable = [r for r in ranked if cost(r) <= cost(baseline)+0.001]
        budget = affordable[0] if affordable and score(affordable[0], planned) < score(baseline, planned)-0.001 else baseline
        cases.append({'id': str(d)+'-budget', 'date': str(d), 'kind': 'historical-grid',
                      'run': budget['schedule']['id'], 'baseline': 'native', 'actualCarbon': actual,
                      'planningCarbon': planned, **assess(budget, baseline, actual, bill_protected=True)})
    # Declared stress cases, not tuned demand profiles: known-model plan, surprise load.
    demo_date = '2020-02-05'
    signal = carbon_day(carbon, demo_date)
    chosen = runs[selections[demo_date]]['schedule']
    for mult in [1.25, 2.0]:
        bid, rid = f'native-stress-{mult}', f'selected-stress-{mult}'
        runs[bid] = run_network(SCHEDULES[0], mult)
        runs[rid] = run_network(chosen, mult)
        cases.append({'id': f'stress-{mult}', 'date': demo_date, 'kind': 'demand-stress',
                      'run': rid, 'baseline': bid, 'actualCarbon': signal,
                      'planningCarbon': carbon_day(carbon, '2020-02-04'),
                      **assess(runs[rid], runs[bid], signal)})
    cases.append({'id': 'source-off', 'date': demo_date, 'kind': 'adversarial', 'run': 'source-off',
                  'baseline': 'native', 'actualCarbon': signal,
                  **assess(runs['source-off'], baseline, signal)})
    # A zero-carbon signal is an explicit no-benefit control, not a historical day.
    cases.append({'id': 'zero-carbon', 'date': demo_date, 'kind': 'synthetic-control',
                  'run': selections[demo_date], 'baseline': 'native', 'actualCarbon': [0]*24,
                  **assess(runs[selections[demo_date]], baseline, [0]*24)})
    w = wntr.network.WaterNetworkModel(str(OUT/'Net3.inp'))
    return {'schemaVersion': 1, 'engine': 'WNTRSimulator 1.3.2 / pressure-dependent demand',
            'networkSha256': NETWORK_HASH, 'sourceHashes': source_hashes,
            'policy': {'pressureM': PRESSURE, 'storageToleranceM3': TOLERANCE_M3,
                       'durationHours': 24, 'maximumStepSeconds': 300, 'efficiencyPercent': 75,
                       'tariffGBPPerKWh': TARIFF, 'billProtectedMaxIncreaseGBP': 0.001},
            'method': 'Enumerate 40 operating windows plus native controls and source-off; select with previous-day carbon, nominal published demands and service/storage gates. Report carbon-first and bill-protected policies separately. Actual carbon and surprise demand are evaluation inputs only.',
            'boundary': 'Published Net3 benchmark plus transplanted GB grid profiles and an illustrative tariff. Not a calibrated utility, measured pumping saving, safety certificate, causal avoided emissions or on-chain hydraulic proof. Separate from the measured-demand ML experiment.',
            'topology': {'nodes': [{'id': n, 'type': v.node_type, 'xy': list(v.coordinates)} for n, v in w.nodes()],
                         'links': [{'id': n, 'type': v.link_type, 'from': v.start_node_name, 'to': v.end_node_name} for n, v in w.links()]},
            'runs': runs, 'cases': cases}


def compare(expected, actual, location='$'):
    if isinstance(expected, dict) and isinstance(actual, dict):
        if expected.keys() != actual.keys():
            raise ValueError('Replay fields differ at '+location)
        for k in expected:
            compare(expected[k], actual[k], location+'.'+k)
    elif isinstance(expected, list) and isinstance(actual, list):
        if len(expected) != len(actual):
            raise ValueError('Replay length differs at '+location)
        for i, (a, b) in enumerate(zip(expected, actual)):
            compare(a, b, f'{location}[{i}]')
    elif type(expected) in (float, int) and type(actual) in (float, int):
        if not math.isfinite(actual) or not math.isclose(expected, actual, rel_tol=1e-8, abs_tol=1e-6):
            raise ValueError('Replay number differs at '+location)
    elif expected != actual or type(expected) != type(actual):
        raise ValueError('Replay value differs at '+location)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--verify', type=Path)
    args = parser.parse_args()
    result = build()
    if args.verify:
        compare(result, json.loads(args.verify.read_text()))
        print('VERIFIED: every schedule, hydraulic metric, case and admission result reproduced.')
        return
    OUT.mkdir(exist_ok=True)
    (OUT/'results.json').write_text(json.dumps(result, separators=(',', ':'), allow_nan=False)+'\n')
    files = ['data/hydraulics/Net3.inp', 'data/hydraulics/LICENCE-WNTR.txt',
             'data/hydraulics/results.json', 'scripts/hydraulics.py', 'requirements-hydraulics.txt',
             *result['sourceHashes']]
    manifest = {'schemaVersion': 1, 'files': {f: sha(ROOT/f) for f in files},
                'networkSource': 'https://github.com/USEPA/WNTR/blob/1.3.2/examples/networks/Net3.inp'}
    (OUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    historical = [c for c in result['cases'] if c['kind'] == 'historical-grid' and not c['billProtected']]
    print(f"Generated {len(result['runs'])} hydraulic runs; {sum(c['eligible'] for c in historical)}/{len(historical)} historical profiles qualify.")


if __name__ == '__main__':
    main()
