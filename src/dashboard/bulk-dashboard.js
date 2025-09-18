// Bulk Connection Dashboard - Task 3.3
// Dashboard for managing large-scale connection campaigns

import { getStorageData, setStorageData, STORAGE_KEYS } from '../utils/storage.js';
import { getMessageTemplates } from '../utils/message-templates.js';
import { getAnalyticsSummary } from '../utils/analytics.js';

// Dashboard state
let currentCampaigns = [];
let selectedCampaigns = [];
let currentView = 'grid';
let currentFilter = {
  search: '',
  status: 'all',
  date: 'all'
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
  try {
    await loadDashboardData();
    setupEventListeners();
    renderDashboard();
    startRealTimeUpdates();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showError('Failed to initialize dashboard');
  }
}

async function loadDashboardData() {
  try {
    // Load campaigns
    const campaignData = await getStorageData(STORAGE_KEYS.CAMPAIGNS);
    currentCampaigns = campaignData.campaigns || [];

    // Load analytics summary
    const analyticsData = await getAnalyticsSummary(1); // Today's data
    updateQuickStats(analyticsData);

    // Load message templates for campaign creation
    const templates = await getMessageTemplates();
    populateTemplateSelector(templates);

  } catch (error) {
    console.error('Error loading dashboard data:', error);
    currentCampaigns = [];
  }
}

function setupEventListeners() {
  // Modal controls
  document.getElementById('create-campaign-btn').addEventListener('click', openCreateCampaignModal);
  document.getElementById('close-modal').addEventListener('click', closeCreateCampaignModal);
  document.getElementById('cancel-campaign').addEventListener('click', closeCreateCampaignModal);

  // Campaign form
  document.getElementById('campaign-form').addEventListener('submit', handleCreateCampaign);

  // Search and filters
  document.getElementById('search-campaigns').addEventListener('input', handleSearchChange);
  document.getElementById('status-filter').addEventListener('change', handleFilterChange);
  document.getElementById('date-filter').addEventListener('change', handleFilterChange);

  // View toggles
  document.getElementById('grid-view').addEventListener('click', () => switchView('grid'));
  document.getElementById('list-view').addEventListener('click', () => switchView('list'));

  // Bulk actions
  document.getElementById('bulk-actions-btn').addEventListener('click', toggleBulkActionsMenu);
  document.addEventListener('click', closeBulkActionsOnOutsideClick);

  // Schedule radio buttons
  document.getElementById('start-now').addEventListener('change', toggleScheduleDateTime);
  document.getElementById('start-later').addEventListener('change', toggleScheduleDateTime);

  // Campaign details modal
  document.getElementById('close-details-modal').addEventListener('click', closeCampaignDetailsModal);
}

function renderDashboard() {
  const filteredCampaigns = applyFilters(currentCampaigns);

  // Show/hide loading and empty states
  document.getElementById('loading-state').classList.add('hidden');

  if (filteredCampaigns.length === 0) {
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('campaigns-grid').classList.add('hidden');
    document.getElementById('campaigns-list').classList.add('hidden');
    return;
  }

  document.getElementById('empty-state').classList.add('hidden');

  // Render campaigns in current view
  if (currentView === 'grid') {
    renderCampaignsGrid(filteredCampaigns);
  } else {
    renderCampaignsList(filteredCampaigns);
  }
}

function renderCampaignsGrid(campaigns) {
  const grid = document.getElementById('campaigns-grid');
  const list = document.getElementById('campaigns-list');

  grid.classList.remove('hidden');
  list.classList.add('hidden');

  grid.innerHTML = campaigns.map(campaign => createCampaignCard(campaign)).join('');

  // Add event listeners to campaign cards
  campaigns.forEach(campaign => {
    const card = document.querySelector(`[data-campaign-id="${campaign.id}"]`);
    if (card) {
      setupCampaignCardEvents(card, campaign);
    }
  });
}

function renderCampaignsList(campaigns) {
  const grid = document.getElementById('campaigns-grid');
  const list = document.getElementById('campaigns-list');

  grid.classList.add('hidden');
  list.classList.remove('hidden');

  list.innerHTML = campaigns.map(campaign => createCampaignListItem(campaign)).join('');

  // Add event listeners to campaign list items
  campaigns.forEach(campaign => {
    const item = document.querySelector(`[data-campaign-id="${campaign.id}"]`);
    if (item) {
      setupCampaignCardEvents(item, campaign);
    }
  });
}

