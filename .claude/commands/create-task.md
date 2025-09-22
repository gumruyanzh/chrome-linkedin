# create-task

Create a task under an existing user story.

## ⚠️ IMPORTANT: NO IMPLEMENTATION

**This command ONLY creates a task. It does NOT start any implementation.**

When this command is executed:
- ✅ Create the task under the story
- ✅ Show the task ID
- ❌ DO NOT write any tests
- ❌ DO NOT write any code
- ❌ DO NOT create any files
- ❌ DO NOT start implementing

## Usage

Type `/create-task` to create a new task.

## Parameters

- **story_id**: Parent story ID (required)
- **title**: Task title (required)
- **description**: Task description (required)
- **technical_details**: Implementation details (required)
- **estimated_hours**: Hour estimate (optional, default: 4)
- **test_criteria**: List of test requirements (required)
- **priority**: Priority level - Critical/High/Medium/Low (optional, default: Medium)
- **dependencies**: List of dependency task IDs (optional)

## Response

After creating a task, simply confirm:
"✅ Task TASK-XXX created under STORY-XXX. Use /show-backlog to view or /create-sprint to plan."

**DO NOT START IMPLEMENTING THE TASK. Implementation only begins with /start-sprint.**
