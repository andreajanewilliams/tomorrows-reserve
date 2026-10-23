"""Rebuild the transparent forecaster and chronological evaluation from raw measurements."""
from pathlib import Path
import os
os.environ.setdefault('OMP_NUM_THREADS','2')
os.environ.setdefault('LOKY_MAX_CPU_COUNT','2')
import csv, json, math, hashlib, datetime as dt
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error

ROOT = Path(__file__).resolve().parents[1]
raw = ROOT / 'data/water-raw.csv'
days = {}
invalid = set()
raw_rows=0
for row in csv.DictReader(raw.open()):
    raw_rows+=1
    date = dt.datetime.strptime(row['Date'], '%m/%d/%Y').date()
    hour = int(row['Time'].strip().split(':')[0])
    try:
        value = float(row['Consumption'])
    except ValueError:
        value = float('nan')
    bucket = days.setdefault(date, {})
    if hour in bucket or not math.isfinite(value) or value <= 0:
        invalid.add(date)
    bucket[hour] = value
valid = {d: [v[h] for h in range(24)] for d, v in days.items()
         if d not in invalid and set(v) == set(range(24))}

def features(date, hour):
    prior = [valid[date-dt.timedelta(days=k)] for k in (1, 2, 7, 14)]
    weekday = date.weekday()
    yearpos = date.timetuple().tm_yday / 365.25
    return [hour, weekday, int(weekday >= 5), math.sin(2*math.pi*yearpos), math.cos(2*math.pi*yearpos),
            *[p[hour] for p in prior], np.mean(prior[0]), np.mean(prior[2]),
            *[math.sin(2*math.pi*hour*k/24) for k in (1, 2)],
            *[math.cos(2*math.pi*hour*k/24) for k in (1, 2)]]

eligible = sorted(d for d in valid if all(d-dt.timedelta(days=k) in valid for k in (1, 2, 7, 14)))
records = [(d, h, features(d, h), valid[d][h]) for d in eligible for h in range(24)]
splits = {
 'train': lambda d: d < dt.date(2019,1,1),
 'validation': lambda d: dt.date(2019,1,1) <= d < dt.date(2019,7,1),
 'calibration': lambda d: dt.date(2019,7,1) <= d < dt.date(2020,1,1),
 'test': lambda d: dt.date(2020,1,1) <= d < dt.date(2021,1,1)
}
data = {name: [r for r in records if pred(r[0])] for name, pred in splits.items()}
X = lambda name: np.array([r[2] for r in data[name]])
y = lambda name: np.array([r[3] for r in data[name]])
model = HistGradientBoostingRegressor(max_iter=140, max_leaf_nodes=15, max_depth=6,
                                    learning_rate=.08, l2_regularization=10,
                                    early_stopping=False, random_state=42)
model.fit(X('train'), y('train'))
metrics = {}
predictions = {}
for name in splits:
    pred = np.maximum(0, model.predict(X(name)))
    predictions[name] = pred
    truth = y(name)
    metrics[name] = {'hours': len(truth), 'days': len(truth)//24,
       'maeM3': float(mean_absolute_error(truth,pred)),
       'weeklyBaselineMaeM3': float(mean_absolute_error(truth, X(name)[:,7])),
       'wapePercent': float(np.abs(truth-pred).sum()/truth.sum()*100)}
cal = np.abs(y('calibration')-predictions['calibration'])
q = float(np.quantile(cal, min(1, math.ceil((len(cal)+1)*.9)/len(cal)),method='higher'))
metrics['test']['intervalCoveragePercent'] = float(np.mean(np.abs(y('test')-predictions['test'])<=q)*100)
daily_errors = (y('calibration')-predictions['calibration']).reshape(-1,24)
buffer = float(np.quantile(np.maximum(0,np.cumsum(daily_errors,axis=1).max(axis=1)),.9,method='higher'))

# Export numerical tree nodes; runtime inference uses only documented numeric splits.
trees=[]
for iteration in model._predictors:
    nodes=iteration[0].nodes
    trees.append([[float(n['value']),int(n['feature_idx']),float(n['num_threshold']),
                   int(n['left']),int(n['right']),bool(n['is_leaf'])] for n in nodes])
artifact = {'format':'pumpproof-numeric-hgb-v1','baseline':float(model._baseline_prediction[0,0]),
            'trees':trees,'intervalRadiusM3':q,'calibratedBufferM3':buffer,
            'features':['hour','weekday','weekend','annualSin','annualCos','lag24','lag48','lag168','lag336',
                        'yesterdayMean','lastWeekMean','hourSin1','hourSin2','hourCos1','hourCos2'],
            'trainingCutoff':'2018-12-31','calibrationCutoff':'2019-12-31','seed':42}
model_bytes=json.dumps(artifact,separators=(',',':')).encode()
(ROOT/'data/model.json').write_bytes(model_bytes)
report={'model':'Histogram gradient boosting · 140 trees', 'metrics':metrics,
        'intervalRadiusM3':q,'calibratedBufferM3':buffer,
        'rawRows':raw_rows,'validDays':len(valid),'excludedDays':len(days)-len(valid),
        'modelSha256':hashlib.sha256(model_bytes).hexdigest(),'rawSha256':hashlib.sha256(raw.read_bytes()).hexdigest(),
        'limitations':['One German district; no cross-utility validation.','Hourly empirical interval, not a 24-hour safety guarantee.',
                      'No imputation: incomplete, duplicate-hour, non-positive and missing-value days are excluded.',
                      'Calendar and past consumption only; no future weather or test-set fitting.'],
        'splitDates':{'train':'2016–2018','validation':'Jan–Jun 2019 (reported; no tuning)','calibration':'Jul–Dec 2019','test':'2020'}}
(ROOT/'data/model-report.json').write_text(json.dumps(report,indent=2))
scenarios=[]
for d in eligible:
    if dt.date(2020,2,1)<=d<dt.date(2020,3,1):
        feats=[features(d,h) for h in range(24)]
        scenarios.append({'date':str(d),'demandM3':valid[d],'features':[[float(v) for v in f] for f in feats],
                          'referencePrediction':model.predict(np.array(feats)).tolist()})
(ROOT/'data/demand-days.json').write_text(json.dumps(scenarios,separators=(',',':')))
print(json.dumps(report,indent=2))
