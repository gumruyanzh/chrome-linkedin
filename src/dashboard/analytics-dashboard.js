// Interactive Analytics Dashboard for LinkedIn Automation

import { createAnalyticsEngine, ANALYTICS_TYPES } from '../utils/analytics-engine.js';
import { getStorageData, STORAGE_KEYS } from '../utils/storage.js';

class AnalyticsDashboard {
  constructor() {
    this.analyticsEngine = createAnalyticsEngine();
    this.charts = {};
    this.currentData = null;
    this.dateRange = { days: 30 };
    this.chartPeriod = 'day';

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setLastUpdated();
    await this.loadData();
    this.renderDashboard();

    // Auto-refresh every 5 minutes
    setInterval(
      () => {
        this.loadData(true);
      },
      5 * 60 * 1000
    );
  }

  setupEventListeners() {
    // Date range selection
    document.getElementById('date-range').addEventListener('change', e => {
      const value = e.target.value;
      if (value === 'custom') {
        this.showDateRangeModal();
      } else {
        this.dateRange = { days: parseInt(value) };
        this.loadData();
      }
    });

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.loadData(true);
    });

    // Chart period buttons
    document.querySelectorAll('.chart-period-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.chartPeriod = e.target.dataset.period;
        this.updateChartPeriodButtons();
        this.updateTimeSeriesCharts();
      });
    });

    // Export buttons
    document.getElementById('export-csv').addEventListener('click', () => this.exportData('csv'));
    document.getElementById('export-json').addEventListener('click', () => this.exportData('json'));
    document.getElementById('export-pdf').addEventListener('click', () => this.exportData('pdf'));

    // Custom date range modal
    document.getElementById('cancel-date-range').addEventListener('click', () => {
      this.hideDateRangeModal();
    });

    document.getElementById('apply-date-range').addEventListener('click', () => {
      const startDate = document.getElementById('start-date').value;
      const endDate = document.getElementById('end-date').value;

      if (startDate && endDate) {
        this.dateRange = {
          startDate: new Date(startDate).getTime(),
          endDate: new Date(endDate).getTime()
        };
        this.hideDateRangeModal();
        this.loadData();
      }
    });
  }

  showDateRangeModal() {
    document.getElementById('date-range-modal').classList.remove('hidden');

    // Set default dates
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
  }

  hideDateRangeModal() {
    document.getElementById('date-range-modal').classList.add('hidden');
  }

  updateChartPeriodButtons() {
    document.querySelectorAll('.chart-period-btn').forEach(btn => {
      if (btn.dataset.period === this.chartPeriod) {
        btn.className = 'chart-period-btn text-sm px-3 py-1 rounded-md bg-blue-600 text-white';
      } else {
        btn.className =
          'chart-period-btn text-sm px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100';
      }
    });
  }

  async loadData(showLoading = false) {
    if (showLoading) {
      document.getElementById('loading-overlay').classList.remove('hidden');
    }

    try {
      const options = {
        includeRealTime: true,
        groupBy: this.chartPeriod
      };

      if (this.dateRange.days) {
        options.startDate = Date.now() - this.dateRange.days * 24 * 60 * 60 * 1000;
        options.endDate = Date.now();
      } else {
        options.startDate = this.dateRange.startDate;
        options.endDate = this.dateRange.endDate;
      }

      this.currentData = await this.analyticsEngine.calculateAnalytics(options);
      this.renderDashboard();
    } catch (error) {
      console.error('Error loading analytics data:', error);
      this.showError('Failed to load analytics data. Please try again.');
    } finally {
      if (showLoading) {
        document.getElementById('loading-overlay').classList.add('hidden');
      }
    }
  }

  renderDashboard() {
    if (!this.currentData) {
      return;
    }

    this.renderSummaryCards();
    this.renderCharts();
    this.renderInsights();
    this.renderRecommendations();
    this.renderTables();
    this.setLastUpdated();
  }

  renderSummaryCards() {
    const { summary } = this.currentData;

    // Total Connections
    document.getElementById('total-connections').textContent =
      summary.totalConnections.toLocaleString();
    this.renderChangeIndicator(
      'connections-change',
      summary.totalConnections,
      'connections this period'
    );

    // Acceptance Rate
    document.getElementById('acceptance-rate').textContent = `${summary.acceptanceRate}%`;
    this.renderChangeIndicator('acceptance-change', summary.acceptanceRate, '% acceptance rate');

    // Messages Sent
    document.getElementById('messages-sent').textContent = summary.totalMessages.toLocaleString();
    this.renderChangeIndicator('messages-change', summary.totalMessages, 'messages this period');

    // Response Rate
    document.getElementById('response-rate').textContent = `${summary.responseRate}%`;
    this.renderChangeIndicator('response-change', summary.responseRate, '% response rate');
  }

  renderChangeIndicator(elementId, currentValue, suffix) {
    // For now, just show the period info
    // In a real implementation, you'd compare with previous period
    const element = document.getElementById(elementId);
    element.textContent = suffix;
    element.className = 'text-sm text-gray-600';
  }

  renderCharts() {
    this.renderConnectionActivityChart();
    this.renderConversionFunnelChart();
    this.renderPerformanceTimeChart();
    this.renderTemplatePerformanceChart();
  }

  renderConnectionActivityChart() {
    const ctx = document.getElementById('connection-activity-chart').getContext('2d');
    const { timeSeries } = this.currentData;

    // Destroy existing chart
    if (this.charts.connectionActivity) {
      this.charts.connectionActivity.destroy();
    }

    const labels = timeSeries.connection_sent.map(point =>
      new Date(point.timestamp).toLocaleDateString()
    );

    const data = {
      labels,
      datasets: [
        {
          label: 'Connections Sent',
          data: timeSeries.connection_sent.map(point => point.value),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Connections Accepted',
          data: timeSeries.connection_accepted.map(point => point.value),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    this.charts.connectionActivity = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  renderConversionFunnelChart() {
    const ctx = document.getElementById('conversion-funnel-chart').getContext('2d');
    const { conversion } = this.currentData;

    // Destroy existing chart
    if (this.charts.conversionFunnel) {
      this.charts.conversionFunnel.destroy();
    }

    const data = {
      labels: conversion.conversionFunnel.map(stage => stage.name),
      datasets: [
        {
          label: 'Conversion Rate (%)',
          data: conversion.conversionFunnel.map(stage => stage.rate),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(249, 115, 22, 0.8)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(147, 51, 234)',
            'rgb(249, 115, 22)'
          ],
          borderWidth: 2
        }
      ]
    };

    this.charts.conversionFunnel = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function (value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  renderPerformanceTimeChart() {
    const ctx = document.getElementById('performance-time-chart').getContext('2d');
    const { performance } = this.currentData;

    // Destroy existing chart
    if (this.charts.performanceTime) {
      this.charts.performanceTime.destroy();
    }

    const labels = performance.hourlyAcceptance.map(
      hour => `${hour.hour.toString().padStart(2, '0')}:00`
    );

    const data = {
      labels,
      datasets: [
        {
          label: 'Acceptance Rate by Hour',
          data: performance.hourlyAcceptance.map(hour => hour.rate),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    this.charts.performanceTime = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  renderTemplatePerformanceChart() {
    const ctx = document.getElementById('template-performance-chart').getContext('2d');
    const { templates } = this.currentData;

    // Destroy existing chart
    if (this.charts.templatePerformance) {
      this.charts.templatePerformance.destroy();
    }

    // Take top 5 templates
    const topTemplates = templates.templatePerformance.slice(0, 5);

    const data = {
      labels: topTemplates.map(template => template.name || 'Unknown'),
      datasets: [
        {
          label: 'Usage Count',
          data: topTemplates.map(template => template.usage),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Acceptance Rate (%)',
          data: topTemplates.map(template => template.acceptanceRate),
          backgroundColor: 'rgba(249, 115, 22, 0.8)',
          borderColor: 'rgb(249, 115, 22)',
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    };

    this.charts.templatePerformance = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            max: 100,
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              callback: function (value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  renderInsights() {
    const container = document.getElementById('insights-container');
    const { insights } = this.currentData.insights;

    container.innerHTML = '';

    if (insights.length === 0) {
      container.innerHTML =
        '<p class="text-gray-500 italic">No insights available for this period.</p>';
      return;
    }

    insights.forEach(insight => {
      const insightElement = document.createElement('div');
      insightElement.className = `p-3 rounded-lg border-l-4 ${this.getInsightColor(insight.type)}`;

      insightElement.innerHTML = `
        <h4 class="font-medium text-gray-900">${insight.title}</h4>
        <p class="text-sm text-gray-600 mt-1">${insight.description}</p>
      `;

      container.appendChild(insightElement);
    });
  }

  renderRecommendations() {
    const container = document.getElementById('recommendations-container');
    const { recommendations } = this.currentData.insights;

    container.innerHTML = '';

    if (recommendations.length === 0) {
      container.innerHTML = '<p class="text-gray-500 italic">No recommendations available.</p>';
      return;
    }

    recommendations.forEach(recommendation => {
      const recElement = document.createElement('div');
      recElement.className = 'p-3 bg-blue-50 rounded-lg border border-blue-200';

      recElement.innerHTML = `
        <h4 class="font-medium text-blue-900">${recommendation.title}</h4>
        <p class="text-sm text-blue-700 mt-1">${recommendation.description}</p>
      `;

      container.appendChild(recElement);
    });
  }

  renderTables() {
    this.renderCampaignTable();
    this.renderTemplateTable();
  }

  renderCampaignTable() {
    const tbody = document.getElementById('campaign-performance-table');
    const { campaigns } = this.currentData;

    tbody.innerHTML = '';

    if (campaigns.campaignPerformance.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No campaign data available</td></tr>';
      return;
    }

    campaigns.campaignPerformance.forEach(campaign => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${campaign.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${campaign.connections}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${campaign.acceptanceRate.toFixed(1)}%</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusColor(campaign.status)}">
            ${campaign.status}
          </span>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  renderTemplateTable() {
    const tbody = document.getElementById('template-analytics-table');
    const { templates } = this.currentData;

    tbody.innerHTML = '';

    if (templates.templatePerformance.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No template data available</td></tr>';
      return;
    }

    templates.templatePerformance.slice(0, 10).forEach(template => {
      const row = document.createElement('tr');
      const trend = this.calculateTemplateTrend(template);

      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${template.name || 'Unknown'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${template.usage}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${template.acceptanceRate.toFixed(1)}%</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          <i class="fas ${trend.icon} ${trend.color}"></i>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  updateTimeSeriesCharts() {
    this.renderConnectionActivityChart();
  }

  getInsightColor(type) {
    switch (type) {
      case 'positive':
        return 'border-green-400 bg-green-50';
      case 'warning':
        return 'border-yellow-400 bg-yellow-50';
      case 'negative':
        return 'border-red-400 bg-red-50';
      default:
        return 'border-blue-400 bg-blue-50';
    }
  }

  getStatusColor(status) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  calculateTemplateTrend(template) {
    // Simplified trend calculation
    if (template.acceptanceRate > 30) {
      return { icon: 'fa-arrow-up', color: 'text-green-500' };
    } else if (template.acceptanceRate > 15) {
      return { icon: 'fa-minus', color: 'text-yellow-500' };
    } else {
      return { icon: 'fa-arrow-down', color: 'text-red-500' };
    }
  }

  async exportData(format) {
    try {
      const data = this.currentData;
      const timestamp = new Date().toISOString().split('T')[0];

      switch (format) {
        case 'csv':
          this.exportCSV(data, `analytics-${timestamp}.csv`);
          break;
        case 'json':
          this.exportJSON(data, `analytics-${timestamp}.json`);
          break;
        case 'pdf':
          this.exportPDF(data, `analytics-report-${timestamp}.pdf`);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showError('Failed to export data. Please try again.');
    }
  }

  exportCSV(data, filename) {
    // Convert summary data to CSV
    const csv = [
      ['Metric', 'Value'],
      ['Total Connections', data.summary.totalConnections],
      ['Accepted Connections', data.summary.acceptedConnections],
      ['Acceptance Rate', `${data.summary.acceptanceRate}%`],
      ['Total Messages', data.summary.totalMessages],
      ['Response Rate', `${data.summary.responseRate}%`],
      ['Average Connections/Day', data.summary.averageConnectionsPerDay],
      ['Average Messages/Day', data.summary.averageMessagesPerDay]
    ];

    const csvContent = csv.map(row => row.join(',')).join('\n');
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  exportJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  exportPDF(data, filename) {
    // Simplified PDF export - in a real implementation, you'd use a library like jsPDF
    const textContent = `
Analytics Report
Generated: ${new Date().toLocaleString()}

Summary:
- Total Connections: ${data.summary.totalConnections}
- Acceptance Rate: ${data.summary.acceptanceRate}%
- Total Messages: ${data.summary.totalMessages}
- Response Rate: ${data.summary.responseRate}%

Key Insights:
${data.insights.insights.map(insight => `- ${insight.title}: ${insight.description}`).join('\n')}

Recommendations:
${data.insights.recommendations.map(rec => `- ${rec.title}: ${rec.description}`).join('\n')}
    `;

    this.downloadFile(textContent, filename, 'text/plain');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  setLastUpdated() {
    document.getElementById('last-updated').textContent = new Date().toLocaleString();
  }

  showError(message) {
    // Simple error notification
    const notification = document.createElement('div');
    notification.className =
      'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
    notification.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm">${message}</p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AnalyticsDashboard();
});
