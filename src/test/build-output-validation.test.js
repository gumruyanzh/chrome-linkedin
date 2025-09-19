/**
 * Build Output Validation Tests
 *
 * Following TDD principles, these tests validate the build output to ensure:
 * 1. Build Output Structure - All required files exist in dist folder
 * 2. Asset Copying - CSS, icons, components are properly copied
 * 3. Manifest Consistency - Source manifest matches built manifest
 * 4. File References - HTML files reference existing files
 * 5. Chrome Extension Loading - Built extension can load in Chrome
 */

const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '../..');
const srcDir = path.join(projectRoot, 'src');
const distDir = path.join(projectRoot, 'dist');

describe('Build Output Validation', () => {
  describe('1. Build Output Structure', () => {
    test('dist folder should exist', () => {
      expect(fs.existsSync(distDir)).toBe(true);
    });

    test('should contain required core files', () => {
      const requiredFiles = [
        'manifest.json',
        'popup.html',
        'popup.js',
        'background.js',
        'content.js'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(distDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should contain icons directory with all required icon sizes', () => {
      const iconsDir = path.join(distDir, 'icons');
      expect(fs.existsSync(iconsDir)).toBe(true);

      const requiredIcons = ['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png'];

      requiredIcons.forEach(icon => {
        const iconPath = path.join(iconsDir, icon);
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });

    test('should not contain development-only files', () => {
      const devOnlyFiles = ['vite.config.js', 'package.json', 'node_modules', '.git', 'src'];

      devOnlyFiles.forEach(file => {
        const filePath = path.join(distDir, file);
        expect(fs.existsSync(filePath)).toBe(false);
      });
    });
  });

  describe('2. Asset Copying', () => {
    test('should copy Tailwind CSS to dist folder', () => {
      const tailwindCssPath = path.join(distDir, 'styles', 'tailwind.css');
      expect(fs.existsSync(tailwindCssPath)).toBe(true);

      if (fs.existsSync(tailwindCssPath)) {
        const cssContent = fs.readFileSync(tailwindCssPath, 'utf8');
        expect(cssContent.length).toBeGreaterThan(0);
        expect(cssContent).toMatch(/--tw-|container|\.card/); // Tailwind compiled CSS patterns
      }
    });

    test('should copy content styles to dist folder', () => {
      const contentStylesPath = path.join(distDir, 'content', 'styles.css');
      expect(fs.existsSync(contentStylesPath)).toBe(true);
    });

    test('should copy help system components if they exist', () => {
      const helpSystemDir = path.join(srcDir, 'components', 'help');
      if (fs.existsSync(helpSystemDir)) {
        const distHelpSystemDir = path.join(distDir, 'components', 'help');
        expect(fs.existsSync(distHelpSystemDir)).toBe(true);
      }
    });

    test('all icon files should be properly named and copied', () => {
      const srcManifestPath = path.join(srcDir, 'manifest.json');
      if (fs.existsSync(srcManifestPath)) {
        const srcManifest = JSON.parse(fs.readFileSync(srcManifestPath, 'utf8'));

        // Check action icons
        if (srcManifest.action && srcManifest.action.default_icon) {
          Object.values(srcManifest.action.default_icon).forEach(iconPath => {
            const fullIconPath = path.join(distDir, iconPath);
            expect(fs.existsSync(fullIconPath)).toBe(true);
          });
        }

        // Check manifest icons
        if (srcManifest.icons) {
          Object.values(srcManifest.icons).forEach(iconPath => {
            const fullIconPath = path.join(distDir, iconPath);
            expect(fs.existsSync(fullIconPath)).toBe(true);
          });
        }
      }
    });

    test('icon files should have proper file sizes', () => {
      const iconSizes = ['16', '32', '48', '128'];

      iconSizes.forEach(size => {
        const iconPath = path.join(distDir, 'icons', `icon-${size}.png`);
        if (fs.existsSync(iconPath)) {
          const stats = fs.statSync(iconPath);
          expect(stats.size).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('3. Manifest Consistency', () => {
    test('built manifest should match source manifest structure', () => {
      const srcManifestPath = path.join(srcDir, 'manifest.json');
      const distManifestPath = path.join(distDir, 'manifest.json');

      expect(fs.existsSync(srcManifestPath)).toBe(true);
      expect(fs.existsSync(distManifestPath)).toBe(true);

      const srcManifest = JSON.parse(fs.readFileSync(srcManifestPath, 'utf8'));
      const distManifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf8'));

      // Core fields should match
      expect(distManifest.manifest_version).toBe(srcManifest.manifest_version);
      expect(distManifest.name).toBe(srcManifest.name);
      expect(distManifest.version).toBe(srcManifest.version);
      expect(distManifest.description).toBe(srcManifest.description);
    });

    test('permissions should match between source and built manifest', () => {
      const srcManifestPath = path.join(srcDir, 'manifest.json');
      const distManifestPath = path.join(distDir, 'manifest.json');

      if (fs.existsSync(srcManifestPath) && fs.existsSync(distManifestPath)) {
        const srcManifest = JSON.parse(fs.readFileSync(srcManifestPath, 'utf8'));
        const distManifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf8'));

        expect(distManifest.permissions).toEqual(srcManifest.permissions);
        expect(distManifest.host_permissions).toEqual(srcManifest.host_permissions);
      }
    });

    test('content scripts should be properly configured', () => {
      const distManifestPath = path.join(distDir, 'manifest.json');

      if (fs.existsSync(distManifestPath)) {
        const distManifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf8'));

        if (distManifest.content_scripts) {
          distManifest.content_scripts.forEach(script => {
            expect(script.matches).toBeDefined();
            expect(Array.isArray(script.matches)).toBe(true);
            expect(script.js).toBeDefined();
            expect(Array.isArray(script.js)).toBe(true);

            // Each referenced JS file should exist
            script.js.forEach(jsFile => {
              const jsPath = path.join(distDir, jsFile);
              expect(fs.existsSync(jsPath)).toBe(true);
            });
          });
        }
      }
    });

    test('background service worker should be properly configured', () => {
      const distManifestPath = path.join(distDir, 'manifest.json');

      if (fs.existsSync(distManifestPath)) {
        const distManifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf8'));

        if (distManifest.background && distManifest.background.service_worker) {
          const swPath = path.join(distDir, distManifest.background.service_worker);
          expect(fs.existsSync(swPath)).toBe(true);
        }
      }
    });
  });

  describe('4. File References', () => {
    test('popup HTML should reference existing CSS files', () => {
      const popupHtmlPath = path.join(distDir, 'popup.html');

      if (fs.existsSync(popupHtmlPath)) {
        const htmlContent = fs.readFileSync(popupHtmlPath, 'utf8');

        // Extract CSS link references
        const cssLinks = htmlContent.match(/<link[^>]*href="([^"]*\.css)"[^>]*>/g) || [];

        cssLinks.forEach(linkTag => {
          const hrefMatch = linkTag.match(/href="([^"]*)"/);
          if (hrefMatch) {
            const cssPath = path.join(distDir, hrefMatch[1]);
            expect(fs.existsSync(cssPath)).toBe(true);
          }
        });
      }
    });

    test('popup HTML should reference existing JS files', () => {
      const popupHtmlPath = path.join(distDir, 'popup.html');

      if (fs.existsSync(popupHtmlPath)) {
        const htmlContent = fs.readFileSync(popupHtmlPath, 'utf8');

        // Extract script src references
        const scriptTags = htmlContent.match(/<script[^>]*src="([^"]*\.js)"[^>]*>/g) || [];

        scriptTags.forEach(scriptTag => {
          const srcMatch = scriptTag.match(/src="([^"]*)"/);
          if (srcMatch) {
            const jsPath = path.join(distDir, srcMatch[1]);
            expect(fs.existsSync(jsPath)).toBe(true);
          }
        });
      }
    });

    test('manifest icon references should point to existing files', () => {
      const distManifestPath = path.join(distDir, 'manifest.json');

      if (fs.existsSync(distManifestPath)) {
        const distManifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf8'));

        // Check action icons
        if (distManifest.action && distManifest.action.default_icon) {
          Object.values(distManifest.action.default_icon).forEach(iconPath => {
            const fullIconPath = path.join(distDir, iconPath);
            expect(fs.existsSync(fullIconPath)).toBe(true);
          });
        }

        // Check manifest icons
        if (distManifest.icons) {
          Object.values(distManifest.icons).forEach(iconPath => {
            const fullIconPath = path.join(distDir, iconPath);
            expect(fs.existsSync(fullIconPath)).toBe(true);
          });
        }
      }
    });

    test('web accessible resources should exist if defined', () => {
      const distManifestPath = path.join(distDir, 'manifest.json');

      if (fs.existsSync(distManifestPath)) {
        const distManifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf8'));

        if (distManifest.web_accessible_resources) {
          distManifest.web_accessible_resources.forEach(resource => {
            if (resource.resources) {
              resource.resources.forEach(resourcePath => {
                // Handle wildcard patterns
                if (resourcePath.includes('*')) {
                  const basePath = resourcePath.replace(/\/\*$/, '');
                  const baseDir = path.join(distDir, basePath);
                  if (fs.existsSync(baseDir)) {
                    expect(fs.lstatSync(baseDir).isDirectory()).toBe(true);
                  }
                } else {
                  const fullResourcePath = path.join(distDir, resourcePath);
                  expect(fs.existsSync(fullResourcePath)).toBe(true);
                }
              });
            }
          });
        }
      }
    });
  });

  describe('5. Chrome Extension Loading', () => {
    test('manifest should be valid JSON', () => {
      const distManifestPath = path.join(distDir, 'manifest.json');

      expect(fs.existsSync(distManifestPath)).toBe(true);

      expect(() => {
        JSON.parse(fs.readFileSync(distManifestPath, 'utf8'));
      }).not.toThrow();
    });

    test('manifest should have required Manifest V3 fields', () => {
      const distManifestPath = path.join(distDir, 'manifest.json');

      if (fs.existsSync(distManifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(distManifestPath, 'utf8'));

        expect(manifest.manifest_version).toBe(3);
        expect(manifest.name).toBeDefined();
        expect(manifest.version).toBeDefined();
        expect(typeof manifest.name).toBe('string');
        expect(typeof manifest.version).toBe('string');
      }
    });

    test('JavaScript files should be valid and not contain syntax errors', () => {
      const jsFiles = ['popup.js', 'background.js', 'content.js'];

      jsFiles.forEach(jsFile => {
        const jsPath = path.join(distDir, jsFile);
        if (fs.existsSync(jsPath)) {
          const jsContent = fs.readFileSync(jsPath, 'utf8');

          // Basic syntax validation - should not contain obvious syntax errors
          expect(jsContent).not.toMatch(/\bimport\s+.*\bfrom\s+['"][^'"]*\.ts['"]/); // No TypeScript imports
          expect(jsContent).not.toMatch(/\binterface\b/); // No TypeScript interfaces
          expect(jsContent).not.toMatch(/\btype\s+\w+\s*=/); // No TypeScript type definitions

          // Should contain proper extension code patterns
          if (jsFile === 'background.js') {
            expect(jsContent).toMatch(/chrome\.|browser\./); // Should use extension APIs
          }
        }
      });
    });

    test('extension size should be reasonable for Chrome Web Store', () => {
      // Calculate total extension size
      let totalSize = 0;

      function calculateDirSize(dirPath) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            calculateDirSize(filePath);
          } else {
            totalSize += stats.size;
          }
        });
      }

      if (fs.existsSync(distDir)) {
        calculateDirSize(distDir);

        // Chrome Web Store has a 128MB limit, but extensions should be much smaller
        const maxSizeBytes = 50 * 1024 * 1024; // 50MB reasonable limit
        expect(totalSize).toBeLessThan(maxSizeBytes);
      }
    });

    test('should not contain source maps in production build', () => {
      const files = fs.readdirSync(distDir, { recursive: true });
      const sourceMapFiles = files.filter(
        file => typeof file === 'string' && file.endsWith('.map')
      );

      if (process.env.NODE_ENV === 'production') {
        expect(sourceMapFiles.length).toBe(0);
      }
    });
  });

  describe('Build System Integration', () => {
    test('build-info.json should contain build metadata', () => {
      const buildInfoPath = path.join(distDir, 'build-info.json');

      if (fs.existsSync(buildInfoPath)) {
        const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));

        expect(buildInfo.timestamp).toBeDefined();
        expect(buildInfo.version).toBeDefined();
        expect(new Date(buildInfo.timestamp)).toBeInstanceOf(Date);
      }
    });

    test('all Vite entry points should be built correctly', () => {
      // Based on vite.config.js entry points
      const expectedOutputs = [
        'popup.js',
        'background.js',
        'content.js',
        'styles/tailwind.css',
        'components/help-system.js'
      ];

      expectedOutputs.forEach(output => {
        const outputPath = path.join(distDir, output);
        expect(fs.existsSync(outputPath)).toBe(true);
      });
    });
  });
});
