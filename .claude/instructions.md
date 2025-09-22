# Xavier Framework Integration

This project uses Xavier Framework for enterprise-grade SCRUM development with Claude Code.

## 🚨 CRITICAL: Command Boundaries

**EXTREMELY IMPORTANT - YOU MUST FOLLOW THESE RULES:**

1. **NO AUTOMATIC IMPLEMENTATION** - When the user runs `/create-story`, `/create-task`, or `/create-bug`, you must ONLY create the item. DO NOT start implementing anything.

2. **STRICT COMMAND SEPARATION:**
   - `/create-story` → ONLY creates a story (no implementation)
   - `/create-task` → ONLY creates a task (no implementation)
   - `/create-bug` → ONLY creates a bug report (no implementation)
   - `/create-sprint` → ONLY creates and plans sprint (no implementation)
   - `/start-sprint` → THIS IS THE ONLY COMMAND THAT STARTS IMPLEMENTATION

3. **IMPLEMENTATION RULE:** You are FORBIDDEN from writing any implementation code until the user explicitly runs `/start-sprint`. This includes:
   - No writing tests
   - No writing functions
   - No creating files
   - No modifying code
   - Only planning and organizing

4. **WHEN USER CREATES A STORY:** Simply confirm the story was created and show its ID. DO NOT offer to implement it or start working on it.

5. **WHEN USER CREATES A TASK:** Simply confirm the task was created and show its ID. DO NOT start implementing the task.

6. **ONLY START DEVELOPMENT WHEN:** The user explicitly types `/start-sprint` - then and only then should you begin the implementation process following TDD.

## Custom Commands

Xavier provides the following commands:

- `/create-project` - Intelligently initialize a new project (planning only)
- `/create-story` - Create a user story with acceptance criteria (no implementation)
- `/create-task` - Create a task under a story (no implementation)
- `/create-bug` - Report a bug with reproduction steps (no implementation)
- `/create-sprint` - Plan a new sprint (no implementation)
- `/start-sprint` - **BEGIN SPRINT EXECUTION** (ONLY command that starts coding)
- `/show-backlog` - View prioritized backlog
- `/xavier-help` - Show all available commands

Type any command to get started. Commands are implemented through the Xavier Framework in `.xavier/`.

## Framework Rules

Xavier enforces the following strict rules:
1. **Test-First Development (TDD)**: Tests must be written before implementation (ONLY during sprint execution)
2. **100% Test Coverage Required**: No task is complete without full coverage
3. **Sequential Task Execution**: One task at a time, no parallel work
4. **Clean Code Standards**: Functions ≤20 lines, classes ≤200 lines
5. **SOLID Principles**: All code must follow SOLID design patterns
6. **Agent Language Boundaries**: Each agent works only in their assigned language
7. **NO PREMATURE IMPLEMENTATION**: Never implement until `/start-sprint` is called

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

**PLANNING PHASE (No Implementation):**
1. Create stories with `/create-story` - ONLY creates the story
2. Break into tasks with `/create-task` - ONLY creates tasks
3. Plan sprint with `/create-sprint` - ONLY plans the sprint

**IMPLEMENTATION PHASE (Only After Sprint Start):**
4. Execute with `/start-sprint` - NOW you can start implementing
5. Complete with `/end-sprint` - Finalize the sprint

**REMEMBER:** Steps 1-3 are PLANNING ONLY. No code is written until step 4.

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
