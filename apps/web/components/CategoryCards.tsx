'use client';
// A client component for the same reason as SiteHeader: we hand Next's Link to MUI's
// CardActionArea through the `component` prop, which only works between client components.
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import type { Keyframes } from '@emotion/react';
import Link from 'next/link';
import FadeIn from '@/components/FadeIn';
import { glow, nudge, respectReducedMotion, twirl, wiggle } from '@/lib/animations';
import type { Category } from '@/lib/types';

// One entry per card. `category` is the code the form pre-selects; the words are for people.
// `color` names a theme colour (so it follows theme.ts), and `iconMove` is the card's own
// hover animation from lib/animations.ts.
const CHOICES: {
  category: Category;
  title: string;
  text: string;
  icon: ReactNode;
  color: 'error' | 'warning' | 'primary';
  iconMove: Keyframes;
}[] = [
  {
    category: 'BUG',
    title: 'Report a bug',
    text: 'Something is broken or not working as expected.',
    icon: <BugReportRoundedIcon />,
    color: 'error',
    iconMove: wiggle,
  },
  {
    category: 'IMPROVEMENT',
    title: 'Suggest an improvement',
    text: 'Something works, but could be better.',
    icon: <LightbulbRoundedIcon />,
    color: 'warning',
    iconMove: glow,
  },
  {
    category: 'NEW_FEATURE',
    title: 'Request a feature',
    text: "Something new you'd like us to build.",
    icon: <AutoAwesomeRoundedIcon />,
    color: 'primary',
    iconMove: twirl,
  },
];

export default function CategoryCards() {
  return (
    // A column on phones (xs), a row from tablet width (sm) up.
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      {CHOICES.map((choice, index) => (
        // Each card arrives 120 ms after the one before it, after the heading (which uses 0 and 80).
        // flex: 1 gives all three cards the same width when they sit side by side.
        <Box key={choice.category} sx={{ flex: 1, display: 'flex' }}>
          <FadeIn delay={160 + index * 120}>
            <Card
              sx={(theme) => {
                const main = theme.palette[choice.color].main;
                return {
                  height: '100%',
                  position: 'relative',
                  // A short transition, so the lift and shadow glide instead of jumping.
                  transition: 'transform 250ms ease, box-shadow 250ms ease, border-color 250ms ease',

                  // The coloured bar across the top. It exists all the time but is squashed to
                  // zero width (scaleX(0)); hovering stretches it out from the left.
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: '0 0 auto 0',
                    height: 4,
                    bgcolor: main,
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 300ms ease',
                    zIndex: 1,
                  },

                  // Everything that happens on hover. :focus-within gives keyboard users (who
                  // press Tab to reach the card) exactly the same effect as mouse users.
                  '&:hover, &:focus-within': {
                    transform: 'translateY(-6px)',
                    borderColor: alpha(main, 0.4),
                    // A deeper shadow tinted with the card's colour: it seems to float up.
                    boxShadow: `0 12px 32px ${alpha(main, 0.18)}`,
                    '&::before': { transform: 'scaleX(1)' },
                    '& .card-icon svg': { animation: `${choice.iconMove} 700ms ease-in-out` },
                    '& .card-cta': { opacity: 1, transform: 'translateX(0)' },
                    '& .card-arrow': { animation: `${nudge} 900ms ease-in-out infinite` },
                  },

                  // CardActionArea normally greys the whole card on hover; our own effects
                  // replace that, so its grey layer is hidden.
                  '& .MuiCardActionArea-focusHighlight': { display: 'none' },
                  ...respectReducedMotion,
                };
              }}
            >
              {/* CardActionArea makes the whole card one big clickable link (with a ripple
                  on click), instead of a small button somewhere inside it. */}
              <CardActionArea
                component={Link}
                href={`/new?category=${choice.category}`}
                sx={{ height: '100%', alignItems: 'stretch' }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* The icon in a soft circle of the card's colour. The class names
                      (card-icon, card-cta, card-arrow) are labels the hover rules above
                      use to find these pieces. */}
                  <Box
                    className="card-icon"
                    sx={(theme) => ({
                      display: 'grid',
                      placeItems: 'center',
                      width: 48,
                      height: 48,
                      mb: 2,
                      borderRadius: 3,
                      color: theme.palette[choice.color].main,
                      bgcolor: alpha(theme.palette[choice.color].main, 0.12),
                    })}
                  >
                    {choice.icon}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {choice.title}
                  </Typography>
                  {/* flexGrow pushes "Get started" to the bottom, so it lines up on all cards. */}
                  <Typography color="text.secondary" sx={{ flexGrow: 1 }}>
                    {choice.text}
                  </Typography>
                  {/* Hidden and shifted left until hover, then it fades and slides into place.
                      On phones there's no hover, so it's always shown there. */}
                  <Box
                    className="card-cta"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 2,
                      fontWeight: 600,
                      color: `${choice.color}.main`,
                      opacity: { xs: 1, sm: 0 },
                      transform: { xs: 'none', sm: 'translateX(-8px)' },
                      transition: 'opacity 250ms ease, transform 250ms ease',
                    }}
                  >
                    Get started
                    <ArrowForwardRoundedIcon className="card-arrow" fontSize="small" />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </FadeIn>
        </Box>
      ))}
    </Stack>
  );
}
