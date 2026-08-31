// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {fireEvent} from '@testing-library/react';
import {render, screen} from '@thunderid/test-utils';
import {describe, expect, it, vi, beforeEach} from 'vitest';
import RenameVersionDialog from '../RenameVersionDialog';

const mutate = vi.fn();

vi.mock('../../api/useRenameVersion', () => ({
  default: (): {mutate: typeof mutate; isPending: boolean} => ({mutate, isPending: false}),
}));

describe('RenameVersionDialog', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  it('opens with the version current name, so a correction starts from what is there', () => {
    render(<RenameVersionDialog seq={3} note="before release" onClose={vi.fn()} />);

    expect(screen.getByTestId('rename-version-note')).toHaveValue('before release');
  });

  it('sends the edited name for that version', () => {
    render(<RenameVersionDialog seq={3} note="before release" onClose={vi.fn()} />);

    fireEvent.change(screen.getByTestId('rename-version-note'), {target: {value: 'release 1.4'}});
    fireEvent.click(screen.getByRole('button', {name: /save/i}));

    expect(mutate).toHaveBeenCalledWith({seq: 3, note: 'release 1.4'}, expect.anything());
  });

  it('sends nothing when the dialog is dismissed', () => {
    const onClose = vi.fn();
    render(<RenameVersionDialog seq={3} note="before release" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', {name: /cancel/i}));

    expect(mutate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
