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
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@wso2/oxygen-ui';
import {type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import DiffSummaryChips from './DiffSummaryChips';
import ResourceDiffList from './ResourceDiffList';
import useApplyToControlPlane from '../api/useApplyToControlPlane';
import useGetEnvironmentDiff from '../api/useGetEnvironmentDiff';

export interface ControlPlaneDialogProps {
  open: boolean;
  envId: string;
  envName: string;
  /** The version to write, as a sequence number. */
  version: string;
  onClose: () => void;
}

/**
 * Confirms writing a version into the environment's own Control Plane tenant by showing what it
 * would change there first.
 *
 * The comparison is against what that tenant was last written with, which is neither the newest
 * version nor the one applied to the Data Plane: writing to the Control Plane leaves the Data Plane
 * alone, and applying leaves the Control Plane alone, so the two drift apart by design.
 *
 * Deletions matter most here. Writing an older version removes what a newer one created, and that is
 * the part worth seeing before it happens rather than reading in the result.
 */
export default function ControlPlaneDialog({
  open,
  envId,
  envName,
  version,
  onClose,
}: ControlPlaneDialogProps): JSX.Element {
  const {t} = useTranslation();
  const {data: diff, isLoading, error} = useGetEnvironmentDiff(open ? envId : '', 'control-plane', version);
  const applyToControlPlane = useApplyToControlPlane();

  const handleApply = (): void => {
    applyToControlPlane.mutate({envId, version}, {onSuccess: () => onClose()});
  };

  const deleted: number = diff?.summary.deleted ?? 0;
  const changeCount: number = (diff?.summary.added ?? 0) + (diff?.summary.updated ?? 0) + deleted;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('promotions:controlPlane.title', 'Write to Control Plane')}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{mb: 2}}>
          {t(
            'promotions:controlPlane.body',
            "Version {{version}} will be written to {{env}}'s Control Plane tenant. The Data Plane is not touched.",
            {env: envName, version},
          )}
        </Typography>

        {isLoading && (
          <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
            <CircularProgress size={24} />
          </Box>
        )}
        {error && (
          <Alert severity="error">
            {t('promotions:controlPlane.diffError', 'The changes could not be loaded, so this cannot be reviewed.')}
          </Alert>
        )}
        {diff && (
          <>
            <DiffSummaryChips summary={diff.summary} />
            {deleted > 0 && (
              <Alert severity="warning" sx={{mt: 2}}>
                {t(
                  'promotions:controlPlane.willDelete',
                  '{{count}} resource(s) will be removed from the Control Plane, because this version does not describe them.',
                  {count: deleted},
                )}
              </Alert>
            )}
            {changeCount === 0 && (
              <Alert severity="info" sx={{mt: 2}}>
                {t(
                  'promotions:controlPlane.noChanges',
                  'This version matches what the Control Plane already holds. Nothing would change.',
                )}
              </Alert>
            )}
            <Box sx={{mt: 2}}>
              <ResourceDiffList diff={diff} />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common:actions.cancel', 'Cancel')}</Button>
        <Button variant="contained" disabled={applyToControlPlane.isPending} onClick={handleApply}>
          {t('promotions:detail.toControlPlane', 'To Control Plane')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
