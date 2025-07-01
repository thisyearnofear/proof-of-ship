/** @type {import('tailwindcss').Config} */
const tokens = require('./src/styles/tokens.js');

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Override default Tailwind theme with our design tokens
    colors: {
      ...tokens.colors,
      // Keep some Tailwind defaults for compatibility
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit'
    },
    
    fontFamily: tokens.typography.fontFamily,
    fontSize: tokens.typography.fontSize,
    fontWeight: tokens.typography.fontWeight,
    letterSpacing: tokens.typography.letterSpacing,
    lineHeight: tokens.typography.lineHeight,
    
    spacing: tokens.spacing,
    borderRadius: tokens.borderRadius,
    boxShadow: tokens.shadows,
    zIndex: tokens.zIndex,
    
    screens: tokens.breakpoints,
    
    extend: {
      // Custom animations
      transitionDuration: tokens.animations.duration,
      transitionTimingFunction: tokens.animations.easing,
      
      // Component-specific utilities
      height: {
        'button-sm': tokens.components.button.height.sm,
        'button-md': tokens.components.button.height.md,
        'button-lg': tokens.components.button.height.lg,
        'button-xl': tokens.components.button.height.xl,
        'input-sm': tokens.components.input.height.sm,
        'input-md': tokens.components.input.height.md,
        'input-lg': tokens.components.input.height.lg,
      },
      
      // Custom gradients
      backgroundImage: {
        'gradient-primary': `linear-gradient(135deg, ${tokens.colors.primary[500]} 0%, ${tokens.colors.secondary[500]} 100%)`,
        'gradient-success': `linear-gradient(135deg, ${tokens.colors.success[400]} 0%, ${tokens.colors.success[600]} 100%)`,
        'gradient-warning': `linear-gradient(135deg, ${tokens.colors.warning[400]} 0%, ${tokens.colors.warning[600]} 100%)`,
        'gradient-error': `linear-gradient(135deg, ${tokens.colors.error[400]} 0%, ${tokens.colors.error[600]} 100%)`,
        'gradient-credit-excellent': `linear-gradient(135deg, ${tokens.colors.credit.excellent} 0%, ${tokens.colors.success[600]} 100%)`,
        'gradient-credit-good': `linear-gradient(135deg, ${tokens.colors.credit.good} 0%, ${tokens.colors.primary[600]} 100%)`,
        'gradient-credit-fair': `linear-gradient(135deg, ${tokens.colors.credit.fair} 0%, ${tokens.colors.warning[600]} 100%)`,
        'gradient-credit-poor': `linear-gradient(135deg, ${tokens.colors.credit.poor} 0%, ${tokens.colors.warning[700]} 100%)`,
        'gradient-credit-very-poor': `linear-gradient(135deg, ${tokens.colors.credit.veryPoor} 0%, ${tokens.colors.error[600]} 100%)`,
      },
      
      // Animation keyframes
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        'slide-in-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' }
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'progress': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'slide-in-down': 'slide-in-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-out': 'scale-out 0.2s ease-out',
        'bounce-in': 'bounce-in 0.6s ease-out',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'progress': 'progress 1s ease-in-out infinite'
      }
    },
  },
  plugins: [
    // Custom plugin for component utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Button utilities
        '.btn-base': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme('borderRadius.button'),
          fontWeight: theme('fontWeight.medium'),
          transition: theme('extend.animation.fade-in'),
          cursor: 'pointer',
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed'
          }
        },
        
        // Card utilities
        '.card-base': {
          backgroundColor: theme('colors.semantic.surface'),
          borderRadius: theme('borderRadius.card'),
          boxShadow: theme('boxShadow.card'),
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme('boxShadow.cardHover')
          }
        },
        
        // Focus utilities
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            boxShadow: theme('boxShadow.focus')
          }
        },
        
        // Text utilities
        '.text-gradient-primary': {
          background: `linear-gradient(135deg, ${theme('colors.primary.500')} 0%, ${theme('colors.secondary.500')} 100%)`,
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text'
        }
      }
      
      addUtilities(newUtilities)
    }
  ],
};
