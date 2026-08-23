// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Button, PageContent, PageTitle} from '@wso2/oxygen-ui';
import {Plus} from '@wso2/oxygen-ui-icons-react';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import CaptureOrganizationVersion from '../components/CaptureOrganizationVersion';
import CreateGatewayDialog from '../components/CreateGatewayDialog';
import GatewayChain from '../components/GatewayChain';
import OrganizationVersions from '../components/OrganizationVersions';

/**
 * Page showing the gateway promotion chain.
 */
export default function PromotionsListPage(): JSX.Element {
  const {t} = useTranslation();
  const [createOpen, setCreateOpen] = useState<boolean>(false);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{t('promotions:listing.title', 'Promotions')}</PageTitle.Header>
        <PageTitle.SubHeader>
          {t('promotions:listing.subtitle', 'Promote configuration through your gateways and review every change')}
        </PageTitle.SubHeader>
        <PageTitle.Actions>
          {/* Capturing reads the workspace rather than any one gateway, so it sits here with the set
              of them rather than on a gateway's own page. */}
          <CaptureOrganizationVersion />
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            {t('promotions:gateway.add', 'Add Gateway')}
          </Button>
        </PageTitle.Actions>
      </PageTitle>
      {/* Versions belong to the organization, so they are listed here rather than under a gateway. */}
      <OrganizationVersions />
      <GatewayChain />
      <CreateGatewayDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
        }}
      />
    </PageContent>
  );
}
