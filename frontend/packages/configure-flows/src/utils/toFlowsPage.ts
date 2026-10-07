// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {UseGetFlowsParams} from '../api/useGetFlows';
import type {BasicFlowDefinition, FlowDefinitionResponse, FlowListResponse} from '../models/responses';

/**
 * Builds the flows list page from the flows a gateway runs, each in its GET-by-id shape, with the
 * same type filter and paging the live list read applies on the server.
 *
 * @param resources - The flows the gateway runs
 * @param params - The list read's flow type filter and paging
 * @returns The page, in the live list read's shape
 */
export default function toFlowsPage(resources: unknown[], params?: UseGetFlowsParams): FlowListResponse {
  const {flowType, limit = 30, offset = 0} = params ?? {};
  const flows: BasicFlowDefinition[] = (resources as FlowDefinitionResponse[])
    .filter((flow: FlowDefinitionResponse) => !flowType || flow.flowType === flowType)
    .map(
      (flow: FlowDefinitionResponse): BasicFlowDefinition => ({
        id: flow.id,
        flowType: flow.flowType,
        name: flow.name,
        handle: flow.handle,
        activeVersion: flow.activeVersion,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
        isReadOnly: flow.isReadOnly,
      }),
    );
  const page: BasicFlowDefinition[] = flows.slice(offset, offset + limit);
  return {totalResults: flows.length, startIndex: offset + 1, count: page.length, flows: page};
}
