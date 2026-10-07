// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {Environment} from '@thunderid/contexts';
import {useCopyToClipboard} from '@thunderid/hooks';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@wso2/oxygen-ui';
import {Check, Copy} from '@wso2/oxygen-ui-icons-react';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import type {ValueReference} from './models';
import {useSetStoredValue} from './useEnvironmentValues';
import {generateSecret} from './values';

interface RegenerateEnvironmentSecretDialogProps {
  open: boolean;
  reference: ValueReference;
  environment: Environment;
  label: string;
  /** The secret's description, kept as it is. */
  description?: string;
  onClose: () => void;
}

/**
 * Replaces the secret an environment's gateway holds with a new random one, and shows it once.
 */
export default function RegenerateEnvironmentSecretDialog({
  open,
  reference,
  environment,
  label,
  description = undefined,
  onClose,
}: RegenerateEnvironmentSecretDialogProps): JSX.Element {
  const {t} = useTranslation();
  const {copied, copy} = useCopyToClipboard({resetDelay: 2000});
  const updateSecret = useSetStoredValue('secret');
  const [generated, setGenerated] = useState<string | undefined>(undefined);

  const close = (): void => {
    setGenerated(undefined);
    onClose();
  };

  const regenerate = (): void => {
    const value: string = generateSecret();
    updateSecret.mutate(
      {gatewayId: environment.id, name: reference.name, value, description},
      {onSuccess: () => setGenerated(value)},
    );
  };

  return (
    <Dialog open={open} onClose={generated ? undefined : close} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('common:environment.regenerate.title', 'Regenerate {{label}} in {{environment}}', {
          label,
          environment: environment.name,
        })}
      </DialogTitle>
      <DialogContent>
        {generated ? (
          <>
            <Alert severity="warning" sx={{mb: 2}}>
              {t('common:environment.regenerate.copyNow', 'Copy it now. It is not shown again.')}
            </Alert>
            <TextField
              fullWidth
              label={label}
              value={generated}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={`${t('common:actions.copy')} ${label}`}
                      onClick={() => {
                        copy(generated).catch(() => {
                          // Error already handled in copy
                        });
                      }}
                      edge="end"
                      size="small"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{'& input': {fontFamily: 'monospace', fontSize: '0.875rem'}}}
            />
          </>
        ) : (
          <>
            {updateSecret.isError && (
              <Alert severity="error" sx={{mb: 2}}>
                {t('common:environment.edit.error', 'The value could not be saved. Please try again.')}
              </Alert>
            )}
            <Typography variant="body2">
              {t(
                'common:environment.regenerate.description',
                'A new {{label}} replaces the one {{environment}} holds. Anything still using the old one stops working there.',
                {label, environment: environment.name},
              )}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {generated ? (
          <Button variant="contained" onClick={close}>
            {t('common:environment.regenerate.done', 'Done')}
          </Button>
        ) : (
          <>
            <Button onClick={close} disabled={updateSecret.isPending}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant="contained" color="error" onClick={regenerate} disabled={updateSecret.isPending}>
              {t('common:environment.value.regenerate', 'Regenerate')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
