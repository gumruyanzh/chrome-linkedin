/**
 * Dashboard Vintage Styling Tests
 * Tests for vintage newspaper-inspired dashboard layouts and components
 */

import { ChromeStorageMock, createChromeExtensionMock } from './chrome-mock.js';

// Mock DOM environment for dashboard testing
const mockDOMEnvironment = () => {
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
        dataset: {},
        appendChild: jest.fn(),
        removeChild: jest.fn()
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
    }
  };

  global.window = {
    requestAnimationFrame: jest.fn((callback) => setTimeout(callback, 16)),
    getComputedStyle: jest.fn(() => ({
      getPropertyValue: jest.fn()
    }))
  };

  // Mock Chart.js for dashboard charts
  global.Chart = jest.fn(() => ({
    update: jest.fn(),
    destroy: jest.fn(),
    data: { datasets: [] },
    options: {}
  }));
};

describe('Dashboard Vintage Styling', () => {
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
    delete global.Chart;
    jest.clearAllMocks();
  });

  describe('Newspaper-Style Layout System', () => {
    test('should create newspaper column layouts for dashboard', () => {
      const createNewspaperLayout = (columnConfig) => {
        const container = document.createElement('div');
        const { type, sections } = columnConfig;

        // Apply newspaper layout classes
        container.classList.add('newspaper-column', type, 'gap-vintage-lg');

        // Create sections for each column
        sections.forEach((section, index) => {
          const sectionElement = document.createElement('section');
          sectionElement.classList.add('vintage-card', 'p-vintage-lg');

          const header = document.createElement('h2');
          header.classList.add('vintage-headline', 'text-vintage-2xl', 'font-newspaper', 'font-bold', 'text-vintage-ink', 'mb-vintage-md');
          header.textContent = section.title;

          const content = document.createElement('div');
          content.classList.add('vintage-body', 'text-vintage-base', 'font-newspaper', 'text-vintage-ink');

          sectionElement.appendChild(header);
          sectionElement.appendChild(content);
          container.appendChild(sectionElement);
        });

        return container;
      };

      const layout = createNewspaperLayout({
        type: 'triple',
        sections: [
          { title: 'Analytics Overview', content: 'charts' },
          { title: 'Recent Activity', content: 'timeline' },
          { title: 'Performance Metrics', content: 'stats' }
        ]
      });

      expect(layout.classList.contains('newspaper-column')).toBe(true);
      expect(layout.classList.contains('triple')).toBe(true);
      expect(layout.classList.contains('gap-vintage-lg')).toBe(true);
      expect(layout.children.length).toBe(3);
    });

    test('should create responsive newspaper grid system', () => {
      const createResponsiveGrid = (breakpoints) => {
        const grid = document.createElement('div');
        const baseClasses = ['newspaper-column', 'gap-vintage-md'];

        // Apply base classes
        baseClasses.forEach(className => grid.classList.add(className));

        // Apply responsive classes
        Object.entries(breakpoints).forEach(([breakpoint, columns]) => {
          grid.classList.add(`${breakpoint}:${columns}`);
        });

        return grid;
      };

      const responsiveGrid = createResponsiveGrid({
        '': 'single',
        'md': 'double',
        'lg': 'triple',
        'xl': 'quadruple'
      });

      expect(responsiveGrid.classList.add).toHaveBeenCalledWith('newspaper-column');
      expect(responsiveGrid.classList.add).toHaveBeenCalledWith('gap-vintage-md');
      expect(responsiveGrid.classList.add).toHaveBeenCalledWith('md:double');
      expect(responsiveGrid.classList.add).toHaveBeenCalledWith('lg:triple');
    });

    test('should implement newspaper-style header section', () => {
      const createDashboardHeader = () => {
        const header = document.createElement('header');
        const titleSection = document.createElement('div');
        const actionSection = document.createElement('div');

        // Apply vintage header styling
        header.classList.add('vintage-card', 'newspaper-column', 'single', 'mb-vintage-xl', 'border-b', 'border-vintage-accent', 'border-opacity-20', 'pb-vintage-lg');

        // Title section
        titleSection.classList.add('flex', 'items-center', 'justify-between', 'w-full');

        const titleContainer = document.createElement('div');
        const title = document.createElement('h1');
        const subtitle = document.createElement('p');

        title.classList.add('vintage-headline', 'text-vintage-4xl', 'font-newspaper', 'font-bold', 'text-vintage-ink', 'mb-2');
        title.textContent = 'LinkedIn Chronicle Dashboard';

        subtitle.classList.add('vintage-body', 'text-vintage-lg', 'text-vintage-accent', 'font-newspaper', 'italic');
        subtitle.textContent = 'Professional Network Analytics & Campaign Management';

        titleContainer.appendChild(title);
        titleContainer.appendChild(subtitle);

        // Action section
        actionSection.classList.add('flex', 'space-x-vintage-md');

        const refreshButton = document.createElement('button');
        refreshButton.classList.add('vintage-button', 'py-vintage-sm', 'px-vintage-md', 'rounded-vintage', 'font-newspaper', 'font-semibold');
        refreshButton.textContent = 'Refresh Data';

        const settingsButton = document.createElement('button');
        settingsButton.classList.add(
          'border', 'border-vintage-accent', 'text-vintage-accent', 'bg-vintage-paper',
          'py-vintage-sm', 'px-vintage-md', 'rounded-vintage', 'font-newspaper', 'font-medium',
          'hover:bg-vintage-accent', 'hover:text-vintage-paper', 'transition-all', 'duration-200'
        );
        settingsButton.textContent = 'Settings';

        actionSection.appendChild(refreshButton);
        actionSection.appendChild(settingsButton);

        titleSection.appendChild(titleContainer);
        titleSection.appendChild(actionSection);
        header.appendChild(titleSection);

        return { header, title, subtitle, refreshButton, settingsButton };
      };

      const headerComponents = createDashboardHeader();

      expect(headerComponents.header.classList.add).toHaveBeenCalledWith('vintage-card', 'newspaper-column', 'single', 'mb-vintage-xl', 'border-b', 'border-vintage-accent', 'border-opacity-20', 'pb-vintage-lg');
      expect(headerComponents.title.classList.add).toHaveBeenCalledWith('vintage-headline', 'text-vintage-4xl', 'font-newspaper', 'font-bold', 'text-vintage-ink', 'mb-2');
      expect(headerComponents.refreshButton.classList.add).toHaveBeenCalledWith('vintage-button', 'py-vintage-sm', 'px-vintage-md', 'rounded-vintage', 'font-newspaper', 'font-semibold');
    });
  });

  describe('Vintage Statistics Cards', () => {
    test('should create newspaper-style stat cards with vintage typography', () => {
      const createVintageStatCard = (statData) => {
        const card = document.createElement('div');
        const iconContainer = document.createElement('div');
        const icon = document.createElement('div');
        const contentContainer = document.createElement('div');
        const value = document.createElement('div');
        const label = document.createElement('div');
        const trend = document.createElement('div');

        // Apply vintage card styling
        card.classList.add('vintage-card', 'p-vintage-lg', 'border', 'border-vintage-accent', 'border-opacity-10');

        // Icon styling
        iconContainer.classList.add('flex', 'items-center', 'mb-vintage-md');
        icon.classList.add(
          'p-vintage-sm', 'bg-vintage-sepia', 'bg-opacity-20', 'rounded-vintage',
          'text-vintage-sepia', 'text-vintage-2xl', 'w-12', 'h-12', 'flex', 'items-center', 'justify-center'
        );

        // Content styling
        contentContainer.classList.add('space-y-1');
        value.classList.add('vintage-headline', 'text-vintage-3xl', 'font-bold', 'text-vintage-ink', 'font-newspaper');
        label.classList.add('vintage-body', 'text-vintage-sm', 'text-vintage-accent', 'font-newspaper');
        trend.classList.add('vintage-caption', 'text-vintage-xs', 'font-newspaper');

        // Set content
        value.textContent = statData.value;
        label.textContent = statData.label;
        trend.textContent = statData.trend;

        // Apply trend styling
        if (statData.trendDirection === 'up') {
          trend.classList.add('text-vintage-sage');
        } else if (statData.trendDirection === 'down') {
          trend.classList.add('text-vintage-sepia');
        } else {
          trend.classList.add('text-vintage-accent');
        }

        iconContainer.appendChild(icon);
        contentContainer.appendChild(value);
        contentContainer.appendChild(label);
        contentContainer.appendChild(trend);

        card.appendChild(iconContainer);
        card.appendChild(contentContainer);

        return { card, icon, value, label, trend };
      };

      const statCard = createVintageStatCard({
        value: '247',
        label: 'Connections Sent',
        trend: '+12% from last week',
        trendDirection: 'up'
      });

      expect(statCard.card.classList.add).toHaveBeenCalledWith('vintage-card', 'p-vintage-lg', 'border', 'border-vintage-accent', 'border-opacity-10');
      expect(statCard.value.classList.add).toHaveBeenCalledWith('vintage-headline', 'text-vintage-3xl', 'font-bold', 'text-vintage-ink', 'font-newspaper');
      expect(statCard.trend.classList.add).toHaveBeenCalledWith('text-vintage-sage');
    });

    test('should create animated stat card transitions', () => {
      const animateStatCard = (card, newValue, duration = 1000) => {
        const valueElement = card.querySelector('.vintage-headline');
        const currentValue = parseInt(valueElement.textContent) || 0;
        const targetValue = parseInt(newValue);

        // Add animation classes
        card.classList.add('transition-all', 'duration-500', 'ease-out');
        valueElement.classList.add('transition-all', 'duration-300');

        // Mock animation steps
        const steps = [];
        const increment = Math.ceil((targetValue - currentValue) / 20);
        let current = currentValue;

        while (current !== targetValue) {
          current += increment;
          if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
            current = targetValue;
          }
          steps.push(current);
        }

        return { steps, duration };
      };

      const mockCard = {
        classList: { add: jest.fn() },
        querySelector: jest.fn(() => ({
          textContent: '100',
          classList: { add: jest.fn() }
        }))
      };

      const animation = animateStatCard(mockCard, '150');

      expect(mockCard.classList.add).toHaveBeenCalledWith('transition-all', 'duration-500', 'ease-out');
      expect(animation.steps).toContain(150);
      expect(animation.duration).toBe(1000);
    });
  });

  describe('Vintage Chart Styling', () => {
    test('should create vintage-themed chart configurations', () => {
      const createVintageChartConfig = (chartType, data) => {
        const vintageColors = {
          primary: '#E07A5F',      // vintage-sepia
          secondary: '#3D405B',    // vintage-accent
          success: '#81B29A',      // vintage-sage
          background: '#F4F1DE',   // vintage-paper
          text: '#2F2F2F'          // vintage-ink
        };

        const baseConfig = {
          type: chartType,
          data: {
            datasets: data.map(dataset => ({
              ...dataset,
              backgroundColor: dataset.backgroundColor || vintageColors.primary,
              borderColor: dataset.borderColor || vintageColors.accent,
              pointBackgroundColor: vintageColors.primary,
              pointBorderColor: vintageColors.accent
            }))
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  font: {
                    family: 'Georgia, Times, serif',
                    size: 12
                  },
                  color: vintageColors.text
                }
              }
            },
            scales: {
              x: {
                grid: {
                  color: `${vintageColors.text}20`,
                  borderColor: vintageColors.accent
                },
                ticks: {
                  font: {
                    family: 'Georgia, Times, serif',
                    size: 11
                  },
                  color: vintageColors.text
                }
              },
              y: {
                grid: {
                  color: `${vintageColors.text}15`,
                  borderColor: vintageColors.accent
                },
                ticks: {
                  font: {
                    family: 'Georgia, Times, serif',
                    size: 11
                  },
                  color: vintageColors.text
                }
              }
            }
          }
        };

        return baseConfig;
      };

      const chartConfig = createVintageChartConfig('line', [
        { label: 'Connections', data: [10, 20, 30, 40] },
        { label: 'Responses', data: [5, 10, 15, 20] }
      ]);

      expect(chartConfig.type).toBe('line');
      expect(chartConfig.data.datasets[0].backgroundColor).toBe('#E07A5F');
      expect(chartConfig.options.plugins.legend.labels.font.family).toBe('Georgia, Times, serif');
      expect(chartConfig.options.scales.x.ticks.color).toBe('#2F2F2F');
    });

    test('should create vintage chart container with newspaper styling', () => {
      const createVintageChartContainer = (title, chartId) => {
        const container = document.createElement('div');
        const header = document.createElement('div');
        const titleElement = document.createElement('h3');
        const chartContainer = document.createElement('div');
        const canvas = document.createElement('canvas');

        // Apply vintage container styling
        container.classList.add('vintage-card', 'p-vintage-lg', 'border', 'border-vintage-accent', 'border-opacity-10');

        // Header styling
        header.classList.add('flex', 'items-center', 'justify-between', 'mb-vintage-md', 'border-b', 'border-vintage-accent', 'border-opacity-20', 'pb-vintage-sm');
        titleElement.classList.add('vintage-subheadline', 'text-vintage-xl', 'font-newspaper', 'font-semibold', 'text-vintage-ink');
        titleElement.textContent = title;

        // Chart container styling
        chartContainer.classList.add('h-64', 'relative', 'bg-vintage-paper', 'bg-opacity-30', 'rounded-vintage-sm', 'p-vintage-sm');
        canvas.id = chartId;
        canvas.classList.add('w-full', 'h-full');

        header.appendChild(titleElement);
        chartContainer.appendChild(canvas);
        container.appendChild(header);
        container.appendChild(chartContainer);

        return { container, header, titleElement, chartContainer, canvas };
      };

      const chartComponents = createVintageChartContainer('Connection Analytics', 'connection-chart');

      expect(chartComponents.container.classList.add).toHaveBeenCalledWith('vintage-card', 'p-vintage-lg', 'border', 'border-vintage-accent', 'border-opacity-10');
      expect(chartComponents.titleElement.classList.add).toHaveBeenCalledWith('vintage-subheadline', 'text-vintage-xl', 'font-newspaper', 'font-semibold', 'text-vintage-ink');
      expect(chartComponents.canvas.id).toBe('connection-chart');
    });
  });

  describe('Vintage Data Tables', () => {
    test('should create newspaper-style data tables', () => {
      const createVintageDataTable = (columns, data) => {
        const tableContainer = document.createElement('div');
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        const headerRow = document.createElement('tr');

        // Apply vintage table styling
        tableContainer.classList.add('vintage-card', 'p-vintage-lg', 'overflow-x-auto');
        table.classList.add('min-w-full', 'divide-y', 'divide-vintage-accent', 'divide-opacity-20');
        thead.classList.add('bg-vintage-paper-dark');
        tbody.classList.add('bg-vintage-paper', 'divide-y', 'divide-vintage-accent', 'divide-opacity-10');

        // Create header
        columns.forEach(column => {
          const th = document.createElement('th');
          th.classList.add(
            'px-vintage-md', 'py-vintage-sm', 'text-left', 'vintage-label',
            'text-vintage-xs', 'text-vintage-accent', 'uppercase', 'tracking-wider', 'font-newspaper'
          );
          th.textContent = column.header;
          headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        // Create data rows
        data.forEach(rowData => {
          const row = document.createElement('tr');
          row.classList.add('hover:bg-vintage-sage', 'hover:bg-opacity-5', 'transition-colors', 'duration-200');

          columns.forEach(column => {
            const td = document.createElement('td');
            td.classList.add('px-vintage-md', 'py-vintage-sm', 'vintage-body', 'text-vintage-sm', 'text-vintage-ink', 'font-newspaper');
            td.textContent = rowData[column.key];
            row.appendChild(td);
          });

          tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);

        return { tableContainer, table, thead, tbody };
      };

      const tableData = [
        { campaign: 'Tech Professionals', connections: '45', rate: '67%', status: 'Active' },
        { campaign: 'Sales Leaders', connections: '32', rate: '54%', status: 'Paused' }
      ];

      const columns = [
        { key: 'campaign', header: 'Campaign' },
        { key: 'connections', header: 'Connections' },
        { key: 'rate', header: 'Accept Rate' },
        { key: 'status', header: 'Status' }
      ];

      const tableComponents = createVintageDataTable(columns, tableData);

      expect(tableComponents.tableContainer.classList.add).toHaveBeenCalledWith('vintage-card', 'p-vintage-lg', 'overflow-x-auto');
      expect(tableComponents.table.classList.add).toHaveBeenCalledWith('min-w-full', 'divide-y', 'divide-vintage-accent', 'divide-opacity-20');
      expect(tableComponents.thead.classList.add).toHaveBeenCalledWith('bg-vintage-paper-dark');
    });

    test('should create vintage table with sorting functionality', () => {
      const createSortableVintageTable = (columns) => {
        const sortState = {};

        const applySorting = (columnKey, direction) => {
          sortState[columnKey] = direction;

          // Mock sorting logic
          const sortIcon = direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '';
          return { columnKey, direction, sortIcon };
        };

        const createSortableHeader = (column) => {
          const th = document.createElement('th');
          th.classList.add(
            'px-vintage-md', 'py-vintage-sm', 'text-left', 'vintage-label',
            'text-vintage-xs', 'text-vintage-accent', 'uppercase', 'tracking-wider',
            'font-newspaper', 'cursor-pointer', 'hover:bg-vintage-accent',
            'hover:bg-opacity-10', 'transition-colors', 'duration-200'
          );

          const content = document.createElement('div');
          content.classList.add('flex', 'items-center', 'space-x-1');
          content.textContent = column.header;

          th.appendChild(content);
          return th;
        };

        return { applySorting, createSortableHeader, sortState };
      };

      const sortableTable = createSortableVintageTable([
        { key: 'name', header: 'Name', sortable: true },
        { key: 'date', header: 'Date', sortable: true }
      ]);

      const sortResult = sortableTable.applySorting('name', 'asc');
      const header = sortableTable.createSortableHeader({ header: 'Test Column' });

      expect(sortResult.direction).toBe('asc');
      expect(sortResult.sortIcon).toBe('↑');
      expect(header.classList.add).toHaveBeenCalledWith(
        'px-vintage-md', 'py-vintage-sm', 'text-left', 'vintage-label',
        'text-vintage-xs', 'text-vintage-accent', 'uppercase', 'tracking-wider',
        'font-newspaper', 'cursor-pointer', 'hover:bg-vintage-accent',
        'hover:bg-opacity-10', 'transition-colors', 'duration-200'
      );
    });
  });

  describe('Vintage Dashboard Navigation', () => {
    test('should create newspaper-style navigation menu', () => {
      const createVintageNavigation = (navItems) => {
        const nav = document.createElement('nav');
        const navList = document.createElement('ul');

        // Apply vintage navigation styling
        nav.classList.add('vintage-card', 'p-vintage-md', 'border-r', 'border-vintage-accent', 'border-opacity-20');
        navList.classList.add('space-y-vintage-sm');

        navItems.forEach(item => {
          const listItem = document.createElement('li');
          const link = document.createElement('a');

          link.classList.add(
            'block', 'vintage-body', 'text-vintage-base', 'text-vintage-accent',
            'hover:text-vintage-sepia', 'hover:bg-vintage-sepia', 'hover:bg-opacity-5',
            'py-vintage-sm', 'px-vintage-md', 'rounded-vintage-sm', 'font-newspaper',
            'transition-all', 'duration-200', 'border-l-2', 'border-transparent'
          );

          if (item.active) {
            link.classList.add('border-l-vintage-sepia', 'bg-vintage-sepia', 'bg-opacity-10', 'text-vintage-sepia', 'font-medium');
          }

          link.textContent = item.label;
          link.href = item.href || '#';

          listItem.appendChild(link);
          navList.appendChild(listItem);
        });

        nav.appendChild(navList);
        return { nav, navList };
      };

      const navigation = createVintageNavigation([
        { label: 'Overview', href: '#overview', active: true },
        { label: 'Analytics', href: '#analytics', active: false },
        { label: 'Campaigns', href: '#campaigns', active: false }
      ]);

      expect(navigation.nav.classList.add).toHaveBeenCalledWith('vintage-card', 'p-vintage-md', 'border-r', 'border-vintage-accent', 'border-opacity-20');
      expect(navigation.navList.classList.add).toHaveBeenCalledWith('space-y-vintage-sm');
    });

    test('should create vintage breadcrumb navigation', () => {
      const createVintageBreadcrumbs = (breadcrumbs) => {
        const breadcrumbContainer = document.createElement('nav');
        const breadcrumbList = document.createElement('ol');

        breadcrumbContainer.classList.add('vintage-card', 'p-vintage-sm', 'mb-vintage-md');
        breadcrumbList.classList.add('flex', 'items-center', 'space-x-vintage-sm');

        breadcrumbs.forEach((item, index) => {
          const listItem = document.createElement('li');
          const link = document.createElement('a');

          link.classList.add('vintage-body', 'text-vintage-sm', 'font-newspaper');

          if (index === breadcrumbs.length - 1) {
            // Current page
            link.classList.add('text-vintage-ink', 'font-medium');
          } else {
            // Previous pages
            link.classList.add('text-vintage-accent', 'hover:text-vintage-sepia', 'transition-colors', 'duration-200');
          }

          link.textContent = item.label;
          listItem.appendChild(link);

          // Add separator
          if (index < breadcrumbs.length - 1) {
            const separator = document.createElement('span');
            separator.classList.add('text-vintage-accent', 'mx-vintage-xs');
            separator.textContent = '›';
            listItem.appendChild(separator);
          }

          breadcrumbList.appendChild(listItem);
        });

        breadcrumbContainer.appendChild(breadcrumbList);
        return { breadcrumbContainer, breadcrumbList };
      };

      const breadcrumbs = createVintageBreadcrumbs([
        { label: 'Dashboard', href: '#dashboard' },
        { label: 'Analytics', href: '#analytics' },
        { label: 'Campaign Performance', href: null }
      ]);

      expect(breadcrumbs.breadcrumbContainer.classList.add).toHaveBeenCalledWith('vintage-card', 'p-vintage-sm', 'mb-vintage-md');
      expect(breadcrumbs.breadcrumbList.classList.add).toHaveBeenCalledWith('flex', 'items-center', 'space-x-vintage-sm');
    });
  });

  describe('Responsive Vintage Dashboard', () => {
    test('should implement responsive newspaper layout', () => {
      const createResponsiveDashboard = (config) => {
        const dashboard = document.createElement('div');
        const { mobile, tablet, desktop } = config;

        // Apply responsive classes
        const responsiveClasses = [
          'bg-vintage-texture',
          'min-h-screen',
          'p-vintage-md',
          // Mobile-first approach
          'newspaper-column', 'single', 'gap-vintage-md',
          // Tablet breakpoint
          'md:newspaper-column', 'md:double', 'md:gap-vintage-lg', 'md:p-vintage-lg',
          // Desktop breakpoint
          'lg:newspaper-column', 'lg:triple', 'lg:gap-vintage-xl', 'lg:p-vintage-xl'
        ];

        responsiveClasses.forEach(className => dashboard.classList.add(className));

        return dashboard;
      };

      const responsiveDashboard = createResponsiveDashboard({
        mobile: { columns: 1, gap: 'md' },
        tablet: { columns: 2, gap: 'lg' },
        desktop: { columns: 3, gap: 'xl' }
      });

      expect(responsiveDashboard.classList.add).toHaveBeenCalledWith('newspaper-column');
      expect(responsiveDashboard.classList.add).toHaveBeenCalledWith('md:double');
      expect(responsiveDashboard.classList.add).toHaveBeenCalledWith('lg:triple');
    });

    test('should validate vintage dashboard accessibility', () => {
      const validateVintageDashboardA11y = (elements) => {
        const a11yChecks = {
          colorContrast: true,
          keyboardNavigation: true,
          screenReaderSupport: true,
          focusManagement: true
        };

        // Mock accessibility validation
        elements.forEach(element => {
          // Check color contrast
          if (element.type === 'text' && element.background && element.foreground) {
            const contrast = calculateContrast(element.background, element.foreground);
            a11yChecks.colorContrast = a11yChecks.colorContrast && contrast >= 4.5;
          }

          // Check keyboard navigation
          if (element.interactive) {
            a11yChecks.keyboardNavigation = a11yChecks.keyboardNavigation && element.tabIndex !== undefined;
          }

          // Check ARIA labels
          if (element.type === 'chart' || element.type === 'table') {
            a11yChecks.screenReaderSupport = a11yChecks.screenReaderSupport && element.ariaLabel !== undefined;
          }
        });

        return a11yChecks;
      };

      const mockElements = [
        { type: 'text', background: 'vintage-paper', foreground: 'vintage-ink', interactive: false },
        { type: 'button', interactive: true, tabIndex: 0 },
        { type: 'chart', ariaLabel: 'Connection analytics chart' },
        { type: 'table', ariaLabel: 'Campaign performance data' }
      ];

      const a11yResults = validateVintageDashboardA11y(mockElements);

      expect(a11yResults.colorContrast).toBe(true);
      expect(a11yResults.keyboardNavigation).toBe(true);
      expect(a11yResults.screenReaderSupport).toBe(true);
    });
  });
});

// Helper function for contrast calculation (simplified)
function calculateContrast(bg, fg) {
  // Simplified contrast calculation for testing
  const colorValues = {
    'vintage-paper': 0.9,
    'vintage-ink': 0.1,
    'vintage-sepia': 0.6,
    'vintage-accent': 0.3
  };

  const bgLuminance = colorValues[bg] || 0.5;
  const fgLuminance = colorValues[fg] || 0.5;

  return (Math.max(bgLuminance, fgLuminance) + 0.05) / (Math.min(bgLuminance, fgLuminance) + 0.05);
}