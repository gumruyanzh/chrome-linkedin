/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./src/popup/**/*.{html,js}",
    "./src/dashboard/**/*.{html,js}",
    "./src/settings/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        linkedin: {
          blue: '#0073b1',
          lightblue: '#004182',
          darkblue: '#00344c'
        },
        vintage: {
          paper: '#F4F1DE',
          'paper-dark': '#F0EDD4',
          sepia: '#E07A5F',
          'sepia-dark': '#D96A4F',
          'sepia-darker': '#C85A3F',
          ink: '#2F2F2F',
          'ink-light': '#4A4A4A',
          accent: '#3D405B',
          'accent-light': '#5A5F7A',
          sage: '#81B29A',
          'sage-light': '#A0C4B0',
          'sage-dark': '#6B9B84'
        }
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'serif': ['Georgia', 'Times New Roman', 'Times', 'serif'],
        'newspaper': ['Georgia', 'Times New Roman', 'Times', 'serif']
      },
      fontSize: {
        'vintage-xs': ['10px', { lineHeight: '1.4' }],
        'vintage-sm': ['12px', { lineHeight: '1.4' }],
        'vintage-base': ['14px', { lineHeight: '1.6' }],
        'vintage-lg': ['16px', { lineHeight: '1.5' }],
        'vintage-xl': ['18px', { lineHeight: '1.3' }],
        'vintage-2xl': ['20px', { lineHeight: '1.3' }],
        'vintage-3xl': ['24px', { lineHeight: '1.2' }],
        'vintage-4xl': ['28px', { lineHeight: '1.1' }],
        'vintage-headline': ['24px', { lineHeight: '1.2', fontWeight: 'bold' }],
        'vintage-subheadline': ['18px', { lineHeight: '1.3', fontWeight: '600' }]
      },
      spacing: {
        'vintage-xs': '4px',
        'vintage-sm': '8px',
        'vintage-md': '16px',
        'vintage-lg': '24px',
        'vintage-xl': '32px',
        'vintage-2xl': '48px'
      },
      borderRadius: {
        'vintage': '3px',
        'vintage-sm': '2px',
        'vintage-lg': '4px'
      },
      boxShadow: {
        'vintage': '0 2px 4px rgba(47, 47, 47, 0.1)',
        'vintage-lg': '0 3px 6px rgba(47, 47, 47, 0.2)',
        'vintage-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        'vintage-pressed': 'inset 0 2px 4px rgba(47, 47, 47, 0.3), 0 1px 2px rgba(47, 47, 47, 0.1)',
        'vintage-paper': 'inset 0 0 20px rgba(47, 47, 47, 0.05)'
      },
      textShadow: {
        'vintage': '0 1px 1px rgba(47, 47, 47, 0.3)',
        'vintage-light': '0 1px 1px rgba(47, 47, 47, 0.1)'
      },
      backgroundImage: {
        'vintage-paper': 'linear-gradient(135deg, #F4F1DE 0%, #F0EDD4 25%, #F4F1DE 50%, #F0EDD4 75%, #F4F1DE 100%)',
        'vintage-button': 'linear-gradient(145deg, #E07A5F, #D96A4F)',
        'vintage-button-pressed': 'linear-gradient(145deg, #D96A4F, #C85A3F)',
        'vintage-disabled': 'linear-gradient(145deg, #CCCCCC, #BBBBBB)'
      },
      screens: {
        'xs': '400px'
      }
    },
  },
  plugins: [
    // Custom plugin for text shadow utilities
    function({ addUtilities, theme }) {
      const textShadows = theme('textShadow');
      const utilities = {};

      Object.entries(textShadows).forEach(([key, value]) => {
        utilities[`.text-shadow-${key}`] = { textShadow: value };
      });

      addUtilities(utilities);
    },

    // Custom plugin for vintage paper texture utilities
    function({ addUtilities }) {
      addUtilities({
        '.bg-vintage-texture': {
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.02\'/%3E%3C/svg%3E")',
            pointerEvents: 'none',
            opacity: '0.3'
          }
        },

        '.vintage-button': {
          background: 'linear-gradient(145deg, #E07A5F, #D96A4F)',
          border: '1px solid #C85A3F',
          borderRadius: '3px',
          boxShadow: '0 3px 6px rgba(47, 47, 47, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          color: '#F4F1DE',
          fontFamily: 'Georgia, Times, serif',
          fontWeight: '600',
          padding: '8px 16px',
          textShadow: '0 1px 1px rgba(47, 47, 47, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',

          '&:hover': {
            background: 'linear-gradient(145deg, #D96A4F, #C85A3F)',
            boxShadow: '0 4px 8px rgba(47, 47, 47, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          },

          '&:active': {
            background: 'linear-gradient(145deg, #D96A4F, #C85A3F)',
            boxShadow: 'inset 0 2px 4px rgba(47, 47, 47, 0.3), 0 1px 2px rgba(47, 47, 47, 0.1)',
            transform: 'translateY(1px)'
          },

          '&:disabled': {
            background: 'linear-gradient(145deg, #CCCCCC, #BBBBBB)',
            border: '1px solid #AAAAAA',
            color: '#777777',
            cursor: 'not-allowed',
            opacity: '0.6',
            boxShadow: 'none',
            transform: 'none'
          }
        },

        '.vintage-input': {
          background: '#F4F1DE',
          border: '1px solid rgba(47, 47, 47, 0.2)',
          borderRadius: '3px',
          padding: '8px 12px',
          fontFamily: 'Georgia, Times, serif',
          fontSize: '14px',
          color: '#2F2F2F',
          boxShadow: 'inset 0 1px 3px rgba(47, 47, 47, 0.1)',
          transition: 'all 0.2s ease',

          '&:focus': {
            outline: 'none',
            borderColor: '#3D405B',
            boxShadow: 'inset 0 1px 3px rgba(47, 47, 47, 0.1), 0 0 0 2px rgba(61, 64, 91, 0.2)'
          },

          '&::placeholder': {
            color: 'rgba(47, 47, 47, 0.5)',
            fontStyle: 'italic'
          }
        },

        '.vintage-card': {
          background: 'linear-gradient(135deg, #F4F1DE 0%, #F0EDD4 25%, #F4F1DE 50%, #F0EDD4 75%, #F4F1DE 100%)',
          border: '1px solid rgba(47, 47, 47, 0.1)',
          borderRadius: '3px',
          boxShadow: '0 2px 4px rgba(47, 47, 47, 0.1), inset 0 0 20px rgba(47, 47, 47, 0.05)',
          padding: '16px',
          position: 'relative'
        },

        '.newspaper-column': {
          display: 'grid',
          gap: '24px',
          columnGap: '32px',

          '&.single': {
            gridTemplateColumns: '1fr'
          },

          '&.double': {
            gridTemplateColumns: '1fr 1fr'
          },

          '&.triple': {
            gridTemplateColumns: '2fr 1fr 1fr'
          }
        },

        '.vintage-form-group': {
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '16px',

          '&.horizontal': {
            flexDirection: 'row',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }
        },

        '.vintage-label': {
          fontFamily: 'Georgia, Times, serif',
          fontSize: '14px',
          fontWeight: '600',
          color: '#2F2F2F',
          marginBottom: '4px'
        }
      });
    }
  ],
  // Ensure compatibility with Chrome extension environment
  corePlugins: {
    preflight: false, // Disable CSS reset in content scripts
  }
}