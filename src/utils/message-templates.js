// Message Template System for LinkedIn Connection Requests

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';

/**
 * Template variable substitution patterns
 */
const TEMPLATE_VARIABLES = {
  NAME: '{{name}}',
  FIRST_NAME: '{{firstName}}',
  TITLE: '{{title}}',
  COMPANY: '{{company}}',
  LOCATION: '{{location}}',
  MUTUAL_CONNECTIONS: '{{mutualConnections}}',
  CURRENT_DATE: '{{currentDate}}',
  CURRENT_TIME: '{{currentTime}}'
};

/**
 * Default message templates
 */
const DEFAULT_TEMPLATES = [
  {
    id: 'professional-introduction',
    name: 'Professional Introduction',
    category: 'general',
    message:
      'Hi {{firstName}}, I came across your profile and was impressed by your work at {{company}}. I would love to connect and share insights about {{title}}.',
    variables: ['firstName', 'company', 'title'],
    isDefault: true,
    createdAt: Date.now(),
    usageCount: 0
  },
  {
    id: 'mutual-connection',
    name: 'Mutual Connection',
    category: 'networking',
    message:
      'Hi {{firstName}}, I noticed we have {{mutualConnections}} mutual connections. I would love to expand my network and connect with you.',
    variables: ['firstName', 'mutualConnections'],
    isDefault: true,
    createdAt: Date.now(),
    usageCount: 0
  },
  {
    id: 'industry-interest',
    name: 'Industry Interest',
    category: 'professional',
    message:
      'Hello {{firstName}}, I am interested in connecting with professionals in {{title}} field. Your experience at {{company}} looks fascinating!',
    variables: ['firstName', 'title', 'company'],
    isDefault: true,
    createdAt: Date.now(),
    usageCount: 0
  },
  {
    id: 'location-based',
    name: 'Location Based',
    category: 'general',
    message:
      'Hi {{firstName}}, I see we are both based in {{location}}. Would love to connect with local professionals like yourself.',
    variables: ['firstName', 'location'],
    isDefault: true,
    createdAt: Date.now(),
    usageCount: 0
  },
  {
    id: 'brief-introduction',
    name: 'Brief Introduction',
    category: 'simple',
    message:
      'Hi {{firstName}}, I would like to connect with you to expand my professional network. Thank you!',
    variables: ['firstName'],
    isDefault: true,
    createdAt: Date.now(),
    usageCount: 0
  }
];

/**
 * Get all message templates from storage
 * @returns {Promise<Array>} Array of message templates
 */
