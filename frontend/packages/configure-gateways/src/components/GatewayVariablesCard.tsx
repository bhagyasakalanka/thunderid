// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {QueryErrorNotice, SettingsCard} from '@thunderid/components';
import {useLogger} from '@thunderid/logger/react';
import {Button, Chip, IconButton, ListingTable, Tooltip, Typography} from '@wso2/oxygen-ui';
import {Pencil, Plus, Trash2} from '@wso2/oxygen-ui-icons-react';
import {useMemo, useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import GatewayValueDeleteDialog from './GatewayValueDeleteDialog';
import GatewayValueFormDialog, {type GatewayValueFormValues} from './GatewayValueFormDialog';
import GroupedValuesTable, {type GroupedValueColumn} from './GroupedValuesTable';
import useCreateGatewayVariable from '../api/useCreateGatewayVariable';
import useDeleteGatewayVariable from '../api/useDeleteGatewayVariable';
import useGetGatewayVariables from '../api/useGetGatewayVariables';
import useUpdateGatewayVariable from '../api/useUpdateGatewayVariable';
import useGatewayErrorTranslator from '../hooks/useGatewayErrorTranslator';
import useValueReferences from '../hooks/useValueReferences';
import type {GatewayVariable} from '../models/gateway';
import getGatewayValuesErrorMessage from '../utils/getGatewayValuesErrorMessage';
import {isListValue, parseListValue} from '../utils/listValue';

export interface GatewayVariablesCardProps {
  gatewayId: string;
}

type FormTarget = {mode: 'create'; name?: string} | {mode: 'edit'; variable: GatewayVariable};

/**
 * The variables a gateway holds, read from and written to the gateway's own store.
 */
export default function GatewayVariablesCard({gatewayId}: GatewayVariablesCardProps): JSX.Element {
  const {t} = useTranslation();
  const tForErrors = useGatewayErrorTranslator();
  const logger = useLogger('GatewayVariablesCard');
  const {byName: referencesByName, uncaptured} = useValueReferences('variable');
  const {data, isLoading, error, refetch} = useGetGatewayVariables(gatewayId);
  const createVariable = useCreateGatewayVariable();
  const updateVariable = useUpdateGatewayVariable();
  const deleteVariable = useDeleteGatewayVariable();
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GatewayVariable | null>(null);

  const saveMutation = formTarget?.mode === 'edit' ? updateVariable : createVariable;

  const closeForm = (): void => {
    createVariable.reset();
    updateVariable.reset();
    setFormTarget(null);
  };

  const closeDelete = (): void => {
    deleteVariable.reset();
    setDeleteTarget(null);
  };

  const handleSubmit = (values: GatewayValueFormValues): void => {
    const description = values.description.trim() ? values.description.trim() : undefined;
    const onError = (err: Error): void => {
      logger.error('Failed to save gateway variable', {error: err});
    };

    if (formTarget?.mode === 'edit') {
      updateVariable.mutate(
        {gatewayId, name: formTarget.variable.name, data: {value: values.value, description}},
        {onSuccess: closeForm, onError},
      );
      return;
    }
    createVariable.mutate(
      {gatewayId, data: {name: values.name.trim(), value: values.value, description}},
      {onSuccess: closeForm, onError},
    );
  };

  const handleDelete = (): void => {
    if (!deleteTarget) return;
    deleteVariable.mutate(
      {gatewayId, name: deleteTarget.name},
      {
        onSuccess: closeDelete,
        onError: (err: Error) => {
          logger.error('Failed to delete gateway variable', {error: err});
        },
      },
    );
  };

  const columns: GroupedValueColumn<GatewayVariable>[] = useMemo(
    () => [
      {
        field: 'value',
        headerName: t('gateways:values.columns.value', 'Value'),
        render: (row) =>
          row.held ? (
            (parseListValue(row.held.value) ?? [row.held.value]).map((item: string, index: number) => (
              <Typography key={`${String(index)}-${item}`} variant="body2" sx={{fontFamily: 'monospace'}} noWrap>
                {item}
              </Typography>
            ))
          ) : (
            <Chip size="small" color="warning" variant="outlined" label={t('gateways:values.notSet', 'Not set')} />
          ),
      },
      {
        field: 'description',
        headerName: t('gateways:values.columns.description', 'Description'),
        render: (row) =>
          row.held?.description ? (
            <Typography variant="body2">{row.held.description}</Typography>
          ) : (
            <Typography variant="body2" color="text.disabled">
              -
            </Typography>
          ),
      },
      {
        field: 'actions',
        headerName: t('gateways:values.columns.actions', 'Actions'),
        width: 120,
        align: 'center',
        render: (row): JSX.Element => {
          const {held} = row;
          if (!held) {
            return (
              <Button size="small" onClick={() => setFormTarget({mode: 'create', name: row.name})}>
                {t('gateways:values.set', 'Set value')}
              </Button>
            );
          }
          return (
            <ListingTable.RowActions>
              <Tooltip title={t('common:actions.edit', 'Edit')}>
                <IconButton
                  size="small"
                  aria-label={t('gateways:variables.editAction', 'Edit {{name}}', {name: held.name})}
                  onClick={() => setFormTarget({mode: 'edit', variable: held})}
                >
                  <Pencil size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('common:actions.delete', 'Delete')}>
                <IconButton
                  size="small"
                  color="error"
                  aria-label={t('gateways:variables.deleteAction', 'Delete {{name}}', {name: held.name})}
                  onClick={() => setDeleteTarget(held)}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            </ListingTable.RowActions>
          );
        },
      },
    ],
    [t],
  );

  return (
    <SettingsCard
      title={t('gateways:variables.title', 'Variables')}
      description={t(
        'gateways:variables.description',
        'Values this gateway holds that configuration refers to by name. Variable values are visible.',
      )}
      headerAction={
        <Button
          variant="outlined"
          startIcon={<Plus size={16} />}
          onClick={() => setFormTarget({mode: 'create'})}
          disabled={Boolean(error)}
        >
          {t('gateways:variables.add', 'Add variable')}
        </Button>
      }
    >
      {error ? (
        <QueryErrorNotice
          error={error}
          t={tForErrors}
          variant="inline"
          fallbackKey="variables.error"
          fallbackDefaultValue="Failed to load the variables of this gateway"
          resolveErrorMessage={getGatewayValuesErrorMessage}
          onRetry={() => void refetch()}
        />
      ) : (
        <GroupedValuesTable
          held={data?.variables ?? []}
          references={referencesByName}
          uncaptured={uncaptured}
          columns={columns}
          loading={isLoading}
          emptyLabel={t('gateways:variables.empty', 'This gateway holds no variables yet.')}
        />
      )}

      {formTarget && (
        <GatewayValueFormDialog
          idPrefix="gateway-variable"
          list={
            formTarget.mode === 'edit'
              ? isListValue(referencesByName.get(formTarget.variable.name)) ||
                parseListValue(formTarget.variable.value) !== undefined
              : isListValue(referencesByName.get(formTarget.name ?? ''))
          }
          title={
            formTarget.mode === 'edit'
              ? t('gateways:variables.edit.title', 'Edit variable')
              : formTarget.name
                ? t('gateways:variables.set.title', 'Set variable')
                : t('gateways:variables.create.title', 'Add a variable')
          }
          nameEditable={formTarget.mode === 'create' && !formTarget.name}
          initialValues={
            formTarget.mode === 'edit'
              ? {
                  name: formTarget.variable.name,
                  value: formTarget.variable.value,
                  description: formTarget.variable.description ?? '',
                }
              : {name: formTarget.name ?? '', value: '', description: ''}
          }
          valueLabel={t('gateways:values.form.value.label', 'Value')}
          submitLabel={
            formTarget.mode === 'edit' ? t('common:actions.save', 'Save') : t('gateways:values.form.add', 'Add')
          }
          submittingLabel={t('common:status.saving', 'Saving...')}
          isPending={saveMutation.isPending}
          error={
            saveMutation.error
              ? getGatewayValuesErrorMessage(
                  saveMutation.error,
                  tForErrors,
                  'variables.save.error',
                  'The variable could not be saved. Please try again.',
                )
              : undefined
          }
          onEdit={() => {
            if (saveMutation.isError) saveMutation.reset();
          }}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <GatewayValueDeleteDialog
          title={t('gateways:variables.delete.title', 'Delete variable')}
          message={t('gateways:variables.delete.message', 'Delete the variable {{name}} from this gateway?', {
            name: deleteTarget.name,
          })}
          isPending={deleteVariable.isPending}
          error={
            deleteVariable.error
              ? getGatewayValuesErrorMessage(
                  deleteVariable.error,
                  tForErrors,
                  'variables.delete.error',
                  'The variable could not be deleted. Please try again.',
                )
              : undefined
          }
          onConfirm={handleDelete}
          onClose={closeDelete}
        />
      )}
    </SettingsCard>
  );
}
