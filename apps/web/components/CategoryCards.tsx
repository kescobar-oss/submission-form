'use client';
// A client component for the same reason as SiteHeader: we hand Next's Link to MUI's
// CardActionArea through the `component` prop, which only works between client components.
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { Category } from '@/lib/types';

// One entry per card. `category` is the code the form pre-selects; the words are for people.
const CHOICES: { category: Category; title: string; text: string }[] = [
  { category: 'BUG', title: 'Report a bug', text: 'Something is broken or not working as expected.' },
  { category: 'IMPROVEMENT', title: 'Suggest an improvement', text: 'Something works, but could be better.' },
  { category: 'NEW_FEATURE', title: 'Request a feature', text: "Something new you'd like us to build." },
];

export default function CategoryCards() {
  return (
    // A column on phones (xs), a row from tablet width (sm) up.
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      {CHOICES.map((choice) => (
        // flex: 1 gives all three cards the same width when they sit side by side.
        <Card key={choice.category} sx={{ flex: 1 }}>
          {/* CardActionArea makes the whole card one big clickable link (with a hover and
              ripple effect), instead of a small button somewhere inside it. */}
          <CardActionArea
            component={Link}
            href={`/new?category=${choice.category}`}
            sx={{ height: '100%' }}
          >
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                {choice.title}
              </Typography>
              <Typography color="text.secondary">{choice.text}</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}
