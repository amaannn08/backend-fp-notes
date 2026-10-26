---
title: "Mastering Databases with Postgres"
slug: "databases-postgres"
order: 12
videoId: "F7Vwp2Xo5Do"
duration: "2:45:30"
module: "Data Layer"
difficulty: "intermediate"
summary: "Why backends need disk-based databases and a DBMS, relational vs non-relational, why Postgres, every Postgres data type a backend engineer uses, migrations and seeding, schema design with keys, constraints and relationships, writing real API queries (joins, parameterized queries, dynamic filter, sort and pagination), triggers, and indexes."
tags: ["databases", "postgres", "sql", "schema-design", "migrations", "indexes", "constraints", "joins", "sql-injection", "triggers", "transactions"]
prerequisites: ["rest-api-design"]
interviewWeight: 5
---

## TL;DR
- A **database** is any persistent, structured store that supports **CRUD**. In backend work "database" means a **disk-based** store, because disk is cheap and large. RAM is fast but small and expensive, so RAM is used for caches like Redis.
- A **DBMS** organises data, gives you efficient CRUD access, enforces **integrity** (data stays valid and consistent), handles **concurrency** and provides **security**. Plain text files fail at parsing speed, structure and concurrent updates.
- **Relational** databases (Postgres, MySQL, SQL Server) store rows in tables with a strict, predefined schema and use SQL. **Non-relational** databases (MongoDB) store flexible documents in collections. Postgres is a sensible default: it is open source, follows the SQL standard, is extensible and reliable, and has excellent **JSONB** support for dynamic data.
- Data type rules: use `BIGSERIAL` or `UUID` for ids, `DECIMAL/NUMERIC` for money (never float), `TEXT` over `VARCHAR(255)` in Postgres, `TIMESTAMPTZ` for timestamps, `JSONB` over `JSON`, `ENUM` types for fixed value sets.
- Schema changes go through **migrations**: versioned SQL files with **up** and **down** sections, applied by a tool such as dbmate or golang-migrate. The tool records the applied version in a `schema_migrations` table. **Seeding** fills dev databases with test data.
- Integrity comes from **constraints**: `PRIMARY KEY` (implies NOT NULL + UNIQUE), `NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY` with `ON DELETE RESTRICT / CASCADE / SET NULL / SET DEFAULT`. Relationships: **1:1** (FK is also the PK), **1:N** (FK on the "many" side), **M:N** (a linking table with a composite PK).
- API queries: start writing from `FROM`, use `LEFT JOIN` when the related row may be missing, `to_jsonb()` to embed rows, always `ORDER BY`, and **always use parameterized queries** to prevent SQL injection. Sort columns must be whitelisted because identifiers cannot be parameters.
- **Indexes** are sorted lookup structures (B-trees) that turn full-table sequential scans into fast lookups. Index columns that appear in `WHERE`, `JOIN` and `ORDER BY` of frequent queries. Primary keys are indexed automatically, **foreign keys are not**. Every index adds write overhead. **Triggers** automate things like keeping `updated_at` current.

## Why this matters
Almost every backend request ends in a database call. If you model the data badly, pick the wrong types, skip constraints, forget indexes or build SQL by string concatenation, you get corrupt data, slow endpoints and security holes, and you get them at scale and in production. Interviewers know this, which is why databases are the most heavily tested backend topic: schema design, keys and relationships, joins, indexes, SQL injection, ACID and isolation come up again and again. This chapter builds the whole picture from first principles and then walks through a real schema for a project-management app.

## Why do we need databases? Persistence

**Persistence** means storing data so it survives after the program that created it stops. Take a to-do app. You add items, tick some off, close the app, and when you reopen it the list is exactly as you left it. That state must hold after hours, across restarts, and even when you open it from another device or location. Without persistence you would start from an empty list every time.

### What counts as a "database"?
The term is very broad. In the loosest sense, **any structured storage** is a database:
- Your phone's contact list.
- The browser's **localStorage** (a key-value store), **sessionStorage** and **cookies**. Open DevTools → Application on a site like Excalidraw and you will see its key-value entries.
- Even a plain text file where you jot notes.

The common pattern is a **persistent system that lets you Create, Read, Update and Delete (CRUD) data**.

### Databases in a backend context are disk-based
When backend engineers say "database" they mean a **disk-based** database, stored on HDDs or SSDs (secondary storage). The reason is a trade-off between cost, capacity and speed:

| | RAM (primary memory) | Disk: HDD/SSD (secondary memory) |
|---|---|---|
| Speed | Very fast | Much slower (how data is laid out and fetched) |
| Cost per GB | High | Low |
| Typical size | 8–128 GB | 512 GB – several TB |
| Survives power-off | No (volatile) | Yes |
| Used for | Caches (Redis, in-memory caches) | Databases (Postgres, MySQL, MongoDB) |

Databases care most about **capacity** and can accept some loss of speed, so traditional relational and non-relational databases keep their data on disk. Caches such as Redis keep data in RAM because their job is speed. How databases lay data out on disk (pages, storage engines, algorithms) is a deep topic. At the application level you only need this split: **cache = RAM, database = disk**.

```mermaid
flowchart LR
    CPU["CPU"] --> RAM["RAM - primary memory<br/>fast, small, costly"]
    CPU --> DISK["Disk - HDD or SSD<br/>slower, large, cheap"]
    RAM --> CACHE["Caches: Redis, in-memory"]
    DISK --> DBS["Databases: Postgres, MySQL, MongoDB"]
```

> [!NOTE]
> Disk-based databases still use RAM heavily. Postgres keeps frequently used pages in a memory buffer cache (`shared_buffers`) plus the OS page cache. The **source of truth**, the thing that makes data durable, is on disk.

## Database Management Systems (DBMS)

Writing bytes to disk is not enough. You also need efficient ways to find, change and delete data across hundreds of gigabytes, for many users at once. A **DBMS** is the software whose job is to **store data and provide efficient operations on it**, mainly CRUD. It also handles security, scaling, replication and more.

Core responsibilities:
1. **Data organization**: lay data out so creates, reads and updates stay efficient.
2. **Access**: provide methods (a query language, a wire protocol) for CRUD.
3. **Integrity**: keep data **accurate, valid and consistent**. Example: an e-commerce `orders` table stores `payment_amount` as a number. If someone tries to insert the string `"something"` into it, the DBMS must reject it.
4. **Security**: protect data from unauthorized access with users, roles and permissions.

### Why not just use text files?
Before DBMSs existed, people stored data in files. That runs into three problems:

1. **Parsing is slow and error-prone.** To find one customer you must read the file, split it into lines, split each line into fields and compare them. This work happens in application code, which is slower in languages like JavaScript, Python or Ruby. Every lookup is a full scan, and a parsing bug can corrupt data or return wrong results.
2. **No structure.** A text file accepts anything. You cannot enforce "this field is always a number", so you cannot guarantee consistency.
3. **No concurrency control.** Two users update the same value at the same time:

```mermaid
sequenceDiagram
    participant A as User A
    participant F as Text file
    participant B as User B
    A->>F: read amount (40)
    B->>F: read amount (40)
    A->>A: 40 + 20 = 60
    B->>B: 40 - 20 = 20
    A->>F: write 60
    B->>F: write 20
    Note over F: Final value is 20 or 60 depending on timing.<br/>Correct answer is 40. One update is lost.
```

This is the **lost update** problem. The result depends on CPU scheduling and many other factors, so it is non-deterministic. A DBMS provides **concurrency mechanisms** (locks, transactions, MVCC) so concurrent modifications produce a consistent result. A text file cannot do that.

> [!INTERVIEW]
> **"Why use a database instead of files?"** Files give you no query engine, so every lookup is a full parse. They enforce no schema or integrity rules, offer no safe concurrent writes (lost updates), and have no transactions, crash recovery, indexing or access control. A DBMS solves all of these.

## Types of DBMS: relational vs non-relational

### Relational databases
A **relational database** organizes data into **tables** made of **rows** and **columns**. Relationships between tables are expressed with **foreign keys**. Key properties:
- **Predefined, strict schema.** Before inserting anything you define the table, every column and every column's data type. You cannot add fields on the fly.
- That strictness buys **data integrity**: at any moment you know each column's type, how the tables relate, and that the data is in a consistent, accurate state.
- You interact with them using **SQL** (Structured Query Language).
- Examples: **PostgreSQL, MySQL, SQL Server, SQLite, Oracle**.

### Non-relational (NoSQL) databases
They do not force a schema. MongoDB, the best-known example, stores **documents** (JSON-like) in **collections**. Two documents in one collection can have completely different shapes.

| Relational term | MongoDB term |
|---|---|
| Table | Collection |
| Row | Document |
| Column | Field |
| Schema enforced by the DB | Schema usually enforced by the application (if at all) |

The flexible schema is NoSQL's main **advantage** and sometimes its main **disadvantage**:
- **Pro:** you can move fast when prototyping without designing, enforcing or migrating a schema.
- **Con:** without database-level constraints and relationships it is **easy to introduce inconsistencies**. Integrity checks move into application code, which changes often and breaks easily.

### Choosing by use case
- **CRM (Customer Relationship Management)**: contacts, sales opportunities, relationships between customers. This critical, highly related data needs strong integrity and complex relational queries, so a **relational** database like Postgres fits.
- **CMS (Content Management System)** such as Sanity, feeding a blog: authors write articles (often Markdown) containing images, code blocks, YouTube embeds and so on. The content is unstructured and you cannot know every shape in advance, so a **document** store like MongoDB is a natural fit.

