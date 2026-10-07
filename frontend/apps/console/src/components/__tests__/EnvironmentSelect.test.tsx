// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {cleanup, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {EnvironmentProvider, type Environment} from '@thunderid/contexts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import EnvironmentSelect from '../EnvironmentSelect';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, options?: Record<string, string>) =>
      (fallback ?? key).replace(/{{(\w+)}}/g, (_match: string, name: string) => options?.[name] ?? ''),
  }),
}));

const environments: Environment[] = [
  {id: 'gw-1', name: 'dev', isDefault: true},
  {id: 'gw-2', name: 'prod'},
];

afterEach(() => {
  cleanup();
});

describe('EnvironmentSelect', () => {
  it('shows nothing when there is no gateway', () => {
    const {container} = render(
      <EnvironmentProvider environments={[]} onSelect={vi.fn()}>
        <EnvironmentSelect />
      </EnvironmentProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('offers read-only mode from write mode, with no gateway picker', async () => {
    const onReadOnlyChange = vi.fn();
    render(
      <EnvironmentProvider
        environments={environments}
        selectedId="gw-1"
        onSelect={vi.fn()}
        onReadOnlyChange={onReadOnlyChange}
      >
        <EnvironmentSelect />
      </EnvironmentProvider>,
    );

    expect(screen.getByRole('button', {name: 'Write'})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('combobox', {name: 'Gateway'})).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Read-only'}));

    expect(onReadOnlyChange).toHaveBeenCalledWith(true);
  });

  it('picks the gateway in read-only mode, marks the default, and goes back to write mode', async () => {
    const onSelect = vi.fn();
    const onReadOnlyChange = vi.fn();
    render(
      <EnvironmentProvider
        environments={environments}
        selectedId="gw-1"
        readOnly
        onSelect={onSelect}
        onReadOnlyChange={onReadOnlyChange}
      >
        <EnvironmentSelect />
      </EnvironmentProvider>,
    );

    const select = screen.getByRole('combobox', {name: 'Gateway'});
    expect(select).toHaveTextContent('Gateway: dev');
    await userEvent.click(select);
    const options = within(screen.getByRole('listbox'));
    expect(options.getByRole('option', {name: 'dev (default)'})).toBeInTheDocument();
    await userEvent.click(options.getByRole('option', {name: 'prod'}));
    expect(onSelect).toHaveBeenCalledWith('gw-2');

    await userEvent.click(screen.getByRole('button', {name: 'Write'}));
    expect(onReadOnlyChange).toHaveBeenCalledWith(false);
  });
});
