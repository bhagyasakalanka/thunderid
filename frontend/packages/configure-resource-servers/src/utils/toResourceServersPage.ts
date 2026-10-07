// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {ResourceServer, ResourceServerListResponse} from '../models/resource-server';

/**
 * Builds the resource server list page from the resource servers a gateway applied, each in its
 * GET-by-id shape, paging them as the server would.
 */
export default function toResourceServersPage(
  resources: unknown[],
  limit: number,
  offset: number,
): ResourceServerListResponse {
  const resourceServers = (resources as ResourceServer[]).map(
    (resourceServer: ResourceServer): ResourceServer => ({
      id: resourceServer.id,
      name: resourceServer.name,
      description: resourceServer.description,
      identifier: resourceServer.identifier,
      ouId: resourceServer.ouId,
      delimiter: resourceServer.delimiter,
      isReadOnly: resourceServer.isReadOnly,
      type: resourceServer.type,
    }),
  );
  const page = resourceServers.slice(offset, offset + limit);
  return {totalResults: resourceServers.length, startIndex: offset + 1, count: page.length, resourceServers: page};
}
