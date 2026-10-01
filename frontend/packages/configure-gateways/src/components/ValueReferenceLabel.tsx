// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Box, Typography} from '@wso2/oxygen-ui';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';
import useValueReferenceLabels from '../hooks/useValueReferenceLabels';
import type {ValueReference} from '../models/gateway';

export interface ValueReferenceLabelProps {
  name: string;
  references: ValueReference[];
  /** The element the label is for, when it labels an input. */
  htmlFor?: string;
}

/**
 * A value named by what it is for, such as "Orders · Client secret", with the name it is held under
 * beneath. A value no reference names shows its name alone.
 */
export default function ValueReferenceLabel({
  name,
  references,
  htmlFor = undefined,
}: ValueReferenceLabelProps): JSX.Element {
  const {t} = useTranslation();
  const {describe} = useValueReferenceLabels();
  const purposes = [...new Set(references.map(describe))];

  if (purposes.length === 0) {
    return (
      <Typography
        component={htmlFor ? 'label' : 'span'}
        htmlFor={htmlFor}
        variant="body2"
        sx={{fontFamily: 'monospace'}}
      >
        {name}
      </Typography>
    );
  }
  return (
    <Box component={htmlFor ? 'label' : 'div'} htmlFor={htmlFor} sx={{display: 'block'}}>
      <Typography variant="body2" sx={{fontWeight: 500}}>
        {purposes[0]}
        {purposes.length > 1 && (
          <Typography component="span" variant="body2" color="text.secondary">
            {` ${t('gateways:references.more', '+{{count}} more', {count: purposes.length - 1})}`}
          </Typography>
        )}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{fontFamily: 'monospace'}}>
        {name}
      </Typography>
    </Box>
  );
}
