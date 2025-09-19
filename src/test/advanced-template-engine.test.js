// Advanced Template Engine Tests - Task 3.1
// Tests for complex variable substitution, conditional logic, and personalization

import {
  processAdvancedTemplate,
  evaluateTemplateConditions,
  extractProfileMetadata,
  calculatePersonalizationScore,
  optimizeTemplatePerformance,
  validateAdvancedVariables,
  renderTemplateWithFallbacks
} from '../utils/advanced-template-engine.js';

describe('Advanced Template Engine - Task 3.1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complex Variable Substitution', () => {
    test('should handle nested profile data variables', async () => {
      const template =
        'Hi {{profile.name}}, I see you work at {{profile.company.name}} in {{profile.location.city}}.';
      const profileData = {
        profile: {
          name: 'John Doe',
          company: { name: 'Tech Corp', industry: 'Technology' },
          location: { city: 'San Francisco', state: 'CA' }
        }
      };

      const result = await processAdvancedTemplate(template, profileData);
      expect(result).toBe('Hi John Doe, I see you work at Tech Corp in San Francisco.');
    });

    test('should handle mutual connections data', async () => {
      const template =
        'Hi {{name}}, I noticed we have {{mutualConnections.count}} mutual connections including {{mutualConnections.featured.0.name}}.';
      const profileData = {
        name: 'Jane Smith',
        mutualConnections: {
          count: 5,
          featured: [
            { name: 'Alice Johnson', title: 'Manager' },
            { name: 'Bob Wilson', title: 'Director' }
          ]
        }
      };

      const result = await processAdvancedTemplate(template, profileData);
      expect(result).toBe(
        'Hi Jane Smith, I noticed we have 5 mutual connections including Alice Johnson.'
      );
    });

    test('should handle array iteration in templates', async () => {
      const template =
        'Your skills in {{#each skills}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} are impressive.';
      const profileData = {
        skills: [
          { name: 'JavaScript', endorsements: 15 },
          { name: 'React', endorsements: 12 },
          { name: 'Node.js', endorsements: 8 }
        ]
      };

      const result = await processAdvancedTemplate(template, profileData);
      expect(result).toBe('Your skills in JavaScript, React, Node.js are impressive.');
    });

    test('should handle date and time formatting', async () => {
      const template = 'I see you started at {{company}} {{formatDate startDate "MMM YYYY"}}.';
      const profileData = {
        company: 'Tech Corp',
        startDate: new Date('2022-03-15T00:00:00Z')
      };

      const result = await processAdvancedTemplate(template, profileData);
      expect(result).toContain('Mar 2022');
    });

    test('should handle numeric formatting and calculations', async () => {
      const template =
        'With {{add experience.years education.years}} years of combined experience and education.';
      const profileData = {
        experience: { years: 8 },
        education: { years: 4 }
      };

      const result = await processAdvancedTemplate(template, profileData);
      expect(result).toBe('With 12 years of combined experience and education.');
    });
  });

  describe('Conditional Logic and Personalization', () => {
    test('should evaluate simple conditional expressions', async () => {
      const conditions = [
        { expression: 'profile.industry === "Technology"', weight: 0.3 },
        { expression: 'profile.location.city === "San Francisco"', weight: 0.2 },
        { expression: 'mutualConnections.count > 3', weight: 0.5 }
      ];

      const profileData = {
        profile: { industry: 'Technology', location: { city: 'San Francisco' } },
        mutualConnections: { count: 5 }
      };

      const result = await evaluateTemplateConditions(conditions, profileData);
      expect(result.matched).toEqual([true, true, true]);
      expect(result.score).toBe(1.0);
    });

    test('should handle complex boolean logic', async () => {
      const template = `{{#if (and (eq profile.industry "Technology") (gt experience.years 5))}}
        I'm impressed by your {{experience.years}} years in tech.
      {{else if (eq profile.industry "Finance")}}
        Your finance background is interesting.
      {{else}}
        I'd love to learn more about your experience.
      {{/if}}`;

      const profileData = {
        profile: { industry: 'Technology' },
        experience: { years: 8 }
      };

      const result = await processAdvancedTemplate(template, profileData);
      expect(result.trim()).toBe("I'm impressed by your 8 years in tech.");
    });

    test('should handle template personalization scoring', async () => {
      const template =
        'Hi {{name}}, I see we both work in {{industry}} and have {{mutualConnections.count}} connections in common.';
      const profileData = {
        name: 'John Doe',
        industry: 'Technology',
        mutualConnections: { count: 3 }
      };

      const score = await calculatePersonalizationScore(template, profileData);
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    test('should provide fallback values for missing data', async () => {
      const template =
        'Hi {{name || "there"}}, interested in connecting about {{industry || "your field"}}.';
      const profileData = {
        name: 'John Doe'
        // industry is missing
      };

      const result = await renderTemplateWithFallbacks(template, profileData);
      expect(result).toBe('Hi John Doe, interested in connecting about your field.');
    });

    test('should handle multiple fallback options', async () => {
      const template =
        'Regarding {{company.name || profile.currentCompany || "your current role"}}.';
      const profileData = {
        profile: { currentCompany: 'Tech Startup' }
        // company.name is missing
      };

      const result = await renderTemplateWithFallbacks(template, profileData);
      expect(result).toBe('Regarding Tech Startup.');
    });
  });

  describe('Profile Metadata Extraction', () => {
    test('should extract comprehensive profile metadata', async () => {
      const linkedInProfile = {
        name: 'Jane Smith',
        headline: 'Senior Software Engineer at Tech Corp',
        location: 'San Francisco Bay Area',
        connections: '500+',
        experience: [
          { company: 'Tech Corp', title: 'Senior Software Engineer', duration: '2 years' },
          { company: 'StartupXYZ', title: 'Software Developer', duration: '3 years' }
        ],
        education: [{ school: 'Stanford University', degree: 'MS Computer Science' }],
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        mutualConnections: 8
      };

      const metadata = await extractProfileMetadata(linkedInProfile);

      expect(metadata).toMatchObject({
        personalInfo: {
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          headline: 'Senior Software Engineer at Tech Corp'
        },
        professional: {
          currentTitle: 'Senior Software Engineer',
          currentCompany: 'Tech Corp',
          industry: expect.any(String),
          experienceYears: expect.any(Number)
        },
        social: {
          connectionCount: expect.any(Number),
          mutualConnections: 8,
          networkStrength: expect.any(String)
        },
        targeting: {
          seniority: expect.any(String),
          likelihood: expect.any(Number),
          personalizationFactors: expect.any(Array)
        }
      });
    });

    test('should handle incomplete profile data gracefully', async () => {
      const incompleteProfile = {
        name: 'John Doe',
        headline: 'Software Developer'
        // Missing most fields
      };

      const metadata = await extractProfileMetadata(incompleteProfile);

      expect(metadata.personalInfo.name).toBe('John Doe');
      expect(metadata.professional.currentTitle).toBe('Software Developer');
      expect(metadata.targeting.likelihood).toBeGreaterThan(0);
    });

    test('should identify key personalization opportunities', async () => {
      const profile = {
        name: 'Alice Johnson',
        experience: [{ company: 'Google', title: 'Product Manager' }],
        education: [{ school: 'MIT', degree: 'MBA' }],
        mutualConnections: 12
      };

      const metadata = await extractProfileMetadata(profile);
      const factors = metadata.targeting.personalizationFactors;

      expect(factors).toContain('high_mutual_connections');
      expect(factors).toContain('prestigious_company');
      expect(factors).toContain('notable_education');
    });
  });

  describe('Template Performance Optimization', () => {
    test('should optimize template rendering performance', async () => {
      const template =
        'Complex template with {{name}} and {{#each skills}}{{name}}{{/each}} and {{company.name}}.';
      const profileData = {
        name: 'John Doe',
        skills: Array(100)
          .fill(0)
          .map((_, i) => ({ name: `Skill${i}` })),
        company: { name: 'Tech Corp' }
      };

      const startTime = Date.now();
      const result = await optimizeTemplatePerformance(template, profileData);
      const endTime = Date.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(100); // Should render in < 100ms
    });

    test('should cache compiled template functions', async () => {
      const template = 'Hi {{name}}, working at {{company}}.';
      const profileData1 = { name: 'John', company: 'Corp1' };
      const profileData2 = { name: 'Jane', company: 'Corp2' };

      // First render - should compile and cache
      const start1 = Date.now();
      await optimizeTemplatePerformance(template, profileData1);
      const time1 = Date.now() - start1;

      // Second render - should use cached version
      const start2 = Date.now();
      await optimizeTemplatePerformance(template, profileData2);
      const time2 = Date.now() - start2;

      expect(time2).toBeLessThan(time1); // Second render should be faster
    });

    test('should handle memory-efficient batch processing', async () => {
      const template = 'Hi {{name}} from {{company}}.';
      const profiles = Array(1000)
        .fill(0)
        .map((_, i) => ({
          name: `Person${i}`,
          company: `Company${i}`
        }));

      const results = await optimizeTemplatePerformance(template, profiles, { batch: true });

      expect(results).toHaveLength(1000);
      expect(results[0]).toContain('Person0');
      expect(results[999]).toContain('Person999');
    });
  });

  describe('Advanced Variable Validation', () => {
    test('should validate template variable syntax', async () => {
      const validTemplate = 'Hi {{name}}, interested in {{company.name}}.';
      const invalidTemplate = 'Hi {{name}, missing closing brace {{company.name.';

      const validResult = await validateAdvancedVariables(validTemplate);
      const invalidResult = await validateAdvancedVariables(invalidTemplate);

      expect(validResult.isValid).toBe(true);
      expect(validResult.variables).toEqual(['name', 'company.name']);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Unclosed variable bracket');
    });

    test('should identify undefined variable references', async () => {
      const template = 'Hi {{name}}, working at {{company.name}} in {{location.city}}.';
      const profileData = {
        name: 'John Doe',
        company: { name: 'Tech Corp' }
        // location.city is missing
      };

      const result = await validateAdvancedVariables(template, profileData);

      expect(result.missingVariables).toContain('location.city');
      expect(result.availableVariables).toEqual(['name', 'company.name']);
    });

    test('should suggest alternative variable names', async () => {
      const template = 'Hi {{fullName}}, at {{companyName}}.';
      const profileData = {
        name: 'John Doe', // available as 'name' not 'fullName'
        company: { name: 'Tech Corp' } // available as 'company.name' not 'companyName'
      };

      const result = await validateAdvancedVariables(template, profileData);

      expect(result.suggestions).toContainEqual({
        requested: 'fullName',
        suggested: 'name',
        confidence: expect.any(Number)
      });

      expect(result.suggestions).toContainEqual({
        requested: 'companyName',
        suggested: 'company.name',
        confidence: expect.any(Number)
      });
    });

    test('should validate conditional expression syntax', async () => {
      const validConditions = [
        'profile.industry === "Technology"',
        'experience.years > 5',
        'mutualConnections.count >= 3'
      ];

      const invalidConditions = [
        'profile.industry = "Technology"', // Single equals
        'experience.years >> 5', // Invalid operator
        'mutualConnections.count >==' // Incomplete operator
      ];

      for (const condition of validConditions) {
        const result = await validateAdvancedVariables(`{{#if ${condition}}}test{{/if}}`);
        expect(result.isValid).toBe(true);
      }

      for (const condition of invalidConditions) {
        const result = await validateAdvancedVariables(`{{#if ${condition}}}test{{/if}}`);
        expect(result.isValid).toBe(false);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle circular reference in profile data', async () => {
      const profileData = {
        name: 'John Doe',
        company: { name: 'Tech Corp' }
      };
      // Create circular reference
      profileData.company.employee = profileData;

      const template = 'Hi {{name}} from {{company.name}}.';
      const result = await processAdvancedTemplate(template, profileData);

      expect(result).toBe('Hi John Doe from Tech Corp.');
    });

    test('should handle very large profile datasets', async () => {
      const largeProfileData = {
        name: 'John Doe',
        connections: Array(10000)
          .fill(0)
          .map((_, i) => ({
            name: `Connection${i}`,
            company: `Company${i}`
          }))
      };

      const template = 'Hi {{name}}, you have {{connections.length}} connections.';
      const result = await processAdvancedTemplate(template, largeProfileData);

      expect(result).toBe('Hi John Doe, you have 10000 connections.');
    });

    test('should handle malformed JSON data gracefully', async () => {
      const template = 'Hi {{name}} from {{company}}.';
      const malformedData = '{"name": "John", "company": unclosed';

      const result = await processAdvancedTemplate(template, malformedData);

      expect(result).toContain('template processing error');
    });

    test('should limit recursion depth in nested data', async () => {
      const deeplyNested = { level0: {} };
      let current = deeplyNested.level0;

      // Create 100 levels of nesting
      for (let i = 1; i < 100; i++) {
        current[`level${i}`] = {};
        current = current[`level${i}`];
      }
      current.name = 'Deep Name';

      const template = 'Deep: {{level0.level1.level2.name}}.';
      const result = await processAdvancedTemplate(template, deeplyNested);

      expect(result).toBeDefined();
    });
  });

  describe('A/B Testing Framework Integration', () => {
    test('should support template variant selection', async () => {
      const templateVariants = [
        { id: 'A', template: "Hi {{name}}, let's connect!" },
        { id: 'B', template: "Hello {{name}}, I'd love to connect." },
        { id: 'C', template: 'Hey {{name}}, interested in connecting?' }
      ];

      const profileData = { name: 'John Doe' };

      // Test that we get consistent variant selection for same profile
      const result1 = await processAdvancedTemplate(templateVariants, profileData, {
        abTest: true
      });
      const result2 = await processAdvancedTemplate(templateVariants, profileData, {
        abTest: true
      });

      expect(result1).toBe(result2);
      expect([
        "Hi John Doe, let's connect!",
        "Hello John Doe, I'd love to connect.",
        'Hey John Doe, interested in connecting?'
      ]).toContain(result1);
    });

    test('should track template performance metrics', async () => {
      const template = "Hi {{name}}, let's connect!";
      const profileData = { name: 'John Doe' };

      const result = await processAdvancedTemplate(template, profileData, {
        trackPerformance: true,
        templateId: 'test-template-001'
      });

      expect(result.message).toBe("Hi John Doe, let's connect!");
      expect(result.performance).toMatchObject({
        renderTime: expect.any(Number),
        templateId: 'test-template-001',
        variableCount: expect.any(Number),
        personalizationScore: expect.any(Number)
      });
    });
  });
});
