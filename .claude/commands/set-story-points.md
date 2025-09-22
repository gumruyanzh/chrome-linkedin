# set-story-points

Manually set story points for a specific story (formerly /estimate-story).

## Usage

```
/set-story-points STORY-001 5
```

## Arguments

- **story_id** (required): Story ID
- **points** (required): Story points (must be Fibonacci: 1,2,3,5,8,13,21)

## Example

```json
{
  "command": "/set-story-points",
  "args": {
    "story_id": "STORY-001",
    "points": 5
  }
}
```

## Purpose

Use this when you want to manually override story points instead of using the PM agent's automatic estimation.
