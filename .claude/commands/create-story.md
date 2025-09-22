# create-story

Create a user story following SCRUM methodology with acceptance criteria.

## ⚠️ IMPORTANT: NO IMPLEMENTATION

**This command ONLY creates a story. It does NOT start any implementation.**

When this command is executed:
- ✅ Create the story in the backlog
- ✅ Show the story ID
- ❌ DO NOT write any code
- ❌ DO NOT create any files
- ❌ DO NOT offer to implement
- ❌ DO NOT start working on it

## Usage

Type `/create-story` to create a new user story.

## Parameters

- **title**: Story title (required)
- **as_a**: User role (required)
- **i_want**: Feature description (required)
- **so_that**: Business value (required)
- **acceptance_criteria**: List of acceptance criteria (required)
- **priority**: Priority level - Critical/High/Medium/Low (optional, default: Medium)
- **epic_id**: Parent epic ID (optional)

## Example

```json
{
  "title": "User Authentication",
  "as_a": "user",
  "i_want": "to log in securely",
  "so_that": "I can access my account",
  "acceptance_criteria": [
    "Email validation",
    "Password strength check",
    "Remember me option"
  ],
  "priority": "High"
}
```

## Response

After creating a story, simply confirm:
"✅ Story STORY-XXX created successfully. Use /create-task to add tasks or /show-backlog to view."

**DO NOT OFFER TO IMPLEMENT OR START WORKING ON THE STORY.**
