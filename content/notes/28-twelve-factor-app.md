---
title: "The Twelve-Factor App"
slug: "twelve-factor-app"
order: 28
videoId: "2_fcv3-XfN4"
duration: "1:33:18"
module: "Reliability & Operations"
difficulty: "intermediate"
summary: "The twelve rules, written by Heroku in 2011, that define the contract between a backend service and the platform that runs it: codebase, dependencies, config, backing services, build/release/run, stateless processes, port binding, concurrency, disposability, dev/prod parity, logs and admin processes, plus how the 2024+ community rewrite modernizes each one."
tags: ["twelve-factor", "deployment", "config", "environment-variables", "stateless", "ci-cd", "logging", "containers", "devops"]
prerequisites: []
interviewWeight: 4
---

## TL;DR

- The **Twelve-Factor App** (12factor.net, written by Heroku co-founder **Adam Wiggins** in 2011) is a **contract between your app and the platform that runs it**. If your app obeys it, any machine, any platform and any new teammate can run, scale and update it without surprises.
- It exists to fight **software erosion** and **snowflake servers**: hand-built, unreproducible machines that slowly break even when nobody changes the code.
- The factors: **I** one codebase / many deploys, **II** declare and isolate dependencies, **III** config in the environment, **IV** backing services as attached resources, **V** strict build → release → run, **VI** stateless share-nothing processes, **VII** port binding, **VIII** scale out via the process model, **IX** disposability (fast startup, graceful shutdown), **X** dev/prod parity, **XI** logs as event streams to stdout, **XII** admin tasks as one-off processes.
- The core idea behind most factors: **code is the same across every deploy, config is what differs**, and anything that must survive goes into a **backing service**, never into the process.
- Docker, Kubernetes, Render, Railway, Fly, Cloud Run, Vercel, etc. all **assume** you follow these rules (env-var config, stdout logs, a port to bind, processes that can be killed at any time).
- In **November 2024** Heroku (now owned by Salesforce) **open-sourced** the document; a community rewrite (branch `next`) keeps the 12 names but restates each factor as numbered principles and modernizes it (containers, serverless, secret managers, observability).
- What aged well: backing services (IV), build/release/run (V), stateless processes (VI), logs (XI). What needed updating: secrets in env vars (III), port binding vs. serverless (VII), dev/prod parity vs. managed cloud services (X).

## Why this matters

Throughout a backend course you are told to do things a certain way: put config in environment variables, bind a port, log to stdout, keep processes stateless, survive being killed. These are not arbitrary preferences. They come from one source document, the Twelve-Factor App, and every modern deployment platform is built around them. Knowing the *reason* behind each rule turns a checklist into a mental model: you can predict what a platform expects of you, debug "works on my machine" problems, and defend design decisions in an interview.

> [!INTERVIEW]
> **"What is a twelve-factor app?"** It is a methodology for building software-as-a-service apps, published by Heroku in 2011, consisting of twelve rules about the interface between an application and its execution environment. Following it makes an app portable across platforms, easy to scale horizontally, safe to deploy continuously, and reproducible by any developer. Key ideas: config in the environment, stateless disposable processes, backing services as attached resources, strict build/release/run, logs as streams.

## Scope: what the twelve factors are (and are not)

### In scope
The document is about **apps that run as a service**: web apps, APIs, anything deployed somewhere and reachable over a network. It is **language-agnostic and tool-agnostic**: any language, any database, any queue.

