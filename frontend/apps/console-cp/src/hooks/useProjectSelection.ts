// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useProjects, type Project} from '@thunderid/configure-gateways';
import {useCallback, useSyncExternalStore} from 'react';

/** Where the selection is remembered, so it survives a reload and every layout mount. */
export const PROJECT_SELECTION_STORAGE_KEY = 'thunderid.console-cp.selectedProject';

let fallback: string | null = null;
const listeners = new Set<() => void>();

function readSelection(): string | null {
  try {
    return localStorage.getItem(PROJECT_SELECTION_STORAGE_KEY);
  } catch {
    return fallback;
  }
}

function writeSelection(value: string): void {
  fallback = value;
  try {
    localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable (a private window, blocked site data); the in-memory value still applies.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Forgets the remembered project, so the console starts across the organization. It is called as the
 * console starts, which is also after a sign-in; a project's own URL selects its project again.
 */
export function forgetProjectSelection(): void {
  writeSelection('');
}

/** Selects a project by id without reading the project list, such as for a page whose URL names it. */
export function selectProject(id: string): void {
  if (readSelection() !== id) writeSelection(id);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The id of the selected project as it is remembered, or undefined while the console works across the
 * organization. It needs no project list, so it can scope every route, signed in or not.
 */
export function useSelectedProjectId(): string | undefined {
  // An empty selection is the organization, as no selection is.
  const stored = useSyncExternalStore(subscribe, readSelection, () => null);
  if (!stored) return undefined;
  return stored;
}

export interface ProjectSelection {
  /** The projects that can be selected. */
  projects: Project[];
  /** The selected project, or undefined while the console works across the organization. */
  selected: Project | undefined;
  /** Selects a project by id, or the whole organization with an empty id. */
  select: (id: string) => void;
  /** Set once the projects are read and the remembered project is not among them, such as a deleted one. */
  stale: boolean;
  /**
   * Forgets the remembered project while it is still the stale one. A project selected since, such as by
   * opening its page, is kept.
   */
  clearStale: () => void;
}

/**
 * The project the console is working in. The header switcher, the sidebar and a project's pages read
 * it, and the selection is shared between them without a provider. Until a project is selected, the
 * console works across the organization.
 */
export default function useProjectSelection(): ProjectSelection {
  const {data: projects = [], isSuccess} = useProjects();
  const stored = useSyncExternalStore(subscribe, readSelection, () => null);
  const selected = stored ? projects.find((project: Project) => project.id === stored) : undefined;
  const select = useCallback((id: string) => writeSelection(id), []);
  const stale = Boolean(stored) && isSuccess && !selected;
  const clearStale = useCallback(() => {
    if (stale && readSelection() === stored) writeSelection('');
  }, [stale, stored]);
  return {projects, selected, select, stale, clearStale};
}
