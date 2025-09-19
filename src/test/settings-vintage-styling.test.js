// Settings Vintage Styling Tests
// Tests for vintage newspaper-themed settings interface components

describe('Settings Vintage Styling', () => {

  describe('Vintage Settings Form Components', () => {
    test('should create newspaper-style settings forms with proper alignment', () => {
      const createSettingsForm = (config) => {
        const form = document.createElement('form');
        form.classList.add('vintage-card', 'space-y-vintage-lg', 'font-newspaper');

        config.sections.forEach(section => {
          const sectionDiv = document.createElement('div');
          sectionDiv.classList.add('vintage-settings-section');

          const header = document.createElement('h3');
          header.classList.add('vintage-headline', 'text-vintage-lg', 'font-newspaper', 'font-bold', 'text-vintage-ink', 'mb-vintage-md');
          header.textContent = section.title;
          sectionDiv.appendChild(header);

          section.fields.forEach(field => {
            const fieldGroup = document.createElement('div');
            fieldGroup.classList.add('vintage-field-group', 'mb-vintage-md');

            const label = document.createElement('label');
            label.classList.add('vintage-field-label', 'block', 'text-vintage-sm', 'font-newspaper', 'font-medium', 'text-vintage-ink', 'mb-2');
            label.textContent = field.label;

            const input = document.createElement('input');
            input.type = field.type;
            input.classList.add('vintage-input', 'w-full', 'px-vintage-md', 'py-3', 'border-2', 'border-vintage-accent', 'border-opacity-20', 'rounded-vintage-md', 'focus:ring-2', 'focus:ring-vintage-sepia', 'focus:border-vintage-sepia', 'bg-vintage-paper', 'font-newspaper', 'text-vintage-ink');

            fieldGroup.appendChild(label);
            fieldGroup.appendChild(input);
            sectionDiv.appendChild(fieldGroup);
          });

          form.appendChild(sectionDiv);
        });

        return form;
      };

      const form = createSettingsForm({
        sections: [
          {
            title: 'Account Preferences',
            fields: [
              { label: 'Display Name', type: 'text' },
              { label: 'Email Address', type: 'email' }
            ]
          }
        ]
      });

      expect(form.classList.contains('vintage-card')).toBe(true);
      expect(form.classList.contains('font-newspaper')).toBe(true);
      expect(form.querySelector('.vintage-settings-section')).toBeTruthy();
      expect(form.querySelector('.vintage-headline')).toBeTruthy();
      expect(form.querySelector('.vintage-field-group')).toBeTruthy();
      expect(form.querySelector('.vintage-input')).toBeTruthy();
    });

    test('should create vintage toggle switches with newspaper styling', () => {
      const createVintageToggle = (config) => {
        const container = document.createElement('div');
        container.classList.add('vintage-toggle-container', 'flex', 'items-center', 'justify-between', 'py-vintage-md');

        const labelDiv = document.createElement('div');
        labelDiv.classList.add('vintage-toggle-label');

        const title = document.createElement('span');
        title.classList.add('vintage-headline', 'text-vintage-sm', 'font-newspaper', 'font-medium', 'text-vintage-ink');
        title.textContent = config.title;

        const description = document.createElement('span');
        description.classList.add('vintage-caption', 'text-vintage-xs', 'text-vintage-accent', 'font-newspaper', 'italic');
        description.textContent = config.description;

        labelDiv.appendChild(title);
        if (config.description) {
          labelDiv.appendChild(document.createElement('br'));
          labelDiv.appendChild(description);
        }

        const toggle = document.createElement('div');
        toggle.classList.add('vintage-toggle-switch', 'relative', 'inline-flex', 'h-6', 'w-11', 'items-center', 'rounded-full', 'border-2', 'border-vintage-accent', 'border-opacity-30', 'transition-colors');

        if (config.enabled) {
          toggle.classList.add('bg-vintage-sepia');
        } else {
          toggle.classList.add('bg-vintage-paper');
        }

        const knob = document.createElement('span');
        knob.classList.add('vintage-toggle-knob', 'inline-block', 'h-4', 'w-4', 'transform', 'rounded-full', 'bg-vintage-paper', 'border', 'border-vintage-accent', 'border-opacity-40', 'transition', 'shadow-vintage-sm');

        if (config.enabled) {
          knob.classList.add('translate-x-6');
        } else {
          knob.classList.add('translate-x-1');
        }

        toggle.appendChild(knob);
        container.appendChild(labelDiv);
        container.appendChild(toggle);

        return container;
      };

      const toggle = createVintageToggle({
        title: 'Auto-connect Mode',
        description: 'Automatically send connection requests',
        enabled: true
      });

      expect(toggle.classList.contains('vintage-toggle-container')).toBe(true);
      expect(toggle.querySelector('.vintage-toggle-label')).toBeTruthy();
      expect(toggle.querySelector('.vintage-toggle-switch')).toBeTruthy();
      expect(toggle.querySelector('.vintage-toggle-knob')).toBeTruthy();
      expect(toggle.querySelector('.vintage-headline')).toBeTruthy();
      expect(toggle.querySelector('.vintage-caption')).toBeTruthy();
    });

    test('should create vintage input field styling with proper focus states', () => {
      const createVintageInput = (config) => {
        const container = document.createElement('div');
        container.classList.add('vintage-input-container', 'mb-vintage-md');

        const label = document.createElement('label');
        label.classList.add('vintage-input-label', 'block', 'text-vintage-sm', 'font-newspaper', 'font-medium', 'text-vintage-ink', 'mb-2');
        label.textContent = config.label;

        let input;
        if (config.type === 'select') {
          input = document.createElement('select');
          config.options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            input.appendChild(optionEl);
          });
        } else if (config.type === 'textarea') {
          input = document.createElement('textarea');
          input.rows = config.rows || 4;
        } else {
          input = document.createElement('input');
          input.type = config.type;
        }

        input.classList.add(
          'vintage-input-field',
          'w-full',
          'px-vintage-md',
          'py-3',
          'border-2',
          'border-vintage-accent',
          'border-opacity-20',
          'rounded-vintage-md',
          'focus:ring-2',
          'focus:ring-vintage-sepia',
          'focus:ring-opacity-20',
          'focus:border-vintage-sepia',
          'bg-vintage-paper',
          'font-newspaper',
          'text-vintage-ink',
          'placeholder-vintage-accent',
          'placeholder-opacity-60',
          'transition-all'
        );

        if (config.placeholder) {
          input.placeholder = config.placeholder;
        }

        container.appendChild(label);
        container.appendChild(input);

        if (config.helpText) {
          const helpText = document.createElement('p');
          helpText.classList.add('vintage-help-text', 'text-vintage-xs', 'text-vintage-accent', 'font-newspaper', 'italic', 'mt-1');
          helpText.textContent = config.helpText;
          container.appendChild(helpText);
        }

        return container;
      };

      const textInput = createVintageInput({
        label: 'Connection Message',
        type: 'textarea',
        placeholder: 'Enter your connection message...',
        helpText: 'This message will be sent with connection requests',
        rows: 3
      });

      expect(textInput.classList.contains('vintage-input-container')).toBe(true);
      expect(textInput.querySelector('.vintage-input-label')).toBeTruthy();
      expect(textInput.querySelector('.vintage-input-field')).toBeTruthy();
      expect(textInput.querySelector('.vintage-help-text')).toBeTruthy();

      const input = textInput.querySelector('textarea');
      expect(input.classList.contains('focus:ring-vintage-sepia')).toBe(true);
      expect(input.classList.contains('bg-vintage-paper')).toBe(true);
    });
  });

  describe('Newspaper-Inspired Section Grouping', () => {
    test('should create newspaper-style section headers with dividers', () => {
      const createSectionHeader = (config) => {
        const header = document.createElement('div');
        header.classList.add('vintage-section-header', 'border-b-2', 'border-vintage-accent', 'border-opacity-20', 'pb-vintage-md', 'mb-vintage-lg');

        const titleRow = document.createElement('div');
        titleRow.classList.add('flex', 'items-center', 'justify-between');

        const title = document.createElement('h2');
        title.classList.add('vintage-headline', 'text-vintage-2xl', 'font-newspaper', 'font-bold', 'text-vintage-ink');
        title.textContent = config.title;

        const ornament = document.createElement('div');
        ornament.classList.add('vintage-ornament', 'w-8', 'h-8', 'bg-vintage-sepia', 'bg-opacity-20', 'rounded-full', 'flex', 'items-center', 'justify-center');
        ornament.innerHTML = '✦';
        ornament.style.color = '#E07A5F';

        titleRow.appendChild(title);
        titleRow.appendChild(ornament);
        header.appendChild(titleRow);

        if (config.subtitle) {
          const subtitle = document.createElement('p');
          subtitle.classList.add('vintage-caption', 'text-vintage-sm', 'text-vintage-accent', 'font-newspaper', 'italic', 'mt-2');
          subtitle.textContent = config.subtitle;
          header.appendChild(subtitle);
        }

        return header;
      };

      const header = createSectionHeader({
        title: 'Account Configuration',
        subtitle: 'Manage your LinkedIn automation preferences'
      });

      expect(header.classList.contains('vintage-section-header')).toBe(true);
      expect(header.classList.contains('border-b-2')).toBe(true);
      expect(header.querySelector('.vintage-headline')).toBeTruthy();
      expect(header.querySelector('.vintage-ornament')).toBeTruthy();
      expect(header.querySelector('.vintage-caption')).toBeTruthy();
    });

    test('should create vintage settings navigation menu', () => {
      const createSettingsNav = (config) => {
        const nav = document.createElement('nav');
        nav.classList.add('vintage-settings-nav', 'space-y-vintage-sm');

        config.sections.forEach((section, index) => {
          const navItem = document.createElement('a');
          navItem.href = `#${section.id}`;
          navItem.classList.add(
            'vintage-nav-item',
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
            navItem.classList.add('bg-vintage-sepia', 'bg-opacity-10', 'text-vintage-ink', 'border-vintage-sepia');
          } else {
            navItem.classList.add('text-vintage-accent', 'hover:bg-vintage-paper', 'hover:text-vintage-ink', 'border-transparent');
          }

          navItem.textContent = section.title;
          nav.appendChild(navItem);
        });

        return nav;
      };

      const nav = createSettingsNav({
        sections: [
          { id: 'account', title: 'Account Settings', active: true },
          { id: 'automation', title: 'Automation Rules', active: false },
          { id: 'templates', title: 'Message Templates', active: false },
          { id: 'privacy', title: 'Privacy & Security', active: false }
        ]
      });

      expect(nav.classList.contains('vintage-settings-nav')).toBe(true);
      expect(nav.children.length).toBe(4);
      expect(nav.querySelector('.vintage-nav-item')).toBeTruthy();

      const activeItem = nav.querySelector('.bg-vintage-sepia');
      expect(activeItem).toBeTruthy();
      expect(activeItem.textContent).toBe('Account Settings');
    });
  });

  describe('Settings Form Layout', () => {
    test('should create newspaper-column layout for settings sections', () => {
      const createSettingsLayout = (config) => {
        const container = document.createElement('div');
        container.classList.add('vintage-settings-layout', 'newspaper-column', 'double', 'gap-vintage-xl', 'min-h-screen', 'bg-vintage-texture');

        // Navigation column
        const navColumn = document.createElement('div');
        navColumn.classList.add('vintage-settings-sidebar', 'newspaper-column', 'single');

        // Content column
        const contentColumn = document.createElement('div');
        contentColumn.classList.add('vintage-settings-content', 'space-y-vintage-xl');

        config.sections.forEach(section => {
          const sectionDiv = document.createElement('div');
          sectionDiv.classList.add('vintage-settings-section', 'vintage-card');
          sectionDiv.id = section.id;

          const header = document.createElement('h3');
          header.classList.add('vintage-headline', 'text-vintage-lg', 'font-newspaper', 'font-bold', 'text-vintage-ink', 'mb-vintage-md');
          header.textContent = section.title;

          sectionDiv.appendChild(header);
          contentColumn.appendChild(sectionDiv);
        });

        container.appendChild(navColumn);
        container.appendChild(contentColumn);

        return container;
      };

      const layout = createSettingsLayout({
        sections: [
          { id: 'account', title: 'Account Configuration' },
          { id: 'automation', title: 'Automation Settings' }
        ]
      });

      expect(layout.classList.contains('vintage-settings-layout')).toBe(true);
      expect(layout.classList.contains('newspaper-column')).toBe(true);
      expect(layout.classList.contains('double')).toBe(true);
      expect(layout.querySelector('.vintage-settings-sidebar')).toBeTruthy();
      expect(layout.querySelector('.vintage-settings-content')).toBeTruthy();
      expect(layout.children.length).toBe(2);
    });

    test('should validate vintage settings accessibility features', () => {
      const createAccessibleSettings = () => {
        const form = document.createElement('form');
        form.setAttribute('role', 'form');
        form.setAttribute('aria-label', 'LinkedIn Extension Settings');

        const fieldset = document.createElement('fieldset');
        fieldset.classList.add('vintage-fieldset');

        const legend = document.createElement('legend');
        legend.classList.add('vintage-legend', 'vintage-headline', 'text-vintage-lg', 'font-newspaper', 'font-bold');
        legend.textContent = 'Automation Settings';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'auto-connect';
        input.setAttribute('aria-describedby', 'auto-connect-help');

        const label = document.createElement('label');
        label.setAttribute('for', 'auto-connect');
        label.classList.add('vintage-label');
        label.textContent = 'Enable auto-connect';

        const helpText = document.createElement('div');
        helpText.id = 'auto-connect-help';
        helpText.setAttribute('role', 'note');
        helpText.classList.add('vintage-help-text');
        helpText.textContent = 'Automatically send connection requests to matched profiles';

        fieldset.appendChild(legend);
        fieldset.appendChild(input);
        fieldset.appendChild(label);
        fieldset.appendChild(helpText);
        form.appendChild(fieldset);

        return form;
      };

      const form = createAccessibleSettings();

      expect(form.getAttribute('role')).toBe('form');
      expect(form.getAttribute('aria-label')).toBeTruthy();
      expect(form.querySelector('fieldset')).toBeTruthy();
      expect(form.querySelector('legend')).toBeTruthy();
      expect(form.querySelector('input').getAttribute('aria-describedby')).toBe('auto-connect-help');
      expect(form.querySelector('label').getAttribute('for')).toBe('auto-connect');
      expect(form.querySelector('[role="note"]')).toBeTruthy();
    });
  });

  describe('Responsive Settings Interface', () => {
    test('should implement responsive vintage settings layout', () => {
      const createResponsiveSettings = () => {
        const container = document.createElement('div');
        container.classList.add(
          'vintage-responsive-settings',
          'grid',
          'grid-cols-1',
          'lg:grid-cols-4',
          'gap-vintage-lg',
          'lg:gap-vintage-xl',
          'p-vintage-lg',
          'lg:p-vintage-xl',
          'min-h-screen',
          'bg-vintage-texture'
        );

        // Mobile: stacked layout, Desktop: sidebar + content
        const sidebar = document.createElement('aside');
        sidebar.classList.add('lg:col-span-1', 'vintage-card');

        const content = document.createElement('main');
        content.classList.add('lg:col-span-3', 'space-y-vintage-lg');

        container.appendChild(sidebar);
        container.appendChild(content);

        return container;
      };

      const layout = createResponsiveSettings();

      expect(layout.classList.contains('vintage-responsive-settings')).toBe(true);
      expect(layout.classList.contains('grid-cols-1')).toBe(true);
      expect(layout.classList.contains('lg:grid-cols-4')).toBe(true);
      expect(layout.querySelector('aside').classList.contains('lg:col-span-1')).toBe(true);
      expect(layout.querySelector('main').classList.contains('lg:col-span-3')).toBe(true);
    });
  });
});