# LinkedIn Extension API Reference

## Overview
This document provides technical reference for developers working with the LinkedIn Chrome Extension codebase.

## Architecture Overview

### Extension Components
- **Background Service Worker** (`src/background/service-worker.js`)
- **Content Scripts** (`src/content/linkedin-content.js`)
- **Popup Interface** (`src/popup/popup.js`)
- **Dashboard** (`src/dashboard/`)
- **Utilities** (`src/utils/`)

### Data Flow
```
LinkedIn Page → Content Script → Background Worker → Storage API
                ↓                        ↓
            UI Updates ← Dashboard ← Message Passing
```

## Core APIs

### LinkedIn Integration (`src/utils/linkedin.js`)

#### `LinkedInCore` Class

##### Methods

**`getProfileData(profileUrl)`**
- **Description**: Extracts profile information from LinkedIn page
- **Parameters**:
  - `profileUrl` (string): LinkedIn profile URL
- **Returns**: `Promise<ProfileData>`
- **Example**:
```javascript
const profile = await linkedInCore.getProfileData(window.location.href);
console.log(profile.name, profile.company, profile.title);
```

**`sendConnectionRequest(profileId, message)`**
- **Description**: Sends a connection request with custom message
- **Parameters**:
  - `profileId` (string): LinkedIn profile identifier
  - `message` (string): Personalized connection message
- **Returns**: `Promise<ConnectionResult>`
- **Example**:
```javascript
const result = await linkedInCore.sendConnectionRequest(
  'john-doe-123',
  'Hi John, I'd love to connect!'
);
```

**`getSearchResults()`**
- **Description**: Extracts search results from current LinkedIn search page
- **Returns**: `Promise<SearchResult[]>`
- **Example**:
```javascript
const results = await linkedInCore.getSearchResults();
results.forEach(result => console.log(result.name, result.company));
```

### Storage Management (`src/utils/storage.js`)

#### `StorageManager` Class

**`save(key, data)`**
- **Description**: Saves data to Chrome storage
- **Parameters**:
  - `key` (string): Storage key
  - `data` (any): Data to store
- **Returns**: `Promise<void>`

**`load(key, defaultValue = null)`**
- **Description**: Loads data from Chrome storage
- **Parameters**:
  - `key` (string): Storage key
  - `defaultValue` (any): Default value if key not found
- **Returns**: `Promise<any>`

**`remove(key)`**
- **Description**: Removes data from storage
- **Parameters**:
  - `key` (string): Storage key to remove
- **Returns**: `Promise<void>`

### Message Templates (`src/utils/message-templates.js`)

#### `MessageTemplateManager` Class

**`createTemplate(name, content, variables = [])`**
- **Description**: Creates a new message template
- **Parameters**:
  - `name` (string): Template name
  - `content` (string): Template content with variables
  - `variables` (array): List of available variables
- **Returns**: `Promise<string>` - Template ID

**`renderTemplate(templateId, data)`**
- **Description**: Renders template with provided data
- **Parameters**:
  - `templateId` (string): Template identifier
  - `data` (object): Variable substitution data
- **Returns**: `Promise<string>` - Rendered message

**Template Variables**:
- `{firstName}`: Contact's first name
- `{lastName}`: Contact's last name
- `{company}`: Contact's company name
- `{title}`: Contact's job title
- `{industry}`: Contact's industry
- `{location}`: Contact's location

### Analytics Engine (`src/utils/analytics-engine.js`)

#### `AnalyticsEngine` Class

**`trackConnectionRequest(profileId, templateId)`**
- **Description**: Records a connection request for analytics
- **Parameters**:
  - `profileId` (string): Target profile ID
  - `templateId` (string): Message template used
- **Returns**: `Promise<void>`

**`trackConnectionResponse(profileId, response, responseTime)`**
- **Description**: Records connection response
- **Parameters**:
  - `profileId` (string): Profile ID that responded
  - `response` (string): 'accepted', 'rejected', or 'ignored'
  - `responseTime` (number): Time to respond in hours
- **Returns**: `Promise<void>`

**`getAnalytics(period = '30d')`**
- **Description**: Retrieves analytics data for specified period
- **Parameters**:
  - `period` (string): '1d', '7d', '30d', '90d'
- **Returns**: `Promise<AnalyticsData>`

**`generateReport(type, startDate, endDate)`**
- **Description**: Generates detailed analytics report
- **Parameters**:
  - `type` (string): Report type ('summary', 'detailed', 'comparative')
  - `startDate` (Date): Report start date
  - `endDate` (Date): Report end date
- **Returns**: `Promise<ReportData>`

### A/B Testing (`src/utils/ab-testing-framework.js`)

#### `ABTestingFramework` Class

**`createTest(name, variants, trafficSplit = 0.5)`**
- **Description**: Creates a new A/B test
- **Parameters**:
  - `name` (string): Test name
  - `variants` (object): Test variants configuration
  - `trafficSplit` (number): Traffic split ratio
- **Returns**: `Promise<string>` - Test ID

**`getVariant(testId, userId)`**
- **Description**: Gets assigned variant for user
- **Parameters**:
  - `testId` (string): Test identifier
  - `userId` (string): User identifier
- **Returns**: `Promise<string>` - Variant name

