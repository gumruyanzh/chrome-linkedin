// Saved Search Profiles System - Task 3.4
// Reusable search configuration and profile management

import { getStorageData, setStorageData, STORAGE_KEYS } from './storage.js';

/**
 * Default search profile template
 */
const DEFAULT_SEARCH_PROFILE = {
  name: 'New Search Profile',
  description: '',
  criteria: {
    keywords: '',
    location: '',
    company: '',
    industry: '',
    title: '',
    experienceLevel: '',
    schoolName: '',
    currentCompany: '',
    pastCompany: '',
    profileLanguage: 'en',
    geoUrn: '',
    network: '',
    connectionOf: '',
    facetCurrentCompany: '',
    facetPastCompany: '',
    facetIndustry: '',
    facetSchool: '',
    facetGeoRegion: '',
    facetNetwork: ''
  },
  filters: {
    connectionDegree: 'all', // 1st, 2nd, 3rd+, all
    resultType: 'people', // people, companies, jobs
    sortBy: 'relevance', // relevance, recency, connections
    timeframe: 'all', // past-24h, past-week, past-month, all
    excludeViewed: false,
    excludeConnected: false,
    minConnections: 0,
    maxConnections: 500
  },
  advanced: {
    booleanSearch: false,
    includeKeywords: [],
    excludeKeywords: [],
    mustHaveKeywords: [],
    exactPhrases: [],
    customFilters: []
  },
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastUsed: null,
    usageCount: 0,
    resultsFound: 0,
    successRate: 0,
    category: 'general',
    tags: []
  },
  sharing: {
    isShared: false,
    shareId: null,
    sharedWith: [],
    permissions: 'view' // view, edit, duplicate
  }
};

/**
 * Create new search profile
 * @param {Object} profileData - Search profile data
 * @returns {Promise<Object>} Created search profile
 */
export async function createSearchProfile(profileData = {}) {
  try {
    const profile = {
      ...DEFAULT_SEARCH_PROFILE,
      ...profileData,
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        ...DEFAULT_SEARCH_PROFILE.metadata,
        ...profileData.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    };

    // Validate profile data
    const validation = validateSearchProfile(profile);
    if (!validation.isValid) {
      throw new Error(`Search profile validation failed: ${validation.errors.join(', ')}`);
    }

    // Save profile
    const profiles = await getSearchProfiles();
    profiles.push(profile);
    await saveSearchProfiles(profiles);

    return profile;

  } catch (error) {
    console.error('Error creating search profile:', error);
    throw error;
  }
}

/**
 * Get all search profiles
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of search profiles
 */
