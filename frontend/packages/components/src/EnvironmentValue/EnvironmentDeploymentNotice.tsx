// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useEnvironment} from '@thunderid/contexts';
import {Alert, Button} from '@wso2/oxygen-ui';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useEnvironmentPresence, type EnvironmentPresence} from './useEnvironmentResource';

/**
 * Props for the {@link EnvironmentDeploymentNotice} component.
 *
 * @public
 */
export interface EnvironmentDeploymentNoticeProps {
  /** The type of the resource, as an export names it, e.g. `application`. */
  resourceType: string;
  /** The resource's identifier, or its name for one exported without an id. */
  resourceId?: string;
}

/**
 * Says, in read-only mode, that the gateway shown does not run the resource a page was opened for:
 * the version it applied does not hold it. It offers write mode, where the resource is edited.
 *
 * Nothing is shown in write mode, for a resource the gateway runs (the read-only banner already says
 * where the page comes from), or while it is being worked out.
 *
 * @public
 */
export default function EnvironmentDeploymentNotice({
  resourceType,
  resourceId = undefined,
}: EnvironmentDeploymentNoticeProps): JSX.Element | null {
  const {t} = useTranslation();
  const {setReadOnly} = useEnvironment();
  const presence: EnvironmentPresence = useEnvironmentPresence(resourceType, resourceId);

  if (!presence.gateway || presence.isLoading || presence.source !== 'missing') {
    return null;
  }

  return (
    <Alert
      severity="warning"
      sx={{mb: 2}}
      data-testid="environment-not-deployed"
      action={
        <Button color="inherit" size="small" onClick={() => setReadOnly(false)}>
          {t('common:environment.mode.switchToWrite', 'Switch to Write mode')}
        </Button>
      }
    >
      {t(
        'common:environment.deployment.notDeployed',
        'Not in {{environment}}. The version {{environment}} applied does not include it.',
        {environment: presence.gateway.name},
      )}
    </Alert>
  );
}
