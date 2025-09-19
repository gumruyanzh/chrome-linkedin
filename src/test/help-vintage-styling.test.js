// Help System and Onboarding Vintage Styling Tests
// Tests for vintage newspaper-themed help and onboarding components

describe('Help System and Onboarding Vintage Styling', () => {

  describe('Vintage Help Documentation Components', () => {
    test('should create newspaper-style help documentation with vintage typography', () => {
      const createHelpDocumentation = (config) => {
        const container = document.createElement('div');
        container.classList.add(
          'vintage-help-documentation',
          'vintage-card',
          'p-vintage-xl',
          'font-newspaper'
        );

        const header = document.createElement('div');
        header.classList.add(
          'vintage-help-header',
          'border-b-2',
          'border-vintage-accent',
          'border-opacity-20',
          'pb-vintage-lg',
          'mb-vintage-xl'
        );

        const title = document.createElement('h1');
        title.classList.add(
          'vintage-headline',
          'text-vintage-3xl',
          'font-newspaper',
          'font-bold',
          'text-vintage-ink',
          'mb-vintage-sm'
        );
        title.textContent = config.title;

        const subtitle = document.createElement('p');
        subtitle.classList.add(
          'vintage-caption',
          'text-vintage-sm',
          'text-vintage-accent',
          'font-newspaper',
          'italic'
        );
        subtitle.textContent = config.subtitle;

        header.appendChild(title);
        header.appendChild(subtitle);

        const content = document.createElement('div');
        content.classList.add('vintage-help-content', 'space-y-vintage-lg');

        config.sections.forEach(section => {
          const sectionDiv = document.createElement('div');
          sectionDiv.classList.add('vintage-help-section');

          const sectionTitle = document.createElement('h2');
          sectionTitle.classList.add(
            'vintage-headline',
            'text-vintage-lg',
            'font-newspaper',
            'font-bold',
            'text-vintage-ink',
            'mb-vintage-md'
          );
          sectionTitle.textContent = section.title;

          const sectionContent = document.createElement('div');
          sectionContent.classList.add(
            'vintage-body',
            'text-vintage-base',
            'text-vintage-ink',
            'font-newspaper',
            'leading-relaxed'
          );
          sectionContent.innerHTML = section.content;

          sectionDiv.appendChild(sectionTitle);
          sectionDiv.appendChild(sectionContent);
          content.appendChild(sectionDiv);
        });

        container.appendChild(header);
        container.appendChild(content);

        return container;
      };

      const helpDoc = createHelpDocumentation({
        title: 'Editorial Guidelines',
        subtitle: 'Professional networking automation standards',
        sections: [
          {
            title: 'Getting Started',
            content: '<p>Begin your editorial journey with these foundational steps.</p>'
          },
          {
            title: 'Advanced Features',
            content: '<p>Explore sophisticated automation capabilities.</p>'
          }
        ]
      });

      expect(helpDoc.classList.contains('vintage-help-documentation')).toBe(true);
      expect(helpDoc.querySelector('.vintage-help-header')).toBeTruthy();
      expect(helpDoc.querySelector('.vintage-headline')).toBeTruthy();
      expect(helpDoc.querySelector('.vintage-caption')).toBeTruthy();
      expect(helpDoc.querySelector('.vintage-help-content')).toBeTruthy();
      expect(helpDoc.querySelectorAll('.vintage-help-section').length).toBe(2);
    });

    test('should create vintage help navigation sidebar', () => {
      const createHelpNavigation = (config) => {
        const nav = document.createElement('nav');
        nav.classList.add(
          'vintage-help-navigation',
          'vintage-card',
          'h-fit',
          'sticky',
          'top-vintage-lg'
        );

        const navHeader = document.createElement('div');
        navHeader.classList.add(
          'vintage-nav-header',
          'border-b-2',
          'border-vintage-accent',
          'border-opacity-20',
          'pb-vintage-md',
          'mb-vintage-lg'
        );

        const navTitle = document.createElement('h3');
        navTitle.classList.add(
          'vintage-headline',
          'text-vintage-lg',
          'font-newspaper',
          'font-bold',
          'text-vintage-ink'
        );
        navTitle.textContent = 'Documentation Index';

        navHeader.appendChild(navTitle);

        const navList = document.createElement('ul');
        navList.classList.add('vintage-nav-list', 'space-y-vintage-sm');

        config.sections.forEach((section, index) => {
          const navItem = document.createElement('li');
          const navLink = document.createElement('a');
          navLink.href = `#${section.id}`;
          navLink.classList.add(
            'vintage-nav-link',
            'block',
            'px-vintage-md',
            'py-vintage-sm',
            'rounded-vintage-sm',
            'font-newspaper',
            'text-vintage-sm',
            'transition-colors',
            'border-l-4'
          );

          if (section.active) {
            navLink.classList.add(
              'bg-vintage-sepia',
              'bg-opacity-10',
              'text-vintage-ink',
              'border-vintage-sepia'
            );
          } else {
            navLink.classList.add(
              'text-vintage-accent',
              'hover:bg-vintage-paper',
              'hover:text-vintage-ink',
              'border-transparent'
            );
          }

          navLink.textContent = section.title;
          navItem.appendChild(navLink);
          navList.appendChild(navItem);
        });

        nav.appendChild(navHeader);
        nav.appendChild(navList);

        return nav;
      };

      const helpNav = createHelpNavigation({
        sections: [
          { id: 'getting-started', title: 'Getting Started', active: true },
          { id: 'automation', title: 'Automation Guide', active: false },
          { id: 'templates', title: 'Message Templates', active: false },
          { id: 'troubleshooting', title: 'Troubleshooting', active: false }
        ]
      });

      expect(helpNav.classList.contains('vintage-help-navigation')).toBe(true);
      expect(helpNav.querySelector('.vintage-nav-header')).toBeTruthy();
      expect(helpNav.querySelector('.vintage-nav-list')).toBeTruthy();
      expect(helpNav.querySelectorAll('.vintage-nav-link').length).toBe(4);

      const activeLink = helpNav.querySelector('.bg-vintage-sepia');
      expect(activeLink).toBeTruthy();
      expect(activeLink.textContent).toBe('Getting Started');
    });

    test('should create vintage onboarding step components', () => {
      const createOnboardingStep = (config) => {
        const step = document.createElement('div');
        step.classList.add(
          'vintage-onboarding-step',
          'vintage-card',
          'p-vintage-xl',
          'mb-vintage-lg'
        );

        const stepHeader = document.createElement('div');
        stepHeader.classList.add(
          'vintage-step-header',
          'flex',
          'items-center',
          'mb-vintage-lg'
        );

        const stepNumber = document.createElement('div');
        stepNumber.classList.add(
          'vintage-step-number',
          'w-12',
          'h-12',
          'rounded-full',
          'bg-vintage-sepia',
          'text-vintage-paper',
          'flex',
          'items-center',
          'justify-center',
          'font-newspaper',
          'font-bold',
          'text-vintage-lg',
          'mr-vintage-md'
        );
        stepNumber.textContent = config.stepNumber;

        const stepTitle = document.createElement('h3');
        stepTitle.classList.add(
          'vintage-headline',
          'text-vintage-xl',
          'font-newspaper',
          'font-bold',
          'text-vintage-ink'
        );
        stepTitle.textContent = config.title;

        stepHeader.appendChild(stepNumber);
        stepHeader.appendChild(stepTitle);

        const stepContent = document.createElement('div');
        stepContent.classList.add(
          'vintage-step-content',
          'ml-16',
          'space-y-vintage-md'
        );

        const stepDescription = document.createElement('p');
        stepDescription.classList.add(
          'vintage-body',
          'text-vintage-base',
          'text-vintage-ink',
          'font-newspaper',
          'leading-relaxed'
        );
        stepDescription.textContent = config.description;

        stepContent.appendChild(stepDescription);

        if (config.actions && config.actions.length > 0) {
          const actionsDiv = document.createElement('div');
          actionsDiv.classList.add(
            'vintage-step-actions',
            'flex',
            'space-x-vintage-md',
            'mt-vintage-lg'
          );

          config.actions.forEach(action => {
            const actionButton = document.createElement('button');
            actionButton.classList.add(
              action.primary ? 'vintage-button-primary' : 'vintage-button-secondary'
            );
            actionButton.textContent = action.label;
            actionsDiv.appendChild(actionButton);
          });

          stepContent.appendChild(actionsDiv);
        }

        step.appendChild(stepHeader);
        step.appendChild(stepContent);

        return step;
      };

      const onboardingStep = createOnboardingStep({
        stepNumber: '1',
        title: 'Configure Editorial Settings',
        description: 'Set up your automation preferences and daily publishing limits.',
        actions: [
          { label: 'Open Settings', primary: true },
          { label: 'Skip for Now', primary: false }
        ]
      });

      expect(onboardingStep.classList.contains('vintage-onboarding-step')).toBe(true);
      expect(onboardingStep.querySelector('.vintage-step-header')).toBeTruthy();
      expect(onboardingStep.querySelector('.vintage-step-number')).toBeTruthy();
      expect(onboardingStep.querySelector('.vintage-headline')).toBeTruthy();
      expect(onboardingStep.querySelector('.vintage-step-content')).toBeTruthy();
      expect(onboardingStep.querySelector('.vintage-step-actions')).toBeTruthy();
      expect(onboardingStep.querySelectorAll('button').length).toBe(2);
    });
  });

  describe('Vintage Help Interface Layout', () => {
    test('should create newspaper-style help interface layout', () => {
      const createHelpInterface = (config) => {
        const container = document.createElement('div');
        container.classList.add(
          'vintage-help-interface',
          'min-h-screen',
          'bg-vintage-texture',
          'font-newspaper'
        );

        const header = document.createElement('header');
        header.classList.add(
          'vintage-help-header',
          'vintage-card',
          'mb-vintage-xl',
          'border-b',
          'border-vintage-accent',
          'border-opacity-20',
          'pb-vintage-lg'
        );

        const headerContent = document.createElement('div');
        headerContent.classList.add('flex', 'items-center', 'justify-between');

        const titleSection = document.createElement('div');
        titleSection.classList.add('flex', 'items-center', 'space-x-vintage-md');

        const icon = document.createElement('div');
        icon.classList.add(
          'vintage-help-icon',
          'w-12',
          'h-12',
          'bg-vintage-sepia',
          'bg-opacity-20',
          'rounded-full',
          'flex',
          'items-center',
          'justify-center'
        );
        icon.textContent = '📖';

        const titleDiv = document.createElement('div');
        const title = document.createElement('h1');
        title.classList.add(
          'vintage-headline',
          'text-vintage-3xl',
          'font-newspaper',
          'font-bold',
          'text-vintage-ink'
        );
        title.textContent = config.title;

        const subtitle = document.createElement('p');
        subtitle.classList.add(
          'vintage-caption',
          'text-vintage-sm',
          'text-vintage-accent',
          'font-newspaper',
          'italic'
        );
        subtitle.textContent = config.subtitle;

        titleDiv.appendChild(title);
        titleDiv.appendChild(subtitle);
        titleSection.appendChild(icon);
        titleSection.appendChild(titleDiv);

        const searchSection = document.createElement('div');
        searchSection.classList.add('vintage-help-search');

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search documentation...';
        searchInput.classList.add(
          'vintage-input-field',
          'w-64',
          'px-vintage-md',
          'py-3',
          'border-2',
          'border-vintage-accent',
          'border-opacity-20',
          'rounded-vintage-md',
          'focus:ring-2',
          'focus:ring-vintage-sepia',
          'focus:border-vintage-sepia',
          'bg-vintage-paper',
          'font-newspaper'
        );

        searchSection.appendChild(searchInput);
        headerContent.appendChild(titleSection);
        headerContent.appendChild(searchSection);
        header.appendChild(headerContent);

        const mainContent = document.createElement('main');
        mainContent.classList.add(
          'vintage-help-main',
          'newspaper-column',
          'triple',
          'gap-vintage-xl'
        );

        // Navigation column
        const navColumn = document.createElement('div');
        navColumn.classList.add('vintage-help-nav-column');

        // Content column
        const contentColumn = document.createElement('div');
        contentColumn.classList.add(
          'vintage-help-content-column',
          'col-span-2',
          'space-y-vintage-lg'
        );

        mainContent.appendChild(navColumn);
        mainContent.appendChild(contentColumn);
        container.appendChild(header);
        container.appendChild(mainContent);

        return container;
      };

      const helpInterface = createHelpInterface({
        title: 'Editorial Documentation',
        subtitle: 'Comprehensive guide to professional networking automation'
      });

      expect(helpInterface.classList.contains('vintage-help-interface')).toBe(true);
      expect(helpInterface.querySelector('.vintage-help-header')).toBeTruthy();
      expect(helpInterface.querySelector('.vintage-help-icon')).toBeTruthy();
      expect(helpInterface.querySelector('.vintage-help-search')).toBeTruthy();
      expect(helpInterface.querySelector('.vintage-help-main')).toBeTruthy();
      expect(helpInterface.querySelector('.vintage-help-nav-column')).toBeTruthy();
      expect(helpInterface.querySelector('.vintage-help-content-column')).toBeTruthy();
    });

    test('should create vintage onboarding flow with progress indicators', () => {
      const createOnboardingFlow = (config) => {
        const container = document.createElement('div');
        container.classList.add(
          'vintage-onboarding-flow',
          'min-h-screen',
          'bg-vintage-texture',
          'font-newspaper',
          'flex',
          'items-center',
          'justify-center'
        );

        const flowCard = document.createElement('div');
        flowCard.classList.add(
          'vintage-onboarding-card',
          'vintage-card',
          'max-w-2xl',
          'w-full',
          'p-vintage-2xl'
        );

        const progressHeader = document.createElement('div');
        progressHeader.classList.add(
          'vintage-progress-header',
          'mb-vintage-xl'
        );

        const progressTitle = document.createElement('h2');
        progressTitle.classList.add(
          'vintage-headline',
          'text-vintage-2xl',
          'font-newspaper',
          'font-bold',
          'text-vintage-ink',
          'mb-vintage-md'
        );
        progressTitle.textContent = 'Editorial Onboarding';

        const progressBar = document.createElement('div');
        progressBar.classList.add(
          'vintage-progress-bar',
          'w-full',
          'h-2',
          'bg-vintage-accent',
          'bg-opacity-20',
          'rounded-full',
          'overflow-hidden'
        );

        const progressFill = document.createElement('div');
        progressFill.classList.add(
          'vintage-progress-fill',
          'h-full',
          'bg-vintage-sepia',
          'transition-all',
          'duration-300',
          'ease-out'
        );
        progressFill.style.width = `${(config.currentStep / config.totalSteps) * 100}%`;

        progressBar.appendChild(progressFill);

        const progressText = document.createElement('p');
        progressText.classList.add(
          'vintage-caption',
          'text-vintage-xs',
          'text-vintage-accent',
          'font-newspaper',
          'italic',
          'mt-2'
        );
        progressText.textContent = `Step ${config.currentStep} of ${config.totalSteps}`;

        progressHeader.appendChild(progressTitle);
        progressHeader.appendChild(progressBar);
        progressHeader.appendChild(progressText);

        const stepContent = document.createElement('div');
        stepContent.classList.add('vintage-step-content');

        const stepTitle = document.createElement('h3');
        stepTitle.classList.add(
          'vintage-headline',
          'text-vintage-xl',
          'font-newspaper',
          'font-bold',
          'text-vintage-ink',
          'mb-vintage-md'
        );
        stepTitle.textContent = config.stepTitle;

        const stepDescription = document.createElement('p');
        stepDescription.classList.add(
          'vintage-body',
          'text-vintage-base',
          'text-vintage-ink',
          'font-newspaper',
          'leading-relaxed',
          'mb-vintage-lg'
        );
        stepDescription.textContent = config.stepDescription;

        stepContent.appendChild(stepTitle);
        stepContent.appendChild(stepDescription);

        const navigationButtons = document.createElement('div');
        navigationButtons.classList.add(
          'vintage-onboarding-navigation',
          'flex',
          'justify-between',
          'items-center',
          'pt-vintage-lg',
          'border-t',
          'border-vintage-accent',
          'border-opacity-20'
        );

        const backButton = document.createElement('button');
        backButton.classList.add('vintage-button-secondary');
        backButton.textContent = 'Previous';
        backButton.disabled = config.currentStep === 1;

        const nextButton = document.createElement('button');
        nextButton.classList.add('vintage-button-primary');
        nextButton.textContent = config.currentStep === config.totalSteps ? 'Complete Setup' : 'Next Step';

        navigationButtons.appendChild(backButton);
        navigationButtons.appendChild(nextButton);

        flowCard.appendChild(progressHeader);
        flowCard.appendChild(stepContent);
        flowCard.appendChild(navigationButtons);
        container.appendChild(flowCard);

        return container;
      };

      const onboardingFlow = createOnboardingFlow({
        currentStep: 2,
        totalSteps: 4,
        stepTitle: 'Configure Message Templates',
        stepDescription: 'Create personalized connection request templates that reflect your professional voice.'
      });

      expect(onboardingFlow.classList.contains('vintage-onboarding-flow')).toBe(true);
      expect(onboardingFlow.querySelector('.vintage-onboarding-card')).toBeTruthy();
      expect(onboardingFlow.querySelector('.vintage-progress-header')).toBeTruthy();
      expect(onboardingFlow.querySelector('.vintage-progress-bar')).toBeTruthy();
      expect(onboardingFlow.querySelector('.vintage-progress-fill')).toBeTruthy();
      expect(onboardingFlow.querySelector('.vintage-onboarding-navigation')).toBeTruthy();

      const progressFill = onboardingFlow.querySelector('.vintage-progress-fill');
      expect(progressFill.style.width).toBe('50%');
    });
  });

  describe('Help System Accessibility and Interaction', () => {
    test('should implement accessible help system navigation', () => {
      const createAccessibleHelpNav = () => {
        const nav = document.createElement('nav');
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Help documentation navigation');
        nav.classList.add('vintage-help-nav');

        const navList = document.createElement('ul');
        navList.setAttribute('role', 'list');

        const sections = [
          { id: 'getting-started', title: 'Getting Started', current: true },
          { id: 'automation', title: 'Automation Guide', current: false },
          { id: 'troubleshooting', title: 'Troubleshooting', current: false }
        ];

        sections.forEach(section => {
          const listItem = document.createElement('li');
          listItem.setAttribute('role', 'listitem');

          const link = document.createElement('a');
          link.href = `#${section.id}`;
          link.classList.add('vintage-nav-link');
          link.textContent = section.title;

          if (section.current) {
            link.setAttribute('aria-current', 'page');
            link.classList.add('active');
          }

          listItem.appendChild(link);
          navList.appendChild(listItem);
        });

        nav.appendChild(navList);
        return nav;
      };

      const accessibleNav = createAccessibleHelpNav();

      expect(accessibleNav.getAttribute('role')).toBe('navigation');
      expect(accessibleNav.getAttribute('aria-label')).toBe('Help documentation navigation');
      expect(accessibleNav.querySelector('[role="list"]')).toBeTruthy();
      expect(accessibleNav.querySelectorAll('[role="listitem"]').length).toBe(3);
      expect(accessibleNav.querySelector('[aria-current="page"]')).toBeTruthy();
    });

    test('should create searchable help content system', () => {
      const createSearchableHelp = (config) => {
        const container = document.createElement('div');
        container.classList.add('vintage-searchable-help');

        const searchForm = document.createElement('form');
        searchForm.setAttribute('role', 'search');
        searchForm.classList.add('vintage-help-search-form', 'mb-vintage-lg');

        const searchLabel = document.createElement('label');
        searchLabel.setAttribute('for', 'help-search');
        searchLabel.classList.add('sr-only');
        searchLabel.textContent = 'Search help documentation';

        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.id = 'help-search';
        searchInput.classList.add('vintage-search-input');
        searchInput.placeholder = 'Search documentation...';
        searchInput.setAttribute('aria-describedby', 'search-help-text');

        const searchButton = document.createElement('button');
        searchButton.type = 'submit';
        searchButton.classList.add('vintage-search-button');
        searchButton.textContent = 'Search';

        const helpText = document.createElement('div');
        helpText.id = 'search-help-text';
        helpText.classList.add('vintage-help-text');
        helpText.textContent = 'Search through all documentation topics';

        searchForm.appendChild(searchLabel);
        searchForm.appendChild(searchInput);
        searchForm.appendChild(searchButton);

        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'search-results';
        resultsContainer.setAttribute('aria-live', 'polite');
        resultsContainer.classList.add('vintage-search-results');

        container.appendChild(searchForm);
        container.appendChild(helpText);
        container.appendChild(resultsContainer);

        // Mock search functionality
        container.search = (query) => {
          const results = config.content.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.content.toLowerCase().includes(query.toLowerCase())
          );
          return results;
        };

        return container;
      };

      const searchableHelp = createSearchableHelp({
        content: [
          { title: 'Getting Started', content: 'Basic setup instructions' },
          { title: 'Automation Features', content: 'Advanced automation capabilities' }
        ]
      });

      expect(searchableHelp.querySelector('[role="search"]')).toBeTruthy();
      expect(searchableHelp.querySelector('#help-search')).toBeTruthy();
      expect(searchableHelp.querySelector('.sr-only')).toBeTruthy();
      expect(searchableHelp.querySelector('[aria-describedby="search-help-text"]')).toBeTruthy();
      expect(searchableHelp.querySelector('[aria-live="polite"]')).toBeTruthy();
      expect(typeof searchableHelp.search).toBe('function');

      const results = searchableHelp.search('automation');
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Automation Features');
    });

    test('should validate onboarding flow keyboard navigation', () => {
      const createKeyboardNavigableOnboarding = () => {
        const container = document.createElement('div');
        container.classList.add('vintage-onboarding-keyboard');
        container.setAttribute('tabindex', '0');

        const steps = document.createElement('div');
        steps.setAttribute('role', 'tablist');
        steps.setAttribute('aria-label', 'Onboarding steps');

        for (let i = 1; i <= 3; i++) {
          const step = document.createElement('button');
          step.setAttribute('role', 'tab');
          step.setAttribute('id', `step-${i}`);
          step.setAttribute('aria-controls', `step-panel-${i}`);
          step.setAttribute('aria-selected', i === 1 ? 'true' : 'false');
          step.tabIndex = i === 1 ? 0 : -1;
          step.classList.add('vintage-onboarding-tab');
          step.textContent = `Step ${i}`;

          const panel = document.createElement('div');
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('id', `step-panel-${i}`);
          panel.setAttribute('aria-labelledby', `step-${i}`);
          panel.classList.add('vintage-onboarding-panel');
          panel.hidden = i !== 1;

          steps.appendChild(step);
          container.appendChild(panel);
        }

        container.appendChild(steps);

        // Mock keyboard navigation
        container.handleKeyDown = (event) => {
          const currentTab = container.querySelector('[aria-selected="true"]');
          const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
          const currentIndex = tabs.indexOf(currentTab);

          let newIndex;
          switch (event.key) {
            case 'ArrowRight':
              newIndex = (currentIndex + 1) % tabs.length;
              break;
            case 'ArrowLeft':
              newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
              break;
            default:
              return;
          }

          tabs[currentIndex].setAttribute('aria-selected', 'false');
          tabs[currentIndex].tabIndex = -1;
          tabs[newIndex].setAttribute('aria-selected', 'true');
          tabs[newIndex].tabIndex = 0;
          tabs[newIndex].focus();
        };

        return container;
      };

      const keyboardOnboarding = createKeyboardNavigableOnboarding();

      expect(keyboardOnboarding.querySelector('[role="tablist"]')).toBeTruthy();
      expect(keyboardOnboarding.querySelectorAll('[role="tab"]').length).toBe(3);
      expect(keyboardOnboarding.querySelectorAll('[role="tabpanel"]').length).toBe(3);
      expect(keyboardOnboarding.querySelector('[aria-selected="true"]')).toBeTruthy();
      expect(typeof keyboardOnboarding.handleKeyDown).toBe('function');

      const selectedTab = keyboardOnboarding.querySelector('[aria-selected="true"]');
      expect(selectedTab.tabIndex).toBe(0);
    });
  });
});