### Out of scope
- Desktop software and mobile apps.
- General code-quality principles such as **DRY** (Don't Repeat Yourself) or **KISS** (Keep It Simple, Stupid). The factors are not "everything that is good in software".
- Kubernetes operations or microservice architecture in depth.

The factors are mostly about **the boundary between the application and the platform**: how the app gets its config, how it is started, how it is scaled, how it emits logs, how it is stopped.

## History: why the document was written

### Who wrote it and why they are credible
In 2011, **Heroku** was about three years old and one of the first well-known **Platform as a Service (PaaS)** providers.

> [!NOTE]
> **Platform as a Service** means you hand the platform your code, and it does the rest: builds it, prepares the runtime environment, injects configuration, connects databases, configures networking, and puts the app live on the internet behind a domain name.

Because Heroku deployed and operated hundreds of thousands of apps across many languages and frameworks, they saw the same patterns of apps deploying, scaling, breaking and getting corrupted over and over. Adam Wiggins, a co-founder, distilled those patterns into twelve factors and published them at **12factor.net** in 2011.

### What deployment looked like before (snowflake servers)
To understand why rules that look obvious today needed to be written down, picture deployment around 2011:

1. Rent a server (from a basic VPS provider) or, worse, keep a **physical machine in the office**. AWS existed but cloud was not yet the default.
2. An engineer installs the OS by hand (Ubuntu or another Linux).
3. Install the language runtime by hand (Java, Python, Ruby, ...).
4. Install the database and supporting libraries.
5. Copy the application onto the machine, often via **FTP** (File Transfer Protocol).
6. SSH in and edit config files directly on the server.

Every server built this way was a **snowflake**: unique, hand-built, and **impossible to reproduce**. If the machine died, you started from scratch from memory or a manual. A new developer could take **days** to get the app running locally, and even then their laptop did not match production. This is where the famous phrase **"it works on my machine"** comes from, and why teams froze all other work on deployment days.

```mermaid
flowchart TD
    A["Rent server or office machine"] --> B["Install OS by hand"]
    B --> C["Install runtime by hand"]
    C --> D["Install DB and libraries"]
    D --> E["Copy app via FTP"]
    E --> F["SSH in and edit config"]
    F --> G["Snowflake server<br/>unique and unreproducible"]
    G --> H["Software erosion<br/>breaks without code changes"]
```

### Software erosion
The document names this decay **software erosion**: an app slowly stops working **even though nobody changed its code**. Causes:

- The OS gets patched or upgraded and something the app relied on changes.
- Two apps share a server; one upgrades a shared library and breaks the other.
- The person who set up and maintained the infrastructure leaves without documenting every manual change (which is practically impossible to do for manual changes).

The twelve factors are **defenses against erosion**.

### 2024: the document goes open source
For roughly 13 years the document was effectively frozen (the footer says last updated 2017, and that was a minor update). Meanwhile containers, Kubernetes, serverless and managed cloud infrastructure became mainstream.

In **November 2024**, Heroku (owned by Salesforce) announced at KubeCon that the Twelve-Factor App is now an **open-source project**: the document moved to a public repository under a neutral organization, with a governance document, and maintainers were invited from other companies including AWS and Google Cloud.

The community rewrite is happening publicly on a branch called **`next`**. It:
- keeps all **12 names and one-line mottos**,
- rewrites each factor into a **numbered list of principles**,
- separates the **timeless** principles from the **2011-era** specifics and adds **modern** principles.

At the time of recording the live site still shows the 2011 text and the rewrite is an unmerged working draft. So for each factor below: **original 2011 text first, then what the rewrite changes / where it stands today.**

```mermaid
flowchart LR
    A["2011<br/>Heroku publishes 12factor.net"] --> B["2017<br/>last small update"]
    B --> C["2011 to 2024<br/>containers, k8s, serverless arrive"]
    C --> D["Nov 2024<br/>open sourced at KubeCon"]
    D --> E["Community rewrite<br/>on branch next"]
```

## Factor I — Codebase: one codebase tracked in revision control, many deploys

### Part 1: one codebase in version control
Obvious today (Git, GitHub, GitLab, Bitbucket), but in 2011 many production apps were literally a folder on someone's computer or a zip file named something like `final_v2_really_final.zip`, emailed between teammates. Making version control a rule turned it into a standard.

### Part 2: many deploys
A **deploy** is **one running instance of the app**: production is a deploy, staging is a deploy, each developer's laptop is a deploy, and modern workflows add a **preview deploy per pull request**.

All deploys come from the **same codebase**. They may run **different commits** of it, but they are never separate codebases.

So what makes production different from your laptop? Production talks to a real managed database; locally you run Postgres in a Docker container. The code is the same. **The difference is config.**

> [!IMPORTANT]
> **Code is shared by every deploy. Config is unique to each deploy.** This single sentence underlies Factors I, III, IV and V.

### Example: four deploys, one codebase
Suppose the repository is at commit 100:

| Deploy | Running commit | Why |
|---|---|---|
| Production | 97 | Last deployed on Friday |
| Staging (internal) | 99 | Testing what ships tomorrow |
| Your laptop | 100 + 2 unpushed commits | Active development |

On deploy day staging moves to 100, then production moves to 100. Nothing about the deploys themselves changed, only **which commit of the same repo** each runs.

```mermaid
flowchart LR
    R["One Git repo"] --> P["Production<br/>commit 97"]
    R --> S["Staging<br/>commit 99"]
    R --> L["Laptop<br/>commit 100 plus local"]
    R --> PR["PR preview<br/>branch commit"]
    C1["Prod config"] --> P
    C2["Staging config"] --> S
    C3["Local config"] --> L
    C4["Preview config"] --> PR
```

> [!TIP]
> Test: **can you describe every environment as "the same codebase at commit X"?** If not (someone hot-patched a server, or prod is a fork), you are heading for trouble.

### Boundaries
- **Multiple codebases = not one app.** That is a **distributed system** of several apps, and **each** app should be twelve-factor on its own.
- **Two apps sharing code by copy-paste = violation.** Shared code should be extracted into a **library** and consumed through the **dependency manager** (Factor II).

### Monorepos in 2026
A common argument is that monorepos (many apps in one repository) violate Factor I. They do not. The document defines a codebase as a repo, or a set of repos sharing a root commit, and the test is a **one-to-one mapping between codebase and app**. If a monorepo builds five apps, treat it as five codebases that happen to live in one repository, each following the twelve factors. What the factor actually forbids is the **same app existing in two places** (copy-paste duplication), not many apps in one place.

## Factor II — Dependencies: explicitly declare and isolate dependencies

Two key words: **declare** and **isolate**.

### Declare
Somewhere in the repo there is a file that **completely and accurately lists every library the app needs**, a **manifest**:

| Ecosystem | Manifest | Lock file |
|---|---|---|
| Node.js | `package.json` | `package-lock.json` (or `pnpm-lock.yaml`, `yarn.lock`) |
| Go | `go.mod` | `go.sum` |
| Python | `requirements.txt` / `pyproject.toml` | `poetry.lock`, `uv.lock`, pinned requirements |
| Ruby | `Gemfile` | `Gemfile.lock` |

**Problem it solves:** without a manifest, a new laptop or new teammate has to read every import statement, guess versions, and fight version clashes, which can easily take two or three days. With a manifest, setup is **one command** (`npm install`, `go mod download`, `bundle install`) that downloads exactly what is needed.

The 2011 text mentions Ruby's `Gemfile` and `bundle install` (Rails was hugely popular). Today the idea is even stronger thanks to **lock files**:

- A manifest usually lists **version ranges** (e.g. `^4.18.0`), meaning "roughly this package".
- A lock file **pins the exact version** of every library **and every transitive dependency** (the libraries your libraries depend on).
- So running the app months or years later still pulls exactly the same versions.

> [!TIP]
> Always commit the lock file for applications, and use the lock-respecting install command in CI (for example `npm ci` instead of `npm install`) so builds are reproducible.

### Isolate
Declaration alone is not enough. Example in Python: your `requirements.txt` says `requests` version 2, but the app runs against the **system-wide** Python where another tool already installed `requests` version 1. The import finds the system copy first, so your app runs code you did not ask for. **The manifest was ignored.**

- Declare without isolating: it will not behave the same everywhere.
- Isolate without declaring: you spend days or weeks trying to reproduce the right versions, maybe never succeeding.

**Isolation means nothing leaks in from the surrounding machine.** The app sees only its declared dependencies. The 2011 text cites `bundle exec` for Ruby and `virtualenv` for Python.

### System tools must be declared too ("vendoring")
The factor also covers system binaries the app shells out to. Example: an image-resizing service calls the **ImageMagick** binary.

- On your Mac, Homebrew installed **ImageMagick 7**, whose main binary is `magick`.
- On the Ubuntu server, `apt` installed **ImageMagick 6**, whose binary is `convert`, with different defaults.

The same code snippet runs two different programs with different behavior, because major versions have breaking changes. The app must not rely on whatever happens to be installed on the host; such tools should be **vendored** (bundled with the app) or otherwise declared.

### Modern view: containers
Containers are the biggest shift for this factor. A **Docker image freezes not only libraries but also the OS userland, system tools and the language runtime itself**. That is the strongest declaration-plus-isolation you can get, which is why people say **Docker practically solved Factor II**.

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache imagemagick
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "server.js"]
```

## Factor III — Config: store config in the environment

One of the most quoted and most argued factors.

### What counts as config?
**Config is everything likely to vary between deploys.** Examples:

| Thing | Local development | Production |
|---|---|---|
| Database URL | Postgres in a local Docker container | Amazon RDS over a private VPC connection |
| Email provider | Sandbox / test API | Real provider |
| Object storage | Local MinIO | AWS S3 |
| Redis | Local container | Managed Redis instance |

Only the config changes; the code is identical. Internal application settings that do **not** vary per deploy (e.g. route definitions, how modules are wired together) are **not** config in this sense and belong in code.

### The open-source test
How do you decide if something is config? The document's test:

> **Could you open-source your codebase right now, this minute, without compromising a single credential?**

It does not ask whether you *would*, only whether you *could*. If the answer is no, config (usually secrets) is sitting in your code.

### Why environment variables?
Once config is outside the code, the factor says to put it in **environment variables**, because:

1. They are **easy to change between deploys** without touching any file.
2. They **cannot be accidentally committed** to the repository, which is exactly how credentials leak every day.
3. They are an **OS-level standard**, independent of language or framework. The same mechanism works for Go, Node.js, Rust, Python or a bash script.

The alternatives of the time were framework-specific config files: Java `.properties` files, Rails `config/database.yml`, etc. Each had its own format and almost all of them eventually got committed to source control, leaking credentials.

### Example: a typed config struct loaded from env vars
In the course's Go task-management app ("Tasker"), the `config` package declares the whole configuration as one Go struct with blocks for server, database, auth, Redis, email, AWS, observability and cron: around 38 values, all loaded from environment variables with a `TASKER_` prefix (`TASKER_SERVER_PORT`, `TASKER_DATABASE_HOST`, ...). The Git history shows the config values changing constantly (new integrations, timeouts, hosts) while the code that reads them barely changed. **Things with different rates of change should not live in the same place.**

```go
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
}

