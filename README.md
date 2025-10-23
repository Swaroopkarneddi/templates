# SQLRunner Django Backend

A small Django REST backend that lets authorized users execute SQL queries against a local SQLite database and inspect the database schema and sample rows. Intended for development, demos, or admin tools — **do not** expose this to untrusted users without additional authentication and safeguards.

---

## Table of Contents

* [Features](#features)
* [Requirements](#requirements)
* [Installation](#installation)
* [Configuration](#configuration)
* [Running the server](#running-the-server)
* [API Endpoints](#api-endpoints)

  * `POST /execute/`
  * `GET /tables/`
  * `GET /table/<table_name>/`
* [Examples (requests & responses)](#examples-requests--responses)
* [Utility behavior & limits](#utility-behavior--limits)
* [Security considerations](#security-considerations)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* Execute read-only (SELECT) SQL queries and return JSON rows and column names.
* Optionally allow non-SELECT statements (INSERT/UPDATE/DELETE/DDL) via a setting.
* List user-defined tables in the SQLite database.
* Inspect a table's schema and fetch a sample of rows.

## Requirements

* Python 3.8+
* Django (tested with 3.x / 4.x)
* Django REST Framework
* SQLite (built into Python)

Install dependencies (example):

```bash
pip install django djangorestframework
```

## Installation

1. Place this app (for example `sqlrunner/`) inside a Django project and add it to `INSTALLED_APPS`.
2. Ensure the `sqlrunner.urls` are included in your project `urls.py`:

```python
# project/urls.py
from django.urls import path, include

urlpatterns = [
    path('api/sqlrunner/', include('sqlrunner.urls')),
]
```

3. Provide or create a SQLite file (e.g. `sample.db`) and update settings (see next section).

## Configuration

These settings live in your Django `settings.py`. The app uses fallback defaults but you should explicitly set them for production/dev clarity.

```python
# settings.py
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent

# Where the SQLite sample DB is located (fallback: sqlrunner.utils.SAMPLE_DB_PATH)
SAMPLE_DB_PATH = BASE_DIR / "sample.db"

# How many sample rows to return for table detail
TABLE_SAMPLE_LIMIT = 10

# How many rows to return for SELECT queries (if LIMIT is not present in SQL)
QUERY_ROW_LIMIT = 1000

# Whether non-SELECT queries (INSERT/UPDATE/DELETE/DDL) are allowed via the API.
# Use with extreme caution. Default in this repo may be True for demo; consider False in production.
ALLOW_NON_SELECT_QUERIES = False
```

> Note: `SAMPLE_DB_PATH` is used by the utilities to open the SQLite file. If omitted, the module default `sample.db` (in the app directory) will be used.

## Running the server

Start Django normally:

```bash
python manage.py runserver
```

Visit `http://localhost:8000/api/sqlrunner/` + endpoint paths described below.

## API Endpoints

All responses are JSON and use standard HTTP status codes.

### `POST /api/sqlrunner/execute/`

Execute an SQL string. By default only **read-only** queries are allowed (queries starting with `SELECT`).

**Request body (JSON)**

```json
{ "query": "SELECT id, name FROM fruits WHERE qty > 0;" }
```

**Behavior**

* If the SQL is a SELECT and does not already contain a `LIMIT` clause, the server appends `LIMIT {QUERY_ROW_LIMIT}` to prevent huge data dumps.
* If `ALLOW_NON_SELECT_QUERIES` is `True`, non-SELECT queries will be executed and a success message returned.

**Success Response (SELECT)**

Status: `200 OK`

```json
{
  "columns": ["id", "name", "qty"],
  "rows": [
    {"id": 1, "name": "Apple", "qty": 50},
    {"id": 2, "name": "Banana", "qty": 30}
  ]
}
```

**Success Response (non-SELECT)**

Status: `200 OK` (only if `ALLOW_NON_SELECT_QUERIES = True`)

```json
{ "message": "Query executed successfully" }
```

**Error responses**

* `400 Bad Request` — missing `query` or SQL error.
* `403 Forbidden` — non-SELECT queries not allowed (when `ALLOW_NON_SELECT_QUERIES = False`).

### `GET /api/sqlrunner/tables/`

Returns a list of user tables in the SQLite database (excludes `sqlite_` internal tables).

**Response**

Status: `200 OK`

```json
{ "tables": ["fruits", "sales", "users"] }
```

### `GET /api/sqlrunner/table/<table_name>/?limit=5`

Returns the schema and a small set of sample rows for `<table_name>`.

**Query params**

* `limit` (optional) — number of sample rows to return (falls back to `TABLE_SAMPLE_LIMIT`).

**Success Response**

Status: `200 OK`

```json
{
  "schema": [
    {"cid": 0, "name": "id", "type": "INTEGER", "notnull": true, "dflt_value": null, "pk": true},
    {"cid": 1, "name": "name", "type": "TEXT", "notnull": false, "dflt_value": null, "pk": false}
  ],
  "samples": [
    {"id": 1, "name": "Apple"},
    {"id": 2, "name": "Banana"}
  ]
}
```

**Errors**

* `404 Not Found` — table not found.
* `500 Internal Server Error` — DB/IO error.

## Examples (requests & responses)

**cURL example — SELECT**

```bash
curl -X POST "http://localhost:8000/api/sqlrunner/execute/" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT id, name FROM fruits WHERE qty > 0"}'
```

**cURL example — non-SELECT (INSERT)**

```bash
curl -X POST "http://localhost:8000/api/sqlrunner/execute/" \
  -H "Content-Type: application/json" \
  -d '{"query":"INSERT INTO fruits(name, qty) VALUES(\"Pear\", 10)"}'}
```

(Only succeeds if `ALLOW_NON_SELECT_QUERIES = True`)

**Python example using `requests`**

```python
import requests

url = 'http://localhost:8000/api/sqlrunner/execute/'
resp = requests.post(url, json={"query": "SELECT * FROM fruits LIMIT 5;"})
print(resp.json())
```

## Utility behavior & limits

* `is_read_only_query(sql)` performs a simple check: it trims the SQL and checks whether the first token (case-insensitive) is in `('select',)`. This is intentionally simple and may not detect maliciously crafted queries that still are non-read-only — treat as a convenience guard only.
* The module appends `LIMIT {QUERY_ROW_LIMIT}` to SELECTs that lack a limit.
* `execute_query` commits for non-SELECT statements only when allowed.
* `list_tables` excludes internal `sqlite_` tables.

## Security considerations (important)

This app executes raw SQL strings against a SQLite file. This is powerful and dangerous if exposed.

* **Do not** expose this endpoint to untrusted networks or unauthenticated users.
* Add authentication (DRF token / session / OAuth) and authorization checks before allowing access.
* Consider logging queries and rate-limiting usage.
* If you need to accept user-provided SQL from the public, implement a much stronger parser/whitelist or sandboxing.
* Be cautious enabling `ALLOW_NON_SELECT_QUERIES` — it permits modifications to your DB via the API.

## Debugging tips

* If you see `table not found` on `GET /table/<name>/`, confirm the `SAMPLE_DB_PATH` path is correct and the DB contains that table.
* Use `sqlite3 sample.db` locally to inspect data.

## Contributing

PRs welcome — please follow typical Django best practices and add tests for new behavior.

## License

MIT

---

*If you'd like, I can*:

* convert this to a GitHub README ready markdown file,
* add example requests for Postman collection, or
* add a short section showing how to wire up DRF authentication for these endpoints.
