---
title: "Production-grade Configuration Management"
slug: "configuration-management"
order: 17
videoId: "GR9NtirPXyc"
duration: "36:13"
module: "Reliability & Operations"
difficulty: "intermediate"
summary: "What configuration really covers in a backend (far more than secrets), the main types of config, where config is stored (environment variables, YAML/TOML files, key-value stores, cloud secret managers, hybrid layering), why each environment gets different values, and the security and validation practices that keep config from taking down production."
tags: ["configuration", "environment-variables", "secrets-management", "feature-flags", "yaml", "vault", "validation", "zod", "devops"]
prerequisites: ["validation-transformation", "error-handling"]
interviewWeight: 3
---

## TL;DR
- **Configuration management** is the systematic way to organize, store, access and maintain **all the settings** of a backend. It is the app's "DNA" and decides how the same code behaves in each environment.
- Config is **much more than secrets**. It covers startup behaviour, connections to external services, per-environment behaviour, logging, metrics destinations, feature flags, performance tuning and business rules.
- **Types:** application settings (port, log level, pool size, timeouts), database config, external-service credentials (Stripe, Resend, Clerk), feature flags, plus infrastructure, security, performance-tuning and business-rule config.
- Config values differ along several axes: **sensitive vs not**, **frequently vs rarely changing**, **same across environments vs per-environment**.
- **Sources:** environment variables (with `.env` for local dev), files (YAML preferred over JSON because it allows comments, also TOML), key-value stores (Consul, etcd), cloud secret managers (HashiCorp Vault, AWS Parameter Store/Secrets Manager, Azure Key Vault, Google Secret Manager), and **hybrid** setups with a defined priority order.
- **Each environment has different priorities:** dev favours productivity and debugging, test favours automated validation, staging favours mirroring production cheaply, and production favours reliability, security and performance. The code stays the same and only the config changes.
- **Security:** never hardcode secrets, prefer a managed secret store (encrypted at rest and in transit), apply **least-privilege** access, and **rotate** secrets periodically.
- **Most important rule:** **validate all config at startup** (Zod in TypeScript, go-playground/validator in Go) and fail fast if a required value is missing or malformed.

## Why this matters
A misconfigured frontend shows the wrong dialog or redirects to the wrong route. A misconfigured backend can **expose customer data, process payments incorrectly, or bring the whole platform down**. Modern backends are distributed: they talk to databases, caches like Redis, message queues, auth providers, email services and payment processors, and they run on VMs, containers, serverless and edge functions. Every one of those integration points needs configuration for **how to connect, how to handle failure, how to perform, and how to stay secure**. Without a systematic approach you end up with **configuration chaos**.

## What is configuration management?

**Definition:** a systematic approach to **organizing, storing, accessing and maintaining all the settings** of a backend application. It is the application's DNA. The same compiled code becomes a dev server, a staging server or a production server depending on its configuration.

### The narrow view vs the real scope
Most people hear "config" and think of secrets:
- the database password or connection URL,
- JWT or session signing secrets,
- API keys for external services like an email provider.

That's like saying a car is just its engine. The engine is the most important part, but it's a fraction of the car. Configuration also decides:
- **how the application starts up**,
- **how it connects** to external services,
- **how it behaves** per environment,
- **what it logs**, whether it logs at all, and **where**,
- **where it sends metrics** (performance and business metrics),
- **which features are on or off** for this deployment, and **for which users**.

```mermaid
flowchart TD
    CFG["Configuration"] --> S1["Startup behaviour<br/>port, timeouts"]
    CFG --> S2["Connections<br/>DB, Redis, queues, APIs"]
    CFG --> S3["Environment behaviour<br/>dev, staging, prod"]
    CFG --> S4["Logging<br/>level, destination"]
    CFG --> S5["Metrics and tracing<br/>where to send"]
    CFG --> S6["Feature flags<br/>who gets what"]
    CFG --> S7["Secrets<br/>keys, passwords"]
    CFG --> S8["Business rules<br/>limits, thresholds"]
```

