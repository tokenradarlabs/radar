# Fastify & Typescript App

> Fastify & TypeScript starter repository.

## Installation

```bash
$ git clone https://github.com/Matschik/fastify-typescript-starter.git
$ cd fastify-typescript-starter
$ npm run install
```

## Usage

### Development
```bash
# Required: typescript watch compilation
$ npm run watch

# Required: development server with hot reload (nodemon)
$ npm run dev


# Format with prettier
$ npm run format
```

### Production

```bash
# build for production
$ npm run build

# start production app
$ npm run start
```

## Environment Variables

The application uses the following environment variables:

- `LOG_PRETTY`: (Optional) Set to `true` to force pretty logging output. Defaults to `false`.
- `MAINTENANCE_MODE`: (Optional) Set to `true` to activate maintenance mode, returning a 503 status for all requests. Defaults to `false`.
- `GIT_HASH`: (Optional) The current Git commit hash, used for Sentry releases and internal tracking. Automatically set in production environments. Defaults to `unknown` in development.

Developers can set these environment variables using a `.env` file in the project root, by passing them as CLI arguments (e.g., `VAR=value npm run dev`), or through deployment configurations.