export async function getSearchProfiles(options = {}) {
  try {
    const data = await getStorageData(STORAGE_KEYS.SAVED_SEARCHES);
    let profiles = data.saved_searches || [];

    // Apply filters
    if (options.category) {
      profiles = profiles.filter(p => p.metadata.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      profiles = profiles.filter(p =>
        options.tags.some(tag => p.metadata.tags.includes(tag))
      );
    }

    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      profiles = profiles.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        Object.values(p.criteria).some(value =>
          typeof value === 'string' && value.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Apply sorting
    if (options.sortBy) {
      profiles = sortProfiles(profiles, options.sortBy, options.sortOrder);
    }

    return profiles;

  } catch (error) {
    console.error('Error getting search profiles:', error);
    return [];
  }
}

/**
 * Get search profile by ID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object|null>} Search profile or null
 */
export async function getSearchProfileById(profileId) {
  try {
    const profiles = await getSearchProfiles();
    return profiles.find(p => p.id === profileId) || null;
  } catch (error) {
    console.error('Error getting search profile by ID:', error);
    return null;
  }
}

/**
 * Update search profile
 * @param {string} profileId - Profile ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated profile
 */
export async function updateSearchProfile(profileId, updates) {
  try {
    const profiles = await getSearchProfiles();
    const profileIndex = profiles.findIndex(p => p.id === profileId);

    if (profileIndex === -1) {
      throw new Error(`Search profile with ID ${profileId} not found`);
    }

    // Update profile
    const updatedProfile = {
      ...profiles[profileIndex],
      ...updates,
      metadata: {
        ...profiles[profileIndex].metadata,
        ...updates.metadata,
        updatedAt: Date.now()
      }
    };

    // Validate updated profile
    const validation = validateSearchProfile(updatedProfile);
    if (!validation.isValid) {
      throw new Error(`Search profile validation failed: ${validation.errors.join(', ')}`);
    }

    profiles[profileIndex] = updatedProfile;
    await saveSearchProfiles(profiles);

    return updatedProfile;

  } catch (error) {
    console.error('Error updating search profile:', error);
    throw error;
  }
}

/**
 * Delete search profile
 * @param {string} profileId - Profile ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSearchProfile(profileId) {
  try {
    const profiles = await getSearchProfiles();
    const profileIndex = profiles.findIndex(p => p.id === profileId);

    if (profileIndex === -1) {
      throw new Error(`Search profile with ID ${profileId} not found`);
    }

    profiles.splice(profileIndex, 1);
    await saveSearchProfiles(profiles);

    return true;

  } catch (error) {
    console.error('Error deleting search profile:', error);
    return false;
  }
}

/**
 * Duplicate search profile
 * @param {string} profileId - Profile ID to duplicate
 * @param {Object} options - Duplication options
 * @returns {Promise<Object>} Duplicated profile
 */
export async function duplicateSearchProfile(profileId, options = {}) {
  try {
    const originalProfile = await getSearchProfileById(profileId);
    if (!originalProfile) {
      throw new Error(`Search profile with ID ${profileId} not found`);
    }

    const duplicatedProfile = {
      ...originalProfile,
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: options.name || `Copy of ${originalProfile.name}`,
      description: options.description || originalProfile.description,
      metadata: {
        ...originalProfile.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastUsed: null,
        usageCount: 0,
        duplicatedFrom: profileId
      },
      sharing: {
        isShared: false,
        shareId: null,
        sharedWith: [],
        permissions: 'view'
      }
    };

    const profiles = await getSearchProfiles();
    profiles.push(duplicatedProfile);
    await saveSearchProfiles(profiles);

    return duplicatedProfile;

  } catch (error) {
    console.error('Error duplicating search profile:', error);
    throw error;
  }
}

/**
 * Execute search profile and return LinkedIn search URL
 * @param {string|Object} profileOrId - Profile ID or profile object
 * @returns {Promise<Object>} Search execution result
 */
export async function executeSearchProfile(profileOrId) {
  try {
    let profile;

    if (typeof profileOrId === 'string') {
      profile = await getSearchProfileById(profileOrId);
      if (!profile) {
        throw new Error(`Search profile with ID ${profileOrId} not found`);
      }
    } else {
      profile = profileOrId;
    }

    // Build LinkedIn search URL
    const searchUrl = buildLinkedInSearchUrl(profile);

    // Update usage statistics
    await updateProfileUsage(profile.id);

    return {
      success: true,
      searchUrl,
      profile,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error executing search profile:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Build LinkedIn search URL from profile criteria
 * @param {Object} profile - Search profile
 * @returns {string} LinkedIn search URL
 */
export function buildLinkedInSearchUrl(profile) {
  const baseUrl = 'https://www.linkedin.com/search/results/people/';
  const params = new URLSearchParams();

  // Basic criteria
  if (profile.criteria.keywords) {
    params.set('keywords', profile.criteria.keywords);
  }

  if (profile.criteria.location) {
    params.set('geoUrn', encodeLocationToUrn(profile.criteria.location));
  }

  if (profile.criteria.company) {
    params.set('facetCurrentCompany', encodeCompanyToFacet(profile.criteria.company));
  }

  if (profile.criteria.pastCompany) {
    params.set('facetPastCompany', encodeCompanyToFacet(profile.criteria.pastCompany));
  }

  if (profile.criteria.industry) {
    params.set('facetIndustry', encodeIndustryToFacet(profile.criteria.industry));
  }

  if (profile.criteria.schoolName) {
    params.set('facetSchool', encodeSchoolToFacet(profile.criteria.schoolName));
  }

  // Connection degree
  if (profile.filters.connectionDegree !== 'all') {
    params.set('facetNetwork', `["${profile.filters.connectionDegree.toUpperCase()}"]`);
  }

  // Sort options
  if (profile.filters.sortBy !== 'relevance') {
    params.set('sortBy', profile.filters.sortBy);
  }

  // Advanced boolean search
  if (profile.advanced.booleanSearch && profile.advanced.includeKeywords.length > 0) {
    const booleanQuery = buildBooleanSearchQuery(profile.advanced);
    params.set('keywords', booleanQuery);
  }

  const url = `${baseUrl}?${params.toString()}`;
  return url;
}

/**
 * Build boolean search query from advanced criteria
 * @param {Object} advanced - Advanced search criteria
 * @returns {string} Boolean search query
 */
function buildBooleanSearchQuery(advanced) {
  const parts = [];

  // Include keywords (OR)
  if (advanced.includeKeywords.length > 0) {
    parts.push(`(${advanced.includeKeywords.join(' OR ')})`);
  }

  // Must have keywords (AND)
  if (advanced.mustHaveKeywords.length > 0) {
    parts.push(...advanced.mustHaveKeywords.map(keyword => `+${keyword}`));
  }

  // Exact phrases
  if (advanced.exactPhrases.length > 0) {
    parts.push(...advanced.exactPhrases.map(phrase => `"${phrase}"`));
  }

  // Exclude keywords (NOT)
  if (advanced.excludeKeywords.length > 0) {
    parts.push(...advanced.excludeKeywords.map(keyword => `-${keyword}`));
  }

  return parts.join(' ');
}

/**
 * Import search profiles from external data
 * @param {Array} profilesData - Array of profile data
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
export async function importSearchProfiles(profilesData, options = {}) {
  try {
    const results = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: []
    };

    const existingProfiles = await getSearchProfiles();

    for (const profileData of profilesData) {
      try {
        // Check for duplicates if enabled
        if (options.preventDuplicates) {
          const isDuplicate = existingProfiles.some(existing =>
            existing.name === profileData.name ||
            JSON.stringify(existing.criteria) === JSON.stringify(profileData.criteria)
          );

          if (isDuplicate) {
            results.skipped++;
            continue;
          }
        }

        // Create new profile
        await createSearchProfile(profileData);
        results.imported++;

      } catch (error) {
        results.errors.push({
          profile: profileData.name || 'Unnamed',
          error: error.message
        });
        results.skipped++;
      }
    }

    return results;

  } catch (error) {
    console.error('Error importing search profiles:', error);
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
 * Export search profiles
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Export result
 */
export async function exportSearchProfiles(options = {}) {
  try {
    let profiles = await getSearchProfiles();

    // Apply filters
    if (options.profileIds && options.profileIds.length > 0) {
      profiles = profiles.filter(p => options.profileIds.includes(p.id));
    }

    if (options.category) {
      profiles = profiles.filter(p => p.metadata.category === options.category);
    }

    // Format for export
    const exportData = {
      version: '1.0',
      exportedAt: Date.now(),
      profileCount: profiles.length,
      profiles: profiles.map(profile => {
        const exportProfile = {
          name: profile.name,
          description: profile.description,
          criteria: profile.criteria,
          filters: profile.filters,
          metadata: {
            category: profile.metadata.category,
            tags: profile.metadata.tags
          }
        };

        if (options.includeAdvanced) {
          exportProfile.advanced = profile.advanced;
        }

        if (options.includeStats) {
          exportProfile.metadata.usageCount = profile.metadata.usageCount;
          exportProfile.metadata.successRate = profile.metadata.successRate;
        }

        return exportProfile;
      })
    };

    return {
      success: true,
      data: exportData,
      count: profiles.length
    };

  } catch (error) {
    console.error('Error exporting search profiles:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get search profile categories and statistics
 * @returns {Promise<Object>} Categories and stats
 */
export async function getSearchProfileStats() {
  try {
    const profiles = await getSearchProfiles();

    const stats = {
      totalProfiles: profiles.length,
      categories: {},
      topTags: {},
      recentlyUsed: [],
      mostUsed: [],
      averageSuccessRate: 0,
      totalUsage: 0
    };

    profiles.forEach(profile => {
      // Categories
      const category = profile.metadata.category || 'uncategorized';
      stats.categories[category] = (stats.categories[category] || 0) + 1;

      // Tags
      profile.metadata.tags.forEach(tag => {
        stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
      });

      // Usage stats
      stats.totalUsage += profile.metadata.usageCount || 0;

      if (profile.metadata.lastUsed) {
        stats.recentlyUsed.push({
          id: profile.id,
          name: profile.name,
          lastUsed: profile.metadata.lastUsed
        });
      }
    });

    // Sort and limit arrays
    stats.recentlyUsed = stats.recentlyUsed
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 10);

    stats.mostUsed = profiles
      .filter(p => p.metadata.usageCount > 0)
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        usageCount: p.metadata.usageCount
      }));

    // Average success rate
    const profilesWithSuccess = profiles.filter(p => p.metadata.usageCount > 0);
    if (profilesWithSuccess.length > 0) {
      stats.averageSuccessRate = profilesWithSuccess
        .reduce((sum, p) => sum + (p.metadata.successRate || 0), 0) / profilesWithSuccess.length;
    }

    return stats;

  } catch (error) {
    console.error('Error getting search profile stats:', error);
    return null;
  }
}

/**
 * Optimize search profiles by removing unused and merging similar
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Optimization results
 */
export async function optimizeSearchProfiles(options = {}) {
  try {
    const profiles = await getSearchProfiles();
    const results = {
      profilesBefore: profiles.length,
      profilesAfter: 0,
      duplicatesRemoved: 0,
      unusedRemoved: 0,
      changes: []
    };

    let optimizedProfiles = [...profiles];

    // Remove unused profiles
    if (options.removeUnused) {
      const unusedThreshold = options.unusedDays || 90;
      const cutoffDate = Date.now() - (unusedThreshold * 24 * 60 * 60 * 1000);

      const beforeCount = optimizedProfiles.length;
      optimizedProfiles = optimizedProfiles.filter(profile => {
        const isUnused = !profile.metadata.lastUsed ||
                        profile.metadata.lastUsed < cutoffDate;
        const hasLowUsage = (profile.metadata.usageCount || 0) === 0;

        return !(isUnused && hasLowUsage);
      });

      results.unusedRemoved = beforeCount - optimizedProfiles.length;
      if (results.unusedRemoved > 0) {
        results.changes.push(`Removed ${results.unusedRemoved} unused profiles`);
      }
    }

    // Remove similar profiles
    if (options.removeSimilar) {
      const beforeCount = optimizedProfiles.length;
      optimizedProfiles = removeSimilarProfiles(optimizedProfiles, options.similarityThreshold || 0.8);

      results.duplicatesRemoved = beforeCount - optimizedProfiles.length;
      if (results.duplicatesRemoved > 0) {
        results.changes.push(`Removed ${results.duplicatesRemoved} similar profiles`);
      }
    }

    results.profilesAfter = optimizedProfiles.length;

    if (results.changes.length > 0) {
      await saveSearchProfiles(optimizedProfiles);
    }

    return results;

  } catch (error) {
    console.error('Error optimizing search profiles:', error);
    return {
      profilesBefore: 0,
      profilesAfter: 0,
      duplicatesRemoved: 0,
      unusedRemoved: 0,
      changes: [],
      error: error.message
    };
  }
}

// Helper Functions

async function saveSearchProfiles(profiles) {
  await setStorageData({
    [STORAGE_KEYS.SAVED_SEARCHES]: profiles
  });
}

async function updateProfileUsage(profileId) {
  try {
    const profiles = await getSearchProfiles();
    const profile = profiles.find(p => p.id === profileId);

    if (profile) {
      profile.metadata.lastUsed = Date.now();
      profile.metadata.usageCount = (profile.metadata.usageCount || 0) + 1;
      await saveSearchProfiles(profiles);
    }
  } catch (error) {
    console.error('Error updating profile usage:', error);
  }
}

function validateSearchProfile(profile) {
  const errors = [];

  if (!profile.name || profile.name.trim().length === 0) {
    errors.push('Profile name is required');
  }

  if (profile.name && profile.name.length > 100) {
    errors.push('Profile name must be 100 characters or less');
  }

  // Check if at least one search criteria is provided
  const criteriaValues = Object.values(profile.criteria).filter(value =>
    typeof value === 'string' && value.trim().length > 0
  );

  if (criteriaValues.length === 0) {
    errors.push('At least one search criteria must be provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function sortProfiles(profiles, sortBy, sortOrder = 'desc') {
  return profiles.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);

      case 'created':
        aValue = a.metadata.createdAt;
        bValue = b.metadata.createdAt;
        break;

      case 'lastUsed':
        aValue = a.metadata.lastUsed || 0;
        bValue = b.metadata.lastUsed || 0;
        break;

      case 'usage':
        aValue = a.metadata.usageCount || 0;
        bValue = b.metadata.usageCount || 0;
        break;

      case 'success':
        aValue = a.metadata.successRate || 0;
        bValue = b.metadata.successRate || 0;
        break;

      default:
        return 0;
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });
}

function removeSimilarProfiles(profiles, threshold) {
  const toRemove = [];

  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const similarity = calculateProfileSimilarity(profiles[i], profiles[j]);

      if (similarity >= threshold) {
        // Keep the one with higher usage
        const keepFirst = (profiles[i].metadata.usageCount || 0) >= (profiles[j].metadata.usageCount || 0);
        toRemove.push(keepFirst ? j : i);
      }
    }
  }

  // Remove duplicates in reverse order to maintain indices
  const uniqueIndices = [...new Set(toRemove)].sort((a, b) => b - a);
  uniqueIndices.forEach(index => profiles.splice(index, 1));

  return profiles;
}

function calculateProfileSimilarity(profile1, profile2) {
  const criteria1 = JSON.stringify(profile1.criteria);
  const criteria2 = JSON.stringify(profile2.criteria);

  if (criteria1 === criteria2) return 1.0;

  // Calculate Jaccard similarity of criteria values
  const values1 = new Set(Object.values(profile1.criteria).filter(v => v && v.trim()));
  const values2 = new Set(Object.values(profile2.criteria).filter(v => v && v.trim()));

  const intersection = new Set([...values1].filter(v => values2.has(v)));
  const union = new Set([...values1, ...values2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

// LinkedIn URL encoding helpers (simplified versions)
function encodeLocationToUrn(location) {
  // This would map location strings to LinkedIn URNs
  // For demo purposes, returning a placeholder
  return `["${encodeURIComponent(location)}"]`;
}

function encodeCompanyToFacet(company) {
  // This would map company names to LinkedIn facet IDs
  return `["${encodeURIComponent(company)}"]`;
}

function encodeIndustryToFacet(industry) {
  // This would map industry names to LinkedIn facet IDs
  return `["${encodeURIComponent(industry)}"]`;
}

function encodeSchoolToFacet(school) {
  // This would map school names to LinkedIn facet IDs
  return `["${encodeURIComponent(school)}"]`;
}