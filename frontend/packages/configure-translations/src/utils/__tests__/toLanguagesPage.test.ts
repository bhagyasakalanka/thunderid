// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it} from 'vitest';
import toLanguagesPage from '../toLanguagesPage';

describe('toLanguagesPage', () => {
  it('lists the language of each applied translation', () => {
    expect(
      toLanguagesPage([
        {language: 'fr-FR', translations: {common: {hello: 'Bonjour'}}},
        {language: 'de-DE', translations: {}},
      ]),
    ).toEqual({languages: ['fr-FR', 'de-DE']});
  });

  it('returns no languages when the gateway runs no translations', () => {
    expect(toLanguagesPage([])).toEqual({languages: []});
  });
});
