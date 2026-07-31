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

import {fireEvent} from '@testing-library/react';
import {render, screen} from '@thunderid/test-utils';
import {describe, expect, it, vi} from 'vitest';
import type {Diff} from '../../models/promotion';
import ResourceDiffList from '../ResourceDiffList';

const diff: Diff = {
  changes: [
    {key: 'application/id:app-a', type: 'application', id: 'app-a', name: 'App A', change: 'added'},
    {
      key: 'application/id:app-b',
      type: 'application',
      id: 'app-b',
      name: 'App B',
      change: 'updated',
      lines: [
        {kind: ' ', text: 'name: App B'},
        {kind: '-', text: 'value: 1'},
        {kind: '+', text: 'value: 2'},
      ],
    },
    {key: 'flow/id:flow-a', type: 'flow', id: 'flow-a', name: 'Flow A', change: 'deleted'},
    {key: 'application/id:app-c', type: 'application', id: 'app-c', name: 'App C', change: 'unchanged'},
  ],
  summary: {added: 1, updated: 1, deleted: 1, unchanged: 1},
};

describe('ResourceDiffList', () => {
  it('lists changed resources and hides unchanged ones by default', () => {
    render(<ResourceDiffList diff={diff} />);

    expect(screen.getByText('App A')).toBeInTheDocument();
    expect(screen.getByText('App B')).toBeInTheDocument();
    expect(screen.getByText('Flow A')).toBeInTheDocument();
    expect(screen.queryByText('App C')).not.toBeInTheDocument();
  });

  it('shows unchanged resources when asked', () => {
    render(<ResourceDiffList diff={diff} showUnchanged />);

    expect(screen.getByText('App C')).toBeInTheDocument();
  });

  it('reports no differences for an empty diff', () => {
    render(<ResourceDiffList diff={{changes: [], summary: {added: 0, updated: 0, deleted: 0, unchanged: 0}}} />);

    expect(screen.getByText(/no differences/i)).toBeInTheDocument();
  });

  it('renders a checkbox per change only in selectable mode', () => {
    const {unmount} = render(<ResourceDiffList diff={diff} />);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    unmount();

    render(<ResourceDiffList diff={diff} selectable selectedKeys={new Set()} onToggle={vi.fn()} />);
    // One per changed resource; the unchanged one is not selectable.
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('reflects the selected keys and reports toggles', () => {
    const onToggle = vi.fn();
    render(
      <ResourceDiffList diff={diff} selectable selectedKeys={new Set(['application/id:app-a'])} onToggle={onToggle} />,
    );

    const checkboxes: HTMLInputElement[] = screen.getAllByRole('checkbox');
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);

    fireEvent.click(checkboxes[1]);
    expect(onToggle).toHaveBeenCalledWith('application/id:app-b');
  });
});
