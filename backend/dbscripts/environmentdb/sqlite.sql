-- ----------------------------------------------------------------------------
-- Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
--
-- WSO2 LLC. licenses this file to you under the Apache License,
-- Version 2.0 (the "License"); you may not use this file except
-- in compliance with the License.
-- You may obtain a copy of the License at
--
-- http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied. See the License for the
-- specific language governing permissions and limitations
-- under the License.
-- ----------------------------------------------------------------------------

-- The environment manager's own datasource. Only a Control Plane has one: no other plane promotes
-- configuration, so no other plane runs an environment manager.
--
-- DEPLOYMENT_ID here is the organization, not one of its environments. A deployment id names an
-- environment as "<org>:<env>", and promotion compares one environment against another, so the whole
-- chain an organization promotes through has to sit in one partition.

-- Environments configuration is promoted through, one row per environment.
--
-- DATA is the environment document. Nothing queries inside it: an organization has a handful of
-- environments, they are read as a set, and ordering and rank are resolved in the server.
CREATE TABLE "ENVIRONMENT" (
    DEPLOYMENT_ID VARCHAR(255) NOT NULL,
    ID            VARCHAR(36)  NOT NULL,
    DATA          TEXT         NOT NULL,
    CREATED_AT    TEXT         DEFAULT (datetime('now')),
    UPDATED_AT    TEXT         DEFAULT (datetime('now')),
    PRIMARY KEY (DEPLOYMENT_ID, ID)
);

-- Configuration versions captured from an environment, which promotion compares and applies.
--
-- SEQ is assigned per environment and rises by one, so (DEPLOYMENT_ID, ENV_ID, SEQ) both identifies
-- a version and orders the history. Deleting an environment takes its versions with it.
CREATE TABLE "ENVIRONMENT_VERSION" (
    DEPLOYMENT_ID VARCHAR(255) NOT NULL,
    ENV_ID        VARCHAR(36)  NOT NULL,
    SEQ           INTEGER      NOT NULL,
    DATA          TEXT         NOT NULL,
    CREATED_AT    TEXT         DEFAULT (datetime('now')),
    PRIMARY KEY (DEPLOYMENT_ID, ENV_ID, SEQ),
    CONSTRAINT fk_environment_version_environment
        FOREIGN KEY (DEPLOYMENT_ID, ENV_ID) REFERENCES "ENVIRONMENT" (DEPLOYMENT_ID, ID)
        ON DELETE CASCADE
);

-- Deployment-scoped non-secret environment variables. KEY is the declarative placeholder the value
-- resolves (e.g. MY_APP_REDIRECT_URL); VALUE is stored in plaintext because it carries no
-- confidential material.
CREATE TABLE "ENVIRONMENT_VARIABLE" (
    DEPLOYMENT_ID VARCHAR(255) NOT NULL,
    ID            VARCHAR(36)  PRIMARY KEY,
    KEY           VARCHAR(255) NOT NULL,
    VALUE         TEXT         NOT NULL,
    DESCRIPTION   VARCHAR(255),
    CREATED_AT    TEXT         DEFAULT (datetime('now')),
    UPDATED_AT    TEXT         DEFAULT (datetime('now')),
    CONSTRAINT unique_environment_variable_key UNIQUE (DEPLOYMENT_ID, KEY)
);

CREATE INDEX idx_environment_variable_deployment ON "ENVIRONMENT_VARIABLE" (DEPLOYMENT_ID);
