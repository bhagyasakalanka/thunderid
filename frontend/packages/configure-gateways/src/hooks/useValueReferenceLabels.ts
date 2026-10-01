// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import type {ValueReference} from '../models/gateway';

// Words kept in capitals when a key is spelled out.
const ACRONYMS: Record<string, string> = {
  id: 'ID',
  ids: 'IDs',
  url: 'URL',
  urls: 'URLs',
  uri: 'URI',
  uris: 'URIs',
  api: 'API',
};

/**
 * Spells a key out as words: `redirectUris` and `redirect_uris` both read "Redirect URIs".
 */
export function humanize(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word: string) => ACRONYMS[word.toLowerCase()] ?? word.toLowerCase());
  if (words.length === 0) return key;
  const [first, ...rest] = words;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(' ');
}

export interface ValueReferenceLabels {
  /** The heading for the values of one kind of resource, such as "Applications". */
  resourceTypeLabel: (resourceType: string) => string;
  /** What a value is for in a resource, such as "Client secret". */
  fieldLabel: (field: string | undefined) => string;
  /** The value's purpose in a sentence fragment, such as "Orders · Client secret". */
  describe: (reference: ValueReference) => string;
}

/**
 * Names a referenced value by what it is for, rather than by its name: the resource that refers to it
 * and the field it stands in. Common resource types and fields have their own wording; others are
 * spelled out from their keys.
 */
export default function useValueReferenceLabels(): ValueReferenceLabels {
  const {t} = useTranslation();

  const resourceTypeLabel = useCallback(
    (resourceType: string): string =>
      t(`gateways:references.types.${resourceType}`, {defaultValue: humanize(resourceType)}),
    [t],
  );

  const fieldLabel = useCallback(
    (field: string | undefined): string =>
      field
        ? t(`gateways:references.fields.${field}`, {defaultValue: humanize(field)})
        : t('gateways:references.fields.value', 'Value'),
    [t],
  );

  const describe = useCallback(
    (reference: ValueReference): string =>
      t('gateways:references.label', '{{resource}} · {{field}}', {
        resource: reference.resourceName ?? reference.resourceId ?? resourceTypeLabel(reference.resourceType),
        field: fieldLabel(reference.field),
      }),
    [t, fieldLabel, resourceTypeLabel],
  );

  return {resourceTypeLabel, fieldLabel, describe};
}
