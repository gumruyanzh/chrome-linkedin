#!/usr/bin/env python3
"""Xavier Bridge - Command handler for Claude Code integration"""

import sys
import json
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

try:
    from src.commands.xavier_commands import XavierCommands
except ImportError:
    print("Error: Xavier Framework not properly installed")
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: xavier_bridge.py <command> [arguments]")
        sys.exit(1)

    command = sys.argv[1]
    args = {}

    if len(sys.argv) > 2:
        try:
            args = json.loads(' '.join(sys.argv[2:]))
        except:
            pass

    # Map commands
    command_map = {
        'create-project': '/create-project',
        'create-story': '/create-story',
        'create-task': '/create-task',
        'create-bug': '/create-bug',
        'create-sprint': '/create-sprint',
        'start-sprint': '/start-sprint',
        'show-backlog': '/show-backlog',
        'xavier-help': '/xavier-help',
        'xavier-update': '/xavier-update',
        'estimate-story': '/estimate-story',
        'set-story-points': '/set-story-points'
    }

    xavier_command = command_map.get(command.replace('/', ''), f"/{command}")

    try:
        xavier = XavierCommands(os.getcwd())
        result = xavier.execute(xavier_command, args)

        if result.get('success'):
            if 'result' in result:
                print(json.dumps(result['result'], indent=2))
            else:
                print("✅ Command executed successfully")
        else:
            print(f"❌ Error: {result.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()