```mermaid
flowchart TD
    Q1["Is the data highly structured<br/>with relationships?"] -->|"Yes"| REL["Relational: Postgres"]
    Q1 -->|"No, shape varies"| Q2["Is that only part of the data?"]
    Q2 -->|"Yes"| PGJ["Postgres with JSONB columns"]
    Q2 -->|"Almost all of it"| DOC["Document DB: MongoDB"]
    REL --> NOTE1["Strong integrity, joins, constraints"]
    DOC --> NOTE2["Flexible schema, integrity in app code"]
```

| | Relational (SQL) | Non-relational (NoSQL, document) |
|---|---|---|
| Data model | Tables, rows, columns | Collections, documents |
| Schema | Strict, predefined | Flexible, per document |
| Integrity | Enforced by the DB (constraints, FKs) | Mostly the application's job |
| Relationships | First-class (FKs, JOINs) | Embedding or manual references |
| Query language | SQL | DB-specific API |
| Good for | CRMs, finance, e-commerce, most SaaS | CMS content, prototypes, highly variable data |
| Examples | Postgres, MySQL, SQL Server | MongoDB |

### Why Postgres?
Most mainstream databases have similar features and all of them scale in production, so you need a default. Postgres is the sensible pick:
1. **Open source and free.** It is not proprietary, so companies can self-host on their own servers.
2. **Follows the SQL standard closely.** Standard SQL you write runs the same way on MySQL or SQL Server with minor changes, so migrating later is feasible.
3. **Extensible and feature-rich.** The documentation runs to about 1,400 pages and covers nearly every SaaS use case, and a strong **extension** system (PostGIS, pg_trgm, pgvector and others) lets you customize it.
4. **Reliable and scalable.**
5. **Excellent JSON support.** The main reason to reach for MongoDB is "store any JSON". Postgres has `JSON`/`JSONB` types with good indexing (GIN) and query operators, so you rarely need a separate database for dynamic data. Store the unstructured CMS content in a JSONB column and keep everything else relational.

> [!TIP]
> Benchmarks claiming "MySQL is faster" only matter when you serve millions of users and have identified a specific bottleneck. For nearly all projects, Postgres's features and JSONB support make it the right first choice.

> [!NOTE]
> **SQL** is the language. **Postgres** is the database system that executes it. This chapter skips SQL basics (`CREATE TABLE`, `SELECT`, `ORDER BY`, `GROUP BY` and so on), which you should learn from any SQL or Postgres basics course, and focuses on what matters for backend systems. Demos use **TablePlus**, a GUI database client.

## Postgres data types

```sql
CREATE TABLE data_types_demo (
    id            SERIAL PRIMARY KEY,
    small_num     SMALLINT,
    normal_num    INTEGER,
    big_num       BIGINT,
    price         DECIMAL(10, 2),
    exact_num     NUMERIC(10, 2),
    approx_real   REAL,
    approx_double DOUBLE PRECISION,
    fixed_code    CHAR(10),
    name_vc       VARCHAR(255),
    description   TEXT,
    is_active     BOOLEAN,
    birth_date    DATE,
    start_time    TIME,
    created_ts    TIMESTAMP,
    created_tstz  TIMESTAMPTZ,
    duration      INTERVAL,
    external_id   UUID,
    raw_json      JSON,
    doc           JSONB,
    tags          TEXT[],
    ip            INET,
    mac           MACADDR,
    location      POINT,
    xml_data      XML
);
```

### Auto-incrementing integers: SERIAL / BIGSERIAL
`SERIAL` is an integer column that **auto-increments**. If you omit it in an `INSERT`, Postgres fills in the next value: 1, 2, 3, … (sequences start at 1). Under the hood it creates a **sequence** and sets the column default to `nextval(...)`. `BIGSERIAL` is the same thing on `BIGINT`, so it holds far larger values. Production tables that use integer IDs as the **primary key** (the unique identifier of a row) should use `BIGSERIAL` so they never run out.

> [!NOTE]
> Modern Postgres prefers the SQL-standard identity syntax: `id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`. It behaves like BIGSERIAL but has cleaner ownership and permission semantics.

### Integers
| Type | Size | Range |
|---|---|---|
| `SMALLINT` | 2 bytes | −32,768 to 32,767 |
| `INTEGER` | 4 bytes | about ±2.1 billion |
| `BIGINT` | 8 bytes | about ±9.2 × 10^18 |

Capacity order is **SMALLINT < INTEGER < BIGINT**. Choose by the largest value you need.

### Exact vs approximate numbers: DECIMAL/NUMERIC vs REAL/DOUBLE
`DECIMAL` and `NUMERIC` are identical in Postgres. `DECIMAL(p, s)` means **precision** `p` = total significant digits, and **scale** `s` = digits after the decimal point. So `DECIMAL(10, 2)` stores up to 10 digits, 2 of them after the point: `12345678.90` fits, but `123456789.90` (11 digits) does not.

`REAL`, `DOUBLE PRECISION` (and `FLOAT`) are **floating-point** types. They are stored in binary IEEE-754 format, so many decimal values (like 0.1) cannot be represented exactly. Calculations then pick up tiny errors, and results can differ across systems.

| | DECIMAL / NUMERIC | REAL / DOUBLE PRECISION |
|---|---|---|
| Representation | Exact decimal | Approximate binary floating point |
| Speed | Slower | Faster (hardware-supported) |
| Use for | **Money, prices, balances**, anything that must be exact | Measurements, areas, scientific data where tiny errors are fine |

```sql
SELECT 0.1::double precision + 0.2::double precision;  -- 0.30000000000000004
SELECT 0.1::numeric + 0.2::numeric;                    -- 0.3
```

> [!IMPORTANT]
> **Never store money in floating-point types.** Use `DECIMAL/NUMERIC`, or store integer minor units (paise or cents) in a `BIGINT`. Use floats where tiny representation errors do not matter and speed does, as in scientific computing.

### Strings: CHAR vs VARCHAR vs TEXT
- `CHAR(n)`: **fixed length**. Storing `'ab'` in `CHAR(10)` pads it with 8 trailing spaces. Use it only when every value really has the same length, e.g. two-letter weekday codes `CHAR(2)` ('MO', 'TU', 'WE').
- `VARCHAR(n)`: **variable length up to n**. `'ab'` takes 2 characters with no padding. Inserting more than `n` characters gives a database error.
- `TEXT`: variable length with **no declared limit** (Postgres caps a single field at about 1 GB, far more than you will need).

Rules:
1. **Never use `CHAR`** unless the length is genuinely fixed.
2. **In Postgres prefer `TEXT` over `VARCHAR(n)`.** The official Postgres docs say there is no performance difference between them. `TEXT` can be indexed just fine. The beliefs that "VARCHAR is faster" and "TEXT can't be indexed" come from other databases (MySQL, SQL Server, SQLite) with different internals.
3. `VARCHAR(255)` is a **MySQL habit** (255 has historical meaning there, tied to the length byte). In Postgres, 255 is an arbitrary number, but it *looks* meaningful. A new team member reading the migration will waste time working out why 255.
4. A hard length limit in the schema means that raising it later requires a **migration** on a possibly large table. Avoid migrations where you can.
5. Backend engineers talk to the database through a **driver/ORM** from application code, so enforce length limits in **application validation**. That keeps migrations simple to read and maintain.

> [!TIP]
> If you do want the database to enforce a maximum length, `TEXT` plus `CHECK (char_length(col) <= 500)` documents the rule explicitly, and changing it later only means swapping a constraint.

### Boolean, date and time
- `BOOLEAN`: `true` / `false` (and `NULL` if the column allows it).
- `DATE`: a calendar date only (`2024-05-01`).
- `TIME`: time of day in hours, minutes and seconds.
- `TIMESTAMP`: date + time **without** time zone.
- `TIMESTAMPTZ` (`timestamp with time zone`): date + time with time zone handling. **Use this for event times** like `created_at`.
- `INTERVAL`: a duration, e.g. `'10 days'`, `'1 week'`.

> [!NOTE]
> Precisely, `TIMESTAMPTZ` does not store the original time zone. Postgres converts the input to UTC on write and converts it to the session's time zone on read. That is exactly what you want for event times: a single unambiguous instant.

### UUID
`UUID` is a native 128-bit type, e.g. `550e8400-e29b-41d4-a716-446655440000`. UUIDs are a popular primary-key choice because they are **globally unique**: they can be generated anywhere (even client-side), do not reveal row counts, and are not guessable like `1, 2, 3`. Postgres generates them with `gen_random_uuid()` (built in since v13).

| | BIGSERIAL / identity | UUID |
|---|---|---|
| Size | 8 bytes | 16 bytes |
| Guessable / enumerable | Yes (`/users/42`) | No |
| Generate outside the DB | No | Yes |
| Index locality | Excellent (always increasing) | Random v4 values scatter inserts. UUIDv7 is time-ordered and fixes this |

### JSON vs JSONB
- `JSON` stores the **text as-is**: whitespace, key order and duplicate keys are all preserved, and it is re-parsed on every access.
- `JSONB` ("JSON binary") is **parsed and stored in a decomposed binary format**. Writes are slightly slower, but reads and queries are much faster, and it supports **GIN indexes** and operators like `@>`, `?`, `->`, `->>`.
- JSONB is a Postgres feature, not part of the SQL standard. **Default to JSONB.**

```sql
SELECT doc->>'title' FROM articles WHERE doc @> '{"published": true}';
CREATE INDEX idx_articles_doc ON articles USING GIN (doc);
```

### Arrays and other types
- **Arrays** of any type: `INTEGER[]`, `TEXT[]`, `JSONB[]`, `DATE[]`.
- Network types `INET`, `CIDR`, `MACADDR`, geometric types like `POINT`, and `XML`. These are rarely used day to day, so check the docs when you need one.