### Example: an e-commerce backend
An e-commerce backend's configuration might include:
- **Database connection details**: host, port, username, password, timeouts.
- **Payment processor API keys**, e.g. Stripe.
- **Feature flags**: a new checkout flow is built. A flag decides whether the old or the new flow is served, and it can enable the new flow **for some users only**.
- **Performance tuning parameters**: e.g. the database **connection pool size**.
- **Security settings**: e.g. **session timeout** (30 s? 60 s?).
- **Business rules**: e.g. **maximum order amount** per user.

### Config values have different characteristics
| Axis | Examples |
|---|---|
| **Sensitive** (must stay secret; a leak causes damage or loss) | DB password, Stripe secret key, JWT secret |
| **Non-sensitive but behaviour-controlling** | log level, port, pool size, feature flags |
| **Changes frequently** | feature flags, business limits |
| **Changes rarely** (monthly, quarterly) | DB host, provider keys |
| **Same in every environment** | API version prefix, default page size |
| **Different per environment** | DB URL, log level, pool size |

These axes drive **where** a value is stored, **how** it's protected, and **who** can access it.

### Configuration chaos
Without a dedicated strategy and pipeline you get:
- **Hardcoded values scattered across the codebase** instead of one central source.
- **Inconsistent behaviour across environments.** It works in staging and breaks in prod.
- **Security vulnerabilities** from exposed secrets, e.g. keys committed to git.
- **Debugging nightmares.** You can't reproduce an issue because you don't know which config values were in effect when it broke.

> [!IMPORTANT]
> The goal is a **single, central, systematic** way to define, load and inspect config, so that any incident can be traced to "which config was active" and any behaviour change can be made **without touching code**.

## Types of configuration

Not all configuration is created equal. Its type determines the **storage mechanism, security measures, access patterns** and **which environments** may see it.

### 1. Application settings
The most common kind, found in nearly every backend:
- **Port**: which port the server listens on (e.g. `8080` locally; prod depends on your VPS or Kubernetes setup).
- **Log level**: `debug` in development so you see everything; `info` in production so valuable production logs aren't cluttered.
- **Connection pool size**: most backends use **connection pooling**, reusing a set of open DB connections instead of opening one per query. The maximum pool size is configurable.
- **Timeouts**: how long the server waits for a request to complete.

> [!WARNING]
> **Timeouts must match the workload.** An endpoint that generates an AI image and returns it as base64 takes about 80 s on average. If the server or proxy timeout is 60 s, every one of those requests is cut off and the client gets **504 Gateway Timeout**. Set timeouts per route or workload, or make long jobs asynchronous (see task queues).

### 2. Database configuration
Everything needed to connect to the DB: **host, port, username, password, database name**. These combine into a **connection URL**:

```bash
DATABASE_URL="postgres://app_user:s3cret@db.internal:5432/shop?sslmode=require"
```

