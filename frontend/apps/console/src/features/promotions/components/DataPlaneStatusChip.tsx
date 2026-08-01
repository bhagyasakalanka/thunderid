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

import {Chip, Tooltip} from '@wso2/oxygen-ui';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';
import type {DataPlaneStatus} from '../models/promotion';

export interface DataPlaneStatusChipProps {
  status?: DataPlaneStatus;
}

/**
 * Shows whether an environment's Data Plane is connected.
 *
 * The Data Plane dials the Control Plane and holds that connection open, so it is the only route to
 * it: a disconnected Data Plane cannot be applied to or promoted into, and there is nothing an
 * operator can do from here to reach it. Showing the state next to the environment is what stops a
 * promotion being started against one that cannot receive it.
 */
export default function DataPlaneStatusChip({status}: DataPlaneStatusChipProps): JSX.Element {
  const {t} = useTranslation('promotions');
  const connected: boolean = status?.connected ?? false;

  const label: string = connected
    ? t('dataPlane.connected', 'Data Plane connected')
    : t('dataPlane.disconnected', 'Data Plane offline');

  const tooltip: string = connected
    ? t('dataPlane.connectedHint', 'Last seen {{lastSeen}}', {
        lastSeen: status?.lastSeen ? new Date(status.lastSeen).toLocaleString() : '-',
      })
    : t(
        'dataPlane.disconnectedHint',
        'The Data Plane has not connected to this Control Plane. It opens the connection itself, so nothing can be applied or promoted to it until it does.',
      );

  return (
    <Tooltip title={tooltip}>
      <Chip size="small" color={connected ? 'success' : 'default'} variant="outlined" label={label} />
    </Tooltip>
  );
}
