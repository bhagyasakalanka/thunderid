// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, render, screen} from '@testing-library/react';
import {EnvironmentProvider, type Environment} from '@thunderid/contexts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import ReadOnlyModeFrame from '../ReadOnlyModeFrame';

vi.mock('@thunderid/components', () => ({
  EnvironmentModeBanner: () => <div data-testid="banner" />,
}));

const environments: Environment[] = [{id: 'gw-1', name: 'dev', isDefault: true}];

afterEach(() => {
  cleanup();
});

describe('ReadOnlyModeFrame', () => {
  it('frames the page with the banner in read-only mode', () => {
    render(
      <EnvironmentProvider environments={environments} selectedId="gw-1" readOnly onSelect={vi.fn()}>
        <ReadOnlyModeFrame>
          <p>page</p>
        </ReadOnlyModeFrame>
      </EnvironmentProvider>,
    );

    expect(screen.getByTestId('read-only-mode-frame')).toContainElement(screen.getByText('page'));
    expect(screen.getByTestId('banner')).toBeInTheDocument();
  });

  it('shows the page as it is in write mode', () => {
    render(
      <EnvironmentProvider environments={environments} selectedId="gw-1" onSelect={vi.fn()}>
        <ReadOnlyModeFrame>
          <p>page</p>
        </ReadOnlyModeFrame>
      </EnvironmentProvider>,
    );

    expect(screen.getByText('page')).toBeInTheDocument();
    expect(screen.queryByTestId('read-only-mode-frame')).not.toBeInTheDocument();
    expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
  });
});
