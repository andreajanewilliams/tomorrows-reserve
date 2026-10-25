# Submission and freeze checklist

Official Devpost pages rechecked on 25 October 2026 at 09:57 SAST: <https://ieee-climatechain-hack.devpost.com/details/dates>. Devpost now shows the deadline as **26 October, 00:00 (UTC+3)**, which is **Sunday 25 October, 23:00 SAST**. On 23 October it showed 16:00 SAST, and no update announced the change. Treat **16:00 SAST** as the working deadline and 23:00 SAST only as a margin. The readiness target stays **14:00 SAST**.

- [x] Local prototype and native evidence prepared.
- [x] Carbon Markets & Emissions Transparency track explained in draft.
- [x] Source, attribution, limitations and local setup prepared.
- [x] Local Devpost draft, architecture, trust note and recording script prepared.
- [ ] Owner confirms eligibility: overview says students only; detailed rules include independent developers and individual submissions. No organiser has been contacted.
- [ ] Owner chooses/approves project-wide licence before publication; existing data attribution and contract SPDX are retained, but do not decide the whole project's licence.
- [ ] Required public source repository link: PENDING. No remote push authorised.
- [ ] Required playable 3–5 minute video: PENDING recording and duration/playback inspection. A script is not a video.
- [ ] Required video link: PENDING owner publication.
- [ ] Owner checks final entry text and submits before 16:00 SAST Sunday (working deadline; Devpost currently shows 23:00 SAST).

## Timed gates and release control

Tier 1 checkpoint: Saturday 24 October, 10:00 SAST. Tier 2 checkpoint: 16:00 SAST. Selected-build freeze: **18:00 SAST Saturday**. After freeze, only demonstrated defects blocking promised behaviour may be fixed, with affected checks rerun. The reviewed local build is frozen early under tag `pumpproof-recording-candidate-2026-10-23`; see `release-note.md` for exact checks and owner gaps. Preserve it through the Saturday deadline; do not restart idea search or optional Tier 3.

No automation or unattended overnight execution is assumed. At the freeze, record `git rev-parse HEAD`, retain the evidence snapshot, and use `docs/submission/recording.md`. Sunday: inspect actual video, published repository/video links and final entry text by 14:00 SAST.

If an essential external-path gate regresses before freeze, hide the Check a trace route and use the original supported Model replay with v2 evidence. Update every claim and the recording script to the reduced build; do not present Tier 1 as independent verification. The original fallback command is `npm run verify -- examples/receipt-2020-02-05.json`.

## External actions requiring separate authorisation

Publishing the source repository, uploading the video and submitting the entry remain owner actions. Public hosting/testnet deployment is optional Tier 3, unstarted and not required for the local engineering scope. Do not create accounts, contact anyone, spend money or deploy as part of this handoff.
