// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ExternalLink} from '@thunderid/components';
import {useEnvironment} from '@thunderid/contexts';
import {useLogger} from '@thunderid/logger/react';
import {Button, PageContent, PageTitle} from '@wso2/oxygen-ui';
import {Plus} from '@wso2/oxygen-ui-icons-react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router';
import UsersList from '../components/UsersList';
import useUserRoutes from '../hooks/useUserRoutes';

export default function UsersListPage() {
  const navigate = useNavigate();
  const {t} = useTranslation();
  const logger = useLogger('UsersListPage');
  const routes = useUserRoutes();
  const {readOnly} = useEnvironment();

  return (
    <PageContent>
      {/* Header */}
      <PageTitle>
        <PageTitle.Header>{t('users:title')}</PageTitle.Header>
        <PageTitle.SubHeader>
          {t('users:subtitle')} <ExternalLink docKey="users" />
        </PageTitle.SubHeader>
        {!readOnly && (
          <PageTitle.Actions>
            <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => {
              (async () => {
                await navigate(routes.add());
              })().catch((error: unknown) => {
                logger.error('Failed to navigate to add user page', {error});
              });
            }}
          >
            {t('users:addUser')}
            </Button>
          </PageTitle.Actions>
        )}
      </PageTitle>

      <UsersList />
    </PageContent>
  );
}
