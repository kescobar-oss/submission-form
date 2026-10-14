'use client';
// A client component: this code runs in the visitor's browser, because it must react to
// every keystroke and click. Server components can't do that; they run once to make HTML.
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  type Category,
  type Priority,
} from '@/lib/types';
import { createRequest } from '@/lib/api';
import {
  apiMessagesToErrors,
  DESCRIPTION_MAX,
  EMPTY_FORM,
  NAME_MAX,
  validate,
  type FieldName,
  type FormErrors,
  type FormValues,
} from '@/lib/validation';

// initialCategory is a prop: the page that shows this form can say which category to start
// with (the one picked on the welcome page). It's optional, so the form also works without it.
export default function RequestForm({ initialCategory }: { initialCategory?: Category }) {
  // State: React's memory for this component. `values` is what's been typed so far;
  // calling setValues stores new values AND tells React to redraw the form with them.
  // The starting category is only a suggestion: the dropdown can still change it.
  const [values, setValues] = useState<FormValues>({
    ...EMPTY_FORM,
    category: initialCategory ?? '',
  });
  // One message per field that failed validation; empty means no red text anywhere.
  const [errors, setErrors] = useState<FormErrors>({});
  // The three UI states of a request. Loading: submitting is true. Error: alert holds a
  // message. Success: we leave this page for /success, so it needs no state of its own.
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const router = useRouter();

  // Every input calls this on change. It copies the old values, replaces one field, and
  // clears that field's error so the red text disappears as soon as you start fixing it.
  function update<K extends FieldName>(field: K, value: FormValues[K]) {
    setValues((old) => ({ ...old, [field]: value }));
    setErrors((old) => ({ ...old, [field]: undefined }));
  }

  // async because it waits for the API; the page stays responsive while it does.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // A plain HTML form reloads the page on submit, which would wipe all the state.
    event.preventDefault();
    setAlert(null);
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return; // Stop here: nothing is sent while anything is red.

    setSubmitting(true); // Loading state: disables the button and shows the spinner.
    const result = await createRequest({
      // validate() checked trimmed text, so we send trimmed text too.
      name: values.name.trim(),
      email: values.email.trim(),
      // Safe to assert: validate() just confirmed these aren't '' any more.
      category: values.category as Category,
      priority: values.priority as Priority,
      description: values.description.trim(),
      consent: values.consent,
    });

    if (result.ok) {
      // Success state: go to the confirmation page. The id goes in the URL so that page
      // can show it; it's a random reference, not personal data.
      router.push(`/success?id=${encodeURIComponent(result.data.id)}`);
      return; // Keep the spinner on until the next page appears, so nobody clicks twice.
    }

    // Error state. `values` is never reset below, so everything typed stays in the form.
    setSubmitting(false);
    if (result.kind === 'validation') {
      // The API disagreed with the browser's checks: show its messages next to the fields.
      const fromApi = apiMessagesToErrors(result.messages);
      setErrors(fromApi.errors);
      if (fromApi.other.length > 0) setAlert(fromApi.other.join(' '));
    } else if (result.kind === 'network') {
      setAlert("We couldn't reach the server. Check your connection and try again; your answers are still here.");
    } else {
      setAlert('Something went wrong on our side. Please try again in a moment.');
    }
  }

  return (
    // Paper: a white card with a shadow. Less padding on phones (xs) than on bigger screens.
    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
      {/* noValidate turns off the browser's own pop-up bubbles, so our messages show instead. */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Stack: puts its children in a column with equal gaps, no margins needed. */}
        <Stack spacing={3}>
          {/* A controlled input: `value` comes from state, and onChange writes back to state.
              The text box shows whatever state says, so state is the single source of truth. */}
          <TextField
            label="Name"
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            // error turns the field red; helperText is the small line underneath it.
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
            fullWidth
            slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
          />

          <TextField
            label="Email"
            type="email"
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            required
            fullWidth
            // Phones show the keyboard with @ and suggest saved addresses.
            autoComplete="email"
          />

          {/* Select has no built-in error/helperText props, so FormControl groups the label,
              the dropdown and the message, and passes `error` down to all three. */}
          <FormControl error={Boolean(errors.category)} required fullWidth>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              label="Category"
              value={values.category}
              onChange={(e) => update('category', e.target.value as Category)}
            >
              {/* Build one menu item per allowed value, so the list can never drift from types.ts. */}
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.category}</FormHelperText>
          </FormControl>

          <FormControl error={Boolean(errors.priority)} required>
            <FormLabel id="priority-label">Priority</FormLabel>
            {/* row lays the three options side by side; they still fit on a phone screen. */}
            <RadioGroup
              row
              aria-labelledby="priority-label"
              value={values.priority}
              onChange={(e) => update('priority', e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <FormControlLabel key={p} value={p} control={<Radio />} label={PRIORITY_LABELS[p]} />
              ))}
            </RadioGroup>
            <FormHelperText>{errors.priority}</FormHelperText>
          </FormControl>

          <TextField
            label="Description"
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            error={Boolean(errors.description)}
            // Show the error if there is one, otherwise a live character count.
            helperText={errors.description ?? `${values.description.length} / ${DESCRIPTION_MAX}`}
            required
            fullWidth
            multiline
            minRows={4}
            slotProps={{ htmlInput: { maxLength: DESCRIPTION_MAX } }}
          />

          <FormControl error={Boolean(errors.consent)} required>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.consent}
                  onChange={(e) => update('consent', e.target.checked)}
                />
              }
              label="I agree that my name and email are stored so the team can follow up."
            />
            <FormHelperText>{errors.consent}</FormHelperText>
          </FormControl>

          {/* Only drawn when there's a message. It sits right above the button, where your eyes
              are after clicking it. severity="error" picks the red colour and icon. */}
          {alert && <Alert severity="error">{alert}</Alert>}

          {/* Full width on phones (easier to tap), normal size from "sm" up. */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            // loading shows a spinner AND disables the button, so a double click can't
            // send the same request twice.
            loading={submitting}
            loadingPosition="start"
            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          >
            Submit request
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
