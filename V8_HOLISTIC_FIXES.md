# EARPMS v8 — Holistic Examination / Pipeline / Report Card Fixes

## Fixed
- Centralized MINISTRY OF EDUCATION examinations (`school_id = null`) are visible to school-scoped principals and teachers throughout the exam workflow, including Answer Scripts & AI Marking and child resources such as questions/papers/scripts/results.
- Added Super-Admin **Edit Examination** control for all non-finalized examinations.
- Added examination date to the edit/create dialog.
- Finalized examinations are server-side locked against edits and deletes.
- Examination deletion now cascades server-side to questions, marking schemes, rubrics, candidate papers, answer scripts, and results, while refusing deletion when finalized results exist.
- Fixed the duplicate backend `put()` operation in the generic update endpoint.
- Fixed the legacy examination document importer to call the real `/api/gemini/parse-exam-document` endpoint.
- Fixed the document pipeline's `autoVerify` state mapping.
- Fixed uploaded base64 document handling (`fileBase64` is normalized before server parsing).
- Added a deterministic local combined Q&A parser so text-based document import works without a Gemini API key.
- Added **View All Report Cards** table for the selected session/term, with search and one-click return to an individual card.

## Integrity rules
- Finalized examinations remain immutable academic records.
- Existing report-card batch PDF download remains available.
- Server-side RBAC and school visibility remain authoritative; frontend controls do not bypass API permissions.
