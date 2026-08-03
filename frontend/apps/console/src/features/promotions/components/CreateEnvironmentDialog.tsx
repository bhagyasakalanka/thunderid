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

import {zodResolver} from '@hookform/resolvers/zod';
import {useConfig} from '@thunderid/contexts';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel,
  Stack,
  TextField,
  Typography,
} from '@wso2/oxygen-ui';
import {type JSX} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import {z} from 'zod';
import useCreateEnvironment from '../api/useCreateEnvironment';

const formSchema = z.object({
  name: z.string().trim().min(1),
  rank: z.string().trim().optional(),
  targetDataPlaneId: z.string().trim().min(1),
  targetBaseUrl: z.string().trim().url().or(z.literal('')),
  tenantId: z.string().trim().optional(),
});
type FormData = z.infer<typeof formSchema>;

/**
 * Registers an environment in the promotion chain.
 *
 * The target is the data plane that versions are applied to. It is named rather than addressed: the
 * data plane dials this control plane and holds that connection open, and everything sent to it
 * travels back down that connection, so there is no URL to call and no credential to hold.
 *
 * The source is the control plane that configuration is captured from, and is optional: environments
 * that only receive promotions from a lower environment do not need one.
 */
export default function CreateEnvironmentDialog({open, onClose}: {open: boolean; onClose: () => void}): JSX.Element {
  const {t} = useTranslation();
  const {getServerUrl} = useConfig();
  const createEnvironment = useCreateEnvironment();

  const {
    control,
    handleSubmit,
    reset,
    formState: {isValid},
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      rank: '',
      targetDataPlaneId: '',
      targetBaseUrl: '',
      tenantId: '',
    },
  });

  const handleClose = (): void => {
    reset();
    onClose();
  };

  const onSubmit = (formData: FormData): void => {
    const rank = Number(formData.rank);

    createEnvironment.mutate(
      {
        name: formData.name,
        rank: formData.rank && !Number.isNaN(rank) ? rank : undefined,
        target: {
          dataPlaneId: formData.targetDataPlaneId,
          baseUrl: formData.targetBaseUrl || undefined,
        },
        // Configuration is captured from the Control Plane this console is already talking to, and
        // the caller's own session token is forwarded for it, so there is nothing to ask for or store.
        source: {
          baseUrl: getServerUrl(),
          deploymentId: formData.tenantId,
          insecureSkipVerify: true,
        },
      },
      {onSuccess: handleClose},
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('promotions:environment.createTitle', 'Register environment')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
          {t(
            'promotions:environment.createSubtitle',
            'Environments are ordered by rank, lowest first. Promotion moves configuration to the next rank up.',
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{mb: 2}}>
          {t(
            'promotions:environment.captureNote',
            'Configuration is captured from this Control Plane using your own session, so only the data plane needs credentials.',
          )}
        </Typography>

        <Stack spacing={2}>
          <Controller
            name="name"
            control={control}
            render={({field, fieldState}) => (
              <FormControl fullWidth>
                <FormLabel>{t('promotions:environment.name', 'Name')}</FormLabel>
                <TextField {...field} placeholder="dev" error={Boolean(fieldState.error)} fullWidth />
              </FormControl>
            )}
          />

          <Controller
            name="rank"
            control={control}
            render={({field}) => (
              <FormControl fullWidth>
                <FormLabel>{t('promotions:environment.rank', 'Rank')}</FormLabel>
                <TextField
                  {...field}
                  type="number"
                  placeholder={t('promotions:environment.rankPlaceholder', 'Defaults to the end of the chain')}
                  fullWidth
                />
              </FormControl>
            )}
          />

          <Divider />
          <Typography variant="subtitle2">
            {t('promotions:environment.targetSection', 'Data plane (applied to)')}
          </Typography>

          <Controller
            name="targetDataPlaneId"
            control={control}
            render={({field, fieldState}) => (
              <FormControl fullWidth>
                <FormLabel>{t('promotions:environment.dataPlaneId', 'Data Plane ID')}</FormLabel>
                <TextField {...field} placeholder="org1:dev" error={Boolean(fieldState.error)} fullWidth />
                <Typography variant="caption" color="text.secondary">
                  {t(
                    'promotions:environment.dataPlaneIdHelp',
                    'The id the Data Plane presents when it connects to this Control Plane. It must match that deployment configuration.',
                  )}
                </Typography>
              </FormControl>
            )}
          />
          <Controller
            name="targetBaseUrl"
            control={control}
            render={({field, fieldState}) => (
              <FormControl fullWidth>
                <FormLabel>{t('promotions:environment.baseUrl', 'Base URL (optional)')}</FormLabel>
                <TextField
                  {...field}
                  placeholder="https://localhost:8090"
                  error={Boolean(fieldState.error)}
                  fullWidth
                />
                <Typography variant="caption" color="text.secondary">
                  {t(
                    'promotions:environment.baseUrlHelp',
                    'Where that deployment serves its own users. Nothing calls it; it is recorded so you can follow it.',
                  )}
                </Typography>
              </FormControl>
            )}
          />
          <Controller
            name="tenantId"
            control={control}
            render={({field}) => (
              <FormControl fullWidth>
                <FormLabel>{t('promotions:environment.tenantId', 'Control Plane tenant')}</FormLabel>
                <TextField {...field} placeholder="tenant-a" fullWidth />
                <Typography variant="caption" color="text.secondary">
                  {t(
                    'promotions:environment.tenantIdHelp',
                    'The tenant this environment belongs to. A credential created in that tenant is routed to this environment.',
                  )}
                </Typography>
              </FormControl>
            )}
          />


        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={createEnvironment.isPending}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            void handleSubmit(onSubmit)();
          }}
          disabled={!isValid || createEnvironment.isPending}
        >
          {createEnvironment.isPending
            ? t('common:status.saving', 'Saving...')
            : t('promotions:environment.create', 'Register')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
