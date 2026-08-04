# Control Plane and Data Plane on Kubernetes

Sample `deployment.yaml` files for running ThunderID split into a Control Plane and one or more Data
Planes.

| File | Runs |
|---|---|
| [cp/deployment.yaml](cp/deployment.yaml) | The Control Plane: authoring, versioning, promotion. No runtime traffic. |
| [dp/deployment.yaml](dp/deployment.yaml) | One Data Plane environment: OAuth2/OIDC, flows, the gate. |

Each is a complete config, not a Helm template. Copy it, edit the hostnames and database details,
and mount it over `/opt/thunderid/deployment.yaml`.

## Images

Built from [Dockerfile.cp](../../Dockerfile.cp) and [Dockerfile.dp](../../Dockerfile.dp) at the
repository root. Both carry a default `deployment.yaml`, which the ConfigMap below replaces.

## Mounting the config

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: thunderid-dp-config
data:
  deployment.yaml: |
    # contents of dp/deployment.yaml
```

```yaml
volumeMounts:
  - name: deployment-yaml
    mountPath: /opt/thunderid/deployment.yaml
    subPath: deployment.yaml
volumes:
  - name: deployment-yaml
    configMap:
      name: thunderid-dp-config
```

## Secrets

Nothing secret belongs in the ConfigMap. Two mechanisms carry credentials in, both from the pod's
environment.

**Template placeholders.** A value written as `{{.NAME}}` in `deployment.yaml` is replaced from the
environment when the server loads the file. This is what the samples use for database passwords, the
channel token, and SMTP credentials.

```yaml
env:
  - name: DB_CONFIG_PASSWORD
    valueFrom:
      secretKeyRef: { name: thunderid-db, key: config-password }
  - name: DP_CHANNEL_TOKEN
    valueFrom:
      secretKeyRef: { name: thunderid-dp-channel, key: token }
```

Two things to know about this mechanism. A placeholder that has no matching variable is a startup
failure, not an empty string, so a missing credential surfaces immediately rather than at the first
request that needs it. And substitution scans the whole file including comments, so a placeholder
written in a comment demands a variable just as a real setting does.

**`THUNDERID_KV_TOKEN`.** The OpenBao token is read straight from this variable, with no placeholder
in the file, and takes precedence over `kv.token`. Everything else about the vault (address, mount,
prefix, namespace) stays in `deployment.yaml`, where it can be read and reviewed.

```yaml
env:
  - name: THUNDERID_KV_TOKEN
    valueFrom:
      secretKeyRef: { name: openbao-dp, key: token }
```

A mounted file works too, as `token: "file:///var/run/secrets/openbao/token"`, which keeps the token
out of the process environment.

## Key material

Both planes read TLS, JWT signing, and encryption keys from `config/certs`, and the Direct API
secret from `config/secrets`. None of it is baked into the image; the setup job generates it per
deployment. Mount the same material into every replica of one plane, or a token signed by one pod
will not verify on another.

## Replicas

**The Data Plane scales.** Every replica dials the Control Plane and holds its own connection, and a
command goes to one of them rather than all, because they share a database. Leave
`channel.client.instance` empty so it defaults to the pod name; setting it to a fixed value would
make every replica present one identity and each new connection would evict the last.

The Data Plane's replicas must share their secret store, which is why the sample uses `kv` mode. On
`file` mode each pod keeps its own file, so a credential pushed to whichever pod the Control Plane
reached would be invisible to the rest. Do not run more than one replica on `file` mode.

**Run the Control Plane with one replica for now.** A Data Plane's connection lives in the memory of
the single Control Plane pod it dialled, and there is no routing between pods yet, so an apply that
arrives at any other pod reports the Data Plane as offline. Its database and environment data are
already shared, so this is the only thing standing in the way of scaling it.

## Storage

The Control Plane's `environment_manager.data_dir` holds environments and their captured versions,
which is the history that promotion compares against. Back it with a PersistentVolumeClaim. The Data
Plane needs no durable storage of its own: its configuration comes from the Control Plane, its
secrets from the vault, and its data from Postgres.

## Ports

| Plane | Port | Notes |
|---|---|---|
| Control Plane | 8095 | Serves `/cp/connect`, which Data Planes dial. |
| Data Plane | 8090 | Runtime traffic. |

The Service and any ingress in front of the Control Plane must allow WebSocket upgrades on
`/cp/connect` and a long idle timeout. The connection is held open, not polled, and an ingress that
times it out will cycle every Data Plane's connection.
