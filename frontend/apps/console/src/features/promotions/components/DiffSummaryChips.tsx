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

import {Chip, Stack} from '@wso2/oxygen-ui';
import {type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import type {DiffSummary} from '../models/promotion';

/**
 * Compact counts of what a diff contains.
 */
export default function DiffSummaryChips({summary}: {summary: DiffSummary}): JSX.Element {
  const {t} = useTranslation();

  return (
    <Stack direction="row" spacing={1}>
      <Chip
        size="small"
        color="success"
        label={t('promotions:diff.addedCount', '{{count}} added', {count: summary.added})}
      />
      <Chip
        size="small"
        color="warning"
        label={t('promotions:diff.updatedCount', '{{count}} updated', {count: summary.updated})}
      />
      <Chip
        size="small"
        color="error"
        label={t('promotions:diff.deletedCount', '{{count}} deleted', {count: summary.deleted})}
      />
    </Stack>
  );
}
