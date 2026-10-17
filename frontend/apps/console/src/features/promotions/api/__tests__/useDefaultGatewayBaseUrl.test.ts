// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {renderHook} from '@thunderid/test-utils';
import {describe, it, expect, vi, afterEach} from 'vitest';
import type {Gateway} from '../../models/promotion';
import useDefaultGatewayBaseUrl from '../useDefaultGatewayBaseUrl';

vi.mock('../useGetGateways', () => ({
  default: vi.fn(),
}));

const {default: useGetGateways} = await import('../useGetGateways');

/**
 * A gateway carrying only the fields this hook reads.
 */
function gateway(overrides: Partial<Gateway>): Gateway {
  return {
    appliedSeq: 0,
    createdAt: '',
    dataPlane: {connected: true},
    hasPendingChanges: false,
    id: 'gw',
    latestSeq: 0,
    name: 'gw',
    updatedAt: '',
    ...overrides,
  } as Gateway;
}

function mockGateways(gateways: Gateway[]): void {
  vi.mocked(useGetGateways).mockReturnValue({
    data: {gateways},
  } as unknown as ReturnType<typeof useGetGateways>);
}

describe('useDefaultGatewayBaseUrl', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resolves the gateway the control plane manages, not merely the first', () => {
    mockGateways([
      gateway({id: 'other', name: 'other', target: {baseUrl: 'https://other.example.com', dataPlaneId: 'dp-other'}}),
      gateway({
        id: 'managed',
        managedByControlPlane: true,
        name: 'managed',
        target: {baseUrl: 'https://managed.example.com', dataPlaneId: 'dp-managed'},
      }),
    ]);

    const {result} = renderHook(() => useDefaultGatewayBaseUrl());

    expect(result.current).toBe('https://managed.example.com');
  });

  it('trims a trailing slash so an endpoint is not built with a double one', () => {
    mockGateways([
      gateway({managedByControlPlane: true, target: {baseUrl: 'https://managed.example.com/', dataPlaneId: 'dp'}}),
    ]);

    const {result} = renderHook(() => useDefaultGatewayBaseUrl());

    expect(result.current).toBe('https://managed.example.com');
  });

  // Undefined is the honest answer rather than a guess: with no managed gateway there is no host
  // that answers for what is authored here, so a caller shows nothing.
  it('resolves nothing when no gateway is managed by the control plane', () => {
    mockGateways([gateway({target: {baseUrl: 'https://other.example.com', dataPlaneId: 'dp'}})]);

    const {result} = renderHook(() => useDefaultGatewayBaseUrl());

    expect(result.current).toBeUndefined();
  });

  it('resolves nothing when the managed gateway records no address', () => {
    mockGateways([gateway({managedByControlPlane: true})]);

    const {result} = renderHook(() => useDefaultGatewayBaseUrl());

    expect(result.current).toBeUndefined();
  });

  it('resolves nothing when no gateway is registered', () => {
    mockGateways([]);

    const {result} = renderHook(() => useDefaultGatewayBaseUrl());

    expect(result.current).toBeUndefined();
  });
});
