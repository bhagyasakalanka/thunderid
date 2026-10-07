// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Reads a value held as a JSON list of strings, the form a list's variable takes. Anything else is
 * not a list.
 */
export function parseListValue(value: string): string[] | undefined {
  if (!value.trim().startsWith('[')) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Shows a list's value one item per line, for editing. */
export function toListText(value: string): string {
  return parseListValue(value)?.join('\n') ?? value;
}

/** Writes lines of text as the JSON list a list's variable holds, leaving out blank lines. */
export function fromListText(text: string): string {
  return JSON.stringify(
    text
      .split('\n')
      .map((line: string) => line.trim())
      .filter(Boolean),
  );
}

/**
 * Generates a secret: 32 bytes from the platform's secure random source, encoded as unpadded
 * base64url so it can be pasted anywhere.
 */
export function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** What a secret a gateway holds is shown as: its value is never read back. */
export const MASKED_SECRET = '******';

const VARIABLE_REFERENCE = /^var:([A-Za-z_][A-Za-z0-9_]*)$/;
const SECRET_REFERENCE = /^sec:([A-Za-z_][A-Za-z0-9_]*)$/;

/**
 * Puts in the values a gateway holds for the references a resource carries, the way the gateway's
 * import does: a `var:NAME` becomes the variable's value, and as a list's item a variable holding a
 * JSON list becomes its items; a `sec:NAME` the gateway holds is shown masked. A reference the
 * gateway does not hold is left as it is, so it shows what is missing.
 */
export function resolveReferences(
  value: unknown,
  variables: ReadonlyMap<string, string>,
  secrets: ReadonlySet<string>,
): unknown {
  if (typeof value === 'string') {
    const variable: string | undefined = VARIABLE_REFERENCE.exec(value)?.[1];
    if (variable !== undefined) {
      return variables.get(variable) ?? value;
    }
    const secret: string | undefined = SECRET_REFERENCE.exec(value)?.[1];
    return secret !== undefined && secrets.has(secret) ? MASKED_SECRET : value;
  }
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown) => {
      const variable: string | undefined = typeof item === 'string' ? VARIABLE_REFERENCE.exec(item)?.[1] : undefined;
      const held: string | undefined = variable !== undefined ? variables.get(variable) : undefined;
      const items: string[] | undefined = held !== undefined ? parseListValue(held) : undefined;
      return items ?? [resolveReferences(item, variables, secrets)];
    });
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]: [string, unknown]) => [key, resolveReferences(entry, variables, secrets)]),
    );
  }
  return value;
}
