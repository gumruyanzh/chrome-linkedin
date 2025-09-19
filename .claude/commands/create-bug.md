# create-bug

Report a bug with detailed reproduction steps.

## Usage

Type `/create-bug` to report a bug.

## Parameters

- **title**: Bug title (required)
- **description**: Bug description (required)
- **steps_to_reproduce**: List of reproduction steps (required)
- **expected_behavior**: What should happen (required)
- **actual_behavior**: What actually happens (required)
- **severity**: Severity level - Critical/High/Medium/Low (required)
- **priority**: Priority level - Critical/High/Medium/Low (optional, default: High)

## Implementation

Bugs are automatically prioritized and assigned story points based on severity.
