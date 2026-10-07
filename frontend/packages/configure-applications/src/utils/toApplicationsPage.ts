// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {Application, BasicApplication} from '../models/application';
import type {ApplicationListResponse} from '../models/responses';

/**
 * Builds the applications list page from the applications a gateway runs, each in its GET-by-id
 * shape, with the same paging the live list read applies on the server.
 *
 * @param resources - The applications the gateway runs
 * @param limit - Maximum number of applications on the page
 * @param offset - Number of applications skipped before the page
 * @returns The page, in the live list read's shape
 */
export default function toApplicationsPage(resources: unknown[], limit = 30, offset = 0): ApplicationListResponse {
  const applications: BasicApplication[] = (resources as Application[]).map(
    (application: Application): BasicApplication => ({
      id: application.id,
      name: application.name,
      description: application.description,
      logoUrl: application.logoUrl,
      authFlowId: application.authFlowId,
      registrationFlowId: application.registrationFlowId,
      isRegistrationFlowEnabled: application.isRegistrationFlowEnabled,
      type: application.type,
      template: application.template,
      isReadOnly: application.isReadOnly,
      clientId: application.inboundAuthConfig?.find((config) => config.config?.clientId)?.config.clientId,
    }),
  );
  const page: BasicApplication[] = applications.slice(offset, offset + limit);
  return {totalResults: applications.length, count: page.length, applications: page};
}
