// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useEnvironment, type Environment} from '@thunderid/contexts';
import type {ReactNode} from 'react';
import EnvironmentValueField from './EnvironmentValueField';
import type {ValueReference} from './models';
import {useValueReferences} from './useEnvironmentValues';

/**
 * Props for the {@link EnvironmentValue} component.
 *
 * @public
 */
export interface EnvironmentValueProps {
  /** The type of the resource the field belongs to, as an export names it, e.g. `application`. */
  resourceType: string;
  /** The resource's identifier. A resource not yet created has none, and shows its own field. */
  resourceId?: string;
  /** The field, as an export names it, e.g. `clientId`. */
  field: string;
  /** The field's label. */
  label: string;
  /** Explains the field, shown below the label. */
  hint?: string;
  /** The resource's own field, shown where no environment's value applies. */
  children: ReactNode;
}

/**
 * Shows a resource's field as the selected environment holds it.
 *
 * A control plane holds one configuration for every environment, and a field whose value differs
 * between them, such as a client ID or a redirect URI, is held by each environment's gateway under
 * the name the configuration refers to it by. With an environment selected, and the field one the
 * configuration refers to, this shows and sets that gateway's value. Otherwise, outside a control
 * plane or for a field held the same everywhere, it shows the resource's own field.
 *
 * @public
 */
export default function EnvironmentValue({
  resourceType,
  resourceId = undefined,
  field,
  label,
  hint = undefined,
  children,
}: EnvironmentValueProps): ReactNode {
  const {gateway: selected} = useEnvironment();

  // Without an environment nothing is asked of the server, so the page renders its own field
  // exactly as it would without this component.
  if (!selected || !resourceId) {
    return children;
  }

  return (
    <SelectedEnvironmentValue
      environment={selected}
      resourceType={resourceType}
      resourceId={resourceId}
      field={field}
      label={label}
      hint={hint}
    >
      {children}
    </SelectedEnvironmentValue>
  );
}

function SelectedEnvironmentValue({
  environment,
  resourceType,
  resourceId,
  field,
  label,
  hint = undefined,
  children,
}: EnvironmentValueProps & {environment: Environment; resourceId: string}): ReactNode {
  const {data: references} = useValueReferences();

  const reference: ValueReference | undefined = references?.find(
    (candidate: ValueReference) =>
      candidate.resourceType === resourceType && candidate.resourceId === resourceId && candidate.field === field,
  );

  if (!reference) {
    return children;
  }

  return <EnvironmentValueField reference={reference} environment={environment} label={label} hint={hint} />;
}
