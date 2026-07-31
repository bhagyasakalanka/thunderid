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

import {useConfig} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import {useEffect, type JSX} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {isControlPlane, usePlane} from '../../../lib/plane';
import getWelcomeDismissedStorageKey from '../utils/getWelcomeDismissedStorageKey';

export default function WelcomeRedirect(): JSX.Element | null {
  const {isSignedIn} = useThunderID();
  const {config} = useConfig();
  const plane = usePlane();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // The onboarding/welcome flow is a Data Plane runtime concern; the Control Plane authoring
    // console never auto-redirects into it (and PlaneRouteGuard blocks direct navigation there).
    if (!isSignedIn || isControlPlane(plane) || location.pathname.startsWith('/welcome')) return;

    const productName = config.brand.product_name;
    const dismissed = sessionStorage.getItem(getWelcomeDismissedStorageKey(productName)) === 'true';

    if (!dismissed) {
      sessionStorage.setItem(getWelcomeDismissedStorageKey(productName), 'true');
      void navigate('/welcome', {replace: true});
    }
  }, [isSignedIn, plane, navigate, config.brand.product_name, location.pathname]);

  return null;
}
