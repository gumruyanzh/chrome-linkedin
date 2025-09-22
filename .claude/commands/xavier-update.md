# xavier-update

Check for and install Xavier Framework updates.

## Usage

Type `/xavier-update` to check for updates.

## Features

- Checks current version against latest
- Shows changelog of new features
- Backs up user data before updating
- Preserves stories, tasks, and sprints
- Updates framework code and commands

## Response

When updates are available:
```
Xavier Framework update available: 1.0.0 → 1.0.2

What's new:
• Intelligent /create-project command
• Strict command boundaries
• Enhanced documentation

To update, run:
  curl -sSL https://raw.githubusercontent.com/gumruyanzh/xavier/main/update.sh | bash
```

When up to date:
```
✅ Xavier Framework is up to date (version 1.0.2)
```
