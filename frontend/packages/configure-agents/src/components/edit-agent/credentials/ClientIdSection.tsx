// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EnvironmentValue, SettingsCard} from '@thunderid/components';
import {CopyableField} from '@thunderid/configure-applications';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';
import type {OAuthAgentConfig} from '../../../models/agent';

interface ClientIdSectionProps {
  /** The agent's identifier, which its environment-specific values are held under. */
  agentId?: string;
  oauth2Config?: OAuthAgentConfig;
}

export default function ClientIdSection({
  agentId = undefined,
  oauth2Config = undefined,
}: ClientIdSectionProps): JSX.Element | null {
  const {t} = useTranslation();

  if (!oauth2Config?.clientId) return null;

  const clientIdLabel = t('agents:edit.credentials.sections.identifier.clientIdLabel', 'Client ID');
  const copyLabel = t('common:actions.copy');
  const clientIdHint = t(
    'agents:edit.credentials.sections.identifier.clientIdHint',
    'The public OAuth2 client identifier this agent uses to authenticate as a client.',
  );

  return (
    <SettingsCard
      title={t('agents:edit.credentials.sections.identifier.title', 'Identifier')}
      description={t(
        'agents:edit.credentials.sections.identifier.description',
        'Unique identifier used to reference this agent.',
      )}
    >
      <EnvironmentValue
        resourceType="agent"
        resourceId={agentId}
        field="clientId"
        label={clientIdLabel}
        hint={clientIdHint}
      >
        <CopyableField
          id="agent-credentials-client-id"
          label={clientIdLabel}
          value={oauth2Config.clientId}
          copyAriaLabel={`${copyLabel} ${clientIdLabel}`}
          hint={clientIdHint}
        />
      </EnvironmentValue>
    </SettingsCard>
  );
}
