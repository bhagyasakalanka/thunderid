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
} from '@wso2/oxygen-ui';
import {type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import useDeleteEnvironmentVariable from '../api/useDeleteEnvironmentVariable';

interface EnvironmentVariableDeleteDialogProps {
  open: boolean;
  environmentVariableId: string;
  onClose: () => void;
}

/**
 * Confirms deleting an environment variable.
 */
export default function EnvironmentVariableDeleteDialog({
  open,
  environmentVariableId,
  onClose,
}: EnvironmentVariableDeleteDialogProps): JSX.Element {
  const {t} = useTranslation();
  const deleteEnvironmentVariable = useDeleteEnvironmentVariable();

  const handleDelete = (): void => {
    deleteEnvironmentVariable.mutate(environmentVariableId, {onSuccess: onClose});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('environmentVariables:delete.title', 'Delete Environment Variable')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            'environmentVariables:delete.message',
            'Are you sure you want to delete this environment variable? This action cannot be undone.',
          )}
        </DialogContentText>
        <Alert severity="warning" sx={{mt: 2}}>
          {t(
            'environmentVariables:delete.disclaimer',
            'Configuration that references this variable will no longer resolve when applied to a Data Plane.',
          )}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleteEnvironmentVariable.isPending}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={deleteEnvironmentVariable.isPending}
        >
          {deleteEnvironmentVariable.isPending
            ? t('common:status.deleting', 'Deleting...')
            : t('common:actions.delete', 'Delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
