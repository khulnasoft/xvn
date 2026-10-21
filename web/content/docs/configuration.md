
# Configuration

You can use `xvn` as a private local registry, a proxy registry, or
both. If you want to publish into or consume from the local registry
you can use `http://localhost:<port>`.

To proxy requests to `npm` you can add `npm` to the pathname (ex.
`http://localhost:<port>/npm` will proxy all requests to `npmjs.org`).

## CLI configuration

XVN supports both development and deployment commands with various
configuration options.

### Development server (`xvn dev`)

```bash
# Start with defaults (registry + web UI)
xvn

# Custom configuration
xvn dev --port 4000 --web-port 4001 --debug --config ./nrz.json

# Registry only (no web UI)
xvn --no-web
```

### Deployment (`xvn deploy`)

```bash
# Deploy to default environment (dev)
xvn deploy

# Deploy to specific environment
xvn deploy --env=prod

# Override resource names
xvn deploy --env=staging --db-name=custom-db --bucket-name=custom-bucket

# Preview deployment
xvn deploy --dry-run --env=prod
```

See the [Deployment guide](/docs/deploy) for complete deployment
configuration documentation.

## Configuration file (`nrz.json`)

XVN can be configured using a `nrz.json` file that supports both
development and deployment settings.

### Development configuration

```json
{
  "registry": {
    "port": 4000,
    "debug": true,
    "telemetry": false
  }
}
```

### Deployment configuration

```json
{
  "registry": {
    "deploy": {
      "sentry": {
        "dsn": "https://your-default-sentry-dsn@sentry.io/project-id",
        "sampleRate": 1.0,
        "tracesSampleRate": 0.1
      },
      "environments": {
        "dev": {
          "databaseName": "xvn-dev-database",
          "bucketName": "xvn-dev-bucket",
          "queueName": "xvn-dev-cache-refresh-queue",
          "sentry": {
            "environment": "development"
          },
          "vars": {
            "CUSTOM_VAR": "dev-value"
          }
        },
        "staging": {
          "databaseName": "xvn-staging-database",
          "bucketName": "xvn-staging-bucket",
          "queueName": "xvn-staging-cache-refresh-queue",
          "sentry": {
            "environment": "staging"
          }
        },
        "prod": {
          "databaseName": "xvn-prod-database",
          "bucketName": "xvn-prod-bucket",
          "queueName": "xvn-prod-cache-refresh-queue",
          "sentry": {
            "environment": "production",
            "dsn": "https://your-prod-sentry-dsn@sentry.io/project-id",
            "sampleRate": 0.1,
            "tracesSampleRate": 0.01
          },
          "vars": {
            "API_BASE_URL": "https://api.example.com"
          }
        }
      }
    }
  }
}
```

## Package manager integration

### nrz

In your project or user-level `nrz.json` file add the relevant
configuration:

```json
{
  "registries": {
    "npm": "http://localhost:1337/npm",
    "local": "http://localhost:1337"
  }
}
```

### npm, pnpm, yarn & bun

To use `xvn` as your registry you must either pass a registry config
through a client-specific flag (ex. `--registry=...` for `npm`) or
define client-specific configuration which stores the reference to
your registry (ex. `.npmrc` for `npm`).

Access to the registry and packages is private by default. XVN uses
[Better Auth](https://better-auth.com)'s API Key plugin — there is no
pre-baked default admin token. Mint one with the seed script:

```bash
ADMIN_EMAIL=admin@example.com \
  ADMIN_PASSWORD='a-strong-password' \
  nrr db:seed
```

The script prints the generated `xvn_pat_…` key on stdout exactly
once. Put it in your client config:

```ini
; .npmrc
registry=http://localhost:1337
//localhost:1337/:_authToken=xvn_pat_…
```

### Admin seed environment

| Variable | Purpose |
| --- | --- |
| `ADMIN_EMAIL` | Required. Email for the admin user. |
| `ADMIN_PASSWORD` | Required. At least 8 characters; bcrypt-hashed by Better Auth. |
| `ADMIN_NAME` | Optional. Display name (defaults to `admin`). |
| `XVN_URL` | Optional. Base URL of the running XVN (defaults to `http://localhost:1337`). |

The seed script is HTTP-only — it requires a running worker. Run it
once after `nrr db:setup` on each environment.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Required for auth. Random 32-byte base64 string. |
| `BETTER_AUTH_URL` | Origin the browser uses (e.g. `http://localhost:3000` in dev). |
| `WEB_URL` | Comma-separated trusted web UI origins for CORS and redirects. |
| `XVN_ORIGIN` | Internal registry URL for the web app's server-side fetches. |
