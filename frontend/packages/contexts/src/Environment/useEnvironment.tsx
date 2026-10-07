// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useContext} from 'react';
import EnvironmentContext, {type EnvironmentContextType} from './EnvironmentContext';

const NONE: EnvironmentContextType = {
  environments: [],
  selected: undefined,
  gateway: undefined,
  readOnly: false,
  select: () => undefined,
  setReadOnly: () => undefined,
};

/**
 * React hook returning the console's mode, the gateways, and the one read-only mode shows.
 *
 * With no gateway registered there are none: the console is in write mode, `selected` and `gateway`
 * are undefined, and a component shows the resource's own values.
 *
 * @returns The environments, the selected one, and a way to select another
 *
 * @example
 * ```tsx
 * const {selected} = useEnvironment();
 * ```
 *
 * @public
 */
export default function useEnvironment(): EnvironmentContextType {
  return useContext(EnvironmentContext) ?? NONE;
}
