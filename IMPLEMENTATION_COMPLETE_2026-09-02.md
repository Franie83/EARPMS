# EARPMS — Comprehensive v6/v7/v8 + Hotfix Implementation

Date: 2026-09-02
Base: nnn3EARPMS-v7-answer-scripts-root-cause-fixed-2026-08-31

## Implemented / verified

### Persistence and integrity
- Durable Windows development SQLite path is configured by `run-earpms.ps1` under `%LOCALAPPDATA%\\EARPMS\\earpms_dev.db`.
- First launch migrates the newest previous EARPMS release-folder `backend\\earpms_dev.db` when durable storage does not exist.
- Startup seeding is Quick Access only; business records are not recreated on restart.
- Server `/state` uses a revision fingerprint and rejects stale writes.
- Explicit DELETE operations are tombstoned through audit events so stale browser snapshots cannot resurrect deleted records.
- `/state` now also refuses changes to finalized examinations/results and locked marking schemes.
- Server-side JSON restore is available at `/api/database/restore-json` and performs an authoritative replacement restore for Super-Admin.
- Destructive reset remains server-side and preserves the authenticated Super-Admin and system branding.

### Examination workflow
- Super-Admin can edit every non-finalized examination; finalized examinations remain immutable.
- Examination date is included in the create/edit form.
- Refresh Exams reloads server state.
- Document import uses the authenticated `/api/gemini/parse-exam-document` endpoint.
- Text/base64 document parsing supports deterministic local fallback when Gemini is unavailable.
- Bulk exam enrollment is explicit; paper generation no longer silently enrolls an entire class.
- Enrollment creates an `enrolled` candidate-paper placeholder; generation converts only enrolled candidates to `generated` papers.
- Variable papers use deterministic candidate-specific question subsets.
- Distributed/collected/scanned/CBT-used papers are not rewritten by regeneration or mode changes.
- Finalized examination deletion requires explicit `?force=true` and Super-Admin authority, with child-resource cascade.

### Answer Scripts and marking
- Blank-screen root cause remains fixed by declaring intake state before dependent effects.
- Queue now includes every generated candidate paper awaiting script intake/moderation, including candidates with no script yet.
- Clicking an unuploaded candidate opens intake for that exact candidate.
- Prev/Next navigation is available across the pending candidate queue.
- Bulk finalize and bulk delete pending scripts are implemented; examiner-approved scripts are protected.
- Direct scanned PDF/image attachment is supported and protected after examiner approval.
- Intake validates the real generated candidate paper, exact examination, school visibility, and assigned question set.
- Finalization requires a reason whenever an examiner overrides an existing score.
- Bulk script finalization endpoint is available server-side.
- Deterministic theory evaluation and Gemini evaluation remain available.

### Results and report cards
- Result finalization is idempotent and only uses examiner-approved scripts.
- Finalized results use competition ranking with ties.
- Report-card generation uses finalized results only and calculates participating pupils from actual finalized performance.
- Existing View All Report Cards, navigation, editing, batch PDF, and ranking-refresh workflows remain present.

### Administration
- User create/edit/delete/active-state and role/school workflows remain present.
- User creation generates a temporary password when one is not supplied.
- Principal onboarding remains a two-step assignment workflow.
- Grade scale create/edit/delete remains available with duplicate name+grade protection.
- Database JSON export/import, Quick Access restore, and Super-Admin reset workflows remain available.

## Verification performed

- `python -m compileall -q backend/app` — PASS.
- Static scan of frontend `store.*` calls found no references to missing Store methods.
- Static scan of direct frontend API calls found only authenticated parser/evaluation endpoints that exist on the Flask backend.
- A frontend TypeScript check was also attempted with the system TypeScript compiler. The remaining diagnostics are dominated by absent installed frontend dependencies (`react`, `lucide-react`, `recharts`, Vite/Tailwind packages) in this execution environment; the dependency installation could not complete because the npm registry/cache was unavailable. No additional Store-method or syntax errors were found after filtering those environment dependency diagnostics.

## Windows verification required before deployment

From the project root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\\run-earpms.ps1
```

For a machine that already has dependencies installed:

```powershell
.\\run-earpms.ps1 -NoInstall
```

Then verify:
1. Login with Quick Access.
2. Confirm existing business data survives stopping/restarting and replacing the application folder.
3. Create an examination, enroll pupils, generate papers, print/preview them, and verify only enrolled pupils receive generated papers.
4. Upload a real candidate answer script, attach its scanned PDF, navigate Prev/Next, mark and finalize it.
5. Finalize results and confirm only finalized results appear in rankings/report cards.
6. Test Super-Admin examination editing and finalized-examination lock.
7. Test JSON backup and server-authoritative restore.
