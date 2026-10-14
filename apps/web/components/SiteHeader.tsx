'use client';
// A client component because we hand Next's Link to MUI's Button through the `component`
// prop. Handing over a component like that is only allowed between client components.
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ROLE_LABELS } from '@/lib/types';

// Shared look for the header's text buttons. On phones (xs): less side padding and slightly
// smaller text, so up to three buttons fit beside the title. nowrap keeps "My requests" on
// one line instead of folding it in two.
const navButtonSx = {
  minWidth: 0,
  px: { xs: 0.75, sm: 1.5 },
  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
  whiteSpace: 'nowrap',
  color: 'text.secondary',
} as const;

// The right-hand side of the header, which depends on who's logged in.
// component={Link} renders MUI's button styling but navigates like a Next.js link, so moving
// between pages doesn't reload the whole site. There's no "New" button: the logo and title
// already lead home, where a new request starts.
function HeaderActions() {
  const auth = useAuth();
  const router = useRouter();

  // While the saved login is being checked, show nothing rather than the wrong buttons.
  if (auth.status === 'loading') return null;

  if (auth.status === 'anonymous') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button component={Link} href="/login" sx={navButtonSx}>
          Log in
        </Button>
        <Button component={Link} href="/register" variant="contained" size="small">
          Sign up
        </Button>
      </Box>
    );
  }

  const { user } = auth;
  // Only staff see the link to everyone's requests. This only tidies the menu: the API
  // still refuses other roles if they type /submissions themselves.
  const isStaff = user.role === 'ADMIN' || user.role === 'DEVELOPER';

  function handleLogout() {
    auth.logout();
    router.push('/');
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 1 } }}>
      {isStaff && (
        <Button component={Link} href="/submissions" sx={navButtonSx}>
          Submissions
        </Button>
      )}
      <Button component={Link} href="/my-requests" sx={navButtonSx}>
        My requests
      </Button>
      {/* Who's logged in. Hidden on phones (xs) so the buttons still fit on one line. */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, ml: 1 }}>
        <Typography variant="body2" noWrap sx={{ maxWidth: 140, fontWeight: 600 }}>
          {user.name}
        </Typography>
        <Chip label={ROLE_LABELS[user.role]} size="small" color={isStaff ? 'primary' : 'default'} />
      </Box>
      <Button onClick={handleLogout} sx={navButtonSx}>
        Log out
      </Button>
    </Box>
  );
}

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
          <HeaderActions />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