It may also include **query/statement timeouts** (how long a query may run before it's cancelled) and pool settings.

### 3. External services
Each third-party integration has its own config, usually an **API key** used to initialize its client:
- Email: Mailchimp, Resend, etc.
- Payments: Stripe.
- Authentication: Clerk.

### 4. Feature flags
Flags let you **enable or disable features dynamically**, without redeploying.
- Example: a **new checkout flow** that uses a different API. You don't want to roll it out to everyone at once.
- You can **A/B test** it, or enable it only for a **segment** of users, e.g. users in the US but not users in India.

```mermaid
flowchart LR
    REQ["Checkout request"] --> FF["Feature flag<br/>new_checkout"]
    FF -->|"enabled for segment<br/>e.g. country = US"| NEW["New checkout flow"]
    FF -->|"disabled<br/>e.g. country = IN"| OLD["Old checkout flow"]
```

> [!TIP]
> Simple flags can be env vars (`FEATURE_NEW_CHECKOUT=true`), but per-user targeting, percentage rollouts and instant toggles need a flag service (LaunchDarkly, Unleash, Flagsmith, GrowthBook) or a DB-backed flag table read at runtime.

### 5. Other types
- **Infrastructure/DevOps config**: deployment targets, regions, cluster settings.
- **Security config**: JWT secret, session secret, CORS origins, anything security-related.
- **Performance tuning**: e.g. in Go, `GOMAXPROCS` (max OS threads executing Go code simultaneously) and `GOGC`, set as environment variables.
- **Business rules**: logic-level rules (max order amount, free-shipping threshold, rate limits) that you want **centralized** instead of hardcoded.

| Type | Examples | Sensitive? | Typically varies per env? |
|---|---|---|---|
| Application settings | `PORT`, `LOG_LEVEL`, `DB_POOL_MAX`, `HTTP_TIMEOUT` | No | Yes |
| Database | host, port, user, password, name, URL | Password/URL: yes | Yes |
| External services | `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `CLERK_SECRET_KEY` | Yes | Yes (test vs live keys) |
| Feature flags | `new_checkout` per segment | No | Yes |
| Security | `JWT_SECRET`, `SESSION_SECRET`, `SESSION_TIMEOUT` | Secrets: yes | Yes |
| Performance | `GOMAXPROCS`, pool sizes, cache TTLs | No | Yes |
| Business rules | `MAX_ORDER_AMOUNT` | No | Usually no |

## Sources of configuration (where config is stored)

Where you store config depends on **security**, **speed of access/change**, and the **environment**.

### 1. Environment variables
The most common source, supported by every language (Node.js, Python, Go and others).
- An environment variable is an **operating-system feature**: key-value pairs in a process's environment.
- **Locally**, you keep them in a `.env` file. A library such as **dotenv** reads the file and loads the values into the process environment, so you don't have to `export` each one manually.
- **In deployed environments** (containers, Kubernetes, PaaS), the platform injects environment variables when it starts your app.

```bash
# .env  (local only - never commit this file)
PORT=8080
LOG_LEVEL=debug
DATABASE_URL=postgres://dev:dev@localhost:5432/shop
DB_POOL_MAX=10
STRIPE_SECRET_KEY=sk_test_xxx
```

```ts
import "dotenv/config";               // loads .env into process.env
const port = process.env.PORT;        // "8080" - always a string (or undefined)
```

**Deployment workflow with a secret manager:**

```mermaid
sequenceDiagram
    participant CI as Deploy pipeline
    participant SM as Secret manager
    participant RT as Runtime container
    participant APP as Backend app
    CI->>SM: fetch secrets for prod
    SM-->>CI: encrypted values over TLS
    CI->>RT: inject as environment variables
    RT->>APP: start process
    APP->>APP: read and validate env vars
    APP-->>RT: listening on PORT
```

### 2. Configuration files
- **JSON** works, but its major drawback is **no comments**, so you can't document why a value is what it is.
- **YAML** is the most popular choice today. It supports comments, so teams can share knowledge in the file itself.
- **TOML** is a newer format that's also widely used (e.g. `Cargo.toml`, `pyproject.toml`).

Real-world examples: **Authelia** (a Go authentication server) keeps server, log level, storage, notification, identity, regulation and session settings in a single `configuration.yml`. **Apache Answer** (Apache incubator) ships config YAML with app settings (server port), database (SQLite for local) and Swagger UI config. YAML config files are very common in open-source projects.

```yaml
# config.yaml
server:
  port: 8080
  read_timeout: 30s     # raise for slow endpoints
log:
  level: info           # debug in dev
database:
  host: db.internal
  port: 5432
  name: shop
  pool_max: 50          # sized for prod traffic
features:
  new_checkout: false
business:
  max_order_amount: 100000
```

> [!WARNING]
> Files are fine for **non-secret** config committed to the repo. Never commit secrets in YAML or JSON files. Reference them from env vars or a secret manager instead.

### 3. Key-value stores
Dedicated cloud-native tools such as **HashiCorp Consul** and **etcd**. They're lightweight and simpler than hierarchical config systems, behave much like environment variables (flat key → value), and are **centrally shared** across many service instances. Some support watching for changes at runtime.

### 4. Cloud secret managers
- **HashiCorp Vault**, **AWS Systems Manager Parameter Store** (and AWS Secrets Manager), **Azure Key Vault**, **Google Secret Manager**.
- They suit **distributed** deployments with Kubernetes, autoscaling and sometimes several cloud providers at once: one central source of truth with integrations and documentation for each environment.
- They make the most sense when running serious production traffic.

### 5. Hybrid strategies (layered config)
Most real systems combine sources. A config loader builds the **runtime settings object** at startup, pulling from several places with a **predefined priority**, conditioned on the environment. For example: AWS Parameter Store first, then `config.yaml`, then environment variables.

```mermaid
flowchart TD
    START["App startup: config loader"] --> D["1. Defaults in code"]
    D --> F["2. config.yaml for this env"]
    F --> E["3. Environment variables"]
    E --> SM["4. Secret manager values"]
    SM --> V["Validate merged config"]
    V -->|"valid"| RUN["Start server"]
    V -->|"invalid"| FAIL["Exit with clear error"]
```

> [!NOTE]
> Priority order is a design decision; document it. A common convention is *defaults < file < env vars < secret manager / CLI flags*, where later sources override earlier ones. The key is that it's **explicit and deterministic**.

| Source | Strengths | Weaknesses | Best for |
|---|---|---|---|
| Environment variables | Universal, simple, platform-injected | Flat strings only, easy to forget one, visible to the process environment | Most config, including secrets injected at deploy |
| `.env` file | Convenient locally | Easy to commit by accident | Local development only |
| YAML / TOML files | Structured, commented, versioned in git | Not for secrets | Non-secret defaults and per-env settings |
| Key-value stores (Consul, etcd) | Central, shared, can update live | Extra infrastructure | Distributed systems, dynamic settings |
| Secret managers (Vault, AWS, Azure, GCP) | Encryption, access control, audit, rotation | Cost and setup | Production secrets |

## Why config differs per environment

Each environment has **different priorities**, so the same key gets different values:

| Environment | Top priority | Typical config choices |
|---|---|---|
| **Development** (localhost) | Developer productivity, debuggability | `LOG_LEVEL=debug`, local DB, pool size 10, test API keys |
| **Test** (e.g. a GitHub Actions run) | Automated validation, quality assurance | Ephemeral DB, deterministic settings, mocked externals |
| **Staging** | Mirror production as closely as possible, while **minimizing cloud cost** | Prod-like setup, but small resources, e.g. pool size 2 |
| **Production** | Reliability, security, performance | `LOG_LEVEL=info`, pool size 50, live keys from a secret manager |

**The application code stays identical.** Only the config changes, and that is exactly the point. Hardcoding values would force code changes per environment. With centralized config you never touch the code to change behaviour.

**Worked example: DB pool size**
- **Dev = 10.** Plenty for one developer on a capable laptop.
- **Prod = 50.** Must serve a large user base and absorb traffic spikes.
- **Staging = 2.** Staging should mirror prod, but running prod-sized infrastructure costs prod-sized money. Staging is used only by developers and testers, so a minimal pool is acceptable. Some delay is tolerable, and the savings are significant.

```mermaid
flowchart LR
    CODE["Same application code<br/>and build artifact"] --> DEV["Dev config<br/>pool 10, debug logs"]
    CODE --> STG["Staging config<br/>pool 2, prod-like"]
    CODE --> PROD["Prod config<br/>pool 50, info logs"]
```

> [!TIP]
> Build the artifact (Docker image) **once** and promote it unchanged through staging to production, varying only config. This is the Twelve-Factor "store config in the environment" principle, and it guarantees that what you tested is what you ship.

## Security of configuration

### 1. Never hardcode secrets
Production DB URLs, Clerk, email or payment API keys, and JWT secrets must **never** appear in source code. Code is copied, shared, logged and pushed to git, and anything in git history is effectively public forever.

```ts
// BAD
const stripe = new Stripe("sk_live_51H...");
// GOOD
const stripe = new Stripe(config.STRIPE_SECRET_KEY);
```

> [!TIP]
> Add `.env` to `.gitignore`, commit a `.env.example` with placeholder values to document required keys, and run a secret scanner (gitleaks, GitHub secret scanning) in CI.

### 2. Prefer a cloud secrets manager
Use Vault, AWS Parameter Store, Azure Key Vault or Google Secret Manager whenever possible. Over-engineering is a good idea when it comes to security. These services provide:
- **Encryption at rest**: secrets are encrypted before being stored, wherever they are stored.
- **Encryption in transit**: values are fetched over encrypted channels, and they are decrypted only inside your infrastructure, using credentials/keys held by your infra, CI (GitHub Actions secrets), or Kubernetes environment.
- Built-in access policies, audit logs and rotation support, so you don't have to build any of this.

### 3. Access control: least privilege
In a large team, plan **who can see which config**:
- **Frontend developers**: only what the frontend needs (backend API URL, public keys for frontend integrations).
- **Backend engineers**: databases, Redis, Elasticsearch and other backend dependencies.
- **DevOps**: cloud infrastructure credentials (e.g. access to EC2 instances).

### 4. Rotation
**Rotate** API keys, DB passwords and JWT secrets periodically, so a leaked value has a limited useful lifetime.

> [!NOTE]
> Rotating a JWT signing secret invalidates all existing tokens unless you support multiple active keys (key IDs, `kid`) during a transition window. Plan rotation so it doesn't log everyone out.

```mermaid
flowchart LR
    LP["Least privilege<br/>per role access"] --> SEC["Secure config"]
    NH["No hardcoded secrets"] --> SEC
    SMG["Secret manager<br/>encrypted at rest and in transit"] --> SEC
    ROT["Periodic rotation"] --> SEC
    VAL["Startup validation"] --> SEC
```

## Validate your configuration (the most important takeaway)

### The problem
Teams often load env vars and read `process.env.WHATEVER` directly throughout the code, with no checks. If a **required** variable is missing in production, or has a typo or the wrong format, the app may:
- boot successfully and then **crash later** on the first request that touches that code path, or
- **misbehave silently**, e.g. `undefined` becomes the string `"undefined"`, `"false"` is truthy, or a port is `NaN`.

These failures are **hard to spot**, because nothing tells you that a required config value was never provided.

### The solution: validate at startup, fail fast
At startup, once the app is deployed and before it serves traffic, **validate every config value regardless of source** (Parameter Store, YAML, env vars) with a proper validation library:
- define which values are **required** and which are **optional with defaults**,
- **coerce types** (strings → numbers or booleans),
- check **formats** (URLs, enums, ranges),
- **exit immediately with a clear error** if anything is wrong.

**TypeScript with Zod:**
```ts
// config.ts
import "dotenv/config";
import { z } from "zod";

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.string().url(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  JWT_SECRET: z.string().min(32),
  FEATURE_NEW_CHECKOUT: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  MAX_ORDER_AMOUNT: z.coerce.number().positive().default(100000),
});

