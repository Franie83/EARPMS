# Principal / School Onboarding Workflow Fix

## Correct onboarding sequence

1. Create a **Principal** user even when no schools exist.
   - Assigned School is optional during onboarding.
   - The account is created with `school_id = null` and is marked as pending assignment.
2. Register the **School** without requiring a Head Teacher / Principal name.
   - A newly created school is initially `principal_user_id = null` and `head_teacher = "Not Assigned"` when no name is supplied.
3. From **Academic Setup**, use **Assign Principal** on the school.
   - Only active Principal accounts are selectable.
   - The Principal is linked to exactly one school.
   - The Principal account's `school_id` and the school's `principal_user_id` are synchronized.
   - The school display name for the head teacher is updated from the Principal account.
4. Changing a user to Principal no longer opens a raw School ID prompt.
   - If no school is assigned, the Principal remains pending assignment.
   - The administrator can complete assignment from the school workflow.

## Security behavior

An unassigned Principal/Teacher account does not inherit statewide school visibility. Until a Principal is assigned a school, school-scoped data remains inaccessible. Super-Admin and Director retain statewide scope.

## Files changed

- `frontend/src/components/AdminView.tsx`
- `frontend/src/components/AcademicSetupView.tsx`
- `frontend/src/lib/store.ts`
- `backend/app/routes.py`

## Validation

- Backend Python syntax compilation completed successfully.
- Full frontend TypeScript/build validation could not be completed in this environment because the dependency installation was incomplete/network-limited; the existing project dependencies were not altered.
