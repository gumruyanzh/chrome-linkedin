# Installation Guide

## Chrome Web Store Installation (Recommended)

### Step 1: Find the Extension
1. Open Google Chrome browser
2. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
3. Search for "LinkedIn Networking Extension" or use the direct link when available

### Step 2: Install
1. Click "Add to Chrome" button
2. Review the permissions in the popup dialog:
   - **Storage**: Save your settings and analytics data locally
   - **ActiveTab**: Work with LinkedIn pages you're viewing
   - **Host permissions for *.linkedin.com**: Access LinkedIn content for automation
3. Click "Add extension" to confirm installation

### Step 3: Pin to Toolbar
1. Click the puzzle piece icon in Chrome's toolbar
2. Find "LinkedIn Networking Extension" in the list
3. Click the pin icon to keep it visible in your toolbar
4. The extension icon should now appear in your Chrome toolbar

### Step 4: First-Time Setup
1. Navigate to [LinkedIn.com](https://linkedin.com) and log in
2. Click the extension icon in your toolbar
3. You'll see a welcome banner - click "Getting Started Guide" for help
4. Configure your basic settings:
   - Daily connection limit (start with 10-15)
   - Create your first message template
   - Set up targeting preferences

## Developer Installation (For Testing)

If you want to install the development version or contribute to the project:

### Prerequisites
- Google Chrome browser (version 88 or later)
- Node.js (version 14 or later)
- npm (comes with Node.js)

### Step 1: Download Source Code
```bash
git clone https://github.com/your-username/chrome-linkedin-extension.git
cd chrome-linkedin-extension
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build Extension
```bash
# For development build
npm run build:dev

# For production build
npm run build:prod
```

### Step 4: Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle in the top-right corner
3. Click "Load unpacked" button
4. Select the `dist/` folder from your project directory
5. The extension will appear in your extensions list

### Step 5: Development Setup
```bash
# Run tests
npm test

# Watch for changes during development
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## Verification

After installation, verify everything works:

### 1. Extension Appears
- Extension icon is visible in Chrome toolbar
- Clicking the icon opens the popup interface

### 2. LinkedIn Integration
- Navigate to LinkedIn.com
- Extension popup shows "Start Automation" button (not grayed out)
- Status shows as "Ready" or "Inactive"

### 3. Basic Functionality
- Click "Settings" to open configuration page
- Click "Dashboard" to open analytics interface
- Help system opens when clicking the "?" icon

## Troubleshooting Installation

### Extension Not Appearing
**Problem**: Extension installed but not visible in toolbar

**Solutions**:
1. Check the puzzle piece menu in Chrome toolbar
2. Pin the extension from the extensions menu
3. Refresh Chrome by restarting the browser
4. Check `chrome://extensions/` to ensure it's enabled

### Permissions Error
**Problem**: Extension shows permission errors

**Solutions**:
1. Go to `chrome://extensions/`
2. Click "Details" on the LinkedIn extension
3. Ensure all permissions are granted
4. Try removing and reinstalling the extension

### LinkedIn Pages Not Working
**Problem**: Extension doesn't work on LinkedIn pages

**Solutions**:
1. Make sure you're logged into LinkedIn
2. Refresh the LinkedIn page
3. Check that the extension has LinkedIn host permissions
4. Try disabling other LinkedIn-related extensions temporarily

### Build Errors (Developer Install)
**Problem**: npm build fails

**Solutions**:
1. Ensure Node.js version 14+ is installed
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules/` and `package-lock.json`
4. Run `npm install` again
5. Check for any missing dependencies

### Chrome Developer Mode Issues
**Problem**: "Load unpacked" not working

**Solutions**:
1. Ensure Developer mode is enabled in `chrome://extensions/`
2. Select the correct `dist/` folder (not the root project folder)
3. Check that `manifest.json` exists in the selected folder
4. Look for manifest validation errors in Chrome's console

## Browser Compatibility

### Supported Browsers
- **Google Chrome**: Version 88+ (recommended)
- **Chromium**: Version 88+
- **Microsoft Edge**: Version 88+ (Chromium-based)
- **Brave**: Version 1.20+ (Chromium-based)

### Not Supported
- Firefox (different extension API)
- Safari (different extension system)
- Internet Explorer (deprecated)
- Chrome versions below 88

## System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.14, Linux (Ubuntu 18.04+)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 50MB free space
- **Internet**: Stable broadband connection

### Recommended Specifications
- **OS**: Latest version of Windows, macOS, or Linux
- **RAM**: 8GB or more
- **Browser**: Latest Chrome version
- **Internet**: High-speed connection for optimal LinkedIn performance

## Security Considerations

### Data Privacy
- All data is stored locally in your browser
- No information is sent to external servers
- Your LinkedIn credentials are never accessed or stored
- Analytics data remains on your device

### Chrome Permissions
The extension requests minimal permissions:
- **Storage**: Save your settings and data
- **ActiveTab**: Only access the current tab when you're using it
- **LinkedIn Host**: Only works on LinkedIn pages
- **No Background Access**: Extension only works when you activate it

### Safe Usage
- Extension includes built-in rate limiting
- Respects LinkedIn's terms of service
- Human-like timing patterns to avoid detection
- Easy pause/stop controls for immediate shutdown

## Getting Help

If you encounter issues during installation:

1. **Check FAQ**: Review common issues in the FAQ section
2. **User Guide**: Comprehensive usage documentation
3. **Support Contact**: Email support through the extension popup
4. **GitHub Issues**: Report bugs or request features
5. **Community Forum**: Connect with other users

## Next Steps

After successful installation:

1. **Complete Setup**: Follow the Getting Started guide
2. **Create Templates**: Set up your first message templates
3. **Configure Settings**: Adjust daily limits and safety settings
4. **Start Small**: Begin with 10-15 connections per day
5. **Monitor Analytics**: Track your networking performance

## Updates

The extension automatically updates through the Chrome Web Store. You'll be notified when updates are available and can review changelog information in the extension details.

For developer installations, pull the latest changes from the repository and rebuild:

```bash
git pull origin main
npm install
npm run build
```

Then reload the extension in `chrome://extensions/` by clicking the refresh icon.