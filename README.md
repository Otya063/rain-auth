<img src="https://raw.githubusercontent.com/Otya063/rain-web/development/static/img/common/rain_server_logo.webp" width="50%" height="50%" />

This is the [Rain Authentication Website](https://auth.rain-server.com/) repository.

## Get Started

Install dependencies.
```bash
npm install
```

Generate prisma client for accelerate.
```bash
npx prisma generate --no-engine
```

Start a local server for developing Worker.
```bash
wrangler dev
```

### Deploy the website.
 - Development Site: Push or merge to the development branch.
 - Production Site: Push or merge to the main branch.

## Documentation
 - [Sveltekit](https://kit.svelte.dev/docs/introduction)
 - [Typescript](https://www.typescriptlang.org/docs/)
 - [Prisma](https://www.prisma.io/docs)
 - [Sass](https://sass-lang.com/documentation/)
 - [Typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n/tree/main/packages/adapter-svelte)
 - [Cloudflare Workers](https://developers.cloudflare.com/workers/)