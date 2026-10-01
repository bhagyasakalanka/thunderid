// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Box, Typography} from '@wso2/oxygen-ui';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';
import type {LineOp} from '../models/gateway';
import withContext, {type Shown} from '../utils/withContext';

function background(kind: LineOp['kind']): string {
  if (kind === '+') return 'success.lighter';
  if (kind === '-') return 'error.lighter';
  return 'transparent';
}

/** Shows a resource's document diffed line by line, unchanged stretches folded away. */
export default function ChangeLines({lines}: {lines: LineOp[]}): JSX.Element {
  const {t} = useTranslation();

  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1,
        maxHeight: 360,
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {withContext(lines).map((entry: Shown) =>
        'gap' in entry ? (
          <Typography
            // A gap and a line never share an index, so the index identifies each entry.
            key={`gap-${String(entry.index)}`}
            component="div"
            variant="caption"
            color="text.secondary"
            sx={{px: 0.5, fontStyle: 'italic'}}
          >
            {t('gateways:diff.unchangedLines', '{{count}} unchanged lines', {count: entry.gap})}
          </Typography>
        ) : (
          <Box
            key={`line-${String(entry.index)}`}
            component="div"
            data-kind={entry.line.kind}
            sx={{
              px: 0.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              bgcolor: background(entry.line.kind),
              color: entry.line.kind === ' ' ? 'text.secondary' : 'text.primary',
            }}
          >
            {`${entry.line.kind} ${entry.line.text}`}
          </Box>
        ),
      )}
    </Box>
  );
}
