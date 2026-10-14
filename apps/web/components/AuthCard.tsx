import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import FadeIn from '@/components/FadeIn';

// The shared frame for /login and /register: a centred card with the logo on top, a coloured
// edge and soft colour glows behind it. Keeping it in one component means both pages always
// match, and each page only supplies its title and its form.
// No 'use client' needed: it has no state or clicks, so it can be built on the server.
export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string; // optional: the login page deliberately has none
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        maxWidth: 440,
        mx: 'auto',
        pt: { xs: 2, sm: 6 },
        pb: 6,
        // Two blurred colour patches behind the card (indigo top-left, teal bottom-right).
        // They give the page depth without being busy. pointerEvents: 'none' means they can
        // never block a click.
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: '50%',
          filter: 'blur(60px)',
          opacity: 0.35,
          zIndex: 0,
          pointerEvents: 'none',
        },
        // On phones the glows stay inside the screen (0); sticking out past the edge would
        // make the whole page scroll sideways. From tablet width (sm) there's room to spill.
        '&::before': { top: 0, left: { xs: 0, sm: -80 }, bgcolor: 'primary.light' },
        '&::after': { bottom: 0, right: { xs: 0, sm: -80 }, bgcolor: 'secondary.light' },
      }}
    >
      {/* The whole card sits on a layer above the glows. (The fade-in animation creates its
          own layer, so the "above" setting has to be on this outer box, not on the card.) */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <FadeIn>
          <Paper
            sx={{
              position: 'relative',
              overflow: 'hidden',
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 20px 48px rgba(79, 70, 229, 0.12)',
              // A thin indigo-to-teal strip along the top edge: a small brand detail.
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: '0 0 auto 0',
                height: 4,
                background: 'linear-gradient(90deg, #4f46e5, #0d9488)',
              },
            }}
          >
            {/* The same logo tile as the header, larger, so the card feels part of the site. */}
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 52,
                height: 52,
                mx: 'auto',
                mb: 2,
                borderRadius: 3,
                color: 'primary.contrastText',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)',
              }}
            >
              <ForumRoundedIcon />
            </Box>
            <Typography variant="h5" component="h1" sx={{ textAlign: 'center' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                {subtitle}
              </Typography>
            )}
            <Box sx={{ mt: 4 }}>{children}</Box>
          </Paper>
        </FadeIn>
      </Box>
    </Box>
  );
}
