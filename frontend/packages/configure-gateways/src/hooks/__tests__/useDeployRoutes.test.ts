// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import {defaultDeployRoutePaths, resourceEditOf} from '../useDeployRoutes';

describe('resourceEditOf', () => {
  it.each([
    ['application', 'a 1', '/applications/a%201'],
    ['agent', 'g-1', '/agents/g-1'],
    ['agent_type', 't-1', '/agent-types/t-1'],
    ['flow', 'f-1', '/flows/f-1'],
    ['connection', 'c-1', '/connections'],
    ['resource_server', 'r-1', '/resource-servers/r-1'],
    ['translation', 'en-US', '/translations/en-US'],
    ['theme', 'th-1', '/design/themes/th-1'],
    ['layout', 'l-1', '/design/layouts/l-1'],
    ['user', 'u-1', '/users/u-1'],
    ['group', 'gr-1', '/groups/gr-1'],
    ['role', 'ro-1', '/roles/ro-1'],
    ['user_type', 'ut-1', '/user-types/ut-1'],
    ['organization_unit', 'ou-1', '/organization-units/ou-1'],
    ['notification_template', 'n-1', '/notification-templates'],
    ['server_config', 'gateway', '/settings'],
    ['credential_configuration', 'vc-1', '/verifiable-credentials/vc-1'],
    ['presentation_definition', 'vp-1', '/verifiable-presentations/vp-1'],
  ])('edits a %s on its own page', (resourceType, id, path) => {
    expect(resourceEditOf(defaultDeployRoutePaths, resourceType, id)).toBe(path);
  });

  it('offers nothing for a kind the console does not edit', () => {
    expect(resourceEditOf(defaultDeployRoutePaths, 'authorization_detail_type', 'x')).toBeUndefined();
    expect(resourceEditOf(defaultDeployRoutePaths, 'project', 'p')).toBeUndefined();
  });

  it("uses the console's own mapping when it routes resources", () => {
    const routes = {...defaultDeployRoutePaths, deploy: {...defaultDeployRoutePaths.deploy, resource: () => '/mine'}};
    expect(resourceEditOf(routes, 'flow', 'f-1')).toBe('/mine');
  });
});
