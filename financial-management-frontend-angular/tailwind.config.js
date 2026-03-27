/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,ts}',
  ],
  darkMode: ['selector', '.dark'],
  theme: {
    extend: {
      // 🎨 Nova paleta financeira moderna (inspirada em Nubank + Wise + Apple)
      colors: {
        primary: {
          50: '#F3F2FF',
          100: '#E8E5FF', 
          200: '#D4CFFF',
          300: '#B8AFFF',
          400: '#9A8CFF',
          500: '#6C5CE7', // Ultra violeta - Principal
          600: '#5B4BD6',
          700: '#4A3CB8',
          800: '#3A2E94',
          900: '#2E2477'
        },
        secondary: {
          50: '#E6FFF7',
          100: '#B3FFE6',
          200: '#80FFD4',
          300: '#4DFFC2',
          400: '#1AFFB1',
          500: '#00D4AA', // Verde menta - Crescimento
          600: '#00B894',
          700: '#009B7D',
          800: '#007E66',
          900: '#006250'
        },
        accent: {
          50: '#FFF0F0',
          100: '#FFD7D7',
          200: '#FFBBBB',
          300: '#FF9999',
          400: '#FF7777',
          500: '#FF6B6B', // Coral - Alertas
          600: '#E85555',
          700: '#CC4444',
          800: '#B03333',
          900: '#942222'
        },
        neutral: {
          50: '#F8FAFF',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#2D3436' // Texto principal
        }
      },
      // Design system spacing
      spacing: {
        '18': '4.5rem', // 72px
        '88': '22rem',   // 352px - nova sidebar width
        '128': '32rem'   // 512px
      },
      // Bordas arredondadas modernas
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px'
      },
      // Sombras com cores
      boxShadow: {
        'colored-sm': '0 2px 8px rgba(108, 92, 231, 0.08)',
        'colored-md': '0 4px 16px rgba(108, 92, 231, 0.12)',
        'colored-lg': '0 8px 24px rgba(108, 92, 231, 0.15)',
        'colored-xl': '0 12px 32px rgba(108, 92, 231, 0.18)',
        'glow-primary': '0 0 20px rgba(108, 92, 231, 0.4)',
        'glow-secondary': '0 0 20px rgba(0, 212, 170, 0.4)'
      },
      // Gradientes modernos
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6C5CE7 0%, #9A8CFF 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #00D4AA 0%, #1AFFB1 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FF6B6B 0%, #FF9999 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-gradient': 'radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0%, transparent 50%), radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0%, transparent 50%), radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0%, transparent 50%), radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0%, transparent 50%), radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0%, transparent 50%), radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0%, transparent 50%), radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0%, transparent 50%)'
      },
      // Animações fluidas
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-up': 'scaleUp 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'float': 'float 3s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' }
        },
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.02)', filter: 'brightness(1.1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      // Tipografia moderna
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'display': ['CalSans-SemiBold', 'Inter', 'sans-serif']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio')
  ]
};
