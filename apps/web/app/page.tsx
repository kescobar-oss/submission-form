import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CategoryCards from '@/components/CategoryCards';
import FadeIn from '@/components/FadeIn';
import StaffRedirect from '@/components/StaffRedirect';

// The welcome page at /. A server component (no 'use client'): the text never changes, so
// it's built once into HTML. Picking a card goes to /new with that category pre-selected.
// The animated parts (FadeIn, the cards) are client components placed inside it.
export default function Home() {
  return (
    // Extra space above on bigger screens, so the page feels like a landing page, not a form.
    <Box sx={{ pt: { xs: 1, sm: 4 }, pb: 4 }}>
      <FadeIn>
        {/* A small label above the heading (an "eyebrow"), a common touch on polished sites. */}
        <Typography
          variant="overline"
          sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}
        >
          Daily Monitoring Tracker Feedback
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          How can we help?
        </Typography>
      </FadeIn>
      <FadeIn delay={80}>
        <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 520 }}>
          Report any issue, suggest an improvement or request a feature.
        </Typography>
      </FadeIn>
      <CategoryCards />
      {/* Sends a logged-in Admin or Developer straight on to /tickets. */}
      <StaffRedirect />
    </Box>
  );
}
