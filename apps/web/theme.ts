'use client';
// 'use client' because ThemeProvider (a client component) receives this theme object, and
// MUI's docs keep the theme on the client side so its helper functions survive the trip.
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// One central place for the app's look. Every MUI component reads its colours, font and
// spacing from here, so changing primary.main below recolours every button and the AppBar.
// responsiveFontSizes shrinks the big heading sizes (h1–h6) on narrow screens, so a page
// title like "Submit a feature request" doesn't take half a phone screen. Doing it here
// fixes every heading in the app at once, instead of adding sx to each one.
const theme = responsiveFontSizes(createTheme({
  palette: {
    // primary: the main brand colour (AppBar, contained buttons, focused fields).
    primary: { main: '#3949ab' },
    // secondary: an accent for things that should stand out from primary.
    secondary: { main: '#00897b' },
  },
  typography: {
    // The Roboto font is loaded in app/layout.tsx and exposed as this CSS variable.
    fontFamily: 'var(--font-roboto), Arial, sans-serif',
  },
}));

export default theme;
