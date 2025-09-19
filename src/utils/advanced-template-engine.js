// Advanced Template Engine for LinkedIn Automation - Task 3.1
// Complex variable substitution, conditional logic, and personalization

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';

// Template cache for performance optimization
const templateCache = new Map();

/**
 * Advanced template variable patterns and helpers
 */
const VARIABLE_PATTERNS = {
  SIMPLE: /\{\{(\w+(?:\.\w+)*)\}\}/g,
  COMPLEX: /\{\{([^}]+)\}\}/g,
  CONDITIONAL: /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs,
  CONDITIONAL_ELSE: /\{\{#if\s+([^}]+)\}\}(.*?)\{\{else(?:\s+if\s+([^}]+))?\}\}(.*?)\{\{\/if\}\}/gs,
  EACH_LOOP: /\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs,
  HELPER_FUNCTION: /\{\{(\w+)\s+([^}]+)\}\}/g
};

/**
 * Helper functions for template processing
 */
const TEMPLATE_HELPERS = {
  formatDate: (date, format) => {
    if (!date) {
      return '';
    }
    const d = new Date(date);
    if (format === 'MMM YYYY') {
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return d.toLocaleDateString();
  },

  add: (a, b) => (Number(a) || 0) + (Number(b) || 0),
  subtract: (a, b) => (Number(a) || 0) - (Number(b) || 0),
  multiply: (a, b) => (Number(a) || 0) * (Number(b) || 0),
  divide: (a, b) => (Number(a) || 0) / (Number(b) || 1),

  eq: (a, b) => a === b,
  ne: (a, b) => a !== b,
  gt: (a, b) => Number(a) > Number(b),
  gte: (a, b) => Number(a) >= Number(b),
  lt: (a, b) => Number(a) < Number(b),
  lte: (a, b) => Number(a) <= Number(b),

  and: (...args) => args.every(Boolean),
  or: (...args) => args.some(Boolean),
  not: value => !value,

  capitalize: str => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''),
  uppercase: str => (str ? str.toUpperCase() : ''),
  lowercase: str => (str ? str.toLowerCase() : ''),

  truncate: (str, length = 50) =>
    str && str.length > length ? str.substring(0, length) + '...' : str,

  pluralize: (count, singular, plural) => {
    const num = Number(count);
    return num === 1 ? singular : plural || singular + 's';
  }
};

/**
 * Process advanced template with complex variable substitution
 * @param {string|Array|Object} template - Template string, variants array, or template object
 * @param {Object} profileData - Profile data for substitution
 * @param {Object} options - Processing options
 * @returns {Promise<string|Object>} Processed template result
 */
export async function processAdvancedTemplate(template, profileData, options = {}) {
  try {
    // Handle A/B testing variants
    if (Array.isArray(template)) {
      return await processTemplateVariants(template, profileData, options);
    }

    // Handle template object with metadata
    if (typeof template === 'object' && template.template) {
      template = template.template;
    }

    // Handle malformed data
    if (typeof profileData === 'string') {
      try {
        profileData = JSON.parse(profileData);
      } catch (error) {
        return 'Error: template processing error - invalid profile data';
      }
    }

    // Batch processing for arrays
    if (options.batch && Array.isArray(profileData)) {
      return await processBatchTemplates(template, profileData, options);
    }

    const startTime = options.trackPerformance ? Date.now() : null;

    // Sanitize profile data to prevent circular references
    const sanitizedData = sanitizeProfileData(profileData, 0, 10);

    // Process template with caching
    let result;
    const cacheKey = `${template}_${JSON.stringify(sanitizedData).substring(0, 100)}`;

    if (!templateCache.has(cacheKey)) {
      result = await processTemplateString(template, sanitizedData);
      templateCache.set(cacheKey, result);

      // Limit cache size
      if (templateCache.size > 1000) {
        const firstKey = templateCache.keys().next().value;
        templateCache.delete(firstKey);
      }
    } else {
      result = templateCache.get(cacheKey);
    }

    // Apply final processing
    result = await applyAdvancedFormatting(result, sanitizedData);

    // Return with performance metrics if requested
    if (options.trackPerformance) {
      const renderTime = Date.now() - startTime;
      const personalizationScore = await calculatePersonalizationScore(template, profileData);
      const variableCount = extractVariableNames(template).length;

      return {
        message: result,
        performance: {
          renderTime,
          templateId: options.templateId || 'unknown',
          variableCount,
          personalizationScore
        }
      };
    }

    return result;
  } catch (error) {
    console.error('Error processing advanced template:', error);
    return 'Error: template processing failed';
  }
}

