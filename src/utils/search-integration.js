// LinkedIn Search Integration for Automation

import { extractProfileFromSearchResult } from './linkedin-automation.js';
import { trackEvent, ANALYTICS_EVENTS } from './analytics.js';

/**
 * Process LinkedIn search results for automation
 * @returns {Promise<Array>} Array of processable profiles
 */
export async function processSearchResults() {
  try {
    // Updated search result selectors for current LinkedIn structure
    const searchResultSelectors = [
      '[data-control-name="search_srp_result"]',
      '.reusable-search__result-container',
      '.search-result__wrapper',
      '.entity-result',
      '.search-results-container li',
      '[data-view-name="search-entity-result"]',
      '.artdeco-entity-lockup'
    ];

    let searchResults = [];

    // Try each selector until we find search results
    for (const selector of searchResultSelectors) {
      searchResults = document.querySelectorAll(selector);
      if (searchResults.length > 0) {
        console.log(`Found ${searchResults.length} search results using selector: ${selector}`);
        break;
      }
    }

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
    // Updated pagination selectors for current LinkedIn structure
    const nextButtonSelectors = [
      '[aria-label="Next"]',
      '.artdeco-pagination__button--next',
      '.search-results__pagination-next-btn',
      'button[aria-label*="next"]',
      '.pagination-controls .next',
      'button[data-test-pagination-page-btn]:last-child'
    ];

    for (const selector of nextButtonSelectors) {
      const nextButton = document.querySelector(selector);
      if (nextButton && !nextButton.disabled && !nextButton.classList.contains('disabled')) {
        console.log(`Navigating to next page using selector: ${selector}`);
        nextButton.click();
        return true;
      }
    }

    console.log('No active next button found');
    return false;
  } catch (error) {
    console.error('Error navigating to next page:', error);
    return false;
  }
}
