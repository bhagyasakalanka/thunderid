// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMemo, type JSX, type PropsWithChildren} from 'react';
import EnvironmentContext, {type Environment, type EnvironmentContextType} from './EnvironmentContext';

/**
 * Props for the EnvironmentProvider component.
 *
 * @public
 */
export interface EnvironmentProviderProps extends PropsWithChildren {
  /** Every gateway there is. */
  environments: Environment[];
  /** The identifier of the gateway selected for read-only mode. */
  selectedId?: string;
  /** Whether the console is in read-only mode. It is only when a gateway is selected. */
  readOnly?: boolean;
  /** Called with the identifier of a gateway chosen. */
  onSelect: (id: string) => void;
  /** Called when the mode is switched. */
  onReadOnlyChange?: (readOnly: boolean) => void;
}

/**
 * React context provider that tells feature packages which mode the console is in, and in read-only
 * mode which gateway it shows.
 *
 * A control plane holds one configuration for every gateway it applies configuration to. Write mode
 * edits that configuration. Read-only mode shows it as one gateway runs it, from the version that
 * gateway applied, read-only but for the gateway's own values. The mode is the host application's
 * choice: packages only read it through `useEnvironment`.
 *
 * @public
 */
export default function EnvironmentProvider({
  environments,
  selectedId = undefined,
  readOnly = false,
  onSelect,
  onReadOnlyChange = () => undefined,
  children,
}: EnvironmentProviderProps): JSX.Element {
  const value: EnvironmentContextType = useMemo(() => {
    const selected: Environment | undefined = environments.find(
      (environment: Environment) => environment.id === selectedId,
    );
    const isReadOnly: boolean = readOnly && selected !== undefined;
    return {
      environments,
      selected,
      gateway: isReadOnly ? selected : undefined,
      readOnly: isReadOnly,
      select: onSelect,
      setReadOnly: onReadOnlyChange,
    };
  }, [environments, selectedId, readOnly, onSelect, onReadOnlyChange]);

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}
