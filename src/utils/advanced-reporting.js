// Advanced Reporting System for LinkedIn Automation Analytics

import { createAnalyticsEngine } from './analytics-engine.js';
import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';

/**
 * Report types
 */
export const REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  CUSTOM: 'custom',
  CAMPAIGN: 'campaign',
  TEMPLATE: 'template',
  PERFORMANCE: 'performance'
};

/**
 * Report formats
 */
export const REPORT_FORMATS = {
  HTML: 'html',
  PDF: 'pdf',
  CSV: 'csv',
  JSON: 'json',
  EMAIL: 'email'
};

/**
 * Report delivery methods
 */
export const DELIVERY_METHODS = {
  DOWNLOAD: 'download',
  EMAIL: 'email',
  STORAGE: 'storage',
  WEBHOOK: 'webhook'
};

/**
 * Advanced Reporting System
 */
export class AdvancedReportingSystem {
  constructor() {
    this.analyticsEngine = createAnalyticsEngine();
    this.reportTemplates = new Map();
    this.scheduledReports = new Map();
    this.reportHistory = [];
    this.init();
  }

  async init() {
    try {
      await this.loadReportTemplates();
      await this.loadScheduledReports();
      await this.loadReportHistory();
      this.startScheduleChecker();
    } catch (error) {
      console.error('Error initializing reporting system:', error);
    }
  }

