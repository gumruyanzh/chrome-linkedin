# Xavier Framework

This project is configured with Xavier Framework for enterprise SCRUM development.

## Quick Start

### Create a user story
```bash
./xavier story '{"title": "User Login", "as_a": "user", "i_want": "to log in", "so_that": "I can access my account", "acceptance_criteria": ["Email validation", "Password check"], "priority": "High"}'
```

### Create a sprint
```bash
./xavier sprint '{"name": "Sprint 1", "goal": "Complete authentication"}'
```

### Start sprint
```bash
./xavier start
```

## Claude Code Commands

All commands are available as slash commands in Claude Code:
- `/create-story`
- `/create-task`
- `/create-bug`
- `/create-sprint`
- `/start-sprint`
- `/show-backlog`
- `/xavier-help`

## Configuration

Edit `.xavier/config.json` to customize settings.

## Requirements

- Test-first development (100% coverage required)
- Clean Code principles enforced
- SOLID design patterns
- Sequential task execution
- Strict SCRUM methodology

## Support

Visit https://xavier-framework.dev for documentation.
