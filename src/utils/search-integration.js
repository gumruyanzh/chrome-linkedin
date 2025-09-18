// LinkedIn Search Integration for Automation

import { extractProfileFromSearchResult } from './linkedin-automation.js';
import { trackEvent, ANALYTICS_EVENTS } from './analytics.js';

/**
 * Process LinkedIn search results for automation
 * @returns {Promise<Array>} Array of processable profiles
 */
export async function processSearchResults() {
  try {
    const searchResults = document.querySelectorAll('[data-control-name="search_srp_result"]');
    const profiles = [];

    for (const resultElement of searchResults) {
      const profile = extractProfileFromSearchResult(resultElement);
      if (profile && profile.canConnect) {
        profiles.push(profile);
      }
    }

    await trackEvent(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
      resultsFound: searchResults.length,
      connectableProfiles: profiles.length,
      searchUrl: window.location.href
    });

    return profiles;
  } catch (error) {
    console.error('Error processing search results:', error);
    return [];
  }
}

/**
 * Get search criteria from current URL
 * @returns {Object} Search criteria object
 */
export function extractSearchCriteria() {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  return {
    keywords: params.get('keywords') || '',
    location: params.get('geoUrn') || '',
    industry: params.get('industry') || '',
    company: params.get('company') || '',
    title: params.get('title') || '',
    page: params.get('page') || '1'
  };
}

/**
 * Navigate to next page of search results
 * @returns {Promise<boolean>} True if navigation was successful
 */
export async function navigateToNextPage() {
  try {
    const nextButton = document.querySelector('[aria-label="Next"]');
    if (nextButton && !nextButton.disabled) {
      nextButton.click();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error navigating to next page:', error);
    return false;
  }
}