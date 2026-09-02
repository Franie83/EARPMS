
# EARPMS v2.6 Fixes Applied

## Fixed
- Question bank now has working **Edit Question** and **Delete Question** controls.
- Editing preserves verification state and supports objective options, answer key, expected answer, marks and answer lines.
- Question deletion is protected when the question is already assigned to candidate papers.
- Added **Bulk Enroll Existing Students** to an examination. Only active students matching the examination class/school are offered; existing enrollments are skipped.
- Fixed **Create User**: the modal was missing even though the button existed. It now creates users through the store, validates roles/school assignment, accepts an initial password, and generates a temporary password when omitted.
- Added missing user update/delete store methods used by Administration.
- Added server synchronization handling for newly-created user credentials so created accounts can actually log in.
- Added synchronization flushing after CBT submission so the result is persisted before the UI refreshes.
- Fixed the CBT completion card to display the returned `score` field correctly.

## Verification
- Python backend source passes `python -m compileall backend/app`.
- Full frontend dependency installation/build could not be run in this environment because the npm registry dependency cache is incomplete. Run `npm ci` then `npm run build` on the Windows machine before deployment.
