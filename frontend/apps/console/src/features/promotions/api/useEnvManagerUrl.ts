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

import {useConfig} from '@thunderid/contexts';

/**
 * Resolves the environment manager's base URL.
 *
 * The Control Plane serves the environment manager in process, on its own origin, so there is
 * nothing to configure: the management API's base URL is the environment manager's too.
 *
 * Promotion is a Control Plane feature. Every other plane resolves to undefined and the feature
 * reports that it is unavailable, rather than calling a host that does not serve it.
 */
export default function useEnvManagerUrl(): string | undefined {
  const {config, getServerUrl} = useConfig();
  if (config.plane !== 'cp') {
    return undefined;
  }
  const url: string = getServerUrl();

  return url ? url.replace(/\/+$/, '') : undefined;
}