export async function getMessageTemplates() {
  try {
    const result = await getStorageData(STORAGE_KEYS.TEMPLATES);
    const templates = result.message_templates || [];

    // Add default templates if none exist
    if (templates.length === 0) {
      await setStorageData({ [STORAGE_KEYS.TEMPLATES]: DEFAULT_TEMPLATES });
      return DEFAULT_TEMPLATES;
    }

    return templates;
  } catch (error) {
    console.error('Error getting message templates:', error);
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Save a new message template
 * @param {Object} template - Template object
 * @returns {Promise<Object>} Saved template with generated ID
 */
export async function saveMessageTemplate(template) {
  try {
    const templates = await getMessageTemplates();

    const newTemplate = {
      id: template.id || generateTemplateId(),
      name: template.name,
      category: template.category || 'custom',
      message: template.message,
      variables: extractVariables(template.message),
      isDefault: false,
      createdAt: Date.now(),
      usageCount: 0,
      ...template
    };

    templates.push(newTemplate);
    await setStorageData({ [STORAGE_KEYS.TEMPLATES]: templates });

    return newTemplate;
  } catch (error) {
    console.error('Error saving message template:', error);
    throw error;
  }
}

/**
 * Update an existing message template
 * @param {string} templateId - Template ID to update
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated template
 */
export async function updateMessageTemplate(templateId, updates) {
  try {
    const templates = await getMessageTemplates();
    const templateIndex = templates.findIndex(t => t.id === templateId);

    if (templateIndex === -1) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const updatedTemplate = {
      ...templates[templateIndex],
      ...updates,
      variables: updates.message
        ? extractVariables(updates.message)
        : templates[templateIndex].variables,
      updatedAt: Date.now()
    };

    templates[templateIndex] = updatedTemplate;
    await setStorageData({ [STORAGE_KEYS.TEMPLATES]: templates });

    return updatedTemplate;
  } catch (error) {
    console.error('Error updating message template:', error);
    throw error;
  }
}

/**
 * Delete a message template
 * @param {string} templateId - Template ID to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteMessageTemplate(templateId) {
  try {
    const templates = await getMessageTemplates();
    const templateIndex = templates.findIndex(t => t.id === templateId);

    if (templateIndex === -1) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    // Prevent deletion of default templates
    if (templates[templateIndex].isDefault) {
      throw new Error('Cannot delete default templates');
    }

    templates.splice(templateIndex, 1);
    await setStorageData({ [STORAGE_KEYS.TEMPLATES]: templates });

    return true;
  } catch (error) {
    console.error('Error deleting message template:', error);
    throw error;
  }
}

/**
 * Process message template with profile data
 * @param {string} templateId - Template ID or template message
 * @param {Object} profileData - Profile data for variable substitution
 * @returns {Promise<string>} Processed message
 */
export async function processMessageTemplate(templateId, profileData) {
  try {
    let template;

    // If templateId is actually a template object or message string
    if (typeof templateId === 'object') {
      template = templateId;
    } else if (templateId.includes('{{')) {
      // Direct message template string
      template = { message: templateId };
    } else {
      // Template ID - fetch from storage
      const templates = await getMessageTemplates();
      template = templates.find(t => t.id === templateId);

      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
    }

    let processedMessage = template.message;

    // Extract first name from full name
    const firstName = extractFirstName(profileData.name);

    // Create substitution data
    const substitutionData = {
      name: profileData.name || 'there',
      firstName: firstName || 'there',
      title: profileData.title || 'your field',
      company: extractCompany(profileData.title) || 'your company',
      location: profileData.location || 'your area',
      mutualConnections: profileData.mutualConnections || 'several',
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString()
    };

    // Perform variable substitution
    for (const [key, value] of Object.entries(substitutionData)) {
      const variable = `{{${key}}}`;
      processedMessage = processedMessage.replace(new RegExp(variable, 'g'), value);
    }

    // Increment usage count if it's a stored template
    if (typeof templateId === 'string' && !templateId.includes('{{')) {
      await incrementTemplateUsage(templateId);
    }

    return processedMessage;
  } catch (error) {
    console.error('Error processing message template:', error);
    throw error;
  }
}

/**
 * Get templates by category
 * @param {string} category - Template category
 * @returns {Promise<Array>} Filtered templates
 */
export async function getTemplatesByCategory(category) {
  try {
    const templates = await getMessageTemplates();
    return templates.filter(t => t.category === category);
  } catch (error) {
    console.error('Error getting templates by category:', error);
    return [];
  }
}

/**
 * Search templates by name or content
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching templates
 */
export async function searchMessageTemplates(query) {
  try {
    const templates = await getMessageTemplates();
    const lowerQuery = query.toLowerCase();

    return templates.filter(
      template =>
        template.name.toLowerCase().includes(lowerQuery) ||
        template.message.toLowerCase().includes(lowerQuery) ||
        template.category.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching message templates:', error);
    return [];
  }
}

/**
 * Get template usage statistics
 * @returns {Promise<Object>} Usage statistics
 */
export async function getTemplateUsageStats() {
  try {
    const templates = await getMessageTemplates();

    const stats = {
      totalTemplates: templates.length,
      defaultTemplates: templates.filter(t => t.isDefault).length,
      customTemplates: templates.filter(t => !t.isDefault).length,
      totalUsage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0),
      mostUsed: templates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0],
      categories: [...new Set(templates.map(t => t.category))],
      averageUsage:
        templates.length > 0
          ? templates.reduce((sum, t) => sum + (t.usageCount || 0), 0) / templates.length
          : 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting template usage stats:', error);
    return null;
  }
}

/**
 * Validate message template
 * @param {Object} template - Template to validate
 * @returns {Object} Validation result
 */
export function validateMessageTemplate(template) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (!template.message || template.message.trim().length === 0) {
    errors.push('Template message is required');
  }

  // Length validation
  if (template.message && template.message.length > 300) {
    warnings.push('Message is longer than 300 characters (LinkedIn limit)');
  }

  if (template.name && template.name.length > 50) {
    warnings.push('Template name is longer than 50 characters');
  }

  // Variable validation
  const variables = extractVariables(template.message);
  const unsupportedVars = variables.filter(
    v => !Object.keys(TEMPLATE_VARIABLES).includes(v.toUpperCase())
  );

  if (unsupportedVars.length > 0) {
    warnings.push(`Unsupported variables: ${unsupportedVars.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    variables
  };
}

// Helper Functions

/**
 * Generate unique template ID
 * @returns {string} Unique template ID
 */
function generateTemplateId() {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract variables from template message
 * @param {string} message - Template message
 * @returns {Array} Array of variable names
 */
function extractVariables(message) {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables = [];
  let match;

  while ((match = variableRegex.exec(message)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Extract first name from full name
 * @param {string} fullName - Full name
 * @returns {string} First name
 */
function extractFirstName(fullName) {
  if (!fullName) {
    return '';
  }
  return fullName.split(' ')[0];
}

/**
 * Extract company from job title
 * @param {string} title - Job title that might contain company info
 * @returns {string} Company name or default
 */
function extractCompany(title) {
  if (!title) {
    return '';
  }

  // Common patterns: "Title at Company", "Title | Company", "Title - Company"
  const patterns = [/ at (.+)$/i, / \| (.+)$/i, / - (.+)$/i, / @ (.+)$/i];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * Increment template usage count
 * @param {string} templateId - Template ID
 * @returns {Promise<void>}
 */
async function incrementTemplateUsage(templateId) {
  try {
    const templates = await getMessageTemplates();
    const template = templates.find(t => t.id === templateId);

    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      template.lastUsed = Date.now();
      await setStorageData({ [STORAGE_KEYS.TEMPLATES]: templates });
    }
  } catch (error) {
    console.error('Error incrementing template usage:', error);
  }
}
