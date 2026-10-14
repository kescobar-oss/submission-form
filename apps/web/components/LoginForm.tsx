'use client';
// A client component: it holds what's typed in state and reacts to the submit button.
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from '@/components/AuthProvider';
import { validateLogin, type AuthErrors } from '@/lib/auth-validation';
import { homePathFor } from '@/lib/roles';

// next: where to go after logging in (already checked by safeNext on the page).
export default function LoginForm({ next }: { next: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthErrors>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // As soon as someone is logged in (just now, or already when they opened this page),
  // move on. replace instead of push, so the Back button doesn't return to the login form.
  // "/" means "no particular page was asked for", so each role goes to its own start page:
  // Users to the welcome page, Admin and Developer straight to Tickets.
  useEffect(() => {
    if (auth.status === 'authenticated') {
      router.replace(next === '/' ? homePathFor(auth.user.role) : next);
    }
  }, [auth, next, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlert(null);
    const found = validateLogin({ email, password });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const result = await auth.login(email.trim(), password);
    if (result.ok) return; // the effect above takes us to `next`; keep the spinner until then

    setSubmitting(false);
    // Clear the password after a failed attempt (a common habit), but keep the email.
    setPassword('');
    if (result.kind === 'unauthorized') {
      setAlert('Invalid email or password.');
    } else if (result.kind === 'network') {
      setAlert("We couldn't reach the server. Check your connection and try again.");
    } else {
      setAlert('Something went wrong on our side. Please try again in a moment.');
    }
  }

  return (
    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          {alert && <Alert severity="error">{alert}</Alert>}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            // Lets password managers recognise this as a login form and fill it in.
            autoComplete="email"
            autoFocus
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(errors.password)}
            helperText={errors.password}
            autoComplete="current-password"
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" loading={submitting}>
            Log in
          </Button>
          <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
            No account yet?{' '}
            {/* Keep ?next= so signing up returns them to the same place. */}
            <Link href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link>
          </Typography>
        </Stack>
      </form>
    </Paper>
  );
}
