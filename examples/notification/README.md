# HTTP Notification Callback

The extension can push usage data to your server via an HTTP callback. This page describes:

1. [Protocol contract](#protocol-contract) — what your HTTP endpoint must satisfy.
2. [Request body (JSON)](#request-body) — every field the extension sends.
3. [Signature verification](#signature-verification) — how to verify `Tt4b-Sign`.
4. [Full example](#full-example) — a complete request you can use for testing.
5. [Local demo server](#local-demo-server) — run a sample receiver locally.

---

## Protocol contract

Your endpoint **must** satisfy every requirement below. The extension will only ever call the URL the user saved in settings.

| # | Requirement |
|---|-------------|
| 1 | Accept **`POST`** requests. The extension never uses any other HTTP method for a real callback. |
| 2 | The URL scheme must be **`http://`** or **`https://`**. The extension will not use other URL schemes. |
| 3 | The request carries **`Content-Type: application/json`** with a **UTF-8** JSON body whose structure is defined in [Request body](#request-body). |
| 4 | If the user configured an **auth token**, the request includes a **`Tt4b-Sign`** header (see [Signature verification](#signature-verification)). If no token is configured the header is **omitted** — your server must not require it in that case. |
| 5 | Return a **2xx** status (e.g. `200`) to signal success. The extension only treats the delivery as successful for **2xx** responses. The **response body is not used**. |
| 6 | Return a meaningful **4xx / 5xx** status to signal failure. The user may see the **HTTP status text** of your response, so use a descriptive reason phrase (e.g. `401 Unauthorized`, `400 Bad Request`). |

**Out of scope:** what you do with the data (store, forward, log, etc.) is entirely up to you — as long as you return **2xx** when you have successfully accepted the payload.

---

## Request body

The top-level JSON object contains four keys:

| Field | Type | Description |
|-------|------|-------------|
| `meta` | `object` | Client metadata — see [`meta`](#meta). |
| `cycle` | `string` | `"daily"` or `"weekly"` — the reporting period the user chose. |
| `summary` | `object` | Aggregated totals for the period — see [`summary`](#summary). |
| `row` | `array` | Per-site, per-day breakdown — see [`row`](#row-items). |

### `meta`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `locale` | `string` | `"en"` | The app's UI locale at the time the payload was built. |
| `version` | `string` | `"1.0.0"` | Extension version string. |
| `ts` | `number` | `1710000000000` | When the payload was built: milliseconds since the Unix epoch. |

### `summary`

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `focus` | `number` | `3600` | Total **focus time in milliseconds** across all sites in the period. Focus time is the accumulated duration a tab was in the foreground and the user was actively interacting. |
| `visit` | `number` | `42` | Total page-visit count across all sites in the period. |
| `siteCount` | `number` | `3` | Number of distinct hosts present in `row`. |
| `dateStart` | `string` | `"2025-01-15"` | First date of the period (`YYYY-MM-DD`). |
| `dateEnd` | `string` | `"2025-01-15"` | Last date of the period (`YYYY-MM-DD`). For a daily cycle `dateStart === dateEnd`. |

### `row` items

Each element in the `row` array represents **one host on one day**:

| Field | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `host` | `string` | yes | `"example.com"` | The site's hostname (no scheme, no path). |
| `date` | `string` | yes | `"2025-01-15"` | The calendar date (`YYYY-MM-DD`). |
| `focus` | `number` | yes | `1200` | Focus time **in milliseconds** for this host on this date. |
| `time` | `number` | yes | `10` | **Visit count** for this host on that calendar day (how many page visits were recorded; **not** a length of time). |
| `run` | `number` | no | `5000` | **Run time** in milliseconds for this host on this date (only when run-time tracking is enabled for the site; not the same as focus time). |

> **Consistency check:** `summary.focus` equals the sum of all `row[].focus` values, and `summary.visit` equals the sum of all `row[].time` values.

---

## Signature verification

| Auth token configured? | `Tt4b-Sign` header |
|-------------------------|--------------------|
| No (empty) | **Not sent.** Do not require or check it. |
| Yes | `Tt4b-Sign: <64 lowercase hex characters>` |

**Algorithm:** HMAC-SHA256.

- **Key** — the auth-token string (UTF-8).
- **Data** — an **empty string** (`""`).

> ⚠️ The HMAC is computed over an **empty** input, **not** over the request body. This is by design — the signature proves the caller knows the shared token, not that the body is untampered. If you need body-integrity verification, hash the body separately after validating the token.

```js
import { createHmac } from 'node:crypto';

function verifySign(header, token) {
  const expected = createHmac('sha256', token).update('').digest('hex');
  return expected === header;
}
```

---

## Full example

**Request:**

```
POST /callback HTTP/1.1
Content-Type: application/json
Tt4b-Sign: <64 hex chars — only if token is set>
```

```json
{
  "meta": {
    "locale": "en",
    "version": "1.0.0",
    "ts": 1710000000000
  },
  "cycle": "daily",
  "summary": {
    "focus": 3600,
    "visit": 42,
    "siteCount": 3,
    "dateStart": "2025-01-15",
    "dateEnd": "2025-01-15"
  },
  "row": [
    { "host": "example.com",  "date": "2025-01-15", "focus": 1200, "time": 10 },
    { "host": "github.com",   "date": "2025-01-15", "focus": 1800, "time": 25 },
    { "host": "docs.test.io", "date": "2025-01-15", "focus": 600,  "time": 7  }
  ]
}
```

**Expected response:** `200 OK` (body is ignored).

> The three rows sum to `focus=3600` and `time=42`, matching `summary.focus` and `summary.visit`.

---

## Local demo server

From the `examples/` package ([setup](../README.md)):

```bash
# Optional: set AUTH to the same value as the extension's auth token
export AUTH="my-secret-token"
npm run start:notification
```

This starts `demo-server.ts` on **port 3000**.

| Method | Demo behavior |
|--------|---------------|
| `POST` | Parses JSON, optionally verifies `Tt4b-Sign`, responds `200` / `401` / `400`. |
| `HEAD` | `200` (this demo only; the extension’s callback does not use `HEAD`.) |
| Any other | `405 Method Not Allowed`. **The real callback always uses `POST`.** |

> The demo only checks `meta` for the signature; it does **not** validate the full body shape. A production service should follow the [protocol contract](#protocol-contract) and field definitions above.