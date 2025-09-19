// Enhanced Template Management System - Task 3.2
// Advanced template library with categorization, versioning, and analytics

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';
import { validateMessageTemplate } from './message-templates.js';

/**
 * Default template library structure
 */
const DEFAULT_LIBRARY_CONFIG = {
  name: 'Main Template Library',
  description: 'Primary collection of message templates',
  categories: [
    'General',
    'Professional',
    'Industry-Specific',
    'Follow-up',
    'Cold Outreach',
    'Warm Outreach',
    'Thank You',
    'Event-Based'
  ],
  tags: [
    'networking',
    'sales',
    'recruiting',
    'partnerships',
    'events',
    'follow-up',
    'introduction',
    'recommendation'
  ],
  settings: {
    maxTemplates: 1000,
    enableVersioning: true,
    enableSharing: true,
    autoOptimize: true,
    trackPerformance: true
  }
};

/**
 * Create new template library with configuration
 * @param {Object} config - Library configuration
 * @returns {Promise<Object>} Created library object
 */
export async function createTemplateLibrary(config = {}) {
  try {
    const library = {
      id: `library_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...DEFAULT_LIBRARY_CONFIG,
      ...config,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      templates: [],
      metadata: {
        totalUsage: 0,
        averagePerformance: 0,
        lastOptimized: Date.now(),
        version: '1.0.0'
      }
    };

    await setStorageData({
      [STORAGE_KEYS.TEMPLATE_LIBRARY]: library
    });

    return library;
  } catch (error) {
    console.error('Error creating template library:', error);
    throw error;
  }
}

/**
 * Save template with comprehensive metadata
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Saved template with metadata
 */
export async function saveTemplateWithMetadata(templateData) {
  try {
    const library = await getTemplateLibrary();

    // Generate template ID and metadata
    const template = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...templateData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      usageCount: 0,
      performanceMetrics: {
        responseRate: 0,
        acceptanceRate: 0,
        successRate: 0,
        averageResponseTime: 0,
        totalConnections: 0,
        totalResponses: 0,
        totalAccepted: 0
      },
      metadata: {
        variables: extractTemplateVariables(templateData.message),
        complexity: calculateTemplateComplexity(templateData.message),
        personalizationScore: calculatePersonalizationPotential(templateData.message),
        targetAudience: templateData.targetAudience || 'General',
        expectedResponseRate: templateData.expectedResponseRate || 0.1
      }
    };

    // Validate template
    const validation = validateMessageTemplate(template);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // Add to library
    library.templates.push(template);

    // Update library metadata
    library.updatedAt = Date.now();
    library.metadata.version = incrementVersion(library.metadata.version);

    // Update categories and tags
    if (!library.categories.includes(template.category)) {
      library.categories.push(template.category);
    }

    if (template.tags) {
      template.tags.forEach(tag => {
        if (!library.tags.includes(tag)) {
          library.tags.push(tag);
        }
      });
    }

    await saveTemplateLibrary(library);
    return template;
  } catch (error) {
    console.error('Error saving template with metadata:', error);
    throw error;
  }
}

/**
 * Update template metadata
 * @param {string} templateId - Template ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated template
 */
export async function updateTemplateMetadata(templateId, updates) {
  try {
    const library = await getTemplateLibrary();
    const templateIndex = library.templates.findIndex(t => t.id === templateId);

    if (templateIndex === -1) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const template = library.templates[templateIndex];

    // Store version history if versioning is enabled
    if (library.settings.enableVersioning) {
      await storeTemplateVersion(templateId, { ...template });
    }

    // Apply updates
    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: Date.now(),
      version: template.version + 1
    };

    // Re-validate template if message changed
    if (updates.message) {
      const validation = validateMessageTemplate(updatedTemplate);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      // Update metadata based on new message
      updatedTemplate.metadata = {
        ...updatedTemplate.metadata,
        variables: extractTemplateVariables(updates.message),
        complexity: calculateTemplateComplexity(updates.message),
        personalizationScore: calculatePersonalizationPotential(updates.message)
      };
    }

    library.templates[templateIndex] = updatedTemplate;
    library.updatedAt = Date.now();

    await saveTemplateLibrary(library);
    return updatedTemplate;
  } catch (error) {
    console.error('Error updating template metadata:', error);
    throw error;
  }
}

/**
 * Delete template with safety checks
 * @param {string} templateId - Template ID
 * @param {Object} options - Deletion options
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteTemplate(templateId, options = {}) {
  try {
    const library = await getTemplateLibrary();
    const templateIndex = library.templates.findIndex(t => t.id === templateId);

    if (templateIndex === -1) {
      return {
        success: false,
        reason: 'TEMPLATE_NOT_FOUND',
        message: 'Template not found'
      };
    }

    const template = library.templates[templateIndex];

    // Safety checks
    if (options.preventHighUsageDeletion) {
      const usageThreshold = options.highUsageThreshold || 50;
      const performanceThreshold = options.highPerformanceThreshold || 0.25;

      if (
        template.usageCount >= usageThreshold ||
        template.performanceMetrics.responseRate >= performanceThreshold
      ) {
        return {
          success: false,
          reason: 'HIGH_USAGE_TEMPLATE',
          message: `Cannot delete template with high usage count (${template.usageCount}) or performance (${template.performanceMetrics.responseRate})`
        };
      }
    }

    // Store in deletion history
    await storeDeletedTemplate(template);

    // Remove from library
    const deletedTemplate = library.templates.splice(templateIndex, 1)[0];
    library.updatedAt = Date.now();

    await saveTemplateLibrary(library);

    return {
      success: true,
      deletedTemplate,
      message: 'Template deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting template:', error);
    return {
      success: false,
      reason: 'DELETE_ERROR',
      message: error.message
    };
  }
}

/**
 * Get templates by category
 * @param {string} category - Category name
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Templates in category
 */
export async function getTemplatesByCategory(category, options = {}) {
  try {
    const library = await getTemplateLibrary();

    let templates = library.templates.filter(t => t.category === category);

    // Apply sorting
    if (options.sortBy) {
      templates = sortTemplates(templates, options.sortBy, options.sortOrder);
    }

    // Apply pagination
    if (options.limit || options.offset) {
      const offset = options.offset || 0;
      const limit = options.limit || templates.length;
      templates = templates.slice(offset, offset + limit);
    }

    return templates;
  } catch (error) {
    console.error('Error getting templates by category:', error);
    return [];
  }
}

/**
 * Get templates by tag(s)
 * @param {string|Array} tags - Tag name(s)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Templates with matching tags
 */
export async function getTemplatesByTag(tags, options = {}) {
  try {
    const library = await getTemplateLibrary();
    const tagArray = Array.isArray(tags) ? tags : [tags];

    let templates = library.templates.filter(template => {
      if (!template.tags) {
        return false;
      }

      if (options.matchAll) {
        return tagArray.every(tag => template.tags.includes(tag));
      } else {
        return tagArray.some(tag => template.tags.includes(tag));
      }
    });

    if (options.sortBy) {
      templates = sortTemplates(templates, options.sortBy, options.sortOrder);
    }

    return templates;
  } catch (error) {
    console.error('Error getting templates by tag:', error);
    return [];
  }
}

/**
 * Search templates by content and metadata
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Matching templates
 */
export async function searchTemplates(query, options = {}) {
  try {
    const library = await getTemplateLibrary();
    const lowerQuery = query.toLowerCase();

    const templates = library.templates.filter(template => {
      // Search in name
      if (template.name && template.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in message
      if (template.message && template.message.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in description
      if (template.description && template.description.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in tags
      if (template.tags && template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        return true;
      }

      // Search in category
      if (template.category && template.category.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });

    // Calculate relevance scores if requested
    if (options.includeRelevance) {
      return templates
        .map(template => ({
          ...template,
          relevanceScore: calculateSearchRelevance(template, query)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return templates;
  } catch (error) {
    console.error('Error searching templates:', error);
    return [];
  }
}

/**
 * Export templates in various formats
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export result
 */
export async function exportTemplates(options = {}) {
  try {
    const library = await getTemplateLibrary();
    let templates = [...library.templates];

    // Apply filters
    if (options.filter) {
      templates = applyFilters(templates, options.filter);
    }

    // Format data for export
    const exportData = {
      version: '1.0',
      exportedAt: Date.now(),
      templateCount: templates.length,
      metadata: {
        libraryName: library.name,
        exportedBy: options.exportedBy || 'system',
        includePerformanceData: options.includePerformanceData || false
      },
      templates: templates.map(template => {
        const exportTemplate = {
          id: template.id,
          name: template.name,
          message: template.message,
          category: template.category,
          tags: template.tags,
          description: template.description,
          createdAt: template.createdAt,
          version: template.version
        };

        if (options.includePerformanceData) {
          exportTemplate.usageCount = template.usageCount;
          exportTemplate.performanceMetrics = template.performanceMetrics;
        }

        if (options.includeMetadata) {
          exportTemplate.metadata = template.metadata;
        }

        return exportTemplate;
      })
    };

    // Convert to requested format
    let result;
    switch (options.format) {
      case 'csv':
        result = convertToCsv(exportData.templates);
        break;
      case 'xml':
        result = convertToXml(exportData);
        break;
      case 'json':
      default:
        result = exportData;
        break;
    }

    return {
      success: true,
      format: options.format || 'json',
      data: result,
      count: templates.length
    };
  } catch (error) {
    console.error('Error exporting templates:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Import templates from external data
 * @param {Object} importData - Import data
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
export async function importTemplates(importData, options = {}) {
  try {
    const library = await getTemplateLibrary();
    const results = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: []
    };

    if (!importData.templates || !Array.isArray(importData.templates)) {
      throw new Error('Invalid import data: templates array required');
    }

    for (const templateData of importData.templates) {
      try {
        // Validate template before import
        if (options.validateBeforeImport) {
          const validation = validateTemplateForImport(templateData);
          if (!validation.isValid) {
            results.errors.push({
              template: templateData.name || 'Unnamed',
              errors: validation.errors
            });
            results.skipped++;
            continue;
          }
        }

        // Check for duplicates
        if (options.preventDuplicates) {
          const isDuplicate = library.templates.some(
            existing =>
              existing.name === templateData.name || existing.message === templateData.message
          );

          if (isDuplicate) {
            results.skipped++;
            continue;
          }
        }

        // Import template
        const newTemplate = {
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...templateData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          usageCount: templateData.usageCount || 0,
          performanceMetrics: templateData.performanceMetrics || {
            responseRate: 0,
            acceptanceRate: 0,
            successRate: 0,
            averageResponseTime: 0,
            totalConnections: 0,
            totalResponses: 0,
            totalAccepted: 0
          },
          metadata: {
            imported: true,
            importedAt: Date.now(),
            originalId: templateData.id,
            ...templateData.metadata
          }
        };

        library.templates.push(newTemplate);
        results.imported++;

        // Update categories and tags
        if (newTemplate.category && !library.categories.includes(newTemplate.category)) {
          library.categories.push(newTemplate.category);
        }

        if (newTemplate.tags) {
          newTemplate.tags.forEach(tag => {
            if (!library.tags.includes(tag)) {
              library.tags.push(tag);
            }
          });
        }
      } catch (error) {
        results.errors.push({
          template: templateData.name || 'Unnamed',
          errors: [error.message]
        });
        results.skipped++;
      }
    }

    library.updatedAt = Date.now();
    await saveTemplateLibrary(library);

    return results;
  } catch (error) {
    console.error('Error importing templates:', error);
    return {
      success: false,
      error: error.message,
      imported: 0,
      skipped: 0,
      errors: []
    };
  }
}

/**
 * Get template performance analytics
 * @param {string} templateId - Template ID
 * @param {Object} options - Analytics options
 * @returns {Promise<Object>} Performance analytics
 */
export async function getTemplatePerformanceAnalytics(templateId, options = {}) {
  try {
    const analytics = await getStorageData(STORAGE_KEYS.ANALYTICS);
    const events = analytics.analytics || [];

    // Filter events for this template
    const templateEvents = events.filter(
      event =>
        event.templateId === templateId ||
        (event.type.includes('template') && event.templateId === templateId)
    );

    // Calculate metrics
    const usageEvents = templateEvents.filter(e => e.type === 'template_used');
    const connectionEvents = templateEvents.filter(e => e.type === 'connection_sent');
    const acceptedEvents = templateEvents.filter(e => e.type === 'connection_accepted');
    const declinedEvents = templateEvents.filter(e => e.type === 'connection_declined');

    const totalUsage = usageEvents.length;
    const connectionsSent = connectionEvents.length;
    const connectionsAccepted = acceptedEvents.length;
    const connectionsDeclined = declinedEvents.length;
    const totalResponses = connectionsAccepted + connectionsDeclined;

    // Calculate response times
    const responseTimes = [];
    connectionEvents.forEach(sentEvent => {
      const response = [...acceptedEvents, ...declinedEvents].find(
        respEvent =>
          respEvent.profileId === sentEvent.profileId && respEvent.timestamp > sentEvent.timestamp
      );

      if (response) {
        responseTimes.push(response.timestamp - sentEvent.timestamp);
      }
    });

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

    return {
      templateId,
      totalUsage,
      connectionsSent,
      connectionsAccepted,
      connectionsDeclined,
      responseRate: connectionsSent > 0 ? totalResponses / connectionsSent : 0,
      acceptanceRate: connectionsSent > 0 ? connectionsAccepted / connectionsSent : 0,
      declineRate: connectionsSent > 0 ? connectionsDeclined / connectionsSent : 0,
      averageResponseTime,
      timeline: options.includeTimeline ? generateTimeline(templateEvents) : undefined,
      insights: options.includeInsights ? generateInsights(templateEvents) : undefined
    };
  } catch (error) {
    console.error('Error getting template performance analytics:', error);
    return null;
  }
}

/**
 * Get template usage statistics
 * @param {Object} options - Statistics options
 * @returns {Promise<Object>} Usage statistics
 */
export async function getTemplateUsageStats(options = {}) {
  try {
    const library = await getTemplateLibrary();
    const templates = library.templates;

    if (templates.length === 0) {
      return {
        totalTemplates: 0,
        totalUsage: 0,
        averageUsage: 0,
        mostUsed: null,
        leastUsed: null,
        averageResponseRate: 0
      };
    }

    // Calculate basic statistics
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    const averageUsage = totalUsage / templates.length;

    // Find most and least used
    const sortedByUsage = [...templates].sort((a, b) => b.usageCount - a.usageCount);
    const mostUsed = sortedByUsage[0];
    const leastUsed = sortedByUsage[sortedByUsage.length - 1];

    // Calculate average response rate
    const templatesWithMetrics = templates.filter(t => t.performanceMetrics.responseRate > 0);
    const averageResponseRate =
      templatesWithMetrics.length > 0
        ? templatesWithMetrics.reduce((sum, t) => sum + t.performanceMetrics.responseRate, 0) /
          templatesWithMetrics.length
        : 0;

    const stats = {
      totalTemplates: templates.length,
      totalUsage,
      averageUsage,
      mostUsed,
      leastUsed,
      averageResponseRate,
      categoryCounts: getCategoryCounts(templates),
      tagCounts: getTagCounts(templates),
      performanceDistribution: getPerformanceDistribution(templates)
    };

    // Include rankings if requested
    if (options.includeRankings) {
      stats.topPerforming = getTopPerformingTemplates(templates, 5);
      stats.needsImprovement = getLowPerformingTemplates(templates, 5);
      stats.trending = getTrendingTemplates(templates);
    }

    return stats;
  } catch (error) {
    console.error('Error getting template usage statistics:', error);
    return null;
  }
}

/**
 * Optimize template library
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Optimization results
 */
export async function optimizeTemplateLibrary(options = {}) {
  try {
    const library = await getTemplateLibrary();
    const originalTemplateCount = library.templates.length;

    const results = {
      optimized: true,
      templatesBefore: originalTemplateCount,
      templatesAfter: originalTemplateCount,
      duplicatesRemoved: 0,
      unusedRemoved: 0,
      categoriesUpdated: 0,
      tagsAdded: 0,
      changes: []
    };

    // Remove duplicates
    if (options.removeDuplicates) {
      const duplicateResult = removeDuplicateTemplates(library, options.similarityThreshold || 0.9);
      library.templates = duplicateResult.templates;
      results.duplicatesRemoved = duplicateResult.removed;
      results.changes.push(`Removed ${duplicateResult.removed} duplicate templates`);
    }

    // Remove unused templates
    if (options.removeUnused) {
      const unusedResult = removeUnusedTemplates(library, {
        unusedThreshold: options.unusedThreshold || 30,
        lowUsageThreshold: options.lowUsageThreshold || 1
      });
      library.templates = unusedResult.templates;
      results.unusedRemoved = unusedResult.removed;
      results.changes.push(`Removed ${unusedResult.removed} unused templates`);
    }

    // Auto-categorize templates
    if (options.autoCategories) {
      const categorizeResult = autoCategorizeTemplates(library);
      results.categoriesUpdated = categorizeResult.updated;
      results.changes.push(`Updated categories for ${categorizeResult.updated} templates`);
    }

    // Add smart tags
    if (options.smartTagging) {
      const taggingResult = addSmartTags(library);
      results.tagsAdded = taggingResult.tagsAdded;
      results.changes.push(`Added ${taggingResult.tagsAdded} smart tags`);
    }

    // Optimize performance data
    if (options.optimizePerformanceData) {
      optimizePerformanceMetrics(library);
      results.changes.push('Optimized performance metrics');
    }

    results.templatesAfter = library.templates.length;
    library.metadata.lastOptimized = Date.now();
    library.updatedAt = Date.now();

    await saveTemplateLibrary(library);
    return results;
  } catch (error) {
    console.error('Error optimizing template library:', error);
    return {
      optimized: false,
      error: error.message
    };
  }
}

/**
 * Get template version history
 * @param {string} templateId - Template ID
 * @returns {Promise<Array>} Version history
 */
export async function getTemplateVersionHistory(templateId) {
  try {
    const versionsData = await getStorageData('template_versions');
    const versions = versionsData.template_versions || {};

    return (versions[templateId] || []).sort((a, b) => b.version - a.version);
  } catch (error) {
    console.error('Error getting template version history:', error);
    return [];
  }
}

/**
 * Rollback template to previous version
 * @param {string} templateId - Template ID
 * @param {number} targetVersion - Version to rollback to
 * @returns {Promise<Object>} Rollback result
 */
export async function rollbackTemplateVersion(templateId, targetVersion) {
  try {
    const versions = await getTemplateVersionHistory(templateId);
    const targetVersionData = versions.find(v => v.version === targetVersion);

    if (!targetVersionData) {
      return {
        success: false,
        reason: 'VERSION_NOT_FOUND',
        message: `Version ${targetVersion} not found`
      };
    }

    const library = await getTemplateLibrary();
    const templateIndex = library.templates.findIndex(t => t.id === templateId);

    if (templateIndex === -1) {
      return {
        success: false,
        reason: 'TEMPLATE_NOT_FOUND',
        message: 'Template not found'
      };
    }

    const currentTemplate = library.templates[templateIndex];

    // Store current version before rollback
    await storeTemplateVersion(templateId, { ...currentTemplate });

    // Create new version based on target version
    const rolledBackTemplate = {
      ...currentTemplate,
      ...targetVersionData,
      id: templateId, // Keep original ID
      version: currentTemplate.version + 1, // Increment version
      updatedAt: Date.now(),
      rolledBackFrom: currentTemplate.version,
      rolledBackTo: targetVersion
    };

    library.templates[templateIndex] = rolledBackTemplate;
    library.updatedAt = Date.now();

    await saveTemplateLibrary(library);

    return {
      success: true,
      rolledBackTo: targetVersion,
      newVersion: rolledBackTemplate.version,
      template: rolledBackTemplate
    };
  } catch (error) {
    console.error('Error rolling back template version:', error);
    return {
      success: false,
      reason: 'ROLLBACK_ERROR',
      message: error.message
    };
  }
}

/**
 * Share template with external users
 * @param {string} templateId - Template ID
 * @param {Object} shareOptions - Sharing options
 * @returns {Promise<Object>} Share result
 */
export async function shareTemplate(templateId, shareOptions) {
  try {
    const library = await getTemplateLibrary();
    const template = library.templates.find(t => t.id === templateId);

    if (!template) {
      return {
        success: false,
        reason: 'TEMPLATE_NOT_FOUND',
        message: 'Template not found'
      };
    }

    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareData = {
      shareId,
      templateId,
      template: {
        name: template.name,
        message: template.message,
        category: template.category,
        tags: template.tags,
        description: template.description
      },
      shareWith: shareOptions.shareWith || 'public',
      allowEditing: shareOptions.allowEditing || false,
      createdAt: Date.now(),
      expiresAt: shareOptions.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      createdBy: shareOptions.createdBy || 'anonymous'
    };

    // Store share data
    const sharesData = await getStorageData('template_shares');
    const shares = sharesData.template_shares || {};
    shares[shareId] = shareData;

    await setStorageData({ template_shares: shares });

    return {
      success: true,
      shareId,
      shareUrl: `https://templates.linkedin-extension.com/shared/${shareId}`,
      expiresAt: shareData.expiresAt,
      shareData
    };
  } catch (error) {
    console.error('Error sharing template:', error);
    return {
      success: false,
      reason: 'SHARE_ERROR',
      message: error.message
    };
  }
}

