// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Control plane console runtime configuration.
//   - plane: 'cp'    : authoring surface. The layout leaves out what a control plane does not serve.
//   - server         : management API base. Left unset, every call is same-origin, so the console
//                      works on whichever host the server answers to and needs no CORS allowance.
//   - trusted_issuer : optional external issuer, when tokens come from somewhere other than this
//                      server. A control plane serves no runtime of its own, so this is how it is
//                      signed in to.
window.__THUNDERID_RUNTIME_CONFIG__ = {
  plane: 'cp',
  brand: {
    product_name: 'ThunderID',
    documentation: {
      baseUrl: 'https://thunderid.dev/docs/next',
      releasesUrl: 'https://thunderid.dev/data/releases.json',
    },
    favicon: {
      light: 'assets/images/favicon.ico',
      dark: 'assets/images/favicon-inverted.ico',
    },
  },
  client: {
    base: '/console',
    client_id: 'CONSOLE',
    // A scope names the instance it grants against, so the system scopes carry the same prefix as
    // security.system_permission_prefix in the control plane's deployment.yaml. A bare "system"
    // from an external issuer would not satisfy the permissions this plane checks.
    scopes: ['openid', 'profile', 'email', 'ou', 'system'],
  },
  server: {},
  // Uncomment to sign in through an external issuer instead of this server.
  // trusted_issuer: {
  //   type: 'generic',
  //   public_url: 'https://issuer.example.com/oauth2/token',
  //   client_id: 'CONSOLE',
  //   scopes: ['openid', 'profile', 'email'],
  // },
};
