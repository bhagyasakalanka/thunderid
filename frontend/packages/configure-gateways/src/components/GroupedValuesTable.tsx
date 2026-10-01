// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@wso2/oxygen-ui';
import {Fragment, useMemo, type JSX, type ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import useValueReferenceLabels from '../hooks/useValueReferenceLabels';
import type {ValueReference} from '../models/gateway';
import groupByResource, {type ResourceTypeValues, type ResourceValues} from '../utils/groupByResource';

/**
 * A value as the table shows it: one the gateway holds, or one the configuration refers to that the
 * gateway does not hold yet, which has no `held` entry.
 */
export interface GroupedValueRow<T> {
  name: string;
  references: ValueReference[];
  held?: T;
}

export interface GroupedValueColumn<T> {
  field: string;
  headerName: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render: (row: GroupedValueRow<T>) => ReactNode;
}

export interface GroupedValuesTableProps<T extends {name: string}> {
  held: T[];
  references: ReadonlyMap<string, ValueReference[]>;
  /** Values the configuration refers to that the latest captured version does not. */
  uncaptured: ReadonlySet<string>;
  columns: GroupedValueColumn<T>[];
  loading: boolean;
  emptyLabel: string;
}

/**
 * Lists a gateway's values grouped by the type of resource that uses them and then by the resource.
 * Each value is named by the field it fills, with its variable name beneath. Values the configuration
 * refers to that the gateway does not hold are listed too, so they can be set where they are seen, and
 * a value no captured version refers to yet says so.
 */
export default function GroupedValuesTable<T extends {name: string}>({
  held,
  references,
  uncaptured,
  columns,
  loading,
  emptyLabel,
}: GroupedValuesTableProps<T>): JSX.Element {
  const {t} = useTranslation();
  const {resourceTypeLabel, fieldLabel, describe} = useValueReferenceLabels();

  const groups = useMemo((): ResourceTypeValues[] => {
    const names = new Set(held.map((value: T) => value.name));
    references.forEach((_, name: string) => names.add(name));
    return groupByResource([...names], references);
  }, [held, references]);

  const heldByName = useMemo(() => new Map(held.map((value: T) => [value.name, value])), [held]);

  if (loading) {
    return <CircularProgress size={24} />;
  }
  if (groups.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel}
      </Typography>
    );
  }

  const nameCell = (name: string, own: ValueReference[]): JSX.Element => {
    const others = [...new Set(own.slice(1).map(describe))];
    return (
      <Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={{fontWeight: 500}}>
            {own.length > 0 ? fieldLabel(own[0].field) : name}
          </Typography>
          {others.length > 0 && (
            <Tooltip title={others.join(', ')}>
              <Typography component="span" variant="body2" color="text.secondary">
                {t('gateways:references.more', '+{{count}} more', {count: others.length})}
              </Typography>
            </Tooltip>
          )}
          {uncaptured.has(name) && (
            <Tooltip
              title={t(
                'gateways:values.uncaptured.hint',
                'No captured version refers to this value yet. Capture a version to include it in an apply.',
              )}
            >
              <Chip
                size="small"
                color="info"
                variant="outlined"
                label={t('gateways:values.uncaptured', 'Not captured yet')}
              />
            </Tooltip>
          )}
        </Stack>
        {own.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{fontFamily: 'monospace'}}>
            {name}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Stack spacing={3}>
      {groups.map((group: ResourceTypeValues) => (
        <Stack key={group.resourceType ?? 'other'} spacing={1}>
          <Typography variant="overline" component="h3" sx={{lineHeight: 1.5}}>
            {group.resourceType ? resourceTypeLabel(group.resourceType) : t('gateways:references.other', 'Other')}
          </Typography>
          <Paper variant="outlined" sx={{overflow: 'hidden'}}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{'& th': {bgcolor: 'action.hover'}}}>
                  <TableCell>{t('gateways:values.columns.name', 'Name')}</TableCell>
                  {columns.map((column: GroupedValueColumn<T>) => (
                    <TableCell key={column.field} align={column.align} sx={{width: column.width}}>
                      {column.headerName}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {group.resources.map((resource: ResourceValues) => (
                  <Fragment key={resource.key}>
                    {resource.label && (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} sx={{bgcolor: 'background.default', py: 0.75}}>
                          <Typography component="h4" variant="subtitle2">
                            {resource.label}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {resource.names.map((name: string) => {
                      const row: GroupedValueRow<T> = {
                        name,
                        references: references.get(name) ?? [],
                        held: heldByName.get(name),
                      };
                      return (
                        <TableRow key={name}>
                          <TableCell sx={{pl: resource.label ? 3 : 2}}>{nameCell(name, row.references)}</TableCell>
                          {columns.map((column: GroupedValueColumn<T>) => (
                            <TableCell key={column.field} align={column.align}>
                              {column.render(row)}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      ))}
    </Stack>
  );
}