### Inserting data
```sql
INSERT INTO data_types_demo (small_num, normal_num, big_num, price, is_active,
                             created_tstz, duration, external_id, doc, tags)
VALUES (32000, 2000000000, 9000000000000000000, 12345678.90, true,
        '2024-05-01 10:30:00+05:30', '10 days', gen_random_uuid(),
        '{"title": "Hello", "published": true}', ARRAY['a', 'b']);
```
List the columns, then supply the values **in the same order**. JSON and JSONB inputs look identical, but Postgres serializes JSONB into its binary format for faster processing and retrieval.

## Database migrations

### The problem
In production you never open a GUI like TablePlus and run `CREATE TABLE` by hand. If you did, nobody could tell **what changed, when, or who changed it**, there would be no version history, and the schema across dev, staging and prod would drift apart.

### What migrations are
**Migrations** are versioned SQL files kept in your repository:
```
db/
  migrations/
    20240501101500_create_users_table.sql
    20240502093000_seed_data.sql
    20240503120000_add_indexes_and_triggers.sql
```
Each file holds ordinary SQL (`CREATE TABLE`, `CREATE INDEX`, `DROP TABLE`, `CREATE TYPE`, …). A **migration tool**, usually a CLI such as **dbmate**, **golang-migrate**, Flyway or Liquibase (or one built into an ORM like Prisma or Knex), reads the folder **in sequence** and executes each file against the database in your environment config. Files are ordered by numeric prefix (`1`, `2`, `3`) or, more commonly, **timestamps**, which sort naturally and avoid clashes between developers.

### Up and down migrations
- **Up migration**: the change you want, e.g. create types, tables and indexes.
- **Down migration**: the exact **reverse** of the up, e.g. drop those indexes, tables and types in reverse order. It lets you **roll back** to the previous schema version if a deploy breaks something.

dbmate splits a single file into two sections with comments:

```sql
-- migrate:up
CREATE TABLE example (id UUID PRIMARY KEY DEFAULT gen_random_uuid());

-- migrate:down
DROP TABLE example;
```

> [!NOTE]
> Some modern teams skip down migrations and **roll forward** instead, writing a new migration that fixes the problem. Down migrations remain the standard approach.

### How the tool tracks state
The tool creates a bookkeeping table (dbmate calls it `schema_migrations`, with a `version` column) that records which migrations have been applied. When you add a new file, the tool compares and **applies only the pending ones**. Re-running old ones would fail anyway (`relation "users" already exists`).

```mermaid
stateDiagram-v2
    [*] --> V0: empty database
    V0 --> V1: up 001 create tables
    V1 --> V2: up 002 seed data
    V2 --> V3: up 003 indexes and triggers
    V3 --> V2: down 003 rollback
    V2 --> V1: down 002 rollback
```

```mermaid
flowchart LR
    DEV["Developer writes<br/>new migration file"] --> GIT["Commit to git<br/>with app code"]
    GIT --> TOOL["Migration tool<br/>dbmate up"]
    TOOL --> CHECK["Read schema_migrations<br/>find pending files"]
    CHECK --> APPLY["Run pending up<br/>sections in order"]
    APPLY --> REC["Record new version"]
```

**Why migrations?**
1. **Track schema changes over time.** Migrations live in version control next to the code, so history, review and blame all work.
2. **Rollback**: return to a known previous version.
3. **Reproducibility**: every environment (and every new developer) can build the identical schema from scratch.

### Setting up dbmate
```bash
# .env
DATABASE_URL="postgres://user:password@localhost:5432/pm_app?sslmode=disable"

dbmate new create_users_table   # creates db/migrations/<timestamp>_create_users_table.sql
dbmate up                       # apply all pending migrations
dbmate down                     # roll back the latest migration
```

## Designing the schema: a project-management platform

This continues the API-design chapter's project-management app, which has users, profiles, projects, tasks and project memberships.

```mermaid
erDiagram
    USERS ||--o| USER_PROFILES : "has profile"
    USERS ||--o{ PROJECTS : "owns"
    PROJECTS ||--o{ TASKS : "contains"
    USERS |o--o{ TASKS : "assigned to"
    USERS ||--o{ PROJECT_MEMBERS : "is member"
    PROJECTS ||--o{ PROJECT_MEMBERS : "has member"
    USERS {
        uuid id PK
        text email UK
        text full_name
        text password_hash
        timestamptz created_at
        timestamptz updated_at
    }
    USER_PROFILES {
        uuid user_id PK, FK
        text avatar_url
        text bio
        text phone
        timestamptz created_at
        timestamptz updated_at
    }
    PROJECTS {
        uuid id PK
        text name
        text description
        project_status status
        uuid owner_id FK
        timestamptz created_at
        timestamptz updated_at
    }
    TASKS {
        uuid id PK
        uuid project_id FK
        text title
        text description
        int priority
        task_status status
        date due_date
        uuid assigned_to FK
        timestamptz created_at
        timestamptz updated_at
    }
    PROJECT_MEMBERS {
        uuid project_id PK, FK
        uuid user_id PK, FK
        member_role role
        timestamptz created_at
        timestamptz updated_at
    }
```

### The full up migration

```sql
-- migrate:up
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE task_status    AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE member_role    AS ENUM ('owner', 'admin', 'member');

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    full_name     TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- one-to-one with users
CREATE TABLE user_profiles (
    user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    bio        TEXT,
    phone      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    status      project_status NOT NULL DEFAULT 'active',
    owner_id    UUID NOT NULL REFERENCES users ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    priority    INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    status      task_status NOT NULL DEFAULT 'pending',
    due_date    DATE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- many-to-many linking table
CREATE TABLE project_members (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    role       member_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

-- migrate:down
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS member_role;
DROP TYPE IF EXISTS task_status;
DROP TYPE IF EXISTS project_status;
```

The rest of this section walks through each design decision.

### ENUM types
An **enum** is a type with a **fixed, predefined set of allowed values**: project status is `active | completed | archived`, task status is `pending | in_progress | completed | cancelled`, member role is `owner | admin | member`. Syntax: `CREATE TYPE name AS ENUM ('a', 'b', ...)`, after which you use `name` as a column type.

Why use an enum instead of plain `TEXT`?
1. **Data integrity.** The database rejects anything outside the set (`invalid input value for enum project_status: "something"`). You should still validate in application code, which catches errors early, but the DB check makes the system robust even when a buggy script bypasses the app.
2. **Documentation, arguably the bigger win.** A new team member reading the migrations sees `status project_status` and knows at a glance which values are allowed. With `TEXT`, they would have to search all the application code to work out the allowed values.

> [!TIP]
> Give enum columns a sensible `DEFAULT` (e.g. `'active'`, `'pending'`, `'member'`) so the application doesn't need to send it explicitly.

> [!WARNING]
> Postgres enums are easy to extend (`ALTER TYPE task_status ADD VALUE 'blocked'`) but hard to shrink or rename values. If the set changes often, use a lookup table or `TEXT` with a `CHECK` constraint instead.

### Standard columns: id, created_at, updated_at
Every table has:
- `id`, the **primary key**: the column that uniquely identifies a row. It is what an endpoint like `GET /users/:id` looks up.
- `created_at`: when the row was created. Set by `DEFAULT CURRENT_TIMESTAMP`, never sent manually.
- `updated_at`: when the row was last modified. It is useful for sorting ("recently updated") and auditing. Keeping it current is covered under triggers below.

`id UUID PRIMARY KEY DEFAULT gen_random_uuid()` means "if the insert doesn't supply an id, Postgres generates a random UUID", which is what you normally rely on.

### Constraints
A **constraint** is a rule attached to a column or table that the DBMS enforces on every insert and update, protecting the data from becoming corrupt.

| Constraint | Meaning | Example |
|---|---|---|
| `PRIMARY KEY` | Uniquely identifies a row. **Implies NOT NULL + UNIQUE.** Automatically indexed. One per table (can span several columns) | `id UUID PRIMARY KEY` |
| `NOT NULL` | Value must be present | `full_name TEXT NOT NULL` |
| `UNIQUE` | No two rows share the value (auto-creates an index) | `email TEXT NOT NULL UNIQUE` |
| `CHECK` | Custom boolean condition must be true | `CHECK (priority BETWEEN 1 AND 5)` |
| `FOREIGN KEY` / `REFERENCES` | Value must exist as a key in another table | `owner_id UUID REFERENCES users` |
| `DEFAULT` | Value used when none is provided (not strictly a constraint) | `DEFAULT 'pending'` |

> [!IMPORTANT]
> In Postgres **every column is nullable unless you say `NOT NULL`**. As a rule of thumb, most columns (more than 70%) should be `NOT NULL`. Nulls leak in through automated scripts and bugs, and a column full of unexpected nulls makes every query and every piece of app code harder. Allow `NULL` only when "absent" is a real, meaningful state, such as an optional bio, phone or description.

The `users` table:
- `email TEXT NOT NULL UNIQUE`: two accounts with the same email are rejected with a unique-violation error.
- `password_hash TEXT NOT NULL`: never store plaintext passwords, only a hash (bcrypt or argon2).

### Naming conventions
- **Plural table names** (`users`, `projects`, `user_profiles`) are the most common industry convention. Singular is fine if the team agrees. Be consistent.
- **lowercase snake_case** for tables and columns: `full_name`, `password_hash`, `created_at`.
- Why not camelCase? Postgres **folds unquoted identifiers to lowercase**. `CREATE TABLE t (fullName text)` actually creates `fullname`. To keep the capital letter you must write `"fullName"` with double quotes everywhere, forever, which makes application SQL ugly and error-prone.

```sql
CREATE TABLE demo (fullName TEXT);   -- column is actually named fullname
SELECT "fullName" FROM demo;         -- ERROR: column "fullName" does not exist
```

