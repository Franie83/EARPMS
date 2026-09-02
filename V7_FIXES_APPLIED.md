# EARPMS v7 Fixes

- Quick Access is the only automatic seed. New databases receive only Quick Access users.
- Business records are not re-seeded on relaunch or update.
- Development SQLite database is stored under `%LOCALAPPDATA%\EARPMS\earpms_dev.db` so release-folder replacement does not erase user-created data.
- First v7 launch automatically migrates the newest prior release-folder `backend\earpms_dev.db` when durable storage does not yet exist.
- Examination enrollment supports Entire Class and individual pupil selection.
- Student paper generation is limited to pupils already enrolled in the examination.
- Examination deletion is available to Super-Admin for examinations without finalized results and cascades deletion of child records.
- Report-card refresh generates cards from actual finalized results and recalculates class positions.
- Existing report-card navigation remains constrained to cards that actually exist for the selected session/term.
