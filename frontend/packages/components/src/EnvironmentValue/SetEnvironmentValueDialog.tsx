// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {Environment} from '@thunderid/contexts';
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography} from '@wso2/oxygen-ui';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import type {StoredValue, ValueReference} from './models';
import {useSetStoredValue} from './useEnvironmentValues';
import {fromListText, toListText} from './values';

interface SetEnvironmentValueDialogProps {
  open: boolean;
  reference: ValueReference;
  environment: Environment;
  label: string;
  /** The variable as the gateway holds it, which the dialog starts from. A secret is never read. */
  current?: StoredValue;
  /** The value's description, kept as it is. */
  description?: string;
  onClose: () => void;
}

/**
 * Sets the value an environment's gateway holds for a field. A list is written one item per line.
 */
export default function SetEnvironmentValueDialog({
  open,
  reference,
  environment,
  label,
  current = undefined,
  description = undefined,
  onClose,
}: SetEnvironmentValueDialogProps): JSX.Element {
  const {t} = useTranslation();
  const isSecret: boolean = reference.kind === 'secret';
  const setValue = useSetStoredValue(reference.kind);
  // Mounted only while open, so it starts from what the gateway holds rather than an earlier edit.
  const [text, setText] = useState<string>(() => {
    if (current?.value === undefined || isSecret) return '';
    return reference.list ? toListText(current.value) : current.value;
  });

  const value: string = reference.list ? fromListText(text) : text;
  const invalid: boolean = (reference.list ? text.trim() : text) === '';
  const saving: boolean = setValue.isPending;

  const save = (): void => {
    setValue.mutate({gatewayId: environment.id, name: reference.name, value, description}, {onSuccess: onClose});
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('common:environment.edit.title', '{{label}} in {{environment}}', {label, environment: environment.name})}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
          {reference.list
            ? t(
                'common:environment.edit.listDescription',
                'Only {{environment}} holds this value. Enter one per line.',
                {environment: environment.name},
              )
            : t('common:environment.edit.description', 'Only {{environment}} holds this value.', {
                environment: environment.name,
              })}
        </Typography>
        {setValue.isError && (
          <Alert severity="error" sx={{mb: 2}}>
            {t('common:environment.edit.error', 'The value could not be saved. Please try again.')}
          </Alert>
        )}
        <TextField
          fullWidth
          label={label}
          type={isSecret ? 'password' : 'text'}
          multiline={Boolean(reference.list)}
          minRows={reference.list ? 3 : undefined}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('common:actions.cancel')}
        </Button>
        <Button variant="contained" onClick={save} disabled={invalid || saving}>
          {t('common:actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
