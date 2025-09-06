# @computerwwwizards/dependency-injection

A tiny, friendly dependency-injection helper. It provides a minimal container (`PrimitiveContainer`) and an extension that lets you register a per-binding resolver callback (`PreProcessDependencyContainer`) which runs before the provider.

This README shows quick examples to get you running — informal and to the point.

## Exports

- `PrimitiveContainer` — basic container with `bindTo` and `get`. Supports `singleton` and `transient` scopes.
- `PreProcessDependencyContainer` — extends `PrimitiveContainer` and supports a `resolveDependencies` callback per binding.
- `createAutoResolveDepsInOrder(deps)` — helper that returns a resolver which resolves deps in order and returns an array.
- `createAutoResolver(deps)` — helper that returns a resolver which resolves deps and returns an object keyed by identifier.
- `types` — various TypeScript types and interfaces used by the package.

## Quick start

Install (consumer):

```bash
pnpm add @computerwwwizards/dependency-injection
```

### PrimitiveContainer (singleton vs transient)

```ts
import { PrimitiveContainer } from '@computerwwwizards/dependency-injection'

type Registry = { config: { apiUrl: string }, timestamp: number }

const container = new PrimitiveContainer<Registry>()

// singleton provider — same instance on every `get`
container.bindTo('config', () => ({ apiUrl: 'https://api.example' }), 'singleton')

// transient provider — recomputed on every `get`
container.bindTo('timestamp', () => Date.now(), 'transient')

const cfg = container.get('config')
const a = container.get('timestamp')
const b = container.get('timestamp')
// a !== b
```

### PreProcessDependencyContainer — resolver runs before provider

This container allows you to register a `resolveDependencies` callback for a binding. The resolver is executed when the bound value is requested and its result is passed into the `provider`.

```ts
import { PreProcessDependencyContainer, createAutoResolveDepsInOrder, createAutoResolver } from '@computerwwwizards/dependency-injection'

type Registry = { db: unknown, logger: unknown, service: unknown }

const container = new PreProcessDependencyContainer<Registry>()

container.bindTo('db', () => ({ connected: true }), 'singleton')
container.bindTo('logger', () => ({ level: 'info' }), 'singleton')

// resolver returns an ordered array of resolved deps
container.bind('service', {
  scope: 'transient',
  resolveDependencies: createAutoResolveDepsInOrder<Registry>([
    { identifier: 'db' },
    { identifier: 'logger' }
  ]),
  provider: (resolved) => {
    const [db, logger] = resolved
    return { db, logger }
  }
})

// or resolver returns an object by keys
container.bind('service', {
  scope: 'transient',
  resolveDependencies: createAutoResolver<Registry, 'db' | 'logger'>([
    { identifier: 'db' },
    { identifier: 'logger' }
  ]),
  provider: (resolved) => resolved
})

const svc = container.get('service')

```

## Notes & tips

- The `resolveDependencies` callback is optional; if omitted, you can still use `bindTo` directly on `PrimitiveContainer`.
- Keep the resolved shape stable per-binding (either always an object or always an array) so providers know what to expect.
- The helpers `createAutoResolveDepsInOrder` and `createAutoResolver` are convenience functions for common patterns.

## Development

Run tests and checks from the package directory:

```bash
pnpm --filter @computerwwwizards/dependency-injection test
pnpm --filter @computerwwwizards/dependency-injection check
```


