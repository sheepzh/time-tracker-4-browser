# Gist Mock Server

This mock server provides an in-memory Gist API for end-to-end testing.
It follows the GitHub Gist REST contract for the endpoints needed by this project.

## Supported APIs

- `GET /gists?per_page=100&page=1`
- `GET /gists/:id`
- `POST /gists` (create)
- `PATCH /gists/:id` (official update API)
- `POST /gists/:id` (compat mode for current project call path)
- `DELETE /gists/:id`
- `GET /raw/:id/:filename`

Response shape is primarily aligned with GitHub Gist REST API, while keeping compatibility with current project call paths (for example `POST /gists/:id`).

## Run

```bash
cd examples
npm install
npm run start:gist
```

Optional environment variables:

- `PORT` (default: `12347`)
- `GIST_TOKEN` (if set, requests must contain `Authorization: token <GIST_TOKEN>` or `Authorization: Bearer <GIST_TOKEN>`)

## Test with curl

```bash
curl -X POST "http://localhost:12347/gists" \
  -H "Authorization: token demo" \
  -H "Content-Type: application/json" \
  -d '{
    "public": false,
    "description": "Used for timer to save meta info. Don'\''t change this description :)",
    "files": {
      "README.md": {"filename": "README.md", "content": "hello"},
      "clients.json": {"filename": "clients.json", "content": "[]"}
    }
  }'
```