### Relationship 1: one-to-one (users ↔ user_profiles)
**Why a separate table?** Think about how the data changes. A profile can keep growing: avatar, bio and phone today, social links, website and portfolio tomorrow. Putting all of it in `users` means frequent migrations on your most critical table and constant rewrites of user rows. Splitting profile data (or preferences, or metadata) into its own table lets it grow independently without touching the core `users` table. This is a common modeling convention.

**How:** each user has at most one profile row, so the profile table doesn't need its own `id`. Its `user_id` is **both the primary key and the foreign key**. PK gives uniqueness, so at most one profile per user. FK gives validity, so the user must exist. The `UNIQUE`/`NOT NULL` modifiers become redundant because the PK implies them. Profile fields are nullable because they are optional.

### Relationship 2: one-to-many (users → projects, projects → tasks)
A project has one owner, and a user can own many projects. **How:** put a foreign key column on the **"many"** side (`projects.owner_id`), but do **not** make it unique or the PK.

`owner_id UUID NOT NULL REFERENCES users ON DELETE RESTRICT`:
- `REFERENCES users` is shorthand for `REFERENCES users(id)`. When you omit the column, Postgres uses the referenced table's primary key.
- **Foreign-key constraint:** you cannot insert an `owner_id` that doesn't exist in `users.id`. Even a well-formed random UUID is rejected if no such user exists. This is **referential integrity**: using relationships between tables to protect data across them.

The same pattern applies to `tasks.project_id`, which is `NOT NULL` so there are no orphan tasks, and to `tasks.assigned_to`.

### Referential actions: what happens when the parent is deleted
| Action | When the referenced row is deleted… | Used here |
|---|---|---|
| `ON DELETE RESTRICT` | The delete **fails** while child rows exist | `projects.owner_id`: you can't delete a user who owns projects. Delete or transfer the projects first |
| `ON DELETE CASCADE` | Child rows are **deleted too** | `tasks.project_id`: deleting a project deletes its tasks. `project_members`: deleting a user or project removes the memberships |
| `ON DELETE SET NULL` | Child's FK column becomes `NULL` (the column must be nullable) | `tasks.assigned_to`: deleting a user un-assigns their tasks |
| `ON DELETE SET DEFAULT` | Child's FK column becomes its default value | rarely used |
| `NO ACTION` (default) | Like RESTRICT, but the check can be deferred to the end of the transaction | the default if you specify nothing |

> [!WARNING]
> `SET NULL` on a `NOT NULL` column cannot work. The delete fails with a not-null violation. Pick actions that agree with your nullability.

```mermaid
flowchart TD
    DEL["DELETE FROM users WHERE id = 1"] --> CHK["DB checks child tables<br/>referencing users.id"]
    CHK --> P["projects.owner_id<br/>ON DELETE RESTRICT"]
    CHK --> T["tasks.assigned_to<br/>ON DELETE SET NULL"]
    CHK --> M["project_members.user_id<br/>ON DELETE CASCADE"]
    P -->|"user owns projects"| FAIL["Whole DELETE fails"]
    T --> NUL["assigned_to set to NULL"]
    M --> GONE["membership rows deleted"]
```

### The tasks table and CHECK constraints
- `priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5)`: if the app sends nothing, use 1. If it sends something, it must be 1–5, so a value like 55 is rejected.
- `status task_status NOT NULL DEFAULT 'pending'`.
- `due_date DATE`: date only, with no time or zone.
- `assigned_to ... ON DELETE SET NULL`, nullable because tasks can be unassigned.

### Relationship 3: many-to-many (users ↔ projects via project_members)
Ask the question in both directions. Can a user be in many projects? Yes. Can a project have many users? Yes. If both answers are "many", the relationship is **many-to-many**. You cannot model it with a single FK column, so you create a **linking table** (also called a junction, join or associative table).

- Drop the surrogate `id`. Hold two FKs: `project_id → projects`, `user_id → users`, both `ON DELETE CASCADE`.
- Make **`PRIMARY KEY (project_id, user_id)`**, a **composite primary key**. "User 1 is a member of project 2" is a single fact that must not be duplicated, and the composite PK enforces that the pair is unique and non-null and uniquely identifies the row.
- Attributes that belong to the relationship itself live here: `role` (owner, admin or member *within that project*) defaults to `'member'`.

```mermaid
erDiagram
    USERS ||--o{ PROJECT_MEMBERS : "user_id"
    PROJECTS ||--o{ PROJECT_MEMBERS : "project_id"
    PROJECT_MEMBERS {
        uuid project_id PK, FK
        uuid user_id PK, FK
        member_role role
    }
```

| Relationship | Implementation | Example |
|---|---|---|
| One-to-one | Child table's PK is also the FK to the parent | `user_profiles.user_id` |
| One-to-many | FK column on the "many" side, not unique | `tasks.project_id`, `projects.owner_id` |
| Many-to-many | Linking table with two FKs and a composite PK | `project_members(project_id, user_id)` |

> [!INTERVIEW]
> **"How do you model a many-to-many relationship?"** With a junction table holding foreign keys to both tables and a composite primary key (or unique constraint) on the pair to prevent duplicates. Relationship-specific attributes like `role` or `joined_at` go on the junction table. Usually you also index the second FK column, because the composite PK index only helps lookups that start with its first column.

### Down migration and applying
The down section **drops tables in reverse dependency order** (children before parents, because FKs prevent dropping a referenced table) and then drops the types. Run `dbmate up`, refresh TablePlus, and the five tables appear along with `schema_migrations`, which holds the applied version.

## Seeding test data

In production, data arrives through real user flows such as sign-up forms and project creation. During development you need realistic data to test your queries and endpoints. **Seeding** means inserting test data, typically via a **separate migration/seed file** (`dbmate new seed_data`). Its timestamp is later than the schema migration, so it runs afterwards.

The seed uses **CTEs (Common Table Expressions, `WITH ... AS`)** to chain inserts readably and reuse the generated IDs:

```sql
-- migrate:up
WITH inserted_users AS (
    INSERT INTO users (email, full_name, password_hash)
    VALUES ('john@example.com',  'John Doe',    '$2b$10$hash1'),
           ('jane@example.com',  'Jane Smith',  '$2b$10$hash2'),
           ('alice@example.com', 'Alice Brown', '$2b$10$hash3')
    RETURNING id, email
),
inserted_profiles AS (
    INSERT INTO user_profiles (user_id, avatar_url, bio, phone)
    SELECT id,
           'https://example.com/avatar.png',
           CASE
               WHEN email = 'john@example.com' THEN 'Backend engineer'
               WHEN email = 'jane@example.com' THEN 'Product manager'
               ELSE 'Designer'
           END,
           '+1-555-0100'
    FROM inserted_users
    RETURNING user_id
)
INSERT INTO projects (name, description, owner_id)
SELECT 'Website Redesign', 'Revamp the marketing site', id
FROM inserted_users WHERE email = 'john@example.com';
```

`RETURNING` hands back the rows each insert produced, so later CTEs can select from them as if they were tables.

> [!WARNING]
> Never run dev seed data in production. Keep seeds in a separate file or mechanism so prod deploys can exclude them.

## Writing queries for real APIs

Request flow recap from earlier chapters: route → handler → service → **repository**. The repository builds and runs SQL through the driver, and the result is serialized to JSON for the response.

```mermaid
sequenceDiagram
    participant C as Client
    participant H as Handler
    participant S as Service
    participant R as Repository
    participant DB as Postgres
    C->>H: GET /v1/users/abc-123
    H->>S: getUser(id)
    S->>R: findById(id)
    R->>DB: SELECT ... WHERE u.id = $1 with params [abc-123]
    DB-->>R: row
    R-->>S: User object
    S-->>H: User
    H-->>C: 200 OK JSON body
```

### GET /v1/users: list users with their profile embedded
Requirement: return every user with their profile embedded, in **one API call and one DB round trip**.

**Tip: write SQL starting from the `FROM` clause.** First decide where the data comes from, then what to select.

```sql
SELECT u.*,
       to_jsonb(up.*) AS profile
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC;
```

- `users u` and `user_profiles up` are **aliases**: short names that make repeated references convenient.
- The FK `user_profiles.user_id` connects the tables. The **join condition** is `u.id = up.user_id`, an equality condition.
- **Why `LEFT JOIN`, not `INNER JOIN`?** A user who never edited their profile has no `user_profiles` row. `INNER JOIN` keeps only rows that match on **both** sides, so those users would vanish from the result. `LEFT JOIN` keeps **every row from the left table** (`users`) and fills the right side with `NULL` when there's no match. INNER and LEFT are the two joins you'll use most of the time.
- `to_jsonb(up.*)` is a built-in function that converts the matching profile row into a JSON object, returned as a `profile` column.
- **Always `ORDER BY` list queries.** Without it, SQL guarantees **no order** at all, and the order can change between executions. The default for lists is newest first: `created_at DESC`.

| Join | Returns | Typical use |
|---|---|---|
| `INNER JOIN` | Only rows with a match in both tables | Tasks with their project (project always exists) |
| `LEFT JOIN` | All rows of the left table, NULLs where the right has no match | Users with an optional profile |
| `RIGHT JOIN` | Mirror of LEFT | Rare, rewrite as LEFT |
| `FULL OUTER JOIN` | All rows from both, NULLs on either side | Reconciliation reports |
| `CROSS JOIN` | Every combination (Cartesian product) | Generating combinations |

```mermaid
flowchart LR
    U["users: John, Jane, Alice"] --> LJ["LEFT JOIN on u.id = up.user_id"]
    P["user_profiles: John, Jane"] --> LJ
    LJ --> R1["John + profile"]
    LJ --> R2["Jane + profile"]
    LJ --> R3["Alice + NULL profile"]
```