function createCampaignCard(campaign) {
  const progress = calculateCampaignProgress(campaign);
  const statusColor = getStatusColor(campaign.status);
  const statusIcon = getStatusIcon(campaign.status);

  return `
    <div class="campaign-card bg-white rounded-lg border border-gray-200 p-6 cursor-pointer" data-campaign-id="${campaign.id}">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">${escapeHtml(campaign.name)}</h3>
          <div class="flex items-center space-x-2 mb-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">
              ${statusIcon} ${campaign.status}
            </span>
            <span class="text-xs text-gray-500">${formatDate(campaign.createdAt)}</span>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button class="campaign-pause-btn p-1 text-gray-400 hover:text-gray-600" data-campaign-id="${campaign.id}" title="${campaign.status === 'active' ? 'Pause' : 'Resume'}">
            ${campaign.status === 'active' ?
              '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' :
              '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 4H7a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z"></path></svg>'
            }
          </button>
          <button class="campaign-menu-btn p-1 text-gray-400 hover:text-gray-600" data-campaign-id="${campaign.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mb-4">
        <div class="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>${progress.percentage}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="progress-bar bg-blue-600 h-2 rounded-full" style="width: ${progress.percentage}%"></div>
        </div>
      </div>

      <!-- Campaign Stats -->
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">${campaign.stats.sent || 0}</div>
          <div class="text-xs text-gray-500">Sent</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">${campaign.stats.accepted || 0}</div>
          <div class="text-xs text-gray-500">Accepted</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600">${campaign.stats.pending || 0}</div>
          <div class="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      <!-- Target Info -->
      <div class="border-t border-gray-200 pt-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Target:</span>
          <span class="font-medium">${formatTargetAudience(campaign.targetAudience)}</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-1">
          <span class="text-gray-600">Daily Limit:</span>
          <span class="font-medium">${campaign.settings.dailyLimit}</span>
        </div>
      </div>
    </div>
  `;
}

function createCampaignListItem(campaign) {
  const progress = calculateCampaignProgress(campaign);
  const statusColor = getStatusColor(campaign.status);
  const statusIcon = getStatusIcon(campaign.status);

  return `
    <div class="campaign-card bg-white rounded-lg border border-gray-200 p-4 cursor-pointer" data-campaign-id="${campaign.id}">
      <div class="flex items-center space-x-4">
        <div class="flex-shrink-0">
          <input type="checkbox" class="campaign-checkbox rounded border-gray-300 text-blue-600" value="${campaign.id}">
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 truncate">${escapeHtml(campaign.name)}</h3>
              <div class="flex items-center space-x-4 mt-1">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                  ${statusIcon} ${campaign.status}
                </span>
                <span class="text-sm text-gray-500">${formatDate(campaign.createdAt)}</span>
                <span class="text-sm text-gray-600">${formatTargetAudience(campaign.targetAudience)}</span>
              </div>
            </div>

            <div class="flex items-center space-x-6">
              <!-- Stats -->
              <div class="flex items-center space-x-4 text-sm">
                <div class="text-center">
                  <div class="font-bold text-blue-600">${campaign.stats.sent || 0}</div>
                  <div class="text-xs text-gray-500">Sent</div>
                </div>
                <div class="text-center">
                  <div class="font-bold text-green-600">${campaign.stats.accepted || 0}</div>
                  <div class="text-xs text-gray-500">Accepted</div>
                </div>
                <div class="text-center">
                  <div class="font-bold text-orange-600">${campaign.stats.pending || 0}</div>
                  <div class="text-xs text-gray-500">Pending</div>
                </div>
              </div>

              <!-- Progress -->
              <div class="w-24">
                <div class="text-xs text-gray-600 text-right mb-1">${progress.percentage}%</div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="progress-bar bg-blue-600 h-2 rounded-full" style="width: ${progress.percentage}%"></div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center space-x-2">
                <button class="campaign-pause-btn p-2 text-gray-400 hover:text-gray-600" data-campaign-id="${campaign.id}">
                  ${campaign.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button class="campaign-menu-btn p-2 text-gray-400 hover:text-gray-600" data-campaign-id="${campaign.id}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupCampaignCardEvents(element, campaign) {
  // Click to view details
  element.addEventListener('click', (e) => {
    if (!e.target.closest('button') && !e.target.closest('input')) {
      openCampaignDetails(campaign);
    }
  });

  // Pause/Resume button
  const pauseBtn = element.querySelector('.campaign-pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCampaignStatus(campaign.id);
    });
  }

  // Menu button
  const menuBtn = element.querySelector('.campaign-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showCampaignMenu(campaign.id, e.target);
    });
  }

  // Checkbox
  const checkbox = element.querySelector('.campaign-checkbox');
  if (checkbox) {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedCampaigns.push(campaign.id);
      } else {
        selectedCampaigns = selectedCampaigns.filter(id => id !== campaign.id);
      }
      updateBulkActionsButton();
    });
  }
}

// Campaign Management Functions

async function handleCreateCampaign(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const campaignData = {
    id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: formData.get('name'),
    targetAudience: {
      keywords: formData.get('keywords'),
      location: formData.get('location'),
      company: formData.get('company'),
      industry: formData.get('industry')
    },
    messageTemplate: formData.get('messageTemplate'),
    settings: {
      dailyLimit: parseInt(formData.get('dailyLimit')),
      delayBetween: parseInt(formData.get('delayBetween')),
      workingHours: formData.get('workingHours') === 'on',
      weekendMode: formData.get('weekendMode') === 'on'
    },
    schedule: {
      type: formData.get('schedule'),
      startDateTime: formData.get('schedule') === 'later' ? formData.get('startDateTime') : null
    },
    status: formData.get('schedule') === 'now' ? 'active' : 'scheduled',
    createdAt: Date.now(),
    stats: {
      sent: 0,
      accepted: 0,
      declined: 0,
      pending: 0
    }
  };

  try {
    // Validate campaign data
    const validation = validateCampaignData(campaignData);
    if (!validation.isValid) {
      showError(`Campaign validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    // Save campaign
    currentCampaigns.push(campaignData);
    await saveCampaigns();

    // Start campaign if immediate
    if (campaignData.status === 'active') {
      await startCampaign(campaignData.id);
    }

    closeCreateCampaignModal();
    renderDashboard();
    showSuccess('Campaign created successfully');

  } catch (error) {
    console.error('Error creating campaign:', error);
    showError('Failed to create campaign');
  }
}

