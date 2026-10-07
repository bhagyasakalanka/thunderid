// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useEnvironment, type Environment} from '@thunderid/contexts';
import {FormControl, MenuItem, Select, Stack, ToggleButton, ToggleButtonGroup} from '@wso2/oxygen-ui';
import {Eye, Pencil} from '@wso2/oxygen-ui-icons-react';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';

/**
 * Switches the console between its two modes and, in read-only mode, chooses the gateway shown.
 *
 * Write mode edits this deployment's configuration and is bound to no gateway. Read-only mode shows
 * the configuration as one gateway runs it, so the gateway picker appears only there. With no
 * gateway registered there is nothing to read and nothing is shown.
 */
export default function EnvironmentSelect(): JSX.Element | null {
  const {t} = useTranslation();
  const {environments, selected, readOnly, select, setReadOnly} = useEnvironment();

  if (environments.length === 0 || !selected) {
    return null;
  }

  const modeLabel: string = t('common:environment.mode.label', 'Mode');
  const gatewayLabel: string = t('common:environment.gateway', 'Gateway');

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{mr: 1}}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={readOnly ? 'read-only' : 'write'}
        aria-label={modeLabel}
        onChange={(_event, value: string | null) => {
          if (value) {
            setReadOnly(value === 'read-only');
          }
        }}
      >
        <ToggleButton value="write" sx={{gap: 0.5, px: 1.25}}>
          <Pencil size={14} />
          {t('common:environment.mode.write', 'Write')}
        </ToggleButton>
        <ToggleButton value="read-only" color="warning" sx={{gap: 0.5, px: 1.25}}>
          <Eye size={14} />
          {t('common:environment.mode.readOnly', 'Read-only')}
        </ToggleButton>
      </ToggleButtonGroup>
      {readOnly && (
        <FormControl size="small" sx={{minWidth: 160}}>
          <Select
            value={selected.id}
            onChange={(event) => select(String(event.target.value))}
            inputProps={{'aria-label': gatewayLabel}}
            renderValue={() =>
              t('common:environment.selected', '{{label}}: {{name}}', {label: gatewayLabel, name: selected.name})
            }
          >
            {environments.map((environment: Environment) => (
              <MenuItem key={environment.id} value={environment.id}>
                {environment.isDefault
                  ? t('common:environment.default', '{{name}} (default)', {name: environment.name})
                  : environment.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
}
