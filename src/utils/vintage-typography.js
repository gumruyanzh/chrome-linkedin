/**
 * Vintage Typography Utilities
 * JavaScript utilities for newspaper-inspired typography system
 */

/**
 * Typography scale configuration
 */
export const TYPOGRAPHY_SCALE = {
  sizes: {
    'vintage-xs': { fontSize: '10px', lineHeight: '1.4' },
    'vintage-sm': { fontSize: '12px', lineHeight: '1.4' },
    'vintage-base': { fontSize: '14px', lineHeight: '1.6' },
    'vintage-lg': { fontSize: '16px', lineHeight: '1.5' },
    'vintage-xl': { fontSize: '18px', lineHeight: '1.3' },
    'vintage-2xl': { fontSize: '20px', lineHeight: '1.3' },
    'vintage-3xl': { fontSize: '24px', lineHeight: '1.2' },
    'vintage-4xl': { fontSize: '28px', lineHeight: '1.1' }
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },

  families: {
    newspaper: '"Crimson Text", Georgia, "Times New Roman", Times, serif',
    serif: 'Georgia, "Times New Roman", Times, serif',
    fallback: 'Georgia, "Times New Roman", Times, serif'
  }
};

/**
 * Newspaper typography classes and their configurations
 */
export const TYPOGRAPHY_CLASSES = {
  headline: {
    className: 'vintage-headline',
    fontSize: 'vintage-3xl',
    fontWeight: 'bold',
    lineHeight: '1.2',
    marginBottom: '16px',
    color: 'vintage-ink'
  },

  subheadline: {
    className: 'vintage-subheadline',
    fontSize: 'vintage-xl',
    fontWeight: 'semibold',
    lineHeight: '1.3',
    marginBottom: '12px',
    color: 'vintage-ink'
  },

  body: {
    className: 'vintage-body',
    fontSize: 'vintage-base',
    fontWeight: 'normal',
    lineHeight: '1.6',
    marginBottom: '8px',
    color: 'vintage-ink'
  },

  caption: {
    className: 'vintage-caption',
    fontSize: 'vintage-sm',
    fontWeight: 'normal',
    lineHeight: '1.4',
    fontStyle: 'italic',
    color: 'vintage-accent'
  },

  finePrint: {
    className: 'vintage-fine-print',
    fontSize: 'vintage-xs',
    fontWeight: 'normal',
    lineHeight: '1.4',
    color: 'vintage-ink-light'
  }
};

/**
 * Typography utility functions
 */
export class VintageTypography {
  /**
   * Apply vintage typography classes to an element
   * @param {HTMLElement} element - The target element
   * @param {string} typeClass - Typography class name (headline, body, etc.)
   * @param {Object} options - Additional options
   */
  static applyTypography(element, typeClass, options = {}) {
    if (!element || !TYPOGRAPHY_CLASSES[typeClass]) {
      console.warn('Invalid element or typography class');
      return false;
    }

    const config = TYPOGRAPHY_CLASSES[typeClass];
    const { size, weight, variant } = options;

    // Add base class
    element.classList.add('vintage-text', config.className);

    // Add size variant if specified
    if (size) {
      element.classList.add(size);
    }

    // Add weight variant if specified
    if (weight) {
      element.classList.add(`font-${weight}`);
    }

    // Add variant if specified
    if (variant) {
      element.classList.add(variant);
    }

    return true;
  }

  /**
   * Create a styled typography element
   * @param {string} tagName - HTML tag name
   * @param {string} typeClass - Typography class name
   * @param {string} content - Text content
   * @param {Object} options - Additional options
   * @returns {HTMLElement} - Styled element
   */
  static createElement(tagName, typeClass, content, options = {}) {
    const element = document.createElement(tagName);
    element.textContent = content;

    this.applyTypography(element, typeClass, options);

    return element;
  }

  /**
   * Generate CSS classes string for Tailwind
   * @param {string} typeClass - Typography class name
   * @param {Object} options - Additional options
   * @returns {string} - CSS classes string
   */
  static getClasses(typeClass, options = {}) {
    if (!TYPOGRAPHY_CLASSES[typeClass]) {
      return 'vintage-text';
    }

    const config = TYPOGRAPHY_CLASSES[typeClass];
    const { size, weight, variant, responsive } = options;

    let classes = ['vintage-text', config.className];

    // Add size classes
    if (size) {
      classes.push(`text-${size}`);
    } else {
      classes.push(`text-${config.fontSize}`);
    }

    // Add weight classes
    if (weight) {
      classes.push(`font-${weight}`);
    } else {
      classes.push(`font-${config.fontWeight}`);
    }

    // Add color classes
    classes.push(`text-${config.color}`);

    // Add responsive classes
    if (responsive) {
      Object.entries(responsive).forEach(([breakpoint, responsiveSize]) => {
        classes.push(`${breakpoint}:text-${responsiveSize}`);
      });
    }

    // Add variant classes
    if (variant) {
      classes.push(variant);
    }

    return classes.join(' ');
  }