/**
 * Process template string with advanced features
 * @param {string} template - Template string
 * @param {Object} data - Profile data
 * @returns {Promise<string>} Processed template
 */
async function processTemplateString(template, data) {
  let result = template;

  // Process conditional blocks with else clauses
  result = await processConditionals(result, data);

  // Process each loops
  result = await processEachLoops(result, data);

  // Process helper functions
  result = await processHelperFunctions(result, data);

  // Process simple variable substitution
  result = processSimpleVariables(result, data);

  return result;
}

/**
 * Process conditional expressions in templates
 * @param {string} template - Template string
 * @param {Object} data - Profile data
 * @returns {Promise<string>} Processed template
 */
async function processConditionals(template, data) {
  // Process if-else-if chains
  template = template.replace(
    VARIABLE_PATTERNS.CONDITIONAL_ELSE,
    (match, condition1, content1, condition2, content2) => {
      const result1 = evaluateCondition(condition1.trim(), data);
      if (result1) {
        return content1.trim();
      }

      if (condition2) {
        const result2 = evaluateCondition(condition2.trim(), data);
        if (result2) {
          return content2.trim();
        }
      } else {
        return content2.trim(); // else block
      }

      return '';
    }
  );

  // Process simple conditionals
  template = template.replace(VARIABLE_PATTERNS.CONDITIONAL, (match, condition, content) => {
    const result = evaluateCondition(condition.trim(), data);
    return result ? content.trim() : '';
  });

  return template;
}

/**
 * Process each loop expressions
 * @param {string} template - Template string
 * @param {Object} data - Profile data
 * @returns {Promise<string>} Processed template
 */
