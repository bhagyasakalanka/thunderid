#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
#
# WSO2 LLC. licenses this file to you under the Apache License,
# Version 2.0 (the "License"); you may not use this file except
# in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied. See the License for the
# specific language governing permissions and limitations
# under the License.
# ----------------------------------------------------------------------------

# Provisioning steps shared by setup-control-plane.sh and setup-data-plane.sh.
#
# Sourced, not executed. These run once, from outside the deployment: from an operator's machine or a
# platform task, against an unpacked ThunderID distribution and the deployment's database. They are
# not part of the image.
#
# Every function is safe to run again, so a re-run after a failure part way through picks up where it
# left off rather than failing on what is already there.
#
# deployment.yaml is read and never written. It is the deployment's own configuration, and a
# provisioning step that rewrote it would discard what was deployed.

set -euo pipefail

log()  { echo "==> $*"; }
skip() { echo "    (already done) $*"; }
warn() { echo "WARNING: $*" >&2; }
die()  { echo "ERROR: $*" >&2; exit 1; }

# An unpacked ThunderID distribution to provision from: the directory holding the binary, setup.sh,
# dbscripts/ and this deployment's deployment.yaml. Set THUNDERID_HOME, or pass --home.
#
# The distribution supplies the tools; the deployment.yaml in it decides what is provisioned and
# where. Point it at a copy holding the configuration of the deployment being provisioned.
resolve_home() {
    local home="${THUNDERID_HOME:-}"
    while [ $# -gt 0 ]; do
        case "$1" in
            --home) home="${2:-}"; shift 2 ;;
            *) die "unknown argument: $1" ;;
        esac
    done

    [ -n "$home" ] || die "set THUNDERID_HOME, or pass --home PATH, to an unpacked ThunderID
distribution holding this deployment's deployment.yaml."
    [ -d "$home" ] || die "no such directory: $home"

    SERVER_HOME="$(cd "$home" && pwd)"
    CONFIG_FILE="$SERVER_HOME/deployment.yaml"
    DB_SCRIPTS="$SERVER_HOME/dbscripts"

    [ -x "$SERVER_HOME/thunderid" ] || die "$SERVER_HOME holds no thunderid binary.
Unpack the distribution for the plane being provisioned, and run this against that."
    [ -d "$DB_SCRIPTS" ] || die "$SERVER_HOME holds no dbscripts directory."
}

# The four datasources, each with the directory its schema lives in and the environment variable
# carrying its password. The names match the Helm chart's, so one set of secrets serves both.
DATASOURCES="config:configdb:DB_CONFIG_PASSWORD
runtime_transient:runtime-transient:DB_RUNTIME_TRANSIENT_PASSWORD
entity:entitydb:DB_ENTITY_PASSWORD
runtime_persistent:runtime-persistent:DB_RUNTIME_PERSISTENT_PASSWORD"