type DatabaseConfig struct {
    Host     string `env:"TASKER_DATABASE_HOST"`
    Port     int    `env:"TASKER_DATABASE_PORT" envDefault:"5432"`
    User     string `env:"TASKER_DATABASE_USER"`
    Password string `env:"TASKER_DATABASE_PASSWORD"`
    Name     string `env:"TASKER_DATABASE_NAME"`
}
```

```ts
// Node.js: validate env at startup and fail fast
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
});

export const config = Env.parse(process.env); // crashes on boot if misconfigured
```

### Do not group config into named environments
The 2011 text warns against files like `config/environments/staging.rb`, `production.rb`, `development.rb`, `test.rb`. This **does not scale**: someone needs a deploy that is "almost staging but with a different database" (say, for a PR branch), so they add another named environment, then another. Every new deploy means new code.

Instead, config should be **granular**: each value an **independent environment variable**, never tied to a "mode" name. You compose a new deploy by **setting values**, not by choosing which mode it runs in. The rewrite keeps this: env vars are granular controls and should never be grouped into "environments".

> [!WARNING]
> Code like `if (env === "production") { useRealPayments() }` is the anti-pattern. Make it `PAYMENTS_PROVIDER_URL` (or a feature flag) instead, so any deploy can be configured independently.

### The controversy: are env vars safe for secrets?
Env vars are great for a database **hostname**. But for a **database password**? In 2017 **Diogo Mónica** (then running security at Docker) wrote a well-known article arguing that **you should not keep secrets in environment variables**, because the environment eventually leaks:

- **Child processes inherit the entire environment.** Shell out to any command and all your secrets go with it.
- **Crash reporters and debug pages** often dump the whole environment.
- On Linux, a process's environment is readable at **`/proc/<pid>/environ`** by anyone with sufficient access, and various tools log it.

The better pattern for sensitive credentials: a **dedicated secret manager** (HashiCorp **Vault**, **AWS Secrets Manager / SSM Parameter Store**, GCP Secret Manager). The app fetches secrets **at startup**, keeps them **in memory only**, and the organization **rotates and audits** them.

### Where it stands today
- **Separating config from code is non-negotiable**, then and now.
- **Env vars are the right default for non-secret config.**
- **For secrets**, env vars injected by your platform's "secrets" feature are acceptable for a solo developer or small team (and far better than committing credentials). As the company and team grow, a **secret manager** is the no-brainer path.

```mermaid
flowchart TD
    Q["Is this value different per deploy?"] -->|No| CODE["Keep it in code"]
    Q -->|Yes| S["Is it a secret credential?"]
    S -->|No| ENV["Environment variable"]
    S -->|Yes| T["Team or company growing?"]
    T -->|Small team| PENV["Platform-injected secret env var"]
    T -->|Yes| SM["Secret manager<br/>fetched at boot, kept in memory, rotated"]
```

## Factor IV — Backing services: treat backing services as attached resources

### What is a backing service?
**Anything the app consumes over the network** as part of normal operation:
- Databases (Postgres, MySQL)
- Caches (Redis)
- Queues / background-job brokers
- SMTP / email services
- Object storage (S3)
- Third-party APIs (payment providers, etc.)

### The rule
**The code makes no distinction between a backing service you run yourself and one run by a third party.** To the app, every one of them is an **attached resource**, reached through a **resource handle**.

A **resource handle = URL + credentials**, and by Factor III it lives in **config**, not code.

So whether Postgres runs in a local container or on AWS RDS, whether Redis is local or managed, the **code is identical**; only the handle changes.

**Test from the 2011 text:** you should be able to swap your local Postgres URL for a managed service (Neon, PlanetScale, Supabase, Amazon RDS) **without changing a single line of code**.

### Anatomy of a resource handle

```text
postgres://app_user:s3cret@db.internal.example.com:5432/tasker
└─scheme─┘ └─user─┘ └pass┘ └──────────host──────────┘└port┘└─db─┘
```

1. **Scheme** `postgres://`: the protocol (Postgres wire protocol).
2. **Credentials**: user and password.
3. **Host**.
4. **Port**: Postgres default is **5432**.
5. **Database name**.

One string carries everything needed to attach the resource.

```mermaid
flowchart LR
    APP["App process<br/>same code everywhere"] --> H1["DATABASE_URL"]
    APP --> H2["REDIS_URL"]
    APP --> H3["S3 endpoint and keys"]
    APP --> H4["SMTP or email API key"]
    H1 --> DB["Postgres<br/>local container or RDS"]
    H2 --> RD["Redis<br/>local or managed"]
    H3 --> OB["MinIO or S3"]
    H4 --> EM["Sandbox or Resend"]
```

### How it aged
In 2011 this was considered eccentric. Most people ran the server and database **on the same machine**, so "the database is somebody else's computer you talk to via a URL" was hard to relate to. Fifteen years later it is in every codebase; running app and database on the same instance is now considered an **anti-pattern for scaling**. Managed databases (RDS, Neon, PlanetScale), managed Redis, S3 for files, and email APIs like Resend instead of self-hosted SMTP are the norm. **This factor aged extremely well; it was almost a prediction.**

> [!TIP]
> Attached resources also make failover trivial: if a database instance has a hardware problem, an operator can attach a restored replica by changing the handle, with no code change or redeploy of a new build.

## Factor V — Build, release, run: strictly separate build and run stages

### The three stages (a CI/CD pipeline, roughly)

1. **Build.** The pipeline runner takes the code **at a specific commit** (via Git, not FTP or SSH; commits drive every deployment today), fetches dependencies from the manifest (Factor II), compiles if needed, and produces **one executable bundle** called a **build**.
   - Go: a single binary.
   - Node.js: the app plus its `node_modules`.
   - In the container world: an **image**.
   - **Key property: a build contains code + dependencies only, never config.**
2. **Release.** Combine the build with **a specific deploy's config** (production, staging, test, a PR preview). **Release = exact build + exact config, ready to run.** Same build + prod config = production release; same build + staging config = staging release.
3. **Run.** Launch processes from a release in the execution environment.

```mermaid
flowchart LR
    C["Commit abc123"] --> B["BUILD<br/>fetch deps, compile<br/>binary or image"]
    B --> R1["RELEASE v101<br/>build plus prod config"]
    B --> R2["RELEASE staging-55<br/>build plus staging config"]
    CF1["Prod config"] --> R1
    CF2["Staging config"] --> R2
    R1 --> RUN1["RUN<br/>prod processes"]
    R2 --> RUN2["RUN<br/>staging processes"]
```

### Benefit 1: immutable builds make rollbacks instant and free
Releases should be an **append-only ledger**: each release has a unique ID (a timestamp or incrementing number) and **can never be modified once created**. Any change (new code *or* new config) creates a **new** release.

Scenario:
- Afternoon: build commit 97 with current config → **release 100**.
- Two hours later someone rotates the database password → config changed → **release 101** (same build, new config).
- Two hours later new PRs are merged → new build → **release 102** (new build, same config).
- After 102, dashboards light up with errors and users complain in Slack.

Instead of debugging in production while customers wait, you **re-run release 101**. Because builds are immutable, that takes seconds. Once production is stable, you debug release 102 at your own pace.

This works only because **release 101 still means exactly what it meant two hours ago**: same build, same config. Heroku releases, Docker image tags and Kubernetes rollouts all use this pattern.

```mermaid
stateDiagram-v2
    [*] --> R100: build 97 plus config A
    R100 --> R101: password rotated, config B
    R101 --> R102: new code, build 98 plus config B
    R102 --> R101: errors spike, roll back
    R101 --> R103: fixed build 99 plus config B
```

