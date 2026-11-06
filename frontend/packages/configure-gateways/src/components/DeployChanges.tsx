// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Box, Checkbox, Chip, Collapse, Link, Stack, Typography} from '@wso2/oxygen-ui';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import ChangeFlags from './ChangeFlags';
import ChangeLines from './ChangeLines';
import type {Change, ChangeKind} from '../models/deploy';
import {changedFields, isShared} from '../utils/changeSummary';
import {humanize} from '../utils/groupByResource';

export interface DeployChangesProps {
  changes: Change[];
  /** The keys of the changes that will be applied. */
  selected: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (keys: string[], checked: boolean) => void;
  /** The environment the changes are applied to. */
  target: string;
  /** The environment the changes come from, on a promotion. */
  source?: string;
  /** The changes a selection brings along, each with the key of the selected change that needs it. */
  required?: ReadonlyMap<string, string>;
}

const COLORS: Readonly<Record<ChangeKind, 'success' | 'info' | 'error' | 'default'>> = {
  added: 'success',
  updated: 'info',
  deleted: 'error',
  unchanged: 'default',
};

/**
 * What a deploy writes, as the deploy drawer lists it: the project's own changes first, then the
 * resources the whole organization shares, which ship with every deploy. Each change is a row with its
 * kind, what it is and what changed, a checkbox to leave it out this time and its diff to open in place.
 */
export default function DeployChanges({
  changes,
  selected,
  onToggle,
  onToggleAll,
  target,
  source = undefined,
  required = undefined,
}: DeployChangesProps): JSX.Element {
  const {t} = useTranslation('deploy');
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const active = changes.filter((change: Change) => change.change !== 'unchanged');
  const unchanged = changes.length - active.length;
  const kinds: Readonly<Record<ChangeKind, string>> = {
    added: t('deployChanges.added', 'Added'),
    updated: t('deployChanges.modified', 'Modified'),
    deleted: t('deployChanges.removed', 'Removed'),
    unchanged: t('changes.unchanged', 'Unchanged'),
  };
  const nameOf = (key: string): string => {
    const change = changes.find((entry: Change) => entry.key === key);
    return change?.name ?? change?.id ?? key;
  };
  const toggleOpen = (key: string): void =>
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (active.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" data-testid="deploy-changes-none">
        {t('changes.noneAt', '{{target}} already runs this version as it is.', {target})}
      </Typography>
    );
  }

  const summary = (change: Change): string => {
    const type = t(`changes.types.${change.resourceType}`, {defaultValue: humanize(change.resourceType)});
    if (change.change === 'added') return t('deployChanges.new', '{{type}} · new', {type});
    if (change.change === 'deleted') return t('deployChanges.gone', '{{type}} · removed', {type});
    const fields = changedFields(change.lines);
    if (fields.length > 0) return `${type} · ${fields.join(', ')}`;
    if (change.valueChanged) return t('deployChanges.valueChanged', '{{type}} · a value it uses changed', {type});
    return type;
  };

  const row = (change: Change): JSX.Element => {
    const name = change.name ?? change.id ?? change.key;
    const hasLines = (change.lines ?? []).some((line) => line.kind !== ' ');
    const isOpen = open.has(change.key);
    return (
      <Box
        key={change.key}
        data-testid={`change-${change.key}`}
        sx={{border: 1, borderColor: 'divider', borderRadius: 2, px: 1.5, py: 1}}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Checkbox
            size="small"
            checked={!change.sourceExcluded && selected.has(change.key)}
            disabled={change.sourceExcluded}
            onChange={() => onToggle(change.key)}
            inputProps={{'aria-label': t('changes.selectOne', 'Write {{name}}', {name})}}
            sx={{p: 0.5}}
          />
          <Chip
            size="small"
            variant="outlined"
            color={COLORS[change.change]}
            label={kinds[change.change]}
            sx={{height: 20, fontSize: 11, minWidth: 72, flexShrink: 0}}
          />
          <Box sx={{flex: 1, minWidth: 0}}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div" noWrap>
              {summary(change)}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{flexWrap: 'wrap', rowGap: 0.5, '&:empty': {display: 'none'}}}>
              <ChangeFlags
                change={change}
                target={target}
                source={source}
                neededBy={required?.has(change.key) ? nameOf(required.get(change.key) ?? '') : undefined}
              />
            </Stack>
          </Box>
          {hasLines && (
            <Link
              component="button"
              type="button"
              variant="body2"
              underline="hover"
              aria-expanded={isOpen}
              aria-label={
                isOpen
                  ? t('diff.hideLabel', 'Hide the changes to {{name}}', {name})
                  : t('diff.showLabel', 'Show the changes to {{name}}', {name})
              }
              onClick={() => toggleOpen(change.key)}
              sx={{flexShrink: 0}}
            >
              {t('deployChanges.diff', 'Diff')}
            </Link>
          )}
        </Stack>
        {hasLines && (
          <Collapse in={isOpen} unmountOnExit>
            <Box sx={{pt: 1}}>
              <ChangeLines lines={change.lines ?? []} />
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  const section = (id: string, title: string, rows: Change[], note?: string): JSX.Element | null => {
    if (rows.length === 0) return null;
    const keys = rows.filter((change: Change) => !change.sourceExcluded).map((change: Change) => change.key);
    const allChecked = keys.length > 0 && keys.every((key: string) => selected.has(key));
    const someChecked = keys.some((key: string) => selected.has(key));
    return (
      <Stack spacing={1.25} component="section" aria-label={title} data-testid={`deploy-changes-${id}`}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Checkbox
            size="small"
            checked={allChecked}
            indeterminate={!allChecked && someChecked}
            onChange={(_event, checked: boolean) => onToggleAll(keys, checked)}
            inputProps={{'aria-label': t('deployChanges.selectAll', 'Write every one of {{title}}', {title})}}
            sx={{p: 0.5}}
          />
          <Typography variant="subtitle2">
            {t('deployChanges.title', '{{title}} · {{count}}', {title, count: rows.length})}
          </Typography>
        </Stack>
        {note && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{px: 1.5, py: 1, borderRadius: 1.5, bgcolor: 'action.hover'}}
          >
            {note}
          </Typography>
        )}
        {rows.map(row)}
      </Stack>
    );
  };

  return (
    <Stack spacing={3}>
      {section(
        'project',
        t('deployChanges.changes', 'Changes'),
        active.filter((change: Change) => !isShared(change)),
      )}
      {section(
        'shared',
        t('deployChanges.shared', 'Shared resources'),
        active.filter(isShared),
        t(
          'deployChanges.sharedNote',
          'Organization resources ship with the deploy, so every environment runs the same flows, connections and branding.',
        ),
      )}
      {unchanged > 0 && (
        <Typography variant="caption" color="text.secondary">
          {t('changes.unchangedCount', '{{count}} resources are already as the version has them.', {count: unchanged})}
        </Typography>
      )}
    </Stack>
  );
}
