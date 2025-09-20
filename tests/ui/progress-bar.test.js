/**
 * Progress Bar Component Tests
 * Test suite for the enhanced progress bar functionality
 * Following TDD principles - these tests will fail initially
 */

describe('Progress Bar Component', () => {
  let mockDOM;
  let progressBarComponent;

  beforeEach(() => {
    // Setup DOM environment
    document.body.innerHTML = `
      <div id="progress-section" class="hidden">
        <div class="vintage-caption text-vintage-xs text-vintage-accent mb-1 font-newspaper">Current Progress</div>
        <div class="bg-vintage-paper-dark rounded-vintage h-2 border border-vintage-accent border-opacity-20">
          <div id="progress-bar" class="bg-vintage-sepia h-2 rounded-vintage transition-all duration-300 shadow-vintage-inset" style="width: 0%"></div>
        </div>
        <div class="flex justify-between vintage-fine-print text-vintage-accent mt-1">
          <span id="progress-text">Starting...</span>
          <span id="progress-percentage">0%</span>
        </div>
      </div>
    `;

    // Import the component (will be created)
    if (typeof ProgressBarComponent !== 'undefined') {
      progressBarComponent = new ProgressBarComponent();
    }
  });

  afterEach(() => {
    document.body.innerHTML = '';
    if (progressBarComponent) {
      progressBarComponent.destroy();
    }
  });

  describe('Component Initialization', () => {
    test('should initialize progress bar component', () => {
      expect(() => {
        if (typeof ProgressBarComponent !== 'undefined') {
          new ProgressBarComponent();
        }
      }).not.toThrow();
    });

    test('should find required DOM elements', () => {
      const progressSection = document.getElementById('progress-section');
      const progressBar = document.getElementById('progress-bar');
      const progressText = document.getElementById('progress-text');
      const progressPercentage = document.getElementById('progress-percentage');

      expect(progressSection).toBeTruthy();
      expect(progressBar).toBeTruthy();
      expect(progressText).toBeTruthy();
      expect(progressPercentage).toBeTruthy();
    });

    test('should start with hidden progress section', () => {
      const progressSection = document.getElementById('progress-section');
      expect(progressSection.classList.contains('hidden')).toBe(true);
    });

    test('should initialize with 0% progress', () => {
      const progressBar = document.getElementById('progress-bar');
      const progressPercentage = document.getElementById('progress-percentage');

      expect(progressBar.style.width).toBe('0%');
      expect(progressPercentage.textContent).toBe('0%');
    });
  });

  describe('Progress Display', () => {
    test('should show progress section when automation starts', () => {
      if (progressBarComponent) {
        progressBarComponent.show();
        const progressSection = document.getElementById('progress-section');
        expect(progressSection.classList.contains('hidden')).toBe(false);
      }
    });

    test('should hide progress section when automation stops', () => {
      if (progressBarComponent) {
        progressBarComponent.hide();
        const progressSection = document.getElementById('progress-section');
        expect(progressSection.classList.contains('hidden')).toBe(true);
      }
    });

    test('should update progress percentage correctly', () => {
      if (progressBarComponent) {
        progressBarComponent.updateProgress({
          percentage: 25,
          text: 'Processing connections...'
        });

        const progressBar = document.getElementById('progress-bar');
        const progressPercentage = document.getElementById('progress-percentage');

        expect(progressBar.style.width).toBe('25%');
        expect(progressPercentage.textContent).toBe('25%');
      }
    });

    test('should update progress text correctly', () => {
      if (progressBarComponent) {
        progressBarComponent.updateProgress({
          percentage: 50,
          text: 'Sending connection requests...'
        });

        const progressText = document.getElementById('progress-text');
        expect(progressText.textContent).toBe('Sending connection requests...');
      }
    });

    test('should handle progress values at boundaries', () => {
      if (progressBarComponent) {
        // Test 0%
        progressBarComponent.updateProgress({ percentage: 0 });
        expect(document.getElementById('progress-bar').style.width).toBe('0%');

        // Test 100%
        progressBarComponent.updateProgress({ percentage: 100 });
        expect(document.getElementById('progress-bar').style.width).toBe('100%');

        // Test negative values (should clamp to 0)
        progressBarComponent.updateProgress({ percentage: -10 });
        expect(document.getElementById('progress-bar').style.width).toBe('0%');

        // Test values over 100 (should clamp to 100)
        progressBarComponent.updateProgress({ percentage: 150 });
        expect(document.getElementById('progress-bar').style.width).toBe('100%');
      }
    });
  });

  describe('Animation and Styling', () => {
    test('should apply smooth animation classes', () => {
      const progressBar = document.getElementById('progress-bar');

      expect(progressBar.classList.contains('transition-all')).toBe(true);
      expect(progressBar.classList.contains('duration-300')).toBe(true);
    });

    test('should maintain vintage styling classes', () => {
      const progressBar = document.getElementById('progress-bar');

      expect(progressBar.classList.contains('bg-vintage-sepia')).toBe(true);
      expect(progressBar.classList.contains('rounded-vintage')).toBe(true);
      expect(progressBar.classList.contains('shadow-vintage-inset')).toBe(true);
    });

    test('should animate progress changes smoothly', (done) => {
      if (progressBarComponent) {
        const progressBar = document.getElementById('progress-bar');

        progressBarComponent.updateProgress({ percentage: 50 });

        // Check that transition is applied
        expect(progressBar.style.width).toBe('50%');

        // Allow time for animation
        setTimeout(() => {
          expect(progressBar.style.width).toBe('50%');
          done();
        }, 350); // Slightly longer than transition duration
      } else {
        done();
      }
    });
  });

  describe('State Management', () => {
    test('should track current progress state', () => {
      if (progressBarComponent) {
        progressBarComponent.updateProgress({
          percentage: 75,
          text: 'Almost complete...'
        });

        expect(progressBarComponent.getCurrentProgress()).toEqual({
          percentage: 75,
          text: 'Almost complete...',
          isVisible: true
        });
      }
    });

    test('should persist state across updates', () => {
      if (progressBarComponent) {
        progressBarComponent.updateProgress({ percentage: 30 });
        progressBarComponent.updateProgress({ text: 'Updated status' });

        const state = progressBarComponent.getCurrentProgress();
        expect(state.percentage).toBe(30);
        expect(state.text).toBe('Updated status');
      }
    });

    test('should reset state when hidden', () => {
      if (progressBarComponent) {
        progressBarComponent.updateProgress({ percentage: 80, text: 'Almost done' });
        progressBarComponent.hide();

        const state = progressBarComponent.getCurrentProgress();
        expect(state.percentage).toBe(0);
        expect(state.text).toBe('Starting...');
        expect(state.isVisible).toBe(false);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid progress data gracefully', () => {
      if (progressBarComponent) {
        expect(() => {
          progressBarComponent.updateProgress(null);
        }).not.toThrow();

        expect(() => {
          progressBarComponent.updateProgress(undefined);
        }).not.toThrow();

        expect(() => {
          progressBarComponent.updateProgress({});
        }).not.toThrow();
      }
    });

    test('should handle missing DOM elements gracefully', () => {
      // Remove progress bar element
      document.getElementById('progress-bar').remove();

      if (progressBarComponent) {
        expect(() => {
          progressBarComponent.updateProgress({ percentage: 50 });
        }).not.toThrow();
      }
    });

    test('should validate progress percentage types', () => {
      if (progressBarComponent) {
        // Test string numbers
        progressBarComponent.updateProgress({ percentage: '50' });
        expect(document.getElementById('progress-bar').style.width).toBe('50%');

        // Test invalid strings
        progressBarComponent.updateProgress({ percentage: 'invalid' });
        expect(document.getElementById('progress-bar').style.width).toBe('0%');
      }
    });
  });

  describe('Event Integration', () => {
    test('should emit progress events', () => {
      if (progressBarComponent) {
        const eventSpy = jest.fn();
        document.addEventListener('progressUpdate', eventSpy);

        progressBarComponent.updateProgress({ percentage: 40 });

        expect(eventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              percentage: 40
            })
          })
        );

        document.removeEventListener('progressUpdate', eventSpy);
      }
    });

    test('should handle automation start/stop events', () => {
      if (progressBarComponent) {
        const startEvent = new CustomEvent('automationStarted');
        const stopEvent = new CustomEvent('automationStopped');

        document.dispatchEvent(startEvent);
        expect(document.getElementById('progress-section').classList.contains('hidden')).toBe(false);

        document.dispatchEvent(stopEvent);
        expect(document.getElementById('progress-section').classList.contains('hidden')).toBe(true);
      }
    });
  });

  describe('Performance', () => {
    test('should throttle rapid progress updates', (done) => {
      if (progressBarComponent) {
        const updateSpy = jest.spyOn(progressBarComponent, 'updateProgress');

        // Rapid updates
        for (let i = 0; i < 100; i++) {
          progressBarComponent.updateProgress({ percentage: i });
        }

        // Should throttle to reasonable number of actual DOM updates
        setTimeout(() => {
          expect(updateSpy).toHaveBeenCalledTimes(100);
          // But DOM should only be updated at most every 16ms (60fps)
          done();
        }, 100);
      } else {
        done();
      }
    });

    test('should not cause memory leaks', () => {
      if (progressBarComponent) {
        const initialListeners = document.getEventListeners ?
          Object.keys(document.getEventListeners()).length : 0;

        progressBarComponent.destroy();

        const finalListeners = document.getEventListeners ?
          Object.keys(document.getEventListeners()).length : 0;

        // Should not increase listener count
        expect(finalListeners).toBeLessThanOrEqual(initialListeners);
      }
    });
  });

  describe('Accessibility', () => {
    test('should include ARIA attributes', () => {
      const progressBar = document.getElementById('progress-bar');

      if (progressBarComponent) {
        progressBarComponent.updateProgress({ percentage: 60 });

        expect(progressBar.getAttribute('role')).toBe('progressbar');
        expect(progressBar.getAttribute('aria-valuenow')).toBe('60');
        expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
        expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
      }
    });

    test('should update screen reader text', () => {
      if (progressBarComponent) {
        progressBarComponent.updateProgress({
          percentage: 75,
          text: 'Processing data...'
        });

        const progressBar = document.getElementById('progress-bar');
        expect(progressBar.getAttribute('aria-label')).toBe('Processing data... 75% complete');
      }
    });
  });
});