### Benefit 2: no editing code on the server
If code enters the pipeline **only at the build stage**, there is **no path from a running machine back into the build**. Nobody can edit code on a production server even if they try. In the snowflake world, SSH-ing in, hot-patching a file and reloading the server was common, and that is exactly what made production and the repository drift into two different states.

### The rewrite
The only change: **immutability**, implied in 2011, is now **explicit and mandatory**. Each release must be a **unique, immutable snapshot**.

> [!INTERVIEW]
> **"How do you roll back a bad deploy quickly?"** Keep builds immutable and releases versioned (build + config, append-only). Rolling back is just re-running the previous release (e.g. redeploying the previous image tag), which takes seconds, rather than rebuilding or patching. Database migrations need to be backward compatible for this to be safe.

## Factor VI — Processes: execute the app as one or more stateless processes

### The rule
The app runs as processes that **do not remember anything between requests** (stateless) and **share nothing**: no shared memory, no shared disk. Anything that must persist goes into a **stateful backing service** (Factor IV), e.g. the database.

Design with two assumptions:
1. **Any request can be served by any process.**
2. **Any process can disappear at any moment.**

Statelessness is what makes horizontal scaling possible: you can add or remove copies freely.

### What is a process allowed to hold?
Memory and local disk are fine as a **single-transaction cache**. Example: download a file, process it in a temp directory, write the result to the database. The temp file is fine because nothing after that transaction expects it to exist, and temp directories disappear anyway. It becomes a problem the moment **a future request or future process depends on that file or memory being there**.

### Sticky sessions: an explicit violation
Scenario:
1. The app stores the logged-in **session in process memory**. Works perfectly on one instance.
2. You scale to **three instances behind a load balancer**.
3. A user logs in on instance 1. The next request goes to instance 2, which has never heard of them → error → user is **randomly logged out**.

The workaround people invented: **sticky sessions**, where the load balancer remembers which instance each user belongs to and always routes them there.

The twelve-factor document says sticky sessions are a **violation, never to be used**, because they defeat the point of having multiple instances:
- If an instance dies (traffic, corruption, deploy), **all its users are logged out** at once.
- If you add an instance to handle load, it **receives no existing users**; it only helps new ones.

**Fix:** session data is state, and **state goes into a backing service**: Redis, Postgres or another store, chosen by latency needs.

```mermaid
sequenceDiagram
    participant U as User
    participant LB as Load balancer
    participant I1 as Instance 1
    participant I2 as Instance 2
    participant R as Redis session store
    U->>LB: POST /login
    LB->>I1: forward
    I1->>R: SET session abc
    I1-->>U: Set-Cookie sid=abc
    U->>LB: GET /me with sid=abc
    LB->>I2: forward to another instance
    I2->>R: GET session abc
    R-->>I2: user 42
    I2-->>U: 200 OK
```

### Exception: when the feature itself is state (WebSockets)
A **WebSocket connection** lives in one process's memory; only that instance can push to that user. That breaks pure statelessness. The workaround (from the real-time chapter) is **pub/sub**: every event is published to a broker (e.g. Redis pub/sub) and whichever instance holds the user's socket subscribes and delivers it.

The speaker's view: **statelessness is the default everywhere**, but you are allowed to bend it when **the feature itself is the state** (real-time connections), while keeping all *durable* data in backing services.

> [!IMPORTANT]
> **Rule of thumb:** if you cannot kill any process at any moment without a user losing data, you have state in a place it does not belong.

### Halfway recap
After six factors the app: lives in one repo; declares and isolates all dependencies; keeps every difference between deploys in the environment; attaches all its neighbors through handles; reaches production through build → release → run; and runs as **disposable, forgetful processes**.

## Factor VII — Port binding: export services via port binding

### The historical problem
In 2011, a PHP app did not run by itself. **Apache** ran, and the PHP app was a module loaded inside it. A Java app did not run by itself either; **Tomcat** ran, and the app was a WAR file dropped into Tomcat's folder. The web server was the program; your app was a **guest** inside it. That meant the web server's version and configuration were part of your app's runtime environment, i.e. part of the physical server: back to **erosion**.

### The rule
The app is **completely self-contained**: it brings its **own HTTP server as a library** (declared through the Factor II manifest), and **exports itself as a service by binding to a port** and listening for connections.

```ts
import express from "express";
const app = express();
app.get("/health", (_req, res) => res.send("ok"));
app.listen(Number(process.env.PORT ?? 8080)); // the app IS the server
```

```go
http.ListenAndServe(":"+os.Getenv("PORT"), router)
```

Today this is the most obvious pattern: Go services commonly bind `:8080`, Node services `3000`/`4000`/whatever is free, and databases bind their own default ports. Locally you hit `http://localhost:8080`; in production a **routing layer / reverse proxy** maps the public hostname to the port your process binds.

### Consequence: any app can be a backing service for another
Because everything is "a process on a port", your database, cache, email service etc. all bind ports on localhost during development; in production you just swap the handles for URLs pointing at someone else's port on someone else's computer. The same pattern all the way through.

```mermaid
flowchart LR
    U["Internet user"] --> RP["Reverse proxy or router<br/>api.example.com"]
    RP --> P1["App process<br/>binds :8080"]
    P1 --> DB["Postgres :5432"]
    P1 --> RD["Redis :6379"]
    P1 --> OS["Other service<br/>binds :9000"]
```

### What aged: serverless
An **AWS Lambda** function does not bind a port; the platform **invokes an exported function**. In 2011, long-running 24/7 port-bound servers were expected to be the permanent pattern. They remain the most common, but serverless is a whole category with no long-running, port-bound server.

So the rewrite keeps port binding in the headline but generalizes the principle: the app must be **self-contained and export its service through a declared interface**. That covers both a long-running port-bound server and a function exported to a serverless platform.

## Factor VIII — Concurrency: scale out via the process model

### The historical problem
In 2011 every runtime scaled its own way:
- **Java:** one huge JVM process grabs a big block of RAM at startup and multiplexes internally with **threads**.
- **PHP:** the opposite; Apache spawns small **child processes on demand**.

### The rule
Make the **process a first-class citizen**: design the app from the start so it scales by running **more processes**. This is inspired by the **Unix process model** for service daemons.

### Process types
Different kinds of work get different **process types**:
- **web**: handles HTTP requests.
- **worker**: heavy background jobs (video encoding, image resizing).
- **scheduler / clock**: time-based jobs (e.g. "email every user at midnight").

Each type **scales independently** by running more copies.

### Example: food delivery app
Assume each process uses ~500 MB of RAM.

| Time | Web needed | Worker needed | One combined process type | Split process types |
|---|---|---|---|---|
| Lunch peak | 10 | 2 | 10 copies × 500 MB = **5 GB**, plus ~5 GB of idle worker capacity scaled along with it ≈ **10 GB** | 10 web + 2 worker = **6 GB** |
| Night (batch jobs) | 5 | 20 | Must scale everything together | 5 web + 20 worker |

If web and worker are bundled in one process, scaling web to 10 at lunch drags 10 copies of the worker along; that extra capacity sits idle. Split them and you pay only for what each workload needs.

### Process formation
The set of process **types and counts** (e.g. `web=3, worker=2`) is called the **process formation**. You see it today in a **Procfile** and in a **Kubernetes Deployment** as `replicas: 3`.