> [!NOTE]
> Go backends deserialize rows into structs and then serialize those to JSON, which adds overhead. In Node.js the driver already returns JS objects, so the cost is lower. Either way the DB returns rows and the app shapes the response.

### GET /v1/users/:id with parameterized queries

**Parameterized query (prepared statement):** you send the database a query containing **placeholders** (`$1`, `$2` in Postgres) and send the values **separately**. The database treats each value strictly as **data**, never as SQL code, so even a value like `'; DELETE FROM users; --` is just a weird string to compare against.

The alternative, building SQL by **string concatenation** with user input, creates **SQL injection** vulnerabilities:

```ts
// VULNERABLE - never do this
const sql = `SELECT * FROM users WHERE email = '${req.query.email}'`;
// email = ' OR '1'='1  ->  WHERE email = '' OR '1'='1'  -> returns every user
```

```ts
// SAFE - node-postgres (pg)
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function findUserById(userId: string) {
  const { rows } = await pool.query(
    `SELECT u.*, to_jsonb(up.*) AS profile
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1`,
    [userId] // sent separately, never interpolated
  );
  return rows[0] ?? null;
}
```

```go
// SAFE - Go with database/sql or pgx
row := db.QueryRowContext(ctx,
    `SELECT id, email, full_name FROM users WHERE id = $1`, userID)
```

The query is identical to the list query plus `WHERE u.id = $1`. In TablePlus you supply the value in a prompt, and string literals in SQL use **single quotes** (`'550e8400-...'`). In real code, the driver or ORM fills the slots.

```mermaid
sequenceDiagram
    participant App as Backend
    participant DB as Postgres
    App->>DB: Parse: SELECT * FROM users WHERE id = $1
    DB-->>App: statement parsed and planned
    App->>DB: Bind: $1 = user supplied value
    Note over DB: Value is pure data.<br/>It can never change the query structure.
    DB-->>App: matching rows
```

> [!IMPORTANT]
> Every dynamic value, whether it comes from path params, query strings, bodies or headers, must go through a parameter placeholder. This is the main defense against SQL injection (OWASP Top 10).

### Dynamic filtering, sorting and pagination
List endpoints such as `GET /v1/users?page=1&limit=10&letter=J&sortBy=email&sortOrder=asc` need optional filters and sorts. The backend **constructs the SQL dynamically**:

| Query param | Default | Rule |
|---|---|---|
| `page` | 1 | user-facing pages start at 1 |
| `limit` | 10 or 20 | cap it (e.g. max 100) |
| `letter` (filter) | none | if absent, **omit the WHERE clause entirely** |
| `sortBy` | `created_at` | only from an **allow-list**: `full_name`, `email`, `created_at` |
| `sortOrder` | `desc` | only `asc` or `desc` |

The SQL pieces:

```sql
SELECT u.*, to_jsonb(up.*) AS profile
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.full_name ILIKE $1 || '%'      -- filter: name starts with letter
ORDER BY u.email ASC                    -- sort: whitelisted column and direction
LIMIT $2 OFFSET $3;                     -- pagination
```

- `ILIKE` is Postgres's **case-insensitive** `LIKE`. `%` matches any sequence of characters, and `||` concatenates. `$1 || '%'` with `J` becomes `'J%'`, matching "John Doe" and "Jane Smith". `X` returns nothing, and `A` returns "Alice Brown".
- **Pagination:** `LIMIT n` caps the row count, and `OFFSET k` skips k rows. The correct mapping from a 1-based page is `OFFSET = (page - 1) * limit`. With `limit = 1`, page 1 → offset 0 (Jane), page 2 → offset 1 (John).
- **Always paginate list endpoints** unless the UI has a real reason not to.

> [!WARNING]
> **You cannot parameterize identifiers or keywords.** `ORDER BY $2 $3` does not work: a bound value is treated as a constant, so `ORDER BY 'u.email'` sorts by a literal string and has no effect, and `ASC`/`DESC` can't be bound at all. Map the user's `sortBy` and `sortOrder` through an **allow-list** to known-safe SQL fragments, then interpolate those fragments. Never interpolate raw user input. Column names must also match the query's aliases (`u.email`, not `email`, when the column name is ambiguous).

```ts
const SORT_COLUMNS: Record<string, string> = {
  full_name: "u.full_name",
  email: "u.email",
  created_at: "u.created_at",
};

export async function listUsers(q: {
  page?: number; limit?: number; letter?: string; sortBy?: string; sortOrder?: string;
}) {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 10));
  const sortCol = SORT_COLUMNS[q.sortBy ?? ""] ?? "u.created_at";
  const sortDir = q.sortOrder === "asc" ? "ASC" : "DESC";

  const params: unknown[] = [];
  const where: string[] = [];
  if (q.letter) {
    params.push(q.letter);
    where.push(`u.full_name ILIKE $${params.length} || '%'`);
  }
  params.push(limit, (page - 1) * limit);

  const sql = `
    SELECT u.*, to_jsonb(up.*) AS profile
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const { rows } = await pool.query(sql, params);
  return rows;
}
```

> [!TIP]
> `OFFSET` pagination gets slow on deep pages, because the DB still reads and discards every skipped row, and it can skip or duplicate rows when data changes between page loads. For large or infinite-scroll lists use **keyset (cursor) pagination**: `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20`.

### POST /v1/users: create
```sql
INSERT INTO users (email, full_name, password_hash)
VALUES ($1, $2, $3)
RETURNING *;
```
The backend hashes the password before inserting. `RETURNING *` returns the newly created row (with generated `id`, `created_at` and so on) in the same round trip, so the API can respond `201 Created` with the resource and no extra `SELECT`.

### PATCH /v1/users/:id/profile: partial update
PATCH payloads are **partial**: the user may send any subset of `bio`, `phone` and `avatar_url`. The backend checks which **allowed** fields are present and builds `SET` clauses only for those, leaving other columns untouched. If only bio and phone were sent:

```sql
UPDATE user_profiles
SET bio = $1,
    phone = $2
WHERE user_id = $3      -- from the URL path param
RETURNING *;
```

> [!WARNING]
> Always include a `WHERE` clause on `UPDATE` and `DELETE`. Without one, the statement hits **every row** in the table.

After running this update, notice that `updated_at` still equals `created_at`. Nothing updated it, which leads to triggers.

## Triggers: automatically maintaining updated_at

`updated_at` should change on every update. There are two options:
1. **Manually** in application code: add `updated_at = NOW()` to every `UPDATE`. Someone will eventually forget.
2. **A database trigger**: "when event X happens on table T, run function F". Set it up once and every update, from any client or script, is covered.

```sql
-- migrate:up
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_project_members_updated_at
    BEFORE UPDATE ON project_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down
DROP TRIGGER IF EXISTS trg_project_members_updated_at ON project_members;
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
DROP FUNCTION IF EXISTS set_updated_at();
```

- The function returns type `TRIGGER`. `NEW` is the row as it will be written. Setting `NEW.updated_at` and returning `NEW` modifies the row before it's stored, which is why it runs `BEFORE UPDATE`.
- `BEGIN ... END` here is a **PL/pgSQL code block**, not a transaction. (The trigger runs inside the transaction of the `UPDATE` that fired it.)
- Name each trigger so the down migration can drop it.

Re-running the profile update with "updated bio 3" now changes `updated_at` to the current time automatically.

```mermaid
sequenceDiagram
    participant App as Backend
    participant PG as Postgres
    participant TR as set_updated_at trigger
    App->>PG: UPDATE user_profiles SET bio = $1 WHERE user_id = $2
    PG->>TR: BEFORE UPDATE, for each affected row
    TR-->>PG: NEW row with updated_at = now
    PG-->>App: RETURNING updated row
```

> [!WARNING]
> Triggers are "invisible" logic. Keep them small and generic (timestamps, audit logs). Hiding business rules in triggers makes behavior hard to discover and debug.

## Indexes

### The problem: sequential scans
The GUI shows rows neatly in order, but on disk, rows are stored wherever the storage engine put them. To answer `SELECT * FROM tasks WHERE id = $1` with no index, the DB must check **every row** one by one: a **sequential scan** (full table scan), O(n). With 6 rows that's instant. With a million or a billion rows scattered across disk pages, it is very slow.

### The book-index analogy
A book's index says "Chapter 4 → page 54". To read chapter 4 you jump straight to page 54 instead of flipping through 50 pages. A database **index** is the same idea: a separate, **sorted lookup structure** mapping a column's values to the **physical location** of the matching rows (in Postgres, a tuple id, or TID). To find `id = X`, the DB searches the small, ordered index, gets the location, and reads exactly that row.

```mermaid
flowchart LR
    Q["WHERE id = X"] --> NOIDX["No index:<br/>sequential scan of all rows"]
    Q --> IDX["With index:<br/>search sorted B-tree"]
    NOIDX --> SLOW["O of n disk reads"]
    IDX --> LOC["Get row location TID"]
    LOC --> FAST["Fetch that one row<br/>O of log n"]
