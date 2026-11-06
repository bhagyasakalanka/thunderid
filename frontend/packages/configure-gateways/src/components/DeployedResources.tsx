// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@wso2/oxygen-ui';
import {ChevronDown} from '@wso2/oxygen-ui-icons-react';
import {useMemo, useState, type JSX, type ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import {laneOfType} from '../explorer/model';
import useChangeName from '../hooks/useChangeName';
import type {Change} from '../models/deploy';
import {humanize} from '../utils/groupByResource';

/** How a resource stands on an environment against what it is compared with. */
export type ResourceState = 'refused' | 'newer' | 'notDeployed' | 'removed' | 'inSync';

/** The states that need someone to act: what is refused, behind or not there yet. */
const ATTENTION: ReadonlySet<ResourceState> = new Set(['refused', 'newer', 'notDeployed']);

/** How many rows a group shows before it offers the rest. */
const PAGE = 10;

/** Above how many resources a search box is offered. */
const SEARCH_FROM = 10;

type Filter = 'all' | 'attention' | 'inSync';

/** How a change stands: the state of the resource it names. */
function stateOf(change: Change): ResourceState {
  if (change.failed) return 'refused';
  if (change.change === 'unchanged') return 'inSync';
  if (change.change === 'added') return 'notDeployed';
  if (change.change === 'deleted') return 'removed';
  return 'newer';
}

export interface DeployedResourcesProps {
  /** The resources, as a deploy's check of the environment names them. */
  changes: Change[];
  /** Whether a resource is shared rather than the project's own; shared ones are grouped apart. */
  isShared?: (change: Change) => boolean;
  /** The version the environment runs a resource from, as a label. */
  runningOf: (change: Change) => string | undefined;
  /** Why the environment refused a resource, when it did. */
  reasonOf: (change: Change) => string | undefined;
  /** What can be done with a resource, such as editing or deploying it. */
  actionOf: (change: Change) => ReactNode;
}

interface Group {
  key: string;
  title: string;
  changes: Change[];
}

/**
 * What an environment runs, resource by resource, in a form that scales: counts that filter, groups by
 * kind that open where something needs attention, a search when there are many, and long groups shown
 * a page at a time.
 */
export default function DeployedResources({
  changes,
  isShared = () => false,
  runningOf,
  reasonOf,
  actionOf,
}: DeployedResourcesProps): JSX.Element {
  const {t} = useTranslation('deploy');
  const nameOfChange = useChangeName();
  const attention = changes.filter((change: Change) => ATTENTION.has(stateOf(change))).length;
  const inSync = changes.filter((change: Change) => stateOf(change) === 'inSync').length;
  const [filter, setFilter] = useState<Filter>(attention > 0 ? 'attention' : 'all');
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState<Record<string, number>>({});

  const stateLabel: Record<ResourceState, string> = {
    refused: t('environment.statusRefusedBare', 'Refused'),
    newer: t('environment.statusNewer', 'Newer version not deployed'),
    notDeployed: t('environment.statusNotDeployed', 'Not deployed yet'),
    removed: t('environment.statusRemoved', 'Removed from the configuration'),
    inSync: t('environment.statusInSync', 'In sync'),
  };
  const tone: Record<ResourceState, 'error' | 'warning' | 'default' | 'success'> = {
    refused: 'error',
    newer: 'warning',
    notDeployed: 'default',
    removed: 'warning',
    inSync: 'success',
  };

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return changes.filter((change: Change) => {
      const state = stateOf(change);
      if (filter === 'attention' && !ATTENTION.has(state)) return false;
      if (filter === 'inSync' && state !== 'inSync') return false;
      return !needle || nameOfChange(change).toLowerCase().includes(needle);
    });
  }, [changes, filter, search, nameOfChange]);

  const groupsOf = (list: Change[]): Group[] => {
    const groups = new Map<string, Group>();
    list.forEach((change: Change) => {
      const lane = laneOfType(change.resourceType);
      const key = lane?.id ?? change.resourceType;
      const title = lane ? t(lane.title[0].replace(/^deploy:/, ''), lane.title[1]) : humanize(change.resourceType);
      const group = groups.get(key) ?? {key, title, changes: []};
      group.changes.push(change);
      groups.set(key, group);
    });
    return [...groups.values()];
  };

  const summaryOf = (list: Change[]): string => {
    const counts: Partial<Record<ResourceState, number>> = {};
    list.forEach((change: Change) => {
      const state = stateOf(change);
      if (state !== 'inSync') counts[state] = (counts[state] ?? 0) + 1;
    });
    const parts: string[] = [];
    if (counts.notDeployed)
      parts.push(t('environment.countNotDeployed', '{{count}} not deployed', {count: counts.notDeployed}));
    if (counts.newer) parts.push(t('environment.countNewer', '{{count}} behind', {count: counts.newer}));
    if (counts.refused) parts.push(t('environment.countRefused', '{{count}} refused', {count: counts.refused}));
    if (counts.removed) parts.push(t('environment.countRemoved', '{{count}} removed', {count: counts.removed}));
    return parts.length > 0 ? parts.join(', ') : t('environment.statusInSync', 'In sync');
  };

  const row = (change: Change): JSX.Element => {
    const state = stateOf(change);
    const reason = state === 'refused' ? reasonOf(change) : undefined;
    return (
      <Stack
        key={change.key}
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{py: 1, borderBottom: 1, borderColor: 'divider', '&:last-of-type': {borderBottom: 0}}}
        data-testid={`environment-resource-${change.key}`}
      >
        <Box sx={{flex: 1, minWidth: 0}}>
          <Typography variant="body2" noWrap>
            {nameOfChange(change)}
          </Typography>
          {reason && (
            <Tooltip title={reason}>
              <Typography variant="caption" color="error.main" noWrap component="div">
                {reason}
              </Typography>
            </Tooltip>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{width: 96, flexShrink: 0}}>
          {runningOf(change) ?? t('environment.notRunning', 'Not running')}
        </Typography>
        <Box sx={{width: 200, flexShrink: 0}}>
          <Chip size="small" variant="outlined" color={tone[state]} label={stateLabel[state]} />
        </Box>
        <Box sx={{width: 170, flexShrink: 0, textAlign: 'right'}}>{actionOf(change)}</Box>
      </Stack>
    );
  };

  const group = (entry: Group): JSX.Element => {
    const limit = shown[entry.key] ?? PAGE;
    const rest = entry.changes.length - limit;
    return (
      <Accordion
        key={entry.key}
        disableGutters
        variant="outlined"
        defaultExpanded={entry.changes.some((change: Change) => ATTENTION.has(stateOf(change)))}
        data-testid={`environment-group-${entry.key}`}
      >
        <AccordionSummary expandIcon={<ChevronDown size={16} />}>
          <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{flex: 1, flexWrap: 'wrap'}}>
            <Typography variant="subtitle2">
              {t('environment.groupTitle', '{{title}} · {{count}}', {title: entry.title, count: entry.changes.length})}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summaryOf(entry.changes)}
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {entry.changes.slice(0, limit).map(row)}
          {rest > 0 && (
            <Button size="small" onClick={() => setShown({...shown, [entry.key]: limit + PAGE})}>
              {t('environment.showMore', 'Show {{count}} more', {count: rest})}
            </Button>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  const own = groupsOf(visible.filter((change: Change) => !isShared(change)));
  const shared = groupsOf(visible.filter(isShared));
  const filters: [Filter, string, number][] = [
    ['all', t('environment.filterAll', 'All'), changes.length],
    ['attention', t('environment.filterAttention', 'Needs attention'), attention],
    ['inSync', t('environment.filterInSync', 'In sync'), inSync],
  ];

  return (
    <Stack spacing={2} data-testid="environment-resources">
      <Stack direction="row" spacing={1} sx={{flexWrap: 'wrap', rowGap: 1}} alignItems="center">
        {filters.map(([key, name, count]) => (
          <Chip
            key={key}
            label={`${name} · ${count}`}
            color={filter === key ? 'primary' : 'default'}
            variant={filter === key ? 'filled' : 'outlined'}
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            data-testid={`environment-filter-${key}`}
          />
        ))}
        {changes.length > SEARCH_FROM && (
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('environment.search', 'Search by name')}
            inputProps={{'aria-label': t('environment.search', 'Search by name')}}
            sx={{ml: 'auto', minWidth: 220}}
            data-testid="environment-search"
          />
        )}
      </Stack>
      {visible.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {t('environment.noneMatch', 'No resource matches.')}
        </Typography>
      )}
      <Stack spacing={1}>{own.map(group)}</Stack>
      {shared.length > 0 && (
        <Accordion
          disableGutters
          variant="outlined"
          defaultExpanded={visible.some((change: Change) => isShared(change) && ATTENTION.has(stateOf(change)))}
          data-testid="environment-group-shared"
        >
          <AccordionSummary expandIcon={<ChevronDown size={16} />}>
            <Typography variant="overline" color="text.secondary">
              {t('environment.shared', 'Shared')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>{shared.map(group)}</Stack>
          </AccordionDetails>
        </Accordion>
      )}
    </Stack>
  );
}
