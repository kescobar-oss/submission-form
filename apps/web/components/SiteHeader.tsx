'use client';
// A client component because we hand Next's Link to MUI's Button through the `component`
// prop. Handing over a component like that is only allowed between client components.
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import Link from 'next/link';

export default function SiteHeader() {
  return (
    // A white bar instead of a solid colour block (option A, "clean and light").
    // position="sticky" keeps it at the top while you scroll; the blur lets the page show
    // faintly through it, a common touch on modern sites.
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {/* Container lines the header up with the page content below it. */}
      <Container maxWidth="md">
        <Toolbar disableGutters>
          {/* The logo and title together are a link home, like on most websites. */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexGrow: 1,
              minWidth: 0, // lets the title shrink (and show "…") instead of pushing buttons off
              color: 'text.primary',
              textDecoration: 'none',
            }}
          >
            {/* A small indigo tile with an icon: a simple "logo" built from theme colours. */}
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <ForumRoundedIcon fontSize="small" />
            </Box>
            {/* The name is long, so on phones (xs) it's a little smaller and may wrap onto two
                tight lines instead of being cut off; from tablet width (sm) it stays on one. */}
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.95rem', sm: '1.125rem' },
                lineHeight: 1.2,
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
              }}
            >
              Daily Monitoring Ticketing System
            </Typography>
          </Box>
          {/* component={Link} renders MUI's button styling but navigates like a Next.js link,
              so moving between pages doesn't reload the whole site. There's no "New" button:
              the logo and title already lead home, where a new request starts.
              Less side padding on phones (xs) leaves more room for the title. */}
          <Button
            color="inherit"
            component={Link}
            href="/submissions"
            sx={{ minWidth: 0, px: { xs: 1, sm: 2 }, color: 'text.secondary' }}
          >
            Submissions
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