```

> [!NOTE]
> The default Postgres index is a **B-tree**: a balanced, sorted tree. The DB does not scan the index linearly. It walks the tree from the root, so a lookup takes O(log n) steps. A billion rows needs only a handful of page reads. B-trees support `=`, `<`, `>`, `BETWEEN`, `ORDER BY` and prefix `LIKE 'abc%'`. Other types: **Hash** (equality only), **GIN** (JSONB, arrays, full-text), **GiST** (geometric, ranges), **BRIN** (huge, naturally ordered tables).

### Index order
An index is **ordered**: ascending by default, or `DESC`. Because the list endpoint sorts by `created_at DESC`, an index on `created_at DESC` lets the DB read rows already in the required order instead of sorting at query time.

> [!NOTE]
> A single-column B-tree can be scanned **backwards**, so a plain ascending index also serves `ORDER BY created_at DESC`. Direction matters most in **multi-column** indexes with mixed directions, e.g. `ORDER BY status ASC, created_at DESC` needs an index on `(status ASC, created_at DESC)`.

### When to create an index: the rule of thumb
Consider indexing a column when it appears in:
1. **`WHERE`** clauses (filters),
2. **`JOIN ... ON`** conditions,
3. **`ORDER BY`** (sorting),

**and** the query runs frequently or is user-facing and latency-sensitive.

**Primary keys** (and `UNIQUE` columns) are **indexed automatically**. **Foreign keys are not.** Postgres does not create indexes on referencing columns, so you must add them yourself.

### The cost of indexes
Indexes are not free. Every `INSERT`, `UPDATE` (of indexed columns) and `DELETE` must also update every index on the table, and each index takes disk space. So:
- Don't index every column "just in case".
- Evaluate frequency, table size and the UX benefit.
- Create the index, **monitor performance**, and **drop indexes nobody uses**.

| | Benefit | Cost |
|---|---|---|
| Reads (`SELECT` with WHERE, JOIN, ORDER BY) | Much faster: O(log n) vs O(n) | none |
| Writes (`INSERT`, `UPDATE`, `DELETE`) | none | Slower: every index must be maintained |
| Storage | none | Extra disk and memory |

### The index migration
```sql
-- migrate:up
CREATE INDEX idx_users_email           ON users (email);           -- lookups and joins by email
CREATE INDEX idx_users_created_at      ON users (created_at DESC); -- GET /users default sort
CREATE INDEX idx_tasks_project_id      ON tasks (project_id);      -- FK: tasks of a project
CREATE INDEX idx_tasks_assigned_to     ON tasks (assigned_to);     -- FK: tasks of a user
CREATE INDEX idx_tasks_created_at      ON tasks (created_at DESC); -- GET /tasks default sort
CREATE INDEX idx_tasks_status          ON tasks (status);          -- filter by status
CREATE INDEX idx_project_members_project_id ON project_members (project_id);
CREATE INDEX idx_project_members_user_id    ON project_members (user_id);

-- migrate:down
DROP INDEX IF EXISTS idx_project_members_user_id;
DROP INDEX IF EXISTS idx_project_members_project_id;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_created_at;
DROP INDEX IF EXISTS idx_tasks_assigned_to;
DROP INDEX IF EXISTS idx_tasks_project_id;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_email;
```

The reasoning for each index:
- `users.email`: finding a user by email (login) or joining on email. (The `UNIQUE` constraint already creates an index, so in practice this one is redundant. See the gotcha below.)
- `users.created_at DESC`: the frequently called list endpoint sorts by it.
- `tasks.project_id`: "all tasks of project P" joins `projects.id = tasks.project_id`. `projects.id` is a PK and already indexed, but `tasks.project_id` is a FK and **not** indexed.
- `tasks.assigned_to`: "all tasks of user U" joins `users.id = tasks.assigned_to`.
- `tasks.created_at DESC`: default sort of the task list.
- `tasks.status`: `GET /tasks?status=pending` filters on it.
- `project_members.project_id` and `.user_id`: lookups in both directions of the M:N relationship.

> [!WARNING]
> `UNIQUE` and `PRIMARY KEY` already create a B-tree index. Adding another plain index on the same column (`email`) wastes space and slows writes. Likewise, with `PRIMARY KEY (project_id, user_id)`, lookups by `project_id` are already served by the composite index's leading column, so the **separate `user_id` index is the one that really matters**.

> [!TIP]
> Low-cardinality columns like `status` (4 values) often benefit less from a plain index than you'd expect. If one value dominates, the planner may scan anyway. A **composite** index such as `(project_id, status)` or a **partial** index `WHERE status = 'pending'` is usually better. Verify with `EXPLAIN ANALYZE`.

### Verifying with EXPLAIN
```sql
EXPLAIN ANALYZE
SELECT * FROM tasks WHERE project_id = '550e8400-e29b-41d4-a716-446655440000';
-- Before index:  Seq Scan on tasks  (... rows=1000000) ... Execution Time: 180 ms
-- After index:   Index Scan using idx_tasks_project_id on tasks ... Execution Time: 0.08 ms
```
`EXPLAIN` shows the planner's chosen plan. `EXPLAIN ANALYZE` actually runs the query and reports real times. Look for `Seq Scan` on large tables in hot queries.

### Wrapping up the workflow
That covers about 80% of daily database work as a backend engineer: take an API, analyze the incoming payload (params, query, body), **construct a dynamic query**, pass every user value through **parameters**, execute it, and return the data. Indexes keep it fast, constraints keep it correct, triggers handle bookkeeping and migrations track every change. A good exercise is to write the queries for the remaining endpoints (projects, tasks, members) and observe how the joins, indexes and triggers come into play.

## Beyond the video: interview essentials (transactions, ACID, isolation, normalization)

The video points out the concurrency problem (lost updates) and says a DBMS must solve it. Interviewers *will* ask how, so this section completes the picture with standard material.

### Transactions and ACID
A **transaction** groups several statements into one all-or-nothing unit.

```sql
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;      -- or ROLLBACK; to undo everything since BEGIN
```

| Property | Meaning | How Postgres provides it |
|---|---|---|
| **Atomicity** | All statements succeed or none do | Rollback on error or `ROLLBACK` |
| **Consistency** | Each transaction moves the DB from one valid state to another (constraints hold) | Constraints, FKs, CHECKs, triggers |
| **Isolation** | Concurrent transactions don't see each other's partial work | MVCC + isolation levels + locks |
| **Durability** | Once committed, data survives crashes | Write-Ahead Log (WAL) flushed to disk on commit |

```ts
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [500, 1]);
  await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [500, 2]);
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}
```

### Fixing the lost-update problem
The text-file race (40 → 60 or 20) has standard database fixes:
1. **Atomic update:** `UPDATE t SET amount = amount + 20 WHERE id = 1`. The DB applies both changes in turn, giving the correct 40.
2. **Pessimistic locking:** `SELECT ... FOR UPDATE` inside a transaction locks the row until commit.
3. **Optimistic locking:** add a `version` column, then `UPDATE ... SET version = version + 1 WHERE id = $1 AND version = $2`. If zero rows were updated, someone else got there first, so retry.
4. **Serializable isolation**, which aborts one transaction on conflict.

### Isolation levels and anomalies
| Level | Dirty read | Non-repeatable read | Phantom read | Notes |
|---|---|---|---|---|
| Read Uncommitted | possible (not in Postgres) | possible | possible | Postgres treats it as Read Committed |
| **Read Committed** (Postgres default) | no | possible | possible | Each statement sees data committed before it started |
| Repeatable Read | no | no | possible per standard, not in Postgres | Snapshot at the first statement of the transaction |
| Serializable | no | no | no | Behaves as if transactions ran one at a time. Be ready to retry on serialization failures |

- **Dirty read**: reading another transaction's uncommitted change.
- **Non-repeatable read**: reading the same row twice in one transaction and getting different values.
- **Phantom read**: re-running a range query and seeing new or missing rows.
- Postgres uses **MVCC** (Multi-Version Concurrency Control). Writers create new row versions, so **readers don't block writers and writers don't block readers**.

### Normalization (and when to denormalize)
Normalization organizes tables to remove redundancy and update anomalies:
- **1NF**: atomic values with no repeating groups (no `tags = 'a,b,c'` strings).
- **2NF**: 1NF, plus every non-key column depends on the **whole** primary key (matters for composite keys).
- **3NF**: 2NF, plus no **transitive** dependencies (non-key columns depend only on the key). `orders(customer_id, customer_email)` violates it, so move `customer_email` to `customers`.

The project schema here is in 3NF: user data lives once in `users`, membership facts once in `project_members`, and so on. **Denormalization** (duplicating data, e.g. a cached `task_count` on projects) is a deliberate trade for read speed at the cost of keeping copies in sync.

### The N+1 query problem
Fetching 50 users, then running one query per user for their profile, makes 51 round trips. The fix is what this chapter did: a single `LEFT JOIN` (or a batched `WHERE user_id = ANY($1)`).

```mermaid
flowchart TD
    BAD["N plus 1: 1 query for users<br/>+ 1 query per user for profile"] --> SLOWN["51 round trips for 50 users"]
    GOOD["Single LEFT JOIN with to_jsonb"] --> ONE["1 round trip"]
