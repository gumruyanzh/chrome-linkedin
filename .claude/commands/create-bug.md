# create-bug

Report a bug with detailed reproduction steps.

## ⚠️ IMPORTANT: NO IMMEDIATE FIX

**This command ONLY creates a bug report. It does NOT fix the bug.**

When this command is executed:
- ✅ Create the bug report
- ✅ Show the bug ID
- ❌ DO NOT start fixing the bug
- ❌ DO NOT write any code
- ❌ DO NOT modify any files
- ❌ DO NOT debug or investigate

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

## Response

After creating a bug, simply confirm:
"✅ Bug BUG-XXX created with priority [PRIORITY]. Use /show-backlog to view."

**DO NOT START FIXING THE BUG. Bug fixes only begin with /start-sprint.**
