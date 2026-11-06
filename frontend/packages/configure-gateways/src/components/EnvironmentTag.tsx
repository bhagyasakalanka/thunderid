// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Box} from '@wso2/oxygen-ui';
import type {JSX} from 'react';
import {environmentColor} from '../constants/environment-colors';

/** An environment, as a version it runs is marked with it. */
export interface VersionRunner {
  name: string;
  /** Its place in the pipeline, which gives its color. */
  index: number;
}

/** A small label in an environment's color, mono, as the environment cards show it. */
export default function EnvironmentTag({name, index}: VersionRunner): JSX.Element {
  const color = environmentColor(index);
  return (
    <Box
      component="span"
      sx={(theme) => ({
        fontFamily: 'monospace',
        fontSize: 11,
        textTransform: 'uppercase',
        px: 0.75,
        py: '1px',
        borderRadius: '6px',
        border: 1,
        borderColor: 'divider',
        color: color.light,
        whiteSpace: 'nowrap',
        ...theme.applyStyles('dark', {color: color.dark}),
      })}
    >
      {name}
    </Box>
  );
}
