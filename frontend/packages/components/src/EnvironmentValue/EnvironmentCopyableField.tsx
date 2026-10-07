// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useEnvironment, type Environment} from '@thunderid/contexts';
import {Box, Typography} from '@wso2/oxygen-ui';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';
import type {StoredValue, ValueReference} from './models';
import {useStoredValues, useValueReferences} from './useEnvironmentValues';
import {parseListValue} from './values';
import CopyableField from '../CopyableField/CopyableField';

/**
 * Props for the {@link EnvironmentCopyableField} component.
 *
 * @public
 */
export interface EnvironmentCopyableFieldProps {
  /** The type of the resource the value belongs to, as an export names it, e.g. `application`. */
  resourceType: string;
  /** The resource's identifier. */
  resourceId?: string;
  /** The field, as an export names it, e.g. `clientId`. */
  field: string;
  /** The value's label. */
  label: string;
  /** The resource's own value, shown where no environment's value applies. */
  value: string;
}

/**
 * Shows a resource's identifier, such as its client ID, as the selected environment holds it, for
 * copying into an integration. Without an environment, or for a field the configuration does not
 * refer to, it shows the resource's own value.
 *
 * @public
 */
export default function EnvironmentCopyableField({
  resourceType,
  resourceId = undefined,
  field,
  label,
  value,
}: EnvironmentCopyableFieldProps): JSX.Element {
  const {gateway: selected} = useEnvironment();

  if (!selected || !resourceId) {
    return <CopyableField label={label} value={value} />;
  }

  return (
    <SelectedEnvironmentCopyableField
      environment={selected}
      resourceType={resourceType}
      resourceId={resourceId}
      field={field}
      label={label}
      value={value}
    />
  );
}

function SelectedEnvironmentCopyableField({
  environment,
  resourceType,
  resourceId,
  field,
  label,
  value,
}: EnvironmentCopyableFieldProps & {environment: Environment; resourceId: string}): JSX.Element {
  const {t} = useTranslation();
  const {data: references} = useValueReferences();
  const reference: ValueReference | undefined = references?.find(
    (candidate: ValueReference) =>
      candidate.resourceType === resourceType && candidate.resourceId === resourceId && candidate.field === field,
  );
  const stored = useStoredValues(environment.id, reference?.kind ?? 'variable', Boolean(reference));

  if (!reference || reference.kind === 'secret' || stored.isLoading || stored.isError) {
    return <CopyableField label={label} value={value} />;
  }

  const held: StoredValue | undefined = stored.data?.find(
    (candidate: StoredValue) => candidate.name === reference.name,
  );
  if (held?.value === undefined) {
    return (
      <Box sx={{mb: 1.5, '&:last-child': {mb: 0}}}>
        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 0.5}}>
          {label}
        </Typography>
        <Typography variant="caption" color="warning.main">
          {t('common:environment.value.notSetShort', 'Not set in {{environment}}', {environment: environment.name})}
        </Typography>
      </Box>
    );
  }

  const items: string[] | undefined = reference.list ? parseListValue(held.value) : undefined;
  return <CopyableField label={label} value={items ? items.join(', ') : held.value} />;
}
