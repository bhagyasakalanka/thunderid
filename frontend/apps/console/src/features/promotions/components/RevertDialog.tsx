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
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
} from '@wso2/oxygen-ui';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import useRevert from '../api/useRevert';

interface RevertDialogProps {
  open: boolean;
  envId: string;
  envName: string;
  /** A version number, or "previous" for the version immediately before the current one. */
  toVersion: string;
  onClose: () => void;
}

/**
 * Confirms reverting an environment to an earlier version.
 */
export default function RevertDialog({open, envId, envName, toVersion, onClose}: RevertDialogProps): JSX.Element {
  const {t} = useTranslation();
  const revert = useRevert();
  const [applyNow, setApplyNow] = useState<boolean>(true);

  const handleRevert = (): void => {
    revert.mutate({envId, toVersion, apply: applyNow}, {onSuccess: () => onClose()});
  };

  const target: string =
    toVersion === 'previous'
      ? t('promotions:revert.previousVersion', 'the previous version')
      : t('promotions:revert.versionNumber', 'version {{seq}}', {seq: toVersion});

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('promotions:revert.title', 'Revert environment')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('promotions:revert.message', 'Revert {{env}} to {{target}}?', {env: envName, target})}
        </DialogContentText>
        <Alert severity="info" sx={{mt: 2}}>
          {t(
            'promotions:revert.disclaimer',
            'History is preserved. Reverting records a new version restoring the older configuration.',
          )}
        </Alert>
        <FormControlLabel
          sx={{mt: 1}}
          control={
            <Checkbox
              checked={applyNow}
              onChange={(event) => {
                setApplyNow(event.target.checked);
              }}
            />
          }
          label={t('promotions:revert.applyNow', 'Apply to the data plane now')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={revert.isPending}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button variant="contained" color="warning" onClick={handleRevert} disabled={revert.isPending}>
          {revert.isPending
            ? t('promotions:revert.inProgress', 'Reverting...')
            : t('promotions:revert.confirm', 'Revert')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
