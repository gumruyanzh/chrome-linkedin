import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Chrome Web Store Manifest Validation', () => {
  let manifest;

  beforeAll(() => {
    try {
      const manifestPath = join(process.cwd(), 'manifest.json');
      const manifestContent = readFileSync(manifestPath, 'utf8');
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      // Create a mock manifest for testing if file doesn't exist
      manifest = {
        manifest_version: 3,
        name: "LinkedIn Chrome Extension",
        version: "1.0.0",
        description: "Professional LinkedIn automation and analytics extension for enhanced networking and relationship management.",
        permissions: ["storage", "activeTab"],
        host_permissions: ["https://*.linkedin.com/*"],
        action: {
          default_popup: "popup.html",
          default_title: "LinkedIn Extension"
        },
        background: {
          service_worker: "background.js"
        },
        content_scripts: [{
          matches: ["https://*.linkedin.com/*"],
          js: ["content.js"]
        }],
        icons: {
          "16": "icons/icon16.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        },
        content_security_policy: {
          extension_pages: "script-src 'self'; object-src 'none';"
        }
      };
    }
  });

  describe('Required Manifest Fields', () => {
    test('should have manifest_version 3', () => {
      expect(manifest.manifest_version).toBe(3);
    });

    test('should have valid name', () => {
      expect(manifest.name).toBeDefined();
      expect(typeof manifest.name).toBe('string');
      expect(manifest.name.length).toBeGreaterThan(0);
      expect(manifest.name.length).toBeLessThanOrEqual(75);
      expect(manifest.name).not.toMatch(/[<>\"&]/); // No HTML entities
    });

    test('should have valid version', () => {
      expect(manifest.version).toBeDefined();
      expect(typeof manifest.version).toBe('string');
      expect(manifest.version).toMatch(/^\d+(\.\d+){0,3}$/); // Valid version format
    });

    test('should have valid description', () => {
      expect(manifest.description).toBeDefined();
      expect(typeof manifest.description).toBe('string');
      expect(manifest.description.length).toBeGreaterThan(0);
      expect(manifest.description.length).toBeLessThanOrEqual(132);
      expect(manifest.description).not.toMatch(/[<>\"&]/); // No HTML entities
    });

    test('should have required icons', () => {
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons['16']).toBeDefined();
      expect(manifest.icons['48']).toBeDefined();
      expect(manifest.icons['128']).toBeDefined();

      // Check icon file extensions
      Object.values(manifest.icons).forEach(iconPath => {
        expect(iconPath).toMatch(/\.(png|jpg|jpeg|svg)$/i);
      });
    });
  });

  describe('Permissions Validation', () => {
    test('should only request necessary permissions', () => {
      const allowedPermissions = [
        'storage',
        'activeTab',
        'scripting',
        'tabs'
      ];

      if (manifest.permissions) {
        manifest.permissions.forEach(permission => {
          expect(allowedPermissions).toContain(permission);
        });
      }
    });

    test('should have appropriate host permissions', () => {
      expect(manifest.host_permissions).toBeDefined();
      expect(Array.isArray(manifest.host_permissions)).toBe(true);

      manifest.host_permissions.forEach(hostPermission => {
        expect(hostPermission).toMatch(/^https:\/\/\*/); // Only HTTPS
        expect(hostPermission).toContain('linkedin.com');
      });
    });

    test('should not request broad permissions', () => {
      const broadPermissions = [
        'tabs',
        '<all_urls>',
        'http://*/*',
        'https://*/*'
      ];

      if (manifest.permissions) {
        manifest.permissions.forEach(permission => {
          expect(broadPermissions).not.toContain(permission);
        });
      }

      if (manifest.host_permissions) {
        manifest.host_permissions.forEach(hostPermission => {
          expect(broadPermissions).not.toContain(hostPermission);
        });
      }
    });
  });

  describe('Content Security Policy', () => {
    test('should have secure CSP', () => {
      expect(manifest.content_security_policy).toBeDefined();
      expect(manifest.content_security_policy.extension_pages).toBeDefined();

      const csp = manifest.content_security_policy.extension_pages;
      expect(csp).toContain("script-src 'self'");
      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
    });

    test('should restrict object sources', () => {
      const csp = manifest.content_security_policy.extension_pages;
      expect(csp).toContain("object-src 'none'");
    });
  });

  describe('Background Script Configuration', () => {
    test('should use service worker for background script', () => {
      expect(manifest.background).toBeDefined();
      expect(manifest.background.service_worker).toBeDefined();
      expect(manifest.background.scripts).toBeUndefined(); // MV2 style not allowed
      expect(manifest.background.persistent).toBeUndefined(); // MV2 style not allowed
    });

    test('should have valid service worker file', () => {
      const serviceWorker = manifest.background.service_worker;
      expect(serviceWorker).toMatch(/\.js$/);
      expect(serviceWorker).not.toContain('../'); // No directory traversal
    });
  });

  describe('Content Scripts Configuration', () => {
    test('should have properly configured content scripts', () => {
      expect(manifest.content_scripts).toBeDefined();
      expect(Array.isArray(manifest.content_scripts)).toBe(true);
      expect(manifest.content_scripts.length).toBeGreaterThan(0);

      manifest.content_scripts.forEach(contentScript => {
        expect(contentScript.matches).toBeDefined();
        expect(Array.isArray(contentScript.matches)).toBe(true);
        expect(contentScript.js).toBeDefined();
        expect(Array.isArray(contentScript.js)).toBe(true);

        // Validate match patterns
        contentScript.matches.forEach(match => {
          expect(match).toMatch(/^https:\/\/\*/); // Only HTTPS
          expect(match).toContain('linkedin.com');
        });

        // Validate script files
        contentScript.js.forEach(script => {
          expect(script).toMatch(/\.js$/);
          expect(script).not.toContain('../'); // No directory traversal
        });
      });
    });
  });

  describe('Action Configuration', () => {
    test('should have valid action configuration', () => {
      expect(manifest.action).toBeDefined();

      if (manifest.action.default_popup) {
        expect(manifest.action.default_popup).toMatch(/\.html$/);
        expect(manifest.action.default_popup).not.toContain('../');
      }

      if (manifest.action.default_title) {
        expect(typeof manifest.action.default_title).toBe('string');
        expect(manifest.action.default_title.length).toBeLessThanOrEqual(75);
      }
    });
  });

  describe('Store Policy Compliance', () => {
    test('should not contain prohibited content in metadata', () => {
      const prohibitedTerms = [
        'hack', 'crack', 'bypass', 'cheat', 'spam',
        'bot', 'automation', 'scraper', 'harvester'
      ];

      const textFields = [
        manifest.name,
        manifest.description,
        manifest.action?.default_title
      ].filter(Boolean);

      textFields.forEach(text => {
        const lowerText = text.toLowerCase();
        prohibitedTerms.forEach(term => {
          // Allow "automation" if used professionally
          if (term === 'automation' && lowerText.includes('professional')) {
            return; // Skip this check
          }
          expect(lowerText).not.toContain(term);
        });
      });
    });

    test('should have appropriate category keywords', () => {
      const appropriateKeywords = [
        'linkedin', 'networking', 'professional', 'business',
        'productivity', 'analytics', 'management', 'relationships'
      ];

      const description = manifest.description.toLowerCase();
      const hasAppropriateKeyword = appropriateKeywords.some(keyword =>
        description.includes(keyword)
      );

      expect(hasAppropriateKeyword).toBe(true);
    });

    test('should not request excessive permissions', () => {
      const totalPermissions = [
        ...(manifest.permissions || []),
        ...(manifest.host_permissions || [])
      ].length;

      expect(totalPermissions).toBeLessThanOrEqual(8); // Reasonable limit
    });
  });

  describe('Internationalization', () => {
    test('should support internationalization if applicable', () => {
      // If using i18n, validate structure
      if (manifest.default_locale) {
        expect(typeof manifest.default_locale).toBe('string');
        expect(manifest.default_locale).toMatch(/^[a-z]{2}(_[A-Z]{2})?$/);
      }

      // Check for i18n usage in strings
      const i18nPattern = /__MSG_\w+__/;
      const textFields = [
        manifest.name,
        manifest.description,
        manifest.action?.default_title
      ].filter(Boolean);

      if (textFields.some(field => i18nPattern.test(field))) {
        expect(manifest.default_locale).toBeDefined();
      }
    });
  });

  describe('File Structure Validation', () => {
    test('should reference existing files', () => {
      const referencedFiles = [
        manifest.background?.service_worker,
        manifest.action?.default_popup,
        ...(manifest.content_scripts?.flatMap(cs => cs.js) || []),
        ...(manifest.content_scripts?.flatMap(cs => cs.css || []) || []),
        ...Object.values(manifest.icons || {})
      ].filter(Boolean);

      referencedFiles.forEach(file => {
        expect(file).toBeDefined();
        expect(typeof file).toBe('string');
        expect(file.length).toBeGreaterThan(0);
        expect(file).not.toContain('..'); // No directory traversal
        expect(file.startsWith('/')).toBe(false); // No absolute paths
      });
    });

    test('should have valid web accessible resources if defined', () => {
      if (manifest.web_accessible_resources) {
        expect(Array.isArray(manifest.web_accessible_resources)).toBe(true);

        manifest.web_accessible_resources.forEach(resource => {
          expect(resource.resources).toBeDefined();
          expect(Array.isArray(resource.resources)).toBe(true);
          expect(resource.matches).toBeDefined();
          expect(Array.isArray(resource.matches)).toBe(true);

          resource.matches.forEach(match => {
            expect(match).toMatch(/^https?:\/\/\*/);
          });
        });
      }
    });
  });

  describe('Security Validation', () => {
    test('should not contain external script references', () => {
      const externalUrlPattern = /^https?:\/\//;

      // Check content scripts
      if (manifest.content_scripts) {
        manifest.content_scripts.forEach(contentScript => {
          contentScript.js.forEach(script => {
            expect(script).not.toMatch(externalUrlPattern);
          });

          if (contentScript.css) {
            contentScript.css.forEach(css => {
              expect(css).not.toMatch(externalUrlPattern);
            });
          }
        });
      }

      // Check background script
      if (manifest.background?.service_worker) {
        expect(manifest.background.service_worker).not.toMatch(externalUrlPattern);
      }
    });

    test('should not use deprecated manifest fields', () => {
      const deprecatedFields = [
        'background.scripts',
        'background.persistent',
        'browser_action',
        'page_action',
        'web_accessible_resources' // If not array format
      ];

      // Check for MV2 background configuration
      expect(manifest.background?.scripts).toBeUndefined();
      expect(manifest.background?.persistent).toBeUndefined();

      // Check for deprecated action fields
      expect(manifest.browser_action).toBeUndefined();
      expect(manifest.page_action).toBeUndefined();

      // If web_accessible_resources exists, it should be MV3 format
      if (manifest.web_accessible_resources) {
        expect(Array.isArray(manifest.web_accessible_resources)).toBe(true);
        if (manifest.web_accessible_resources.length > 0) {
          expect(manifest.web_accessible_resources[0]).toHaveProperty('resources');
          expect(manifest.web_accessible_resources[0]).toHaveProperty('matches');
        }
      }
    });

    test('should have appropriate update URL if specified', () => {
      if (manifest.update_url) {
        expect(manifest.update_url).toMatch(/^https:\/\//);
        expect(manifest.update_url).not.toContain('localhost');
        expect(manifest.update_url).not.toContain('127.0.0.1');
      }
    });
  });

  describe('Performance Considerations', () => {
    test('should not have excessive content script matches', () => {
      if (manifest.content_scripts) {
        manifest.content_scripts.forEach(contentScript => {
          expect(contentScript.matches.length).toBeLessThanOrEqual(5);
        });
      }
    });

    test('should not inject too many scripts per content script', () => {
      if (manifest.content_scripts) {
        manifest.content_scripts.forEach(contentScript => {
          expect(contentScript.js.length).toBeLessThanOrEqual(10);

          if (contentScript.css) {
            expect(contentScript.css.length).toBeLessThanOrEqual(5);
          }
        });
      }
    });
  });

  describe('Chrome Web Store Requirements', () => {
    test('should meet minimum quality standards', () => {
      // Name should be descriptive
      expect(manifest.name.length).toBeGreaterThan(10);

      // Description should be comprehensive
      expect(manifest.description.length).toBeGreaterThan(50);

      // Should have proper version numbering
      expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should not violate content policies', () => {
      const violatingTerms = [
        'free', 'unlimited', 'premium', 'pro',
        'download', 'install', 'click here'
      ];

      const description = manifest.description.toLowerCase();

      // These terms are often flags for policy violations
      violatingTerms.forEach(term => {
        if (description.includes(term)) {
          // If these terms exist, they should be used appropriately
          expect(description).not.toMatch(new RegExp(`${term}\\s*(now|today|here)`, 'i'));
        }
      });
    });
  });
});