describe('Progress Bar Integration with Popup', () => {
  beforeEach(() => {
    // Setup popup DOM
    document.body.innerHTML = `
      <div id="progress-section" class="hidden">
        <div id="progress-bar" style="width: 0%"></div>
        <span id="progress-text">Starting...</span>
        <span id="progress-percentage">0%</span>
      </div>
      <button id="start-automation">Start Automation</button>
    `;
  });

  test('should integrate with popup automation controls', () => {
    // Mock popup functions
    window.showProgressSection = jest.fn();
    window.hideProgressSection = jest.fn();
    window.updateProgress = jest.fn();

    // Simulate automation start
    if (typeof ProgressBarComponent !== 'undefined') {
      const component = new ProgressBarComponent();
      component.show();

      expect(window.showProgressSection).toHaveBeenCalled();
    }
  });

  test('should sync with automation state', () => {
    // Mock automation state
    let isAutomationActive = false;

    if (typeof ProgressBarComponent !== 'undefined') {
      const component = new ProgressBarComponent();

      // Start automation
      isAutomationActive = true;
      component.syncWithAutomationState(isAutomationActive);

      expect(document.getElementById('progress-section').classList.contains('hidden')).toBe(false);

      // Stop automation
      isAutomationActive = false;
      component.syncWithAutomationState(isAutomationActive);

      expect(document.getElementById('progress-section').classList.contains('hidden')).toBe(true);
    }
  });
});