# yaml_get prints the scalar at a dotted path in deployment.yaml, or nothing when it is absent.
#
# This handles the plain nested mappings this file uses and nothing more; it is not a YAML parser.
# It is enough because only structural values are read here. Secrets are not: in a cluster they are
# template placeholders in this file, resolved from the environment by the server at startup, so
# reading a password from here would yield the placeholder rather than the password.
yaml_get() {
    local path="$1"
    awk -v want="$path" '
        { line = $0; sub(/#.*/, "", line) }
        line ~ /^[[:space:]]*$/ { next }
        line ~ /^[[:space:]]*-/ { next }          # list entries hold nothing this reads
        {
            match(line, /^ */); depth = int(RLENGTH / 2)
            key = line; sub(/^ */, "", key)
            val = ""
            if (match(key, /:/)) {
                val = substr(key, RSTART + 1)
                key = substr(key, 1, RSTART - 1)
            }
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
            gsub(/^"|"$/, "", val)
            stack[depth] = key
            for (i = depth + 1; i in stack; i++) delete stack[i]
            full = stack[0]
            for (i = 1; i <= depth; i++) full = full "." stack[i]
            if (full == want) { print val; exit }
        }
    ' "$CONFIG_FILE"
}

# require_config fails unless the deployment has a configuration to be provisioned against.
require_config() {
    [ -f "$CONFIG_FILE" ] || die "no deployment.yaml at $CONFIG_FILE.
Mount this deployment's configuration there before provisioning. This script never writes it."
    log "Configuration: $CONFIG_FILE (read only)"
}

# expect_mode fails when the configuration is for a different plane than the script provisioning it,
# which would otherwise provision the wrong baseline against the right database.
expect_mode() {
    local want="$1" have
    have="$(yaml_get server.mode)"
    [ -n "$have" ] || die "server.mode is not set in $CONFIG_FILE (expected \"$want\")."
    [ "$have" = "$want" ] || die "server.mode is \"$have\" but this script provisions a \"$want\".
Run setup-$( [ "$have" = cp ] && echo control-plane || echo data-plane ).sh instead."
}

# run_setup generates this deployment's TLS, signing, and encryption keys and its Direct API secret,
# and unless told to skip it, seeds the baseline resources.
#
# Keys are generated only when absent, so a redeploy keeps the ones already in use: regenerating them
# would invalidate every token this deployment has issued.
#
# It must run after the schema is loaded, because seeding writes to the database.
#
# Pass --skip-bootstrap where the baseline belongs to a named tenant rather than to the server, which
# is the case on a multi-tenant Control Plane. run_bootstrap then seeds it against that tenant.
run_setup() {
    log "Key material${1:+ (no baseline resources)}"
    [ -x "$SERVER_HOME/setup.sh" ] || die "setup.sh not found at $SERVER_HOME"

    [ -n "${ADMIN_PASSWORD:-}" ] || die "\$ADMIN_PASSWORD is not set.
Set it, with \$ADMIN_USERNAME, to the credentials the first administrator signs in with."

    ( cd "$SERVER_HOME" && \
        ADMIN_USERNAME="${ADMIN_USERNAME:-admin}" ADMIN_PASSWORD="$ADMIN_PASSWORD" \
        ./setup.sh ${1:+--skip-bootstrap} </dev/null ) || die "setup.sh failed"
}

# report_key_material says where the keys landed and what has to happen to them.
#
# Everything else this provisions ends up in the database, which the pods already read. Key material
# does not: it is files, and every replica has to mount the same ones, because a token signed by one
# has to verify on another and data encrypted under one key cannot be read under a different one.
# Carrying them across is the step that has to happen outside this script.
report_key_material() {
    echo
    echo "Key material was generated in:"
    echo "  $SERVER_HOME/config/certs      TLS, token signing, and encryption keys"
    echo "  $SERVER_HOME/config/secrets    the Direct API secret"
    echo
    echo "This is the one thing here that is not in the database. Put it where every replica of this"
    echo "deployment reads it, for example as a Secret mounted over config/certs and config/secrets:"
    echo
    echo "  kubectl create secret generic <name>-certs   --from-file=$SERVER_HOME/config/certs"
    echo "  kubectl create secret generic <name>-secrets --from-file=$SERVER_HOME/config/secrets"
    echo
    echo "Keep it. Losing or changing these keys invalidates every token already issued and makes"
    echo "data encrypted under them unreadable."
}

# db_is_populated reports whether a datasource already holds tables.
#
# The schema scripts create tables unconditionally, so applying one to a populated database fails.
# Asking whether anything is there is the check that keeps this safe to rerun, and it needs no
# sentinel table to be kept in step with the schema.
db_is_populated() {
    local engine="$1"
    case "$engine" in
        sqlite)
            local path="$2"
            [ -f "$path" ] || return 1
            [ "$(sqlite3 "$path" "SELECT count(*) FROM sqlite_master WHERE type='table';")" != "0" ]
            ;;
        postgres)
            local count
            count="$(psql_quiet "SELECT count(*) FROM information_schema.tables WHERE table_schema = current_schema();")"
            [ -n "$count" ] && [ "$count" != "0" ]
            ;;
    esac
}

# psql_quiet runs one statement against the datasource psql_* were set for, printing only the value.
psql_quiet() {
    PGPASSWORD="$PG_PASSWORD" psql -qtAX \
        -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_NAME" -c "$1" 2>/dev/null | tr -d '[:space:]'
}

