// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {VCListResponse, VerifiableCredential, VerifiableCredentialSummary} from '../models/vc';

/**
 * Builds the credential template list from the credential configurations a gateway applied, each in
 * its GET-by-id shape. The list is paged client side, as the live list is.
 */
export default function toCredentialsPage(resources: unknown[]): VCListResponse {
  return (resources as VerifiableCredential[]).map(
    (credential: VerifiableCredential): VerifiableCredentialSummary => ({
      id: credential.id,
      handle: credential.handle,
      ouId: credential.ouId,
      ouHandle: credential.ouHandle,
      format: credential.format,
      vct: credential.vct,
      name: credential.name,
    }),
  );
}
