'use client';
// 'use client' because ThemeProvider (a client component) receives this theme object, and
// MUI's docs keep the theme on the client side so its helper functions survive the trip.
import { alpha, createTheme, responsiveFontSizes } from '@mui/material/styles';

// The brand colours, named once so the palette and the component styles below agree.
const INDIGO = '#4f46e5';
const INK = '#0f172a'; // near-black with a hint of blue: softer on the eye than pure black

// One central place for the app's look. Every MUI component reads its colours, font and
// spacing from here, so changing primary.main below recolours every button and link.
// responsiveFontSizes shrinks the big heading sizes (h1–h6) on narrow screens, so a page
// title doesn't take half a phone screen. Doing it here fixes every heading at once.
const theme = responsiveFontSizes(
  createTheme({
    palette: {
      // primary: the main brand colour (logo, contained buttons, focused fields).
      primary: { main: INDIGO },
      // secondary: an accent for things that should stand out from primary.
      secondary: { main: '#0d9488' },
      // A soft blue-grey page, so the white cards and form stand out from it.
      background: { default: '#f6f7fb', paper: '#ffffff' },
      text: { primary: INK, secondary: '#475569' },
      // The thin lines between table rows and around the header.
      divider: '#e2e8f0',
    },
    // The base for every rounded corner. Components multiply or reuse it.
    shape: { borderRadius: 12 },
    typography: {
      // The Roboto font is loaded in app/layout.tsx and exposed as this CSS variable.
      fontFamily: 'var(--font-roboto), Arial, sans-serif',
      // Bolder, slightly tighter headings read as "designed" rather than "default".
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      // MUI writes buttons in ALL CAPS by default; normal case feels calmer and more modern.
      button: { textTransform: 'none', fontWeight: 600 },
    },
    // Component overrides: "every Card / Button / Paper in the app looks like this".
    // This is why the form, success and submissions pages change without being edited.
    components: {
      MuiPaper: {
        styleOverrides: {
          // A hairline border plus a soft, wide shadow instead of MUI's heavier default.
          root: {
            backgroundImage: 'none',
            border: '1px solid #e2e8f0',
          },
          elevation1: {
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.05)',
          },
        },
      },
      MuiCard: {
        // Cards start flat-ish; the welcome page lifts them on hover.
        styleOverrides: { root: { borderRadius: 16 } },
      },
      MuiButton: {
        // No shadow on buttons: the colour is enough, and it matches the flat, light look.
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, paddingInline: 20 },
          sizeLarge: { paddingBlock: 10 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          // Text fields get a white fill so they stand out on the tinted card edges.
          root: { backgroundColor: '#ffffff' },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
      MuiTableCell: {
        styleOverrides: {
          // Grey, semi-bold headers on a faint indigo tint, a common "dashboard" style.
          head: {
            fontWeight: 600,
            color: '#475569',
            backgroundColor: alpha(INDIGO, 0.04),
          },
        },
      },
    },
  }),
);

export default theme;
