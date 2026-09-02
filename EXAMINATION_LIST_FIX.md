
# Examination Master List Fix

## What changed
- The backend `/state` synchronization endpoint no longer deletes server records simply because they are absent from a browser snapshot.
- Explicit deletes use `DELETE /<resource>/<id>` and the frontend queues examination deletions before synchronization.
- The Examinations screen now has a **Refresh Exams** button that reloads the complete server-side examination list.
- Existing search/class/subject/status filters continue to operate over the complete hydrated examination collection.
- Super-Admin remains able to see all examinations permitted by the server's statewide visibility rule.

## Important
This fix does not invent examinations that are not present in the database. If an examination was already deleted from the database by an earlier faulty synchronization, it must be restored from a database backup or recreated.
