# create-task

Create a task under an existing user story.

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

## Implementation

Tasks are automatically assigned to the appropriate agent based on tech stack. Test-first development is enforced.
