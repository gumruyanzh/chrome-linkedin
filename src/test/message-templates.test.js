// Comprehensive Message Templates Tests
import {
  getMessageTemplates,
  saveMessageTemplate,
  deleteMessageTemplate,
  getTemplateById,
  processTemplateVariables,
  DEFAULT_TEMPLATES
} from '../utils/message-templates.js';

describe('Message Templates Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
  });

  describe('DEFAULT_TEMPLATES', () => {
    test('should have predefined templates', () => {
      expect(DEFAULT_TEMPLATES).toBeDefined();
      expect(Array.isArray(DEFAULT_TEMPLATES)).toBe(true);
      expect(DEFAULT_TEMPLATES.length).toBeGreaterThan(0);
    });

    test('should have required properties on each template', () => {
      DEFAULT_TEMPLATES.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.content).toBeDefined();
      });
    });

    test('should have unique template IDs', () => {
      const ids = DEFAULT_TEMPLATES.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('getMessageTemplates', () => {
    test('should return default templates when no custom templates', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const templates = await getMessageTemplates();

      expect(templates.length).toBe(DEFAULT_TEMPLATES.length);
    });

    test('should return custom templates when available', async () => {
      const customTemplates = [
        { id: 'custom1', name: 'Custom Template', content: 'Hello {{firstName}}!' }
      ];
      chrome.storage.local.get.mockResolvedValue({
        message_templates: customTemplates
      });

      const templates = await getMessageTemplates();

      expect(templates).toEqual(customTemplates);
    });

    test('should handle storage errors', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const templates = await getMessageTemplates();

      // Should return defaults on error
      expect(templates).toEqual(DEFAULT_TEMPLATES);
    });
  });

  describe('saveMessageTemplate', () => {
    test('should save new template', async () => {
      chrome.storage.local.get.mockResolvedValue({ message_templates: [] });
      chrome.storage.local.set.mockResolvedValue();

      const newTemplate = {
        name: 'New Template',
        content: 'Hello {{firstName}}!'
      };

      const result = await saveMessageTemplate(newTemplate);

      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('New Template');
    });

    test('should update existing template', async () => {
      const existingTemplates = [
        { id: 'template1', name: 'Old Name', content: 'Old content' }
      ];
      chrome.storage.local.get.mockResolvedValue({
        message_templates: existingTemplates
      });
      chrome.storage.local.set.mockResolvedValue();

      const updatedTemplate = {
        id: 'template1',
        name: 'New Name',
        content: 'New content'
      };

      await saveMessageTemplate(updatedTemplate);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.message_templates[0].name).toBe('New Name');
    });

    test('should generate ID for new templates', async () => {
      chrome.storage.local.get.mockResolvedValue({ message_templates: [] });
      chrome.storage.local.set.mockResolvedValue();

      const newTemplate = {
        name: 'Test',
        content: 'Test content'
      };

      const result = await saveMessageTemplate(newTemplate);

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    test('should throw error on save failure', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockRejectedValue(new Error('Save failed'));

      await expect(saveMessageTemplate({ name: 'Test', content: 'Test' }))
        .rejects.toThrow('Save failed');
    });
  });

  describe('deleteMessageTemplate', () => {
    test('should delete template by ID', async () => {
      const templates = [
        { id: 'template1', name: 'Template 1', content: 'Content 1' },
        { id: 'template2', name: 'Template 2', content: 'Content 2' }
      ];
      chrome.storage.local.get.mockResolvedValue({ message_templates: templates });
      chrome.storage.local.set.mockResolvedValue();

      await deleteMessageTemplate('template1');

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.message_templates.length).toBe(1);
      expect(savedData.message_templates[0].id).toBe('template2');
    });

    test('should handle deleting non-existent template', async () => {
      const templates = [{ id: 'template1', name: 'Template 1', content: 'Content 1' }];
      chrome.storage.local.get.mockResolvedValue({ message_templates: templates });
      chrome.storage.local.set.mockResolvedValue();

      await deleteMessageTemplate('nonexistent');

      // Should not throw, templates unchanged
      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.message_templates.length).toBe(1);
    });

    test('should throw error on delete failure', async () => {
      chrome.storage.local.get.mockResolvedValue({ message_templates: [] });
      chrome.storage.local.set.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteMessageTemplate('template1'))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('getTemplateById', () => {
    test('should return template by ID', async () => {
      const templates = [
        { id: 'template1', name: 'Template 1', content: 'Content 1' },
        { id: 'template2', name: 'Template 2', content: 'Content 2' }
      ];
      chrome.storage.local.get.mockResolvedValue({ message_templates: templates });

      const template = await getTemplateById('template2');

      expect(template.id).toBe('template2');
      expect(template.name).toBe('Template 2');
    });

    test('should return null for non-existent template', async () => {
      chrome.storage.local.get.mockResolvedValue({ message_templates: [] });

      const template = await getTemplateById('nonexistent');

      expect(template).toBeNull();
    });

    test('should search in default templates if not in custom', async () => {
      chrome.storage.local.get.mockResolvedValue({ message_templates: [] });

      const defaultId = DEFAULT_TEMPLATES[0]?.id;
      if (defaultId) {
        const template = await getTemplateById(defaultId);
        expect(template).toBeDefined();
      }
    });
  });

  describe('processTemplateVariables', () => {
    test('should replace firstName variable', () => {
      const template = 'Hello {{firstName}}, nice to meet you!';
      const variables = { firstName: 'John' };

      const result = processTemplateVariables(template, variables);

      expect(result).toBe('Hello John, nice to meet you!');
    });

    test('should replace lastName variable', () => {
      const template = 'Dear {{firstName}} {{lastName}},';
      const variables = { firstName: 'John', lastName: 'Doe' };

      const result = processTemplateVariables(template, variables);

      expect(result).toBe('Dear John Doe,');
    });

    test('should replace company variable', () => {
      const template = 'I noticed you work at {{company}}.';
      const variables = { company: 'Acme Inc' };

      const result = processTemplateVariables(template, variables);

      expect(result).toBe('I noticed you work at Acme Inc.');
    });

    test('should replace title variable', () => {
      const template = 'As a {{title}}, you might be interested.';
      const variables = { title: 'Software Engineer' };

      const result = processTemplateVariables(template, variables);

      expect(result).toBe('As a Software Engineer, you might be interested.');
    });

    test('should handle missing variables', () => {
      const template = 'Hello {{firstName}}!';
      const variables = {};

      const result = processTemplateVariables(template, variables);

      // Should either keep placeholder or remove it
      expect(result).not.toBe('Hello {{firstName}}!');
    });

    test('should handle multiple occurrences of same variable', () => {
      const template = '{{firstName}} is great. {{firstName}} rocks!';
      const variables = { firstName: 'John' };

      const result = processTemplateVariables(template, variables);

      expect(result).toBe('John is great. John rocks!');
    });

    test('should handle all variables together', () => {
      const template = 'Hi {{firstName}} {{lastName}} at {{company}} ({{title}})';
      const variables = {
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'TechCorp',
        title: 'CTO'
      };

      const result = processTemplateVariables(template, variables);

      expect(result).toBe('Hi Jane Smith at TechCorp (CTO)');
    });

    test('should handle template without variables', () => {
      const template = 'This is a static message.';
      const variables = { firstName: 'John' };

      const result = processTemplateVariables(template, variables);

      expect(result).toBe('This is a static message.');
    });

    test('should handle empty template', () => {
      const result = processTemplateVariables('', { firstName: 'John' });

      expect(result).toBe('');
    });

    test('should handle null/undefined variables', () => {
      const template = 'Hello {{firstName}}!';

      const result1 = processTemplateVariables(template, null);
      const result2 = processTemplateVariables(template, undefined);

      // Should not throw
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });
  });

  describe('Template Validation', () => {
    test('should validate template name is not empty', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();

      await expect(saveMessageTemplate({ name: '', content: 'Test' }))
        .rejects.toThrow();
    });

    test('should validate template content is not empty', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();

      await expect(saveMessageTemplate({ name: 'Test', content: '' }))
        .rejects.toThrow();
    });

    test('should validate template content length', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();

      const longContent = 'a'.repeat(5000); // Very long message

      await expect(saveMessageTemplate({ name: 'Test', content: longContent }))
        .rejects.toThrow();
    });
  });
});
