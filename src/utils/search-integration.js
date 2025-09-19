// LinkedIn Search Integration for Automation

import { extractProfileFromSearchResult } from './linkedin-automation.js';
import { trackEvent, ANALYTICS_EVENTS } from './analytics.js';

/**
 * Process LinkedIn search results for automation
 * @returns {Promise<Array>} Array of processable profiles
 */
export async function processSearchResults() {
  try {
    // Updated search result selectors for current LinkedIn structure (2025)
    const searchResultSelectors = [
      // Primary search result containers
      '[data-control-name="search_srp_result"]',
      '.reusable-search__result-container',
      '.search-result__wrapper',
      '.entity-result',

      // Alternative patterns for 2025
      '.search-results-container li',
      '[data-view-name="search-entity-result"]',
      '.artdeco-entity-lockup',

      // Broader patterns
      '.search-results li',
      '.search-results-list li',
      '.search-results-container .entity-result',
      '.search-noresults + * li',

      // Fallback patterns
      'li[data-entity-urn*="urn:li:fs_profile"]',
      'li[data-entity-urn*="person"]',
      '[data-test-search-result]',

      // Even broader fallbacks
      '.search-results div[class*="entity"]',
      '.search-results div[class*="result"]'
    ];

    let searchResults = [];

    // Try each selector until we find search results
    for (const selector of searchResultSelectors) {
      try {
        searchResults = document.querySelectorAll(selector);
        if (searchResults.length > 0) {
          console.log(`Found ${searchResults.length} search results using selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`Selector "${selector}" failed:`, error.message);
        continue;
      }
    }

    // If no search results found, provide debugging information
    if (searchResults.length === 0) {
      console.log('No search results found. Debugging page structure:');
      console.log('- Current URL:', window.location.href);
      console.log('- Page title:', document.title);
      console.log('- Main container classes:', document.querySelector('main')?.className || 'No main element');
      console.log('- All elements with "search" in class:', Array.from(document.querySelectorAll('[class*="search"]')).slice(0, 5).map(el => el.className));
      console.log('- All elements with "result" in class:', Array.from(document.querySelectorAll('[class*="result"]')).slice(0, 5).map(el => el.className));
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
    // Updated pagination selectors for current LinkedIn structure (2025)
    const nextButtonSelectors = [
      // Primary pagination selectors
      '[aria-label="Next"]',
      'button[aria-label="Next"]',
      '.artdeco-pagination__button--next',
      '.search-results__pagination-next-btn',

      // Alternative pagination patterns
      'button[aria-label*="next" i]',
      'button[aria-label*="Next" i]',
      '.pagination-controls .next',
      '.artdeco-pagination button[aria-label*="Next"]',

      // Broader fallbacks
      '.artdeco-pagination__pages-container + button',
      '.artdeco-pagination .artdeco-button:last-child',
      'button[data-test-pagination-page-btn]:last-child',

      // Text-based fallbacks
      'button:contains("Next")',
      'button:contains("next")',

      // Icon-based fallbacks for newer structures
      'button svg[data-test-icon="chevron-right-icon"]',
      'button .chevron-right-icon',

      // Generic pagination fallbacks
      '.pagination button:last-child',
      '[class*="pagination"] button:last-child',
      'nav[aria-label*="pagination"] button:last-child'
    ];

    for (const selector of nextButtonSelectors) {
      try {
        const nextButton = document.querySelector(selector);
        if (nextButton && !nextButton.disabled && !nextButton.classList.contains('disabled')) {
          console.log(`Navigating to next page using selector: ${selector}`);
          nextButton.click();
          return true;
        }
      } catch (error) {
        console.log(`Pagination selector "${selector}" failed:`, error.message);
        continue;
      }
    }

    // Enhanced debugging for pagination issues
    console.log('No active next button found. Debugging pagination:');
    console.log('- All buttons on page:', Array.from(document.querySelectorAll('button')).slice(0, 10).map(btn => ({
      text: btn.textContent?.trim(),
      ariaLabel: btn.getAttribute('aria-label'),
      className: btn.className,
      disabled: btn.disabled
    })));
    console.log('- Elements with pagination in class:', Array.from(document.querySelectorAll('[class*="pagination"]')).map(el => el.className));

    return false;
  } catch (error) {
    console.error('Error navigating to next page:', error);
    return false;
  }
}