async function processEachLoops(template, data) {
  return template.replace(VARIABLE_PATTERNS.EACH_LOOP, (match, arrayName, content) => {
    const array = getNestedValue(data, arrayName);
    if (!Array.isArray(array)) {
      return '';
    }

    return array
      .map((item, index) => {
        let itemContent = content;

        // Replace item properties
        itemContent = itemContent.replace(/\{\{(\w+)\}\}/g, (match, prop) => {
          return item[prop] || '';
        });

        // Handle @last helper
        itemContent = itemContent.replace(
          /\{\{#unless @last\}\}(.*?)\{\{\/unless\}\}/gs,
          (match, innerContent) => {
            return index === array.length - 1 ? '' : innerContent;
          }
        );

        return itemContent;
      })
      .join('');
  });
}

/**
 * Process helper function calls
 * @param {string} template - Template string
 * @param {Object} data - Profile data
 * @returns {Promise<string>} Processed template
 */
async function processHelperFunctions(template, data) {
  return template.replace(VARIABLE_PATTERNS.HELPER_FUNCTION, (match, helperName, args) => {
    const helper = TEMPLATE_HELPERS[helperName];
    if (!helper) {
      return match;
    }

    // Parse arguments
    const argValues = args.split(/\s+/).map(arg => {
      // If it's a variable reference
      if (arg.includes('.') || data[arg] !== undefined) {
        return getNestedValue(data, arg);
      }
      // If it's a string literal
      if (arg.startsWith('"') && arg.endsWith('"')) {
        return arg.slice(1, -1);
      }
      // If it's a number
      if (!isNaN(arg)) {
        return Number(arg);
      }
      return arg;
    });

    try {
      return helper(...argValues);
    } catch (error) {
      console.error(`Error calling helper ${helperName}:`, error);
      return match;
    }
  });
}

/**
 * Process simple variable substitution with fallbacks
 * @param {string} template - Template string
 * @param {Object} data - Profile data
 * @returns {string} Processed template
 */
function processSimpleVariables(template, data) {
  return template.replace(VARIABLE_PATTERNS.COMPLEX, (match, expression) => {
    // Handle fallback syntax: {{var1 || var2 || "default"}}
    if (expression.includes('||')) {
      const parts = expression.split('||').map(p => p.trim());
      for (const part of parts) {
        if (part.startsWith('"') && part.endsWith('"')) {
          return part.slice(1, -1); // String literal
        }
        const value = getNestedValue(data, part);
        if (value !== null && value !== undefined && value !== '') {
          return String(value);
        }
      }
      return '';
    }

    // Simple variable substitution
    const value = getNestedValue(data, expression.trim());
    return value !== null && value !== undefined ? String(value) : '';
  });
}

/**
 * Evaluate conditional expressions
 * @param {string} condition - Condition expression
 * @param {Object} data - Profile data
 * @returns {boolean} Evaluation result
 */
function evaluateCondition(condition, data) {
  try {
    // Replace variables in condition with actual values
    const evaluableCondition = condition.replace(/(\w+(?:\.\w+)*)/g, (match, varPath) => {
      const value = getNestedValue(data, varPath);
      if (typeof value === 'string') {
        return `"${value}"`;
      }
      return value !== null && value !== undefined ? value : 'null';
    });

    // Safe evaluation using helper functions
    const conditionWithHelpers = evaluableCondition
      .replace(/\beq\(/g, 'TEMPLATE_HELPERS.eq(')
      .replace(/\bne\(/g, 'TEMPLATE_HELPERS.ne(')
      .replace(/\bgt\(/g, 'TEMPLATE_HELPERS.gt(')
      .replace(/\bgte\(/g, 'TEMPLATE_HELPERS.gte(')
      .replace(/\blt\(/g, 'TEMPLATE_HELPERS.lt(')
      .replace(/\blte\(/g, 'TEMPLATE_HELPERS.lte(')
      .replace(/\band\(/g, 'TEMPLATE_HELPERS.and(')
      .replace(/\bor\(/g, 'TEMPLATE_HELPERS.or(')
      .replace(/\bnot\(/g, 'TEMPLATE_HELPERS.not(');

    // Use Function constructor for safer evaluation
    const func = new Function('TEMPLATE_HELPERS', `return ${conditionWithHelpers}`);
    return Boolean(func(TEMPLATE_HELPERS));
  } catch (error) {
    console.error('Error evaluating condition:', condition, error);
    return false;
  }
}

/**
 * Get nested object value by path
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path
 * @returns {*} Value at path or null
 */
function getNestedValue(obj, path) {
  if (!obj || !path) {
    return null;
  }

  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * Sanitize profile data to prevent circular references
 * @param {Object} obj - Object to sanitize
 * @param {number} depth - Current depth
 * @param {number} maxDepth - Maximum allowed depth
 * @returns {Object} Sanitized object
 */
function sanitizeProfileData(obj, depth = 0, maxDepth = 10) {
  if (depth >= maxDepth || obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeProfileData(item, depth + 1, maxDepth));
  }

  const sanitized = {};
  const seen = new Set();

  for (const [key, value] of Object.entries(obj)) {
    if (seen.has(value)) {
      continue;
    } // Skip circular references
    seen.add(value);
    sanitized[key] = sanitizeProfileData(value, depth + 1, maxDepth);
  }

  return sanitized;
}

/**
 * Evaluate template conditions with scoring
 * @param {Array} conditions - Array of condition objects
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Evaluation results
 */
export async function evaluateTemplateConditions(conditions, profileData) {
  const results = {
    matched: [],
    score: 0,
    details: []
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const condition of conditions) {
    const isMatch = evaluateCondition(condition.expression, profileData);
    const weight = condition.weight || 1;

    results.matched.push(isMatch);
    results.details.push({
      expression: condition.expression,
      matched: isMatch,
      weight: weight
    });

    totalWeight += weight;
    if (isMatch) {
      weightedScore += weight;
    }
  }

  results.score = totalWeight > 0 ? weightedScore / totalWeight : 0;
  return results;
}

/**
 * Extract comprehensive profile metadata
 * @param {Object} linkedInProfile - Raw LinkedIn profile data
 * @returns {Promise<Object>} Extracted metadata
 */
export async function extractProfileMetadata(linkedInProfile) {
  const metadata = {
    personalInfo: {},
    professional: {},
    social: {},
    targeting: {}
  };

  // Personal information
  if (linkedInProfile.name) {
    const nameParts = linkedInProfile.name.split(' ');
    metadata.personalInfo = {
      name: linkedInProfile.name,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      headline: linkedInProfile.headline || ''
    };
  }

  // Professional information
  metadata.professional = {
    currentTitle: extractCurrentTitle(linkedInProfile),
    currentCompany: extractCurrentCompany(linkedInProfile),
    industry: inferIndustry(linkedInProfile),
    experienceYears: calculateExperienceYears(linkedInProfile.experience || [])
  };

  // Social information
  metadata.social = {
    connectionCount: parseConnectionCount(linkedInProfile.connections),
    mutualConnections: linkedInProfile.mutualConnections || 0,
    networkStrength: calculateNetworkStrength(linkedInProfile)
  };

  // Targeting information
  metadata.targeting = {
    seniority: inferSeniority(linkedInProfile),
    likelihood: calculateConnectionLikelihood(linkedInProfile),
    personalizationFactors: identifyPersonalizationFactors(linkedInProfile)
  };

  return metadata;
}

/**
 * Calculate personalization score for a template
 * @param {string} template - Template string
 * @param {Object} profileData - Profile data
 * @returns {Promise<number>} Personalization score (0-1)
 */
export async function calculatePersonalizationScore(template, profileData) {
  try {
    const variables = extractVariableNames(template);
    let score = 0;
    let totalPossible = 0;

    // Base score for having any personalization
    if (variables.length > 0) {
      score += 0.2;
    }

    // Score based on variable availability and specificity
    const variableScores = {
      name: 0.1,
      firstName: 0.1,
      company: 0.15,
      'company.name': 0.15,
      title: 0.15,
      location: 0.1,
      'location.city': 0.1,
      mutualConnections: 0.2,
      industry: 0.1,
      skills: 0.1
    };

    variables.forEach(variable => {
      const baseScore = variableScores[variable] || 0.05;
      totalPossible += baseScore;

      const value = getNestedValue(profileData, variable);
      if (value !== null && value !== undefined && value !== '') {
        score += baseScore;
      }
    });

    // Bonus for conditional logic
    if (template.includes('#if')) {
      score += 0.15;
    }

    // Bonus for helper functions
    if (VARIABLE_PATTERNS.HELPER_FUNCTION.test(template)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  } catch (error) {
    console.error('Error calculating personalization score:', error);
    return 0;
  }
}

/**
 * Render template with fallback handling
 * @param {string} template - Template with fallback syntax
 * @param {Object} profileData - Profile data
 * @returns {Promise<string>} Rendered template
 */
export async function renderTemplateWithFallbacks(template, profileData) {
  return processSimpleVariables(template, profileData);
}

/**
 * Optimize template performance for large datasets
 * @param {string} template - Template string
 * @param {Object|Array} profileData - Profile data or array for batch processing
 * @param {Object} options - Optimization options
 * @returns {Promise<string|Array>} Optimized results
 */
export async function optimizeTemplatePerformance(template, profileData, options = {}) {
  if (options.batch && Array.isArray(profileData)) {
    return processBatchTemplates(template, profileData, options);
  }

  // Use cached compiled template if available
  const cacheKey = `compiled_${template}`;
  let compiledTemplate = templateCache.get(cacheKey);

  if (!compiledTemplate) {
    compiledTemplate = await compileTemplate(template);
    templateCache.set(cacheKey, compiledTemplate);
  }

  return executeCompiledTemplate(compiledTemplate, profileData);
}

/**
 * Process template variants for A/B testing
 * @param {Array} variants - Template variants
 * @param {Object} profileData - Profile data
 * @param {Object} options - Processing options
 * @returns {Promise<string>} Selected variant result
 */
async function processTemplateVariants(variants, profileData, options) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return '';
  }

  // Consistent variant selection based on profile data
  const hash = hashProfileData(profileData);
  const selectedIndex = hash % variants.length;
  const selectedVariant = variants[selectedIndex];

  return processAdvancedTemplate(selectedVariant.template || selectedVariant, profileData, {
    ...options,
    abTest: false // Prevent recursion
  });
}

/**
 * Process templates in batches for performance
 * @param {string} template - Template string
 * @param {Array} profileDataArray - Array of profile data
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Array of processed results
 */
async function processBatchTemplates(template, profileDataArray, options) {
  const batchSize = options.batchSize || 100;
  const results = [];

  for (let i = 0; i < profileDataArray.length; i += batchSize) {
    const batch = profileDataArray.slice(i, i + batchSize);
    const batchPromises = batch.map(profileData =>
      processAdvancedTemplate(template, profileData, { ...options, batch: false })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Allow other operations to run
    if (i + batchSize < profileDataArray.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return results;
}

/**
 * Validate advanced template variables
 * @param {string} template - Template to validate
 * @param {Object} profileData - Optional profile data for validation
 * @returns {Promise<Object>} Validation result
 */
export async function validateAdvancedVariables(template, profileData = null) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    variables: [],
    missingVariables: [],
    availableVariables: [],
    suggestions: []
  };

  try {
    // Check for syntax errors
    const syntaxErrors = validateTemplateSyntax(template);
    if (syntaxErrors.length > 0) {
      result.isValid = false;
      result.errors.push(...syntaxErrors);
    }

    // Extract variables
    result.variables = extractVariableNames(template);

    // Validate against profile data if provided
    if (profileData) {
      const availableVars = extractAvailableVariables(profileData);
      result.availableVariables = availableVars;

      result.variables.forEach(variable => {
        const value = getNestedValue(profileData, variable);
        if (value === null || value === undefined) {
          result.missingVariables.push(variable);

          // Suggest alternatives
          const suggestions = findVariableSuggestions(variable, availableVars);
          result.suggestions.push(...suggestions);
        }
      });
    }

    return result;
  } catch (error) {
    console.error('Error validating template variables:', error);
    result.isValid = false;
    result.errors.push('Template validation failed');
    return result;
  }
}

// Helper functions for template validation and processing

function validateTemplateSyntax(template) {
  const errors = [];

  // Check for unmatched braces
  const openBraces = (template.match(/\{\{/g) || []).length;
  const closeBraces = (template.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push('Unclosed variable bracket');
  }

  // Check for invalid conditional syntax
  const conditionalPattern = /\{\{#if\s+([^}]+)\}\}/g;
  let match;
  while ((match = conditionalPattern.exec(template)) !== null) {
    const condition = match[1];
    if (condition.includes('=') && !condition.includes('==') && !condition.includes('!=')) {
      errors.push(`Invalid condition syntax: ${condition}. Use == for equality.`);
    }
    if (condition.includes('>>') || condition.includes('<<') || condition.includes('===')) {
      errors.push(`Invalid operator in condition: ${condition}`);
    }
  }

  return errors;
}

function extractVariableNames(template) {
  const variables = new Set();
  const patterns = [
    /\{\{(\w+(?:\.\w+)*)\}\}/g,
    /\{\{#if\s+[^}]*(\w+(?:\.\w+)*)/g,
    /\{\{#each\s+(\w+)\}\}/g
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(template)) !== null) {
      variables.add(match[1]);
    }
  });

  return Array.from(variables);
}

function extractAvailableVariables(obj, prefix = '') {
  const variables = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    variables.push(fullKey);

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      variables.push(...extractAvailableVariables(value, fullKey));
    }
  }

  return variables;
}

function findVariableSuggestions(requested, available) {
  const suggestions = [];

  available.forEach(avail => {
    const confidence = calculateStringSimilarity(requested, avail);
    if (confidence > 0.6) {
      suggestions.push({
        requested,
        suggested: avail,
        confidence
      });
    }
  });

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = calculateLevenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function calculateLevenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Profile analysis helper functions

function extractCurrentTitle(profile) {
  if (profile.headline) {
    const titleMatch = profile.headline.match(/^([^@]+?)(?:\s+at\s+|$)/);
    return titleMatch ? titleMatch[1].trim() : profile.headline;
  }

  if (profile.experience && profile.experience.length > 0) {
    return profile.experience[0].title;
  }

  return '';
}

function extractCurrentCompany(profile) {
  if (profile.headline) {
    const companyMatch = profile.headline.match(/at\s+(.+)$/);
    if (companyMatch) {
      return companyMatch[1].trim();
    }
  }

  if (profile.experience && profile.experience.length > 0) {
    return profile.experience[0].company;
  }

  return '';
}

function inferIndustry(profile) {
  const title = extractCurrentTitle(profile).toLowerCase();
  const company = extractCurrentCompany(profile).toLowerCase();

  const industryKeywords = {
    Technology: ['software', 'engineer', 'developer', 'tech', 'programming', 'data', 'ai', 'ml'],
    Finance: ['finance', 'banking', 'investment', 'financial', 'analyst', 'trader'],
    Healthcare: ['healthcare', 'medical', 'doctor', 'nurse', 'pharmaceutical', 'biotech'],
    Marketing: ['marketing', 'advertising', 'brand', 'digital marketing', 'seo', 'social media'],
    Sales: ['sales', 'business development', 'account', 'revenue', 'growth']
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => title.includes(keyword) || company.includes(keyword))) {
      return industry;
    }
  }

  return 'Other';
}

function calculateExperienceYears(experience) {
  if (!experience || experience.length === 0) {
    return 0;
  }

  let totalYears = 0;
  experience.forEach(exp => {
    if (exp.duration) {
      const yearMatch = exp.duration.match(/(\d+)\s*year/);
      if (yearMatch) {
        totalYears += parseInt(yearMatch[1]);
      }
    }
  });

  return totalYears;
}

function parseConnectionCount(connections) {
  if (!connections) {
    return 0;
  }

  if (connections.includes('+')) {
    return parseInt(connections) || 500;
  }

  return parseInt(connections) || 0;
}

function calculateNetworkStrength(profile) {
  const connectionCount = parseConnectionCount(profile.connections);
  const mutualCount = profile.mutualConnections || 0;

  if (mutualCount > 10) {
    return 'Strong';
  }
  if (mutualCount > 3) {
    return 'Medium';
  }
  if (connectionCount > 100) {
    return 'Medium';
  }
  return 'Weak';
}

function inferSeniority(profile) {
  const title = extractCurrentTitle(profile).toLowerCase();

  if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
    return 'Senior';
  }
  if (title.includes('director') || title.includes('vp') || title.includes('head')) {
    return 'Executive';
  }
  if (title.includes('manager') || title.includes('supervisor')) {
    return 'Management';
  }
  if (title.includes('junior') || title.includes('associate') || title.includes('intern')) {
    return 'Junior';
  }

  return 'Mid-level';
}

function calculateConnectionLikelihood(profile) {
  let score = 0.5; // Base score

  // Mutual connections boost
  const mutualCount = profile.mutualConnections || 0;
  if (mutualCount > 10) {
    score += 0.3;
  } else if (mutualCount > 3) {
    score += 0.2;
  } else if (mutualCount > 0) {
    score += 0.1;
  }

  // Industry alignment
  if (profile.industry && profile.industry !== 'Other') {
    score += 0.1;
  }

  // Profile completeness
  if (profile.headline) {
    score += 0.05;
  }
  if (profile.experience && profile.experience.length > 0) {
    score += 0.05;
  }
  if (profile.education && profile.education.length > 0) {
    score += 0.05;
  }

  return Math.min(score, 1.0);
}

function identifyPersonalizationFactors(profile) {
  const factors = [];

  if (profile.mutualConnections > 10) {
    factors.push('high_mutual_connections');
  }
  if (profile.mutualConnections > 3) {
    factors.push('mutual_connections');
  }

  const company = extractCurrentCompany(profile).toLowerCase();
  const prestigiousCompanies = ['google', 'microsoft', 'apple', 'amazon', 'facebook', 'netflix'];
  if (prestigiousCompanies.some(c => company.includes(c))) {
    factors.push('prestigious_company');
  }

  if (profile.education) {
    const schools = profile.education.map(e => e.school?.toLowerCase() || '');
    const topSchools = ['stanford', 'mit', 'harvard', 'berkeley', 'cambridge', 'oxford'];
    if (schools.some(school => topSchools.some(top => school.includes(top)))) {
      factors.push('notable_education');
    }
  }

  const seniority = inferSeniority(profile);
  if (seniority === 'Executive') {
    factors.push('executive_level');
  }
  if (seniority === 'Senior') {
    factors.push('senior_level');
  }

  return factors;
}

function hashProfileData(profileData) {
  const str = JSON.stringify(profileData);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

async function compileTemplate(template) {
  // Pre-compile template for faster execution
  return {
    template,
    variables: extractVariableNames(template),
    hasConditionals: template.includes('#if'),
    hasLoops: template.includes('#each'),
    hasHelpers: VARIABLE_PATTERNS.HELPER_FUNCTION.test(template)
  };
}

async function executeCompiledTemplate(compiledTemplate, profileData) {
  return processTemplateString(compiledTemplate.template, profileData);
}

async function applyAdvancedFormatting(result, profileData) {
  // Apply any final formatting rules
  return result.trim();
}
