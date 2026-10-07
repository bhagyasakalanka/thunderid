// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {LanguagesResponse, TranslationsResponse} from '@thunderid/i18n';

/**
 * Builds the language list from the translations a gateway applied, one per language, each in its
 * GET-by-id shape. The list is paged client side, as the live list is.
 */
export default function toLanguagesPage(resources: unknown[]): LanguagesResponse {
  return {languages: (resources as TranslationsResponse[]).map((translation) => translation.language)};
}
