// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {useConfig} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import type {AppliedConfiguration, StoredValue, ValueReference} from './models';

/** How many values a gateway's store answers with in one page. */
const PAGE_SIZE = 100;

/** Query keys for what this component reads. */
export const EnvironmentValueQueryKeys = {
  REFERENCES: 'environment-value-references',
  VALUES: 'environment-values',
  APPLIED_CONFIGURATION: 'environment-applied-configuration',
} as const;

const collectionOf = (kind: ValueReference['kind']): string => (kind === 'secret' ? 'secrets' : 'variables');

/**
 * Reads where the configuration as it stands refers to each value a gateway holds.
 */
export function useValueReferences(): UseQueryResult<ValueReference[]> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();

  return useQuery<ValueReference[]>({
    queryKey: [EnvironmentValueQueryKeys.REFERENCES],
    queryFn: async (): Promise<ValueReference[]> => {
      const response: {data: {references?: ValueReference[]}} = await http.request({
        url: `${getServerUrl()}/configuration-versions/current`,
        method: 'GET',
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data?.references ?? [];
    },
    retry: false,
  });
}

/**
 * Reads every variable or every secret a gateway holds, page by page.
 */
export function useStoredValues(
  gatewayId: string,
  kind: ValueReference['kind'],
  enabled = true,
): UseQueryResult<StoredValue[]> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();
  const collection: string = collectionOf(kind);

  return useQuery<StoredValue[]>({
    queryKey: [EnvironmentValueQueryKeys.VALUES, gatewayId, collection],
    enabled: enabled && Boolean(gatewayId),
    queryFn: async (): Promise<StoredValue[]> => {
      const values: StoredValue[] = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const response: {data: Record<string, unknown>} = await http.request({
          url: `${getServerUrl()}/gateways/${encodeURIComponent(gatewayId)}/${collection}?limit=${PAGE_SIZE}&offset=${offset}`,
          method: 'GET',
        } as unknown as Parameters<typeof http.request>[0]);
        const page: StoredValue[] = (response.data?.[collection] as StoredValue[] | undefined) ?? [];
        values.push(...page);
        const total = Number(response.data?.['totalResults'] ?? values.length);
        if (page.length === 0 || values.length >= total) {
          return values;
        }
      }
    },
    retry: false,
  });
}

/** What a value is set to on a gateway. */
export interface SetValueRequest {
  gatewayId: string;
  name: string;
  value: string;
  /** The value's description, kept as it is. */
  description?: string;
}

/**
 * Sets a variable or a secret on a gateway, creating it when the gateway does not hold it.
 */
export function useSetStoredValue(kind: ValueReference['kind']): UseMutationResult<unknown, Error, SetValueRequest> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();
  const queryClient = useQueryClient();
  const collection: string = collectionOf(kind);

  return useMutation<unknown, Error, SetValueRequest>({
    mutationFn: async ({gatewayId, name, value, description}: SetValueRequest): Promise<unknown> => {
      const response: {data: unknown} = await http.request({
        url: `${getServerUrl()}/gateways/${encodeURIComponent(gatewayId)}/${collection}/${encodeURIComponent(name)}`,
        method: 'PUT',
        data: {value, description},
      } as unknown as Parameters<typeof http.request>[0]);

      return response.data;
    },
    onSuccess: (_result, {gatewayId}) => {
      void queryClient.invalidateQueries({queryKey: [EnvironmentValueQueryKeys.VALUES, gatewayId, collection]});
    },
  });
}

/**
 * Reads the configuration a gateway runs: every resource of the version it last applied, each in the
 * shape the resource's own read returns, with its parts. Every page of the read-only view is built
 * from this one read.
 */
export function useAppliedConfiguration(
  gatewayId: string | undefined,
): UseQueryResult<AppliedConfiguration> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();

  return useQuery<AppliedConfiguration>({
    queryKey: [EnvironmentValueQueryKeys.APPLIED_CONFIGURATION, gatewayId],
    enabled: Boolean(gatewayId),
    // An apply changes it, so it is read again after a while rather than kept for the session.
    staleTime: 30_000,
    queryFn: async (): Promise<AppliedConfiguration> => {
      const response: {data: AppliedConfiguration} = await http.request({
        url: `${getServerUrl()}/gateways/${encodeURIComponent(gatewayId ?? '')}/applied-configuration`,
        method: 'GET',
      } as unknown as Parameters<typeof http.request>[0]);
      return response.data;
    },
    retry: false,
  });
}
