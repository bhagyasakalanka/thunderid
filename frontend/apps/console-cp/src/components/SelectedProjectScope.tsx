// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ProjectScopeProvider} from '@thunderid/contexts';
import type {JSX, ReactNode} from 'react';
import {useSelectedProjectId} from '../hooks/useProjectSelection';

/**
 * Scopes every route to the selected project, under whichever layout it renders: the dashboard and the
 * full-screen create pages alike list and create that project's applications and agents.
 */
export default function SelectedProjectScope({children}: {children: ReactNode}): JSX.Element {
  const projectId = useSelectedProjectId();
  return <ProjectScopeProvider project={projectId ? {id: projectId} : undefined}>{children}</ProjectScopeProvider>;
}
