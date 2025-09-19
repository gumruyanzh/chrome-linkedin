// Enhanced Template Management Tests - Task 3.2
// Tests for template library, categorization, and performance analytics

import {
  createTemplateLibrary,
  getTemplatesByCategory,
  getTemplatesByTag,
  saveTemplateWithMetadata,
  updateTemplateMetadata,
  deleteTemplate,
  importTemplates,
  exportTemplates,
  getTemplatePerformanceAnalytics,
  getTemplateUsageStats,
  optimizeTemplateLibrary,
  searchTemplates,
  duplicateTemplate,
  getTemplateVersionHistory,
  rollbackTemplateVersion,
  shareTemplate,
  validateTemplateLibrary
} from '../utils/enhanced-template-management.js';

import { getStorageData, setStorageData, STORAGE_KEYS } from '../utils/storage.js';

// Mock storage
jest.mock('../utils/storage.js');

describe('Enhanced Template Management - Task 3.2', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset storage mock
    getStorageData.mockResolvedValue({});
    setStorageData.mockResolvedValue(true);
  });

  describe('Template Library Creation and Management', () => {
    test('should create template library with default structure', async () => {
      const library = await createTemplateLibrary();

      expect(library).toMatchObject({
        id: expect.any(String),
        name: 'Main Template Library',
        createdAt: expect.any(Number),
        templates: [],
        categories: expect.any(Array),
        tags: expect.any(Array),
        metadata: expect.any(Object)
      });

      expect(library.categories).toContain('General');
      expect(library.categories).toContain('Professional');
      expect(library.categories).toContain('Industry-Specific');
    });

    test('should create custom template library', async () => {
      const customConfig = {
        name: 'Sales Templates',
        description: 'Templates for sales outreach',
        categories: ['Cold Outreach', 'Follow-up', 'Thank You'],
        defaultTemplate: {
          category: 'Cold Outreach',
          tags: ['sales', 'prospecting']
        }
      };

      const library = await createTemplateLibrary(customConfig);

      expect(library.name).toBe('Sales Templates');
      expect(library.description).toBe('Templates for sales outreach');
      expect(library.categories).toEqual(['Cold Outreach', 'Follow-up', 'Thank You']);
    });

    test('should save template library to storage', async () => {
      const library = await createTemplateLibrary();

      expect(setStorageData).toHaveBeenCalledWith({
        [STORAGE_KEYS.TEMPLATE_LIBRARY]: library
      });
    });
  });

  describe('Template CRUD Operations', () => {
    test('should save template with comprehensive metadata', async () => {
      const templateData = {
        name: 'Tech Professional Outreach',
        message: 'Hi {{firstName}}, I noticed your work at {{company}}. Would love to connect!',
        category: 'Professional',
        tags: ['technology', 'networking'],
        description: 'Template for reaching out to technology professionals',
        targetAudience: 'Software engineers and tech professionals',
        expectedResponseRate: 0.15
      };

      getStorageData.mockResolvedValue({
        template_library: {
          templates: [],
          categories: ['Professional'],
          tags: []
        }
      });

      const result = await saveTemplateWithMetadata(templateData);

      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Tech Professional Outreach',
        category: 'Professional',
        tags: ['technology', 'networking'],
        createdAt: expect.any(Number),
        version: 1,
        usageCount: 0,
        performanceMetrics: {
          responseRate: 0,
          successRate: 0,
          averageResponseTime: 0
        }
      });
    });

    test('should update template metadata', async () => {
      const templateId = 'template-123';
      const updates = {
        name: 'Updated Template Name',
        tags: ['updated', 'networking'],
        description: 'Updated description'
      };

      getStorageData.mockResolvedValue({
        template_library: {
          templates: [
            {
              id: templateId,
              name: 'Original Name',
              version: 1,
              updatedAt: 1000
            }
          ]
        }
      });

      const result = await updateTemplateMetadata(templateId, updates);

      expect(result).toMatchObject({
        id: templateId,
        name: 'Updated Template Name',
        tags: ['updated', 'networking'],
        version: 2,
        updatedAt: expect.any(Number)
      });
    });

    test('should delete template safely', async () => {
      const templateId = 'template-to-delete';

      getStorageData.mockResolvedValue({
        template_library: {
          templates: [
            { id: templateId, name: 'Template to Delete' },
            { id: 'other-template', name: 'Keep This' }
          ]
        }
      });

      const result = await deleteTemplate(templateId);

      expect(result.success).toBe(true);
      expect(result.deletedTemplate.id).toBe(templateId);

      const saveCall = setStorageData.mock.calls[0][0];
      expect(saveCall.template_library.templates).toHaveLength(1);
      expect(saveCall.template_library.templates[0].id).toBe('other-template');
    });

    test('should prevent deletion of templates with high usage', async () => {
      const templateId = 'high-usage-template';

      getStorageData.mockResolvedValue({
        template_library: {
          templates: [
            {
              id: templateId,
              name: 'High Usage Template',
              usageCount: 100,
              performanceMetrics: { responseRate: 0.3 }
            }
          ]
        }
      });

      const result = await deleteTemplate(templateId, { preventHighUsageDeletion: true });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('HIGH_USAGE_TEMPLATE');
      expect(result.message).toContain('usage count');
    });
  });

  describe('Template Categorization and Tagging', () => {
    test('should retrieve templates by category', async () => {
      const mockTemplates = [
        { id: '1', category: 'Professional', name: 'Professional 1' },
        { id: '2', category: 'Professional', name: 'Professional 2' },
        { id: '3', category: 'General', name: 'General 1' }
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await getTemplatesByCategory('Professional');

      expect(result).toHaveLength(2);
      expect(result.every(t => t.category === 'Professional')).toBe(true);
    });

    test('should retrieve templates by tag', async () => {
      const mockTemplates = [
        { id: '1', tags: ['sales', 'cold-outreach'], name: 'Sales Template' },
        { id: '2', tags: ['networking', 'sales'], name: 'Network Sales' },
        { id: '3', tags: ['networking'], name: 'Pure Networking' }
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await getTemplatesByTag('sales');

      expect(result).toHaveLength(2);
      expect(result.every(t => t.tags.includes('sales'))).toBe(true);
    });

    test('should retrieve templates by multiple tags', async () => {
      const mockTemplates = [
        { id: '1', tags: ['sales', 'tech', 'cold-outreach'] },
        { id: '2', tags: ['sales', 'finance'] },
        { id: '3', tags: ['tech', 'networking'] },
        { id: '4', tags: ['sales', 'tech', 'warm-outreach'] }
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await getTemplatesByTag(['sales', 'tech'], { matchAll: true });

      expect(result).toHaveLength(2);
      expect(result.every(t => t.tags.includes('sales') && t.tags.includes('tech'))).toBe(true);
    });

    test('should search templates by content and metadata', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Software Engineer Outreach',
          message: 'Hi {{firstName}}, I saw your work in JavaScript...',
          tags: ['tech', 'javascript'],
          description: 'For JavaScript developers'
        },
        {
          id: '2',
          name: 'General Networking',
          message: 'Hello {{name}}, would like to connect...',
          tags: ['networking'],
          description: 'General purpose template'
        }
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await searchTemplates('JavaScript');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('Template Import and Export', () => {
    test('should export templates in standard format', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Template 1',
          message: 'Hello {{name}}',
          category: 'General',
          createdAt: 1000
        },
        {
          id: '2',
          name: 'Template 2',
          message: 'Hi {{firstName}}',
          category: 'Professional',
          createdAt: 2000
        }
      ];

      getStorageData.mockResolvedValue({
        template_library: {
          templates: mockTemplates,
          exportMetadata: {
            version: '1.0',
            exported: Date.now()
          }
        }
      });

      const result = await exportTemplates({ format: 'json' });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        version: '1.0',
        exportedAt: expect.any(Number),
        templateCount: 2,
        templates: mockTemplates
      });
    });

    test('should export templates with filtering', async () => {
      const mockTemplates = [
        { id: '1', category: 'Professional', tags: ['sales'] },
        { id: '2', category: 'General', tags: ['networking'] },
        { id: '3', category: 'Professional', tags: ['marketing'] }
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await exportTemplates({
        format: 'json',
        filter: { category: 'Professional' }
      });

      expect(result.data.templates).toHaveLength(2);
      expect(result.data.templates.every(t => t.category === 'Professional')).toBe(true);
    });

    test('should import templates with validation', async () => {
      const importData = {
        version: '1.0',
        templates: [
          {
            name: 'Imported Template 1',
            message: 'Hello {{name}} from imported',
            category: 'Imported',
            tags: ['import', 'test']
          },
          {
            name: 'Imported Template 2',
            message: 'Hi {{firstName}} from import',
            category: 'Imported',
            tags: ['import']
          }
        ]
      };

      getStorageData.mockResolvedValue({
        template_library: {
          templates: [{ id: 'existing', name: 'Existing Template' }]
        }
      });

      const result = await importTemplates(importData, {
        validateBeforeImport: true,
        preventDuplicates: true
      });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle import validation errors', async () => {
      const invalidImportData = {
        templates: [
          {
            name: 'Valid Template',
            message: 'Hello {{name}}',
            category: 'Valid'
          },
          {
            // Missing required fields
            message: 'Invalid template without name'
          },
          {
            name: 'Template with invalid variables',
            message: 'Hello {{unclosed_variable',
            category: 'Invalid'
          }
        ]
      };

      const result = await importTemplates(invalidImportData, { validateBeforeImport: true });

      expect(result.success).toBe(true); // Partial success
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(2);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Template Performance Analytics', () => {
    test('should calculate template performance metrics', async () => {
      const templateId = 'performance-template';

      getStorageData.mockResolvedValue({
        analytics: {
          analytics: [
            { type: 'template_used', templateId, timestamp: 1000, profileId: 'p1' },
            { type: 'connection_sent', templateId, timestamp: 1100, profileId: 'p1' },
            { type: 'connection_accepted', templateId, timestamp: 1200, profileId: 'p1' },
            { type: 'template_used', templateId, timestamp: 2000, profileId: 'p2' },
            { type: 'connection_sent', templateId, timestamp: 2100, profileId: 'p2' },
            { type: 'connection_declined', templateId, timestamp: 2200, profileId: 'p2' }
          ]
        }
      });

      const result = await getTemplatePerformanceAnalytics(templateId);

      expect(result).toMatchObject({
        templateId,
        totalUsage: 2,
        connectionsSent: 2,
        connectionsAccepted: 1,
        connectionsDeclined: 1,
        responseRate: 1.0, // 2/2 responses
        acceptanceRate: 0.5, // 1/2 accepted
        averageResponseTime: expect.any(Number)
      });
    });

    test('should get template usage statistics', async () => {
      const mockTemplates = [
        { id: '1', usageCount: 10, performanceMetrics: { responseRate: 0.3 } },
        { id: '2', usageCount: 5, performanceMetrics: { responseRate: 0.2 } },
        { id: '3', usageCount: 15, performanceMetrics: { responseRate: 0.4 } }
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await getTemplateUsageStats();

      expect(result).toMatchObject({
        totalTemplates: 3,
        totalUsage: 30,
        averageUsage: 10,
        mostUsed: mockTemplates[2],
        leastUsed: mockTemplates[1],
        averageResponseRate: expect.any(Number)
      });
    });

    test('should identify top performing templates', async () => {
      const mockTemplates = [
        {
          id: '1',
          name: 'Low Performer',
          performanceMetrics: { responseRate: 0.1, acceptanceRate: 0.05 }
        },
        {
          id: '2',
          name: 'High Performer',
          performanceMetrics: { responseRate: 0.4, acceptanceRate: 0.3 }
        },
        {
          id: '3',
          name: 'Medium Performer',
          performanceMetrics: { responseRate: 0.2, acceptanceRate: 0.15 }
        }
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await getTemplateUsageStats({ includeRankings: true });

      expect(result.topPerforming[0].id).toBe('2');
      expect(result.topPerforming[0].name).toBe('High Performer');
      expect(result.needsImprovement[0].id).toBe('1');
    });
  });

  describe('Template Library Optimization', () => {
    test('should optimize template library by removing duplicates', async () => {
      const mockTemplates = [
        { id: '1', name: 'Template A', message: 'Hello {{name}}', category: 'General' },
        { id: '2', name: 'Template B', message: 'Hello {{name}}', category: 'General' }, // Duplicate
        { id: '3', name: 'Template C', message: 'Hi {{firstName}}', category: 'Professional' },
        { id: '4', name: 'Template D', message: 'Hello {{name}}', category: 'Marketing' } // Similar
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await optimizeTemplateLibrary({
        removeDuplicates: true,
        similarityThreshold: 0.9
      });

      expect(result.optimized).toBe(true);
      expect(result.duplicatesRemoved).toBeGreaterThan(0);
      expect(result.templatesAfter).toBeLessThan(result.templatesBefore);
    });

    test('should optimize by consolidating low-usage templates', async () => {
      const mockTemplates = [
        { id: '1', usageCount: 0, createdAt: Date.now() - 86400000 }, // 1 day old, unused
        { id: '2', usageCount: 1, createdAt: Date.now() - 86400000 * 30 }, // 30 days old, low usage
        { id: '3', usageCount: 50, createdAt: Date.now() - 86400000 * 10 } // 10 days old, good usage
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await optimizeTemplateLibrary({
        removeUnused: true,
        unusedThreshold: 30, // days
        lowUsageThreshold: 2
      });

      expect(result.optimized).toBe(true);
      expect(result.unusedRemoved).toBeGreaterThan(0);
    });

    test('should optimize template organization by auto-categorizing', async () => {
      const mockTemplates = [
        { id: '1', message: 'Hello software engineer {{name}}', category: 'General' },
        { id: '2', message: 'Hi marketing professional {{firstName}}', category: 'General' },
        { id: '3', message: 'Dear finance expert {{name}}', category: 'General' }
      ];

      getStorageData.mockResolvedValue({
        template_library: { templates: mockTemplates }
      });

      const result = await optimizeTemplateLibrary({
        autoCategories: true,
        smartTagging: true
      });

      expect(result.optimized).toBe(true);
      expect(result.categoriesUpdated).toBeGreaterThan(0);
      expect(result.tagsAdded).toBeGreaterThan(0);
    });
  });

  describe('Template Versioning and History', () => {
    test('should maintain template version history', async () => {
      const templateId = 'versioned-template';
      const originalTemplate = {
        id: templateId,
        name: 'Original Template',
        message: 'Original message',
        version: 1
      };

      getStorageData.mockResolvedValue({
        template_library: { templates: [originalTemplate] },
        template_versions: {}
      });

      const updates = {
        message: 'Updated message',
        name: 'Updated Template'
      };

      const result = await updateTemplateMetadata(templateId, updates);

      expect(result.version).toBe(2);

      // Check that version history was stored
      const versionCall = setStorageData.mock.calls.find(call => call[0].template_versions);
      expect(versionCall).toBeDefined();
    });

    test('should retrieve template version history', async () => {
      const templateId = 'template-with-history';

      getStorageData.mockResolvedValue({
        template_versions: {
          [templateId]: [
            { version: 1, message: 'Version 1', updatedAt: 1000 },
            { version: 2, message: 'Version 2', updatedAt: 2000 },
            { version: 3, message: 'Version 3', updatedAt: 3000 }
          ]
        }
      });

      const result = await getTemplateVersionHistory(templateId);

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(3); // Most recent first
      expect(result[2].version).toBe(1); // Oldest last
    });

    test('should rollback template to previous version', async () => {
      const templateId = 'rollback-template';
      const currentTemplate = {
        id: templateId,
        name: 'Current Version',
        message: 'Current message',
        version: 3
      };

      getStorageData.mockResolvedValue({
        template_library: { templates: [currentTemplate] },
        template_versions: {
          [templateId]: [
            { version: 1, message: 'Version 1', name: 'V1' },
            { version: 2, message: 'Version 2', name: 'V2' },
            { version: 3, message: 'Version 3', name: 'V3' }
          ]
        }
      });

      const result = await rollbackTemplateVersion(templateId, 2);

      expect(result.success).toBe(true);
      expect(result.rolledBackTo).toBe(2);
      expect(result.newVersion).toBe(4); // Creates new version based on old one
    });
  });

  describe('Template Sharing and Collaboration', () => {
    test('should share template with sharing metadata', async () => {
      const templateId = 'shareable-template';
      const template = {
        id: templateId,
        name: 'Shareable Template',
        message: 'Hello {{name}}',
        category: 'Professional'
      };

      getStorageData.mockResolvedValue({
        template_library: { templates: [template] }
      });

      const shareOptions = {
        shareWith: 'public',
        allowEditing: false,
        expiresAt: Date.now() + 86400000 * 30 // 30 days
      };

      const result = await shareTemplate(templateId, shareOptions);

      expect(result.success).toBe(true);
      expect(result.shareId).toBeDefined();
      expect(result.shareUrl).toContain(result.shareId);
      expect(result.expiresAt).toBe(shareOptions.expiresAt);
    });

    test('should duplicate template with new ID', async () => {
      const originalId = 'original-template';
      const original = {
        id: originalId,
        name: 'Original Template',
        message: 'Original message {{name}}',
        category: 'Professional',
        tags: ['original']
      };

      getStorageData.mockResolvedValue({
        template_library: { templates: [original] }
      });

      const duplicateOptions = {
        name: 'Copy of Original Template',
        category: 'General'
      };

      const result = await duplicateTemplate(originalId, duplicateOptions);

      expect(result.success).toBe(true);
      expect(result.duplicatedTemplate.id).not.toBe(originalId);
      expect(result.duplicatedTemplate.name).toBe('Copy of Original Template');
      expect(result.duplicatedTemplate.message).toBe(original.message);
      expect(result.duplicatedTemplate.category).toBe('General');
    });
  });

  describe('Template Library Validation', () => {
    test('should validate template library integrity', async () => {
      const mockLibrary = {
        templates: [
          { id: '1', name: 'Valid Template', message: 'Hello {{name}}', category: 'General' },
          { id: '2', name: 'Invalid Template', message: 'Hello {{unclosed', category: 'General' },
          { id: '3', name: '', message: 'Template without name', category: 'General' }
        ],
        categories: ['General', 'Professional'],
        tags: ['networking', 'sales']
      };

      getStorageData.mockResolvedValue({
        template_library: mockLibrary
      });

      const result = await validateTemplateLibrary();

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(0);
      expect(result.validTemplates).toBe(1);
      expect(result.invalidTemplates).toBe(2);
    });

    test('should provide suggestions for template improvements', async () => {
      const mockLibrary = {
        templates: [
          {
            id: '1',
            name: 'Basic Template',
            message: 'Hello {{name}}', // Very basic
            category: 'General',
            usageCount: 0,
            performanceMetrics: { responseRate: 0.1 }
          }
        ]
      };

      getStorageData.mockResolvedValue({
        template_library: mockLibrary
      });

      const result = await validateTemplateLibrary({ includeSuggestions: true });

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toMatchObject({
        templateId: '1',
        suggestion: expect.any(String),
        priority: expect.any(String)
      });
    });
  });
});
