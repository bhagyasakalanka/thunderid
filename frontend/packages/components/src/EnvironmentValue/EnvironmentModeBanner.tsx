// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useEnvironment} from '@thunderid/contexts';
import {Alert, Button} from '@wso2/oxygen-ui';
import {Eye} from '@wso2/oxygen-ui-icons-react';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useAppliedConfiguration} from './useEnvironmentValues';

/** How many characters of a version's hash name it to a person. */
const SHORT_HASH = 7;

/**
 * Says, on every page in read-only mode, that the console shows the configuration as one gateway
 * runs it and that only that gateway's values can be set, with the way back to write mode. Nothing
 * is shown in write mode.
 *
 * @public
 */
export default function EnvironmentModeBanner(): JSX.Element | null {
  const {t} = useTranslation();
  const {gateway, setReadOnly} = useEnvironment();
  const {data: configuration} = useAppliedConfiguration(gateway?.id);

  if (!gateway) {
    return null;
  }

  const environment: string = gateway.name;
  const version: string | undefined = configuration?.version?.slice(0, SHORT_HASH);

  return (
    <Alert
      severity="warning"
      variant="filled"
      icon={<Eye size={18} />}
      data-testid="environment-mode-banner"
      sx={{borderRadius: 0, py: 0.25, alignItems: 'center'}}
      action={
        <Button color="inherit" size="small" variant="outlined" onClick={() => setReadOnly(false)}>
          {t('common:environment.mode.switchToWrite', 'Switch to Write mode')}
        </Button>
      }
    >
      {configuration && !version
        ? t(
            'common:environment.mode.nothingApplied',
            'Read-only: {{environment}}. Nothing has been applied to {{environment}} yet. Switch to Write mode to edit.',
            {environment},
          )
        : t(
            'common:environment.mode.banner',
            'Read-only: {{environment}}, version {{version}}. Only values held by {{environment}} can be set here. Switch to Write mode to edit.',
            {environment, version: version ?? ''},
          )}
    </Alert>
  );
}