  /**
   * Calculate responsive font sizes
   * @param {string} baseSize - Base font size
   * @param {Object} breakpoints - Breakpoint configurations
   * @returns {Object} - Responsive size configuration
   */
  static getResponsiveSizes(baseSize, breakpoints = {}) {
    const defaultBreakpoints = {
      xs: 0.8,
      sm: 0.9,
      md: 1.0,
      lg: 1.1,
      xl: 1.2
    };

    const scale = { ...defaultBreakpoints, ...breakpoints };
    const baseSizeNum = parseInt(TYPOGRAPHY_SCALE.sizes[baseSize]?.fontSize || '14px');

    const responsiveSizes = {};
    Object.entries(scale).forEach(([breakpoint, multiplier]) => {
      responsiveSizes[breakpoint] = `${Math.round(baseSizeNum * multiplier)}px`;
    });

    return responsiveSizes;
  }

  /**
   * Check if font loading is supported and load fonts
   * @returns {Promise<boolean>} - Font loading status
   */
  static async loadFonts() {
    if (!('fonts' in document)) {
      console.warn('Font loading API not supported');
      return false;
    }

    try {
      // Load primary newspaper font
      const crimsonText = new FontFace(
        'Crimson Text',
        'url(https://fonts.gstatic.com/s/crimsontext/v19/wlp2gwHKFkZgtmSR-QAkk.woff2)'
      );

      await crimsonText.load();
      document.fonts.add(crimsonText);

      // Verify font is loaded
      return document.fonts.check('16px "Crimson Text"');
    } catch (error) {
      console.warn('Failed to load newspaper fonts:', error);
      return false;
    }
  }

  /**
   * Get optimal line height for given font size
   * @param {string} fontSize - Font size (px or rem)
   * @returns {string} - Optimal line height
   */
  static getOptimalLineHeight(fontSize) {
    const sizeNum = parseInt(fontSize);

    if (sizeNum >= 24) return '1.2';
    if (sizeNum >= 18) return '1.3';
    if (sizeNum >= 16) return '1.4';
    if (sizeNum >= 14) return '1.6';
    return '1.6';
  }

  /**
   * Apply newspaper-style drop cap to first letter
   * @param {HTMLElement} element - Target paragraph element
   */
  static applyDropCap(element) {
    if (!element || element.tagName !== 'P') {
      console.warn('Drop cap can only be applied to paragraph elements');
      return false;
    }

    element.classList.add('vintage-drop-cap');
    return true;
  }

  /**
   * Format text with newspaper-style line breaks and spacing
   * @param {string} text - Input text
   * @param {number} maxLineLength - Maximum characters per line
   * @returns {string} - Formatted text
   */
  static formatNewspaperText(text, maxLineLength = 60) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLineLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines.join('\n');
  }

  /**
   * Get typography configuration for specific element type
   * @param {string} elementType - Type of element (button, input, etc.)
   * @returns {Object} - Typography configuration
   */
  static getElementTypography(elementType) {
    const configurations = {
      button: {
        fontSize: 'vintage-base',
        fontWeight: 'semibold',
        fontFamily: 'newspaper'
      },
      input: {
        fontSize: 'vintage-base',
        fontWeight: 'normal',
        fontFamily: 'newspaper'
      },
      label: {
        fontSize: 'vintage-sm',
        fontWeight: 'semibold',
        fontFamily: 'newspaper'
      },
      link: {
        fontSize: 'vintage-base',
        fontWeight: 'normal',
        fontFamily: 'newspaper',
        textDecoration: 'underline'
      }
    };

    return configurations[elementType] || configurations.button;
  }
}

/**
 * Initialize vintage typography system
 */
export function initializeVintageTypography() {
  // Load fonts asynchronously
  VintageTypography.loadFonts().then(loaded => {
    if (loaded) {
      console.log('Vintage typography fonts loaded successfully');
    } else {
      console.log('Using fallback fonts for vintage typography');
    }
  });

  // Add CSS custom properties to document root
  const root = document.documentElement;
  const style = root.style;

  // Apply typography CSS variables
  style.setProperty('--font-newspaper', TYPOGRAPHY_SCALE.families.newspaper);
  style.setProperty('--font-serif-fallback', TYPOGRAPHY_SCALE.families.fallback);

  return true;
}

export default VintageTypography;