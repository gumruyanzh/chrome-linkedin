# Technical Stack

> Last Updated: 2025-09-17
> Version: 1.0.0

## Application Framework

- **Framework:** JavaScript (Chrome Extension Manifest V3)
- **Version:** ES2022+
- **Build System:** Vite 5.x

## Database

- **Primary Storage:** Chrome Storage API (chrome.storage.local and chrome.storage.sync)
- **Fallback Storage:** LocalStorage for non-extension contexts

## JavaScript

- **Framework:** Vanilla JavaScript with modern ES modules
- **Package Manager:** npm
- **Module Bundler:** Vite with Rollup
- **Type Checking:** JSDoc annotations (optional TypeScript migration path)

## CSS Framework

- **Framework:** Tailwind CSS 3.x
- **PostCSS:** For CSS processing and optimization
- **Component Styling:** Utility-first approach with custom components

## Chrome Extension Architecture

- **Manifest Version:** V3
- **Service Worker:** Background script for extension lifecycle
- **Content Scripts:** DOM manipulation and LinkedIn integration
- **Popup Interface:** Extension popup for quick access and settings

## Development Tools

- **Build Tool:** Vite with Chrome Extension plugin
- **Code Quality:** ESLint + Prettier
- **Version Control:** Git with conventional commits
- **Testing:** Jest for unit tests, Chrome Extension testing utilities

## APIs and Integration

- **Chrome APIs:** Storage, Tabs, Scripting, Alarms
- **LinkedIn Integration:** DOM-based interaction (no official API)
- **Data Export:** JSON/CSV export capabilities

## Deployment

- **Development:** Hot reload with Vite dev server
- **Production:** Optimized builds for Chrome Web Store
- **Distribution:** Chrome Web Store (primary), potential for other Chromium browsers