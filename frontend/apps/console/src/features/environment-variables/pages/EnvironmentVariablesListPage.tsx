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

import {Alert, Button, PageContent, PageTitle} from '@wso2/oxygen-ui';
import {Plus, Upload} from '@wso2/oxygen-ui-icons-react';
import {type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router';
import useApplyAll from '../../promotions/api/useApplyAll';
import EnvironmentVariablesList from '../components/EnvironmentVariablesList';

/**
 * Page listing the environment variables with a create action.
 */
export default function EnvironmentVariablesListPage(): JSX.Element {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const applyAll = useApplyAll();

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{t('environmentVariables:listing.title', 'Environment Variables')}</PageTitle.Header>
        <PageTitle.SubHeader>
          {t(
            'environmentVariables:listing.subtitle',
            'Non-secret values substituted into configuration when it is applied to a Data Plane',
          )}
        </PageTitle.SubHeader>
        <PageTitle.Actions>
          <Button
            startIcon={<Upload size={18} />}
            disabled={applyAll.isPending}
            onClick={() => {
              applyAll.mutate();
            }}
          >
            {applyAll.isPending
              ? t('promotions:applyAll.inProgress', 'Applying...')
              : t('promotions:applyAll.action', 'Apply to Data Planes')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => {
              void navigate('/environment-variables/create');
            }}
          >
            {t('environmentVariables:listing.add', 'Add Variable')}
          </Button>
        </PageTitle.Actions>
      </PageTitle>
      <Alert severity="info" sx={{mb: 2}}>
        {t(
          'environmentVariables:applyNotice',
          'A change here reaches a Data Plane only when configuration is applied. Use Apply to Data Planes to push it now.',
        )}
      </Alert>
      <EnvironmentVariablesList />
    </PageContent>
  );
}