```text
# Procfile
web: ./bin/server
worker: ./bin/worker
scheduler: ./bin/cron
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-web
spec:
  replicas: 3
```

```mermaid
flowchart TD
    F["Process formation<br/>declared in Procfile or k8s"] --> W["web x10 at lunch"]
    F --> K["worker x2 at lunch"]
    F --> S["scheduler x1"]
    W --> LB["Load balancer"]
    K --> Q["Job queue"]
    S --> Q
```

### Notes
1. **Threads are still allowed inside a process.** JVM threads, Go goroutines, the Node event loop are all fine for in-process concurrency. But **the unit of scaling is the process**, not threads, because one machine can only grow so far (vertical scaling has limits), while share-nothing processes scale across many machines without a second thought.
2. **A twelve-factor app never daemonizes itself and never writes PID files.** Managing the process lifecycle (start, restart, keep N running) is the **platform's job**: the OS process manager (systemd), Kubernetes, or a process manager such as Foreman/Overmind. The app just runs in the **foreground** and does its work.

### How it aged
Practically the whole internet now runs on orchestrators (Kubernetes or similar). You **declare a formation** and the platform maintains it: kills, starts, restarts and reschedules containers. The factor did not become outdated; it was **adopted so deeply** that you rarely think about it, unless you deploy directly on a VM with systemd, in which case it fully applies.

## Factor IX — Disposability: maximize robustness with fast startup and graceful shutdown

Processes must be **disposable**: startable or stoppable **at a moment's notice**, with nothing bad happening either way. (Graceful shutdown is covered in depth in the graceful-shutdown chapter; here is the twelve-factor angle.)

### Why disposability matters
Who starts and stops your processes now? The **platform**:
- Horizontal scaling starts new processes at any moment.
- Every deployment kills old processes and starts new ones from the new image.
- The orchestrator moves processes between machines whenever it wants.

Deploy 5 times a week across 10 instances → **50 stops and 50 starts** per week, from deployments alone. **A process dying is a normal part of the release lifecycle, not an incident.**

### Fast startup
If boot takes **60 seconds**, a rolling deploy of 10 instances takes ~**10 minutes**, and an autoscaler reacts **a minute late** to every traffic spike. If boot takes **2 seconds**, both are negligible. The factor asks for startup in **a few seconds**.

### Graceful shutdown (on SIGTERM)

**Web process:** on `SIGTERM`:
1. Stop accepting new requests (stop listening / fail readiness).
2. Finish in-flight requests.
3. Close resources (DB pool etc.) and exit.

Without this, every deployment produces errors for the requests that were in flight.

**Worker process:** graceful means **returning the current job to the queue** instead of discarding it.

```go
srv := &http.Server{Addr: ":" + os.Getenv("PORT"), Handler: router}
go srv.ListenAndServe()

stop := make(chan os.Signal, 1)
signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
<-stop

ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
defer cancel()
srv.Shutdown(ctx) // stops accepting, waits for in-flight requests
db.Close()
```

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant P as Web process
    participant C as Clients
    O->>P: SIGTERM
    P->>P: Stop accepting new connections
    C->>P: In-flight requests continue
    P-->>C: Responses for in-flight requests
    P->>P: Close DB pool and flush logs
    P-->>O: Exit 0 within grace period
    Note over O,P: If still running after the grace period, SIGKILL
```

### Re-entrancy: making "put the job back" safe
Returning a job to the queue assumes the job can be **safely run again**. That property is **re-entrancy**: a job interrupted mid-way must not leave dirty state that causes problems when it runs again. Two ways to get it:
- **Wrap the processing in a database transaction**, so an interruption rolls everything back.
- **Make the operation idempotent**: running it multiple times produces the same result as running it once (e.g. it detects it already did the work and skips).

### Robustness against sudden death
`SIGTERM` is the **polite** case: you typically get a grace period (~30 seconds in Kubernetes by default) to wrap up. But hardware fails, and a process that uses too much memory gets **OOM-killed** with no warning (effectively `SIGKILL`). So design so that **any process can die mid-instruction** without corrupting anything.

The document points to **crash-only design**: if your system survives crashes correctly, you do not strictly need a separate graceful-shutdown path, because **the crash path is the shutdown path**.

> [!WARNING]
> Graceful shutdown is an optimization for the common case, not a correctness guarantee. Correctness must come from transactions, idempotency and durable queues (with acknowledgments after completion), because `SIGKILL` and power loss give you no chance to clean up.

## Factor X — Dev/prod parity: keep development, staging and production as similar as possible

**Parity** = sameness. The document identifies **three gaps** between development and production:

| Gap | Traditional app | Twelve-factor app |
|---|---|---|
| **Time gap**: code written today reaches prod much later, in big batches | Weeks between deploys | Hours (deploy continuously) |
| **Personnel gap**: different people write, deploy and watch the code | Developers write, ops deploy and see the errors | The developers who write it deploy it and watch its logs |
| **Tools gap**: different stacks in dev vs prod | Mac/Windows laptop with native installs vs Linux servers and external services | As similar as possible |

Shrinking all three makes continuous deployment smooth. The time and personnel gaps are already largely closed today (CI/CD, "you build it, you run it"). The **tools gap still exists**.

### The classic tools-gap trap: SQLite in dev, Postgres in prod
ORMs (Drizzle and Prisma in Node, GORM in Go, SQLAlchemy in Python) abstract the database, so it is tempting to use lightweight **SQLite** locally and **Postgres** in production. But the databases differ in subtle ways:

- In **Postgres**, `LIKE` is **case-sensitive**; `ILIKE` is the case-insensitive version.
- In **SQLite**, `LIKE` is **case-insensitive by default** for ASCII characters.

A search feature built and tested locally on SQLite will silently behave differently in production. **No error, no warning, no log, just different behavior.** That is the most dangerous kind of bug.

```sql
-- Returns 'Alice' on SQLite, returns nothing on Postgres
SELECT name FROM users WHERE name LIKE 'alice%';

-- Explicit and portable intent on Postgres
SELECT name FROM users WHERE name ILIKE 'alice%';
```

**Advice:** use the **same type (and ideally version) of backing services** in development, staging and production. Today that is cheap: one `docker run` or `docker compose up` gives you real Postgres/Redis locally.

### 2026 nuance: managed services reopen the gap
Docker and Docker Compose briefly made local and production nearly identical (same containers). But then teams moved to **managed, proprietary services**. If production uses **AWS DynamoDB**, there is no way to run the real thing locally. Emulators like **LocalStack** (or DynamoDB Local) imitate documented behavior, but they are not the same implementation; you can only replicate what is documented.

There is no blanket rule like "never use managed services". Managed services bring big wins in scaling and cost (not running your own infrastructure). The nuanced takeaway: **use a managed service when its benefits clearly outweigh the cost of having dev and prod differ**, and be aware of the gap you are accepting (cover it with a staging environment that uses the real service).

## Factor XI — Logs: treat logs as event streams

### Reframing what a log is
Historically we think of a log as a **file**. The factor says the file was never the log; it is just one possible destination. **A log is a time-ordered stream of events** that flows for as long as the app runs, with no fixed beginning or end.

### The rule
A twelve-factor app **never concerns itself with routing or storing its log stream**. No log file paths, no log rotation. It **writes every event, unbuffered, to standard output (stdout)**. The **execution environment** captures the stream and decides where it goes: a file, or a **log drain** (an external log service) for storage and analysis.

```ts
// Structured JSON logs to stdout, one event per line
console.log(JSON.stringify({ level: "info", msg: "order created", orderId: 123, ts: new Date().toISOString() }));
```

### Why this division of responsibility?
1. **Deployment is decoupled from logging.** Changing where logs go is a platform/config decision; no code changes per environment. In 2011, stdout went to things like **syslog**; today it goes to **Loki**, **Datadog**, etc. Same pattern.
2. **Streams compose; files do not.**
   - On your laptop: logs appear live in the terminal.
   - In a container: the runtime captures the stream and **stamps each line with which process/container it came from**, then hands it to a collector.
   - In production: the platform **merges the streams of all instances into one time-ordered stream**, so you search by time across every instance instead of SSH-ing into each machine to find the right file.

```mermaid
flowchart LR
    P1["web instance 1<br/>stdout"] --> RT["Container runtime<br/>captures and tags"]
    P2["web instance 2<br/>stdout"] --> RT
    P3["worker 1<br/>stdout"] --> RT
    RT --> COL["Log collector or router"]
    COL --> ST["Loki or Datadog"]
    COL --> ARC["Archive storage"]
    ST --> DEV["Search, dashboards, alerts"]
