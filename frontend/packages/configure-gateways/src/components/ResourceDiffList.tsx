// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Box, Button, Checkbox, Chip, Collapse, Stack, Typography} from '@wso2/oxygen-ui';
import {ChevronDown, ChevronUp} from '@wso2/oxygen-ui-icons-react';
import {useMemo, useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import ChangeLines from './ChangeLines';
import type {ChangeType, GatewayDiff, ResourceChange} from '../models/gateway';
import isOffered from '../utils/isOffered';

const CHANGE_COLORS: Record<ChangeType, 'success' | 'warning' | 'error' | 'default'> = {
  added: 'success',
  updated: 'warning',
  deleted: 'error',
  unchanged: 'default',
};

export interface ResourceDiffListProps {
  diff: GatewayDiff;
  /** Offers a checkbox on each change, so an apply can leave some out. */
  selectable?: boolean;
  /** The keys of the changes selected, when selectable. */
  selectedKeys?: ReadonlySet<string>;
  onToggle?: (key: string) => void;
}

/**
 * Lists what a diff changes, grouped by resource type. Unchanged resources are left out, unless the
 * gateway is set to leave them alone, and a deletion is marked so it stands out, since it removes
 * something from a running gateway. When selectable, each change has a checkbox, and one cleared is
 * shown as left out.
 */
export default function ResourceDiffList({
  diff,
  selectable = false,
  selectedKeys = undefined,
  onToggle = undefined,
}: ResourceDiffListProps): JSX.Element {
  const {t} = useTranslation();
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());

  const toggleShown = (key: string): void =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const groups = useMemo((): [string, ResourceChange[]][] => {
    const byType = new Map<string, ResourceChange[]>();
    (diff.changes ?? []).filter(isOffered).forEach((change: ResourceChange) => {
      byType.set(change.resourceType, [...(byType.get(change.resourceType) ?? []), change]);
    });
    return [...byType.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [diff]);

  const changeLabel = (change: ChangeType): string => {
    switch (change) {
      case 'added':
        return t('gateways:diff.added', 'Added');
      case 'updated':
        return t('gateways:diff.updated', 'Updated');
      case 'deleted':
        return t('gateways:diff.deleted', 'Deleted');
      default:
        return t('gateways:diff.unchanged', 'Unchanged');
    }
  };

  if (groups.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{py: 2}}>
        {t('gateways:diff.noChanges', 'Nothing would change. The gateway already holds this configuration.')}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {groups.map(([resourceType, changes]) => (
        <Box key={resourceType}>
          <Typography variant="subtitle2" sx={{mb: 1}}>
            {resourceType}
          </Typography>
          <Stack spacing={0.5}>
            {changes.map((change: ResourceChange) => {
              const leftOut = selectable ? !selectedKeys?.has(change.key) : Boolean(change.excluded);
              const label = change.name ?? change.id;
              const hasLines = (change.lines ?? []).length > 0;
              const isShown = shown.has(change.key);
              return (
                <Box key={change.key}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    data-change={change.change}
                    data-left-out={leftOut}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderLeft: 3,
                      borderLeftColor:
                        change.change === 'deleted' ? 'error.main' : `${CHANGE_COLORS[change.change]}.main`,
                      borderRadius: 1,
                      bgcolor: change.change === 'deleted' ? 'error.lighter' : 'action.hover',
                      opacity: leftOut ? 0.6 : 1,
                    }}
                  >
                    {selectable && (
                      <Checkbox
                        size="small"
                        checked={!leftOut}
                        onChange={() => onToggle?.(change.key)}
                        slotProps={{
                          input: {
                            'aria-label': t('gateways:diff.include', 'Include {{name}}', {
                              name: change.name ?? change.id,
                            }),
                          },
                        }}
                      />
                    )}
                    <Chip size="small" color={CHANGE_COLORS[change.change]} label={changeLabel(change.change)} />
                    {leftOut && <Chip size="small" variant="outlined" label={t('gateways:diff.leftOut', 'Left out')} />}
                    <Box sx={{minWidth: 0}}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          fontWeight: 500,
                          textDecoration: change.change === 'deleted' ? 'line-through' : 'none',
                        }}
                      >
                        {label}
                      </Typography>
                      {change.name && change.name !== change.id && (
                        <Typography variant="caption" color="text.secondary" sx={{fontFamily: 'monospace'}}>
                          {change.id}
                        </Typography>
                      )}
                    </Box>
                    {hasLines && (
                      <Button
                        size="small"
                        sx={{ml: 'auto', flexShrink: 0}}
                        endIcon={isShown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        aria-expanded={isShown}
                        aria-label={
                          isShown
                            ? t('gateways:diff.hideLines', 'Hide the changes to {{name}}', {name: label})
                            : t('gateways:diff.showLines', 'Show the changes to {{name}}', {name: label})
                        }
                        onClick={() => toggleShown(change.key)}
                      >
                        {isShown ? t('gateways:diff.hide', 'Hide changes') : t('gateways:diff.show', 'Show changes')}
                      </Button>
                    )}
                  </Stack>
                  {hasLines && (
                    <Collapse in={isShown} unmountOnExit>
                      <Box sx={{pt: 0.5, pl: 1.5}}>
                        <ChangeLines lines={change.lines ?? []} />
                      </Box>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
