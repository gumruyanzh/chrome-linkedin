# estimate-story

Automatically estimate story points using Project Manager agent's complexity analysis.

## 📊 PM AGENT POWERED

The Project Manager agent analyzes:
- Technical complexity (API, database, auth, etc.)
- CRUD operations
- Acceptance criteria count and complexity
- UI/UX requirements
- Testing requirements
- Maps complexity to Fibonacci points (1,2,3,5,8,13,21)

## Usage

```
/estimate-story                # Estimate all unestimated backlog stories
/estimate-story STORY-001      # Estimate specific story
/estimate-story --all          # Re-estimate all stories
```

## Examples

### Estimate entire backlog
```json
{
  "command": "/estimate-story",
  "args": {}
}
```

### Estimate specific story
```json
{
  "command": "/estimate-story",
  "args": {
    "story_id": "STORY-001"
  }
}
```

### Re-estimate all stories
```json
{
  "command": "/estimate-story",
  "args": {
    "all": true
  }
}
```

## Output

Returns:
- Stories estimated count
- Total story points
- Estimated sprints needed
- Individual story estimates with complexity scores

## Visual Feedback

Watch for:
- 📊 [PM] ProjectManager colored display
- Complexity score analysis
- Fibonacci point mapping
- Sprint capacity calculations