async function toggleCampaignStatus(campaignId) {
  try {
    const campaign = currentCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    if (campaign.status === 'active') {
      campaign.status = 'paused';
      await pauseCampaign(campaignId);
    } else if (campaign.status === 'paused') {
      campaign.status = 'active';
      await startCampaign(campaignId);
    }

    await saveCampaigns();
    renderDashboard();

  } catch (error) {
    console.error('Error toggling campaign status:', error);
    showError('Failed to update campaign status');
  }
}

async function startCampaign(campaignId) {
  try {
    // Send message to background script to start campaign
    const response = await chrome.runtime.sendMessage({
      type: 'START_CAMPAIGN',
      campaignId: campaignId
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to start campaign');
    }

  } catch (error) {
    console.error('Error starting campaign:', error);
    throw error;
  }
}

async function pauseCampaign(campaignId) {
  try {
    // Send message to background script to pause campaign
    const response = await chrome.runtime.sendMessage({
      type: 'PAUSE_CAMPAIGN',
      campaignId: campaignId
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to pause campaign');
    }

  } catch (error) {
    console.error('Error pausing campaign:', error);
    throw error;
  }
}

// UI Event Handlers

function openCreateCampaignModal() {
  document.getElementById('create-campaign-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCreateCampaignModal() {
  document.getElementById('create-campaign-modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  document.getElementById('campaign-form').reset();
  document.getElementById('schedule-datetime').classList.add('hidden');
}

function openCampaignDetails(campaign) {
  const modal = document.getElementById('campaign-details-modal');
  const title = document.getElementById('campaign-details-title');
  const content = document.getElementById('campaign-details-content');

  title.textContent = campaign.name;
  content.innerHTML = createCampaignDetailsContent(campaign);

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCampaignDetailsModal() {
  document.getElementById('campaign-details-modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
}

function handleSearchChange(e) {
  currentFilter.search = e.target.value;
  renderDashboard();
}

function handleFilterChange(e) {
  const filterType = e.target.id.replace('-filter', '');
  currentFilter[filterType] = e.target.value;
  renderDashboard();
}

function switchView(view) {
  currentView = view;

  // Update button states
  document.getElementById('grid-view').classList.toggle('bg-gray-100', view === 'grid');
  document.getElementById('list-view').classList.toggle('bg-gray-100', view === 'list');

  renderDashboard();
}

function toggleScheduleDateTime() {
  const scheduleDateTime = document.getElementById('schedule-datetime');
  const startLater = document.getElementById('start-later').checked;

  if (startLater) {
    scheduleDateTime.classList.remove('hidden');
    document.getElementById('start-datetime').required = true;
  } else {
    scheduleDateTime.classList.add('hidden');
    document.getElementById('start-datetime').required = false;
  }
}

function toggleBulkActionsMenu() {
  const menu = document.getElementById('bulk-actions-menu');
  menu.classList.toggle('hidden');
}

function closeBulkActionsOnOutsideClick(e) {
  const menu = document.getElementById('bulk-actions-menu');
  const button = document.getElementById('bulk-actions-btn');

  if (!menu.contains(e.target) && !button.contains(e.target)) {
    menu.classList.add('hidden');
  }
}

// Utility Functions

function applyFilters(campaigns) {
  return campaigns.filter(campaign => {
    // Search filter
    if (currentFilter.search) {
      const searchTerm = currentFilter.search.toLowerCase();
      const campaignText = `${campaign.name} ${formatTargetAudience(campaign.targetAudience)}`.toLowerCase();
      if (!campaignText.includes(searchTerm)) {
        return false;
      }
    }

    // Status filter
    if (currentFilter.status !== 'all' && campaign.status !== currentFilter.status) {
      return false;
    }

    // Date filter
    if (currentFilter.date !== 'all') {
      const campaignDate = new Date(campaign.createdAt);
      const now = new Date();

      switch (currentFilter.date) {
        case 'today':
          if (campaignDate.toDateString() !== now.toDateString()) {
            return false;
          }
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (campaignDate < weekAgo) {
            return false;
          }
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          if (campaignDate < monthAgo) {
            return false;
          }
          break;
      }
    }

    return true;
  });
}

function calculateCampaignProgress(campaign) {
  const totalTargets = campaign.stats.sent + campaign.stats.pending + campaign.stats.accepted + campaign.stats.declined;
  const completed = campaign.stats.sent + campaign.stats.accepted + campaign.stats.declined;

  if (totalTargets === 0) {
    return { percentage: 0, completed: 0, total: 0 };
  }

  return {
    percentage: Math.round((completed / totalTargets) * 100),
    completed,
    total: totalTargets
  };
}

function getStatusColor(status) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    scheduled: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800'
  };
  return colors[status] || colors.scheduled;
}

function getStatusIcon(status) {
  const icons = {
    active: '🟢',
    paused: '⏸️',
    completed: '✅',
    scheduled: '📅',
    failed: '❌'
  };
  return icons[status] || '📅';
}

function formatTargetAudience(audience) {
  const parts = [];
  if (audience.keywords) parts.push(audience.keywords);
  if (audience.location) parts.push(audience.location);
  if (audience.company) parts.push(audience.company);
  if (audience.industry) parts.push(audience.industry);

  return parts.join(' • ') || 'All LinkedIn users';
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

function validateCampaignData(data) {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Campaign name is required');
  }

  if (!data.targetAudience.keywords && !data.targetAudience.location &&
      !data.targetAudience.company && !data.targetAudience.industry) {
    errors.push('At least one targeting criterion is required');
  }

  if (!data.messageTemplate) {
    errors.push('Message template is required');
  }

  if (data.settings.dailyLimit < 1 || data.settings.dailyLimit > 100) {
    errors.push('Daily limit must be between 1 and 100');
  }

  if (data.settings.delayBetween < 5 || data.settings.delayBetween > 600) {
    errors.push('Delay between requests must be between 5 and 600 seconds');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function createCampaignDetailsContent(campaign) {
  const progress = calculateCampaignProgress(campaign);

  return `
    <div class="space-y-6">
      <!-- Campaign Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-blue-50 rounded-lg p-4">
          <div class="text-2xl font-bold text-blue-600">${campaign.stats.sent || 0}</div>
          <div class="text-sm text-blue-800">Connections Sent</div>
        </div>
        <div class="bg-green-50 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-600">${campaign.stats.accepted || 0}</div>
          <div class="text-sm text-green-800">Accepted</div>
        </div>
        <div class="bg-orange-50 rounded-lg p-4">
          <div class="text-2xl font-bold text-orange-600">${campaign.stats.pending || 0}</div>
          <div class="text-sm text-orange-800">Pending</div>
        </div>
        <div class="bg-red-50 rounded-lg p-4">
          <div class="text-2xl font-bold text-red-600">${campaign.stats.declined || 0}</div>
          <div class="text-sm text-red-800">Declined</div>
        </div>
      </div>

      <!-- Progress -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Campaign Progress</h3>
        <div class="flex justify-between text-sm text-gray-600 mb-2">
          <span>Overall Progress</span>
          <span>${progress.percentage}% complete</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div class="bg-blue-600 h-3 rounded-full transition-all duration-300" style="width: ${progress.percentage}%"></div>
        </div>
      </div>

      <!-- Campaign Settings -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Target Audience</h3>
          <div class="space-y-2 text-sm">
            ${campaign.targetAudience.keywords ? `<div><span class="text-gray-600">Keywords:</span> ${campaign.targetAudience.keywords}</div>` : ''}
            ${campaign.targetAudience.location ? `<div><span class="text-gray-600">Location:</span> ${campaign.targetAudience.location}</div>` : ''}
            ${campaign.targetAudience.company ? `<div><span class="text-gray-600">Company:</span> ${campaign.targetAudience.company}</div>` : ''}
            ${campaign.targetAudience.industry ? `<div><span class="text-gray-600">Industry:</span> ${campaign.targetAudience.industry}</div>` : ''}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
          <div class="space-y-2 text-sm">
            <div><span class="text-gray-600">Daily Limit:</span> ${campaign.settings.dailyLimit}</div>
            <div><span class="text-gray-600">Delay Between:</span> ${campaign.settings.delayBetween}s</div>
            <div><span class="text-gray-600">Working Hours:</span> ${campaign.settings.workingHours ? 'Yes' : 'No'}</div>
            <div><span class="text-gray-600">Weekend Mode:</span> ${campaign.settings.weekendMode ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Export Data</button>
        <button class="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50" onclick="editCampaign('${campaign.id}')">Edit Campaign</button>
        <button class="px-4 py-2 ${campaign.status === 'active' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg" onclick="toggleCampaignStatus('${campaign.id}')">
          ${campaign.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
        </button>
      </div>
    </div>
  `;
}

async function populateTemplateSelector(templates) {
  const selector = document.getElementById('message-template');

  // Clear existing options except the first one
  while (selector.children.length > 1) {
    selector.removeChild(selector.lastChild);
  }

  // Add template options
  templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.name;
    selector.appendChild(option);
  });
}

function updateQuickStats(analyticsData) {
  if (analyticsData) {
    document.getElementById('total-sent').textContent = analyticsData.connectionsSent || 0;
    document.getElementById('total-accepted').textContent = analyticsData.connectionsAccepted || 0;
  }

  // Update active campaigns count
  const activeCampaigns = currentCampaigns.filter(c => c.status === 'active').length;
  document.getElementById('active-campaigns').textContent = activeCampaigns;
}

function updateBulkActionsButton() {
  const button = document.getElementById('bulk-actions-btn');
  const count = selectedCampaigns.length;

  if (count > 0) {
    button.textContent = `Bulk Actions (${count})`;
    button.classList.add('bg-blue-50', 'border-blue-300', 'text-blue-700');
  } else {
    button.textContent = 'Bulk Actions';
    button.classList.remove('bg-blue-50', 'border-blue-300', 'text-blue-700');
  }
}

async function saveCampaigns() {
  try {
    await setStorageData({
      [STORAGE_KEYS.CAMPAIGNS]: currentCampaigns
    });
  } catch (error) {
    console.error('Error saving campaigns:', error);
    throw error;
  }
}

function startRealTimeUpdates() {
  // Update dashboard every 30 seconds
  setInterval(async () => {
    try {
      await loadDashboardData();
      renderDashboard();
    } catch (error) {
      console.error('Error updating dashboard:', error);
    }
  }, 30000);
}

// Utility functions
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function showError(message) {
  // Simple error notification - could be enhanced with a proper notification system
  alert(`Error: ${message}`);
}

function showSuccess(message) {
  // Simple success notification - could be enhanced with a proper notification system
  console.log(`Success: ${message}`);
}

// Make functions available globally for inline event handlers
window.toggleCampaignStatus = toggleCampaignStatus;
window.editCampaign = function(campaignId) {
  console.log('Edit campaign:', campaignId);
  // Implementation would open edit modal
};