```

### Modern view: observability
Today we have **observability** = **logs + metrics + traces**. The 2011 text mentions only logs because metrics and distributed tracing were not common practice then. Treat metrics and traces as **additions**, not as something the factor forbids.

## Factor XII — Admin processes: run admin/management tasks as one-off processes

### What is a one-off process?
A task that runs **once, alongside** the app's long-running processes, and then **exits**. Examples for an HTTP backend:
- Running a **database migration**.
- Running a script to **fix some data** in production.
- Opening a console/REPL against production.

### The rule
One-off admin processes must run in an **identical environment** to the regular processes:
- **same codebase and same commit** (so the deployment ships both together),
- **same config**,
- **same dependency isolation**.

### Why be strict about one-off scripts?
The old way: SSH into the running server and run an `UPDATE` or `DELETE` query by hand. No code review, no process review, no record of what was done. Production drifts away from what the code and docs say.

**Canonical example:** **database migrations** ship with the same code and run as a one-off process **before** the new release starts, then exit.

```bash
# Same image, same config as the app, runs once and exits
kubectl run migrate --rm -it --image=registry/api:v102 --env-from=secret/api-config -- ./bin/migrate up
# Heroku-style
heroku run ./bin/migrate up
```

## Putting it together: a twelve-factor demo

The course's task app backend running on a Linux machine shows several factors at once:

- It is driven by a **Procfile** (a Heroku invention for declaring process types: web, worker, scheduler). Here one process type, `web`.
- A process manager, **Overmind**, starts the **formation** (Factor VIII).
- Boot order: schema check → background job server starts → server **binds the assigned port** (Factor VII), quickly (Factor IX).
- Logs stream to **stdout** (Factor XI).
- In a second terminal pane, a **one-off admin process** (auto-archiving tasks) runs from the same code, config and environment, then exits (Factor XII).
- On **Ctrl-C** (SIGINT): the DB connection pool closes, the job server waits for its workers to finish their jobs, and the process reports a clean exit (Factor IX).

```mermaid
sequenceDiagram
    participant OM as Overmind
    participant W as web process
    participant DB as Postgres
    participant A as One-off archive task
    OM->>W: start from Procfile
    W->>DB: schema check
    W->>W: start job server
    W->>W: bind port and log to stdout
    A->>DB: archive old tasks using same code and config
    A-->>A: exit 0
    OM->>W: SIGINT on Ctrl-C
    W->>W: wait for workers, close pool
    W-->>OM: clean exit
