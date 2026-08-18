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

import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import DataPlaneStatusChip from '../DataPlaneStatusChip';

describe('DataPlaneStatusChip', () => {
  it('reports a connected data plane', () => {
    render(<DataPlaneStatusChip status={{connected: true, lastSeen: '2026-08-01T10:00:00Z'}} />);

    expect(screen.getByText('Data Plane connected')).toBeInTheDocument();
  });

  it('reports one that is offline', () => {
    render(<DataPlaneStatusChip status={{connected: false}} />);

    expect(screen.getByText('Data Plane offline')).toBeInTheDocument();
  });

  // An environment the service could not report on is offline as far as an operator is concerned:
  // nothing can be applied to it either way, and showing nothing would read as connected.
  it('treats an unknown status as offline', () => {
    render(<DataPlaneStatusChip />);

    expect(screen.getByText('Data Plane offline')).toBeInTheDocument();
  });
});