```

## Common mistakes & misconceptions
- **Storing money as FLOAT/REAL/DOUBLE.** Rounding errors accumulate. Use `NUMERIC(p, s)` or integer cents.
- **`VARCHAR(255)` everywhere "for performance".** In Postgres `TEXT` and `VARCHAR` perform the same, and 255 is a MySQL artifact. Use `TEXT` and validate length in the app (or with a CHECK).
- **"TEXT columns can't be indexed."** False in Postgres.
- **camelCase column names.** Postgres folds unquoted identifiers to lowercase, so you end up quoting forever. Use snake_case.
- **Forgetting `NOT NULL`.** Columns are nullable by default, and nulls creep in through scripts and bugs.
- **Assuming foreign keys are auto-indexed.** Only PKs and UNIQUE columns are. Index FK columns used in joins.
- **Indexing everything.** Every index slows writes and uses space. Index only frequent WHERE, JOIN and ORDER BY columns, then measure.
- **Using INNER JOIN for optional relations.** Rows silently disappear. Use LEFT JOIN when the right side may be missing.
- **Relying on row order without ORDER BY.** SQL gives no order guarantee.
- **Concatenating user input into SQL.** SQL injection. Always use placeholders, and whitelist identifiers such as sort columns.
- **Trying to bind `ORDER BY $1`.** Parameters are values, not identifiers, so the sort silently does nothing. Use an allow-list.
- **`OFFSET = page` instead of `(page - 1) * limit`.** This returns wrong pages for any limit greater than 1.
- **Editing schemas by hand in production.** There's no history and no rollback, and environments drift. Use migrations.
- **Editing an already-applied migration file.** The tool won't re-run it, so environments diverge. Write a new migration instead.
- **Dropping parent tables before children in down migrations.** FK dependencies block it. Drop in reverse order.
- **`ON DELETE SET NULL` on a NOT NULL column.** Deletes will fail.
- **Calling the PL/pgSQL `BEGIN ... END` block a transaction.** It's just a code block.

## Interview questions

<details>
<summary><strong>Q: Why are databases disk-based while caches like Redis are in memory?</strong></summary>

Databases need large, cheap, durable capacity and can trade some speed for it. Disk (HDD or SSD) is cheap per GB, large and non-volatile. Caches exist purely for speed, and RAM is orders of magnitude faster but small, expensive and volatile, so caches hold a hot subset of data that can be rebuilt. Disk databases still cache hot pages in RAM (Postgres `shared_buffers`), but durability comes from disk via the WAL.

</details>

<details>
<summary><strong>Q: SQL vs NoSQL: how do you choose? Why not always MongoDB for flexibility?</strong></summary>

Relational DBs enforce a schema, constraints and relationships at the database level, giving strong integrity and powerful joins, which suits CRMs, finance, e-commerce and most SaaS. Document DBs offer a flexible schema, which suits genuinely unstructured content (CMS) or rapid prototyping, but integrity moves into application code, where inconsistencies creep in. Postgres's JSONB gives you flexible columns inside a relational DB, so a common answer is "Postgres by default, JSONB for the dynamic parts, a document DB only if nearly all data is schemaless or the scale pattern demands it".

</details>

<details>
<summary><strong>Q: DECIMAL vs FLOAT: which do you use for prices and why?</strong></summary>

`DECIMAL/NUMERIC` stores exact decimal values with defined precision and scale. `DECIMAL(10,2)` means up to 10 digits total, 2 after the point. Floats use binary IEEE-754 and cannot represent values like 0.1 exactly, so `0.1 + 0.2 = 0.30000000000000004`, and errors accumulate in sums and comparisons. For money, use DECIMAL (or integer minor units in BIGINT). Floats are faster and fine for measurements and scientific data where tiny errors don't matter.

</details>

<details>
<summary><strong>Q: In Postgres, should you use VARCHAR(255) or TEXT?</strong></summary>

`TEXT`. Postgres's docs state there is no performance difference among TEXT and VARCHAR (CHAR is actually slower because of padding). TEXT can be indexed. 255 is a MySQL convention with no meaning in Postgres, it misleads readers into thinking the number matters, and changing the limit later needs a migration. Enforce length in application validation, or with a `CHECK (char_length(col) <= n)` if the DB must enforce it.

</details>

<details>
<summary><strong>Q: What does PRIMARY KEY imply? How is it different from UNIQUE?</strong></summary>

A primary key uniquely identifies each row and implies **NOT NULL + UNIQUE**, and Postgres automatically creates a unique B-tree index for it. A table has at most one PK (which can be composite). `UNIQUE` also creates an index and prevents duplicates, but allows NULLs (multiple NULLs by default) and a table can have many. FKs in other tables usually reference the PK.

</details>

<details>
<summary><strong>Q: Explain ON DELETE RESTRICT, CASCADE, SET NULL with an example schema.</strong></summary>

They define what happens to child rows when the referenced parent row is deleted. `RESTRICT`: the delete fails while children exist, e.g. you can't delete a user who owns projects. `CASCADE`: children are deleted too, e.g. deleting a project deletes its tasks and memberships. `SET NULL`: the child's FK becomes NULL, e.g. deleting a user un-assigns their tasks, which requires a nullable column. `SET DEFAULT` sets the column default. This is referential integrity enforced by the database rather than the app.

</details>

<details>
<summary><strong>Q: Model users, projects and memberships where each member has a role per project.</strong></summary>

`users(id PK)`, `projects(id PK, owner_id FK → users ON DELETE RESTRICT)`, and a linking table `project_members(project_id FK → projects ON DELETE CASCADE, user_id FK → users ON DELETE CASCADE, role member_role DEFAULT 'member', PRIMARY KEY (project_id, user_id))`. The composite PK prevents a user from joining the same project twice. `role` lives on the junction table because it describes the relationship, not the user or the project. Add an index on `user_id` for "projects of a user" queries, since the PK index leads with `project_id`.

</details>

<details>
<summary><strong>Q: How would you implement a one-to-one relationship, and why split a table at all?</strong></summary>

Make the child's primary key also a foreign key to the parent: `user_profiles.user_id UUID PRIMARY KEY REFERENCES users(id)`. The PK guarantees at most one profile per user, and the FK guarantees the user exists. You split when a set of optional or fast-growing attributes (profile, preferences, metadata) changes independently of the core entity. It keeps the critical `users` table small and stable and avoids frequent migrations on it.

</details>

<details>
<summary><strong>Q: What is SQL injection and how do parameterized queries prevent it? Does that cover ORDER BY?</strong></summary>

SQL injection happens when user input is concatenated into SQL text so it can change the query's structure, e.g. `' OR '1'='1` returning all rows, or `'; DROP TABLE users; --`. Parameterized queries send the SQL with placeholders (`$1`) and the values separately. The DB parses the structure first and treats values purely as data, so they can never become code. Placeholders only work for **values**. Identifiers and keywords like sort columns or `ASC/DESC` can't be bound, so map them through a strict allow-list before inserting them into the SQL.

</details>

<details>
<summary><strong>Q: LEFT JOIN vs INNER JOIN: which do you use to list users with optional profiles?</strong></summary>

LEFT JOIN. INNER JOIN returns only rows that match on both sides, so users without a profile row would disappear. LEFT JOIN returns every user and fills profile columns with NULL when there's no match. With `to_jsonb(up.*) AS profile` you embed the profile as JSON in one round trip, which also avoids the N+1 query problem.

</details>

<details>
<summary><strong>Q: What is an index, how does it speed up queries, and what does it cost?</strong></summary>

An index is a separate sorted data structure (a B-tree by default) mapping column values to row locations. Without one, `WHERE col = x` requires a sequential scan of every row (O(n)). With a B-tree the DB walks a balanced tree in O(log n) and fetches only the matching rows. It also serves range queries and ORDER BY in index order. The cost: every INSERT, UPDATE and DELETE must update every index, and indexes consume disk and memory. So index columns used in WHERE, JOIN and ORDER BY of frequent queries, measure with EXPLAIN ANALYZE, and drop unused indexes.

</details>

<details>
<summary><strong>Q: Your "tasks of a project" endpoint got slow as the table grew to 10 million rows. What do you check?</strong></summary>

Run `EXPLAIN ANALYZE` on the query. The likely culprit is a `Seq Scan` on `tasks` because `tasks.project_id` is a foreign key, and Postgres doesn't index FKs automatically. Add `CREATE INDEX CONCURRENTLY idx_tasks_project_id ON tasks(project_id)` (CONCURRENTLY avoids blocking writes in production). If the query also sorts by `created_at DESC` or filters by status, consider a composite index `(project_id, created_at DESC)`. Also check pagination (switch from deep OFFSET to keyset) and that you're selecting only the columns you need.

</details>

<details>
<summary><strong>Q: What are database migrations, and what are up and down migrations?</strong></summary>

Migrations are versioned SQL files committed alongside the code that describe every schema change in order (timestamp-prefixed). A tool (dbmate, golang-migrate, Flyway, Prisma) applies pending files and records the current version in a table like `schema_migrations`, so each environment knows what has run. The **up** section applies the change, and the **down** section reverses it exactly (drop in reverse dependency order) so you can roll back. Benefits: change history in git, reviewability, reproducible environments and rollback.

</details>

<details>
<summary><strong>Q: How would you keep updated_at accurate on every table?</strong></summary>

Either set `updated_at = NOW()` in every UPDATE from application code, which is error-prone because someone forgets, or use a trigger: a PL/pgSQL function `set_updated_at()` that does `NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW;`, attached to each table with `BEFORE UPDATE ... FOR EACH ROW EXECUTE FUNCTION set_updated_at()`. The trigger covers updates from any client or script. It's added in a migration with named triggers so the down migration can drop them.

</details>

<details>
<summary><strong>Q: Two requests simultaneously add 20 and subtract 20 from a balance of 40. What can go wrong and how do you prevent it?</strong></summary>

With a read-modify-write in the app (read 40, compute, write back), one update overwrites the other: a **lost update** leaving 60 or 20 instead of 40. Fixes: make it atomic in SQL (`SET balance = balance + 20`), lock the row with `SELECT ... FOR UPDATE` in a transaction, use optimistic locking with a version column (retry if 0 rows updated), or run at SERIALIZABLE isolation and retry on serialization failure. Postgres's default READ COMMITTED does not prevent read-modify-write races done in application code.

</details>

<details>
<summary><strong>Q: Explain ACID and Postgres's default isolation level.</strong></summary>

Atomicity: a transaction is all-or-nothing. Consistency: constraints hold before and after. Isolation: concurrent transactions don't interfere. Durability: committed data survives crashes, via the write-ahead log. Postgres defaults to **READ COMMITTED**: each statement sees only data committed before it began, so there are no dirty reads, but non-repeatable reads and phantoms are possible. REPEATABLE READ gives a stable snapshot for the whole transaction, and SERIALIZABLE makes concurrent transactions behave as if run one by one. Postgres implements all of this with MVCC, so readers and writers don't block each other.

