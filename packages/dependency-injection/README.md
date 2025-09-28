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

## What's included

- **`PrimitiveContainer`**: Basic DI container with `bindTo()`, `get()`, `unbind()`
- **`PrimitiveContainerWithUse`**: Same as above + `use()` method for plugins
- **`PreProcessDependencyContainer`**: Advanced container with dependency resolution via `bind()`
- **`PreProcessDependencyContainerWithUse`**: Advanced container + `use()` method for plugins  
- **`createWithUse()`**: Mixin function to add `use()` method to any container class
- **Helper functions**: `createAutoResolver`, `createAutoResolveDepsInOrder` for common dependency patterns

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

### Plugin/Middleware Pattern: Containers with use()

For modular dependency registration, use the containers with the `use()` method:

```ts
import { PrimitiveContainerWithUse, PreProcessDependencyContainerWithUse } from '@computerwwwizards/dependency-injection'

// Basic container with plugin support
const container = new PrimitiveContainerWithUse<{
  config: { apiUrl: string }
  logger: { log: (msg: string) => void }
  httpClient: { get: (path: string) => Promise<any> }
}>()

// Create modular plugins
const configPlugin = (c) => {
  c.bindTo('config', () => ({ apiUrl: 'https://api.example.com' }), 'singleton')
}

const loggingPlugin = (c) => {
  c.bindTo('logger', () => ({ log: console.log }), 'singleton')
}

const httpPlugin = (c) => {
  c.bindTo('httpClient', (ctx) => {
    const config = ctx.get('config')
    return {
      get: async (path) => fetch(`${config.apiUrl}${path}`).then(r => r.json())
    }
  })
}

// Use plugins to configure the container
container.use(configPlugin, loggingPlugin, httpPlugin)

// Now everything is ready
const client = container.get('httpClient')
const data = await client.get('/users')
```

### Advanced: PreProcessDependencyContainer with Plugins

```ts
import { PreProcessDependencyContainerWithUse, createAutoResolver } from '@computerwwwizards/dependency-injection'

const container = new PreProcessDependencyContainerWithUse<{
  database: { query: (sql: string) => any[] }
  logger: { log: (msg: string) => void }
  userService: { findUser: (id: string) => any }
}>()

const databasePlugin = (c) => {
  c.bindTo('database', () => ({ query: (sql) => [] }), 'singleton')
}

const loggingPlugin = (c) => {
  c.bindTo('logger', () => ({ log: console.log }), 'singleton')  
}

const userServicePlugin = (c) => {
  c.bind('userService', {
    resolveDependencies: createAutoResolver([
      { identifier: 'database' },
      { identifier: 'logger' }
    ]),
    provider: (deps) => ({
      findUser: (id) => {
        deps.logger.log(`Finding user ${id}`)
        return deps.database.query(`SELECT * FROM users WHERE id = ${id}`)[0]
      }
    })
  })
}

// Chain plugins together
container.use(databasePlugin, loggingPlugin, userServicePlugin)

const userService = container.get('userService')
const user = userService.findUser('123')
```

### Custom Mixins: createWithUse

Create your own container classes with plugin support:

```ts
import { createWithUse, PrimitiveContainer, PreProcessDependencyContainer } from '@computerwwwizards/dependency-injection'

// Create a custom container class with use() method
const MyCustomContainerWithUse = createWithUse(PrimitiveContainer)

// Or with the advanced container
const MyAdvancedContainerWithUse = createWithUse(PreProcessDependencyContainer)

// Use it like any other container
const container = new MyCustomContainerWithUse<{ service: string }>()
container.use((c) => {
  c.bindTo('service', () => 'Hello World!')
  return c
})
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
- **Modular plugin system**: Use the `use()` method to create reusable, composable dependency modules
- **Flexible mixin pattern**: Create custom container classes with `createWithUse()`

### Child containers: `ChildPrimitiveContainer`

Create a child container that can fall back to a parent container for lookups. This is useful for scoping overrides (tests, feature flags, request-local data) while still inheriting common registrations from a shared parent.

Behavior highlights:
- Lookups first check the child container's own registry.
- If not found, the child will attempt to read from the parent container (if provided).
- Child values can override parent registrations.
- If a value is not found on either side, the child will throw unless the optional `doNotThrowIfNull` flag is passed.

```ts
import { ChildPrimitiveContainer, PrimitiveContainerWithUse } from '@computerwwwizards/dependency-injection'

// Parent with shared services
const parent = new PrimitiveContainerWithUse<{
  config: { apiUrl: string }
  logger: { log: (msg: string) => void }
}>()

parent.bindTo('config', () => ({ apiUrl: 'https://api.example.com' }), 'singleton')
parent.bindTo('logger', () => ({ log: console.log }), 'singleton')

// Child that inherits from parent but can override
const child = new ChildPrimitiveContainer(parent)

// Child override
child.bindTo('config', () => ({ apiUrl: 'https://staging.example.com' }), 'singleton')

// lookups prefer child
console.log(child.get('config').apiUrl) // 'https://staging.example.com'
console.log(child.get('logger')) // falls back to parent and returns logger

// optional lookup without throwing
console.log(child.get('nonExisting' as any, true)) // undefined
```

For test isolation, create a child container with test-specific overrides and assert behavior without mutating the parent.

## Common patterns and tips

### Modular plugins for reusability
```ts
// ✅ Create reusable plugins for common functionality
const databasePlugin = (dbUrl: string) => (container) => {
  container.bindTo('database', () => createDatabaseConnection(dbUrl), 'singleton')
  return container
}

const loggerPlugin = (level: string) => (container) => {
  container.bindTo('logger', () => createLogger(level), 'singleton')
  return container
}

// Use across different containers
const devContainer = new PrimitiveContainerWithUse()
devContainer.use(
  databasePlugin('sqlite://dev.db'),
  loggerPlugin('debug')
)

const prodContainer = new PrimitiveContainerWithUse()
prodContainer.use(
  databasePlugin('postgres://prod-db'),
  loggerPlugin('error')
)
```

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

- [x] Plugin/middleware pattern with `use()` method
- [x] Mixin creator function `createWithUse()`
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