const parsed = ConfigSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1); // fail fast - never boot with bad config
}

export const config = Object.freeze(parsed.data); // typed, immutable
```

Everywhere else, import `config`. Never read `process.env` directly. You get type safety, autocompletion and a single place to see every setting.

**Go with go-playground/validator:**
```go
package config

import (
	"log"

	"github.com/caarlos0/env/v11"
	"github.com/go-playground/validator/v10"
)

type Config struct {
	Port        int    `env:"PORT" envDefault:"8080" validate:"min=1,max=65535"`
	LogLevel    string `env:"LOG_LEVEL" envDefault:"info" validate:"oneof=debug info warn error"`
	DatabaseURL string `env:"DATABASE_URL,required" validate:"required,url"`
	DBPoolMax   int    `env:"DB_POOL_MAX" envDefault:"10" validate:"gt=0"`
	JWTSecret   string `env:"JWT_SECRET,required" validate:"min=32"`
}

func Load() Config {
	var c Config
	if err := env.Parse(&c); err != nil {
		log.Fatalf("config parse error: %v", err)
	}
	if err := validator.New().Struct(c); err != nil {
		log.Fatalf("invalid config: %v", err)
	}
	return c
}
```

```mermaid
stateDiagram-v2
    [*] --> Loading: process starts
    Loading --> Validating: merge all sources
    Validating --> Running: all values valid
    Validating --> Exited: missing or malformed value
    Running --> [*]
    Exited --> [*]
