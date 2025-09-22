# create-sprint

Plan a new sprint with automatic work item selection.

## ⚠️ IMPORTANT: PLANNING ONLY

**This command ONLY plans a sprint. It does NOT start implementation.**

When this command is executed:
- ✅ Create the sprint
- ✅ Select stories/tasks for the sprint
- ✅ Calculate velocity and capacity
- ✅ Show sprint summary
- ❌ DO NOT start implementing
- ❌ DO NOT write any code
- ❌ DO NOT create any files

## Usage

Type `/create-sprint` to create a new sprint.

## Parameters

- **name**: Sprint name (required)
- **goal**: Sprint goal (required)
- **duration_days**: Sprint length in days (optional, default: 14)
- **auto_plan**: Automatically select items by priority (optional, default: true)

## Response

After creating a sprint, simply confirm:
"✅ Sprint SPRINT-XXX created with X story points. Use /start-sprint to begin implementation."

**Sprint planning is SEPARATE from sprint execution. Use /start-sprint to actually begin work.**
