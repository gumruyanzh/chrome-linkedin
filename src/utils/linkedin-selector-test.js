// LinkedIn Selector Testing Utility
// This helps identify current LinkedIn DOM structure for automation

export function analyzeLinkedInPage() {
  const analysis = {
    pageType: detectPageType(),
    availableSelectors: {},
    recommendations: []
  };

  if (analysis.pageType === 'search') {
    analysis.availableSelectors.searchResults = findSearchResultSelectors();
    analysis.availableSelectors.connectButtons = findConnectButtonSelectors();
    analysis.availableSelectors.profileNames = findProfileNameSelectors();
    analysis.availableSelectors.pagination = findPaginationSelectors();
  } else if (analysis.pageType === 'profile') {
    analysis.availableSelectors.connectButtons = findConnectButtonSelectors();
    analysis.availableSelectors.profileInfo = findProfileInfoSelectors();
  }

  return analysis;
}

function detectPageType() {
  if (window.location.href.includes('/search/people/') || window.location.href.includes('/search/results/people/')) {
    return 'search';
  } else if (window.location.href.includes('/in/')) {
    return 'profile';
  } else {
    return 'other';
  }
}

function findSearchResultSelectors() {
  const candidates = [
    '[data-control-name="search_srp_result"]',
    '.reusable-search__result-container',
    '.search-result__wrapper',
    '.entity-result',
    '.search-results-container li',
    '[data-view-name="search-entity-result"]',
    '.artdeco-entity-lockup'
  ];

  const found = [];
  candidates.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      found.push({
        selector,
        count: elements.length,
        sample: elements[0]?.className || 'no-class'
      });
    }
  });

  return found;
}

function findConnectButtonSelectors() {
  const candidates = [
    'button[aria-label*="Invite"][aria-label*="connect"]',
    'button[aria-label*="Connect"]',
    'button[data-control-name="connect"]',
    'button[data-control-name="invite"]',
    '.artdeco-button--2[aria-label*="connect"]',
    '.search-result__actions button',
    '.entity-result__actions button',
    'button:contains("Connect")',
    '[data-test-person-result-page-connect-button]'
  ];

  const found = [];
  candidates.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        found.push({
          selector,
          count: elements.length,
          sampleText: elements[0]?.textContent?.trim() || 'no-text',
          sampleAriaLabel: elements[0]?.getAttribute('aria-label') || 'no-aria'
        });
      }
    } catch (e) {
      // Skip invalid selectors
    }
  });

  return found;
}

function findProfileNameSelectors() {
  const candidates = [
    '.entity-result__title-text a',
    '.app-aware-link .entity-result__title-text',
    '.search-result__info .actor-name',
    '.artdeco-entity-lockup__title a',
    '.reusable-search__result-container .entity-result__title-text a',
    '[data-control-name="search_srp_result"] a[href*="/in/"]'
  ];

  const found = [];
  candidates.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      found.push({
        selector,
        count: elements.length,
        sampleText: elements[0]?.textContent?.trim() || 'no-text',
        sampleHref: elements[0]?.href || 'no-href'
      });
    }
  });

  return found;
}

function findPaginationSelectors() {
  const candidates = [
    '[aria-label="Next"]',
    '.artdeco-pagination__button--next',
    '.search-results__pagination-next-btn',
    'button[aria-label*="next"]',
    '.pagination-controls .next'
  ];

  const found = [];
  candidates.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      found.push({
        selector,
        count: elements.length,
        sampleText: elements[0]?.textContent?.trim() || 'no-text',
        disabled: elements[0]?.disabled || false
      });
    }
  });

  return found;
}

function findProfileInfoSelectors() {
  const candidates = [
    '.text-heading-xlarge',
    '.pv-text-details__left-panel h1',
    '.top-card-layout__title',
    '.pv-top-card .pv-entity__summary-info h1'
  ];

  const found = [];
  candidates.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      found.push({
        selector,
        count: elements.length,
        sampleText: elements[0]?.textContent?.trim() || 'no-text'
      });
    }
  });

  return found;
}

// Export test function for console debugging
window.linkedInAnalysis = analyzeLinkedInPage;

console.log('LinkedIn Selector Analysis loaded. Run linkedInAnalysis() in console to test.');
