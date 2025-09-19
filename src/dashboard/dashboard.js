// Dashboard JavaScript for LinkedIn Automation Extension

document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
  try {
    await loadDashboardData();
    setupEventListeners();
    await loadRecentActivity();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showError('Failed to load dashboard data');
  }
}

function setupEventListeners() {
  document.getElementById('refresh-data').addEventListener('click', refreshDashboard);
  document.getElementById('open-settings').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
  });
  document.getElementById('open-analytics').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/analytics-dashboard.html') });
  });
  document.getElementById('open-bulk').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/bulk-dashboard.html') });
  });
}

async function loadDashboardData() {
  try {
    // Get analytics data from background script
    const response = await chrome.runtime.sendMessage({ type: 'GET_ANALYTICS' });

    if (response.success && response.data) {
      const analytics = response.data;
      calculateAndDisplayStats(analytics);
    } else {
      console.error('Failed to load analytics:', response.error);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

function calculateAndDisplayStats(analytics) {
  const today = new Date().toDateString();

  // Calculate connections sent
  const connectionsSent = analytics.filter(event => event.type === 'connection_sent').length;

  // Calculate connections accepted
  const connectionsAccepted = analytics.filter(
    event => event.type === 'connection_accepted'
  ).length;

  // Calculate acceptance rate
  const acceptanceRate =
    connectionsSent > 0 ? ((connectionsAccepted / connectionsSent) * 100).toFixed(1) : 0;

  // Count active campaigns (placeholder)
  const activeCampaigns = 1; // This would come from actual campaign data

  // Update UI
  document.getElementById('connections-sent').textContent = connectionsSent;
  document.getElementById('connections-accepted').textContent = connectionsAccepted;
  document.getElementById('acceptance-rate').textContent = acceptanceRate + '%';
  document.getElementById('active-campaigns').textContent = activeCampaigns;
}

async function loadRecentActivity() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ANALYTICS' });

    if (response.success && response.data) {
      const analytics = response.data;
      displayRecentActivity(analytics.slice(-10)); // Show last 10 activities
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
    document.getElementById('recent-activity').innerHTML =
      '<div class="text-red-500 text-center py-4">Failed to load recent activity</div>';
  }
}

function displayRecentActivity(activities) {
  const container = document.getElementById('recent-activity');

  if (activities.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center py-4">No recent activity</div>';
    return;
  }

  const activityHtml = activities
    .reverse()
    .map(activity => {
      const date = new Date(activity.timestamp).toLocaleString();
      const icon = getActivityIcon(activity.type);
      const description = getActivityDescription(activity);

      return `
            <div class="flex items-center p-3 border border-gray-200 rounded-lg">
                <div class="flex-shrink-0">
                    ${icon}
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-900">${description}</p>
                    <p class="text-xs text-gray-500">${date}</p>
                </div>
            </div>
        `;
    })
    .join('');

  container.innerHTML = activityHtml;
}

function getActivityIcon(type) {
  switch (type) {
  case 'connection_sent':
      return '<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z"/></svg></div>';
    case 'connection_accepted':
    return '<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></div>';
    case 'automation_started':
    return '<div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/></svg></div>';
  case 'automation_stopped':
      return '<div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"/></svg></div>';
    default:
    return '<div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg></div>';
  }
}

function getActivityDescription(activity) {
  switch (activity.type) {
  case 'connection_sent':
    return 'Connection request sent';
    case 'connection_accepted':
    return 'Connection request accepted';
    case 'automation_started':
    return 'Automation started';
  case 'automation_stopped':
    return 'Automation stopped';
    case 'search_performed':
    return `Search performed - ${activity.resultsFound || 0} results found`;
  default:
      return `${activity.type.replace('_', ' ').toUpperCase()} event`;
  }
}

async function refreshDashboard() {
  const button = document.getElementById('refresh-data');
  const originalText = button.textContent;

  button.textContent = 'Refreshing...';
  button.disabled = true;

  try {
    await loadDashboardData();
    await loadRecentActivity();

    // Show success feedback
    button.textContent = 'Refreshed!';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1000);
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
    button.textContent = 'Error';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1000);
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg text-sm z-50';
  errorDiv.textContent = message;

  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}