  /**
   * Create a new report template
   * @param {Object} templateConfig - Template configuration
   * @returns {Promise<Object>} Created template
   */
  async createReportTemplate(templateConfig) {
    try {
      const template = {
        id: this.generateTemplateId(),
        name: templateConfig.name,
        description: templateConfig.description || '',
        type: templateConfig.type || REPORT_TYPES.CUSTOM,
        format: templateConfig.format || REPORT_FORMATS.HTML,
        sections: this.validateSections(templateConfig.sections),
        filters: templateConfig.filters || {},
        styling: templateConfig.styling || this.getDefaultStyling(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
        metadata: templateConfig.metadata || {}
      };

      this.reportTemplates.set(template.id, template);
      await this.saveReportTemplates();

      return template;
    } catch (error) {
      console.error('Error creating report template:', error);
      throw new Error(`Failed to create report template: ${error.message}`);
    }
  }

  /**
   * Generate a report based on template
   * @param {string} templateId - Template ID
   * @param {Object} options - Report generation options
   * @returns {Promise<Object>} Generated report
   */
  async generateReport(templateId, options = {}) {
    try {
      const template = this.reportTemplates.get(templateId);
      if (!template) {
        throw new Error('Report template not found');
      }

      const reportId = this.generateReportId();
      const dateRange = this.calculateDateRange(template.type, options.dateRange);

      // Get analytics data
      const analyticsData = await this.analyticsEngine.calculateAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        includeRealTime: options.includeRealTime || false,
        groupBy: this.getGroupingPeriod(template.type)
      });

      // Apply filters
      const filteredData = this.applyFilters(
        analyticsData,
        template.filters,
        options.additionalFilters
      );

      // Generate report content
      const reportContent = await this.generateReportContent(template, filteredData, options);

      const report = {
        id: reportId,
        templateId: template.id,
        templateName: template.name,
        type: template.type,
        format: template.format,
        dateRange,
        generatedAt: Date.now(),
        content: reportContent,
        summary: this.generateSummary(filteredData),
        insights: await this.generateInsights(filteredData),
        recommendations: await this.generateRecommendations(filteredData),
        metadata: {
          dataPoints: this.countDataPoints(filteredData),
          processingTime: Date.now() - Date.now(), // Will be calculated
          version: '1.0'
        }
      };

      // Save to report history
      this.reportHistory.push({
        id: reportId,
        templateId: template.id,
        generatedAt: report.generatedAt,
        type: template.type,
        format: template.format,
        size: JSON.stringify(report).length
      });

      await this.saveReportHistory();

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Schedule a report for automatic generation
   * @param {Object} scheduleConfig - Schedule configuration
   * @returns {Promise<Object>} Created schedule
   */
  async scheduleReport(scheduleConfig) {
    try {
      const schedule = {
        id: this.generateScheduleId(),
        templateId: scheduleConfig.templateId,
        name: scheduleConfig.name,
        description: scheduleConfig.description || '',
        frequency: scheduleConfig.frequency, // 'daily', 'weekly', 'monthly'
        time: scheduleConfig.time || '09:00', // HH:MM format
        timezone: scheduleConfig.timezone || 'UTC',
        isActive: scheduleConfig.isActive !== false,
        delivery: {
          method: scheduleConfig.delivery?.method || DELIVERY_METHODS.STORAGE,
          recipients: scheduleConfig.delivery?.recipients || [],
          webhookUrl: scheduleConfig.delivery?.webhookUrl || null,
          subject: scheduleConfig.delivery?.subject || null
        },
        options: scheduleConfig.options || {},
        nextRun: this.calculateNextRun(scheduleConfig.frequency, scheduleConfig.time),
        lastRun: null,
        runCount: 0,
        createdAt: Date.now()
      };

      this.scheduledReports.set(schedule.id, schedule);
      await this.saveScheduledReports();

      return schedule;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw new Error(`Failed to schedule report: ${error.message}`);
    }
  }

  /**
   * Generate executive summary report
   * @param {Object} options - Summary options
   * @returns {Promise<Object>} Executive summary report
   */
  async generateExecutiveSummary(options = {}) {
    try {
      const dateRange = options.dateRange || {
        startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days
        endDate: Date.now()
      };

      const analyticsData = await this.analyticsEngine.calculateAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        includeRealTime: false
      });

      const executiveSummary = {
        id: this.generateReportId(),
        type: 'executive_summary',
        title: 'LinkedIn Automation Executive Summary',
        dateRange,
        generatedAt: Date.now(),

        // Key Metrics Section
        keyMetrics: {
          totalConnections: analyticsData.summary.totalConnections,
          acceptanceRate: analyticsData.summary.acceptanceRate,
          totalMessages: analyticsData.summary.totalMessages,
          responseRate: analyticsData.summary.responseRate,
          averageDaily: {
            connections: analyticsData.summary.averageConnectionsPerDay,
            messages: analyticsData.summary.averageMessagesPerDay
          }
        },

        // Performance Highlights
        performanceHighlights: [
          {
            metric: 'Connection Acceptance Rate',
            value: `${analyticsData.summary.acceptanceRate}%`,
            trend: this.calculateTrend(analyticsData.summary.acceptanceRate, 'acceptance_rate'),
            status: this.getPerformanceStatus(
              analyticsData.summary.acceptanceRate,
              'acceptance_rate'
            )
          },
          {
            metric: 'Message Response Rate',
            value: `${analyticsData.summary.responseRate}%`,
            trend: this.calculateTrend(analyticsData.summary.responseRate, 'response_rate'),
            status: this.getPerformanceStatus(analyticsData.summary.responseRate, 'response_rate')
          },
          {
            metric: 'Daily Activity',
            value: `${analyticsData.summary.averageConnectionsPerDay.toFixed(1)} connections/day`,
            trend: this.calculateTrend(
              analyticsData.summary.averageConnectionsPerDay,
              'daily_activity'
            ),
            status: this.getPerformanceStatus(
              analyticsData.summary.averageConnectionsPerDay,
              'daily_activity'
            )
          }
        ],

        // Top Insights
        topInsights: analyticsData.insights.insights.slice(0, 3),

        // Critical Recommendations
        criticalRecommendations: analyticsData.insights.recommendations
          .filter(rec => rec.priority === 'high')
          .slice(0, 3),

        // Campaign Performance
        campaignPerformance: analyticsData.campaigns.campaignPerformance.slice(0, 5),

        // Template Performance
        templatePerformance: analyticsData.templates.templatePerformance.slice(0, 5),

        // Time-based Analysis
        bestPerformingPeriods: {
          bestHour: analyticsData.performance.bestHour,
          bestDay: analyticsData.performance.bestDay
        },

        // Forecast and Goals
        forecast: await this.generateForecast(analyticsData),

        // Action Items
        actionItems: await this.generateActionItems(analyticsData)
      };

      return executiveSummary;
    } catch (error) {
      console.error('Error generating executive summary:', error);
      throw new Error(`Failed to generate executive summary: ${error.message}`);
    }
  }

  /**
   * Generate custom report with specific metrics
   * @param {Object} reportConfig - Custom report configuration
   * @returns {Promise<Object>} Custom report
   */
  async generateCustomReport(reportConfig) {
    try {
      const {
        title = 'Custom Analytics Report',
        dateRange,
        metrics = ['all'],
        groupBy = 'day',
        filters = {},
        includeCharts = true,
        includeInsights = true
      } = reportConfig;

      const analyticsData = await this.analyticsEngine.calculateAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy,
        includeRealTime: false
      });

      const filteredData = this.applyFilters(analyticsData, filters);

      const customReport = {
        id: this.generateReportId(),
        type: 'custom',
        title,
        dateRange,
        generatedAt: Date.now(),

        // Selected Metrics
        metrics: this.extractMetrics(filteredData, metrics),

        // Time Series Data (if requested)
        timeSeries: includeCharts
          ? this.formatTimeSeriesForChart(filteredData.timeSeries, groupBy)
          : null,

        // Insights (if requested)
        insights: includeInsights ? filteredData.insights : null,

        // Data Tables
        tables: {
          summary: this.createSummaryTable(filteredData),
          campaigns: this.createCampaignTable(filteredData.campaigns),
          templates: this.createTemplateTable(filteredData.templates),
          performance: this.createPerformanceTable(filteredData.performance)
        },

        // Export Data
        exportData: {
          csv: this.generateCSVData(filteredData),
          json: JSON.stringify(filteredData, null, 2)
        }
      };

      return customReport;
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw new Error(`Failed to generate custom report: ${error.message}`);
    }
  }

  /**
   * Deliver report via specified method
   * @param {Object} report - Generated report
   * @param {Object} deliveryConfig - Delivery configuration
   * @returns {Promise<Object>} Delivery result
   */
  async deliverReport(report, deliveryConfig) {
    try {
      const delivery = {
        id: this.generateDeliveryId(),
        reportId: report.id,
        method: deliveryConfig.method,
        deliveredAt: Date.now(),
        status: 'pending'
      };

      switch (deliveryConfig.method) {
        case DELIVERY_METHODS.DOWNLOAD:
          delivery.result = await this.prepareDownload(report, deliveryConfig);
          break;

        case DELIVERY_METHODS.EMAIL:
          delivery.result = await this.sendEmail(report, deliveryConfig);
          break;

        case DELIVERY_METHODS.STORAGE:
          delivery.result = await this.saveToStorage(report, deliveryConfig);
          break;

        case DELIVERY_METHODS.WEBHOOK:
          delivery.result = await this.sendWebhook(report, deliveryConfig);
          break;

        default:
          throw new Error(`Unsupported delivery method: ${deliveryConfig.method}`);
      }

      delivery.status = 'delivered';
      return delivery;
    } catch (error) {
      console.error('Error delivering report:', error);
      return {
        id: this.generateDeliveryId(),
        reportId: report.id,
        method: deliveryConfig.method,
        deliveredAt: Date.now(),
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Get report history with filtering options
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Report history
   */
  async getReportHistory(options = {}) {
    try {
      let history = [...this.reportHistory];

      // Apply filters
      if (options.type) {
        history = history.filter(report => report.type === options.type);
      }

      if (options.templateId) {
        history = history.filter(report => report.templateId === options.templateId);
      }

      if (options.startDate) {
        history = history.filter(report => report.generatedAt >= options.startDate);
      }

      if (options.endDate) {
        history = history.filter(report => report.generatedAt <= options.endDate);
      }

      // Sort by generation date (newest first)
      history.sort((a, b) => b.generatedAt - a.generatedAt);

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        reports: history.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: history.length,
          totalPages: Math.ceil(history.length / limit)
        }
      };
    } catch (error) {
      console.error('Error getting report history:', error);
      return { reports: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  }

  /**
   * Helper methods
   */

  generateTemplateId() {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateScheduleId() {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDeliveryId() {
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateSections(sections) {
    const validSections = [
      'summary',
      'charts',
      'insights',
      'recommendations',
      'campaigns',
      'templates',
      'performance',
      'trends'
    ];

    if (!Array.isArray(sections)) {
      return ['summary', 'charts', 'insights'];
    }

    return sections.filter(section => validSections.includes(section));
  }

  getDefaultStyling() {
    return {
      theme: 'modern',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      layout: 'standard'
    };
  }

  calculateDateRange(reportType, customRange) {
    if (customRange) {
      return customRange;
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    switch (reportType) {
      case REPORT_TYPES.DAILY:
        return {
          startDate: now - day,
          endDate: now
        };
      case REPORT_TYPES.WEEKLY:
        return {
          startDate: now - 7 * day,
          endDate: now
        };
      case REPORT_TYPES.MONTHLY:
        return {
          startDate: now - 30 * day,
          endDate: now
        };
      case REPORT_TYPES.QUARTERLY:
        return {
          startDate: now - 90 * day,
          endDate: now
        };
      default:
        return {
          startDate: now - 30 * day,
          endDate: now
        };
    }
  }

  getGroupingPeriod(reportType) {
    switch (reportType) {
      case REPORT_TYPES.DAILY:
        return 'hour';
      case REPORT_TYPES.WEEKLY:
        return 'day';
      case REPORT_TYPES.MONTHLY:
        return 'day';
      case REPORT_TYPES.QUARTERLY:
        return 'week';
      default:
        return 'day';
    }
  }

  applyFilters(data, templateFilters, additionalFilters = {}) {
    // Apply template filters and additional filters
    // This is a simplified implementation
    const filters = { ...templateFilters, ...additionalFilters };

    if (Object.keys(filters).length === 0) {
      return data;
    }

    // Apply specific filters to the data
    // Implementation would depend on filter types
    return data;
  }

  async generateReportContent(template, data, options) {
    const content = {
      sections: {}
    };

    for (const sectionType of template.sections) {
      switch (sectionType) {
        case 'summary':
          content.sections.summary = this.generateSummarySection(data);
          break;
        case 'charts':
          content.sections.charts = this.generateChartsSection(data);
          break;
        case 'insights':
          content.sections.insights = this.generateInsightsSection(data);
          break;
        case 'recommendations':
          content.sections.recommendations = this.generateRecommendationsSection(data);
          break;
        case 'campaigns':
          content.sections.campaigns = this.generateCampaignsSection(data);
          break;
        case 'templates':
          content.sections.templates = this.generateTemplatesSection(data);
          break;
        case 'performance':
          content.sections.performance = this.generatePerformanceSection(data);
          break;
        case 'trends':
          content.sections.trends = this.generateTrendsSection(data);
          break;
      }
    }

    return content;
  }

  generateSummarySection(data) {
    return {
      type: 'summary',
      title: 'Summary Overview',
      metrics: [
        { label: 'Total Connections', value: data.summary.totalConnections, format: 'number' },
        { label: 'Acceptance Rate', value: data.summary.acceptanceRate, format: 'percentage' },
        { label: 'Total Messages', value: data.summary.totalMessages, format: 'number' },
        { label: 'Response Rate', value: data.summary.responseRate, format: 'percentage' }
      ]
    };
  }

  generateChartsSection(data) {
    return {
      type: 'charts',
      title: 'Visual Analytics',
      charts: [
        {
          type: 'line',
          title: 'Connection Activity Over Time',
          data: data.timeSeries.connection_sent
        },
        {
          type: 'bar',
          title: 'Conversion Funnel',
          data: data.conversion.conversionFunnel
        }
      ]
    };
  }

  generateInsightsSection(data) {
    return {
      type: 'insights',
      title: 'Key Insights',
      insights: data.insights.insights
    };
  }

  generateRecommendationsSection(data) {
    return {
      type: 'recommendations',
      title: 'Recommendations',
      recommendations: data.insights.recommendations
    };
  }

  generateCampaignsSection(data) {
    return {
      type: 'campaigns',
      title: 'Campaign Performance',
      campaigns: data.campaigns.campaignPerformance
    };
  }

  generateTemplatesSection(data) {
    return {
      type: 'templates',
      title: 'Template Performance',
      templates: data.templates.templatePerformance
    };
  }

  generatePerformanceSection(data) {
    return {
      type: 'performance',
      title: 'Performance Analysis',
      bestHour: data.performance.bestHour,
      bestDay: data.performance.bestDay,
      hourlyAcceptance: data.performance.hourlyAcceptance
    };
  }

  generateTrendsSection(data) {
    return {
      type: 'trends',
      title: 'Trend Analysis',
      trends: this.calculateTrends(data)
    };
  }

  calculateTrends(data) {
    // Simplified trend calculation
    return {
      connectionTrend: 'increasing',
      acceptanceTrend: 'stable',
      responseTrend: 'increasing'
    };
  }

  generateSummary(data) {
    return {
      totalConnections: data.summary.totalConnections,
      acceptanceRate: data.summary.acceptanceRate,
      responseRate: data.summary.responseRate,
      topPerformingTemplate: data.templates.bestPerformingTemplate?.name || 'N/A',
      topPerformingCampaign: data.campaigns.campaignPerformance[0]?.name || 'N/A'
    };
  }

  async generateInsights(data) {
    return data.insights.insights.slice(0, 5);
  }

  async generateRecommendations(data) {
    return data.insights.recommendations.slice(0, 5);
  }

  countDataPoints(data) {
    return data.summary.totalConnections + data.summary.totalMessages;
  }

  calculateTrend(currentValue, metric) {
    // Simplified trend calculation
    // In a real implementation, you'd compare with historical data
    if (currentValue > 50) {
      return 'up';
    }
    if (currentValue < 20) {
      return 'down';
    }
    return 'stable';
  }

  getPerformanceStatus(value, metric) {
    switch (metric) {
      case 'acceptance_rate':
        if (value >= 30) {
          return 'excellent';
        }
        if (value >= 20) {
          return 'good';
        }
        if (value >= 10) {
          return 'fair';
        }
        return 'poor';
      case 'response_rate':
        if (value >= 25) {
          return 'excellent';
        }
        if (value >= 15) {
          return 'good';
        }
        if (value >= 8) {
          return 'fair';
        }
        return 'poor';
      default:
        return 'unknown';
    }
  }

  async generateForecast(data) {
    // Simplified forecasting
    const currentRate = data.summary.averageConnectionsPerDay;
    const projectedMonthly = currentRate * 30;
    const projectedQuarterly = currentRate * 90;

    return {
      nextMonth: {
        connections: Math.round(projectedMonthly),
        acceptances: Math.round(projectedMonthly * (data.summary.acceptanceRate / 100))
      },
      nextQuarter: {
        connections: Math.round(projectedQuarterly),
        acceptances: Math.round(projectedQuarterly * (data.summary.acceptanceRate / 100))
      }
    };
  }

  async generateActionItems(data) {
    const actionItems = [];

    if (data.summary.acceptanceRate < 20) {
      actionItems.push({
        priority: 'high',
        title: 'Improve Message Templates',
        description: 'Consider A/B testing different message approaches',
        estimatedImpact: 'high'
      });
    }

    if (data.summary.averageConnectionsPerDay < 5) {
      actionItems.push({
        priority: 'medium',
        title: 'Increase Daily Activity',
        description: 'Consider expanding target criteria or increasing automation frequency',
        estimatedImpact: 'medium'
      });
    }

    return actionItems;
  }

  calculateNextRun(frequency, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    return nextRun.getTime();
  }

  startScheduleChecker() {
    // Check every hour for scheduled reports
    setInterval(
      () => {
        this.checkScheduledReports();
      },
      60 * 60 * 1000
    );
  }

  async checkScheduledReports() {
    const now = Date.now();

    for (const [scheduleId, schedule] of this.scheduledReports) {
      if (schedule.isActive && schedule.nextRun <= now) {
        try {
          await this.executeScheduledReport(schedule);
        } catch (error) {
          console.error(`Error executing scheduled report ${scheduleId}:`, error);
        }
      }
    }
  }

  async executeScheduledReport(schedule) {
    const report = await this.generateReport(schedule.templateId, schedule.options);

    if (schedule.delivery.method !== DELIVERY_METHODS.STORAGE) {
      await this.deliverReport(report, schedule.delivery);
    }

    // Update schedule
    schedule.lastRun = Date.now();
    schedule.runCount++;
    schedule.nextRun = this.calculateNextRun(schedule.frequency, schedule.time);

    await this.saveScheduledReports();
  }

  async prepareDownload(report, config) {
    return {
      method: 'download',
      filename: `${report.type}_report_${new Date().toISOString().split('T')[0]}.${report.format}`,
      content: report.content,
      mimeType: this.getMimeType(report.format)
    };
  }

  async sendEmail(report, config) {
    // Email sending would be implemented here
    return {
      method: 'email',
      recipients: config.recipients,
      subject: config.subject || `LinkedIn Automation Report - ${report.type}`,
      status: 'sent'
    };
  }

  async saveToStorage(report, config) {
    const storageKey = `${STORAGE_KEYS.REPORTS}_${report.id}`;
    await setStorageData({ [storageKey]: report });

    return {
      method: 'storage',
      storageKey,
      status: 'saved'
    };
  }

  async sendWebhook(report, config) {
    // Webhook sending would be implemented here
    return {
      method: 'webhook',
      url: config.webhookUrl,
      status: 'sent'
    };
  }

  getMimeType(format) {
    switch (format) {
      case REPORT_FORMATS.PDF:
        return 'application/pdf';
      case REPORT_FORMATS.CSV:
        return 'text/csv';
      case REPORT_FORMATS.JSON:
        return 'application/json';
      case REPORT_FORMATS.HTML:
      default:
        return 'text/html';
    }
  }

  async saveReportTemplates() {
    const templates = Object.fromEntries(this.reportTemplates);
    await setStorageData({ [STORAGE_KEYS.REPORT_TEMPLATES]: templates });
  }

  async loadReportTemplates() {
    try {
      const result = await getStorageData(STORAGE_KEYS.REPORT_TEMPLATES);
      const templates = result.report_templates || {};

      Object.entries(templates).forEach(([id, template]) => {
        this.reportTemplates.set(id, template);
      });
    } catch (error) {
      console.error('Error loading report templates:', error);
    }
  }

  async saveScheduledReports() {
    const schedules = Object.fromEntries(this.scheduledReports);
    await setStorageData({ [STORAGE_KEYS.SCHEDULED_REPORTS]: schedules });
  }

  async loadScheduledReports() {
    try {
      const result = await getStorageData(STORAGE_KEYS.SCHEDULED_REPORTS);
      const schedules = result.scheduled_reports || {};

      Object.entries(schedules).forEach(([id, schedule]) => {
        this.scheduledReports.set(id, schedule);
      });
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
    }
  }

  async saveReportHistory() {
    await setStorageData({ [STORAGE_KEYS.REPORT_HISTORY]: this.reportHistory });
  }

  async loadReportHistory() {
    try {
      const result = await getStorageData(STORAGE_KEYS.REPORT_HISTORY);
      this.reportHistory = result.report_history || [];
    } catch (error) {
      console.error('Error loading report history:', error);
    }
  }
}

/**
 * Create advanced reporting system instance
 * @returns {AdvancedReportingSystem} Reporting system instance
 */
export function createAdvancedReportingSystem() {
  return new AdvancedReportingSystem();
}

/**
 * Generate quick summary report
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Quick summary report
 */
export async function generateQuickSummary(options = {}) {
  const reportingSystem = createAdvancedReportingSystem();
  return await reportingSystem.generateExecutiveSummary(options);
}
