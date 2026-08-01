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
  Card,
  Chip,
  CircularProgress,
  PageContent,
  PageTitle,
  Stack,
  Typography,
} from '@wso2/oxygen-ui';
import {CloudDownload, CloudUpload, KeyRound, Undo2} from '@wso2/oxygen-ui-icons-react';
import {useMemo, useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate, useParams} from 'react-router';
import useApplyToControlPlane from '../api/useApplyToControlPlane';
import useApplyVersion from '../api/useApplyVersion';
import useCaptureVersion from '../api/useCaptureVersion';
import useCheckVariables from '../api/useCheckVariables';
import useGetEnvironments from '../api/useGetEnvironments';
import useGetVersions from '../api/useGetVersions';
import ApplyDialog from '../components/ApplyDialog';
import DataPlaneStatusChip from '../components/DataPlaneStatusChip';
import MissingVariablesNotice from '../components/MissingVariablesNotice';
import PromoteDialog from '../components/PromoteDialog';
import RevertDialog from '../components/RevertDialog';
import type {Environment, Version} from '../models/promotion';

/**
 * Page showing one environment's version history, with apply, revert and demote actions.
 */
export default function EnvironmentDetailPage(): JSX.Element {
  const {t} = useTranslation();
  const {envId = ''} = useParams<{envId: string}>();
  const navigate = useNavigate();

  const {data: envData} = useGetEnvironments();
  const {data: versionData, isLoading, error} = useGetVersions(envId);
  const [applyVersionSeq, setApplyVersionSeq] = useState<string | null>(null);
  const applyVersion = useApplyVersion();
  const applyToControlPlane = useApplyToControlPlane();
  const captureVersion = useCaptureVersion();
  const {data: variableStatus} = useCheckVariables(envId);

  const [revertTo, setRevertTo] = useState<string | undefined>(undefined);
  const [demoteTo, setDemoteTo] = useState<Environment | undefined>(undefined);

  const environments: Environment[] = useMemo(() => envData?.environments ?? [], [envData]);
  const environment: Environment | undefined = environments.find((env: Environment) => env.id === envId);
  const versions: Version[] = versionData?.versions ?? [];

  // Demotion pushes a version back down an incoming edge, so the candidates are exactly the
  // environments that can promote into this one.
  const lowerEnvironments: Environment[] = useMemo(() => {
    if (!environment) {
      return [];
    }
    const byId = new Map<string, Environment>(environments.map((env: Environment) => [env.id, env]));
    return (environment.promotedFrom ?? [])
      .map((id: string) => byId.get(id))
      .filter((candidate): candidate is Environment => Boolean(candidate));
  }, [environments, environment]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{environment?.name ?? t('promotions:detail.title', 'Environment')}</PageTitle.Header>
        <PageTitle.SubHeader>
          <Stack direction="row" spacing={1} alignItems="center">
            <span>
              {t('promotions:detail.subtitle', 'Configuration version history. The most recent version is at the top.')}
            </span>
            <DataPlaneStatusChip status={environment?.dataPlane} />
          </Stack>
        </PageTitle.SubHeader>
        <PageTitle.Actions>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<CloudDownload size={16} />}
              disabled={captureVersion.isPending}
              onClick={() => {
                captureVersion.mutate({envId});
              }}
            >
              {captureVersion.isPending
                ? t('promotions:capture.inProgress', 'Capturing...')
                : t('promotions:capture.action', 'Capture version')}
            </Button>
            {lowerEnvironments.map((env: Environment) => (
              <Button
                key={env.id}
                onClick={() => {
                  setDemoteTo(env);
                }}
              >
                {t('promotions:detail.demoteTo', 'Demote to {{target}}', {target: env.name})}
              </Button>
            ))}
            <Button
              startIcon={<KeyRound size={16} />}
              onClick={() => {
                void navigate(`/promotions/${envId}/secrets`);
              }}
            >
              {t('promotions:detail.manageSecrets', 'Secrets')}
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

      <MissingVariablesNotice
        envId={envId}
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
            'This environment has no configuration versions yet. Capture one from its Control Plane source to get started.',
          )}
        </Alert>
      )}

      <Stack spacing={2}>
        {versions.map((version: Version) => {
          const isApplied: boolean = environment?.appliedSeq === version.seq;

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
                {/* Promotion and revert already write the tenant; this is the same write on its own,
                    for putting it back in step when one of those failed part way through. It names a
                    version rather than assuming the newest, which is rarely the one being looked at. */}
                <Button
                  startIcon={<CloudUpload size={16} />}
                  disabled={applyToControlPlane.isPending}
                  onClick={() => {
                    applyToControlPlane.mutate({envId, version: String(version.seq)});
                  }}
                >
                  {t('promotions:controlPlane.action', 'To Control Plane')}
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
        envId={envId}
        envName={environment?.name ?? envId}
        version={applyVersionSeq ?? ''}
        onClose={() => setApplyVersionSeq(null)}
      />

      {revertTo && environment && (
        <RevertDialog
          open
          envId={envId}
          envName={environment.name}
          toVersion={revertTo}
          onClose={() => {
            setRevertTo(undefined);
          }}
        />
      )}

      {demoteTo && environment && (
        <PromoteDialog
          open
          isDemotion
          fromEnvId={environment.id}
          fromEnvName={environment.name}
          toEnvId={demoteTo.id}
          toEnvName={demoteTo.name}
          onClose={() => {
            setDemoteTo(undefined);
          }}
        />
      )}
    </PageContent>
  );
}
