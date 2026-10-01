// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useCallback, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import useGetConfigurationVersions from '../api/useGetConfigurationVersions';
import type {ConfigurationVersion} from '../models/gateway';
import shortHash from '../utils/shortHash';

/**
 * Says how a version is shown: its name and the first characters of its hash, or the hash alone when it
 * has no name. A version known only by its hash takes its name from the captured versions.
 */
export default function useVersionLabel(): (
  version: string | Pick<ConfigurationVersion, 'version' | 'name'>,
) => string {
  const {t} = useTranslation();
  const {data: versions} = useGetConfigurationVersions();
  const names = useMemo(
    () => new Map((versions ?? []).map((version: ConfigurationVersion) => [version.version, version.name])),
    [versions],
  );

  return useCallback(
    (version: string | Pick<ConfigurationVersion, 'version' | 'name'>): string => {
      const hash = typeof version === 'string' ? version : version.version;
      const name = (typeof version === 'string' ? undefined : version.name) ?? names.get(hash);
      return name
        ? t('gateways:versions.label', '{{name}} · {{hash}}', {name, hash: shortHash(hash)})
        : shortHash(hash);
    },
    [t, names],
  );
}
