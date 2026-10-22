# XVN Contributing Docs

### Getting Started

#### Installing

- `nrz install`

#### Building

- `nrr build` - will build all parts of the project
- `nrr build:dist` - will build dist directories
- `nrr build:assets` - will build & move static assets
- `nrr build:bin` - will build the bin script
- `nrr build:worker` - will build the worker

#### Database Operations

- `nrr db:setup`
- `nrr db:drop`
- `nrr db:studio`
- `nrr db:generate`
- `nrr db:migrate`
- `nrr db:push`

#### Serving

- `nrr serve:build` - will build & start the services
- `nrr serve:death` - will kill any hanging `wrangler` processes
  (which can happen if you're developing with agents a lot)
- Post-build you can also run the bin directly:
  `node ./dist/bin/xvn.js`
- To make `xvn` available globally: `npm link`, then run `xvn` from anywhere

### Troubleshooting

#### `setRawMode EBADF` or `kqueue.c` assertion during `nrr build`

Next.js 16/Turbopack tries to set stdin to raw mode for progress display.
When running inside a non-TTY wrapper (e.g. varlock, CI, agent shells),
this fails with `EBADF` or a libuv kqueue assertion.

**Fix:** `TERM=dumb nrr build`

#### `ERR_PACKAGE_PATH_NOT_EXPORTED` for wrangler

The built binary resolves wrangler via `require.resolve()`, which fails if
wrangler's `package.json` exports map doesn't expose `./bin/wrangler.js`.

**Fix:** Ensure `src/bin/xvn.ts` resolves the bin path relative to the
wrangler package directory (`path.resolve(path.dirname(pkgPath), relBinPath)`)
rather than through `require.resolve()`.

#### `Better Auth: Base URL is not set`

This warning is non-fatal. The web UI process sets `BETTER_AUTH_URL` via
env vars; the registry worker derives it from the incoming request. Auth
callbacks work as long as the browser hits the web UI origin.

#### `nrr serve:death` — hanging processes

After crashes or force-kills, wrangler/workerd child processes can linger.
Run `nrr serve:death` to clean them up before restarting.
