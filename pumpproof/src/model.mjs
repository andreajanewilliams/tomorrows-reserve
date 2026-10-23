import {inputs} from './inputs.mjs';
export const {model,modelReport}=inputs;
export const demandDays=inputs.sources['demand-days.json'];
export function predict(features) {
  if (!Array.isArray(features) || features.length !== model.features.length || !features.every(Number.isFinite)) throw new Error('Invalid model features');
  let result = model.baseline;
  for (const tree of model.trees) {
    let node = tree[0];
    while (!node[5]) node = tree[features[node[1]] <= node[2] ? node[3] : node[4]];
    result += node[0];
  }
  return Math.max(0, result);
}
