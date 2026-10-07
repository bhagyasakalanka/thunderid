// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

export const SERVER_URL = 'https://localhost:8090';

export interface HttpCall {
  url: string;
  method: string;
  data?: unknown;
}

/** Answers by `METHOD path`, matching the path with or without its query. */
export function createHttpRouter(routes: Record<string, unknown>): (call: HttpCall) => Promise<unknown> {
  return (call: HttpCall): Promise<unknown> => {
    const path: string = call.url.replace(SERVER_URL, '');
    const route: unknown = routes[`${call.method} ${path}`] ?? routes[`${call.method} ${path.split('?')[0]}`];
    if (route === undefined) {
      return Promise.reject(new Error(`Unexpected request: ${call.method} ${path}`));
    }
    const data: unknown = typeof route === 'function' ? (route as (c: HttpCall) => unknown)(call) : route;
    return Promise.resolve({data});
  };
}