```

## What aged well and what aged badly

| Factor | Verdict today | Modern update |
|---|---|---|
| I Codebase | Obvious; universal with Git | Monorepos are fine (codebase ↔ app is 1:1) |
| II Dependencies | Stronger than ever | Lock files + containers freeze everything incl. OS and runtime |
| III Config | Core idea non-negotiable | Secrets → secret manager, not plain env vars, as you grow |
| IV Backing services | Aged extremely well | Managed DBs, caches, storage are the norm |
| V Build/release/run | Universal in CI/CD | Immutability now explicit and mandatory |
| VI Processes | Still the default | Real-time (WebSockets) bends it; use pub/sub |
| VII Port binding | Universal for servers | Generalized to "declared interface" to include serverless |
| VIII Concurrency | Absorbed by orchestrators | `replicas:` in k8s = process formation |
| IX Disposability | More important than ever | Crash-only design; frequent deploys and autoscaling |
| X Dev/prod parity | Tools gap persists | Managed proprietary services widen it; accept consciously |
| XI Logs | Universal | Extended by metrics and traces (observability) |
| XII Admin processes | Universal (migrations) | `kubectl run`, `heroku run`, one-off jobs |

## Common mistakes & misconceptions

- **"Twelve-factor is about code quality."** No. It is about the app/platform interface. DRY and KISS are not factors.
- **"Monorepos violate Factor I."** No. Copy-pasting the same app or code into two places violates it; many apps in one repo, each treated as its own codebase, is fine.
- **Committing a `.env` file with real secrets.** That fails the open-source test. Commit a `.env.example` with placeholders only.
- **`if (NODE_ENV === "production")` branches for behavior.** Named environments do not scale; use granular config values.
- **Assuming env vars are a secure place for secrets.** They leak via child processes, crash reports, debug pages and `/proc/<pid>/environ`. Use a secret manager as you grow.
- **Baking config into the Docker image.** A build must be config-free so the same image can be promoted from staging to production.
- **Hot-patching code on a server via SSH.** Breaks build/release/run and causes drift.
- **Storing sessions or uploads in process memory or local disk.** Breaks on the second instance; using sticky sessions to "fix" it is itself a violation.
- **Thinking threads are forbidden.** Threads/goroutines/event loops are fine inside a process; the *unit of scaling* is the process.
- **App daemonizes itself or writes PID files.** Let the platform manage the lifecycle; run in the foreground.
- **Relying only on graceful shutdown for correctness.** OOM kills and hardware failures skip SIGTERM; use transactions and idempotency.
- **SQLite in dev, Postgres in prod.** Silent behavioral differences (e.g. `LIKE` case sensitivity).
- **Writing logs to files with app-managed rotation.** Write to stdout; let the platform route them.
- **Running ad-hoc SQL in production by hand.** Use reviewed one-off scripts or migrations from the same codebase and config.

## Interview questions

<details>
<summary><strong>Q: What is the Twelve-Factor App and why should a backend engineer care?</strong></summary>

It is a methodology published by Heroku in 2011 (Adam Wiggins, 12factor.net) with twelve rules for building network services. It defines the contract between an app and the platform that runs it: config from the environment, stateless processes, backing services via URLs, strict build/release/run, port binding, logs to stdout, and so on. Every modern platform (Docker, Kubernetes, Heroku, Render, Cloud Run) assumes these rules, so following them makes an app portable, horizontally scalable, reproducible for new developers and safe to deploy continuously. It was open-sourced in November 2024 and is being modernized by the community.

</details>

<details>
<summary><strong>Q: What exactly is "config" according to twelve-factor, and why store it in environment variables?</strong></summary>

Config is everything that is likely to vary between deploys: database URLs, credentials for backing services, external hostnames, per-deploy settings. Code is identical across deploys; config is what differs. Env vars are preferred because they are easy to change per deploy without editing files, they cannot be committed to Git by accident, and they are an OS-level standard that works with any language. The test: could you open-source the codebase right now without leaking a single credential? Config should also be granular (one variable per value), not grouped into named environments like `staging.rb`.

</details>

<details>
<summary><strong>Q: Are environment variables a good place for secrets? What would you do in a growing company?</strong></summary>

They are much better than committing secrets, and fine for a solo dev or small team using the platform's secret injection. But env vars leak: child processes inherit the whole environment, crash reporters and debug pages dump it, and on Linux it is readable at `/proc/<pid>/environ`. As the team grows, use a secret manager (Vault, AWS Secrets Manager / Parameter Store): the app fetches secrets at startup, keeps them in memory only, and secrets are rotated and audited centrally. Non-secret config can stay in env vars.

</details>

<details>
<summary><strong>Q: Explain the difference between build, release and run. Why keep them strictly separate?</strong></summary>

Build turns a specific commit plus its dependencies into an executable artifact (binary or image) with no config. Release combines that build with a specific deploy's config and gets a unique, immutable ID. Run launches processes from a release. Benefits: (1) releases are an append-only ledger, so rolling back is just re-running a previous release, which takes seconds; (2) code can only enter at the build stage, so nobody can hot-patch a running server, which prevents drift between production and the repo. The same image can be promoted from staging to production with different config.

</details>

<details>
<summary><strong>Q: A user logs in, then gets randomly logged out after you scale from 1 to 3 instances. What is happening and how do you fix it?</strong></summary>

Sessions are stored in process memory. The load balancer sends the next request to a different instance that has no record of the session. Sticky sessions would mask it but are a twelve-factor violation: when an instance dies all its users are logged out, and new instances get no existing users, defeating horizontal scaling. The correct fix is to treat sessions as state and put them in a backing service such as Redis or Postgres (or use self-contained signed tokens), so any instance can serve any request.

</details>

<details>
<summary><strong>Q: What does "treat backing services as attached resources" mean? Give a test for it.</strong></summary>

Any service consumed over the network (database, cache, queue, SMTP, S3, third-party APIs) is accessed via a resource handle, a URL plus credentials stored in config, and the code makes no distinction between a locally run service and a managed third-party one. Test: you can swap a local Postgres container for Amazon RDS, Neon or Supabase by changing only `DATABASE_URL`, with zero code changes. This also allows swapping a failed database for a restored replica without redeploying code.

</details>

<details>
<summary><strong>Q: Why does twelve-factor say to scale via processes and process types rather than threads?</strong></summary>

Different workloads (web requests, background jobs, scheduled tasks) have different load patterns, so they should be separate process types that scale independently. If web and worker live in one process, scaling web for a lunchtime peak also scales idle workers, wasting memory (e.g. 10 GB instead of 6 GB). Threads, goroutines or an event loop are fine inside a process, but one machine has vertical limits; share-nothing processes scale across machines. The declared types and counts are the "process formation", like a Procfile or `replicas: 3` in Kubernetes.

</details>

<details>
<summary><strong>Q: What happens if your service takes 60 seconds to boot? Why does twelve-factor care?</strong></summary>

Processes are started and stopped constantly by deploys and autoscaling (e.g. 5 deploys a week across 10 instances = 50 restarts). A 60-second boot makes a rolling deploy of 10 instances take about 10 minutes and makes the autoscaler react a minute late to traffic spikes, during which users see errors or latency. Disposability asks for startup in a few seconds: lazy-load heavy work, avoid long warm-ups in the critical path, and use readiness probes so traffic arrives only when ready.

</details>

<details>
<summary><strong>Q: Describe graceful shutdown for a web process and for a worker process. What if the process is OOM-killed?</strong></summary>

Web: on SIGTERM, stop accepting new connections, finish in-flight requests within the grace period, close resources like the DB pool, exit. Worker: return the current job to the queue (or stop pulling new jobs and finish the current one) instead of discarding it. Returning a job is only safe if it is re-entrant: wrap the work in a transaction or make it idempotent so a re-run does not duplicate effects. OOM kills and hardware failures give no warning, so the design must be crash-safe ("crash-only design"): durable queues that acknowledge only after completion, transactions, idempotency.

</details>

<details>
<summary><strong>Q: Your search works locally but returns fewer results in production. You use SQLite locally and Postgres in prod. Why?</strong></summary>

This is a dev/prod parity (tools gap) bug. SQLite's `LIKE` is case-insensitive for ASCII by default, while Postgres's `LIKE` is case-sensitive (`ILIKE` is case-insensitive). The ORM hides the difference and nothing errors; behavior just changes. Fix: run the same database engine (and version) locally via Docker, and write explicit queries (`ILIKE` or `lower()` with an appropriate index). Twelve-factor says backing services should be the same type across dev, staging and prod.

</details>

<details>
<summary><strong>Q: Why should an app write logs to stdout instead of to a log file?</strong></summary>

Twelve-factor treats logs as a time-ordered event stream, not a file. The app writes unbuffered events to stdout and never handles routing, file paths or rotation. The platform captures the stream, tags it with the source process/container, merges streams from all instances in time order and ships them to a log store like Loki or Datadog. This decouples logging from code (destination is a platform/config decision), works the same on a laptop, in a container and in a cluster, and avoids hunting for files on many machines. Metrics and traces are modern additions.

</details>

<details>
<summary><strong>Q: How should you run a database migration or a one-time data fix in production?</strong></summary>

As a one-off admin process in an identical environment to the app: same codebase and commit, same config, same dependency isolation, shipped with the release, for example `kubectl run` or `heroku run` with the same image, or a migration job before the new version starts. It runs once and exits. Do not SSH into a server and type ad-hoc `UPDATE`/`DELETE` queries: there is no review, no record, and production drifts from the code.

</details>

<details>
<summary><strong>Q: Does serverless (AWS Lambda) violate the port-binding factor?</strong></summary>

Literally yes, since a Lambda does not bind a port; the platform invokes an exported function. That is why the community rewrite keeps "port binding" as the headline but generalizes the principle: the app must be self-contained and export its service through a declared interface. The underlying goal still holds: the app should not depend on a host-provided web server (like Apache or Tomcat in 2011) whose version and config live outside the app's declared dependencies.

</details>

<details>
<summary><strong>Q: Is a monorepo compatible with Factor I (one codebase, many deploys)?</strong></summary>

Yes. Factor I requires a one-to-one relationship between a codebase and an app. A monorepo that builds five apps is effectively five codebases living in one repository, and each app follows the twelve factors independently. What Factor I forbids is the same app existing in two places, or sharing code by copy-paste; shared code should become a library consumed through the dependency manager.

</details>

## Cheat sheet

| # | Factor | One-liner | Modern form |
|---|---|---|---|
| I | Codebase | One repo per app, many deploys (prod, staging, local, PR previews) | Git; monorepo OK if app ↔ codebase is 1:1 |
| II | Dependencies | Declare everything in a manifest, isolate from the host | Lock files, `npm ci`, Docker images |
| III | Config | Anything that varies per deploy lives in env vars, granular | Secrets in a secret manager, loaded at boot into memory |
| IV | Backing services | DB/cache/queue/SMTP/S3/APIs via URL + creds in config | Swap local Postgres for RDS with zero code change |
| V | Build, release, run | Build = code + deps, release = build + config (immutable, versioned), run = processes | Image tags, k8s rollouts, instant rollback |
| VI | Processes | Stateless, share-nothing; state in backing services | No sticky sessions; sessions in Redis |
| VII | Port binding | App brings its own HTTP server, binds `$PORT` | Serverless: export via declared interface |
| VIII | Concurrency | Scale out with process types (web, worker, clock) | Procfile, `replicas: N` |
| IX | Disposability | Boot in seconds, graceful SIGTERM, survive SIGKILL | Re-entrant jobs, crash-only design |
| X | Dev/prod parity | Close time, personnel and tools gaps | Same DB engine via Docker; accept managed-service gaps consciously |
| XI | Logs | Unbuffered event stream to stdout; platform routes it | Loki/Datadog; plus metrics and traces |
| XII | Admin processes | One-off tasks with same code, config, environment | Migrations as jobs, `kubectl run`, `heroku run` |

- **Code is the same everywhere; config is what differs.**
- **Open-source test:** could you publish the repo now without leaking a credential?
- **Kill test:** can you kill any process at any moment without a user losing data?
- **Swap test:** can you switch `DATABASE_URL` to a managed DB with zero code change?
- **Commit test:** can every environment be described as "same repo at commit X"?
- Env-var leak paths: child processes, crash reporters/debug pages, `/proc/<pid>/environ`.
- Postgres `LIKE` = case-sensitive, `ILIKE` = insensitive; SQLite `LIKE` = case-insensitive for ASCII.
- Postgres default port **5432**.
- Never daemonize or write PID files; run in the foreground.

## Glossary

- **Twelve-Factor App** — Heroku's 2011 methodology for building SaaS/network apps that are portable and scalable.
- **PaaS (Platform as a Service)** — A platform that takes your code and handles building, config, networking and running it (e.g. Heroku).
- **Snowflake server** — A hand-configured, unique server that cannot be reliably reproduced.
- **Software erosion** — Gradual breakage of an app without code changes, due to environment drift.
- **Deploy** — One running instance of the app (production, staging, a laptop, a PR preview).
- **Manifest** — File declaring dependencies (`package.json`, `go.mod`, `Gemfile`, `requirements.txt`).
- **Lock file** — File pinning exact versions of all direct and transitive dependencies (`package-lock.json`, `go.sum`).
- **Dependency isolation** — Ensuring the app uses only its declared dependencies, nothing leaked from the host system.
- **Vendoring** — Bundling a dependency (library or tool) with the app instead of relying on the host.
- **Config** — Everything that varies between deploys.
- **Secret manager** — Service that stores, rotates and audits credentials (Vault, AWS Secrets Manager, Parameter Store).
- **Backing service** — Any service consumed over the network (DB, cache, queue, SMTP, object storage, third-party API).
- **Attached resource** — A backing service treated as swappable and reached via a resource handle.
- **Resource handle** — URL plus credentials used to reach a backing service.
- **Build** — Executable artifact from a commit plus dependencies, without config.
- **Release** — A build combined with a deploy's config; unique ID, immutable.
- **Append-only ledger** — Releases are only ever added, never modified.
- **Stateless process** — A process that keeps no data between requests that later requests depend on.
- **Sticky session** — Load balancer pinning a user to one instance; a twelve-factor violation.
- **Port binding** — The app embeds its own server and exports its service by listening on a port.
- **Process type** — A class of process for a kind of work (web, worker, scheduler).
- **Process formation** — The set of process types and their counts (e.g. `web=3 worker=2`).
- **Procfile** — Heroku-originated file declaring process types and their commands.
- **Daemonize** — A process detaching itself into the background; twelve-factor apps must not.
- **Disposability** — Ability to start or stop a process at any time quickly and safely.
- **Graceful shutdown** — On SIGTERM, stop taking new work, finish current work, release resources, exit.
- **Re-entrancy** — A job can be interrupted and safely run again without leaving dirty state.
- **Idempotency** — Running an operation multiple times has the same effect as running it once.
- **Crash-only design** — Designing so the crash path is safe, making it also the shutdown path.
- **Dev/prod parity** — Keeping development, staging and production as similar as possible.
- **Log drain** — An external service that receives and stores a log stream.
- **Observability** — Understanding system behavior via logs, metrics and traces.
- **One-off admin process** — A task (migration, data fix) run once in the app's environment, then exits.

## Video timestamps

- [00:00](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=0s) — Where all the backend rules come from: the twelve-factor contract
- [03:10](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=190s) — Scope: services, not desktop/mobile apps or code-quality principles
- [05:17](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=317s) — Heroku, Platform as a Service and who wrote the document
- [07:23](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=443s) — Deploying in 2011: snowflake servers
- [10:28](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=628s) — "Works on my machine" and software erosion
- [12:36](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=756s) — 2024 open-sourcing and the community rewrite
- [14:44](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=884s) — Factor I: one codebase, many deploys
- [19:58](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=1198s) — Monorepos and Factor I
- [21:06](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=1266s) — Factor II: declare dependencies (manifests and lock files)
- [24:10](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=1450s) — Dependency isolation and system tools (ImageMagick example)
- [27:22](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=1642s) — Containers solve Factor II, intro to Factor III
- [28:24](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=1704s) — Factor III: what counts as config, the open-source test
- [30:35](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=1835s) — Why environment variables, Tasker config example
- [33:45](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=2025s) — Do not group config into named environments
- [34:49](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=2089s) — Secrets in env vars: the controversy and secret managers
- [37:56](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=2276s) — Factor IV: backing services as attached resources
- [41:03](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=2463s) — Anatomy of a resource handle and how the factor aged
- [42:06](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=2526s) — Factor V: build, release, run
- [46:23](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=2783s) — Releases as an append-only ledger, instant rollbacks
- [48:27](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=2907s) — No path from running server back to the build
- [49:30](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=2970s) — Factor VI: stateless, share-nothing processes
- [52:34](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=3154s) — Sticky sessions and why they are a violation
- [54:41](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=3281s) — Sessions in backing services, the WebSocket exception
- [56:49](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=3409s) — Recap of the first six factors
- [57:50](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=3470s) — Factor VII: port binding (Apache, Tomcat history)
- [1:00:57](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=3657s) — Serverless and the rewrite of Factor VII
- [1:01:57](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=3717s) — Factor VIII: concurrency via the process model
- [1:04:03](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=3843s) — Process types and the food-delivery scaling example
- [1:07:13](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=4033s) — Process formation, threads, never daemonize
- [1:09:19](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=4159s) — Factor IX: disposability, fast startup
- [1:12:26](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=4346s) — Graceful shutdown for web and worker processes
- [1:14:31](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=4471s) — Re-entrancy, transactions and idempotency
- [1:15:35](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=4535s) — Sudden death, OOM kills and crash-only design
- [1:16:38](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=4598s) — Factor X: dev/prod parity and the three gaps
- [1:19:42](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=4782s) — SQLite vs Postgres LIKE pitfall
- [1:21:50](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=4910s) — Managed services (DynamoDB, LocalStack) and the parity gap
- [1:23:57](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=5037s) — Factor XI: logs as event streams
- [1:27:03](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=5223s) — Why streams compose, observability
- [1:29:11](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=5351s) — Factor XII: one-off admin processes
- [1:31:12](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=5472s) — Demo: Procfile, Overmind, one-off task, clean shutdown
