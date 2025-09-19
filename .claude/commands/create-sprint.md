# create-sprint

Plan a new sprint with automatic work item selection.

## Usage

Type `/create-sprint` to create a new sprint.

## Parameters

- **name**: Sprint name (required)
- **goal**: Sprint goal (required)
- **duration_days**: Sprint length in days (optional, default: 14)
- **auto_plan**: Automatically select items by priority (optional, default: true)

## Implementation

Xavier automatically calculates velocity, selects items, and prepares the sprint.
