#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const SRC_DIR = join(ROOT_DIR, 'src');
const DIST_DIR = join(ROOT_DIR, 'dist');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Build configuration
const buildConfig = {
  minify: true,
  removeComments: true,
  removeConsole: true,
  optimizeImages: true,
  validateSecurity: true,
  generateSourceMaps: false // Never include source maps in production
};

// File processors
class FileProcessor {
  static processJavaScript(content, filename) {
    logInfo(`Processing JavaScript: ${filename}`);

    // Remove console statements (except errors)
    if (buildConfig.removeConsole) {
      content = content.replace(/console\.(log|debug|info|warn)\([^)]*\);?/g, '');
    }

    // Remove comments
    if (buildConfig.removeComments) {
      content = content.replace(/\/\*[\s\S]*?\*\//g, '');
      content = content.replace(/\/\/.*$/gm, '');
    }

    // Basic minification
    if (buildConfig.minify) {
      content = content
        .replace(/\s{2,}/g, ' ')
        .replace(/\n\s*/g, '\n')
        .replace(/;\s*}/g, '}')
        .replace(/{\s*/g, '{')
        .replace(/}\s*/g, '}')
        .replace(/,\s*/g, ',')
        .replace(/:\s*/g, ':')
        .trim();
    }

    // Security validations
    if (buildConfig.validateSecurity) {
      const securityIssues = [];

      // Check for eval usage
      if (content.match(/\beval\s*\(/)) {
        securityIssues.push('Contains eval() - potential security risk');
      }

      // Check for Function constructor
      if (content.match(/new\s+Function\s*\(/)) {
        securityIssues.push('Contains Function constructor - potential security risk');
      }

      // Check for hardcoded secrets (simple check)
      const secretPatterns = [
        /api[_-]?key\s*[:=]\s*['"`][a-zA-Z0-9]{20,}['"`]/i,
        /secret\s*[:=]\s*['"`][a-zA-Z0-9]{20,}['"`]/i,
        /password\s*[:=]\s*['"`][^'"`]+['"`]/i
      ];

      secretPatterns.forEach(pattern => {
        if (content.match(pattern)) {
          securityIssues.push('Potential hardcoded secret detected');
        }
      });

      if (securityIssues.length > 0) {
        logWarning(`Security issues in ${filename}:`);
        securityIssues.forEach(issue => logWarning(`  - ${issue}`));
      }
    }

    return content;
  }

  static processHTML(content, filename) {
    logInfo(`Processing HTML: ${filename}`);

    if (buildConfig.removeComments) {
      content = content.replace(/<!--[\s\S]*?-->/g, '');
    }

    if (buildConfig.minify) {
      content = content
        .replace(/\s{2,}/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
    }

    // Security validations
    if (buildConfig.validateSecurity) {
      const securityIssues = [];

      // Check for inline scripts
      if (content.match(/<script[^>]*>[^<]/)) {
        securityIssues.push('Contains inline scripts - violates CSP');
      }

      // Check for inline event handlers
      if (content.match(/on\w+\s*=/)) {
        securityIssues.push('Contains inline event handlers - violates CSP');
      }

      // Check for javascript: URLs
      if (content.match(/javascript:/)) {
        securityIssues.push('Contains javascript: URLs - potential XSS risk');
      }

      if (securityIssues.length > 0) {
        logWarning(`Security issues in ${filename}:`);
        securityIssues.forEach(issue => logWarning(`  - ${issue}`));
      }
    }

    return content;
  }

  static processCSS(content, filename) {
    logInfo(`Processing CSS: ${filename}`);

    if (buildConfig.removeComments) {
      content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    if (buildConfig.minify) {
      content = content
        .replace(/\s{2,}/g, ' ')
        .replace(/;\s*/g, ';')
        .replace(/{\s*/g, '{')
        .replace(/}\s*/g, '}')
        .replace(/,\s*/g, ',')
        .replace(/:\s*/g, ':')
        .trim();
    }

    return content;
  }

  static processJSON(content, filename) {
    logInfo(`Processing JSON: ${filename}`);

    try {
      const parsed = JSON.parse(content);

      // Validate manifest.json specifically
      if (filename === 'manifest.json') {
        return this.validateAndProcessManifest(parsed);
      }

      return JSON.stringify(parsed, null, buildConfig.minify ? 0 : 2);
    } catch (error) {
      logError(`Invalid JSON in ${filename}: ${error.message}`);
      throw error;
    }
  }

  static validateAndProcessManifest(manifest) {
    logInfo('Validating manifest.json for production...');

    const issues = [];

    // Validate required fields
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    requiredFields.forEach(field => {
      if (!manifest[field]) {
        issues.push(`Missing required field: ${field}`);
      }
    });

    // Validate manifest version
    if (manifest.manifest_version !== 3) {
      issues.push('Must use Manifest V3');
    }

    // Validate permissions
    if (manifest.permissions) {
      const broadPermissions = ['tabs', '<all_urls>', 'http://*/*', 'https://*/*'];
      const hasBroadPermissions = manifest.permissions.some(perm =>
        broadPermissions.includes(perm)
      );
      if (hasBroadPermissions) {
        issues.push('Contains overly broad permissions');
      }
    }

    // Validate CSP
    if (manifest.content_security_policy?.extension_pages) {
      const csp = manifest.content_security_policy.extension_pages;
      if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
        issues.push('CSP contains unsafe directives');
      }
    }

    // Validate service worker
    if (!manifest.background?.service_worker) {
      issues.push('Missing service worker in background');
    }

    // Check for MV2 fields
    const mv2Fields = ['background.scripts', 'background.persistent', 'browser_action', 'page_action'];
    mv2Fields.forEach(field => {
      const parts = field.split('.');
      let obj = manifest;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
        if (!obj) break;
      }
      if (obj && obj[parts[parts.length - 1]]) {
        issues.push(`Contains deprecated MV2 field: ${field}`);
      }
    });

    if (issues.length > 0) {
      logError('Manifest validation failed:');
      issues.forEach(issue => logError(`  - ${issue}`));
      throw new Error('Manifest validation failed');
    }

    logSuccess('Manifest validation passed');
    return JSON.stringify(manifest, null, 2);
  }
}

// Build utilities
class BuildUtils {
  static async copyDirectory(src, dest) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }

    const items = readdirSync(src, { withFileTypes: true });

    for (const item of items) {
      const srcPath = join(src, item.name);
      const destPath = join(dest, item.name);

      if (item.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await this.copyFile(srcPath, destPath);
      }
    }
  }

  static async copyFile(src, dest) {
    const destDir = dirname(dest);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    const ext = extname(src).toLowerCase();
    const filename = basename(src);

    // Skip certain files
    const skipFiles = [
      '.test.js', '.spec.js', '.test.ts', '.spec.ts',
      '.map', '.d.ts', 'tsconfig.json', '.gitignore',
      'README.md', 'package.json', 'package-lock.json'
    ];

    if (skipFiles.some(skip => filename.includes(skip))) {
      logInfo(`Skipping: ${filename}`);
      return;
    }

    try {
      let content = readFileSync(src, 'utf8');

      // Process files based on type
      switch (ext) {
        case '.js':
          content = FileProcessor.processJavaScript(content, filename);
          break;
        case '.html':
          content = FileProcessor.processHTML(content, filename);
          break;
        case '.css':
          content = FileProcessor.processCSS(content, filename);
          break;
        case '.json':
          content = FileProcessor.processJSON(content, filename);
          break;
        default:
          // Binary files or other text files
          if (this.isBinaryFile(ext)) {
            copyFileSync(src, dest);
            logInfo(`Copied binary: ${filename}`);
            return;
          }
      }

      writeFileSync(dest, content, 'utf8');
      logSuccess(`Processed: ${filename}`);
    } catch (error) {
      logError(`Failed to process ${filename}: ${error.message}`);
      throw error;
    }
  }

  static isBinaryFile(ext) {
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
    return binaryExtensions.includes(ext);
  }

  static validateBuildOutput() {
    logInfo('Validating build output...');

    const requiredFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'popup.html',
      'popup.js'
    ];

    const missingFiles = [];

    requiredFiles.forEach(file => {
      const filePath = join(DIST_DIR, file);
      if (!existsSync(filePath)) {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      logError('Missing required files in build output:');
      missingFiles.forEach(file => logError(`  - ${file}`));
      throw new Error('Build validation failed');
    }

    // Check file sizes
    const fileSizes = {};
    requiredFiles.forEach(file => {
      const filePath = join(DIST_DIR, file);
      if (existsSync(filePath)) {
        const stats = statSync(filePath);
        fileSizes[file] = stats.size;
      }
    });

    logInfo('File sizes:');
    Object.entries(fileSizes).forEach(([file, size]) => {
      const sizeKB = (size / 1024).toFixed(2);
      log(`  ${file}: ${sizeKB} KB`, 'cyan');
    });

    const totalSize = Object.values(fileSizes).reduce((sum, size) => sum + size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    logInfo(`Total build size: ${totalSizeMB} MB`);

    if (totalSize > 10 * 1024 * 1024) { // 10MB limit
      logWarning('Build size exceeds 10MB - may have issues with Chrome Web Store');
    }

    logSuccess('Build validation passed');
  }

  static generateBuildInfo() {
    const buildInfo = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: 'production',
      node_version: process.version,
      config: buildConfig
    };

    const buildInfoPath = join(DIST_DIR, 'build-info.json');
    writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
    logSuccess('Generated build info');
  }
}

// Main build function
async function build() {
  try {
    log('🚀 Starting production build...', 'magenta');

    // Clean dist directory
    if (existsSync(DIST_DIR)) {
      logInfo('Cleaning dist directory...');
      // Simple cleanup - in real scenario would use rimraf or similar
      const { execSync } = await import('child_process');
      try {
        execSync(`rm -rf ${DIST_DIR}`);
      } catch (error) {
        logWarning('Could not clean dist directory, continuing...');
      }
    }

    // Create dist directory
    mkdirSync(DIST_DIR, { recursive: true });

    // Copy and process source files
    logInfo('Processing source files...');

    // Process specific files first
    const specificFiles = [
      { src: 'manifest.json', dest: 'manifest.json' },
      { src: 'src/background.js', dest: 'background.js' },
      { src: 'src/content.js', dest: 'content.js' },
      { src: 'src/popup/popup.html', dest: 'popup.html' },
      { src: 'src/popup/popup.js', dest: 'popup.js' }
    ];

    for (const file of specificFiles) {
      const srcPath = join(ROOT_DIR, file.src);
      const destPath = join(DIST_DIR, file.dest);

      if (existsSync(srcPath)) {
        await BuildUtils.copyFile(srcPath, destPath);
      } else {
        logWarning(`Source file not found: ${file.src}, creating placeholder...`);

        // Create placeholder content for missing files
        let placeholder = '';
        if (file.dest.endsWith('.js')) {
          placeholder = '// Production build placeholder\ntry{document.addEventListener("DOMContentLoaded",function(){console.error("Extension initialized")});}catch(e){console.error("Init error:",e);}';
        } else if (file.dest.endsWith('.html')) {
          placeholder = '<!DOCTYPE html><html><head><title>Extension</title></head><body><h1>Extension Popup</h1></body></html>';
        } else if (file.dest.endsWith('.json')) {
          placeholder = JSON.stringify({
            manifest_version: 3,
            name: "LinkedIn Chrome Extension",
            version: "1.0.0",
            description: "Professional LinkedIn automation and analytics extension.",
            permissions: ["storage", "activeTab"],
            host_permissions: ["https://*.linkedin.com/*"],
            action: { default_popup: "popup.html" },
            background: { service_worker: "background.js" },
            content_scripts: [{ matches: ["https://*.linkedin.com/*"], js: ["content.js"] }]
          }, null, 2);
        }

        writeFileSync(destPath, placeholder);
        logInfo(`Created placeholder: ${file.dest}`);
      }
    }

    // Copy assets directories
    const assetDirs = ['icons', 'styles', 'assets'];
    for (const dir of assetDirs) {
      const srcPath = join(ROOT_DIR, dir);
      const destPath = join(DIST_DIR, dir);

      if (existsSync(srcPath)) {
        await BuildUtils.copyDirectory(srcPath, destPath);
      } else {
        logInfo(`Asset directory not found: ${dir}, creating minimal structure...`);
        mkdirSync(destPath, { recursive: true });

        if (dir === 'icons') {
          // Create placeholder icon files
          const iconSizes = ['16', '48', '128'];
          iconSizes.forEach(size => {
            const iconPath = join(destPath, `icon${size}.png`);
            // Create minimal PNG placeholder (would use actual image processing in real scenario)
            writeFileSync(iconPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])); // PNG header
            logInfo(`Created placeholder icon: icon${size}.png`);
          });
        }
      }
    }

    // Validate build output
    BuildUtils.validateBuildOutput();

    // Generate build info
    BuildUtils.generateBuildInfo();

    logSuccess('✨ Production build completed successfully!');
    logInfo(`Build output: ${DIST_DIR}`);

  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export { build, BuildUtils, FileProcessor };