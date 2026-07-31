/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {render} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {Plane} from '../../lib/plane';
import PlaneRouteGuard from '../PlaneRouteGuard';

let mockPlane: Plane;
let mockPathname: string;
const mockNavigate = vi.fn();

vi.mock('@thunderid/contexts', () => ({
  useConfig: () => ({config: {plane: mockPlane}}),
}));

vi.mock('react-router', () => ({
  useLocation: () => ({pathname: mockPathname}),
  useNavigate: () => mockNavigate,
}));

describe('PlaneRouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlane = 'cp';
    mockPathname = '/home';
  });

  it('redirects DP-only routes to home on the Control Plane', () => {
    mockPathname = '/welcome/tryout/mcp';
    render(<PlaneRouteGuard />);
    expect(mockNavigate).toHaveBeenCalledWith('/home', {replace: true});
  });

  it('leaves agents and verifiable credentials reachable on the Control Plane', () => {
    // They are authored on a control plane and promoted, the same as applications and connections.
    mockPathname = '/agents/create';
    const {rerender} = render(<PlaneRouteGuard />);
    expect(mockNavigate).not.toHaveBeenCalled();

    mockPathname = '/verifiable-credentials';
    rerender(<PlaneRouteGuard />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('leaves authoring routes untouched on the Control Plane', () => {
    mockPathname = '/applications';
    render(<PlaneRouteGuard />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('is a no-op on the Data Plane', () => {
    mockPlane = 'dp';
    mockPathname = '/agents';
    render(<PlaneRouteGuard />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('is a no-op on the hybrid console', () => {
    mockPlane = 'hybrid';
    mockPathname = '/verifiable-presentations';
    render(<PlaneRouteGuard />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
