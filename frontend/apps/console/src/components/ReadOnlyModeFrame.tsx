// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EnvironmentModeBanner} from '@thunderid/components';
import {useEnvironment} from '@thunderid/contexts';
import {Box, alpha} from '@wso2/oxygen-ui';
import type {PropsWithChildren, ReactNode} from 'react';

/**
 * Frames a page so read-only mode cannot be mistaken for write mode: a banner naming the gateway
 * shown and the way back to write mode, a warning-colored edge, and a tinted background. In write
 * mode the page is shown as it is.
 */
export default function ReadOnlyModeFrame({children = null}: PropsWithChildren): ReactNode {
  const {readOnly} = useEnvironment();

  if (!readOnly) {
    return children;
  }

  // A dashboard lays a page out as a flex child that fills its row, so the frame fills the row in the
  // page's place, and the page beneath the banner stretches to the frame's full width.
  return (
    <Box
      data-testid="read-only-mode-frame"
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderTop: 3,
        borderColor: 'warning.main',
        bgcolor: (theme) => alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.08 : 0.05),
      }}
    >
      <Box sx={{position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar - 1}}>
        <EnvironmentModeBanner />
      </Box>
      <Box sx={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column'}}>{children}</Box>
    </Box>
  );
}
