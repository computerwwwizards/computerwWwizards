# @computerwwwizards/dependency-injection

Welcome! This is a super lightweight, callback-based dependency injection container for TypeScript/JavaScript. No decorators, no proxies, no magic — just simple, flexible DI for real-world code.

## Why use this?

- **Tiny footprint**: No runtime bloat, no decorators, no proxies, no magic. You can actually read the code in one sitting.
- **Elastic API**: Works with any value, any type, any pattern. You control how dependencies are resolved.
- **No proxy/decorator overhead**: Unlike InversifyJS or tsyringe, this package is browser-friendly and works with module federation setups.
- **No forced patterns**: You decide how to wire dependencies, using simple callbacks and context.
- **Explicit lifecycle**: Singletons live as long as the container; transients are created on demand.

### Motivation

Most DI libraries are heavy, opinionated, and rely on TypeScript decorators or proxies. This causes:
- Bundle size bloat
- Browser compatibility issues
- Problems with module federation (multiple containers, duplicated metadata)
- Hard-to-debug magic

This package solves those problems by being minimal, explicit, and callback-driven. You get all the flexibility, none of the headaches.

## Quick Start (Copy-paste friendly!)

### Basic usage: PrimitiveContainer

```ts
import { PrimitiveContainer } from '@computerwwwizards/dependency-injection'

const container = new PrimitiveContainer()

// Register a singleton value
container.bindTo('config', () => ({ apiUrl: 'https://api.example' }), 'singleton')

// Register a transient value (new every time)
container.bindTo('timestamp', () => Date.now(), 'transient')

// Get your stuff
const config = container.get('config')
const now = container.get('timestamp')
```

### Advanced: PreProcessDependencyContainer (resolve dependencies with context)

```ts
import { PreProcessDependencyContainer } from '@computerwwwizards/dependency-injection'

const container = new PreProcessDependencyContainer()

container.bindTo('db', () => ({ connected: true }), 'singleton')
container.bindTo('logger', () => ({ level: 'info' }), 'singleton')

// Register a service that depends on db and logger
container.bind('service', {
  resolveDependencies: ctx => ({ db: ctx.get('db'), logger: ctx.get('logger') }),
  provider: deps => ({
    doSomething: () => deps.logger.level + ' ' + deps.db.connected
  })
})

const service = container.get('service')
service.doSomething() // 'info true'
```

### Pro tip: Unbind when you want to clean up

```ts
container.unbind('service') // Removes the registration
```

### Using the helper functions for common patterns

```ts
import { createAutoResolveDepsInOrder, createAutoResolver } from '@computerwwwizards/dependency-injection'

// Array-based resolution (positional)
container.bind('serviceArray', {
  resolveDependencies: createAutoResolveDepsInOrder([
    { identifier: 'db' },
    { identifier: 'logger' }
  ]),
  provider: ([db, logger]) => ({ db, logger })
})

// Object-based resolution (by key)
container.bind('serviceObj', {
  resolveDependencies: createAutoResolver([
    { identifier: 'db' },
    { identifier: 'logger' }
  ]),
  provider: resolved => resolved
})
```

## Strengths

- **Minimal code, easy to audit**: The entire codebase is small and readable
- **No external dependencies**: Zero npm deps beyond dev tools
- **Works everywhere**: Browser, Node, and with module federation
- **No forced class patterns or decorators**: Use functions, objects, whatever you want
- **You control dependency graph and lifecycle**: Explicit is better than implicit

## Common patterns and tips

### Memory-friendly approach: Use the container context
```ts
// ❌ Problematic: captures external refs in closure
const largeData = loadHugeDataset()
container.bindTo('service', () => new Service(largeData))

// ✅ Better: register data in container, resolve via context
container.bindTo('data', () => loadHugeDataset(), 'singleton')
container.bind('service', {
  resolveDependencies: ctx => ({ data: ctx.get('data') }),
  provider: deps => new Service(deps.data)
})
```

### Error handling
```ts
// The container throws if a dependency isn't found
try {
  const missing = container.get('notRegistered')
} catch (error) {
  console.log(error.message) // "Could not resolve notRegistered, did you register it?"
}

// Or use the optional flag to get undefined instead
const maybeValue = container.get('notRegistered', true) // returns undefined
```

## Roadmap

- [ ] Error handling strategies (circular dep detection, error callbacks)
- [ ] Lifecycle hooks (init/dispose, lazy activation)
- [ ] Child container creation (inherit/override bindings)
- [ ] WeakMap support for stateless dep reuse
- [ ] Benchmarks and performance comparisons
- [ ] Garbage collection inspections
- [ ] Document antipatterns that lead to memory leaks
- [ ] Add more examples and recipes

## Development

Run tests and checks from the package directory:

```bash
pnpm --filter @computerwwwizards/dependency-injection test
pnpm --filter @computerwwwizards/dependency-injection check
```

## License

MIT
