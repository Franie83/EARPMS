# Examination print + printed-script marking fixes — 2026-08-31

## Fixed
- Candidate Preview/Print now operates only on generated candidate papers.
- Preview/Print no longer recalculates or displays every pupil in the class.
- Candidate QR generation no longer loops from unstable array dependencies.
- Printing opens a dedicated print window containing only the candidate paper/booklet content.
- Blocked print pop-ups now show a clear message.
- Added **Upload & Mark Answer Scripts** directly to the Examination > Candidate Papers area.
- The Assessment/Marking desk now guides the printed-paper workflow.
- Uploading a script requires a real generated candidate paper; fake paper IDs are no longer created.
- Variable-paper marking/intake uses the exact questions assigned to that candidate.
- Existing examiner-approved scripts cannot be silently replaced.
- Regeneration does not alter papers already distributed, collected, scanned, or used in CBT.
- The Generate Papers UI now handles the store's `{ success, message, count }` result correctly.

## Printed-paper workflow
1. Create/verify the examination and questions.
2. Enrol pupils and generate candidate papers.
3. Use **Preview All Candidate Papers** or **Print All Candidate Booklets**.
4. Pupils answer the printed paper by hand.
5. Scan the completed script as PDF/JPG/PNG.
6. Open **Upload & Mark Answer Scripts**.
7. Select the examination and candidate, upload the scanned script, verify/transcribe responses, and save.
8. Use the examiner marking desk to enter/adjust marks per question.
9. Finalize the script for examiner approval.
10. Approved scripts can then proceed to results/finalization.

## 2026-08-31 Answer Scripts Blank-Screen Fix

- Fixed `frontend/src/components/AssessmentView.tsx` so the Answer Scripts & AI Marking page remains populated after asynchronous store hydration.
- Candidate queue now shows every generated candidate paper, including pupils whose scanned answer script has not yet been uploaded.
- Approved/moderated scripts are now correctly shown by the `Moderated` filter instead of being removed before filtering.
- Clicking a candidate with no script now opens the upload/intake workflow for that exact candidate.
- Added a visible fallback action when no script is selected instead of an apparently blank marking desk.
- Exam and candidate selectors now resynchronize when examination/student data arrives after login.
