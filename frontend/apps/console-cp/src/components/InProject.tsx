// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useGetAgent} from '@thunderid/configure-agents';
import {useGetApplication} from '@thunderid/configure-applications';
import {Box, CircularProgress} from '@wso2/oxygen-ui';
import {useEffect, type ReactNode} from 'react';
import {Navigate, useParams} from 'react-router';
import RouteConfig from '../configs/RouteConfig';
import {selectProject, useSelectedProjectId} from '../hooks/useProjectSelection';

/** What a page asks the organization home for when it needs a project: the project list, opened. */
export interface PickProjectState {
  pickProject: true;
}

/** The kind of resource a page's URL names, whose project the page opens in. */
export type ProjectResource = 'application' | 'agent';

export interface InProjectProps {
  /** The resource the page's URL names by its id, such as an application's page. */
  resource?: ProjectResource;
  children: ReactNode;
}

const sendHome = (
  <Navigate to={RouteConfig.home.list()} replace state={{pickProject: true} satisfies PickProjectState} />
);

/** Reads the project of the application or agent a URL names, and selects it. */
function ResourceProject({resource}: {resource: ProjectResource}): ReactNode {
  const {applicationId = '', agentId = ''} = useParams<{applicationId: string; agentId: string}>();
  const application = useGetApplication(resource === 'application' ? applicationId : '');
  const agent = useGetAgent(resource === 'agent' ? agentId : '');
  const read = resource === 'application' ? application : agent;
  const projectId = read.data?.projectId;
  useEffect(() => {
    if (projectId) selectProject(projectId);
  }, [projectId]);

  if (read.isLoading || projectId) {
    return (
      <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  return sendHome;
}

/**
 * A page that belongs to a project, such as its applications and agents. A page whose URL names an
 * application or agent opens in that resource's project, so a reload or a link keeps the page; any other
 * page at the organization level sends the console home with the project list open, to pick a project.
 */
export default function InProject({resource = undefined, children}: InProjectProps): ReactNode {
  const projectId = useSelectedProjectId();
  if (!projectId) return resource ? <ResourceProject resource={resource} /> : sendHome;
  return children;
}