# load_postgres_schema reads the connection for one datasource and applies its schema when the
# database is empty.
load_postgres_schema() {
    local ds="$1" dir="$2" pw_var="$3"

    PG_HOST="$(yaml_get "database.$ds.postgres.hostname")"
    PG_PORT="$(yaml_get "database.$ds.postgres.port")"
    PG_NAME="$(yaml_get "database.$ds.postgres.name")"
    PG_USER="$(yaml_get "database.$ds.postgres.username")"
    PG_PASSWORD="${!pw_var:-}"

    [ -n "$PG_HOST" ] && [ -n "$PG_NAME" ] || die "database.$ds.postgres is incomplete in $CONFIG_FILE"
    [ -n "$PG_PASSWORD" ] || die "\$$pw_var is not set.
The password is not read from deployment.yaml: in a cluster that file holds a placeholder, and the
server resolves it from the environment. Provide the same value here, from the same Secret."

    command -v psql >/dev/null 2>&1 || die "psql is required to load the $ds schema into PostgreSQL.
Either run this script somewhere psql is available, or load the schema yourself, once:
  psql -h $PG_HOST -p ${PG_PORT:-5432} -U $PG_USER -d $PG_NAME -f $DB_SCRIPTS/$dir/postgres.sql"

    if db_is_populated postgres; then
        skip "$ds: $PG_NAME on $PG_HOST already holds tables"
        return
    fi
    log "    $ds: loading schema into $PG_NAME on $PG_HOST"
    PGPASSWORD="$PG_PASSWORD" psql -qX -v ON_ERROR_STOP=1 \
        -h "$PG_HOST" -p "${PG_PORT:-5432}" -U "$PG_USER" -d "$PG_NAME" \
        -f "$DB_SCRIPTS/$dir/postgres.sql" >/dev/null \
        || die "failed to load the $ds schema into $PG_NAME"
}

# load_sqlite_schema creates one datasource's database file when it is not there yet.
#
# SQLite is for a single instance only: the file belongs to one container, so a deployment running
# several of them does not share it. Anything with more than one replica needs PostgreSQL.
load_sqlite_schema() {
    local ds="$1" dir="$2" path
    path="$(yaml_get "database.$ds.sqlite.path")"
    [ -n "$path" ] || die "database.$ds.sqlite.path is not set in $CONFIG_FILE"
    case "$path" in /*) ;; *) path="$SERVER_HOME/$path" ;; esac

    if db_is_populated sqlite "$path"; then
        skip "$ds: $path already holds tables"
        return
    fi
    log "    $ds: creating $path"
    mkdir -p "$(dirname "$path")"
    sqlite3 "$path" < "$DB_SCRIPTS/$dir/sqlite.sql" || die "failed to create $path"
    sqlite3 "$path" "PRAGMA journal_mode=WAL;" >/dev/null
}

# ensure_schema loads whichever schema each of the four datasources is configured for.
ensure_schema() {
    log "Database schema"
    local ds dir pw_var engine
    while IFS=: read -r ds dir pw_var; do
        [ -n "$ds" ] || continue
        engine="$(yaml_get "database.$ds.type")"
        case "$engine" in
            postgres) load_postgres_schema "$ds" "$dir" "$pw_var" ;;
            sqlite)   load_sqlite_schema "$ds" "$dir" ;;
            redis)    skip "$ds: redis needs no schema" ;;
            "")       die "database.$ds.type is not set in $CONFIG_FILE" ;;
            *)        die "database.$ds.type \"$engine\" is not supported" ;;
        esac
    done <<< "$DATASOURCES"
}

# run_bootstrap seeds the baseline resources: the admin user, the roles, and the console application.
#
# A deployment id scopes the baseline to one tenant, which is how a Control Plane in token mode
# provisions each. Bootstrap upserts, and a tenant's baseline ids are derived from its deployment id,
# so running this again against a provisioned tenant changes nothing.
run_bootstrap() {
    local deployment_id="${1:-}" args=()
    [ -n "$deployment_id" ] && args+=(--deployment-id "$deployment_id")

    [ -n "${ADMIN_PASSWORD:-}" ] || die "\$ADMIN_PASSWORD is not set.
Set it, with \$ADMIN_USERNAME, to the credentials the first administrator signs in with."

    if [ -n "$deployment_id" ]; then
        log "Baseline resources for tenant \"$deployment_id\""
    else
        log "Baseline resources"
    fi
    ( cd "$SERVER_HOME" && \
        ADMIN_USERNAME="${ADMIN_USERNAME:-admin}" ADMIN_PASSWORD="$ADMIN_PASSWORD" \
        ./thunderid bootstrap "${args[@]}" \
            --admin-username "${ADMIN_USERNAME:-admin}" --admin-password "$ADMIN_PASSWORD" ) \
        || die "bootstrap failed"
}
