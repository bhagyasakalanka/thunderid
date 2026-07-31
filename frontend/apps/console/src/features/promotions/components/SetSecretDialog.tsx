/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@wso2/oxygen-ui';
import {useEffect, useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import useSetEnvironmentSecret from '../api/useSetEnvironmentSecret';
import type {SecretEntry} from '../models/promotion';

interface SetSecretDialogProps {
  open: boolean;
  envId: string;
  secret: SecretEntry | null;
  onClose: () => void;
}

/**
 * Sets one credential to a value the operator supplies.
 *
 * This is the only way to fill a credential the Data Plane replays to a third party, because that value
 * is issued elsewhere and cannot be generated here.
 */
export default function SetSecretDialog({open, envId, secret, onClose}: SetSecretDialogProps): JSX.Element {
  const {t} = useTranslation();
  const setSecret = useSetEnvironmentSecret();
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    if (open) {
      setValue('');
    }
  }, [open]);

  const handleSave = (): void => {
    if (!secret || value === '') {
      return;
    }
    setSecret.mutate({envId, name: secret.name, value}, {onSuccess: () => onClose()});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('promotions:secrets.setTitle', 'Set secret')}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{wordBreak: 'break-all'}}>{secret?.name}</DialogContentText>
        {secret?.kind === 'hash' ? (
          <Alert severity="info" sx={{mt: 2}}>
            {t(
              'promotions:secrets.setHashNotice',
              'This credential is stored as a one-way hash, so it cannot be read back afterwards. Keep a copy of what you enter.',
            )}
          </Alert>
        ) : (
          <Alert severity="info" sx={{mt: 2}}>
            {t(
              'promotions:secrets.setValueNotice',
              'This credential is replayed to an external service, so enter exactly the value that service issued.',
            )}
          </Alert>
        )}
        <TextField
          fullWidth
          sx={{mt: 2}}
          type="password"
          autoComplete="new-password"
          label={t('promotions:secrets.valueLabel', 'Value')}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={setSecret.isPending}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={setSecret.isPending || value === ''}>
          {setSecret.isPending ? t('promotions:secrets.saving', 'Saving...') : t('common:actions.save', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
