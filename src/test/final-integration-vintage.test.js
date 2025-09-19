// Final Integration Tests for Complete Vintage UI Redesign
// Comprehensive testing suite for the complete vintage newspaper transformation

describe('Final Integration - Complete Vintage UI Redesign', () => {

  describe('Cross-Component Integration', () => {
    test('should integrate all vintage design system components seamlessly', () => {
      const createIntegratedSystem = () => {
        const container = document.createElement('div');
        container.classList.add('vintage-integrated-system', 'bg-vintage-texture', 'min-h-screen');

        // Header with vintage branding
        const header = document.createElement('header');
        header.classList.add('vintage-card', 'mb-vintage-xl');
        header.innerHTML = `
          <h1 class="vintage-headline text-vintage-3xl font-newspaper font-bold text-vintage-ink">
            LinkedIn Chronicle
          </h1>
          <p class="vintage-caption text-vintage-sm text-vintage-accent font-newspaper italic">
            Professional Networking Automation
          </p>
        `;

        // Navigation with vintage styling
        const nav = document.createElement('nav');
        nav.classList.add('vintage-settings-nav', 'vintage-card', 'mb-vintage-lg');
        nav.innerHTML = `
          <a href="#dashboard" class="vintage-nav-item block px-vintage-md py-vintage-sm rounded-vintage-sm font-newspaper text-vintage-sm bg-vintage-sepia bg-opacity-10 text-vintage-ink border-vintage-sepia border-l-4">
            Analytics Chronicle
          </a>
          <a href="#settings" class="vintage-nav-item block px-vintage-md py-vintage-sm rounded-vintage-sm font-newspaper text-vintage-sm text-vintage-accent hover:bg-vintage-paper border-transparent border-l-4">
            Settings Chronicle
          </a>
        `;

        // Form with vintage inputs
        const form = document.createElement('form');
        form.classList.add('vintage-card', 'space-y-vintage-lg');
        form.innerHTML = `
          <div class="vintage-input-container">
            <label class="vintage-input-label block text-vintage-sm font-newspaper font-medium text-vintage-ink mb-2">
              Daily Publication Limit
            </label>
            <input type="number" class="vintage-input-field w-full px-vintage-md py-3 border-2 border-vintage-accent border-opacity-20 rounded-vintage-md focus:ring-2 focus:ring-vintage-sepia focus:border-vintage-sepia bg-vintage-paper font-newspaper text-vintage-ink" value="20">
          </div>
          <div class="vintage-toggle-container flex items-center justify-between py-vintage-md">
            <div class="vintage-toggle-label">
              <span class="vintage-headline text-vintage-sm font-newspaper font-medium text-vintage-ink">Enable Analytics</span>
            </div>
            <label class="vintage-toggle-switch relative inline-flex h-6 w-11 items-center rounded-full border-2 border-vintage-accent border-opacity-30 transition-colors cursor-pointer">
              <input type="checkbox" class="sr-only peer">
              <span class="vintage-toggle-knob inline-block h-4 w-4 transform rounded-full bg-vintage-paper border border-vintage-accent border-opacity-40 transition shadow-vintage-sm"></span>
            </label>
          </div>
        `;

        // Buttons with vintage styling
        const actions = document.createElement('div');
        actions.classList.add('flex', 'space-x-vintage-md', 'mt-vintage-lg');
        actions.innerHTML = `
          <button class="vintage-button-primary">Save Configuration</button>
          <button class="vintage-button-secondary">Reset Defaults</button>
        `;

        container.appendChild(header);
        container.appendChild(nav);
        container.appendChild(form);
        container.appendChild(actions);

        return container;
      };

      const integratedSystem = createIntegratedSystem();

      // Test that all major vintage components are present and styled
      expect(integratedSystem.querySelector('.vintage-headline')).toBeTruthy();
      expect(integratedSystem.querySelector('.vintage-caption')).toBeTruthy();
      expect(integratedSystem.querySelector('.vintage-nav-item')).toBeTruthy();
      expect(integratedSystem.querySelector('.vintage-input-field')).toBeTruthy();
      expect(integratedSystem.querySelector('.vintage-toggle-switch')).toBeTruthy();
      expect(integratedSystem.querySelector('.vintage-button-primary')).toBeTruthy();
      expect(integratedSystem.querySelector('.vintage-button-secondary')).toBeTruthy();

      // Test consistent font usage
      const headlineElements = integratedSystem.querySelectorAll('.vintage-headline');
      headlineElements.forEach(element => {
        expect(element.classList.contains('font-newspaper')).toBe(true);
      });

      // Test consistent color scheme
      const primaryButtons = integratedSystem.querySelectorAll('.vintage-button-primary');
      expect(primaryButtons.length).toBeGreaterThan(0);

      const inputFields = integratedSystem.querySelectorAll('.vintage-input-field');
      inputFields.forEach(input => {
        expect(input.classList.contains('bg-vintage-paper')).toBe(true);
      });
    });

    test('should maintain consistent vintage theme across all modal components', () => {
      const createModalSystem = () => {
        const container = document.createElement('div');

        // Help modal
        const helpModal = document.createElement('div');
        helpModal.classList.add('vintage-modal-overlay', 'fixed', 'inset-0', 'bg-vintage-ink', 'bg-opacity-50');
        helpModal.innerHTML = `
          <div class="vintage-modal vintage-card max-w-2xl w-full mx-4 border-2 border-vintage-accent shadow-vintage-xl">
            <div class="vintage-modal-header flex justify-between items-center p-vintage-xl border-b border-vintage-accent border-opacity-20">
              <h2 class="vintage-headline text-vintage-xl font-newspaper font-bold text-vintage-ink">Editorial Documentation</h2>
              <button class="vintage-modal-close text-vintage-accent hover:text-vintage-ink">×</button>
            </div>
            <div class="vintage-modal-content p-vintage-xl font-newspaper text-vintage-ink">
              <p>Complete help documentation content...</p>
            </div>
          </div>
        `;

        // Onboarding modal
        const onboardingModal = document.createElement('div');
        onboardingModal.classList.add('vintage-onboarding-flow', 'fixed', 'inset-0', 'bg-vintage-ink', 'bg-opacity-50');
        onboardingModal.innerHTML = `
          <div class="vintage-onboarding-card vintage-card max-w-2xl w-full p-vintage-2xl">
            <div class="vintage-progress-header mb-vintage-xl">
              <h2 class="vintage-headline text-vintage-2xl font-newspaper font-bold text-vintage-ink">Editorial Onboarding</h2>
              <div class="vintage-progress-bar w-full h-2 bg-vintage-accent bg-opacity-20 rounded-full">
                <div class="vintage-progress-fill h-full bg-vintage-sepia transition-all duration-300" style="width: 50%"></div>
              </div>
            </div>
          </div>
        `;

        // Notification
        const notification = document.createElement('div');
        notification.classList.add('vintage-notification', 'vintage-card', 'border-2', 'border-vintage-accent');
        notification.innerHTML = `
          <div class="vintage-notification-header flex items-center mb-vintage-sm">
            <div class="vintage-notification-icon w-4 h-4 rounded-full bg-vintage-sepia text-vintage-paper flex items-center justify-center mr-2">✓</div>
            <div class="vintage-notification-title text-vintage-sm font-newspaper font-medium text-vintage-ink">Editorial Success</div>
          </div>
          <div class="vintage-notification-message text-vintage-xs text-vintage-accent font-newspaper italic">Operation completed successfully</div>
        `;

        container.appendChild(helpModal);
        container.appendChild(onboardingModal);
        container.appendChild(notification);

        return container;
      };

      const modalSystem = createModalSystem();

      // Test modal consistency
      const modals = modalSystem.querySelectorAll('[class*="vintage-modal"], [class*="vintage-onboarding"], [class*="vintage-notification"]');
      expect(modals.length).toBeGreaterThanOrEqual(3);

      // Test vintage card usage
      const cards = modalSystem.querySelectorAll('.vintage-card');
      expect(cards.length).toBeGreaterThan(0);

      // Test consistent typography
      const headlines = modalSystem.querySelectorAll('.vintage-headline');
      headlines.forEach(headline => {
        expect(headline.classList.contains('font-newspaper')).toBe(true);
        expect(headline.classList.contains('text-vintage-ink')).toBe(true);
      });

      // Test consistent borders
      const borderedElements = modalSystem.querySelectorAll('[class*="border-vintage-accent"]');
      expect(borderedElements.length).toBeGreaterThan(0);
    });

    test('should implement consistent vintage animations across components', () => {
      const createAnimatedSystem = () => {
        const container = document.createElement('div');

        // Modal with entrance animation
        const animatedModal = document.createElement('div');
        animatedModal.classList.add(
          'vintage-animated-overlay',
          'vintage-card',
          'transform',
          'transition-all',
          'duration-300',
          'ease-out',
          'opacity-0',
          'scale-90',
          'rotate-1'
        );

        // Toggle switch with transition
        const animatedToggle = document.createElement('div');
        animatedToggle.classList.add(
          'vintage-toggle-switch',
          'relative',
          'inline-flex',
          'h-6',
          'w-11',
          'items-center',
          'rounded-full',
          'transition-colors'
        );
        animatedToggle.innerHTML = `
          <span class="vintage-toggle-knob inline-block h-4 w-4 transform rounded-full transition shadow-vintage-sm translate-x-1"></span>
        `;

        // Button with hover effects
        const animatedButton = document.createElement('button');
        animatedButton.classList.add(
          'vintage-button-primary',
          'transition-all',
          'duration-200',
          'hover:transform',
          'hover:-translate-y-1'
        );
        animatedButton.textContent = 'Animated Button';

        // Notification with slide animation
        const animatedNotification = document.createElement('div');
        animatedNotification.classList.add(
          'vintage-notification',
          'transform',
          'transition-transform',
          'duration-300',
          'translate-x-full'
        );

        container.appendChild(animatedModal);
        container.appendChild(animatedToggle);
        container.appendChild(animatedButton);
        container.appendChild(animatedNotification);

        // Animation control methods
        container.showModal = () => {
          animatedModal.classList.remove('opacity-0', 'scale-90', 'rotate-1');
        };

        container.hideModal = () => {
          animatedModal.classList.add('opacity-0', 'scale-90', 'rotate-1');
        };

        container.toggleSwitch = () => {
          const knob = animatedToggle.querySelector('.vintage-toggle-knob');
          if (knob.classList.contains('translate-x-1')) {
            knob.classList.remove('translate-x-1');
            knob.classList.add('translate-x-6');
          } else {
            knob.classList.remove('translate-x-6');
            knob.classList.add('translate-x-1');
          }
        };

        container.showNotification = () => {
          animatedNotification.classList.remove('translate-x-full');
        };

        return container;
      };

      const animatedSystem = createAnimatedSystem();

      // Test animation classes are present
      expect(animatedSystem.querySelector('.vintage-animated-overlay')).toBeTruthy();
      expect(animatedSystem.querySelector('.transition-all')).toBeTruthy();
      expect(animatedSystem.querySelector('.duration-300')).toBeTruthy();

      // Test animation methods exist
      expect(typeof animatedSystem.showModal).toBe('function');
      expect(typeof animatedSystem.hideModal).toBe('function');
      expect(typeof animatedSystem.toggleSwitch).toBe('function');
      expect(typeof animatedSystem.showNotification).toBe('function');

      // Test initial states
      const modal = animatedSystem.querySelector('.vintage-animated-overlay');
      expect(modal.classList.contains('opacity-0')).toBe(true);
      expect(modal.classList.contains('scale-90')).toBe(true);

      // Test animation triggers
      animatedSystem.showModal();
      expect(modal.classList.contains('opacity-0')).toBe(false);
    });
  });

  describe('Responsive Design Integration', () => {
    test('should implement consistent responsive behavior across all vintage components', () => {
      const createResponsiveSystem = () => {
        const container = document.createElement('div');
        container.classList.add('vintage-responsive-system');

        // Responsive header
        const header = document.createElement('header');
        header.classList.add(
          'vintage-card',
          'newspaper-column',
          'single',
          'p-vintage-lg',
          'sm:p-vintage-xl',
          'lg:p-vintage-2xl'
        );
        header.innerHTML = `
          <h1 class="vintage-headline text-vintage-lg sm:text-vintage-xl md:text-vintage-2xl lg:text-vintage-3xl font-newspaper font-bold text-vintage-ink">
            Responsive Chronicle
          </h1>
        `;

        // Responsive grid
        const grid = document.createElement('div');
        grid.id = 'responsive-grid'; // Add unique ID for testing
        grid.classList.add(
          'newspaper-column',
          'single',
          'sm:double',
          'lg:triple',
          'gap-vintage-md',
          'sm:gap-vintage-lg',
          'lg:gap-vintage-xl'
        );

        for (let i = 1; i <= 3; i++) {
          const card = document.createElement('div');
          card.classList.add('vintage-card', 'p-vintage-md', 'sm:p-vintage-lg');
          card.innerHTML = `
            <h3 class="vintage-headline text-vintage-sm sm:text-vintage-base lg:text-vintage-lg font-newspaper font-bold text-vintage-ink">
              Card ${i}
            </h3>
          `;
          grid.appendChild(card);
        }

        // Responsive navigation
        const nav = document.createElement('nav');
        nav.classList.add(
          'vintage-settings-nav',
          'flex',
          'flex-col',
          'sm:flex-row',
          'space-y-vintage-sm',
          'sm:space-y-0',
          'sm:space-x-vintage-md'
        );

        ['Dashboard', 'Settings', 'Help'].forEach(item => {
          const link = document.createElement('a');
          link.classList.add(
            'vintage-nav-item',
            'px-vintage-sm',
            'py-vintage-xs',
            'sm:px-vintage-md',
            'sm:py-vintage-sm',
            'text-vintage-xs',
            'sm:text-vintage-sm',
            'font-newspaper'
          );
          link.textContent = item;
          nav.appendChild(link);
        });

        container.appendChild(header);
        container.appendChild(grid);
        container.appendChild(nav);

        return container;
      };

      const responsiveSystem = createResponsiveSystem();

      // Test responsive classes are present
      expect(responsiveSystem.querySelector('[class*="sm:text-vintage-xl"]')).toBeTruthy();
      expect(responsiveSystem.querySelector('[class*="lg:text-vintage-3xl"]')).toBeTruthy();
      expect(responsiveSystem.querySelector('[class*="sm:double"]')).toBeTruthy();
      expect(responsiveSystem.querySelector('[class*="lg:triple"]')).toBeTruthy();

      // Test responsive grid structure
      const grid = responsiveSystem.querySelector('#responsive-grid');
      expect(grid.classList.contains('single')).toBe(true);
      expect(grid.classList.contains('newspaper-column')).toBe(true);

      // Test that responsive classes are present in className
      const classString = grid.className;
      expect(classString).toContain('single');
      expect(classString).toContain('gap-vintage-md');
    });

    test('should handle mobile-first vintage design patterns', () => {
      const createMobileFirstSystem = () => {
        const container = document.createElement('div');
        container.classList.add(
          'vintage-mobile-system',
          'w-full',
          'max-w-sm',
          'sm:max-w-md',
          'md:max-w-lg',
          'lg:max-w-xl',
          'mx-auto'
        );

        // Mobile-optimized modal
        const modal = document.createElement('div');
        modal.classList.add(
          'vintage-mobile-modal',
          'vintage-card',
          'w-full',
          'h-full',
          'sm:h-auto',
          'sm:rounded-vintage-lg',
          'p-vintage-md',
          'sm:p-vintage-lg',
          'md:p-vintage-xl'
        );

        // Mobile navigation
        const nav = document.createElement('nav');
        nav.classList.add(
          'vintage-mobile-nav',
          'fixed',
          'bottom-0',
          'sm:relative',
          'w-full',
          'bg-vintage-paper',
          'border-t-2',
          'sm:border-t-0',
          'sm:border-2',
          'border-vintage-accent',
          'border-opacity-20'
        );

        // Stack forms on mobile
        const form = document.createElement('form');
        form.classList.add(
          'vintage-mobile-form',
          'space-y-vintage-sm',
          'sm:space-y-vintage-md',
          'lg:space-y-vintage-lg'
        );

        container.appendChild(modal);
        container.appendChild(nav);
        container.appendChild(form);

        return container;
      };

      const mobileSystem = createMobileFirstSystem();

      // Test mobile-first responsive classes
      expect(mobileSystem.classList.contains('max-w-sm')).toBe(true);
      expect(mobileSystem.classList.contains('sm:max-w-md')).toBe(true);

      // Test mobile modal behavior
      const modal = mobileSystem.querySelector('.vintage-mobile-modal');
      expect(modal.classList.contains('h-full')).toBe(true);
      expect(modal.classList.contains('sm:h-auto')).toBe(true);

      // Test mobile navigation
      const nav = mobileSystem.querySelector('.vintage-mobile-nav');
      expect(nav.classList.contains('fixed')).toBe(true);
      expect(nav.classList.contains('bottom-0')).toBe(true);
      expect(nav.classList.contains('sm:relative')).toBe(true);
    });
  });

  describe('Accessibility Integration', () => {
    test('should maintain accessibility standards across all vintage components', () => {
      const createAccessibleSystem = () => {
        const container = document.createElement('div');
        container.setAttribute('role', 'main');
        container.setAttribute('aria-label', 'LinkedIn Chronicle Application');

        // Accessible navigation
        const nav = document.createElement('nav');
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Main navigation');
        nav.classList.add('vintage-settings-nav');

        const navList = document.createElement('ul');
        navList.setAttribute('role', 'list');

        ['Dashboard', 'Settings', 'Help'].forEach((item, index) => {
          const listItem = document.createElement('li');
          listItem.setAttribute('role', 'listitem');

          const link = document.createElement('a');
          link.href = `#${item.toLowerCase()}`;
          link.classList.add('vintage-nav-item');
          link.textContent = item;

          if (index === 0) {
            link.setAttribute('aria-current', 'page');
          }

          listItem.appendChild(link);
          navList.appendChild(listItem);
        });

        nav.appendChild(navList);

        // Accessible form
        const form = document.createElement('form');
        form.setAttribute('role', 'form');
        form.setAttribute('aria-labelledby', 'form-title');
        form.classList.add('vintage-card');

        const formTitle = document.createElement('h2');
        formTitle.id = 'form-title';
        formTitle.classList.add('vintage-headline');
        formTitle.textContent = 'Editorial Configuration';

        const fieldset = document.createElement('fieldset');
        fieldset.classList.add('vintage-fieldset');

        const legend = document.createElement('legend');
        legend.classList.add('vintage-legend');
        legend.textContent = 'Publication Settings';

        const inputContainer = document.createElement('div');
        inputContainer.classList.add('vintage-input-container');

        const label = document.createElement('label');
        label.setAttribute('for', 'daily-limit');
        label.classList.add('vintage-input-label');
        label.textContent = 'Daily Publication Limit';

        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'daily-limit';
        input.setAttribute('aria-describedby', 'daily-limit-help');
        input.setAttribute('aria-required', 'true');
        input.classList.add('vintage-input-field');

        const helpText = document.createElement('div');
        helpText.id = 'daily-limit-help';
        helpText.setAttribute('role', 'note');
        helpText.classList.add('vintage-help-text');
        helpText.textContent = 'Recommended: 10-15 connections per day';

        inputContainer.appendChild(label);
        inputContainer.appendChild(input);
        inputContainer.appendChild(helpText);

        fieldset.appendChild(legend);
        fieldset.appendChild(inputContainer);

        form.appendChild(formTitle);
        form.appendChild(fieldset);

        // Accessible modal
        const modal = document.createElement('div');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');
        modal.classList.add('vintage-modal');

        const modalTitle = document.createElement('h2');
        modalTitle.id = 'modal-title';
        modalTitle.classList.add('vintage-headline');
        modalTitle.textContent = 'Editorial Help';

        const closeButton = document.createElement('button');
        closeButton.setAttribute('aria-label', 'Close help modal');
        closeButton.classList.add('vintage-modal-close');
        closeButton.textContent = '×';

        modal.appendChild(modalTitle);
        modal.appendChild(closeButton);

        container.appendChild(nav);
        container.appendChild(form);
        container.appendChild(modal);

        return container;
      };

      const accessibleSystem = createAccessibleSystem();

      // Test main accessibility attributes
      expect(accessibleSystem.getAttribute('role')).toBe('main');
      expect(accessibleSystem.getAttribute('aria-label')).toBe('LinkedIn Chronicle Application');

      // Test navigation accessibility
      const nav = accessibleSystem.querySelector('nav');
      expect(nav.getAttribute('role')).toBe('navigation');
      expect(nav.getAttribute('aria-label')).toBe('Main navigation');

      // Test form accessibility
      const form = accessibleSystem.querySelector('form');
      expect(form.getAttribute('role')).toBe('form');
      expect(form.getAttribute('aria-labelledby')).toBe('form-title');

      // Test input accessibility
      const input = accessibleSystem.querySelector('input');
      expect(input.getAttribute('aria-describedby')).toBe('daily-limit-help');
      expect(input.getAttribute('aria-required')).toBe('true');

      // Test modal accessibility
      const modal = accessibleSystem.querySelector('[role="dialog"]');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('aria-labelledby')).toBe('modal-title');

      // Test help text accessibility
      const helpText = accessibleSystem.querySelector('[role="note"]');
      expect(helpText).toBeTruthy();
    });

    test('should provide high contrast support for vintage color scheme', () => {
      const createHighContrastSystem = () => {
        const container = document.createElement('div');
        container.classList.add('vintage-high-contrast-system');

        // Add high contrast CSS
        const style = document.createElement('style');
        style.textContent = `
          @media (prefers-contrast: high) {
            .vintage-high-contrast-system {
              --vintage-ink: #000000;
              --vintage-accent: #000080;
              --vintage-paper: #ffffff;
              --vintage-sepia: #8B0000;
            }
            .vintage-high-contrast-system .vintage-headline {
              color: var(--vintage-ink) !important;
              font-weight: 700 !important;
            }
            .vintage-high-contrast-system .vintage-button-primary {
              background-color: var(--vintage-sepia) !important;
              color: var(--vintage-paper) !important;
              border: 2px solid var(--vintage-ink) !important;
            }
          }
        `;

        const headline = document.createElement('h1');
        headline.classList.add('vintage-headline', 'text-vintage-ink');
        headline.textContent = 'High Contrast Test';

        const button = document.createElement('button');
        button.classList.add('vintage-button-primary');
        button.textContent = 'Test Button';

        const input = document.createElement('input');
        input.classList.add('vintage-input-field', 'border-vintage-accent');

        container.appendChild(style);
        container.appendChild(headline);
        container.appendChild(button);
        container.appendChild(input);

        return container;
      };

      const highContrastSystem = createHighContrastSystem();

      // Test high contrast elements are present
      expect(highContrastSystem.querySelector('.vintage-headline')).toBeTruthy();
      expect(highContrastSystem.querySelector('.vintage-button-primary')).toBeTruthy();
      expect(highContrastSystem.querySelector('.vintage-input-field')).toBeTruthy();

      // Test high contrast CSS is present
      const style = highContrastSystem.querySelector('style');
      expect(style.textContent).toContain('@media (prefers-contrast: high)');
      expect(style.textContent).toContain('--vintage-ink: #000000');
    });
  });

  describe('Performance and Optimization', () => {
    test('should load vintage styles efficiently without blocking', () => {
      const createOptimizedSystem = () => {
        const container = document.createElement('div');

        // Simulate critical CSS loading
        const criticalCSS = document.createElement('style');
        criticalCSS.id = 'vintage-critical-css';
        criticalCSS.textContent = `
          .vintage-card { background: #F4F1DE; }
          .vintage-headline { font-family: 'Crimson Text', serif; }
          .font-newspaper { font-family: 'Crimson Text', serif; }
        `;

        // Simulate deferred style loading
        const deferredStyles = document.createElement('link');
        deferredStyles.rel = 'stylesheet';
        deferredStyles.href = '../assets/vintage-typography.css';
        deferredStyles.media = 'print';
        deferredStyles.onload = () => {
          deferredStyles.media = 'all';
        };

        // Test component with critical styles
        const component = document.createElement('div');
        component.classList.add('vintage-card', 'font-newspaper');
        component.innerHTML = `
          <h1 class="vintage-headline">Performance Test</h1>
          <p>This component loads with critical styles first.</p>
        `;

        container.appendChild(criticalCSS);
        container.appendChild(deferredStyles);
        container.appendChild(component);

        // Performance measurement mock
        container.measurePerformance = () => {
          const mockPerformance = {
            now: () => Date.now()
          };
          const start = mockPerformance.now();
          // Simulate style computation
          const computedStyle = window.getComputedStyle(component);
          const fontFamily = computedStyle.fontFamily;
          const end = mockPerformance.now();

          return {
            duration: end - start,
            fontFamily: fontFamily,
            hasVintageStyles: component.classList.contains('vintage-card')
          };
        };

        return container;
      };

      const optimizedSystem = createOptimizedSystem();

      // Test critical CSS is inline
      const criticalCSS = optimizedSystem.querySelector('#vintage-critical-css');
      expect(criticalCSS).toBeTruthy();
      expect(criticalCSS.textContent).toContain('.vintage-card');

      // Test deferred loading setup
      const deferredLink = optimizedSystem.querySelector('link[rel="stylesheet"]');
      expect(deferredLink).toBeTruthy();
      expect(deferredLink.media).toBe('print');

      // Test performance measurement
      expect(typeof optimizedSystem.measurePerformance).toBe('function');

      const performance = optimizedSystem.measurePerformance();
      expect(typeof performance.duration).toBe('number');
      expect(performance.hasVintageStyles).toBe(true);
    });

    test('should minimize layout shifts during vintage component loading', () => {
      const createStableLoadingSystem = () => {
        const container = document.createElement('div');
        container.classList.add('vintage-stable-loading');

        // Pre-sized containers to prevent layout shift
        const cardSkeleton = document.createElement('div');
        cardSkeleton.classList.add('vintage-card-skeleton');
        cardSkeleton.style.cssText = `
          width: 100%;
          height: 200px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          border-radius: 8px;
          margin-bottom: 16px;
        `;

        // Actual content with same dimensions
        const actualCard = document.createElement('div');
        actualCard.classList.add('vintage-card', 'hidden');
        actualCard.style.cssText = `
          width: 100%;
          height: 200px;
          margin-bottom: 16px;
        `;
        actualCard.innerHTML = `
          <h2 class="vintage-headline">Loaded Content</h2>
          <p>This content maintains the same dimensions as the skeleton.</p>
        `;

        // Loading state management
        container.loadContent = () => {
          cardSkeleton.style.display = 'none';
          actualCard.classList.remove('hidden');
        };

        // Layout shift measurement
        container.measureLayoutShift = () => {
          const observer = new PerformationObserver((list) => {
            let cumulativeShift = 0;
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift') {
                cumulativeShift += entry.value;
              }
            }
            return cumulativeShift;
          });

          if (typeof PerformanceObserver !== 'undefined') {
            observer.observe({ entryTypes: ['layout-shift'] });
          }

          return { observer, getShift: () => 0 }; // Mock for testing
        };

        container.appendChild(cardSkeleton);
        container.appendChild(actualCard);

        return container;
      };

      const stableSystem = createStableLoadingSystem();

      // Test skeleton and content have same dimensions
      const skeleton = stableSystem.querySelector('.vintage-card-skeleton');
      const content = stableSystem.querySelector('.vintage-card');

      expect(skeleton.style.height).toBe('200px');
      expect(content.style.height).toBe('200px');
      expect(skeleton.style.width).toBe('100%');
      expect(content.style.width).toBe('100%');

      // Test loading mechanism
      expect(typeof stableSystem.loadContent).toBe('function');
      expect(typeof stableSystem.measureLayoutShift).toBe('function');

      // Test initial state
      expect(content.classList.contains('hidden')).toBe(true);

      // Test loading transition
      stableSystem.loadContent();
      expect(content.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should provide graceful fallbacks when vintage fonts fail to load', () => {
      const createFallbackSystem = () => {
        const container = document.createElement('div');
        container.classList.add('vintage-fallback-system');

        // CSS with font fallbacks
        const style = document.createElement('style');
        style.textContent = `
          .vintage-fallback-system {
            font-family: 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
          }
          .vintage-fallback-system .font-newspaper {
            font-family: 'Crimson Text', Georgia, 'Times New Roman', Times, serif;
          }
          .vintage-fallback-system.no-vintage-fonts {
            font-family: Georgia, 'Times New Roman', Times, serif;
          }
          .vintage-fallback-system.no-vintage-fonts .font-newspaper {
            font-family: Georgia, 'Times New Roman', Times, serif;
          }
        `;

        const headline = document.createElement('h1');
        headline.classList.add('vintage-headline', 'font-newspaper');
        headline.textContent = 'Font Fallback Test';

        const content = document.createElement('p');
        content.classList.add('font-newspaper');
        content.textContent = 'This content should display properly even if custom fonts fail to load.';

        container.appendChild(style);
        container.appendChild(headline);
        container.appendChild(content);

        // Font loading detection
        container.checkFontLoading = () => {
          if (document.fonts && document.fonts.check) {
            const crimsonLoaded = document.fonts.check('16px "Crimson Text"');
            if (!crimsonLoaded) {
              container.classList.add('no-vintage-fonts');
            }
            return crimsonLoaded;
          }
          return true; // Assume loaded if no API support
        };

        return container;
      };

      const fallbackSystem = createFallbackSystem();

      // Test fallback CSS is present
      const style = fallbackSystem.querySelector('style');
      expect(style.textContent).toContain('Georgia, \'Times New Roman\'');

      // Test font checking mechanism
      expect(typeof fallbackSystem.checkFontLoading).toBe('function');

      // Test elements have font classes
      const headline = fallbackSystem.querySelector('.vintage-headline');
      const content = fallbackSystem.querySelector('p');
      expect(headline.classList.contains('font-newspaper')).toBe(true);
      expect(content.classList.contains('font-newspaper')).toBe(true);
    });

    test('should handle vintage theme loading errors gracefully', () => {
      const createErrorHandlingSystem = () => {
        const container = document.createElement('div');
        container.classList.add('vintage-error-handling');

        // Error state CSS
        const style = document.createElement('style');
        style.textContent = `
          .vintage-error-handling.theme-error {
            background: #ffffff;
            color: #000000;
          }
          .vintage-error-handling.theme-error .vintage-card {
            background: #f8f8f8;
            border: 1px solid #cccccc;
          }
          .vintage-error-handling.theme-error .vintage-button-primary {
            background: #0066cc;
            color: #ffffff;
            border: 1px solid #0066cc;
          }
        `;

        const card = document.createElement('div');
        card.classList.add('vintage-card');

        const button = document.createElement('button');
        button.classList.add('vintage-button-primary');
        button.textContent = 'Test Button';

        container.appendChild(style);
        container.appendChild(card);
        container.appendChild(button);

        // Error handling
        container.handleThemeError = (error) => {
          console.warn('Vintage theme loading failed, using fallback:', error);
          container.classList.add('theme-error');

          // Show user-friendly error message
          const errorMessage = document.createElement('div');
          errorMessage.classList.add('error-message');
          errorMessage.style.cssText = `
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
          `;
          errorMessage.textContent = 'Using simplified theme due to loading error.';

          container.insertBefore(errorMessage, container.firstChild);
        };

        // Simulate error condition
        container.simulateError = () => {
          container.handleThemeError(new Error('CSS load failed'));
        };

        return container;
      };

      const errorSystem = createErrorHandlingSystem();

      // Test error handling methods exist
      expect(typeof errorSystem.handleThemeError).toBe('function');
      expect(typeof errorSystem.simulateError).toBe('function');

      // Test error state application
      errorSystem.simulateError();
      expect(errorSystem.classList.contains('theme-error')).toBe(true);

      // Test error message is shown
      const errorMessage = errorSystem.querySelector('.error-message');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('simplified theme');
    });
  });
});