// LinkedIn Selector Validation Test
// Copy and paste this into browser console on LinkedIn to test selectors

function validateLinkedInSelectors() {
  console.log('🔍 Testing LinkedIn Automation Selectors...\n');

  const results = {
    pageType: window.location.href.includes('/search/people/') ? 'search' :
              window.location.href.includes('/in/') ? 'profile' : 'other',
    searchResults: { found: 0, selector: null },
    connectButtons: { found: 0, selectors: [] },
    profileNames: { found: 0, selectors: [] },
    pagination: { found: 0, selector: null }
  };

  console.log(`📍 Page Type: ${results.pageType}`);

  if (results.pageType === 'search') {
    // Test search result selectors
    const searchSelectors = [
      '[data-control-name="search_srp_result"]',
      '.reusable-search__result-container',
      '.search-result__wrapper',
      '.entity-result',
      '.search-results-container li',
      '[data-view-name="search-entity-result"]',
      '.artdeco-entity-lockup'
    ];

    for (const selector of searchSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results.searchResults.found = elements.length;
        results.searchResults.selector = selector;
        console.log(`✅ Search Results: Found ${elements.length} using "${selector}"`);
        break;
      }
    }

    if (results.searchResults.found === 0) {
      console.log('❌ Search Results: No results found with any selector');
    }

    // Test connect button selectors
    const connectSelectors = [
      'button[aria-label*="Invite"][aria-label*="connect"]',
      'button[aria-label*="Connect"]',
      'button[data-control-name="connect"]',
      'button[data-control-name="invite"]',
      '.artdeco-button--2[aria-label*="connect"]',
      '.search-result__actions button[aria-label*="connect"]',
      '.entity-result__actions button[aria-label*="connect"]',
      '[data-test-person-result-page-connect-button]'
    ];

    for (const selector of connectSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results.connectButtons.found += elements.length;
        results.connectButtons.selectors.push({ selector, count: elements.length });
        console.log(`✅ Connect Buttons: Found ${elements.length} using "${selector}"`);
      }
    }

    if (results.connectButtons.found === 0) {
      console.log('❌ Connect Buttons: No buttons found with any selector');
    }

    // Test profile name selectors
    const nameSelectors = [
      '.entity-result__title-text a',
      '.app-aware-link .entity-result__title-text',
      '.search-result__info .actor-name a',
      '.artdeco-entity-lockup__title a',
      '.reusable-search__result-container .entity-result__title-text a',
      '[data-control-name="search_srp_result"] a[href*="/in/"]',
      '.actor-name a'
    ];

    for (const selector of nameSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results.profileNames.found += elements.length;
        results.profileNames.selectors.push({ selector, count: elements.length });
        console.log(`✅ Profile Names: Found ${elements.length} using "${selector}"`);
      }
    }

    if (results.profileNames.found === 0) {
      console.log('❌ Profile Names: No names found with any selector');
    }

    // Test pagination selectors
    const paginationSelectors = [
      '[aria-label="Next"]',
      '.artdeco-pagination__button--next',
      '.search-results__pagination-next-btn',
      'button[aria-label*="next"]',
      '.pagination-controls .next',
      'button[data-test-pagination-page-btn]:last-child'
    ];

    for (const selector of paginationSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        results.pagination.found = 1;
        results.pagination.selector = selector;
        results.pagination.disabled = element.disabled || element.classList.contains('disabled');
        console.log(`✅ Pagination: Found next button using "${selector}" (disabled: ${results.pagination.disabled})`);
        break;
      }
    }

    if (results.pagination.found === 0) {
      console.log('❌ Pagination: No next button found with any selector');
    }

  } else if (results.pageType === 'profile') {
    // Test profile page connect buttons
    const profileConnectSelectors = [
      'button[aria-label*="Invite"][aria-label*="connect"]',
      'button[aria-label*="Connect"]',
      'button[data-control-name="connect"]',
      'button[data-control-name="invite"]',
      '.artdeco-button--2[aria-label*="connect"]',
      '.pv-s-profile-actions button',
      '.artdeco-button--primary'
    ];

    for (const selector of profileConnectSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results.connectButtons.found += elements.length;
        results.connectButtons.selectors.push({ selector, count: elements.length });
        console.log(`✅ Profile Connect Buttons: Found ${elements.length} using "${selector}"`);
      }
    }

    if (results.connectButtons.found === 0) {
      console.log('❌ Profile Connect Buttons: No buttons found with any selector');
    }
  }

  console.log('\n📊 Summary:');
  console.log('═══════════');
  if (results.pageType === 'search') {
    console.log(`Search Results: ${results.searchResults.found} found`);
    console.log(`Connect Buttons: ${results.connectButtons.found} found`);
    console.log(`Profile Names: ${results.profileNames.found} found`);
    console.log(`Pagination: ${results.pagination.found ? 'Available' : 'Not found'}`);
  } else if (results.pageType === 'profile') {
    console.log(`Connect Buttons: ${results.connectButtons.found} found`);
  } else {
    console.log('Not on a supported LinkedIn page');
  }

  return results;
}

// Auto-run the validation
console.log('LinkedIn Automation Selector Validator loaded');
console.log('Run validateLinkedInSelectors() to test current page');

// If on LinkedIn, auto-run
if (window.location.hostname.includes('linkedin.com')) {
  validateLinkedInSelectors();
} else {
  console.log('⚠️ Not on LinkedIn - navigate to LinkedIn to test selectors');
}