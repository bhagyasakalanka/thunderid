// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  PageContent,
  PageTitle,
  Stack,
  Typography,
} from '@wso2/oxygen-ui';
import {CloudDownload, KeyRound, Undo2, Variable} from '@wso2/oxygen-ui-icons-react';
import {useMemo, useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate, useParams} from 'react-router';
import useApplyVersion from '../api/useApplyVersion';
import useCaptureVersion from '../api/useCaptureVersion';
import useCheckVariables from '../api/useCheckVariables';
import useGetGateways from '../api/useGetGateways';
import useGetVersions from '../api/useGetVersions';
import ApplyDialog from '../components/ApplyDialog';
import DataPlaneStatusChip from '../components/DataPlaneStatusChip';
import MissingVariablesNotice from '../components/MissingVariablesNotice';
import QueuedWorkNotice from '../components/QueuedWorkNotice';
import RevertDialog from '../components/RevertDialog';
import type {Gateway, Version} from '../models/promotion';

/**
 * Page showing one gateway's version history, with apply and revert actions.
 */
export default function GatewayDetailPage(): JSX.Element {
  const {t} = useTranslation();
  const {gatewayId = ''} = useParams<{gatewayId: string}>();
  const navigate = useNavigate();

  const {data: envData} = useGetGateways();
  const {data: versionData, isLoading, error} = useGetVersions(gatewayId);
  const [applyVersionSeq, setApplyVersionSeq] = useState<string | null>(null);
  // Work the data plane has not taken yet. An apply is delivered by the Control Plane pod holding
  // that data plane's connection, which is not always the one that accepted the request.
  const [queuedJobId, setQueuedJobId] = useState<string | undefined>(undefined);
  const applyVersion = useApplyVersion();
  const captureVersion = useCaptureVersion();
  const {data: variableStatus} = useCheckVariables(gatewayId);

  const [revertTo, setRevertTo] = useState<string | undefined>(undefined);

  const gateways: Gateway[] = useMemo(() => envData?.gateways ?? [], [envData]);
  const gateway: Gateway | undefined = gateways.find((env: Gateway) => env.id === gatewayId);
  const versions: Version[] = versionData?.versions ?? [];

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{gateway?.name ?? t('promotions:detail.title', 'Gateway')}</PageTitle.Header>
        <PageTitle.SubHeader>
          <Stack direction="row" spacing={1} alignItems="center">
            <span>
              {t('promotions:detail.subtitle', 'Configuration version history. The most recent version is at the top.')}
            </span>
            <DataPlaneStatusChip status={gateway?.dataPlane} />
          </Stack>
        </PageTitle.SubHeader>
        <PageTitle.Actions>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<CloudDownload size={16} />}
              disabled={captureVersion.isPending}
              onClick={() => {
                captureVersion.mutate({gatewayId});
              }}
            >
              {captureVersion.isPending
                ? t('promotions:capture.inProgress', 'Capturing...')
                : t('promotions:capture.action', 'Capture version')}
            </Button>
            <Button
              startIcon={<KeyRound size={16} />}
              onClick={() => {
                void navigate(`/promotions/${gatewayId}/secrets`);
              }}
            >
              {t('promotions:detail.manageSecrets', 'Secrets')}
            </Button>
            {/* Variables belong to the gateway, the same as its secrets, so they are reached the
                same way rather than from a page of their own. */}
            <Button
              startIcon={<Variable size={16} />}
              onClick={() => {
                void navigate(`/promotions/${gatewayId}/variables`);
              }}
            >
              {t('promotions:detail.manageVariables', 'Variables')}
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<Undo2 size={16} />}
              disabled={versions.length < 2}
              onClick={() => {
                setRevertTo('previous');
              }}
            >
              {t('promotions:detail.revertPrevious', 'Revert to previous')}
            </Button>
          </Stack>
        </PageTitle.Actions>
      </PageTitle>

      <QueuedWorkNotice jobId={queuedJobId} onSettled={() => setQueuedJobId(undefined)} />

      <MissingVariablesNotice
        gatewayId={gatewayId}
        missing={variableStatus?.missing ?? []}
        missingSecrets={variableStatus?.missingSecrets ?? []}
      />

      {isLoading && (
        <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error">
          {error.message || t('promotions:detail.error', 'Failed to load the version history')}
        </Alert>
      )}

      {!isLoading && !error && versions.length === 0 && (
        <Alert severity="info">
          {t(
            'promotions:detail.empty',
            'This gateway has no configuration versions yet. Capture one from its Control Plane source to get started.',
          )}
        </Alert>
      )}

      <Stack spacing={2}>
        {versions.map((version: Version) => {
          const isApplied: boolean = gateway?.appliedSeq === version.seq;

          return (
            <Card key={version.seq} sx={{p: 2}}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{flexGrow: 1, minWidth: 0}}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" sx={{fontWeight: 600}}>
                      {t('promotions:detail.version', 'Version {{seq}}', {seq: version.seq})}
                    </Typography>
                    <Chip size="small" label={version.origin} />
                    {isApplied && (
                      <Chip size="small" color="success" label={t('promotions:detail.applied', 'Applied')} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(version.createdAt).toLocaleString()}
                    {version.note ? ` · ${version.note}` : ''}
                  </Typography>
                </Box>

                <Button
                  disabled={applyVersion.isPending || isApplied}
                  onClick={() => {
                    // An apply rewrites a running deployment, so it is confirmed against a diff of
                    // what is on it now rather than fired straight from the list.
                    setApplyVersionSeq(String(version.seq));
                  }}
                >
                  {t('promotions:detail.apply', 'Apply')}
                </Button>
                <Button
                  disabled={version.seq === versions[0]?.seq}
                  onClick={() => {
                    setRevertTo(String(version.seq));
                  }}
                >
                  {t('promotions:detail.revertToThis', 'Revert to this')}
                </Button>
              </Stack>
            </Card>
          );
        })}
      </Stack>

      <ApplyDialog
        open={applyVersionSeq !== null}
        gatewayId={gatewayId}
        gatewayName={gateway?.name ?? gatewayId}
        version={applyVersionSeq ?? ''}
        onQueued={setQueuedJobId}
        onClose={() => setApplyVersionSeq(null)}
      />

      {revertTo && gateway && (
        <RevertDialog
          open
          gatewayId={gatewayId}
          gatewayName={gateway.name}
          toVersion={revertTo}
          onClose={() => {
            setRevertTo(undefined);
          }}
        />
      )}
    </PageContent>
  );
}
