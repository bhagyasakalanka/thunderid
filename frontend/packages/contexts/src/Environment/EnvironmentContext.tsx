// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Context, createContext} from 'react';

/**
 * A gateway this deployment applies configuration to, which the console can show the configuration
 * of as that gateway runs it.
 *
 * @public
 */
export interface Environment {
  /** The gateway's identifier. */
  id: string;
  /** The gateway's name, which is how it is shown. */
  name: string;
  /** Base URL the gateway serves its runtime endpoints on. */
  baseUrl?: string;
  /** Whether this is the default gateway. At most one is. */
  isDefault?: boolean;
}

/**
 * Environment context interface: the console's mode, and the gateway read-only mode shows.
 *
 * The console has two modes. Write mode is this deployment's configuration as it stands, where it
 * is edited, and is bound to no gateway. Read-only mode is bound to one gateway and shows the
 * configuration as that gateway runs it: nothing can be changed there but that gateway's values.
 *
 * @public
 */
export interface EnvironmentContextType {
  /** Every gateway, in the order they were listed. Empty when there are none. */
  environments: Environment[];
  /** The gateway read-only mode shows, kept while in write mode so switching back returns to it. */
  selected?: Environment;
  /** The gateway shown, in read-only mode only. Undefined in write mode. */
  gateway?: Environment;
  /** Whether the console is in read-only mode. */
  readOnly: boolean;
  /** Selects the gateway with this identifier for read-only mode. */
  select: (id: string) => void;
  /** Switches between read-only mode and write mode. */
  setReadOnly: (readOnly: boolean) => void;
}

/**
 * React context holding the console's mode and the gateway it shows for the component tree beneath
 * it.
 *
 * The value is undefined when no `EnvironmentProvider` is present. `useEnvironment` answers that
 * with write mode and no gateways rather than reading the context directly.
 *
 * @public
 */
const EnvironmentContext: Context<EnvironmentContextType | undefined> = createContext<
  EnvironmentContextType | undefined
>(undefined);

export default EnvironmentContext;
