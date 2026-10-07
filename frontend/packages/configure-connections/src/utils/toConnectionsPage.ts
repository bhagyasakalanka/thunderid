// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {UseConnectionsParams} from '../api/useConnections';
import {
  ConnectionInstanceCategories,
  ConnectionTypes,
  type ConnectionInstance,
  type ConnectionInstanceCategory,
  type ConnectionListResponse,
  type ConnectionResponse,
  type ConnectionType,
} from '../models/connection';

/** The functional category the list read puts each connection type under. */
const CATEGORY_BY_TYPE: Record<ConnectionType, ConnectionInstanceCategory> = {
  [ConnectionTypes.GOOGLE]: ConnectionInstanceCategories.IDENTITY_PROVIDER,
  [ConnectionTypes.GITHUB]: ConnectionInstanceCategories.IDENTITY_PROVIDER,
  [ConnectionTypes.OIDC]: ConnectionInstanceCategories.IDENTITY_PROVIDER,
  [ConnectionTypes.OAUTH]: ConnectionInstanceCategories.IDENTITY_PROVIDER,
  [ConnectionTypes.TWILIO]: ConnectionInstanceCategories.SMS_PROVIDER,
  [ConnectionTypes.VONAGE]: ConnectionInstanceCategories.SMS_PROVIDER,
  [ConnectionTypes.SMS_GATEWAY]: ConnectionInstanceCategories.SMS_PROVIDER,
  [ConnectionTypes.AUTHZEN_PDP]: ConnectionInstanceCategories.AUTHORIZATION_PDP,
};

/**
 * Builds the connections list page from the connections a gateway runs, each in its GET-by-id
 * shape, with the category filter, ordering and paging the live list read applies on the server.
 *
 * @param resources - The connections the gateway runs
 * @param params - The list read's category filter and paging
 * @returns The page, in the live list read's shape
 */
export default function toConnectionsPage(resources: unknown[], params?: UseConnectionsParams): ConnectionListResponse {
  const {category, limit = 30, offset = 0} = params ?? {};
  const connections: ConnectionInstance[] = (resources as ConnectionResponse[])
    .filter((connection: ConnectionResponse) => Boolean(CATEGORY_BY_TYPE[connection.type]))
    .map(
      (connection: ConnectionResponse): ConnectionInstance => ({
        id: connection.id,
        name: connection.name,
        description: connection.description,
        type: connection.type,
        categories: [CATEGORY_BY_TYPE[connection.type]],
        idJagEnabled: connection.idJagEnabled,
      }),
    )
    .filter((connection: ConnectionInstance) => !category || connection.categories.includes(category))
    .sort(
      (a: ConnectionInstance, b: ConnectionInstance) =>
        a.type.localeCompare(b.type) ||
        a.name.toLowerCase().localeCompare(b.name.toLowerCase()) ||
        a.id.localeCompare(b.id),
    );
  const page: ConnectionInstance[] = connections.slice(offset, offset + limit);
  return {totalResults: connections.length, startIndex: offset + 1, count: page.length, connections: page, links: []};
}
