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

/** How a configuration version came to exist. */
export type VersionOrigin = 'captured' | 'promoted' | 'reverted' | 'uploaded';

/** How a resource differs between two configuration versions. */
export type ChangeType = 'added' | 'updated' | 'deleted' | 'unchanged';

/** An environment in the promotion chain. */
export interface Environment {
  id: string;
  name: string;
  rank: number;
  appliedSeq: number;
  /**
   * Resource keys a user chose not to promote into this environment. The choice is remembered, so a
   * later promotion holds them back by default until they are deliberately selected again.
   */
  excluded?: string[];
  latestSeq: number;
  hasPendingChanges: boolean;
  /** Outgoing promotion edges, with the rank fallback already applied by the service. */
  promotesToResolved: string[];
  /** Incoming edges: the environments that can promote into this one. */
  promotedFrom: string[];
  /**
   * Whether this environment's Data Plane is currently connected. The Data Plane dials the Control
   * Plane and holds that connection open, so nothing can be applied or promoted to one that is not
   * connected.
   */
  dataPlane: DataPlaneStatus;
  createdAt: string;
  updatedAt: string;
}

/** Whether an environment's Data Plane is connected, and when it was last heard from. */
export interface DataPlaneStatus {
  connected: boolean;
  lastSeen?: string;
}

export interface EnvironmentListResponse {
  environments: Environment[];
}

/** A stored configuration snapshot for an environment. */
export interface Version {
  seq: number;
  envId: string;
  origin: VersionOrigin;
  parentSeq?: number;
  sourceEnvId?: string;
  sourceSeq?: number;
  note?: string;
  createdAt: string;
}

export interface VersionListResponse {
  versions: Version[];
}

/** One line of a unified diff. Kind is ' ' (context), '+' (added) or '-' (removed). */
export interface LineOp {
  kind: string;
  text: string;
}

/** How a single resource differs between two versions. */
export interface ResourceChange {
  key: string;
  type: string;
  id?: string;
  name?: string;
  category?: string;
  change: ChangeType;
  lines?: LineOp[];
}

export interface DiffSummary {
  added: number;
  updated: number;
  deleted: number;
  unchanged: number;
}

export interface Diff {
  changes: ResourceChange[];
  summary: DiffSummary;
}

export interface ImportOutcome {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  operation: string;
  status: string;
  message?: string;
}

/** The outcome of writing a bundle through the import API. */
export interface ImportResponse {
  summary?: {totalDocuments: number; imported: number; deleted?: number; failed: number};
  results?: ImportOutcome[];
}

export interface ApplyResult {
  targetSeq: number;
  diff: Diff;
  dryRun: boolean;
  import?: ImportResponse;
}

export interface PromoteResult {
  preview: Diff;
  newVersion: Version;
  /** The outcome of writing the configuration into the target's Control Plane tenant. */
  controlPlane?: ImportResponse;
  applied?: ApplyResult;
}

export interface RevertResult {
  preview: Diff;
  newVersion: Version;
  applied?: ApplyResult;
  /** The outcome of restoring the environment's own Control Plane tenant. */
  controlPlane?: ImportResponse;
}

/** How an environment's next apply would resolve its placeholders. */
export interface VariableStatus {
  envId: string;
  seq: number;
  required: string[];
  missing: string[];
  secretBacked: string[];
  /** Secret placeholders the Data Plane's secret service does not hold. */
  missingSecrets: string[];
  /** False when the secret service could not be consulted, so missingSecrets is not a judgement. */
  secretsChecked: boolean;
}

/** One environment's outcome from applying across every environment. */
export interface ApplyAllResult {
  envId: string;
  envName: string;
  applied?: ApplyResult;
  error?: string;
}

/**
 * How a credential has to be held on the Data Plane.
 *
 * A credential that is only ever checked against what a caller presents, such as an application's
 * client secret, is stored as a one-way hash and can never be read back. One the Data Plane replays to
 * a third party, such as an SMS gateway key, has to stay readable. This is decided by the configuration
 * that uses the credential, not by whoever sets it.
 */
export type SecretKind = 'hash' | 'value';

/** One secret-backed placeholder of an environment. */
export interface SecretEntry {
  name: string;
  /** The resource field it fills, e.g. clientSecret. */
  field?: string;
  resourceType?: string;
  resourceName?: string;
  kind: SecretKind;
  /** Whether the Data Plane's secret service holds it. Meaningless when the list's checked is false. */
  held: boolean;
}

/** Every credential an environment needs, with its status on the Data Plane. */
export interface SecretList {
  envId: string;
  seq: number;
  secrets: SecretEntry[];
  /** False when the secret service could not be reached, so held is not a judgement. */
  checked: boolean;
  /** Why it could not be reached. Usually this environment's own credentials or endpoint. */
  checkError?: string;
}

/** The result of regenerating a credential. The value is returned only here. */
export interface RegeneratedSecret {
  secret: SecretEntry;
  value: string;
}
