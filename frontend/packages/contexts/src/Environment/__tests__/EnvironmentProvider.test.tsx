// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import type {Environment} from '../EnvironmentContext';
import EnvironmentProvider from '../EnvironmentProvider';
import useEnvironment from '../useEnvironment';

const environments: Environment[] = [
  {id: 'gw-1', name: 'dev', baseUrl: 'https://dev.example.com', isDefault: true},
  {id: 'gw-2', name: 'prod', baseUrl: 'https://prod.example.com'},
];

function Probe() {
  const {environments: listed, selected, gateway, readOnly, select, setReadOnly} = useEnvironment();
  return (
    <>
      <span data-testid="count">{listed.length}</span>
      <span data-testid="selected">{selected?.name ?? ''}</span>
      <span data-testid="gateway">{gateway?.name ?? ''}</span>
      <span data-testid="readOnly">{String(readOnly)}</span>
      <button type="button" onClick={() => select('gw-1')}>
        select
      </button>
      <button type="button" onClick={() => setReadOnly(true)}>
        read-only
      </button>
    </>
  );
}

function text(testId: string): string {
  return container.querySelector(`[data-testid="${testId}"]`)?.textContent ?? '';
}

function click(label: string): void {
  act(() => {
    Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === label)
      ?.click();
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('useEnvironment', () => {
  it('shows the selected gateway in read-only mode', () => {
    const onSelect = vi.fn();
    act(() => {
      root.render(
        <EnvironmentProvider environments={environments} selectedId="gw-2" readOnly onSelect={onSelect}>
          <Probe />
        </EnvironmentProvider>,
      );
    });

    expect(text('count')).toBe('2');
    expect(text('selected')).toBe('prod');
    expect(text('gateway')).toBe('prod');
    expect(text('readOnly')).toBe('true');
    click('select');
    expect(onSelect).toHaveBeenCalledWith('gw-1');
  });

  it('binds write mode to no gateway, and keeps the selection for switching back', () => {
    const onReadOnlyChange = vi.fn();
    act(() => {
      root.render(
        <EnvironmentProvider
          environments={environments}
          selectedId="gw-2"
          onSelect={vi.fn()}
          onReadOnlyChange={onReadOnlyChange}
        >
          <Probe />
        </EnvironmentProvider>,
      );
    });

    expect(text('selected')).toBe('prod');
    expect(text('gateway')).toBe('');
    expect(text('readOnly')).toBe('false');
    click('read-only');
    expect(onReadOnlyChange).toHaveBeenCalledWith(true);
  });

  it('is not read-only when the selection names no gateway', () => {
    act(() => {
      root.render(
        <EnvironmentProvider environments={environments} selectedId="gone" readOnly onSelect={vi.fn()}>
          <Probe />
        </EnvironmentProvider>,
      );
    });

    expect(text('selected')).toBe('');
    expect(text('readOnly')).toBe('false');
  });

  it('answers with write mode and no gateways outside a provider', () => {
    act(() => {
      root.render(<Probe />);
    });

    expect(text('count')).toBe('0');
    expect(text('readOnly')).toBe('false');
    click('read-only');
  });
});
