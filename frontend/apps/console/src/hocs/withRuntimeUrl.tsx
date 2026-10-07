// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, useQueryClient} from '@tanstack/react-query';
import {EnvironmentProvider, RuntimeProvider, useConfig, type Environment} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {JSX, ComponentType} from 'react';

/**
 * The browser storage key the gateway selected for read-only mode is remembered under.
 */
export const SELECTED_ENVIRONMENT_KEY = 'thunderid.console.environment';

function remembered(key: string): string | undefined {
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function remember(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage that cannot be written only costs remembering the choice for the next visit.
  }
}

/**
 * Resolves the environments this deployment applies configuration to, the one selected, and the base
 * URL an application's own traffic reaches, and supplies them to the tree below through
 * `EnvironmentProvider` and `RuntimeProvider`.
 *
 * This deployment holds one configuration for all its gateways, while each gateway holds its own
 * values for it, such as a client ID or a redirect URI, and serves its own runtime. The console has
 * two modes. Write mode is that configuration as it stands, where it is edited, and is bound to no
 * gateway. Read-only mode is bound to one gateway and shows the configuration as that gateway runs
 * it. The console starts in write mode on every sign-in, and the mode is not kept past the session;
 * the gateway chosen for read-only mode is remembered in this browser, and starts on the default
 * gateway.
 *
 * A deployment that only holds configuration serves no runtime endpoints itself: the OAuth2, flow
 * and passkey URLs the console displays for a developer to copy have to name the gateway that will
 * answer them, so the runtime URL is the gateway read-only mode shows, and in write mode the default
 * gateway's, which is where a resource written there has its values set.
 *
 * No gateway, no permission to list them, or a deployment with no gateway API at all leaves no
 * environment and the URL unset, and every consumer falls back to the server URL and the resource's
 * own values. That is the ordinary answer for a deployment that serves its own runtime, so the
 * failure is silent by design. A failed request is left as an error rather than stored as an empty
 * list, so it is asked again on the next mount instead of being cached for the rest of the session.
 */
export default function withRuntimeUrl<P extends object>(WrappedComponent: ComponentType<P>) {
  return function WithRuntimeUrl(props: P): JSX.Element {
    const {http, isSignedIn} = useThunderID();
    const {getServerUrl} = useConfig();
    const queryClient = useQueryClient();
    const [chosen, setChosen] = useState<string | undefined>(() => remembered(SELECTED_ENVIRONMENT_KEY));
    const [readOnly, setReadOnly] = useState<boolean>(false);

    // The query client outlives a session, so a sign-out has to drop the previous session's
    // gateways rather than leave them to be shown to whoever signs in next,
    // and whoever signs in next starts in write mode.
    useEffect(() => {
      if (!isSignedIn) {
        queryClient.removeQueries({queryKey: ['gateways']});
        setReadOnly(false);
      }
    }, [isSignedIn, queryClient]);

    const {data: gateways} = useQuery<Environment[]>({
      queryKey: ['gateways'],
      enabled: isSignedIn,
      // A deployment that serves its own runtime answers this with a 404 or a 403. Retrying it on
      // every console load costs requests and changes nothing.
      retry: false,
      staleTime: Infinity,
      queryFn: async (): Promise<Environment[]> => {
        const response: {data: Environment[]} = await http.request({
          url: `${getServerUrl()}/gateways`,
          method: 'GET',
        } as unknown as Parameters<typeof http.request>[0]);

        return Array.isArray(response.data) ? response.data : [];
      },
    });

    const environments: Environment[] = useMemo(() => (isSignedIn && gateways ? gateways : []), [isSignedIn, gateways]);

    const defaultGateway: Environment | undefined =
      environments.find((environment: Environment) => environment.isDefault) ?? environments[0];
    // A remembered gateway that has since been removed falls back to the default.
    const selected: Environment | undefined =
      environments.find((environment: Environment) => environment.id === chosen) ?? defaultGateway;
    const runtime: Environment | undefined = readOnly ? selected : defaultGateway;

    const select = useCallback((id: string): void => {
      setChosen(id);
      remember(SELECTED_ENVIRONMENT_KEY, id);
    }, []);


    return (
      <EnvironmentProvider
        environments={environments}
        selectedId={selected?.id}
        readOnly={readOnly}
        onSelect={select}
        onReadOnlyChange={setReadOnly}
      >
        <RuntimeProvider url={runtime?.baseUrl}>
          <WrappedComponent {...props} />
        </RuntimeProvider>
      </EnvironmentProvider>
    );
  };
}