/**
 * Duplicate template with new ID
 * @param {string} templateId - Template ID to duplicate
 * @param {Object} options - Duplication options
 * @returns {Promise<Object>} Duplication result
 */
export async function duplicateTemplate(templateId, options = {}) {
  try {
    const library = await getTemplateLibrary();
    const originalTemplate = library.templates.find(t => t.id === templateId);

    if (!originalTemplate) {
      return {
        success: false,
        reason: 'TEMPLATE_NOT_FOUND',
        message: 'Original template not found'
      };
    }

    const duplicatedTemplate = {
      ...originalTemplate,
      id: `duplicate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: options.name || `Copy of ${originalTemplate.name}`,
      category: options.category || originalTemplate.category,
      tags: options.tags || [...(originalTemplate.tags || [])],
      description: options.description || originalTemplate.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      usageCount: 0,
      performanceMetrics: {
        responseRate: 0,
        acceptanceRate: 0,
        successRate: 0,
        averageResponseTime: 0,
        totalConnections: 0,
        totalResponses: 0,
        totalAccepted: 0
      },
      metadata: {
        ...originalTemplate.metadata,
        duplicatedFrom: templateId,
        duplicatedAt: Date.now()
      }
    };

    library.templates.push(duplicatedTemplate);
    library.updatedAt = Date.now();

    await saveTemplateLibrary(library);

    return {
      success: true,
      duplicatedTemplate,
      originalTemplate
    };
  } catch (error) {
    console.error('Error duplicating template:', error);
    return {
      success: false,
      reason: 'DUPLICATE_ERROR',
      message: error.message
    };
  }
}

/**
 * Validate template library integrity
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
export async function validateTemplateLibrary(options = {}) {
  try {
    const library = await getTemplateLibrary();
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      validTemplates: 0,
      invalidTemplates: 0,
      statistics: {
        totalTemplates: library.templates.length,
        categories: library.categories.length,
        tags: library.tags.length
      }
    };

    // Validate each template
    for (const template of library.templates) {
      const templateValidation = validateMessageTemplate(template);

      if (templateValidation.isValid) {
        result.validTemplates++;
      } else {
        result.invalidTemplates++;
        result.isValid = false;
        result.errors.push({
          templateId: template.id,
          templateName: template.name,
          errors: templateValidation.errors
        });
      }

      // Check for missing required fields
      if (!template.name || template.name.trim() === '') {
        result.errors.push({
          templateId: template.id,
          errors: ['Template name is required']
        });
        result.isValid = false;
        result.invalidTemplates++;
      }

      // Generate improvement suggestions
      if (options.includeSuggestions) {
        const suggestions = generateTemplateImprovementSuggestions(template);
        result.suggestions.push(...suggestions);
      }
    }

    return result;
  } catch (error) {
    console.error('Error validating template library:', error);
    return {
      isValid: false,
      errors: [{ error: error.message }],
      warnings: [],
      suggestions: [],
      validTemplates: 0,
      invalidTemplates: 0
    };
  }
}

// Helper functions

async function getTemplateLibrary() {
  const data = await getStorageData(STORAGE_KEYS.TEMPLATE_LIBRARY);
  return data.template_library || (await createTemplateLibrary());
}

async function saveTemplateLibrary(library) {
  await setStorageData({
    [STORAGE_KEYS.TEMPLATE_LIBRARY]: library
  });
}

async function storeTemplateVersion(templateId, templateData) {
  const versionsData = await getStorageData('template_versions');
  const versions = versionsData.template_versions || {};

  if (!versions[templateId]) {
    versions[templateId] = [];
  }

  versions[templateId].push({
    ...templateData,
    archivedAt: Date.now()
  });

  // Keep only last 10 versions
  if (versions[templateId].length > 10) {
    versions[templateId] = versions[templateId].slice(-10);
  }

  await setStorageData({ template_versions: versions });
}

async function storeDeletedTemplate(template) {
  const deletedData = await getStorageData('deleted_templates');
  const deleted = deletedData.deleted_templates || [];

  deleted.push({
    ...template,
    deletedAt: Date.now()
  });

  // Keep only last 100 deleted templates
  if (deleted.length > 100) {
    deleted.splice(0, deleted.length - 100);
  }

  await setStorageData({ deleted_templates: deleted });
}

function extractTemplateVariables(message) {
  const variables = [];
  const variableRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  let match;

  while ((match = variableRegex.exec(message)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

function calculateTemplateComplexity(message) {
  let complexity = 0;

  // Base complexity
  complexity += message.length * 0.01;

  // Variable complexity
  const variables = extractTemplateVariables(message);
  complexity += variables.length * 0.5;

  // Conditional complexity
  const conditionals = (message.match(/\{\{#if/g) || []).length;
  complexity += conditionals * 1.0;

  // Loop complexity
  const loops = (message.match(/\{\{#each/g) || []).length;
  complexity += loops * 1.5;

  return Math.min(complexity, 10); // Cap at 10
}

function calculatePersonalizationPotential(message) {
  const variables = extractTemplateVariables(message);
  let score = 0;

  // Base score for having variables
  if (variables.length > 0) {
    score += 0.3;
  }

  // Score based on variable types
  const personalVars = ['name', 'firstName', 'lastName'];
  const professionalVars = ['title', 'company', 'industry'];
  const socialVars = ['mutualConnections', 'location'];

  personalVars.forEach(v => {
    if (variables.includes(v)) {
      score += 0.2;
    }
  });

  professionalVars.forEach(v => {
    if (variables.includes(v)) {
      score += 0.15;
    }
  });

  socialVars.forEach(v => {
    if (variables.includes(v)) {
      score += 0.25;
    }
  });

  return Math.min(score, 1.0);
}

function incrementVersion(version) {
  const parts = version.split('.').map(Number);
  parts[2]++; // Increment patch version
  return parts.join('.');
}

function sortTemplates(templates, sortBy, sortOrder = 'desc') {
  const sorted = [...templates].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle nested properties
    if (sortBy.includes('.')) {
      aValue = getNestedValue(a, sortBy);
      bValue = getNestedValue(b, sortBy);
    }

    // Handle different data types
    if (typeof aValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  return sorted;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function calculateSearchRelevance(template, query) {
  let score = 0;
  const lowerQuery = query.toLowerCase();

  // Exact name match
  if (template.name && template.name.toLowerCase() === lowerQuery) {
    score += 10;
  }

  // Name contains query
  if (template.name && template.name.toLowerCase().includes(lowerQuery)) {
    score += 5;
  }

  // Message contains query
  if (template.message && template.message.toLowerCase().includes(lowerQuery)) {
    score += 3;
  }

  // Tag matches
  if (template.tags && template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
    score += 2;
  }

  // Category match
  if (template.category && template.category.toLowerCase().includes(lowerQuery)) {
    score += 1;
  }

  return score;
}

function applyFilters(templates, filters) {
  return templates.filter(template => {
    for (const [key, value] of Object.entries(filters)) {
      if (template[key] !== value) {
        return false;
      }
    }
    return true;
  });
}

function convertToCsv(templates) {
  if (templates.length === 0) {
    return '';
  }

  const headers = ['id', 'name', 'message', 'category', 'tags', 'createdAt'];
  const csvRows = [headers.join(',')];

  templates.forEach(template => {
    const row = headers.map(header => {
      let value = template[header];
      if (Array.isArray(value)) {
        value = value.join(';');
      }
      return `"${String(value || '').replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

function convertToXml(data) {
  // Basic XML conversion - would need more sophisticated implementation
  return `<?xml version="1.0" encoding="UTF-8"?>
<templates>
  ${data.templates
    .map(
      template => `
  <template id="${template.id}">
    <name>${escapeXml(template.name)}</name>
    <message>${escapeXml(template.message)}</message>
    <category>${escapeXml(template.category)}</category>
  </template>`
    )
    .join('')}
</templates>`;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validateTemplateForImport(templateData) {
  const errors = [];

  if (!templateData.name || templateData.name.trim() === '') {
    errors.push('Template name is required');
  }

  if (!templateData.message || templateData.message.trim() === '') {
    errors.push('Template message is required');
  }

  // Check for template variable syntax
  if (templateData.message) {
    const openBraces = (templateData.message.match(/\{\{/g) || []).length;
    const closeBraces = (templateData.message.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push('Unmatched template variable braces');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function getCategoryCounts(templates) {
  const counts = {};
  templates.forEach(template => {
    const category = template.category || 'Uncategorized';
    counts[category] = (counts[category] || 0) + 1;
  });
  return counts;
}

function getTagCounts(templates) {
  const counts = {};
  templates.forEach(template => {
    if (template.tags) {
      template.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    }
  });
  return counts;
}

function getPerformanceDistribution(templates) {
  const distribution = {
    highPerforming: 0, // >30% response rate
    mediumPerforming: 0, // 10-30% response rate
    lowPerforming: 0, // <10% response rate
    noData: 0
  };

  templates.forEach(template => {
    const responseRate = template.performanceMetrics.responseRate;

    if (responseRate === 0 || responseRate === undefined) {
      distribution.noData++;
    } else if (responseRate > 0.3) {
      distribution.highPerforming++;
    } else if (responseRate >= 0.1) {
      distribution.mediumPerforming++;
    } else {
      distribution.lowPerforming++;
    }
  });

  return distribution;
}

function getTopPerformingTemplates(templates, limit = 5) {
  return templates
    .filter(t => t.performanceMetrics.responseRate > 0)
    .sort((a, b) => {
      const scoreA =
        a.performanceMetrics.responseRate * 0.6 + a.performanceMetrics.acceptanceRate * 0.4;
      const scoreB =
        b.performanceMetrics.responseRate * 0.6 + b.performanceMetrics.acceptanceRate * 0.4;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

function getLowPerformingTemplates(templates, limit = 5) {
  return templates
    .filter(t => t.usageCount > 5 && t.performanceMetrics.responseRate < 0.1)
    .sort((a, b) => a.performanceMetrics.responseRate - b.performanceMetrics.responseRate)
    .slice(0, limit);
}

function getTrendingTemplates(templates) {
  const recentThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

  return templates
    .filter(t => t.updatedAt > recentThreshold && t.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10);
}

function removeDuplicateTemplates(library, similarityThreshold) {
  const templates = [...library.templates];
  const toRemove = [];

  for (let i = 0; i < templates.length; i++) {
    for (let j = i + 1; j < templates.length; j++) {
      const similarity = calculateTemplateSimilarity(templates[i], templates[j]);

      if (similarity >= similarityThreshold) {
        // Keep the one with better performance or higher usage
        const keepFirst = templates[i].usageCount >= templates[j].usageCount;
        toRemove.push(keepFirst ? j : i);
      }
    }
  }

  // Remove duplicates (in reverse order to maintain indices)
  const uniqueIndices = [...new Set(toRemove)].sort((a, b) => b - a);
  uniqueIndices.forEach(index => templates.splice(index, 1));

  return {
    templates,
    removed: uniqueIndices.length
  };
}

function removeUnusedTemplates(library, options) {
  const templates = [...library.templates];
  const unusedThreshold = options.unusedThreshold * 24 * 60 * 60 * 1000; // Convert days to ms
  const now = Date.now();

  const filtered = templates.filter(template => {
    const age = now - template.createdAt;
    const isOld = age > unusedThreshold;
    const hasLowUsage = template.usageCount <= options.lowUsageThreshold;

    return !(isOld && hasLowUsage);
  });

  return {
    templates: filtered,
    removed: templates.length - filtered.length
  };
}

function autoCategorizeTemplates(library) {
  let updated = 0;

  library.templates.forEach(template => {
    if (template.category === 'General' || !template.category) {
      const suggestedCategory = suggestCategory(template.message);
      if (suggestedCategory !== 'General') {
        template.category = suggestedCategory;
        updated++;
      }
    }
  });

  return { updated };
}

function addSmartTags(library) {
  let tagsAdded = 0;

  library.templates.forEach(template => {
    const smartTags = generateSmartTags(template);
    const existingTags = template.tags || [];

    smartTags.forEach(tag => {
      if (!existingTags.includes(tag)) {
        existingTags.push(tag);
        tagsAdded++;
      }
    });

    template.tags = existingTags;
  });

  return { tagsAdded };
}

function optimizePerformanceMetrics(library) {
  library.templates.forEach(template => {
    // Recalculate metrics based on actual data
    if (template.performanceMetrics.totalConnections > 0) {
      template.performanceMetrics.responseRate =
        (template.performanceMetrics.totalResponses || 0) /
        template.performanceMetrics.totalConnections;

      template.performanceMetrics.acceptanceRate =
        (template.performanceMetrics.totalAccepted || 0) /
        template.performanceMetrics.totalConnections;
    }
  });
}

function calculateTemplateSimilarity(template1, template2) {
  // Simple similarity calculation based on message content
  const message1 = template1.message.toLowerCase();
  const message2 = template2.message.toLowerCase();

  if (message1 === message2) {
    return 1.0;
  }

  // Calculate Jaccard similarity
  const words1 = new Set(message1.split(/\s+/));
  const words2 = new Set(message2.split(/\s+/));

  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

function suggestCategory(message) {
  const lowerMessage = message.toLowerCase();

  const categoryKeywords = {
    Professional: ['work', 'company', 'professional', 'career', 'industry', 'experience'],
    Sales: ['sales', 'product', 'service', 'offer', 'solution', 'business opportunity'],
    Recruiting: ['opportunity', 'role', 'position', 'job', 'hiring', 'career move'],
    Networking: ['connect', 'network', 'relationship', 'mutual', 'introduction'],
    'Follow-up': ['following up', 'follow up', 'thanks', 'thank you', 'meeting', 'spoke'],
    'Event-Based': ['event', 'conference', 'meetup', 'webinar', 'presentation']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return category;
    }
  }

  return 'General';
}

function generateSmartTags(template) {
  const tags = [];
  const message = template.message.toLowerCase();

  // Industry tags
  const industryKeywords = {
    technology: ['tech', 'software', 'development', 'programming', 'developer'],
    finance: ['finance', 'banking', 'investment', 'financial'],
    healthcare: ['healthcare', 'medical', 'health', 'doctor'],
    marketing: ['marketing', 'advertising', 'brand', 'campaign'],
    sales: ['sales', 'revenue', 'business development', 'selling']
  };

  for (const [tag, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      tags.push(tag);
    }
  }

  // Purpose tags
  if (message.includes('connect') || message.includes('connection')) {
    tags.push('connection-request');
  }
  if (message.includes('meeting') || message.includes('coffee') || message.includes('chat')) {
    tags.push('meeting-request');
  }
  if (message.includes('opportunity') || message.includes('role')) {
    tags.push('opportunity');
  }

  return tags;
}

function generateTimeline(events) {
  // Group events by day
  const timeline = {};

  events.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    if (!timeline[date]) {
      timeline[date] = [];
    }
    timeline[date].push(event);
  });

  return timeline;
}

function generateInsights(events) {
  const insights = [];

  // Usage patterns
  const usageByHour = {};
  events.forEach(event => {
    const hour = new Date(event.timestamp).getHours();
    usageByHour[hour] = (usageByHour[hour] || 0) + 1;
  });

  const peakHour = Object.entries(usageByHour).sort(([, a], [, b]) => b - a)[0];

  if (peakHour) {
    insights.push({
      type: 'peak_usage',
      message: `Most active hour: ${peakHour[0]}:00 with ${peakHour[1]} uses`
    });
  }

  return insights;
}

function generateTemplateImprovementSuggestions(template) {
  const suggestions = [];

  // Low performance suggestions
  if (template.performanceMetrics.responseRate < 0.1 && template.usageCount > 5) {
    suggestions.push({
      templateId: template.id,
      suggestion: 'Consider revising message content - low response rate detected',
      priority: 'high',
      type: 'performance'
    });
  }

  // Personalization suggestions
  const variables = extractTemplateVariables(template.message);
  if (variables.length < 2) {
    suggestions.push({
      templateId: template.id,
      suggestion: 'Add more personalization variables to improve engagement',
      priority: 'medium',
      type: 'personalization'
    });
  }

  // Length suggestions
  if (template.message.length > 300) {
    suggestions.push({
      templateId: template.id,
      suggestion: 'Consider shortening message - LinkedIn has a 300 character limit',
      priority: 'medium',
      type: 'compliance'
    });
  }

  return suggestions;
}
