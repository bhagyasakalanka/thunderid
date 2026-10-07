// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useEnvironment, type Environment} from '@thunderid/contexts';
import {useCopyToClipboard} from '@thunderid/hooks';
import {
  Alert,
  Button,
  FormControl,
  FormLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@wso2/oxygen-ui';
import {Check, Copy} from '@wso2/oxygen-ui-icons-react';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import type {StoredValue, ValueReference} from './models';
import RegenerateEnvironmentSecretDialog from './RegenerateEnvironmentSecretDialog';
import SetEnvironmentValueDialog from './SetEnvironmentValueDialog';
import {useStoredValues} from './useEnvironmentValues';
import {parseListValue} from './values';

interface EnvironmentValueFieldProps {
  reference: ValueReference;
  environment: Environment;
  label: string;
  hint?: string;
}

/**
 * The value an environment's gateway holds for a field, and the actions that set it.
 */
export default function EnvironmentValueField({
  reference,
  environment,
  label,
  hint = undefined,
}: EnvironmentValueFieldProps): JSX.Element {
  const {t} = useTranslation();
  const {copied, copy} = useCopyToClipboard({resetDelay: 2000});
  const {environments} = useEnvironment();
  const defaultEnvironment: Environment | undefined = environments.find(
    (candidate: Environment) => candidate.isDefault,
  );
  const [setting, setSetting] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const isSecret: boolean = reference.kind === 'secret';
  const stored = useStoredValues(environment.id, reference.kind);

  const held: StoredValue | undefined = stored.data?.find(
    (candidate: StoredValue) => candidate.name === reference.name && (!isSecret || candidate.exists),
  );
  const variable: StoredValue | undefined = isSecret ? undefined : held;
  const {isLoading: loading, isError: failed} = stored;
  const isSet = Boolean(held);
  const items: string[] | undefined =
    reference.list && variable?.value !== undefined ? parseListValue(variable.value) : undefined;
  const shown: string = items ? items.join('\n') : (variable?.value ?? '');
  const id = `environment-value-${reference.name}`;

  return (
    <FormControl fullWidth>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 1}}>
          {hint}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 1}}>
        {t('common:environment.value.caption', 'As {{environment}} holds it.', {environment: environment.name})}
      </Typography>
      {failed && (
        <Alert severity="error" sx={{mb: 1}}>
          {t('common:environment.value.loadError', 'The values {{environment}} holds could not be read.', {
            environment: environment.name,
          })}
        </Alert>
      )}
      {!loading && !failed && !isSet && (
        <Alert severity="warning" sx={{mb: 1}}>
          {defaultEnvironment && defaultEnvironment.id !== environment.id
            ? t(
                'common:environment.value.notSetElsewhere',
                'Not set in {{environment}}. A new resource has its values set on {{default}}, the default gateway, only. Applying the configuration to {{environment}} is refused until it is set here.',
                {environment: environment.name, default: defaultEnvironment.name},
              )
            : t(
                'common:environment.value.notSet',
                'Not set in {{environment}}. Applying the configuration to it is refused until it is.',
                {environment: environment.name},
              )}
        </Alert>
      )}
      <Stack direction="row" spacing={1} alignItems="flex-start">
        {isSecret ? (
          <TextField
            fullWidth
            id={id}
            value={isSet ? '••••••••••••••••' : ''}
            InputProps={{readOnly: true}}
            disabled
            sx={{'& input': {fontFamily: 'monospace', fontSize: '0.875rem'}}}
          />
        ) : (
          <TextField
            fullWidth
            id={id}
            value={shown}
            multiline={Boolean(reference.list)}
            InputProps={{
              readOnly: true,
              endAdornment: isSet ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={`${t('common:actions.copy')} ${label}`}
                    onClick={() => {
                      copy(shown).catch(() => {
                        // Error already handled in copy
                      });
                    }}
                    edge="end"
                    size="small"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
            sx={{'& input, & textarea': {fontFamily: 'monospace', fontSize: '0.875rem'}}}
          />
        )}
        <Button variant="outlined" onClick={() => setSetting(true)} disabled={loading || failed}>
          {isSet ? t('common:environment.value.edit', 'Edit') : t('common:environment.value.set', 'Set value')}
        </Button>
        {isSecret && (
          <Button variant="contained" color="error" onClick={() => setRegenerating(true)} disabled={loading || failed}>
            {t('common:environment.value.regenerate', 'Regenerate')}
          </Button>
        )}
      </Stack>
      {setting && (
        <SetEnvironmentValueDialog
          open
          reference={reference}
          environment={environment}
          label={label}
          current={variable}
          description={held?.description}
          onClose={() => setSetting(false)}
        />
      )}
      {isSecret && (
        <RegenerateEnvironmentSecretDialog
          open={regenerating}
          reference={reference}
          environment={environment}
          label={label}
          description={held?.description}
          onClose={() => setRegenerating(false)}
        />
      )}
    </FormControl>
  );
}
