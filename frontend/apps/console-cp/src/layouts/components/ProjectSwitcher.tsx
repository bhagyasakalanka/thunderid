// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {Project} from '@thunderid/configure-gateways';
import {Box, Button, ComplexSelect, IconButton, Menu, MenuItem, Tooltip} from '@wso2/oxygen-ui';
import {ChevronRight, X} from '@wso2/oxygen-ui-icons-react';
import {useEffect, useRef, useState, type MouseEvent, type ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import {useLocation, useNavigate} from 'react-router';
import type {PickProjectState} from '../../components/InProject';
import RouteConfig from '../../configs/RouteConfig';
import useProjectSelection from '../../hooks/useProjectSelection';

/**
 * The header's project selector. At the organization level it is an entry that opens the list of
 * projects; choosing one selects it, so the console lists and creates that project's applications and
 * agents and deploys it alone, and opens its gateways. While a project is selected it names the
 * project, switches to another, and leaves the project for the organization. It is hidden while there
 * are no projects.
 */
export default function ProjectSwitcher(): ReactNode {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {projects, selected, select} = useProjectSelection();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const entry = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  // A project's page reached at the organization level, such as creating an application, comes home
  // asking for a project: the list opens to pick one.
  const asked = (location.state as Partial<PickProjectState> | null)?.pickProject === true;
  useEffect(() => {
    if (!asked || selected || !entry.current) return;
    setAnchor(entry.current);
    void navigate(location.pathname, {replace: true, state: null});
  }, [asked, selected, navigate, location.pathname, projects.length]);

  if (projects.length === 0) {
    return null;
  }

  const open = (id: string): void => {
    setAnchor(null);
    select(id);
    void navigate(RouteConfig.projects.home(id));
  };
  const leave = (): void => {
    select('');
    void navigate(RouteConfig.home.list());
  };

  if (!selected) {
    return (
      <>
        <Button
          ref={entry}
          variant="text"
          size="small"
          endIcon={<ChevronRight size={16} />}
          onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
          aria-label={t('common:header.openProject', 'Open a project')}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          sx={{mr: 1}}
          data-testid="project-switcher"
        >
          {t('common:header.projects', 'Projects')}
        </Button>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          {projects.map((project: Project) => (
            <MenuItem key={project.id} onClick={() => open(project.id)}>
              {project.displayName}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  return (
    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, mr: 1}} data-testid="project-switcher">
      <ComplexSelect
        value={selected.id}
        size="small"
        sx={{minWidth: 160}}
        inputProps={{'aria-label': t('common:header.project', 'Project')}}
        onChange={(event) => open(String(event.target.value))}
        renderValue={() => <ComplexSelect.MenuItem.Text primary={selected.displayName} />}
      >
        {projects.map((project: Project) => (
          <ComplexSelect.MenuItem key={project.id} value={project.id}>
            <ComplexSelect.MenuItem.Text primary={project.displayName} />
          </ComplexSelect.MenuItem>
        ))}
      </ComplexSelect>
      <Tooltip title={t('common:header.leaveProject', 'Leave project {{name}}', {name: selected.displayName})}>
        <IconButton
          size="small"
          onClick={leave}
          aria-label={t('common:header.leaveProject', 'Leave project {{name}}', {name: selected.displayName})}
          data-testid="project-leave"
        >
          <X size={16} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
