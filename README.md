<img src="https://raw.githubusercontent.com/Otya063/rain-web/development/static/img/common/rain_server_logo.webp" width="50%" height="50%" />

This is the [Rain Authentication Website](https://auth.rain-server.com/) repository.

## Get Started

Install dependencies.
```bash
pnpm install
```

Seed the local DB connection info into KV (once). `--env` is required since the `DB_CONFIG` binding is only declared inside the `[env.*]` blocks in wrangler.toml.
```bash
npx wrangler kv key put db_config "{\"host\":\"...\",\"port\":5432,\"database\":\"...\",\"username\":\"...\",\"password\":\"...\"}" --binding=DB_CONFIG --local --env development
```

Start a local server for developing Worker. `--env` is required for the same reason as above.
```bash
wrangler dev --env development
```

### Deploy the website.
 - Development Site: Push or merge to the development branch.
 - Production Site: Push or merge to the main branch.

## Documentation
 - [Sveltekit](https://kit.svelte.dev/docs/introduction)
 - [Typescript](https://www.typescriptlang.org/docs/)
 - [Postgres.js](https://github.com/porsager/postgres)
 - [Sass](https://sass-lang.com/documentation/)
 - [Typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/adapter-svelte)
 - [Cloudflare Workers](https://developers.cloudflare.com/workers/)