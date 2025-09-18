# LinkedIn Chrome Extension

A Chrome extension for automating LinkedIn networking by finding people based on search criteria and sending personalized connection requests.

## Features

- **Automated Connection Requests**: Send connection requests based on search criteria
- **Bulk Management Dashboard**: Manage multiple connection requests efficiently
- **Analytics & Tracking**: Track sent requests, response rates, and networking performance
- **Custom Message Templates**: Create and reuse personalized connection messages
- **Saved Search Criteria**: Store and reuse search parameters for consistent prospecting
- **Safety Features**: Built-in rate limiting and human-like delays

## Tech Stack

- **Framework**: JavaScript (ES2020+)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Architecture**: Chrome Extension Manifest V3
- **Storage**: Chrome Storage API
- **Testing**: Jest with Chrome Extension testing utilities

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Development Build**
   ```bash
   npm run dev
   ```

3. **Production Build**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   # or watch mode
   npm run test:watch
   ```

5. **Linting & Formatting**
   ```bash
   npm run lint
   npm run format
   ```

## Project Structure

```
src/
├── background/          # Background service worker
├── content/            # Content scripts for LinkedIn pages
├── popup/              # Extension popup interface
├── dashboard/          # Management dashboard
├── settings/           # Settings page
├── utils/              # Utility functions
├── components/         # Reusable components
├── lib/                # Core libraries
├── styles/             # Tailwind CSS styles
├── test/               # Testing utilities and mocks
└── manifest.json       # Extension manifest
```

## Chrome Extension Setup

1. Build the extension:
   ```bash
   npm run build:extension
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode"

4. Click "Load unpacked" and select the `dist` folder

5. The extension will appear in your Chrome toolbar

## Usage

1. Navigate to LinkedIn
2. Click the extension icon in your toolbar
3. Configure your automation settings
4. Start automation on search results or profile pages

## Safety & Compliance

This extension includes built-in safety features:
- Rate limiting (default: 20 connections per day)
- Human-like delays between actions
- Safe mode to prevent detection
- Respect for LinkedIn's terms of service

**Important**: Use responsibly and in compliance with LinkedIn's terms of service. This tool is for legitimate networking purposes only.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests and ensure they pass
4. Submit a pull request

## License

MIT License - see LICENSE file for details.