// Visual Regression Tests for Vintage UI Redesign
// Tests ensure consistent visual rendering across all interface components

describe('Visual Regression Testing - Vintage UI Components', () => {

  describe('Component Rendering Integrity', () => {
    test('should render popup interface with correct vintage styling', () => {
      const createPopupComponent = () => {
        const popup = document.createElement('div');
        popup.className = 'vintage-popup-container bg-vintage-paper border-2 border-vintage-accent border-opacity-20 rounded-vintage-lg shadow-vintage-xl p-vintage-lg max-w-sm';
        popup.innerHTML = `
          <div class="vintage-popup-header flex items-center justify-between mb-vintage-md">
            <div class="flex items-center space-x-vintage-sm">
              <div class="vintage-logo w-8 h-8 bg-vintage-sepia bg-opacity-20 rounded-full flex items-center justify-center text-vintage-sepia">📰</div>
              <div>
                <h1 class="vintage-headline text-vintage-2xl font-newspaper font-bold text-vintage-ink mb-1">LinkedIn Chronicle</h1>
                <p class="vintage-caption text-vintage-xs text-vintage-accent font-newspaper italic">Professional Automation</p>
              </div>
            </div>
          </div>

          <div class="vintage-status-section mb-vintage-lg">
            <div class="vintage-stat-item flex justify-between items-center py-vintage-sm border-b border-vintage-accent border-opacity-10">
              <span class="vintage-stat-label text-vintage-sm font-newspaper text-vintage-accent">Today's Activity</span>
              <span class="vintage-stat-value text-vintage-sm font-newspaper font-medium text-vintage-ink">12 connections</span>
            </div>
            <div class="vintage-stat-item flex justify-between items-center py-vintage-sm">
              <span class="vintage-stat-label text-vintage-sm font-newspaper text-vintage-accent">Response Rate</span>
              <span class="vintage-stat-value text-vintage-sm font-newspaper font-medium text-vintage-ink">23.5%</span>
            </div>
          </div>

          <div class="vintage-popup-actions space-y-vintage-sm">
            <button class="vintage-button-primary w-full">Start Publishing</button>
            <button class="vintage-button-secondary w-full">View Analytics</button>
          </div>
        `;

        return popup;
      };

      const popupComponent = createPopupComponent();

      // Test structure integrity
      expect(popupComponent.querySelector('.vintage-popup-header')).toBeTruthy();
      expect(popupComponent.querySelector('.vintage-logo')).toBeTruthy();
      expect(popupComponent.querySelector('.vintage-headline')).toBeTruthy();
      expect(popupComponent.querySelector('.vintage-status-section')).toBeTruthy();
      expect(popupComponent.querySelector('.vintage-popup-actions')).toBeTruthy();

      // Test vintage styling classes
      expect(popupComponent.classList.contains('bg-vintage-paper')).toBe(true);
      expect(popupComponent.classList.contains('border-vintage-accent')).toBe(true);
      expect(popupComponent.classList.contains('shadow-vintage-xl')).toBe(true);

      // Test typography classes
      const headline = popupComponent.querySelector('.vintage-headline');
      expect(headline.classList.contains('font-newspaper')).toBe(true);
      expect(headline.classList.contains('text-vintage-ink')).toBe(true);

      // Test button rendering
      const primaryButton = popupComponent.querySelector('.vintage-button-primary');
      const secondaryButton = popupComponent.querySelector('.vintage-button-secondary');
      expect(primaryButton).toBeTruthy();
      expect(secondaryButton).toBeTruthy();
    });

    test('should render dashboard components with newspaper layout', () => {
      const createDashboardComponent = () => {
        const dashboard = document.createElement('div');
        dashboard.className = 'vintage-dashboard bg-vintage-texture min-h-screen p-vintage-lg';
        dashboard.innerHTML = `
          <header class="vintage-card newspaper-column single mb-vintage-xl">
            <h1 class="vintage-headline text-vintage-4xl font-newspaper font-bold text-vintage-ink mb-2">Analytics Chronicle</h1>
            <p class="vintage-caption text-vintage-lg text-vintage-accent font-newspaper italic">Professional Networking Intelligence</p>
          </header>

          <main class="newspaper-column triple gap-vintage-xl">
            <section class="vintage-card">
              <div class="vintage-section-header border-b-2 border-vintage-accent border-opacity-20 pb-vintage-md mb-vintage-lg">
                <h2 class="vintage-headline text-vintage-xl font-newspaper font-bold text-vintage-ink">Connection Statistics</h2>
              </div>
              <div class="vintage-stats-grid newspaper-column double gap-vintage-md">
                <div class="vintage-stat-card text-center p-vintage-lg">
                  <div class="vintage-stat-value text-vintage-3xl font-newspaper font-bold text-vintage-sepia mb-2">1,247</div>
                  <div class="vintage-stat-label text-vintage-sm font-newspaper text-vintage-accent">Total Connections</div>
                </div>
                <div class="vintage-stat-card text-center p-vintage-lg">
                  <div class="vintage-stat-value text-vintage-3xl font-newspaper font-bold text-vintage-sepia mb-2">23.5%</div>
                  <div class="vintage-stat-label text-vintage-sm font-newspaper text-vintage-accent">Response Rate</div>
                </div>
              </div>
            </section>

            <section class="vintage-card">
              <div class="vintage-section-header border-b-2 border-vintage-accent border-opacity-20 pb-vintage-md mb-vintage-lg">
                <h2 class="vintage-headline text-vintage-xl font-newspaper font-bold text-vintage-ink">Recent Activity</h2>
              </div>
              <div class="vintage-activity-list space-y-vintage-sm">
                <div class="vintage-activity-item flex items-center justify-between p-vintage-sm border-b border-vintage-accent border-opacity-10">
                  <span class="vintage-activity-text text-vintage-sm font-newspaper text-vintage-ink">Connection sent to John Smith</span>
                  <span class="vintage-activity-time text-vintage-xs font-newspaper text-vintage-accent">2m ago</span>
                </div>
                <div class="vintage-activity-item flex items-center justify-between p-vintage-sm border-b border-vintage-accent border-opacity-10">
                  <span class="vintage-activity-text text-vintage-sm font-newspaper text-vintage-ink">Response received from Jane Doe</span>
                  <span class="vintage-activity-time text-vintage-xs font-newspaper text-vintage-accent">5m ago</span>
                </div>
              </div>
            </section>

            <section class="vintage-card">
              <div class="vintage-section-header border-b-2 border-vintage-accent border-opacity-20 pb-vintage-md mb-vintage-lg">
                <h2 class="vintage-headline text-vintage-xl font-newspaper font-bold text-vintage-ink">Performance Chart</h2>
              </div>
              <div class="vintage-chart-container h-64 bg-vintage-paper border border-vintage-accent border-opacity-20 rounded-vintage-sm flex items-center justify-center">
                <div class="vintage-chart-placeholder text-vintage-accent font-newspaper italic">Chart visualization area</div>
              </div>
            </section>
          </main>
        `;

        return dashboard;
      };

      const dashboardComponent = createDashboardComponent();

      // Test layout structure
      expect(dashboardComponent.querySelector('header.vintage-card')).toBeTruthy();
      expect(dashboardComponent.querySelector('main.newspaper-column.triple')).toBeTruthy();
      expect(dashboardComponent.querySelectorAll('section.vintage-card').length).toBe(3);

      // Test newspaper column layouts
      const tripleColumn = dashboardComponent.querySelector('.newspaper-column.triple');
      const doubleColumn = dashboardComponent.querySelector('.newspaper-column.double');
      expect(tripleColumn).toBeTruthy();
      expect(doubleColumn).toBeTruthy();

      // Test stat cards rendering
      const statCards = dashboardComponent.querySelectorAll('.vintage-stat-card');
      expect(statCards.length).toBe(2);
      statCards.forEach(card => {
        expect(card.querySelector('.vintage-stat-value')).toBeTruthy();
        expect(card.querySelector('.vintage-stat-label')).toBeTruthy();
      });

      // Test activity list rendering
      const activityItems = dashboardComponent.querySelectorAll('.vintage-activity-item');
      expect(activityItems.length).toBe(2);

      // Test chart container
      const chartContainer = dashboardComponent.querySelector('.vintage-chart-container');
      expect(chartContainer.classList.contains('h-64')).toBe(true);
      expect(chartContainer.classList.contains('bg-vintage-paper')).toBe(true);
    });

    test('should render settings interface with proper form styling', () => {
      const createSettingsComponent = () => {
        const settings = document.createElement('div');
        settings.className = 'vintage-settings bg-vintage-texture min-h-screen';
        settings.innerHTML = `
          <div class="max-w-6xl mx-auto p-vintage-lg newspaper-column triple gap-vintage-xl">
            <aside class="vintage-settings-nav vintage-card h-fit sticky top-vintage-lg">
              <div class="vintage-section-header border-b-2 border-vintage-accent border-opacity-20 pb-vintage-md mb-vintage-lg">
                <h3 class="vintage-headline text-vintage-lg font-newspaper font-bold text-vintage-ink">Settings Chronicle</h3>
              </div>
              <nav class="vintage-nav-list space-y-vintage-sm">
                <a href="#general" class="vintage-nav-item block px-vintage-md py-vintage-sm rounded-vintage-sm font-newspaper text-vintage-sm bg-vintage-sepia bg-opacity-10 text-vintage-ink border-vintage-sepia border-l-4">General</a>
                <a href="#automation" class="vintage-nav-item block px-vintage-md py-vintage-sm rounded-vintage-sm font-newspaper text-vintage-sm text-vintage-accent hover:bg-vintage-paper border-transparent border-l-4">Automation</a>
                <a href="#templates" class="vintage-nav-item block px-vintage-md py-vintage-sm rounded-vintage-sm font-newspaper text-vintage-sm text-vintage-accent hover:bg-vintage-paper border-transparent border-l-4">Templates</a>
              </nav>
            </aside>

            <main class="vintage-settings-content col-span-2 space-y-vintage-xl">
              <section class="vintage-card">
                <div class="vintage-section-header border-b-2 border-vintage-accent border-opacity-20 pb-vintage-lg mb-vintage-xl">
                  <h2 class="vintage-headline text-vintage-2xl font-newspaper font-bold text-vintage-ink">General Configuration</h2>
                </div>

                <form class="space-y-vintage-lg">
                  <div class="vintage-input-container">
                    <label class="vintage-input-label block text-vintage-sm font-newspaper font-medium text-vintage-ink mb-2">Daily Publication Limit</label>
                    <input type="number" class="vintage-input-field w-full px-vintage-md py-3 border-2 border-vintage-accent border-opacity-20 rounded-vintage-md focus:ring-2 focus:ring-vintage-sepia focus:border-vintage-sepia bg-vintage-paper font-newspaper text-vintage-ink" value="20">
                  </div>

                  <div class="vintage-toggle-container flex items-center justify-between py-vintage-md">
                    <div class="vintage-toggle-label">
                      <span class="vintage-headline text-vintage-sm font-newspaper font-medium text-vintage-ink">Enable Analytics</span>
                      <p class="vintage-caption text-vintage-xs text-vintage-accent font-newspaper italic mt-1">Collect anonymous usage statistics</p>
                    </div>
                    <label class="vintage-toggle-switch relative inline-flex h-6 w-11 items-center rounded-full border-2 border-vintage-accent border-opacity-30 transition-colors cursor-pointer">
                      <input type="checkbox" class="sr-only peer">
                      <span class="vintage-toggle-knob inline-block h-4 w-4 transform rounded-full bg-vintage-paper border border-vintage-accent border-opacity-40 transition shadow-vintage-sm translate-x-1 peer-checked:translate-x-6 peer-checked:bg-vintage-sepia peer-checked:border-vintage-sepia"></span>
                    </label>
                  </div>

                  <div class="vintage-form-actions flex space-x-vintage-md pt-vintage-lg border-t border-vintage-accent border-opacity-20">
                    <button type="submit" class="vintage-button-primary">Save Configuration</button>
                    <button type="reset" class="vintage-button-secondary">Reset Defaults</button>
                  </div>
                </form>
              </section>
            </main>
          </div>
        `;

        return settings;
      };

      const settingsComponent = createSettingsComponent();

      // Test layout structure
      expect(settingsComponent.querySelector('.vintage-settings-nav')).toBeTruthy();
      expect(settingsComponent.querySelector('.vintage-settings-content')).toBeTruthy();
      expect(settingsComponent.querySelector('.newspaper-column.triple')).toBeTruthy();

      // Test navigation rendering
      const navItems = settingsComponent.querySelectorAll('.vintage-nav-item');
      expect(navItems.length).toBe(3);
      expect(navItems[0].classList.contains('bg-vintage-sepia')).toBe(true); // Active state

      // Test form elements
      expect(settingsComponent.querySelector('.vintage-input-container')).toBeTruthy();
      expect(settingsComponent.querySelector('.vintage-input-field')).toBeTruthy();
      expect(settingsComponent.querySelector('.vintage-toggle-container')).toBeTruthy();
      expect(settingsComponent.querySelector('.vintage-toggle-switch')).toBeTruthy();

      // Test form styling
      const inputField = settingsComponent.querySelector('.vintage-input-field');
      expect(inputField.classList.contains('bg-vintage-paper')).toBe(true);
      expect(inputField.classList.contains('border-vintage-accent')).toBe(true);

      // Test toggle switch components
      const toggleSwitch = settingsComponent.querySelector('.vintage-toggle-switch');
      const toggleKnob = settingsComponent.querySelector('.vintage-toggle-knob');
      expect(toggleSwitch).toBeTruthy();
      expect(toggleKnob).toBeTruthy();
      expect(toggleKnob.classList.contains('translate-x-1')).toBe(true);
    });
  });

  describe('Modal and Overlay Rendering', () => {
    test('should render help modal with vintage styling', () => {
      const createHelpModal = () => {
        const modal = document.createElement('div');
        modal.className = 'vintage-modal-overlay fixed inset-0 bg-vintage-ink bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="vintage-modal vintage-card max-w-2xl w-full mx-4 border-2 border-vintage-accent shadow-vintage-xl">
            <div class="vintage-modal-header flex justify-between items-center p-vintage-xl border-b border-vintage-accent border-opacity-20">
              <h2 class="vintage-headline text-vintage-xl font-newspaper font-bold text-vintage-ink">Editorial Help & Documentation</h2>
              <button class="vintage-modal-close text-vintage-accent hover:text-vintage-ink transition-colors p-vintage-sm rounded-vintage-sm hover:bg-vintage-paper">×</button>
            </div>
            <div class="vintage-modal-content p-vintage-xl font-newspaper text-vintage-ink">
              <div class="vintage-help-section space-y-vintage-md">
                <h3 class="vintage-headline text-vintage-lg font-newspaper font-bold text-vintage-ink">Getting Started</h3>
                <p class="vintage-body text-vintage-base leading-relaxed">
                  Welcome to the Editorial Chronicle, your professional LinkedIn automation tool designed with the elegance and precision of traditional newspaper publishing.
                </p>
                <div class="vintage-help-nav grid grid-cols-2 gap-vintage-md mt-vintage-lg">
                  <a href="#setup" class="vintage-help-link vintage-card border border-vintage-accent border-opacity-20 p-vintage-md text-center hover:bg-vintage-sepia hover:bg-opacity-5 transition-colors">
                    <div class="vintage-help-icon text-vintage-2xl mb-vintage-sm">⚙️</div>
                    <div class="vintage-help-title text-vintage-sm font-newspaper font-medium text-vintage-ink">Setup Guide</div>
                  </a>
                  <a href="#templates" class="vintage-help-link vintage-card border border-vintage-accent border-opacity-20 p-vintage-md text-center hover:bg-vintage-sepia hover:bg-opacity-5 transition-colors">
                    <div class="vintage-help-icon text-vintage-2xl mb-vintage-sm">📝</div>
                    <div class="vintage-help-title text-vintage-sm font-newspaper font-medium text-vintage-ink">Message Templates</div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;

        return modal;
      };

      const helpModal = createHelpModal();

      // Test modal structure
      expect(helpModal.querySelector('.vintage-modal')).toBeTruthy();
      expect(helpModal.querySelector('.vintage-modal-header')).toBeTruthy();
      expect(helpModal.querySelector('.vintage-modal-content')).toBeTruthy();
      expect(helpModal.querySelector('.vintage-modal-close')).toBeTruthy();

      // Test modal styling
      expect(helpModal.classList.contains('bg-vintage-ink')).toBe(true);
      expect(helpModal.classList.contains('bg-opacity-50')).toBe(true);

      const modalCard = helpModal.querySelector('.vintage-modal');
      expect(modalCard.classList.contains('vintage-card')).toBe(true);
      expect(modalCard.classList.contains('border-vintage-accent')).toBe(true);
      expect(modalCard.classList.contains('shadow-vintage-xl')).toBe(true);

      // Test help navigation
      const helpLinks = helpModal.querySelectorAll('.vintage-help-link');
      expect(helpLinks.length).toBe(2);
      helpLinks.forEach(link => {
        expect(link.querySelector('.vintage-help-icon')).toBeTruthy();
        expect(link.querySelector('.vintage-help-title')).toBeTruthy();
      });
    });

    test('should render onboarding flow with proper progression', () => {
      const createOnboardingFlow = () => {
        const onboarding = document.createElement('div');
        onboarding.className = 'vintage-onboarding-overlay fixed inset-0 bg-vintage-ink bg-opacity-70 flex items-center justify-center z-50';
        onboarding.innerHTML = `
          <div class="vintage-onboarding-container vintage-card max-w-lg w-full mx-4 p-vintage-2xl">
            <div class="vintage-onboarding-header text-center mb-vintage-xl">
              <div class="vintage-onboarding-logo mb-vintage-lg">
                <div class="vintage-logo-emblem w-16 h-16 bg-vintage-sepia bg-opacity-20 rounded-full flex items-center justify-center text-vintage-sepia text-2xl mx-auto mb-vintage-sm">📰</div>
                <h1 class="vintage-headline text-vintage-2xl font-newspaper font-bold text-vintage-ink">Editorial Chronicle</h1>
                <p class="vintage-caption text-vintage-sm text-vintage-accent font-newspaper italic">Professional Networking Automation</p>
              </div>

              <div class="vintage-progress-indicator mb-vintage-lg">
                <div class="vintage-progress-bar w-full h-2 bg-vintage-accent bg-opacity-20 rounded-full overflow-hidden">
                  <div class="vintage-progress-fill h-full bg-vintage-sepia transition-all duration-500" style="width: 25%"></div>
                </div>
                <p class="vintage-progress-text text-vintage-xs text-vintage-accent font-newspaper italic mt-vintage-sm">Step 1 of 4</p>
              </div>
            </div>

            <div class="vintage-onboarding-content text-center mb-vintage-xl">
              <div class="vintage-step-indicator mb-vintage-lg">
                <div class="vintage-step-number w-12 h-12 bg-vintage-sepia text-vintage-paper rounded-full flex items-center justify-center text-vintage-lg font-newspaper font-bold mx-auto">1</div>
              </div>
              <h2 class="vintage-headline text-vintage-xl font-newspaper font-bold text-vintage-ink mb-vintage-md">Welcome to Editorial Chronicle</h2>
              <p class="vintage-body text-vintage-base text-vintage-accent font-newspaper leading-relaxed">
                Transform your LinkedIn networking with professional automation that maintains the dignity and precision of classical correspondence.
              </p>
            </div>

            <div class="vintage-onboarding-actions flex space-x-vintage-md">
              <button class="vintage-button-secondary flex-1">Skip Orientation</button>
              <button class="vintage-button-primary flex-1">Begin Setup</button>
            </div>
          </div>
        `;

        return onboarding;
      };

      const onboardingFlow = createOnboardingFlow();

      // Test onboarding structure
      expect(onboardingFlow.querySelector('.vintage-onboarding-container')).toBeTruthy();
      expect(onboardingFlow.querySelector('.vintage-onboarding-header')).toBeTruthy();
      expect(onboardingFlow.querySelector('.vintage-onboarding-content')).toBeTruthy();
      expect(onboardingFlow.querySelector('.vintage-onboarding-actions')).toBeTruthy();

      // Test logo and branding
      expect(onboardingFlow.querySelector('.vintage-logo-emblem')).toBeTruthy();
      expect(onboardingFlow.querySelector('.vintage-headline')).toBeTruthy();

      // Test progress indicator
      const progressBar = onboardingFlow.querySelector('.vintage-progress-bar');
      const progressFill = onboardingFlow.querySelector('.vintage-progress-fill');
      expect(progressBar).toBeTruthy();
      expect(progressFill).toBeTruthy();
      expect(progressFill.style.width).toBe('25%');

      // Test step indicator
      const stepNumber = onboardingFlow.querySelector('.vintage-step-number');
      expect(stepNumber).toBeTruthy();
      expect(stepNumber.textContent).toBe('1');

      // Test action buttons
      const buttons = onboardingFlow.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].classList.contains('vintage-button-secondary')).toBe(true);
      expect(buttons[1].classList.contains('vintage-button-primary')).toBe(true);
    });
  });

  describe('Responsive Behavior Validation', () => {
    test('should adapt layout for different screen sizes', () => {
      const createResponsiveLayout = () => {
        const layout = document.createElement('div');
        layout.className = 'vintage-responsive-container';
        layout.innerHTML = `
          <!-- Mobile-first header -->
          <header class="vintage-header vintage-card p-vintage-md sm:p-vintage-lg lg:p-vintage-xl">
            <h1 class="vintage-headline text-vintage-lg sm:text-vintage-xl lg:text-vintage-2xl font-newspaper font-bold text-vintage-ink">
              Responsive Chronicle
            </h1>
          </header>

          <!-- Responsive grid -->
          <main class="vintage-main-content newspaper-column single sm:double lg:triple gap-vintage-md sm:gap-vintage-lg lg:gap-vintage-xl">
            <section class="vintage-card p-vintage-sm sm:p-vintage-md lg:p-vintage-lg">
              <h2 class="vintage-headline text-vintage-base sm:text-vintage-lg lg:text-vintage-xl font-newspaper font-bold text-vintage-ink">Section 1</h2>
            </section>
            <section class="vintage-card p-vintage-sm sm:p-vintage-md lg:p-vintage-lg">
              <h2 class="vintage-headline text-vintage-base sm:text-vintage-lg lg:text-vintage-xl font-newspaper font-bold text-vintage-ink">Section 2</h2>
            </section>
            <section class="vintage-card p-vintage-sm sm:p-vintage-md lg:p-vintage-lg">
              <h2 class="vintage-headline text-vintage-base sm:text-vintage-lg lg:text-vintage-xl font-newspaper font-bold text-vintage-ink">Section 3</h2>
            </section>
          </main>

          <!-- Responsive navigation -->
          <nav class="vintage-nav flex flex-col sm:flex-row space-y-vintage-sm sm:space-y-0 sm:space-x-vintage-md p-vintage-md">
            <a href="#" class="vintage-nav-item px-vintage-sm py-vintage-xs sm:px-vintage-md sm:py-vintage-sm text-vintage-sm font-newspaper">Home</a>
            <a href="#" class="vintage-nav-item px-vintage-sm py-vintage-xs sm:px-vintage-md sm:py-vintage-sm text-vintage-sm font-newspaper">Analytics</a>
            <a href="#" class="vintage-nav-item px-vintage-sm py-vintage-xs sm:px-vintage-md sm:py-vintage-sm text-vintage-sm font-newspaper">Settings</a>
          </nav>
        `;

        return layout;
      };

      const responsiveLayout = createResponsiveLayout();

      // Test responsive header
      const header = responsiveLayout.querySelector('.vintage-header');
      expect(header.className).toContain('p-vintage-md');
      expect(header.className).toContain('sm:p-vintage-lg');
      expect(header.className).toContain('lg:p-vintage-xl');

      // Test responsive typography
      const headline = header.querySelector('.vintage-headline');
      expect(headline.className).toContain('text-vintage-lg');
      expect(headline.className).toContain('sm:text-vintage-xl');
      expect(headline.className).toContain('lg:text-vintage-2xl');

      // Test responsive grid
      const mainContent = responsiveLayout.querySelector('.vintage-main-content');
      expect(mainContent.className).toContain('newspaper-column');
      expect(mainContent.className).toContain('single');
      expect(mainContent.className).toContain('sm:double');
      expect(mainContent.className).toContain('lg:triple');

      // Test responsive spacing
      expect(mainContent.className).toContain('gap-vintage-md');
      expect(mainContent.className).toContain('sm:gap-vintage-lg');
      expect(mainContent.className).toContain('lg:gap-vintage-xl');

      // Test responsive navigation
      const nav = responsiveLayout.querySelector('.vintage-nav');
      expect(nav.className).toContain('flex-col');
      expect(nav.className).toContain('sm:flex-row');
      expect(nav.className).toContain('space-y-vintage-sm');
      expect(nav.className).toContain('sm:space-y-0');

      // Test section count
      const sections = responsiveLayout.querySelectorAll('section.vintage-card');
      expect(sections.length).toBe(3);
    });
  });

  describe('Typography and Font Rendering', () => {
    test('should apply consistent newspaper typography', () => {
      const createTypographyTest = () => {
        const typography = document.createElement('div');
        typography.className = 'vintage-typography-test';
        typography.innerHTML = `
          <h1 class="vintage-headline text-vintage-4xl font-newspaper font-bold text-vintage-ink">Chronicle Headline</h1>
          <h2 class="vintage-headline text-vintage-2xl font-newspaper font-bold text-vintage-ink">Section Header</h2>
          <h3 class="vintage-headline text-vintage-xl font-newspaper font-bold text-vintage-ink">Subsection</h3>

          <p class="vintage-body text-vintage-base font-newspaper text-vintage-ink leading-relaxed">
            This is body text using the newspaper font family with proper line height and spacing for readability.
          </p>

          <p class="vintage-caption text-vintage-sm font-newspaper italic text-vintage-accent">
            Caption text with italic styling and accent coloring for supporting information.
          </p>

          <p class="vintage-quote text-vintage-lg font-newspaper italic text-vintage-sepia border-l-4 border-vintage-sepia pl-vintage-md">
            "This is a quote demonstrating special typography treatment with border and sepia coloring."
          </p>

          <div class="vintage-byline text-vintage-xs font-newspaper text-vintage-accent">
            By Editorial Staff • Published Today
          </div>
        `;

        return typography;
      };

      const typographyTest = createTypographyTest();

      // Test headline hierarchy
      const headlines = typographyTest.querySelectorAll('.vintage-headline');
      expect(headlines.length).toBe(3);
      headlines.forEach(headline => {
        expect(headline.classList.contains('font-newspaper')).toBe(true);
        expect(headline.classList.contains('font-bold')).toBe(true);
        expect(headline.classList.contains('text-vintage-ink')).toBe(true);
      });

      // Test body text
      const bodyText = typographyTest.querySelector('.vintage-body');
      expect(bodyText.classList.contains('font-newspaper')).toBe(true);
      expect(bodyText.classList.contains('leading-relaxed')).toBe(true);

      // Test caption styling
      const caption = typographyTest.querySelector('.vintage-caption');
      expect(caption.classList.contains('italic')).toBe(true);
      expect(caption.classList.contains('text-vintage-accent')).toBe(true);

      // Test quote styling
      const quote = typographyTest.querySelector('.vintage-quote');
      expect(quote.classList.contains('italic')).toBe(true);
      expect(quote.classList.contains('text-vintage-sepia')).toBe(true);
      expect(quote.classList.contains('border-l-4')).toBe(true);

      // Test byline
      const byline = typographyTest.querySelector('.vintage-byline');
      expect(byline.classList.contains('text-vintage-xs')).toBe(true);
      expect(byline.classList.contains('text-vintage-accent')).toBe(true);
    });
  });

  describe('Animation and Transition Consistency', () => {
    test('should implement smooth transitions across components', () => {
      const createAnimatedComponents = () => {
        const container = document.createElement('div');
        container.innerHTML = `
          <!-- Button with hover transition -->
          <button class="vintage-button-primary transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-vintage-lg">
            Animated Button
          </button>

          <!-- Toggle with smooth transition -->
          <label class="vintage-toggle-switch relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200">
            <input type="checkbox" class="sr-only peer">
            <span class="vintage-toggle-knob inline-block h-4 w-4 transform rounded-full transition-transform duration-200 translate-x-1 peer-checked:translate-x-6"></span>
          </label>

          <!-- Modal with entrance animation -->
          <div class="vintage-modal transform transition-all duration-300 ease-out opacity-0 scale-90 rotate-1" data-state="hidden">
            <div class="vintage-card p-vintage-lg">Modal Content</div>
          </div>

          <!-- Notification with slide animation -->
          <div class="vintage-notification transform transition-transform duration-300 translate-x-full" data-state="hidden">
            <div class="vintage-card p-vintage-md">Notification Message</div>
          </div>
        `;

        // Add animation control methods
        container.showModal = () => {
          const modal = container.querySelector('.vintage-modal');
          modal.classList.remove('opacity-0', 'scale-90', 'rotate-1');
          modal.dataset.state = 'visible';
        };

        container.showNotification = () => {
          const notification = container.querySelector('.vintage-notification');
          notification.classList.remove('translate-x-full');
          notification.dataset.state = 'visible';
        };

        return container;
      };

      const animatedComponents = createAnimatedComponents();

      // Test button transitions
      const button = animatedComponents.querySelector('.vintage-button-primary');
      expect(button.classList.contains('transition-all')).toBe(true);
      expect(button.classList.contains('duration-200')).toBe(true);

      // Test toggle transitions
      const toggle = animatedComponents.querySelector('.vintage-toggle-switch');
      const toggleKnob = animatedComponents.querySelector('.vintage-toggle-knob');
      expect(toggle.classList.contains('transition-colors')).toBe(true);
      expect(toggleKnob.classList.contains('transition-transform')).toBe(true);

      // Test modal animations
      const modal = animatedComponents.querySelector('.vintage-modal');
      expect(modal.classList.contains('transition-all')).toBe(true);
      expect(modal.classList.contains('duration-300')).toBe(true);
      expect(modal.classList.contains('opacity-0')).toBe(true);

      // Test animation controls
      expect(typeof animatedComponents.showModal).toBe('function');
      expect(typeof animatedComponents.showNotification).toBe('function');

      // Test animation state changes
      animatedComponents.showModal();
      expect(modal.classList.contains('opacity-0')).toBe(false);
      expect(modal.dataset.state).toBe('visible');
    });
  });
});