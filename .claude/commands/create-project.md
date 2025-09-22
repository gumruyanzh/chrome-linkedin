# create-project

Intelligently initialize a new Xavier project with automatic analysis and setup.

## ⚠️ IMPORTANT: INITIALIZATION ONLY

**This command ONLY initializes project structure. It does NOT implement features.**

When this command is executed:
- ✅ Analyze project requirements
- ✅ Suggest tech stack
- ✅ Create initial stories
- ✅ Set up directory structure
- ❌ DO NOT start implementing features
- ❌ DO NOT write application code
- ❌ DO NOT create feature files

## Usage

Type `/create-project` to create a new project with intelligent tech stack analysis.

## Parameters

- **name**: Project name (required)
- **description**: Detailed project description for analysis (optional)
- **tech_stack**: Technology preferences as JSON (optional)
- **project_type**: Type of project (web, api, mobile, ecommerce, blog) (optional)
- **auto_generate_stories**: Generate initial stories from description (default: true)
- **auto_setup_agents**: Configure agents based on tech stack (default: true)

## Examples

### Basic
```json
{
  "name": "TodoApp"
}
```

### With Description
```json
{
  "name": "TodoApp",
  "description": "A task management application with user authentication, real-time updates, and team collaboration features."
}
```

### With Tech Stack
```json
{
  "name": "TodoApp",
  "description": "Task management app",
  "tech_stack": {
    "backend": "python/fastapi",
    "frontend": "react",
    "database": "postgresql"
  }
}
```

## Features

- Analyzes project description to detect features and requirements
- Suggests optimal tech stack based on project needs
- Generates initial epics and user stories automatically
- Configures specialized agents for the tech stack
- Creates appropriate directory structure
- Sets up comprehensive README with project details

## Implementation

Xavier uses AI-powered analysis to understand your project requirements and automatically sets up everything you need to get started.
