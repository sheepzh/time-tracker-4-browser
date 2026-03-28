# Examples Package

The `examples` directory is an independent npm package for local demo and e2e helper servers.

## Setup

```bash
cd examples
npm install
```

## Available scripts

- `npm run start:gist` - start Gist mock server
- `npm run start:notification` - start notification demo server

## Environment variables

### Gist mock server

- `PORT` (default: `12347`)
- `GIST_TOKEN` (optional auth token; supports `token` or `Bearer` authorization header)

### Notification demo server

- `AUTH` (optional signature secret)
