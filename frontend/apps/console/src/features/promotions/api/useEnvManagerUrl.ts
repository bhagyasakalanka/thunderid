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
 * Resolves the environment manager's base URL from the runtime configuration.
 *
 * The environment manager is a separate service from the management API, so it has its own
 * `env_manager.public_url` entry in config.js. It is optional: when it is absent the promotion
 * feature reports that it is not configured rather than calling an unknown host.
 */
export default function useEnvManagerUrl(): string | undefined {
  const {config} = useConfig();
  const url: string | undefined = config.env_manager?.public_url;

  return url ? url.replace(/\/+$/, '') : undefined;
}
