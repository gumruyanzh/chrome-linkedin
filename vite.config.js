import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Plugin to convert content script from ES module to traditional script
function convertContentScriptToIIFE() {
  return {
    name: 'convert-content-script-to-iife',
    generateBundle(options, bundle) {
      const contentChunk = Object.values(bundle).find(chunk =>
        chunk.fileName === 'content.js' && chunk.type === 'chunk'
      );

      if (contentChunk) {
        console.log('Converting content script to IIFE format...');

        // Wrap the entire content in an IIFE and remove ES module syntax
        let code = contentChunk.code;

        // Remove import statements (they should be bundled already)
        code = code.replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '');

        // Remove export statements
        code = code.replace(/export\s*\{[^}]+\}\s*;?\s*$/gm, '');
        code = code.replace(/export\s+\w+.*?;/g, '');

        // Wrap in IIFE to avoid global scope pollution
        code = `(function() {\n'use strict';\n${code}\n})();`;

        contentChunk.code = code;
        console.log('Content script converted to traditional script format');
      }
    }
  };
}

export default defineConfig({
  plugins: [
    convertContentScriptToIIFE(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/manifest.json',
          dest: '',
          transform: {
            handler(content) {
              const manifest = JSON.parse(content.toString());
              // Update paths to match build output
              manifest.background.service_worker = 'background.js';
              manifest.content_scripts[0].js = ['content.js'];
              // Remove module type to ensure content script runs as traditional script
              if (manifest.content_scripts[0].type) {
                delete manifest.content_scripts[0].type;
              }
              manifest.action.default_popup = 'popup.html';
              manifest.web_accessible_resources[0].resources = [
                'popup.html',
                'content/*',
                'components/*',
                'styles/*',
                'assets/*',
                'docs/*',
                'dashboard/*',
                'settings/*',
                'icons/*'
              ];
              return JSON.stringify(manifest, null, 2);
            }
          }
        },
        {
          src: 'src/assets/icons/*.png',
          dest: 'icons'
        },
        {
          src: 'src/popup/popup.html',
          dest: '',
          transform: {
            handler(content) {
              return content.toString()
                .replace('../styles/tailwind.css', 'styles/tailwind.css')
                .replace('../icons/icon-32.png', 'icons/icon-32.png')
                .replace('../components/help-system.js', 'components/help-system.js')
                .replace('../assets/vintage-typography.css', 'assets/vintage-typography.css');
            }
          }
        },
        {
          src: 'src/styles/tailwind.css',
          dest: 'styles'
        },
        {
          src: 'src/content/styles.css',
          dest: 'content'
        },
        {
          src: 'src/assets/vintage-typography.css',
          dest: 'assets'
        },
        {
          src: 'src/docs/help-documentation.html',
          dest: 'docs',
          transform: {
            handler(content) {
              return content.toString()
                .replace('../styles/tailwind.css', '../styles/tailwind.css')
                .replace('../assets/vintage-typography.css', '../assets/vintage-typography.css');
            }
          }
        },
        {
          src: 'src/dashboard/dashboard.html',
          dest: 'dashboard',
          transform: {
            handler(content) {
              return content.toString()
                .replace('../styles/tailwind.css', '../styles/tailwind.css');
            }
          }
        },
        {
          src: 'src/dashboard/analytics-dashboard.html',
          dest: 'dashboard',
          transform: {
            handler(content) {
              return content.toString()
                .replace('../assets/vintage-typography.css', '../assets/vintage-typography.css');
            }
          }
        },
        {
          src: 'src/dashboard/bulk-dashboard.html',
          dest: 'dashboard',
          transform: {
            handler(content) {
              return content.toString()
                .replace('../assets/vintage-typography.css', '../assets/vintage-typography.css');
            }
          }
        },
        {
          src: 'src/settings/settings.html',
          dest: 'settings',
          transform: {
            handler(content) {
              return content.toString()
                .replace('../styles/tailwind.css', '../styles/tailwind.css')
                .replace('../assets/vintage-typography.css', '../assets/vintage-typography.css');
            }
          }
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        'popup': resolve(__dirname, 'src/popup/popup.js'),
        'background': resolve(__dirname, 'src/background/service-worker.js'),
        'content': resolve(__dirname, 'src/content/linkedin-content-wrapper.js'),
        'components/help-system': resolve(__dirname, 'src/components/help-system.js'),
        'components/onboarding-system': resolve(__dirname, 'src/components/onboarding-system.js'),
        'content/styles': resolve(__dirname, 'src/content/styles.css'),
        'styles/tailwind': resolve(__dirname, 'src/styles/tailwind.css'),
        'dashboard/dashboard': resolve(__dirname, 'src/dashboard/dashboard.js'),
        'dashboard/analytics-dashboard': resolve(__dirname, 'src/dashboard/analytics-dashboard.js'),
        'dashboard/bulk-dashboard': resolve(__dirname, 'src/dashboard/bulk-dashboard.js'),
        'settings/settings': resolve(__dirname, 'src/settings/settings.js')
      },
      output: {
        format: 'es',
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'unknown';
          if (facadeModuleId === 'service-worker.js') return 'background.js';
          if (facadeModuleId === 'linkedin-content-wrapper.js') return 'content.js';
          if (facadeModuleId === 'popup.js') return 'popup.js';
          return `${chunkInfo.name}.js`;
        },
        chunkFileNames: (chunkInfo) => {
          // Force content script to be bundled as a single file
          if (chunkInfo.name === 'content' || chunkInfo.facadeModuleId?.includes('linkedin-content')) {
            return 'content.js';
          }
          return '[name]-[hash].js';
        },
        manualChunks: (id) => {
          // Bundle all content script dependencies into the main content chunk
          if (id.includes('linkedin-content-wrapper.js') ||
              id.includes('linkedin-content.js') ||
              id.includes('analytics.js') ||
              id.includes('storage.js') ||
              id.includes('linkedin-automation.js') ||
              id.includes('search-integration.js') ||
              id.includes('safety-compliance.js')) {
            return 'content';
          }
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'popup.html') return 'popup.html';
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            if (assetInfo.name.includes('tailwind')) return 'styles/tailwind.css';
            if (assetInfo.name.includes('styles')) return 'content/styles.css';
          }
          return `[name].[ext]`;
        },
        dir: 'dist'
      }
    },
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
    target: 'es2020'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  server: {
    hmr: false // Disable HMR for Chrome extension development
  }
});