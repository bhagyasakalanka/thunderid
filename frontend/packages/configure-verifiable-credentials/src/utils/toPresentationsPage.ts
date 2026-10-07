// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {VPListResponse, VerifiablePresentation, VerifiablePresentationSummary} from '../models/vp';

/**
 * Builds the presentation definition list from the presentation definitions a gateway applied, each
 * in its GET-by-id shape. The list is paged client side, as the live list is.
 */
export default function toPresentationsPage(resources: unknown[]): VPListResponse {
  return (resources as VerifiablePresentation[]).map(
    (presentation: VerifiablePresentation): VerifiablePresentationSummary => ({
      id: presentation.id,
      handle: presentation.handle,
      ouId: presentation.ouId,
      ouHandle: presentation.ouHandle,
      name: presentation.name,
      vct: presentation.vct,
      format: presentation.format,
    }),
  );
}
