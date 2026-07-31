/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// The Control Plane console reuses the Data Plane console's source in full. Its own source is only
// a thin bootstrap (src/main.tsx); everything else (App, routes, layouts, features) is compiled from
// ../console/src via the aliases below. The runtime difference is public/config.js (plane: 'cp'),
// which drives the plane-aware navigation gating in DashboardLayout.

import {readFileSync, copyFileSync, existsSync, writeFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {codecovVitePlugin} from '@codecov/vite-plugin';
import babel from '@rolldown/plugin-babel';
import {prismjsInjectCore} from '@thunderid/build-plugins/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react, {reactCompilerPreset} from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import {defineConfig} from 'vite';

const currentDir = dirname(fileURLToPath(import.meta.url));
const consoleSrc = resolve(currentDir, '..', 'console', 'src');
const PORT = process.env.PORT ? Number(process.env.PORT) : 5192;
const HOST = process.env.HOST ?? 'localhost';
const BASE_URL = process.env.BASE_URL ?? '/console';

// Copy version.txt from monorepo root into public/ so it is served at runtime and included in the
// build output, then read the local copy for the build constant. Falls back to v0.0.0 when missing.
const rootVersionFile = resolve(currentDir, '../../../version.txt');
const publicVersionFile = resolve(currentDir, 'public', 'version.txt');

if (existsSync(rootVersionFile)) {
  copyFileSync(rootVersionFile, publicVersionFile);
} else {
  writeFileSync(publicVersionFile, 'v0.0.0');
}

const VERSION = readFileSync(publicVersionFile, 'utf-8').trim();
const BUNDLE_ANALYSIS_ENABLED = process.env.CODECOV_BUNDLE_UPLOAD === 'true';

const DEV_SERVER_URL = process.env.THUNDERID_DEV_SERVER_URL?.trim();
const DEV_GATE_URL = process.env.THUNDERID_DEV_GATE_URL?.trim();

// https://vite.dev/config/
export default defineConfig(({command}) => ({
  base: BASE_URL,
  define: {
    VERSION: JSON.stringify(VERSION),
    ANALYZER_ENABLED: JSON.stringify(false),
    __DEV_SERVER_URL__: JSON.stringify(
      command === 'serve'
        ? DEV_SERVER_URL && DEV_SERVER_URL.length > 0
          ? DEV_SERVER_URL
          : 'https://localhost:8090'
        : '',
    ),
    __DEV_GATE_URL__: JSON.stringify(
      command === 'serve' ? (DEV_GATE_URL && DEV_GATE_URL.length > 0 ? DEV_GATE_URL : 'https://localhost:5190') : '',
    ),
  },
  plugins: [
    prismjsInjectCore(),
    basicSsl(),
    svgr(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    codecovVitePlugin({
      enableBundleAnalysis: BUNDLE_ANALYSIS_ENABLED,
      bundleName: 'cp-console',
      gitService: 'github',
    }),
  ],
  optimizeDeps: {
    include: ['lodash-es'],
  },
  server: {
    port: PORT,
    host: HOST,
  },
  resolve: {
    alias: {
      // Reuse the Data Plane console's source in full.
      '@console': consoleSrc,
      '@': consoleSrc,
      '@/components': resolve(consoleSrc, 'components'),
      '@/layouts': resolve(consoleSrc, 'layouts'),
      '@/theme': resolve(consoleSrc, 'theme'),
      '@/contexts': resolve(consoleSrc, 'contexts'),
      '@/lib': resolve(consoleSrc, 'lib'),
      '@/hooks': resolve(consoleSrc, 'hooks'),
      '@/types': resolve(consoleSrc, 'types'),
      // Force a single React instance to avoid "Invalid hook call" with linked packages.
      react: resolve(currentDir, './node_modules/react'),
      'react-dom': resolve(currentDir, './node_modules/react-dom'),
      'react-router': resolve(currentDir, './node_modules/react-router'),
    },
    conditions: ['browser', 'module', 'import', 'default'],
  },
}));