```

> [!IMPORTANT]
> **Always validate your config, no matter where it comes from.** A crash at startup with `DATABASE_URL: Required` is a 2-minute fix. A production system silently misbehaving because a variable was missing can take hours to diagnose and can cause real damage.

> [!INTERVIEW]
> **"How do you manage configuration and secrets in a production backend?"** Keep one codebase and vary behaviour by environment through config, not code changes. Non-secret defaults go in versioned YAML, environment-specific values in env vars, and secrets in a managed store (Vault or AWS/GCP/Azure secret managers) injected at deploy time, encrypted at rest and in transit. Use least-privilege access and rotate secrets regularly. A single config module loads all sources in a defined priority, validates everything with a schema (Zod or validator) at startup, and fails fast. The rest of the code reads only the typed config object.

## Common mistakes & misconceptions
- **"Config = secrets."** Config also covers timeouts, logging, pool sizes, flags, business rules and more.
- **Hardcoding values or secrets in code.** It causes config chaos, needs code changes per environment, and leaks secrets through git.
- **Committing `.env` files.** Commit `.env.example` instead, and gitignore the real one.
- **Storing secrets in JSON or YAML config files in the repo.** Files are for non-secret config.
- **Reading `process.env.X` all over the codebase.** It's unvalidated and untyped, and there's no single source of truth. Use one validated config module.
- **Not validating config.** Missing or malformed values cause delayed crashes or silent misbehaviour.
- **Treating env vars as typed.** They're always strings: `"false"` is truthy in JS, and `Number(undefined)` is `NaN`.
- **One timeout for everything.** Long workloads like AI image generation exceed a 60 s timeout and return 504s.
- **Prod-sized staging "for parity" without considering cost**, or the opposite: staging so different that it catches nothing.
- **Same secrets in every environment**, or using live payment keys in dev.
- **Everyone has access to everything.** Apply least privilege.
- **Never rotating secrets.** A leaked key stays valid forever.

## Interview questions

<details>
<summary><strong>Q: What is configuration management, and why is it more than storing secrets?</strong></summary>

It is the systematic way to organize, store, access and maintain all the settings that control a backend's behaviour: its DNA. Secrets (DB passwords, API keys, JWT secrets) are one part. Config also decides startup behaviour (port, timeouts), connections and failure handling for external services, logging level and destination, where metrics go, feature flags and user targeting, performance tuning (pool sizes, `GOMAXPROCS`) and business rules (max order amount). The same code behaves differently per environment purely through config.

</details>

<details>
<summary><strong>Q: What is "configuration chaos" and how do you avoid it?</strong></summary>

It's what happens with no config strategy: hardcoded values scattered across the codebase, inconsistent behaviour between environments, exposed secrets, and incidents you can't reproduce because nobody knows which values were in effect. Avoid it with one central config module, explicit sources and priority (defaults, file, env, secret manager), schema validation at startup, secrets in a managed store, and config that's versioned or audited so you can tell what changed.

</details>

<details>
<summary><strong>Q: Name the main types of configuration with examples.</strong></summary>

Application settings: port, log level, connection pool size, request timeouts. Database config: host, port, user, password and DB name forming a connection URL, plus query timeouts. External services: Stripe, Resend/Mailchimp and Clerk API keys. Feature flags: enabling a new checkout flow for US users only. Others: infrastructure config, security config (JWT and session secrets, session timeout), performance tuning (`GOMAXPROCS`), and business rules (maximum order amount).

</details>

<details>
<summary><strong>Q: Where can configuration be stored? Compare the options.</strong></summary>

Environment variables are universal and platform-injected, with `.env` plus dotenv locally, but they're flat strings. Files: YAML (supports comments, so it's preferred over JSON) or TOML, good for structured, versioned, non-secret config. Key-value stores like Consul or etcd are central and shareable across instances. Cloud secret managers (Vault, AWS Parameter Store/Secrets Manager, Azure Key Vault, GCP Secret Manager) provide encryption, access control, audit and rotation, and are best for production secrets. Most systems use a hybrid with a defined priority order.

</details>

<details>
<summary><strong>Q: Why might JSON be a poor choice for config files compared to YAML?</strong></summary>

JSON doesn't support comments, so you can't document why a value is set, what its units are, or when to change it. That knowledge then lives in people's heads. YAML (and TOML) support comments and are more human-readable for nested settings, which is why most open-source projects use `config.yaml`. YAML's whitespace sensitivity and implicit typing (e.g. `no` parsed as a boolean in YAML 1.1) are its gotchas.

</details>

<details>
<summary><strong>Q: Why does the same app have different config in dev, test, staging and prod? Give an example.</strong></summary>

Each environment optimizes for something different. Dev wants productivity and debugging (debug logs). Test wants automated validation. Staging wants to mirror prod at low cost. Prod wants reliability, security and performance. Example: DB pool max is 10 in dev (one developer is enough), 50 in prod (many users and traffic spikes), and 2 in staging (prod-like setup but only testers use it, so minimal resources save cloud cost). The code and build artifact are identical. Only config changes.

</details>

<details>
<summary><strong>Q: Your service boots fine in production but crashes on the first payment request. What likely happened and how do you prevent it?</strong></summary>

A required config value such as `STRIPE_SECRET_KEY` was probably missing or malformed in prod. Nothing checked it at startup, so the failure surfaced only when that code path ran. Prevent it by validating the entire config at startup with a schema (Zod or validator), marking required keys, coercing types and checking formats (e.g. starts with `sk_`), and exiting immediately with a clear error. Combined with health checks, the bad deploy then fails before receiving traffic.

</details>

<details>
<summary><strong>Q: How should secrets be handled securely?</strong></summary>

Never hardcode them or commit them; gitignore `.env` and commit only a `.env.example`. Store them in a managed secret store that encrypts at rest and in transit, and inject them at deploy time into env vars or mounted files. Apply least-privilege access: frontend devs get frontend config, backend devs get DB and cache, DevOps gets cloud credentials. Rotate secrets periodically, add secret scanning in CI, and keep secrets out of logs and error messages.

</details>

<details>
<summary><strong>Q: What are feature flags and why are they configuration?</strong></summary>

Feature flags are config values that turn features on or off at runtime without a redeploy, optionally for specific segments (country, user ID, percentage). Example: serve a new checkout flow to US users while India keeps the old one, A/B test it, and roll back instantly by flipping the flag. They are config because they change behaviour without code changes, and they need management: ownership, defaults, targeting rules and cleanup of stale flags.

</details>

<details>
<summary><strong>Q: An endpoint that generates AI images keeps returning 504. The config has a 60-second timeout. What's going on?</strong></summary>

Generation takes about 80 s on average, longer than the 60 s timeout, so the server or gateway gives up and returns 504 Gateway Timeout. Fix it by raising the timeout for that route (in the app and in any proxy or load balancer in front, which must all agree), or better, make it asynchronous: return 202 with a job ID, process the job in a task queue, and let the client poll or receive a webhook/WebSocket notification.

</details>

<details>
<summary><strong>Q: How would you design a config loader for a service deployed on Kubernetes across multiple environments?</strong></summary>

One module runs at startup: load code defaults, then the environment's YAML file (non-secret, versioned), then env vars injected by Kubernetes (ConfigMaps for non-secret values, Secrets or a Vault/External Secrets integration for sensitive ones), with later sources overriding earlier ones. Validate the merged result with a schema, freeze it into a typed object, and exit non-zero on failure so the pod never becomes ready. Log the non-secret effective config (with secrets redacted) to aid debugging, and expose only the typed config object to the rest of the code.

</details>

## Cheat sheet
- **Config = the app's DNA**: all settings, not just secrets.
- **Scope:** startup, connections, environment behaviour, logging, metrics, feature flags, performance, security, business rules.
- **Axes:** sensitive or not · changes often or rarely · same everywhere or per environment.
- **Chaos symptoms:** hardcoded values, environment inconsistencies, leaked secrets, irreproducible bugs.
- **Types:** app settings (port, log level, pool, timeouts) · DB (host, port, user, pass, name, URL) · external services (Stripe, Resend, Clerk keys) · feature flags · infra · security · performance (`GOMAXPROCS`) · business rules.
- **Timeout gotcha:** 80 s job against a 60 s timeout gives **504**.
- **Sources:** env vars (`.env` + dotenv locally) · YAML (comments) / TOML > JSON · KV stores (Consul, etcd) · secret managers (Vault, AWS Parameter Store, Azure Key Vault, GCP Secret Manager) · hybrid with explicit priority.
- **Environments:** dev = productivity · test = automated QA · staging = prod mirror at low cost · prod = reliability, security, performance. Pool example: dev 10 / staging 2 / prod 50.
- **Same code, different config.** Build once, promote everywhere.
- **Security:** no hardcoded secrets · managed store (encrypted at rest and in transit) · least privilege · rotation · `.env` in `.gitignore`.
- **Validate at startup, fail fast:** Zod (TS), go-playground/validator (Go). One typed, frozen config object, and never read `process.env` elsewhere.

## Glossary
- **Configuration management** — systematic organization, storage, access and maintenance of all application settings.
- **Configuration chaos** — scattered hardcoded values, inconsistent environments, exposed secrets and irreproducible bugs caused by having no config strategy.
- **Environment variable** — OS-level key-value pair available to a process. Always a string.
- **`.env` file** — local file of environment variables, loaded by libraries like dotenv. Never committed.
- **dotenv** — library that loads `.env` values into the process environment.
- **YAML / TOML** — human-readable config file formats that support comments.
- **Key-value store** — central store of flat config keys shared across instances (Consul, etcd).
- **Secret manager** — managed service that stores secrets encrypted, with access control, audit and rotation (Vault, AWS Parameter Store/Secrets Manager, Azure Key Vault, Google Secret Manager).
- **Hybrid configuration** — combining multiple sources with a defined override priority.
- **Feature flag** — config switch enabling or disabling a feature at runtime, optionally per user segment.
- **Connection pool** — a reusable set of open DB connections. Its maximum size is a key tuning parameter.
- **Timeout** — maximum time to wait for an operation before aborting (e.g. resulting in a 504).
- **Least privilege** — granting each person or service only the access it needs.
- **Secret rotation** — periodically replacing secrets to limit the impact of leaks.
- **Encryption at rest / in transit** — data encrypted while stored and while transferred over the network.
- **Fail fast** — stopping immediately at startup when configuration is invalid, instead of failing later.
- **Zod** — TypeScript schema validation library. **go-playground/validator** is a Go struct validation library.

## Video timestamps
- [00:00](https://www.youtube.com/watch?v=GR9NtirPXyc&t=0s) — What configuration management is
- [01:00](https://www.youtube.com/watch?v=GR9NtirPXyc&t=60s) — Config is more than secrets: the full scope
- [02:02](https://www.youtube.com/watch?v=GR9NtirPXyc&t=122s) — E-commerce configuration example
- [04:04](https://www.youtube.com/watch?v=GR9NtirPXyc&t=244s) — Characteristics: sensitive, frequency, per-environment
- [05:06](https://www.youtube.com/watch?v=GR9NtirPXyc&t=306s) — Distributed systems and integration points
- [06:08](https://www.youtube.com/watch?v=GR9NtirPXyc&t=368s) — Configuration chaos
- [07:08](https://www.youtube.com/watch?v=GR9NtirPXyc&t=428s) — Why the stakes are high for backends
- [12:16](https://www.youtube.com/watch?v=GR9NtirPXyc&t=736s) — Types of configuration
- [13:18](https://www.youtube.com/watch?v=GR9NtirPXyc&t=798s) — Application settings, timeouts and 504s
- [15:21](https://www.youtube.com/watch?v=GR9NtirPXyc&t=921s) — Database configuration
- [16:23](https://www.youtube.com/watch?v=GR9NtirPXyc&t=983s) — External services
- [17:26](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1046s) — Feature flags
- [18:27](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1107s) — Infra, security, performance and business-rule config
- [19:29](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1169s) — Sources of config: environment variables
- [21:30](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1290s) — Deployment workflow with secret managers
- [22:32](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1352s) — Config files: JSON, YAML, TOML and real examples
- [23:35](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1415s) — Key-value stores: Consul, etcd
- [24:35](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1475s) — Cloud secret managers
- [25:35](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1535s) — Hybrid strategies and priority
- [26:36](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1596s) — Why config differs per environment
- [28:39](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1719s) — Pool size example: dev, staging, prod
- [30:41](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1841s) — Security: never hardcode secrets
- [31:42](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1902s) — Secret managers: encryption at rest and in transit
- [32:42](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1962s) — Access control and least privilege
- [33:43](https://www.youtube.com/watch?v=GR9NtirPXyc&t=2023s) — Rotation and config validation
- [34:45](https://www.youtube.com/watch?v=GR9NtirPXyc&t=2085s) — Validate with Zod or Go validator, fail fast
