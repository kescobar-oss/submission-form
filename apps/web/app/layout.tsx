import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import theme from '@/theme';
import SiteHeader from '@/components/SiteHeader';

// next/font downloads Roboto at build time and serves it from our own site, so visitors'
// browsers never have to contact Google. `variable` exposes it as --font-roboto for theme.ts.
const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'Feature Request Form',
  description: 'Send the product team a bug report, improvement or new feature idea.',
};

// The root layout wraps every page, so anything here (theme, header) appears on all of them.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        {/* Collects MUI's styles while Next.js renders on the server and sends them with
            the HTML, so the page never flashes unstyled before the JavaScript loads. */}
        <AppRouterCacheProvider>
          {/* Makes theme.ts available to every MUI component inside it. */}
          <ThemeProvider theme={theme}>
            {/* CssBaseline resets browser default styles (margins, fonts, background) so
                pages look the same in every browser. It replaces the old globals.css. */}
            <CssBaseline />
            <SiteHeader />
            {/* Container centres the page and caps its width. The py value is responsive:
                2 spacing units of vertical padding on phones, 4 from the "sm" breakpoint up. */}
            <Container component="main" maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
              {children}
            </Container>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
