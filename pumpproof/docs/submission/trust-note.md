# Trust and security assessment

Tomorrow’s Reserve checks a declared accounting claim. It does not establish that uploaded pumping occurred or that a meter is truthful. The trusted inputs are the pinned demand/grid snapshot, fixed policy and the local auditor's attestation. Both demo role keys are generated locally on one machine; no secrets are exported.

| Threat | Implemented check and demonstrated evidence | Remaining boundary |
|---|---|---|
| Altered files or exported claims | Source/model hashes; signed v3 envelope; exact descriptor/evidence binding; tampering tests | A party can choose different trust roots or declare new keys; signatures do not establish identity |
| Trace silently repaired or replaced | Strict litre schema, direct accounting, decoded transaction calldata compared to upload | Upload itself may be fabricated |
| Duplicate day or replacement input | Immutable contract window, duplicate settlement rejection, HTTP experiment/date digest checks | Separate labelled contracts do not share a global registry |
| Role misuse | Distinct-role constructor; operator/auditor access tests; full-envelope role signatures | One machine controls both roles; no independent organisations deployed |
| Stale UI and delayed responses | Immediate preview/proof/export clearing and revision/input-key checks; DOM-handler regressions | Browser checks cover the supplied demo, not every browser/version |
| Unsupported or hostile input | Strict fields/date/unit/safe-integer checks, bounded JSON body, static allowlist, loopback Host/Origin/CSP checks | Local demonstration service is not a hardened public hosting design |
| Incomplete water accounting | Actual reserve, pump, capacity, baseline and terminal checks, including one-litre boundaries | Hourly tank accounting is not hydraulic service, quality or pressure validation |
| Carbon rounding | BigInt scores and Solidity gram arithmetic; positive subgram acceptance and separate-floor test | Average intensity is an attribution scenario, not marginal emissions |
| Misleading transaction history | Actual local receipts recorded; independent verifier replays accepted/refused outcomes | Signed old transaction details are claims, not independently authenticated original consensus |
| Late commitment or collusion | Commit precedes attestation and settlement in the demonstration | Historical replay commitment is retrospective; dishonest attesters can collude |

Production requires co-located calibrated measurements, independently governed identities, a shared asset registry, corrections/disputes and operational validation. A signed database is a credible alternative for the current single-operator demonstration. The local server must not simply be bound publicly: keys, state, abuse controls and host policy require a separate design. No deployment is authorised or performed.

Built-in experiment names are checked against the exact pinned clock/tank rule during preview, issuance and verification. The committed descriptor includes the experiment and rule-method hash. Manual JSON edits switch to `uploaded-trace`; they cannot claim a built-in policy identity. The trace values themselves remain unchanged.
