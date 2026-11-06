// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {JSX, ComponentType} from 'react';
import SelectedProjectScope from '../components/SelectedProjectScope';

/**
 * Scopes the whole console to the selected project, so every route, under the dashboard or a
 * full-screen create page alike, lists and creates that project's applications and agents.
 */
export default function withProjectScope<P extends object>(WrappedComponent: ComponentType<P>) {
  return function WithProjectScope(props: P): JSX.Element {
    return (
      <SelectedProjectScope>
        <WrappedComponent {...props} />
      </SelectedProjectScope>
    );
  };
}
