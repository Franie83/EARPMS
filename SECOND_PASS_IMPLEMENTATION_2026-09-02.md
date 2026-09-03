# EARPMS Second-Pass Lifecycle Integrity Fixes — 2026-09-02

Implemented across the examination lifecycle:

1. One answer script per candidate paper; pending scripts cannot be duplicated.
2. Examiner finalization is server-authorized: teachers only within their school scope; Super-Admin/Director retain administrative authority.
3. Examiner approval requires a complete answer payload; every script answer must be present and have a valid final score.
4. Scores are validated against each question's maximum marks; negative/oversized scores are rejected.
5. Score overrides require an explicit reason and are audited.
6. Bulk script finalization uses the same authorization and completeness checks.
7. Principal moderation now enforces examination school scope server-side.
8. Approved and finalized examinations lock questions, rubrics and marking schemes against REST and /state mutation.
9. Approved examinations cannot be edited through the generic REST update route.
10. Candidate paper generation is permitted only after Principal approval.
11. Finalized examinations are closed to candidate access and CBT submission.
12. Result finalization is one-way; an already-finalized examination cannot be silently recalculated.
13. Report-card generation is school-scope authorized and only consumes results belonging to finalized examinations.
14. Principal submission gate requires all questions to be verified and an approved/locked marking scheme.
15. Pipeline mutation is blocked after Principal approval.
16. All Python backend files pass syntax compilation.

The existing UI, branding, seeded users, data model and project structure were preserved.
