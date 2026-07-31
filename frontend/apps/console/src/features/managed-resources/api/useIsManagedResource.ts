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

import {useCallback} from 'react';
import useManagedResources, {type ManagedResourceType} from './useManagedResources';

/**
 * Tells whether a given resource is owned by the control plane, so a view can present it read only
 * instead of offering controls the server will refuse.
 *
 * While the answer is still loading nothing is reported as managed, so the UI does not flicker into
 * a read-only state and back. The server is the authority either way: it refuses the write with 403
 * even if a control slips through.
 */
export default function useIsManagedResource(type: ManagedResourceType): (id: string) => boolean {
  const {data} = useManagedResources();

  return useCallback(
    (id: string): boolean => {
      if (!data?.enabled || !id) {
        return false;
      }
      return (data.managed[type] ?? []).includes(id);
    },
    [data, type],
  );
}