**`recordConversion(testId, userId, conversionType)`**
- **Description**: Records conversion event for test
- **Parameters**:
  - `testId` (string): Test identifier
  - `userId` (string): User identifier
  - `conversionType` (string): Type of conversion
- **Returns**: `Promise<void>`

### Safety & Compliance (`src/utils/safety-compliance.js`)

#### `SafetyManager` Class

**`checkRateLimit(userId)`**
- **Description**: Checks if user is within rate limits
- **Parameters**:
  - `userId` (string): User identifier
- **Returns**: `Promise<RateLimitStatus>`

**`calculateDelay(actionType)`**
- **Description**: Calculates appropriate delay for action
- **Parameters**:
  - `actionType` (string): Type of action being performed
- **Returns**: `Promise<number>` - Delay in milliseconds

**`validateProfile(profileData)`**
- **Description**: Validates profile data for safety
- **Parameters**:
  - `profileData` (object): Profile information
- **Returns**: `Promise<ValidationResult>`

## Data Models

### ProfileData
```typescript
interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  profileUrl: string;
  imageUrl?: string;
  connectionLevel: '1st' | '2nd' | '3rd' | 'out-of-network';
  mutualConnections?: number;
}
```

### ConnectionResult
```typescript
interface ConnectionResult {
  success: boolean;
  profileId: string;
  timestamp: Date;
  message: string;
  error?: string;
  rateLimited?: boolean;
}
```

### AnalyticsData
```typescript
interface AnalyticsData {
  totalRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  acceptanceRate: number;
  responseRate: number;
  averageResponseTime: number;
  topPerformingTemplates: TemplatePerformance[];
  industryBreakdown: IndustryStats[];
  dailyActivity: DailyStats[];
}
```

### SearchResult
```typescript
interface SearchResult {
  profileId: string;
  name: string;
  title: string;
  company: string;
  location: string;
  profileUrl: string;
  connectionLevel: string;
  premium: boolean;
  mutualConnections: number;
}
```

## Event System

### Event Types
- `connectionSent`: Fired when connection request is sent
- `connectionAccepted`: Fired when connection is accepted
- `connectionRejected`: Fired when connection is rejected
- `rateLimitReached`: Fired when rate limit is exceeded
- `errorOccurred`: Fired when an error occurs

### Event Listeners
```javascript
// Listen for connection events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'connectionSent') {
    console.log('Connection sent to:', request.profileId);
  }
});
```

## Chrome Extension APIs

### Background Script Messages
```javascript
// Send message to background script
chrome.runtime.sendMessage({
  type: 'sendConnection',
  profileId: 'john-doe-123',
  message: 'Hi John!'
});

// Listen for responses
chrome.runtime.onMessage.addListener((response) => {
  if (response.type === 'connectionResult') {
    console.log('Result:', response.success);
  }
});
```

### Storage API Usage
```javascript
// Save user settings
chrome.storage.local.set({
  dailyLimit: 20,
  autoDelay: true,
  safeMode: true
});

// Load user settings
chrome.storage.local.get(['dailyLimit', 'autoDelay'], (result) => {
  console.log('Daily limit:', result.dailyLimit);
});
```

## Error Handling

### Error Codes
- `LINKEDIN_NOT_LOADED`: LinkedIn page not fully loaded
- `RATE_LIMIT_EXCEEDED`: Daily/hourly limits exceeded
- `INVALID_PROFILE`: Profile data validation failed
- `NETWORK_ERROR`: Network request failed
- `PERMISSION_DENIED`: Chrome extension permissions insufficient
- `LINKEDIN_BLOCKED`: LinkedIn has blocked the request

### Error Handling Pattern
```javascript
try {
  const result = await linkedInCore.sendConnectionRequest(profileId, message);
  if (!result.success) {
    console.error('Connection failed:', result.error);
  }
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Handle rate limiting
    await SafetyManager.waitForReset();
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Testing APIs

### Mock Data
```javascript
// Create mock profile data for testing
const mockProfile = {
  id: 'test-profile-123',
  firstName: 'John',
  lastName: 'Doe',
  title: 'Software Engineer',
  company: 'Tech Corp'
};
```

### Testing Utilities
```javascript
// Test helper functions available in src/test/
import { createMockLinkedInPage, simulateUserAction } from '../test/setup.js';
```

## Security Considerations

### Data Encryption
Sensitive data is encrypted using AES-256-CBC:
```javascript
import { encryptData, decryptData } from '../utils/encryption.js';

const encrypted = await encryptData(sensitiveString);
const decrypted = await decryptData(encrypted);
```

### Content Security Policy
The extension enforces strict CSP:
- No inline scripts allowed
- Only self-hosted resources
- No eval() or Function() constructor

### Privacy Protection
- No data transmitted to external servers
- All processing happens locally
- User consent required for data collection

## Development Guidelines

### Code Style
- Use ES2020+ features
- Prefer async/await over Promises
- Include JSDoc comments for public methods
- Follow Chrome Extension best practices

### Testing Requirements
- Unit tests for all utility functions
- Integration tests for LinkedIn interactions
- End-to-end tests for complete workflows
- Mocking for external dependencies

### Performance Considerations
- Lazy loading for dashboard components
- Debounced user input handlers
- Efficient DOM querying in content scripts
- Memory leak prevention in background scripts