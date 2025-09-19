# Xavier Framework Integration

This project uses Xavier Framework for enterprise-grade SCRUM development with Claude Code.

## Custom Commands

Xavier provides the following commands:

- `/create-story` - Create a user story with acceptance criteria
- `/create-task` - Create a task under a story
- `/create-bug` - Report a bug with reproduction steps
- `/create-sprint` - Plan a new sprint
- `/start-sprint` - Begin sprint execution
- `/show-backlog` - View prioritized backlog
- `/xavier-help` - Show all available commands

Type any command to get started. Commands are implemented through the Xavier Framework in `.xavier/`.

## Framework Rules

Xavier enforces the following strict rules:
1. **Test-First Development (TDD)**: Tests must be written before implementation
2. **100% Test Coverage Required**: No task is complete without full coverage
3. **Sequential Task Execution**: One task at a time, no parallel work
4. **Clean Code Standards**: Functions ≤20 lines, classes ≤200 lines
5. **SOLID Principles**: All code must follow SOLID design patterns
6. **Agent Language Boundaries**: Each agent works only in their assigned language

## Available Commands

### Story Management
- `/create-story` - Create user story with acceptance criteria
- `/create-task` - Create task under a story
- `/create-bug` - Report a bug

### Sprint Management
- `/create-sprint` - Plan a new sprint
- `/start-sprint` - Begin sprint execution
- `/end-sprint` - Complete current sprint

### Reporting
- `/show-backlog` - View prioritized backlog
- `/show-sprint` - Current sprint status
- `/generate-report` - Generate various reports

### Project
- `/learn-project` - Analyze existing codebase
- `/tech-stack-analyze` - Detect technologies
- `/xavier-help` - Show all commands

## Workflow

1. Create stories with `/create-story`
2. Break into tasks with `/create-task`
3. Plan sprint with `/create-sprint`
4. Execute with `/start-sprint` (agents work sequentially)
5. Complete with `/end-sprint`

## Active Agents

Check `.xavier/config.json` for enabled agents. Each agent has strict boundaries:
- Python Engineer: Python only
- Golang Engineer: Go only
- Frontend Engineer: TypeScript/JavaScript only

## Important Notes

- Xavier commands are executed through the framework in `.xavier/`
- All data is stored in `.xavier/data/`
- Sprint information in `.xavier/sprints/`
- Reports generated in `.xavier/reports/`
