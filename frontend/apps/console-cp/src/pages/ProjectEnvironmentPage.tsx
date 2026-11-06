// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {EnvironmentPage, type EnvironmentSection} from '@thunderid/configure-gateways';
import type {JSX} from 'react';
import RouteProjectScope from '../components/RouteProjectScope';

/** A section of an environment's own pages within a project: what it shows is the project's. */
export default function ProjectEnvironmentPage({section = 'overview'}: {section?: EnvironmentSection}): JSX.Element {
  return (
    <RouteProjectScope>
      <EnvironmentPage section={section} />
    </RouteProjectScope>
  );
}
