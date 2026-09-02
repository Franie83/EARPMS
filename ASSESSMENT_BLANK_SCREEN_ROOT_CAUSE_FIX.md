# Answer Scripts Blank Screen Root-Cause Fix — 2026-08-31

## Root cause
`AssessmentView.tsx` referenced `intakeStudentId` in a `useEffect` dependency array before the `intakeStudentId` state variable was declared.

JavaScript evaluates the dependency array during render, so this caused:

`ReferenceError: Cannot access 'intakeStudentId' before initialization`

React therefore crashed the entire Answer Scripts & AI Marking view. The same view is the destination of the Examinations > Upload & Mark Answer Scripts button, which is why both actions appeared to open a blank page.

## Fix
All Intake Form state declarations were moved above the effects that reference them.

No examination, candidate paper, answer-script, marking, or stored data logic was removed.
