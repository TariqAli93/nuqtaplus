// src/blueprints/codelimsBlueprint.js
export default {
  name: 'Codelims Modern Blueprint',

  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#4F46E5', // Indigo 600
          secondary: '#7C3AED', // Violet 600
          accent: '#F59E0B', // Amber 500
          info: '#3B82F6', // Blue 500
          success: '#22C55E', // Green 500
          warning: '#EAB308', // Yellow 500
          error: '#EF4444', // Red 500
          background: '#F9FAFB', // Soft gray background
          surface: '#FFFFFF', // Card surfaces
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#6366F1', // Indigo 500
          secondary: '#8B5CF6', // Violet 500
          accent: '#FBBF24',
          info: '#60A5FA',
          success: '#4ADE80',
          warning: '#FACC15',
          error: '#F87171',
          background: '#0F172A', // Blue-gray dark
          surface: '#1E293B', // Slightly lighter surface
        },
      },
    },
  },

  typography: {
    fontFamily: 'Inter, "Noto Sans Arabic", sans-serif',
    h1: { fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.5px' },
    h2: { fontSize: '1.8rem', fontWeight: 600 },
    h3: { fontSize: '1.4rem', fontWeight: 600 },
    subtitle1: { fontSize: '1.1rem', color: '#6B7280' },
    body: { fontSize: '1rem', lineHeight: 1.6 },
  },

  componentDefaults: {
    VBtn: {
      color: 'primary',
      rounded: 'lg',
      elevation: 1,
      size: 'large',
      variant: 'flat',
      ripple: true,
      class: 'font-medium',
    },
    VCard: {
      elevation: 4,
      rounded: 'xl',
      class: 'pa-4',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
    },
    VAppBar: {
      elevation: 1,
      flat: true,
      color: 'surface',
    },
  },

  density: 'comfortable',
  spacing: { base: 8 },
};
