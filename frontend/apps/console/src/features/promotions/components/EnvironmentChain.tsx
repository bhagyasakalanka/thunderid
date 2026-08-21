// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Alert, Box, Button, Card, Chip, CircularProgress, Stack, Typography} from '@wso2/oxygen-ui';
import {type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router';
import DataPlaneStatusChip from './DataPlaneStatusChip';
import useEnvManagerUrl from '../api/useEnvManagerUrl';
import useGetEnvironments from '../api/useGetEnvironments';
import useSetManagedEnvironment from '../api/useSetManagedEnvironment';
import type {Environment} from '../models/promotion';

/**
 * Lists the gateways of the organization, one card each, with its version state and the actions that
 * belong to a gateway on its own: history, secrets, variables, and which one the Control Plane
 * administers directly.
 *
 * Which gateway may be promoted into which is not shown here. That hierarchy belongs to the
 * organization and is held outside this server, so promotion is driven by the environment manager
 * rather than from this list.
 */
export default function EnvironmentChain(): JSX.Element {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const baseUrl: string | undefined = useEnvManagerUrl();
  const {data, isLoading, error} = useGetEnvironments();
  const setManaged = useSetManagedEnvironment();

  if (!baseUrl) {
    return (
      <Alert severity="info">
        {t('promotions:notConfigured', 'Promotions are available on the Control Plane console only.')}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{py: 8, textAlign: 'center'}}>
        <Typography variant="h6" color="error" gutterBottom>
          {t('promotions:listing.error', 'Failed to load environments')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message || t('common:messages.somethingWentWrong', 'Something went wrong')}
        </Typography>
      </Box>
    );
  }

  const environments: Environment[] = data?.environments ?? [];

  if (environments.length === 0) {
    return (
      <Alert severity="info">
        {t('promotions:listing.empty', 'No environments are registered in the environment manager yet.')}
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {environments.map((env: Environment) => {
        return (
          <Card key={env.id} sx={{p: 2}}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Box sx={{flexGrow: 1, minWidth: 200}}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" sx={{fontWeight: 600}}>
                    {env.name}
                  </Typography>
                  {env.managedByControlPlane && (
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={t('promotions:listing.managed', 'Managed here')}
                      title={t(
                        'promotions:listing.managedHint',
                        'Editing configuration here edits this environment, and a credential created here is issued against it.',
                      )}
                    />
                  )}
                  {env.hasPendingChanges && (
                    <Chip size="small" color="warning" label={t('promotions:listing.pending', 'Pending changes')} />
                  )}
                  <DataPlaneStatusChip status={env.dataPlane} />
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('promotions:listing.versionState', 'Latest v{{latest}} · Applied v{{applied}}', {
                    applied: env.appliedSeq || '-',
                    latest: env.latestSeq || '-',
                  })}
                </Typography>
              </Box>

              <Button
                onClick={() => {
                  void navigate(`/promotions/${env.id}`);
                }}
              >
                {t('promotions:listing.viewHistory', 'History')}
              </Button>

              {!env.managedByControlPlane && (
                <Button
                  disabled={setManaged.isPending}
                  onClick={() => {
                    setManaged.mutate(env.id);
                  }}
                >
                  {t('promotions:listing.manageHere', 'Manage here')}
                </Button>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
