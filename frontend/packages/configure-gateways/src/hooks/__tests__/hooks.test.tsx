// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {renderHook} from '@thunderid/test-utils';
import {describe, expect, it, vi} from 'vitest';
import useGatewayErrorTranslator from '../useGatewayErrorTranslator';
import useGatewayRoutes, {defaultGatewayRoutePaths} from '../useGatewayRoutes';
import useOpenGatewayTab from '../useOpenGatewayTab';
import useValueReferenceLabels, {humanize} from '../useValueReferenceLabels';

const mockUseRoutes = vi.fn<() => Record<string, unknown>>(() => ({}));
vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {...actual, useRoutes: () => mockUseRoutes()};
});

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

describe('useGatewayRoutes', () => {
  it('falls back to the package defaults', () => {
    const {result} = renderHook(() => useGatewayRoutes());

    expect(result.current).toBe(defaultGatewayRoutePaths.gateways);
    expect(result.current.list()).toBe('/gateways');
    expect(result.current.detail('gw-1')).toBe('/gateways/gw-1');
  });

  it('prefers the paths the host supplies', () => {
    const hostPaths = {list: () => '/environments', detail: (id: string) => `/environments/${id}`};
    mockUseRoutes.mockReturnValue({gateways: hostPaths});

    const {result} = renderHook(() => useGatewayRoutes());

    expect(result.current).toBe(hostPaths);
  });
});

describe('useGatewayErrorTranslator', () => {
  it('resolves bare keys in the gateways namespace and keeps explicit namespaces', () => {
    const {result} = renderHook(() => useGatewayErrorTranslator());

    expect(result.current('errors.GTW-1012', {defaultValue: ''})).toMatch(/declared in a file/);
    expect(result.current('common:actions.cancel', {defaultValue: 'x'})).toBe('Cancel');
  });

  it('maps an apply refused for missing values', () => {
    const {result} = renderHook(() => useGatewayErrorTranslator());

    expect(result.current('errors.GTW-1017', {defaultValue: ''})).toMatch(/missing variables or secrets/);
  });
});

describe('useOpenGatewayTab', () => {
  it('opens the variables or the secrets tab of a gateway', () => {
    mockUseRoutes.mockReturnValue({});
    mockNavigate.mockResolvedValue(undefined);
    const {result} = renderHook(() => useOpenGatewayTab());

    result.current('gw-1', 'secrets');
    expect(mockNavigate).toHaveBeenCalledWith('/gateways/gw-1?tab=secrets');

    result.current('gw-1', 'variables');
    expect(mockNavigate).toHaveBeenCalledWith('/gateways/gw-1?tab=variables');
  });
});

describe('humanize', () => {
  it('spells a key out as words, keeping acronyms in capitals', () => {
    expect(humanize('redirectUris')).toBe('Redirect URIs');
    expect(humanize('redirect_uris')).toBe('Redirect URIs');
    expect(humanize('client_id')).toBe('Client ID');
    expect(humanize('apiKey')).toBe('API key');
    expect(humanize('server_config')).toBe('Server config');
  });
});

describe('useValueReferenceLabels', () => {
  it('names a value by its resource and field, with wording of its own for common fields', () => {
    const {result} = renderHook(() => useValueReferenceLabels());

    expect(
      result.current.describe({
        name: 'X',
        kind: 'secret',
        resourceType: 'application',
        resourceName: 'Orders',
        field: 'clientSecret',
      }),
    ).toBe('Orders · Client secret');
    expect(
      result.current.describe({
        name: 'X',
        kind: 'variable',
        resourceType: 'flow',
        resourceId: 'f-1',
        field: 'tokenUrl',
      }),
    ).toBe('f-1 · Token URL');
    expect(result.current.resourceTypeLabel('application')).toBe('Applications');
    expect(result.current.resourceTypeLabel('server_config')).toBe('Server config');
  });
});
