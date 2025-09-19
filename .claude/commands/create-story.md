# create-story

Create a user story following SCRUM methodology with acceptance criteria.

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

## Implementation

This command uses the Xavier Framework to create a user story with automatic story point estimation by the Project Manager agent.
