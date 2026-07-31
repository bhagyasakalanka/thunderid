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

import {Button, PageContent, PageTitle} from '@wso2/oxygen-ui';
import {Plus} from '@wso2/oxygen-ui-icons-react';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import CreateEnvironmentDialog from '../components/CreateEnvironmentDialog';
import EnvironmentChain from '../components/EnvironmentChain';

/**
 * Page showing the environment promotion chain.
 */
export default function PromotionsListPage(): JSX.Element {
  const {t} = useTranslation();
  const [createOpen, setCreateOpen] = useState<boolean>(false);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{t('promotions:listing.title', 'Promotions')}</PageTitle.Header>
        <PageTitle.SubHeader>
          {t('promotions:listing.subtitle', 'Promote configuration through your environments and review every change')}
        </PageTitle.SubHeader>
        <PageTitle.Actions>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            {t('promotions:environment.add', 'Add Environment')}
          </Button>
        </PageTitle.Actions>
      </PageTitle>
      <EnvironmentChain />
      <CreateEnvironmentDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
        }}
      />
    </PageContent>
  );
}
