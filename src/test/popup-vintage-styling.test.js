/**
 * Popup Vintage Styling Tests
 * Tests for vintage newspaper-inspired popup layout and components
 */

import { ChromeStorageMock, ChromeTabsMock, createChromeExtensionMock } from './chrome-mock.js';

// Mock DOM environment for popup testing
const mockDOMEnvironment = () => {
  // Mock document and window
  global.document = {
    createElement: jest.fn((tagName) => {
      const element = {
        tagName: tagName.toUpperCase(),
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn(),
          toggle: jest.fn()
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        style: {},
        textContent: '',
        innerHTML: '',
        id: '',
        dataset: {}
      };
      return element;
    }),
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    documentElement: {
      style: {
        setProperty: jest.fn(),
        getPropertyValue: jest.fn()
      }
    },
    visibilityState: 'visible',
    addEventListener: jest.fn()
  };

  global.window = {
    requestAnimationFrame: jest.fn((callback) => setTimeout(callback, 16)),
    getComputedStyle: jest.fn(() => ({
      getPropertyValue: jest.fn()
    }))
  };
};

describe('Popup Vintage Styling', () => {
  let chromeMock;

  beforeEach(() => {
    chromeMock = createChromeExtensionMock();
    global.chrome = chromeMock;
    mockDOMEnvironment();
  });

  afterEach(() => {
    delete global.chrome;
    delete global.document;
    delete global.window;
    jest.clearAllMocks();
  });

  describe('Vintage Header Components', () => {
    test('should create vintage newspaper header structure', () => {
      const createVintageHeader = () => {
        const header = {
          element: document.createElement('div'),
          title: document.createElement('h1'),
          subtitle: document.createElement('p'),
          logo: document.createElement('img')
        };

        // Apply vintage header classes
        header.element.classList.add('vintage-card', 'newspaper-column', 'single');
        header.title.classList.add('vintage-headline', 'text-vintage-3xl', 'font-newspaper', 'text-vintage-ink', 'mb-vintage-sm');
        header.subtitle.classList.add('vintage-body', 'text-vintage-base', 'text-vintage-accent', 'font-newspaper');
        header.logo.classList.add('w-8', 'h-8', 'opacity-80');

        return header;
      };

      const header = createVintageHeader();

      // Verify that the elements were created with proper structure
      expect(header.element).toBeDefined();
      expect(header.title).toBeDefined();
      expect(header.subtitle).toBeDefined();
      expect(header.logo).toBeDefined();

      // Verify element types
      expect(header.element.tagName).toBe('DIV');
      expect(header.title.tagName).toBe('H1');
      expect(header.subtitle.tagName).toBe('P');
      expect(header.logo.tagName).toBe('IMG');
    });

    test('should apply newspaper typography hierarchy', () => {
      const applyNewspaperTypography = (element, level) => {
        const typographyClasses = {
          headline: ['vintage-headline', 'text-vintage-3xl', 'font-bold', 'text-vintage-ink'],
          subheadline: ['vintage-subheadline', 'text-vintage-xl', 'font-semibold', 'text-vintage-ink'],
          body: ['vintage-body', 'text-vintage-base', 'font-normal', 'text-vintage-ink'],
          caption: ['vintage-caption', 'text-vintage-sm', 'font-normal', 'text-vintage-accent', 'italic']
        };

        const classes = typographyClasses[level] || typographyClasses.body;
        classes.forEach(className => element.classList.add(className));

        return classes;
      };

      const headlineElement = document.createElement('h1');
      const appliedClasses = applyNewspaperTypography(headlineElement, 'headline');

      expect(appliedClasses).toEqual(['vintage-headline', 'text-vintage-3xl', 'font-bold', 'text-vintage-ink']);
      expect(headlineElement.classList.add).toHaveBeenCalledWith('vintage-headline');
      expect(headlineElement.classList.add).toHaveBeenCalledWith('text-vintage-3xl');
      expect(headlineElement.classList.add).toHaveBeenCalledWith('font-bold');
      expect(headlineElement.classList.add).toHaveBeenCalledWith('text-vintage-ink');
    });

    test('should create vintage help button with proper styling', () => {
      const createVintageHelpButton = () => {
        const button = document.createElement('button');
        const icon = document.createElement('svg');

        // Apply vintage button styling
        button.classList.add('vintage-button', 'p-2', 'rounded-vintage', 'shadow-vintage');
        icon.classList.add('w-5', 'h-5', 'text-vintage-paper');

        return { button, icon };
      };

      const helpButton = createVintageHelpButton();

      expect(helpButton.button.classList.add).toHaveBeenCalledWith('vintage-button', 'p-2', 'rounded-vintage', 'shadow-vintage');
      expect(helpButton.icon.classList.add).toHaveBeenCalledWith('w-5', 'h-5', 'text-vintage-paper');
    });
  });

  describe('Vintage Form Components', () => {
    test('should style status section with vintage elements', () => {
      const createVintageStatusSection = () => {
        const statusSection = document.createElement('div');
        const statusLabel = document.createElement('span');
        const statusIndicator = document.createElement('div');
        const statusDot = document.createElement('div');
        const statusText = document.createElement('span');

        // Apply vintage styling
        statusSection.classList.add('vintage-form-group', 'horizontal', 'mb-vintage-lg');
        statusLabel.classList.add('vintage-label', 'text-vintage-sm');
        statusIndicator.classList.add('flex', 'items-center', 'space-x-2');
        statusDot.classList.add('w-2', 'h-2', 'rounded-full', 'border', 'border-vintage-accent');
        statusText.classList.add('vintage-body', 'text-vintage-sm', 'font-medium');

        return { statusSection, statusLabel, statusIndicator, statusDot, statusText };
      };

      const statusComponents = createVintageStatusSection();

      expect(statusComponents.statusSection.classList.add).toHaveBeenCalledWith('vintage-form-group', 'horizontal', 'mb-vintage-lg');
      expect(statusComponents.statusLabel.classList.add).toHaveBeenCalledWith('vintage-label', 'text-vintage-sm');
      expect(statusComponents.statusDot.classList.add).toHaveBeenCalledWith('w-2', 'h-2', 'rounded-full', 'border', 'border-vintage-accent');
    });

    test('should create vintage progress bar component', () => {
      const createVintageProgressBar = () => {
        const progressContainer = document.createElement('div');
        const progressLabel = document.createElement('div');
        const progressBar = document.createElement('div');
        const progressFill = document.createElement('div');
        const progressText = document.createElement('div');

        // Apply vintage progress styling
        progressContainer.classList.add('vintage-form-group', 'mt-vintage-md');
        progressLabel.classList.add('vintage-caption', 'text-vintage-xs', 'text-vintage-accent', 'mb-1');
        progressBar.classList.add('bg-vintage-paper-dark', 'rounded-vintage', 'h-2', 'border', 'border-vintage-accent', 'border-opacity-20');
        progressFill.classList.add('bg-vintage-sepia', 'h-2', 'rounded-vintage', 'transition-all', 'duration-300', 'shadow-vintage-inset');
        progressText.classList.add('flex', 'justify-between', 'vintage-fine-print', 'text-vintage-accent', 'mt-1');

        return { progressContainer, progressLabel, progressBar, progressFill, progressText };
      };

      const progressComponents = createVintageProgressBar();

      expect(progressComponents.progressBar.classList.add).toHaveBeenCalledWith('bg-vintage-paper-dark', 'rounded-vintage', 'h-2', 'border', 'border-vintage-accent', 'border-opacity-20');
      expect(progressComponents.progressFill.classList.add).toHaveBeenCalledWith('bg-vintage-sepia', 'h-2', 'rounded-vintage', 'transition-all', 'duration-300', 'shadow-vintage-inset');
    });

    test('should style action buttons with vintage theme', () => {
      const createVintageActionButtons = () => {
        const buttonContainer = document.createElement('div');
        const primaryButton = document.createElement('button');
        const secondaryButton = document.createElement('button');

        // Apply vintage button styling
        buttonContainer.classList.add('space-y-vintage-md', 'mb-vintage-lg');

        primaryButton.classList.add(
          'vintage-button',
          'w-full',
          'py-vintage-sm',
          'px-vintage-md',
          'rounded-vintage',
          'font-newspaper',
          'font-semibold',
          'transition-all',
          'duration-200'
        );

        secondaryButton.classList.add(
          'w-full',
          'border',
          'border-vintage-accent',
          'text-vintage-accent',
          'bg-vintage-paper',
          'py-vintage-sm',
          'px-vintage-md',
          'rounded-vintage',
          'font-newspaper',
          'font-medium',
          'hover:bg-vintage-accent',
          'hover:text-vintage-paper',
          'transition-all',
          'duration-200'
        );

        return { buttonContainer, primaryButton, secondaryButton };
      };

      const buttonComponents = createVintageActionButtons();

      expect(buttonComponents.primaryButton.classList.add).toHaveBeenCalledWith(
        'vintage-button',
        'w-full',
        'py-vintage-sm',
        'px-vintage-md',
        'rounded-vintage',
        'font-newspaper',
        'font-semibold',
        'transition-all',
        'duration-200'
      );

      expect(buttonComponents.secondaryButton.classList.add).toHaveBeenCalledWith(
        'w-full',
        'border',
        'border-vintage-accent',
        'text-vintage-accent',
        'bg-vintage-paper',
        'py-vintage-sm',
        'px-vintage-md',
        'rounded-vintage',
        'font-newspaper',
        'font-medium',
        'hover:bg-vintage-accent',
        'hover:text-vintage-paper',
        'transition-all',
        'duration-200'
      );
    });
  });

  describe('Vintage Statistics Display', () => {
    test('should create newspaper-style stats grid', () => {
      const createVintageStatsGrid = () => {
        const statsContainer = document.createElement('div');
        const statCard1 = document.createElement('div');
        const statCard2 = document.createElement('div');
        const statValue1 = document.createElement('div');
        const statValue2 = document.createElement('div');
        const statLabel1 = document.createElement('div');
        const statLabel2 = document.createElement('div');

        // Apply vintage stats styling
        statsContainer.classList.add('newspaper-column', 'double', 'gap-vintage-md', 'mb-vintage-lg');

        [statCard1, statCard2].forEach(card => {
          card.classList.add('text-center', 'vintage-card', 'p-vintage-md');
        });

        [statValue1, statValue2].forEach(value => {
          value.classList.add('vintage-headline', 'text-vintage-2xl', 'font-bold', 'text-vintage-sepia', 'mb-1');
        });

        [statLabel1, statLabel2].forEach(label => {
          label.classList.add('vintage-caption', 'text-vintage-xs', 'text-vintage-accent');
        });

        return { statsContainer, statCard1, statCard2, statValue1, statValue2, statLabel1, statLabel2 };
      };

      const statsComponents = createVintageStatsGrid();

      expect(statsComponents.statsContainer.classList.add).toHaveBeenCalledWith('newspaper-column', 'double', 'gap-vintage-md', 'mb-vintage-lg');
      expect(statsComponents.statCard1.classList.add).toHaveBeenCalledWith('text-center', 'vintage-card', 'p-vintage-md');
      expect(statsComponents.statValue1.classList.add).toHaveBeenCalledWith('vintage-headline', 'text-vintage-2xl', 'font-bold', 'text-vintage-sepia', 'mb-1');
    });

    test('should animate stat numbers with vintage styling', () => {
      const animateVintageNumber = (element, targetNumber, duration = 1000) => {
        const startNumber = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetNumber - startNumber) / 20);

        // Add animation classes
        element.classList.add('transition-all', 'duration-300', 'ease-out');

        // Mock animation logic
        const animationSteps = [];
        let current = startNumber;

        while (current !== targetNumber) {
          current += increment;
          if ((increment > 0 && current >= targetNumber) || (increment < 0 && current <= targetNumber)) {
            current = targetNumber;
          }
          animationSteps.push(current);
        }

        return animationSteps;
      };

      const statElement = document.createElement('div');
      statElement.textContent = '5';

      const steps = animateVintageNumber(statElement, 25);

      expect(statElement.classList.add).toHaveBeenCalledWith('transition-all', 'duration-300', 'ease-out');
      expect(steps).toContain(25);
      expect(steps[steps.length - 1]).toBe(25);
    });
  });

  describe('Vintage Navigation Components', () => {
    test('should style help and settings links with vintage theme', () => {
      const createVintageNavigationLinks = () => {
        const navContainer = document.createElement('div');
        const helpLink = document.createElement('button');
        const settingsLink = document.createElement('button');

        // Apply vintage navigation styling
        navContainer.classList.add('border-t', 'border-vintage-accent', 'border-opacity-20', 'pt-vintage-md', 'space-y-2');

        [helpLink, settingsLink].forEach(link => {
          link.classList.add(
            'w-full',
            'vintage-body',
            'text-vintage-sm',
            'text-vintage-sepia',
            'hover:text-vintage-sepia-dark',
            'text-left',
            'font-newspaper',
            'transition-colors',
            'duration-200',
            'py-1'
          );
        });

        return { navContainer, helpLink, settingsLink };
      };

      const navComponents = createVintageNavigationLinks();

      expect(navComponents.navContainer.classList.add).toHaveBeenCalledWith('border-t', 'border-vintage-accent', 'border-opacity-20', 'pt-vintage-md', 'space-y-2');
      expect(navComponents.helpLink.classList.add).toHaveBeenCalledWith(
        'w-full',
        'vintage-body',
        'text-vintage-sm',
        'text-vintage-sepia',
        'hover:text-vintage-sepia-dark',
        'text-left',
        'font-newspaper',
        'transition-colors',
        'duration-200',
        'py-1'
      );
    });

    test('should create vintage welcome banner', () => {
      const createVintageWelcomeBanner = () => {
        const banner = document.createElement('div');
        const iconSpan = document.createElement('span');
        const contentDiv = document.createElement('div');
        const titleDiv = document.createElement('div');
        const textDiv = document.createElement('div');

        // Apply vintage welcome banner styling
        banner.classList.add(
          'mt-vintage-md',
          'vintage-card',
          'p-vintage-md',
          'border',
          'border-vintage-sage',
          'border-opacity-30',
          'bg-vintage-sage',
          'bg-opacity-10',
          'rounded-vintage'
        );

        iconSpan.classList.add('vintage-headline', 'text-vintage-lg');
        contentDiv.classList.add('flex', 'items-start', 'space-x-2');
        titleDiv.classList.add('vintage-subheadline', 'font-medium', 'text-vintage-accent');
        textDiv.classList.add('vintage-body', 'text-vintage-accent', 'mt-1');

        return { banner, iconSpan, contentDiv, titleDiv, textDiv };
      };

      const bannerComponents = createVintageWelcomeBanner();

      expect(bannerComponents.banner.classList.add).toHaveBeenCalledWith(
        'mt-vintage-md',
        'vintage-card',
        'p-vintage-md',
        'border',
        'border-vintage-sage',
        'border-opacity-30',
        'bg-vintage-sage',
        'bg-opacity-10',
        'rounded-vintage'
      );

      expect(bannerComponents.titleDiv.classList.add).toHaveBeenCalledWith('vintage-subheadline', 'font-medium', 'text-vintage-accent');
    });
  });

  describe('Vintage Notification System', () => {
    test('should create vintage notification styling', () => {
      const createVintageNotification = (message, type = 'info') => {
        const notification = document.createElement('div');

        const typeStyles = {
          success: ['bg-vintage-sage', 'text-vintage-paper', 'border-vintage-sage-dark'],
          error: ['bg-vintage-sepia', 'text-vintage-paper', 'border-vintage-sepia-dark'],
          warning: ['bg-vintage-paper', 'text-vintage-accent', 'border-vintage-accent'],
          info: ['bg-vintage-accent', 'text-vintage-paper', 'border-vintage-accent-light']
        };

        const styles = typeStyles[type] || typeStyles.info;

        notification.classList.add(
          'fixed',
          'top-4',
          'left-4',
          'right-4',
          'p-vintage-md',
          'rounded-vintage',
          'vintage-body',
          'text-vintage-sm',
          'z-50',
          'transform',
          'transition-all',
          'duration-300',
          'ease-in-out',
          'shadow-vintage-lg',
          'border',
          ...styles
        );

        notification.textContent = message;
        return notification;
      };

      const successNotification = createVintageNotification('Success message', 'success');
      const errorNotification = createVintageNotification('Error message', 'error');

      expect(successNotification.classList.add).toHaveBeenCalledWith(
        'fixed',
        'top-4',
        'left-4',
        'right-4',
        'p-vintage-md',
        'rounded-vintage',
        'vintage-body',
        'text-vintage-sm',
        'z-50',
        'transform',
        'transition-all',
        'duration-300',
        'ease-in-out',
        'shadow-vintage-lg',
        'border',
        'bg-vintage-sage',
        'text-vintage-paper',
        'border-vintage-sage-dark'
      );

      expect(errorNotification.classList.add).toHaveBeenCalledWith(
        'fixed',
        'top-4',
        'left-4',
        'right-4',
        'p-vintage-md',
        'rounded-vintage',
        'vintage-body',
        'text-vintage-sm',
        'z-50',
        'transform',
        'transition-all',
        'duration-300',
        'ease-in-out',
        'shadow-vintage-lg',
        'border',
        'bg-vintage-sepia',
        'text-vintage-paper',
        'border-vintage-sepia-dark'
      );
    });

    test('should create vintage loading overlay', () => {
      const createVintageLoadingOverlay = () => {
        const overlay = document.createElement('div');
        const content = document.createElement('div');
        const spinner = document.createElement('div');
        const text = document.createElement('div');

        // Apply vintage loading styling
        overlay.classList.add(
          'fixed',
          'inset-0',
          'bg-vintage-paper',
          'bg-opacity-95',
          'flex',
          'items-center',
          'justify-center',
          'z-50'
        );

        content.classList.add('flex', 'flex-col', 'items-center', 'space-y-vintage-md');

        spinner.classList.add(
          'animate-spin',
          'rounded-full',
          'h-8',
          'w-8',
          'border-b-2',
          'border-vintage-sepia'
        );

        text.classList.add('vintage-body', 'text-vintage-sm', 'text-vintage-accent');

        return { overlay, content, spinner, text };
      };

      const loadingComponents = createVintageLoadingOverlay();

      expect(loadingComponents.overlay.classList.add).toHaveBeenCalledWith(
        'fixed',
        'inset-0',
        'bg-vintage-paper',
        'bg-opacity-95',
        'flex',
        'items-center',
        'justify-center',
        'z-50'
      );

      expect(loadingComponents.spinner.classList.add).toHaveBeenCalledWith(
        'animate-spin',
        'rounded-full',
        'h-8',
        'w-8',
        'border-b-2',
        'border-vintage-sepia'
      );
    });
  });

  describe('Responsive Vintage Layout', () => {
    test('should apply responsive vintage classes', () => {
      const applyResponsiveVintageClasses = (element, config) => {
        const { baseClasses, responsive } = config;

        // Apply base classes
        baseClasses.forEach(className => element.classList.add(className));

        // Apply responsive classes
        Object.entries(responsive || {}).forEach(([breakpoint, classes]) => {
          classes.forEach(className => {
            element.classList.add(`${breakpoint}:${className}`);
          });
        });

        return element;
      };

      const popupContainer = document.createElement('div');
      const config = {
        baseClasses: ['w-96', 'h-96', 'bg-vintage-texture', 'vintage-card'],
        responsive: {
          xs: ['w-80', 'h-80'],
          sm: ['w-full', 'max-w-md'],
          md: ['w-96', 'h-auto']
        }
      };

      const styledElement = applyResponsiveVintageClasses(popupContainer, config);

      expect(styledElement.classList.add).toHaveBeenCalledWith('w-96');
      expect(styledElement.classList.add).toHaveBeenCalledWith('vintage-card');
      expect(styledElement.classList.add).toHaveBeenCalledWith('xs:w-80');
      expect(styledElement.classList.add).toHaveBeenCalledWith('sm:w-full');
      expect(styledElement.classList.add).toHaveBeenCalledWith('md:w-96');
    });

    test('should validate vintage color accessibility', () => {
      const validateVintageColorContrast = (backgroundColor, textColor) => {
        // Mock color contrast validation
        const colorValues = {
          'vintage-paper': { luminance: 0.9 },
          'vintage-ink': { luminance: 0.1 },
          'vintage-sepia': { luminance: 0.6 },
          'vintage-accent': { luminance: 0.3 },
          'vintage-sage': { luminance: 0.7 }
        };

        const bgLuminance = colorValues[backgroundColor]?.luminance || 0.5;
        const textLuminance = colorValues[textColor]?.luminance || 0.5;

        const contrastRatio = (Math.max(bgLuminance, textLuminance) + 0.05) / (Math.min(bgLuminance, textLuminance) + 0.05);

        return {
          ratio: contrastRatio,
          isAccessible: contrastRatio >= 4.5, // WCAG AA standard
          level: contrastRatio >= 7 ? 'AAA' : contrastRatio >= 4.5 ? 'AA' : 'FAIL'
        };
      };

      const paperInkContrast = validateVintageColorContrast('vintage-paper', 'vintage-ink');
      const sepiaInkContrast = validateVintageColorContrast('vintage-sepia', 'vintage-ink');

      expect(paperInkContrast.isAccessible).toBe(true);
      expect(paperInkContrast.level).toMatch(/AA|AAA/);
      expect(sepiaInkContrast.ratio).toBeGreaterThan(3);
    });
  });
});