</details>

## Cheat sheet
- **Cache = RAM (fast, small, costly). Database = disk (slower, big, cheap, durable).**
- **DBMS jobs:** organization, access (CRUD), integrity, security, plus concurrency.
- **Files fail at:** parsing speed, structure, concurrency (lost updates).
- **Relational:** tables, rows, columns, strict schema, SQL, FKs. **Document:** collections and documents, flexible schema, integrity in the app.
- **Why Postgres:** open source, SQL standard, extensible, reliable, **JSONB**.
- **Types:** `BIGSERIAL`/identity or `UUID DEFAULT gen_random_uuid()` for ids · `SMALLINT < INTEGER < BIGINT` · money uses `NUMERIC(p,s)` · `TEXT` > `VARCHAR(n)` > never `CHAR` · `TIMESTAMPTZ` · `JSONB` > `JSON` · enums for fixed sets · arrays `TYPE[]`.
- **Migrations:** timestamped files, `-- migrate:up` / `-- migrate:down`, tool tracks `schema_migrations`. Never edit applied files. Seed data in a separate file.
- **Constraints:** PK (= NOT NULL + UNIQUE + index), NOT NULL (default is nullable!), UNIQUE, CHECK, FK REFERENCES.
- **ON DELETE:** RESTRICT (block) · CASCADE (delete children) · SET NULL · SET DEFAULT · NO ACTION (default).
- **Relationships:** 1:1 → child PK = FK · 1:N → FK on many side · M:N → junction table + composite PK.
- **Naming:** plural tables, lowercase snake_case (unquoted identifiers fold to lowercase).
- **Queries:** start from FROM · aliases · LEFT JOIN for optional · `to_jsonb(t.*)` to embed · always ORDER BY · `RETURNING *` after INSERT and UPDATE · always WHERE on UPDATE and DELETE.
- **Security:** placeholders `$1, $2` for all values. Allow-list sort columns and directions.
- **Pagination:** `LIMIT limit OFFSET (page-1)*limit`, keyset for deep pages.
- **Filter:** `col ILIKE $1 || '%'` (case-insensitive prefix match).
- **Triggers:** `BEFORE UPDATE FOR EACH ROW EXECUTE FUNCTION set_updated_at()`.
- **Indexes:** B-tree, O(log n). Index WHERE, JOIN and ORDER BY columns of frequent queries. PKs and UNIQUE auto-indexed, **FKs not**. Writes pay the cost. Check with `EXPLAIN ANALYZE`, drop unused ones.
- **ACID** · default isolation **READ COMMITTED** · MVCC · fix lost updates with atomic updates, `FOR UPDATE` or optimistic versioning.

## Glossary
- **Persistence** — storing data so it survives after the program that created it stops.
- **CRUD** — Create, Read, Update, Delete: the basic data operations.
- **DBMS** — Database Management System: software that stores data and provides efficient, safe access to it.
- **Data integrity** — the accuracy, validity and consistency of stored data.
- **Relational database** — stores data in tables of rows and columns with a predefined schema and relationships via foreign keys.
- **Document database** — stores flexible JSON-like documents in collections (e.g. MongoDB).
- **Schema** — the defined structure of tables, columns, types and constraints.
- **SERIAL / BIGSERIAL** — auto-incrementing integer columns backed by a sequence.
- **UUID** — 128-bit globally unique identifier, often used as a primary key.
- **JSONB** — Postgres's binary, indexable JSON type.
- **ENUM** — a custom type with a fixed set of allowed values.
- **Migration** — a versioned file of SQL statements that changes the schema, with up (apply) and down (revert) parts.
- **Seeding** — inserting test or sample data for development.
- **Constraint** — a rule the DB enforces on data (PK, NOT NULL, UNIQUE, CHECK, FK).
- **Primary key** — column(s) uniquely identifying a row. Implies NOT NULL and UNIQUE.
- **Composite key** — a key made of multiple columns.
- **Foreign key** — a column referencing another table's key, enforcing that the referenced row exists.
- **Referential integrity** — consistency between related tables, enforced via FKs and ON DELETE actions.
- **Linking (junction) table** — a table that implements a many-to-many relationship.
- **Alias** — a short name for a table in a query (`users u`).
- **LEFT JOIN** — join returning all left-table rows, with NULLs where there's no right match.
- **CTE** — Common Table Expression (`WITH name AS (...)`), a named subquery.
- **Parameterized query** — SQL with placeholders whose values are sent separately and treated as data.
- **SQL injection** — attack where crafted input alters a SQL statement's structure.
- **ILIKE** — Postgres case-insensitive pattern match.
- **Pagination** — returning results in pages via LIMIT and OFFSET or keyset cursors.
- **Trigger** — a DB function automatically run on events like INSERT, UPDATE or DELETE.
- **Index** — a sorted auxiliary structure (usually a B-tree) mapping values to row locations for fast lookups.
- **Sequential scan** — reading every row of a table to answer a query.
- **EXPLAIN ANALYZE** — shows and runs a query's execution plan with real timings.
- **Transaction** — a group of statements executed atomically.
- **ACID** — Atomicity, Consistency, Isolation, Durability.
- **MVCC** — Multi-Version Concurrency Control: readers see snapshots, so readers and writers don't block each other.
- **Normalization** — structuring tables to remove redundancy (1NF, 2NF, 3NF).

## Video timestamps
- [00:00](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=0s) — Why databases: persistence
- [02:05](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=125s) — What counts as a database
- [04:09](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=249s) — Disk-based databases, RAM vs disk
- [08:20](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=500s) — DBMS and its responsibilities
- [12:37](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=757s) — Why not text files: parsing, structure, concurrency
- [17:53](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=1073s) — Relational vs non-relational databases
- [22:10](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=1330s) — CRM vs CMS use cases
- [26:22](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=1582s) — Why Postgres
- [28:30](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=1710s) — Postgres JSON support
- [30:34](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=1834s) — SQL vs Postgres, skipping the basics
- [32:40](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=1960s) — TablePlus and data types overview
- [33:41](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=2021s) — SERIAL, BIGSERIAL, integer types
- [35:48](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=2148s) — DECIMAL/NUMERIC vs floating point
- [40:01](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=2401s) — CHAR vs VARCHAR vs TEXT
- [49:23](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=2963s) — Boolean, date, time, timestamptz, interval, UUID
- [50:27](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3027s) — JSON vs JSONB
- [51:28](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3088s) — Arrays, other types, inserting data
- [53:31](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3211s) — Designing the project-management database
- [54:36](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3276s) — Database migrations
- [56:36](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3396s) — Up and down migrations
- [58:43](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3523s) — How migration tools track versions
- [59:46](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3586s) — Why migrations
- [1:01:48](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3708s) — Setting up dbmate
- [1:03:57](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3837s) — ENUM types: integrity and documentation
- [1:09:14](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=4154s) — Users table and primary keys
- [1:12:20](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=4340s) — NOT NULL and UNIQUE
- [1:14:25](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=4465s) — created_at and updated_at
- [1:15:27](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=4527s) — Naming conventions and case sensitivity
- [1:16:31](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=4591s) — One-to-one: user_profiles
- [1:20:51](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=4851s) — Projects table and foreign keys
- [1:21:56](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=4916s) — Referential integrity: ON DELETE RESTRICT
- [1:23:58](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=5038s) — CASCADE, SET NULL, SET DEFAULT
- [1:25:02](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=5102s) — Tasks table
- [1:27:09](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=5229s) — CHECK constraints
- [1:29:11](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=5351s) — assigned_to, foreign-key constraint, one-to-many
- [1:32:16](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=5536s) — Many-to-many: project_members linking table
- [1:35:21](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=5721s) — Composite primary key
- [1:37:24](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=5844s) — Down migrations
- [1:38:25](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=5905s) — Applying migrations, schema_migrations table
- [1:40:31](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=6031s) — Seeding test data
- [1:42:35](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=6155s) — CTEs in seed data
- [1:44:42](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=6282s) — GET all users query
- [1:45:46](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=6346s) — LEFT JOIN vs INNER JOIN
- [1:48:54](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=6534s) — to_jsonb and embedding profiles
- [1:51:03](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=6663s) — ORDER BY created_at
- [1:52:06](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=6726s) — GET single user
- [1:53:10](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=6790s) — Parameterized queries
- [1:55:14](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=6914s) — SQL injection
- [1:59:27](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=7167s) — Dynamic filters, sorting, pagination
- [2:05:49](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=7549s) — ILIKE filter
- [2:07:54](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=7674s) — Dynamic sorting
- [2:08:55](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=7735s) — LIMIT and OFFSET pagination
- [2:10:59](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=7859s) — Create user: INSERT RETURNING
- [2:13:08](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=7988s) — Partial update (PATCH)
- [2:16:17](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=8177s) — The updated_at problem
- [2:17:23](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=8243s) — Triggers
- [2:18:23](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=8303s) — Indexes introduction
- [2:19:28](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=8368s) — Book index analogy
- [2:21:34](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=8494s) — Sequential scans
- [2:24:39](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=8679s) — How an index lookup works
- [2:27:47](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=8867s) — Index sort order
- [2:30:52](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=9052s) — When to index: WHERE, JOIN, ORDER BY
- [2:34:01](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=9241s) — Indexing foreign keys, PKs auto-indexed
- [2:38:12](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=9492s) — Index overhead and trade-offs
- [2:41:18](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=9678s) — Trigger function for updated_at
- [2:43:28](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=9808s) — Verifying the trigger
- [2:44:29](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=9869s) — Wrap-up: the backend database workflow
