// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Alert, Box, Button, Card, PageContent, PageTitle, Stack, Typography} from '@wso2/oxygen-ui';
import {ArrowRight} from '@wso2/oxygen-ui-icons-react';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useParams} from 'react-router';
import useGetEnvironments from '../api/useGetEnvironments';
import usePromotionServiceUrl from '../api/usePromotionServiceUrl';
import DataPlaneStatusChip from '../components/DataPlaneStatusChip';
import PromoteDialog from '../components/PromoteDialog';
import type {Environment} from '../models/promotion';

/**
 * Chooses which gateway to promote a version into.
 *
 * The target is picked here rather than derived from a chain: gateways are a flat set, and which
 * moves an organization permits comes from its environment hierarchy, which the environment manager
 * holds. This offers every other gateway and leaves that service to accept or refuse the move.
 */
export default function PromotePage(): JSX.Element {
  const {t} = useTranslation();
  const {envId = ''} = useParams<{envId: string}>();
  const promotionService: string | undefined = usePromotionServiceUrl();
  const {data} = useGetEnvironments();
  const [target, setTarget] = useState<Environment | undefined>(undefined);

  const environments: Environment[] = data?.environments ?? [];
  const source: Environment | undefined = environments.find((env: Environment) => env.id === envId);
  const targets: Environment[] = environments.filter((env: Environment) => env.id !== envId);

  if (!promotionService) {
    return (
      <PageContent>
        <Alert severity="info">
          {t(
            'promotions:promote.notConfigured',
            'No environment manager is configured, so promotion is not available on this deployment.',
          )}
        </Alert>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>
          {t('promotions:promote.title', 'Promote {{name}}', {name: source?.name ?? envId})}
        </PageTitle.Header>
        <PageTitle.SubHeader>
          {t('promotions:promote.subtitle', 'Choose which gateway to promote this configuration into.')}
        </PageTitle.SubHeader>
      </PageTitle>

      {targets.length === 0 && (
        <Alert severity="info">
          {t('promotions:promote.noTargets', 'This organization has no other gateway to promote into.')}
        </Alert>
      )}

      <Stack spacing={2}>
        {targets.map((env: Environment) => (
          <Card key={env.id} sx={{p: 2}}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Box sx={{flexGrow: 1, minWidth: 200}}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" sx={{fontWeight: 600}}>
                    {env.name}
                  </Typography>
                  <DataPlaneStatusChip status={env.dataPlane} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {t('promotions:listing.versionState', 'Latest v{{latest}} · Applied v{{applied}}', {
                    applied: env.appliedSeq || '-',
                    latest: env.latestSeq || '-',
                  })}
                </Typography>
              </Box>
              <Button
                variant="contained"
                endIcon={<ArrowRight size={16} />}
                onClick={() => {
                  setTarget(env);
                }}
              >
                {t('promotions:promote.into', 'Promote into {{target}}', {target: env.name})}
              </Button>
            </Stack>
          </Card>
        ))}
      </Stack>

      {target && source && (
        <PromoteDialog
          open
          fromEnvId={source.id}
          fromEnvName={source.name}
          toEnvId={target.id}
          toEnvName={target.name}
          toDataPlaneConnected={target.dataPlane?.connected ?? false}
          onClose={() => {
            setTarget(undefined);
          }}
        />
      )}
    </PageContent>
  );
}
