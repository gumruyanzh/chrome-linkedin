// Settings page JavaScript for LinkedIn Automation Extension

document.addEventListener('DOMContentLoaded', initializeSettings);

let currentSettings = {};

async function initializeSettings() {
  try {
    await loadSettings();
    setupEventListeners();
    setupMessageCharacterCount();
  } catch (error) {
    console.error('Error initializing settings:', error);
    showNotification('Failed to load settings', 'error');
  }
}

function setupEventListeners() {
  // Save settings
  document.getElementById('save-settings').addEventListener('click', saveSettings);

  // Reset settings
  document.getElementById('reset-settings').addEventListener('click', resetSettings);

  // Data management
  document.getElementById('export-data').addEventListener('click', exportData);
  document.getElementById('clear-analytics').addEventListener('click', clearAnalytics);
  document.getElementById('clear-all-data').addEventListener('click', clearAllData);
}

function setupMessageCharacterCount() {
  const messageTextarea = document.getElementById('default-message');
  const charCount = document.getElementById('message-char-count');

  messageTextarea.addEventListener('input', () => {
    const count = messageTextarea.value.length;
    charCount.textContent = `${count}/200`;

    if (count > 200) {
      charCount.classList.add('text-red-500');
    } else {
      charCount.classList.remove('text-red-500');
    }
  });
}

async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });

    if (response.success && response.data) {
      currentSettings = response.data;
      populateSettings(currentSettings);
    } else {
      // Load default settings
      currentSettings = getDefaultSettings();
      populateSettings(currentSettings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    currentSettings = getDefaultSettings();
    populateSettings(currentSettings);
  }
}

function getDefaultSettings() {
  return {
    connectionRequestsPerDay: 20,
    delayBetweenRequests: 5,
    personalizedMessages: true,
    analyticsEnabled: true,
    safeModeEnabled: true,
    autoAcceptConnections: false,
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    weekendsEnabled: false,
    defaultMessage: "Hi [firstName], I'd love to connect with you on LinkedIn!"
  };
}

function populateSettings(settings) {
  // Automation settings
  document.getElementById('connection-requests-per-day').value =
    settings.connectionRequestsPerDay || 20;
  document.getElementById('delay-between-requests').value = settings.delayBetweenRequests || 5;
  document.getElementById('personalized-messages').checked =
    settings.personalizedMessages !== false;
  document.getElementById('analytics-enabled').checked = settings.analyticsEnabled !== false;

  // Safety settings
  document.getElementById('safe-mode-enabled').checked = settings.safeModeEnabled !== false;
  document.getElementById('auto-accept-connections').checked =
    settings.autoAcceptConnections === true;
  document.getElementById('weekends-enabled').checked = settings.weekendsEnabled === true;

  // Working hours
  if (settings.workingHours) {
    document.getElementById('working-hours-start').value = settings.workingHours.start || '09:00';
    document.getElementById('working-hours-end').value = settings.workingHours.end || '17:00';
  }

  // Message template
  document.getElementById('default-message').value =
    settings.defaultMessage || "Hi [firstName], I'd love to connect with you on LinkedIn!";

  // Update character count
  const messageTextarea = document.getElementById('default-message');
  const charCount = document.getElementById('message-char-count');
  charCount.textContent = `${messageTextarea.value.length}/200`;
}

async function saveSettings() {
  const saveButton = document.getElementById('save-settings');
  const originalText = saveButton.textContent;

  saveButton.textContent = 'Saving...';
  saveButton.disabled = true;

  try {
    const settings = collectSettingsFromForm();

    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: settings
    });

    if (response.success) {
      currentSettings = settings;
      showNotification('Settings saved successfully!', 'success');

      // Update button text temporarily
      saveButton.textContent = 'Saved!';
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      }, 1000);
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification('Failed to save settings', 'error');

    saveButton.textContent = originalText;
    saveButton.disabled = false;
  }
}

function collectSettingsFromForm() {
  return {
    connectionRequestsPerDay:
      parseInt(document.getElementById('connection-requests-per-day').value) || 20,
    delayBetweenRequests: parseInt(document.getElementById('delay-between-requests').value) || 5,
    personalizedMessages: document.getElementById('personalized-messages').checked,
    analyticsEnabled: document.getElementById('analytics-enabled').checked,
    safeModeEnabled: document.getElementById('safe-mode-enabled').checked,
    autoAcceptConnections: document.getElementById('auto-accept-connections').checked,
    weekendsEnabled: document.getElementById('weekends-enabled').checked,
    workingHours: {
      start: document.getElementById('working-hours-start').value,
      end: document.getElementById('working-hours-end').value
    },
    defaultMessage: document.getElementById('default-message').value
  };
}

async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
    return;
  }

  try {
    const defaultSettings = getDefaultSettings();

    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: defaultSettings
    });

    if (response.success) {
      currentSettings = defaultSettings;
      populateSettings(defaultSettings);
      showNotification('Settings reset to defaults', 'success');
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error resetting settings:', error);
    showNotification('Failed to reset settings', 'error');
  }
}

async function exportData() {
  try {
    const [settingsResponse, analyticsResponse] = await Promise.all([
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
      chrome.runtime.sendMessage({ type: 'GET_ANALYTICS' })
    ]);

    const exportData = {
      settings: settingsResponse.success ? settingsResponse.data : {},
      analytics: analyticsResponse.success ? analyticsResponse.data : [],
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-automation-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    showNotification('Data exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting data:', error);
    showNotification('Failed to export data', 'error');
  }
}

async function clearAnalytics() {
  if (!confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
    return;
  }

  try {
    await chrome.storage.local.remove('analytics');
    showNotification('Analytics data cleared', 'success');
  } catch (error) {
    console.error('Error clearing analytics:', error);
    showNotification('Failed to clear analytics', 'error');
  }
}

async function clearAllData() {
  if (
    !confirm(
      'Are you sure you want to clear ALL extension data? This will remove all settings, analytics, and other data. This cannot be undone.'
    )
  ) {
    return;
  }

  // Double confirmation for destructive action
  if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
    return;
  }

  try {
    await chrome.storage.local.clear();
    showNotification('All data cleared. Please reload the extension.', 'success');

    // Reload the page after a delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error('Error clearing all data:', error);
    showNotification('Failed to clear data', 'error');
  }
}

function showNotification(message, type = 'info') {
  const notificationDiv = document.createElement('div');

  const bgColor =
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  notificationDiv.className = `fixed top-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50 transition-all duration-300`;
  notificationDiv.textContent = message;

  document.body.appendChild(notificationDiv);

  // Animate in
  setTimeout(() => {
    notificationDiv.style.transform = 'translateX(0)';
    notificationDiv.style.opacity = '1';
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notificationDiv.style.transform = 'translateX(100%)';
    notificationDiv.style.opacity = '0';
    setTimeout(() => {
      if (notificationDiv.parentNode) {
        notificationDiv.parentNode.removeChild(notificationDiv);
      }
    }, 300);
  }, 3000);
}
