'use client';
// A client component: it holds what's typed in state and reacts to the submit button.
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { useAuth } from '@/components/AuthProvider';
import PasswordField from '@/components/PasswordField';
import { PASSWORD_MAX, PASSWORD_MIN, validateRegister, type AuthErrors } from '@/lib/auth-validation';
import { NAME_MAX } from '@/lib/validation';

export default function RegisterForm({ next }: { next: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthErrors>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Signing up also logs you in (the API returns a token), so the same redirect applies.
  useEffect(() => {
    if (auth.status === 'authenticated') router.replace(next);
  }, [auth.status, next, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlert(null);
    const found = validateRegister({ name, email, password });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const result = await auth.register(name.trim(), email.trim(), password);
    if (result.ok) return;

    setSubmitting(false);
    if (result.kind === 'conflict') {
      // The API's own words, under the field they're about.
      setErrors({ email: result.messages[0] ?? 'An account with this email already exists.' });
    } else if (result.kind === 'validation') {
      setAlert(result.messages.join(' '));
    } else if (result.kind === 'network') {
      setAlert("We couldn't reach the server. Check your connection and try again.");
    } else {
      setAlert('Something went wrong on our side. Please try again in a moment.');
    }
  }

  // No Paper here: AuthCard (on the page) draws the card around this form.
  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        {alert && <Alert severity="error">{alert}</Alert>}
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={Boolean(errors.name)}
          helperText={errors.name}
          autoComplete="name"
          autoFocus
          required
          fullWidth
          slotProps={{
            htmlInput: { maxLength: NAME_MAX },
            // Small icons inside the fields, the same style as the login form.
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(errors.email)}
          helperText={errors.email}
          autoComplete="email"
          required
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutlineRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        {/* Lock icon + show/hide button, shared with the login form. */}
        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(errors.password)}
          // Show the rule up front, so nobody has to fail once to learn it.
          helperText={errors.password ?? `At least ${PASSWORD_MIN} characters.`}
          // "new-password" tells password managers to offer a strong generated password.
          autoComplete="new-password"
          required
          fullWidth
          slotProps={{ htmlInput: { maxLength: PASSWORD_MAX } }}
        />
        <Button type="submit" variant="contained" size="large" fullWidth loading={submitting}>
          Create account
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <MuiLink
            component={Link}
            href={`/login?next=${encodeURIComponent(next)}`}
            underline="hover"
            sx={{ fontWeight: 600 }}
          >
            Log in
          </MuiLink>
        </Typography>
      </Stack>
    </form>
  );
}
