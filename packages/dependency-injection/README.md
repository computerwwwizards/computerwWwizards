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
- **`BasicContainer`**: Enhanced plugin-aware container with lazy plugin registration and sub-plugin support (extends `PreProcessDependencyContainerWithUse`)
- **`BasicChildContainer`**: Child scope with same plugin capabilities (extends `ChildPreProcessDependencyContainerWithUse`)
- **`createWithUse()`**: Mixin function to add `use()` method to any container class
- **`createAutoResolver`**: Resolve dependencies as a typed object (most common pattern)
- **`createAutoResolveDepsInOrder`**: Resolve dependencies as an array in specified order
- **Child containers**: `ChildPrimitiveContainer` for inheritance and testing

## BasicContainer & BasicChildContainer

The **`BasicContainer`** is the most feature-rich and recommended for most use cases. It extends `PreProcessDependencyContainerWithUse` and adds powerful plugin management capabilities:

### Key Features

- **Plugin variants/sub-plugins**: Register multiple implementations of a plugin (e.g., `mock`, `custom`, etc.) and switch between them
- **Lazy plugin registration**: Register plugins with tags and apply them selectively
- **Method chaining**: All methods return `this` for fluent API
- **Centralized types**: Supports both simple plugins and plugins with sub-plugins seamlessly

### BasicContainer Hierarchy

```
PrimitiveContainer
  └── PreProcessDependencyContainer
        └── PreProcessDependencyContainerWithUse
              └── BasicContainer (✨ Enhanced plugin management)
```

### BasicChildContainer Hierarchy

```
ChildPrimitiveContainer
  └── ChildPreProcessDependencyContainer
        └── ChildPreProcessDependencyContainerWithUse
              └── BasicChildContainer (✨ Same plugin capabilities as BasicContainer)
```

Both classes support the exact same plugin API, making them interchangeable in terms of how you register and manage plugins.



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

### Advanced: PreProcessDependencyContainer with auto-resolution

The most powerful pattern - use `createAutoResolver` to automatically resolve dependencies:

```ts
import { PreProcessDependencyContainer, createAutoResolver } from '@computerwwwizards/dependency-injection'

const container = new PreProcessDependencyContainer()

container.bindTo('database', () => ({ connected: true }), 'singleton')
container.bindTo('logger', () => ({ log: console.log }), 'singleton')

// Use createAutoResolver for clean, typed dependency resolution
container.bind('userService', {
  resolveDependencies: createAutoResolver([
    { identifier: 'database' },
    { identifier: 'logger' }
  ]),
  provider: (deps) => ({
    // deps is typed as { database: Database, logger: Logger }
    findUser: (id: string) => {
      deps.logger.log(`Finding user ${id}`)
      return deps.database.connected ? { id, name: 'User' } : null
    }
  })
})

const userService = container.get('userService')
const user = userService.findUser('123')
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

### BasicContainer: Advanced Plugin Management (Recommended)

**`BasicContainer`** is the most powerful and recommended for production use. It adds lazy plugin registration, plugin variants (mocks, sub-plugins), and selective application:

```ts
import { BasicContainer } from '@computerwwwizards/dependency-injection'

interface AppServices {
  api: { fetch: (url: string) => Promise<any> }
  logger: { log: (msg: string) => void }
  cache: { get: (key: string) => any, set: (key: string, value: any) => void }
}

const container = new BasicContainer<AppServices>()

// 1. SIMPLE PLUGINS (just a function)
const loggerPlugin = (ctx: BasicContainer<AppServices>) => {
  ctx.bindTo('logger', () => ({ log: console.log }), 'singleton')
}

// 2. PLUGINS WITH SUB-PLUGINS (e.g., mock variants)
const apiPlugin = (ctx: BasicContainer<AppServices>) => {
  ctx.bindTo('api', () => ({
    fetch: async (url) => fetch(url).then(r => r.json())
  }), 'singleton')
}

// Add a mock variant that works when testing
apiPlugin.mock = (ctx: BasicContainer<AppServices>) => {
  ctx.bindTo('api', () => ({
    fetch: async (url) => ({ mocked: true, url })
  }), 'singleton')
}

// Add a staging variant
apiPlugin.staging = (ctx: BasicContainer<AppServices>) => {
  ctx.bindTo('api', () => ({
    fetch: async (url) => fetch(`https://staging.api.com${url}`).then(r => r.json())
  }), 'singleton')
}

// 3. DIRECT USAGE - use plugins immediately
container.use(loggerPlugin, apiPlugin)

// 4. USE MOCKS - switch to mock variants (must be called before use())
container.useMocks().use(apiPlugin)

// 5. USE CUSTOM SUB-PLUGIN - switch to a specific variant
container.useSubPlugin('staging').use(apiPlugin)

// 6. LAZY REGISTRATION - register plugins with tags for later
container
  .registerPlugin(loggerPlugin)
  .registerPlugin(apiPlugin, ['api', 'production'])

// 7. APPLY PLUGINS - selectively apply by tag
container.applyPlugins(['api'])  // Only applies apiPlugin

// 8. APPLY ALL - apply everything that was registered
container.applyPlugins()

// Get your services
const api = container.get('api')
const result = await api.fetch('/users')
```

#### Real-World Pattern: Environment-based Variants

```ts
import { BasicContainer, createAutoResolver } from '@computerwwwizards/dependency-injection'

interface Services {
  config: { env: 'dev' | 'staging' | 'prod', apiUrl: string }
  database: { query: (sql: string) => Promise<any> }
  logger: { log: (msg: string) => void }
}

const container = new BasicContainer<Services>()

// Configuration plugin
const configPlugin = (ctx: BasicContainer<Services>) => {
  ctx.bindTo('config', () => ({
    env: process.env.NODE_ENV as any || 'dev',
    apiUrl: process.env.API_URL || 'http://localhost:3000'
  }), 'singleton')
}

// Database plugin with variants
const databasePlugin = (ctx: BasicContainer<Services>) => {
  // Production implementation
  ctx.bindTo('database', () => ({
    query: async (sql: string) => {
      // Real database query
      return []
    }
  }), 'singleton')
}

// Mock for testing
databasePlugin.mock = (ctx: BasicContainer<Services>) => {
  ctx.bindTo('database', () => ({
    query: async (sql: string) => {
      // Mock data
      if (sql.includes('SELECT')) {
        return [{ id: 1, name: 'Mock User' }]
      }
      return []
    }
  }), 'singleton')
}

// In-memory for development
databasePlugin.dev = (ctx: BasicContainer<Services>) => {
  const data: any[] = []
  ctx.bindTo('database', () => ({
    query: async (sql: string) => data
  }), 'singleton')
}

// Logger plugin with variants
const loggerPlugin = (ctx: BasicContainer<Services>) => {
  ctx.bind('logger', {
    resolveDependencies: createAutoResolver([{ identifier: 'config' }]),
    provider: (deps) => ({
      log: (msg: string) => console.log(`[${deps.config.env}] ${msg}`)
    }),
    scope: 'singleton'
  })
}

// Choose environment
const env = process.env.NODE_ENV || 'dev'

if (env === 'test') {
  container.useMocks()  // Use all .mock variants
} else if (env === 'dev') {
  container.useSubPlugin('dev')  // Use all .dev variants
}

// Register and apply
container
  .registerPlugin(configPlugin, ['config'])
  .registerPlugin(databasePlugin, ['database'])
  .registerPlugin(loggerPlugin, ['logger'])
  .applyPlugins()  // Apply everything

const logger = container.get('logger')
logger.log('Application started')
```

### BasicChildContainer: Inheritance & Testing

`BasicChildContainer` extends the parent container while maintaining all plugin capabilities. Perfect for testing:

```ts
import { BasicContainer, BasicChildContainer, createAutoResolver } from '@computerwwwizards/dependency-injection'

interface ParentServices {
  config: { appName: string, version: string }
  logger: { log: (msg: string) => void }
  database: { query: (sql: string) => Promise<any> }
}

interface ChildServices {
  userService: { findUser: (id: string) => Promise<any> }
  cache: { get: (key: string) => any }
}

// Parent container (production setup)
const parent = new BasicContainer<ParentServices>()
parent.registerPlugin((ctx) => {
  ctx.bindTo('config', () => ({
    appName: 'MyApp',
    version: '1.0.0'
  }), 'singleton')
}, ['config'])

// Create child container for a feature/module
const child = parent.createScope<ChildServices>()

// Child has access to parent services AND its own services
const userServicePlugin = (ctx: BasicChildContainer<ParentServices, ChildServices>) => {
  ctx.bind('userService', {
    resolveDependencies: createAutoResolver([
      { identifier: 'database' },
      { identifier: 'config' }
    ]),
    provider: (deps) => ({
      findUser: async (id: string) => {
        // Access parent's database and config
        const result = await deps.database.query(`SELECT * FROM users WHERE id = ?`)
        return result[0] || null
      }
    }),
    scope: 'singleton'
  })
}

child.registerPlugin(userServicePlugin).applyPlugins()

// Override parent's database with test mock
child.bindTo('database', () => ({
  query: async (sql: string) => [{ id: '1', name: 'Test User' }]
}), 'singleton')

// Now child can use parent services with overrides
const userService = child.get('userService')
const user = await userService.findUser('1')  // Uses mocked database
```

#### Testing Pattern: Container Isolation

```ts
import { BasicContainer } from '@computerwwwizards/dependency-injection'

// Your app's main container
const createAppContainer = () => {
  const container = new BasicContainer<AppServices>()
  container
    .registerPlugin(loggerPlugin)
    .registerPlugin(databasePlugin)
    .registerPlugin(apiPlugin)
    .applyPlugins()
  return container
}

// Test setup with mocks
const createTestContainer = () => {
  const container = new BasicContainer<AppServices>()
  
  // Use mock variants
  container.useMocks()
  
  // Register with mocks
  container
    .registerPlugin(loggerPlugin)
    .registerPlugin(databasePlugin)
    .registerPlugin(apiPlugin)
    .applyPlugins()
  
  return container
}

// In your test
it('should fetch user', async () => {
  const container = createTestContainer()
  const api = container.get('api')
  
  const result = await api.fetch('/users/1')
  expect(result).toEqual({ mocked: true, url: '/users/1' })
})
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

## Comprehensive Examples

### Example 1: Building a Complete Web Service

Here's how you might structure a real web service with authentication, database, and API endpoints:

```ts
import { PreProcessDependencyContainerWithUse, createAutoResolver } from '@computerwwwizards/dependency-injection'

interface WebServiceDeps {
  config: { 
    dbUrl: string
    jwtSecret: string
    port: number
    logLevel: string
  }
  logger: {
    debug: (msg: string) => void
    info: (msg: string) => void
    error: (msg: string) => void
  }
  database: {
    connect: () => Promise<void>
    query: (sql: string, params?: any[]) => Promise<any[]>
    close: () => Promise<void>
  }
  authService: {
    generateToken: (userId: string) => string
    verifyToken: (token: string) => { userId: string } | null
  }
  userRepository: {
    findById: (id: string) => Promise<any>
    create: (user: any) => Promise<any>
    update: (id: string, changes: any) => Promise<any>
  }
  apiServer: {
    start: () => Promise<void>
    stop: () => Promise<void>
  }
}

const container = new PreProcessDependencyContainerWithUse<WebServiceDeps>()

// Configuration - usually loaded from environment
const configPlugin = (c: any) => {
  c.bindTo('config', () => ({
    dbUrl: process.env.DATABASE_URL || 'sqlite://app.db',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    port: Number(process.env.PORT) || 3000,
    logLevel: process.env.LOG_LEVEL || 'info'
  }), 'singleton')
  return c
}

// Logging service
const loggingPlugin = (c: any) => {
  c.bind('logger', {
    resolveDependencies: createAutoResolver([
      { identifier: 'config' }
    ]),
    provider: (deps) => {
      const level = deps.config.logLevel
      return {
        debug: level === 'debug' ? console.log : () => {},
        info: ['debug', 'info'].includes(level) ? console.log : () => {},
        error: console.error
      }
    },
    scope: 'singleton'
  })
  return c
}

// Database connection
const databasePlugin = (c: any) => {
  c.bind('database', {
    resolveDependencies: createAutoResolver([
      { identifier: 'config' },
      { identifier: 'logger' }
    ]),
    provider: (deps) => {
      let connection: any = null
      
      return {
        connect: async () => {
          deps.logger.info(`Connecting to database: ${deps.config.dbUrl}`)
          // connection = await createConnection(deps.config.dbUrl)
          connection = { connected: true } // Mock for example
        },
        query: async (sql: string, params?: any[]) => {
          deps.logger.debug(`Executing query: ${sql}`)
          // return connection.query(sql, params)
          return [] // Mock for example
        },
        close: async () => {
          deps.logger.info('Closing database connection')
          // await connection.close()
        }
      }
    },
    scope: 'singleton'
  })
  return c
}

// Authentication service
const authPlugin = (c: any) => {
  c.bind('authService', {
    resolveDependencies: createAutoResolver([
      { identifier: 'config' },
      { identifier: 'logger' }
    ]),
    provider: (deps) => ({
      generateToken: (userId: string) => {
        deps.logger.debug(`Generating token for user ${userId}`)
        // return jwt.sign({ userId }, deps.config.jwtSecret, { expiresIn: '24h' })
        return `token-${userId}` // Mock for example
      },
      verifyToken: (token: string) => {
        deps.logger.debug(`Verifying token`)
        try {
          // return jwt.verify(token, deps.config.jwtSecret)
          const userId = token.replace('token-', '') // Mock for example
          return { userId }
        } catch {
          return null
        }
      }
    }),
    scope: 'singleton'
  })
  return c
}

// User repository
const userRepositoryPlugin = (c: any) => {
  c.bind('userRepository', {
    resolveDependencies: createAutoResolver([
      { identifier: 'database' },
      { identifier: 'logger' }
    ]),
    provider: (deps) => ({
      findById: async (id: string) => {
        deps.logger.debug(`Finding user ${id}`)
        const users = await deps.database.query('SELECT * FROM users WHERE id = ?', [id])
        return users[0]
      },
      create: async (user: any) => {
        deps.logger.info(`Creating user ${user.email}`)
        const result = await deps.database.query(
          'INSERT INTO users (email, name) VALUES (?, ?)',
          [user.email, user.name]
        )
        return { ...user, id: result.insertId }
      },
      update: async (id: string, changes: any) => {
        deps.logger.debug(`Updating user ${id}`)
        await deps.database.query(
          'UPDATE users SET name = ?, email = ? WHERE id = ?',
          [changes.name, changes.email, id]
        )
        return { id, ...changes }
      }
    }),
    scope: 'singleton'
  })
  return c
}

// API server
const serverPlugin = (c: any) => {
  c.bind('apiServer', {
    resolveDependencies: createAutoResolver([
      { identifier: 'config' },
      { identifier: 'logger' },
      { identifier: 'authService' },
      { identifier: 'userRepository' }
    ]),
    provider: (deps) => {
      let server: any = null
      
      const authMiddleware = (req: any) => {
        const token = req.headers.authorization?.replace('Bearer ', '')
        if (!token) throw new Error('No token provided')
        
        const auth = deps.authService.verifyToken(token)
        if (!auth) throw new Error('Invalid token')
        
        return auth
      }
      
      const routes = {
        'GET /users/:id': async (req: any) => {
          const auth = authMiddleware(req)
          deps.logger.info(`User ${auth.userId} requesting user ${req.params.id}`)
          return deps.userRepository.findById(req.params.id)
        },
        'POST /users': async (req: any) => {
          const auth = authMiddleware(req)
          deps.logger.info(`User ${auth.userId} creating new user`)
          return deps.userRepository.create(req.body)
        },
        'POST /login': async (req: any) => {
          // Normally would validate credentials
          const token = deps.authService.generateToken('user123')
          return { token }
        }
      }
      
      return {
        start: async () => {
          deps.logger.info(`Starting server on port ${deps.config.port}`)
          // server = express()
          // setupRoutes(server, routes)
          // server.listen(deps.config.port)
        },
        stop: async () => {
          deps.logger.info('Stopping server')
          // server?.close()
        }
      }
    },
    scope: 'singleton'
  })
  return c
}

// Wire everything together
container.use(
  configPlugin,
  loggingPlugin, 
  databasePlugin,
  authPlugin,
  userRepositoryPlugin,
  serverPlugin
)

// Bootstrap the application
const bootstrap = async () => {
  const database = container.get('database')
  const server = container.get('apiServer')
  
  await database.connect()
  await server.start()
  
  console.log('🚀 Application started successfully!')
}

bootstrap().catch(console.error)
```

### Example 2: Testing with Child Containers

Use child containers to override dependencies for testing:

```ts
import { ChildPreProcessDependencyContainer, createAutoResolver } from '@computerwwwizards/dependency-injection'

// Your main container setup (same as above)
const mainContainer = new PreProcessDependencyContainerWithUse<WebServiceDeps>()
mainContainer.use(/* all your plugins */)

// Create test container that inherits from main but overrides specific services
const createTestContainer = () => {
  const testContainer = new ChildPreProcessDependencyContainer(mainContainer)
  
  // Override database with a mock
  testContainer.bindTo('database', () => ({
    connect: async () => {},
    query: async (sql: string) => {
      if (sql.includes('SELECT * FROM users WHERE id = ?')) {
        return [{ id: '1', name: 'Test User', email: 'test@example.com' }]
      }
      return []
    },
    close: async () => {}
  }), 'singleton')
  
  // Override logger to capture logs for assertions
  const logs: string[] = []
  testContainer.bindTo('logger', () => ({
    debug: (msg: string) => logs.push(`DEBUG: ${msg}`),
    info: (msg: string) => logs.push(`INFO: ${msg}`),
    error: (msg: string) => logs.push(`ERROR: ${msg}`)
  }), 'singleton')
  
  return { container: testContainer, logs }
}

// Test example
const testUserRepository = async () => {
  const { container, logs } = createTestContainer()
  
  const userRepo = container.get('userRepository')
  const user = await userRepo.findById('1')
  
  console.assert(user.name === 'Test User')
  console.assert(logs.some(log => log.includes('Finding user 1')))
  console.log('✅ Test passed!')
}

testUserRepository()
```

### Example 3: Plugin Ecosystem with Configuration

Create reusable plugins that can be configured:

```ts
// Configurable database plugin
const createDatabasePlugin = (options: { 
  connectionString?: string
  poolSize?: number
  timeout?: number 
} = {}) => (container: any) => {
  container.bind('database', {
    resolveDependencies: createAutoResolver([
      { identifier: 'logger' }
    ]),
    provider: (deps) => {
      const config = {
        connectionString: options.connectionString || process.env.DB_URL || 'sqlite://memory',
        poolSize: options.poolSize || 10,
        timeout: options.timeout || 30000
      }
      
      deps.logger.info(`Initializing database with config: ${JSON.stringify(config)}`)
      
      return {
        query: async (sql: string, params?: any[]) => {
          deps.logger.debug(`Query: ${sql}`)
          // Database implementation here
          return []
        }
      }
    },
    scope: 'singleton'
  })
  return container
}

// Configurable cache plugin
const createCachePlugin = (options: {
  type?: 'memory' | 'redis'
  ttl?: number
  maxSize?: number
} = {}) => (container: any) => {
  container.bind('cache', {
    resolveDependencies: createAutoResolver([
      { identifier: 'logger' }
    ]),
    provider: (deps) => {
      const config = {
        type: options.type || 'memory',
        ttl: options.ttl || 3600000, // 1 hour
        maxSize: options.maxSize || 1000
      }
      
      deps.logger.info(`Initializing ${config.type} cache`)
      
      const store = new Map()
      
      return {
        get: async (key: string) => {
          deps.logger.debug(`Cache GET: ${key}`)
          return store.get(key)
        },
        set: async (key: string, value: any, ttl?: number) => {
          deps.logger.debug(`Cache SET: ${key}`)
          store.set(key, value)
          // In real implementation, handle TTL
        },
        delete: async (key: string) => {
          deps.logger.debug(`Cache DELETE: ${key}`)
          store.delete(key)
        }
      }
    },
    scope: 'singleton'
  })
  return container
}

// Use configured plugins
const prodContainer = new PreProcessDependencyContainerWithUse()
prodContainer.use(
  loggingPlugin,
  createDatabasePlugin({ 
    connectionString: 'postgres://prod-db',
    poolSize: 20 
  }),
  createCachePlugin({ 
    type: 'redis',
    ttl: 7200000 // 2 hours
  })
)

const devContainer = new PreProcessDependencyContainerWithUse()
devContainer.use(
  loggingPlugin,
  createDatabasePlugin({ 
    connectionString: 'sqlite://dev.db' 
  }),
  createCachePlugin({ 
    type: 'memory',
    maxSize: 100 
  })
)
```

## Auto-Resolution Helper Functions

The library provides two powerful helper functions to simplify dependency resolution patterns:

### `createAutoResolver` - Object-based dependency resolution

This function automatically resolves dependencies and returns them as an object mapped by their identifiers. Perfect when you want to access dependencies by name.

```ts
import { createAutoResolver, PreProcessDependencyContainer } from '@computerwwwizards/dependency-injection'

type Services = {
  database: { query: (sql: string) => any[] }
  logger: { log: (msg: string) => void }
  cache: { get: (key: string) => any; set: (key: string, value: any) => void }
  userService: { findUser: (id: string) => any }
}

const container = new PreProcessDependencyContainer<Services>()

// Register individual services
container.bindTo('database', () => ({ query: (sql) => [] }))
container.bindTo('logger', () => ({ log: console.log }))
container.bindTo('cache', () => ({ get: () => null, set: () => {} }))

// Use createAutoResolver to get dependencies as an object
container.bind('userService', {
  resolveDependencies: createAutoResolver([
    { identifier: 'database' },
    { identifier: 'logger' },
    { identifier: 'cache' }
  ]),
  provider: (deps) => {
    // deps is typed as { database: Database, logger: Logger, cache: Cache }
    return {
      findUser: (id: string) => {
        deps.logger.log(`Finding user ${id}`)
        
        // Check cache first
        const cached = deps.cache.get(`user:${id}`)
        if (cached) return cached
        
        // Query database
        const result = deps.database.query(`SELECT * FROM users WHERE id = '${id}'`)[0]
        deps.cache.set(`user:${id}`, result)
        
        return result
      }
    }
  }
})

const userService = container.get('userService')
const user = userService.findUser('123')
```

### `createAutoResolveDepsInOrder` - Array-based dependency resolution

This function resolves dependencies in the specified order and returns them as an array. Useful for positional dependency injection patterns.

```ts
import { createAutoResolveDepsInOrder, PreProcessDependencyContainer } from '@computerwwwizards/dependency-injection'

type Services = {
  firstNumber: number
  secondNumber: number
  thirdNumber: number
  calculator: { sum: (a: number, b: number, c: number) => number }
}

const container = new PreProcessDependencyContainer<Services>()

container.bindTo('firstNumber', () => 10)
container.bindTo('secondNumber', () => 20)  
container.bindTo('thirdNumber', () => 30)

// Use createAutoResolveDepsInOrder for positional dependencies
container.bind('calculator', {
  resolveDependencies: createAutoResolveDepsInOrder([
    { identifier: 'firstNumber' },
    { identifier: 'secondNumber' },
    { identifier: 'thirdNumber' }
  ]),
  provider: (numbers) => {
    // numbers is [10, 20, 30] - array in the order specified
    const [first, second, third] = numbers
    return {
      sum: (a = first, b = second, c = third) => a + b + c
    }
  }
})

const calc = container.get('calculator')
console.log(calc.sum()) // 60 (10 + 20 + 30)
```

### Optional Dependencies with Helper Functions

Both helper functions support optional dependencies that won't throw if missing:

```ts
// With createAutoResolver
container.bind('service', {
  resolveDependencies: createAutoResolver([
    { identifier: 'requiredDep' },
    { identifier: 'optionalDep', dontThrowIfNull: true }
  ]),
  provider: (deps) => {
    // deps.optionalDep might be undefined
    return new Service(deps.requiredDep, deps.optionalDep)
  }
})

// With createAutoResolveDepsInOrder  
container.bind('service', {
  resolveDependencies: createAutoResolveDepsInOrder([
    { identifier: 'requiredDep' },
    { identifier: 'optionalDep', dontThrowIfNull: true }
  ]),
  provider: ([required, optional]) => {
    // optional might be undefined
    return new Service(required, optional)
  }
})
```

### Real-World Example: HTTP Service with Auto-Resolution

```ts
import { PreProcessDependencyContainerWithUse, createAutoResolver } from '@computerwwwizards/dependency-injection'

interface AppServices {
  config: { apiBaseUrl: string; timeout: number }
  logger: { info: (msg: string) => void; error: (msg: string) => void }
  httpClient: { get: (url: string) => Promise<any>; post: (url: string, data: any) => Promise<any> }
  userApi: { getUser: (id: string) => Promise<any>; createUser: (user: any) => Promise<any> }
}

const container = new PreProcessDependencyContainerWithUse<AppServices>()

// Configuration plugin
const configPlugin = (c: any) => {
  c.bindTo('config', () => ({
    apiBaseUrl: 'https://api.myapp.com',
    timeout: 5000
  }))
  return c
}

// Logging plugin
const loggingPlugin = (c: any) => {
  c.bindTo('logger', () => ({
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`)
  }))
  return c
}

// HTTP client plugin - depends on config and logger
const httpPlugin = (c: any) => {
  c.bind('httpClient', {
    resolveDependencies: createAutoResolver([
      { identifier: 'config' },
      { identifier: 'logger' }
    ]),
    provider: (deps) => ({
      get: async (url: string) => {
        deps.logger.info(`GET ${url}`)
        try {
          const response = await fetch(`${deps.config.apiBaseUrl}${url}`, {
            timeout: deps.config.timeout
          })
          return response.json()
        } catch (error) {
          deps.logger.error(`GET ${url} failed: ${error}`)
          throw error
        }
      },
      post: async (url: string, data: any) => {
        deps.logger.info(`POST ${url}`)
        try {
          const response = await fetch(`${deps.config.apiBaseUrl}${url}`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
            timeout: deps.config.timeout
          })
          return response.json()
        } catch (error) {
          deps.logger.error(`POST ${url} failed: ${error}`)
          throw error
        }
      }
    })
  })
  return c
}

// User API plugin - depends on httpClient and logger
const userApiPlugin = (c: any) => {
  c.bind('userApi', {
    resolveDependencies: createAutoResolver([
      { identifier: 'httpClient' },
      { identifier: 'logger' }
    ]),
    provider: (deps) => ({
      getUser: async (id: string) => {
        deps.logger.info(`Fetching user ${id}`)
        return deps.httpClient.get(`/users/${id}`)
      },
      createUser: async (user: any) => {
        deps.logger.info(`Creating user ${user.name}`)
        return deps.httpClient.post('/users', user)
      }
    })
  })
  return c
}

// Wire everything together
container.use(configPlugin, loggingPlugin, httpPlugin, userApiPlugin)

// Use the fully configured service
const userApi = container.get('userApi')
const user = await userApi.getUser('123')
const newUser = await userApi.createUser({ name: 'John', email: 'john@example.com' })
```

### When to use which helper function

- **Use `createAutoResolver`** when you need dependencies as a named object and want clear, readable access to each dependency by name
- **Use `createAutoResolveDepsInOrder`** when you have a small number of dependencies and prefer positional destructuring, or when working with legacy code that expects arrays

Both functions help eliminate boilerplate while maintaining type safety and clear dependency declarations.

## Best Practices and Patterns

### 1. Use Type-Safe Service Registries

Define your service types upfront for better IntelliSense and type checking:

```ts
interface AppServices {
  // Configuration
  config: AppConfig
  secrets: SecretManager
  
  // Infrastructure  
  logger: Logger
  database: Database
  cache: CacheService
  queue: QueueService
  
  // Business logic
  userService: UserService
  orderService: OrderService
  paymentService: PaymentService
  
  // External integrations
  emailService: EmailService
  paymentGateway: PaymentGateway
}

const container = new PreProcessDependencyContainerWithUse<AppServices>()
```

### 2. Organize Dependencies into Layers

Structure your services in logical layers to avoid circular dependencies:

```ts
// Infrastructure layer (no dependencies on business logic)
const infrastructurePlugin = (c: any) => {
  c.bindTo('config', configFactory, 'singleton')
  c.bindTo('logger', loggerFactory, 'singleton')  
  c.bindTo('database', databaseFactory, 'singleton')
  return c
}

// Repository layer (depends on infrastructure)
const repositoryPlugin = (c: any) => {
  c.bind('userRepository', {
    resolveDependencies: createAutoResolver([
      { identifier: 'database' },
      { identifier: 'logger' }
    ]),
    provider: userRepositoryFactory
  })
  return c
}

// Service layer (depends on repositories and infrastructure)
const servicePlugin = (c: any) => {
  c.bind('userService', {
    resolveDependencies: createAutoResolver([
      { identifier: 'userRepository' },
      { identifier: 'emailService' },
      { identifier: 'logger' }
    ]),
    provider: userServiceFactory
  })
  return c
}

// Apply in correct order
container.use(infrastructurePlugin, repositoryPlugin, servicePlugin)
```

### 3. Use Factory Functions for Complex Service Creation

Keep your provider functions clean by extracting complex logic into factory functions:

```ts
// ❌ Inline complexity
container.bind('complexService', {
  resolveDependencies: createAutoResolver([...]),
  provider: (deps) => {
    // 50 lines of complex initialization...
    return new ComplexService(/* ... */)
  }
})

// ✅ Extract to factory function
const createComplexService = (deps: Dependencies) => {
  // Complex initialization logic
  const config = processConfiguration(deps.config)
  const connections = setupConnections(deps.database, config)
  const middleware = createMiddleware(deps.logger, config)
  
  return new ComplexService(connections, middleware, config)
}

container.bind('complexService', {
  resolveDependencies: createAutoResolver([...]),
  provider: createComplexService
})
```

### 4. Handle Optional Dependencies Gracefully

Use the `dontThrowIfNull` option for optional dependencies:

```ts
container.bind('emailService', {
  resolveDependencies: createAutoResolver([
    { identifier: 'config' },
    { identifier: 'logger' },
    { identifier: 'emailProvider', dontThrowIfNull: true } // Optional
  ]),
  provider: (deps) => {
    if (!deps.emailProvider) {
      // Fallback to console logging
      return {
        send: (to: string, subject: string, body: string) => {
          deps.logger.info(`Would send email to ${to}: ${subject}`)
        }
      }
    }
    
    return new EmailService(deps.emailProvider, deps.logger)
  }
})
```

### 5. Use Environment-Specific Containers

Create different container configurations for different environments:

```ts
const createContainer = (env: 'development' | 'test' | 'production') => {
  const container = new PreProcessDependencyContainerWithUse<AppServices>()
  
  // Common services
  container.use(loggingPlugin, authPlugin)
  
  // Environment-specific services
  switch (env) {
    case 'development':
      container.use(
        createDatabasePlugin({ connectionString: 'sqlite://dev.db' }),
        createCachePlugin({ type: 'memory' }),
        mockEmailPlugin // Don't send real emails in dev
      )
      break
      
    case 'test':
      container.use(
        mockDatabasePlugin,
        mockCachePlugin, 
        mockEmailPlugin
      )
      break
      
    case 'production':
      container.use(
        createDatabasePlugin({ connectionString: process.env.DATABASE_URL }),
        createCachePlugin({ type: 'redis', connectionString: process.env.REDIS_URL }),
        prodEmailPlugin
      )
      break
  }
  
  return container
}

const container = createContainer(process.env.NODE_ENV as any)
```

### 6. Handle Service Cleanup

Use the `unbind` method to clean up services when needed:

```ts
// Remove a specific service registration
container.unbind('temporaryService')

// For services that need cleanup, implement disposal pattern
interface DisposableService {
  dispose(): Promise<void>
}

const createService = (): DisposableService => {
  const connections = new Map()
  
  return {
    // service methods...
    dispose: async () => {
      for (const conn of connections.values()) {
        await conn.close()
      }
      connections.clear()
    }
  }
}
```

### 7. Avoid Common Anti-Patterns

**❌ Don't capture external state in closures:**
```ts
// Bad - captures external variable
const externalData = loadSomeData()
container.bindTo('service', () => new Service(externalData))
```

**✅ Register dependencies explicitly:**
```ts
// Good - explicit dependency
container.bindTo('data', () => loadSomeData(), 'singleton')
container.bind('service', {
  resolveDependencies: createAutoResolver([{ identifier: 'data' }]),
  provider: (deps) => new Service(deps.data)
})
```

**❌ Don't create circular dependencies:**
```ts
// Bad - A depends on B, B depends on A
container.bind('serviceA', {
  resolveDependencies: createAutoResolver([{ identifier: 'serviceB' }]),
  provider: (deps) => new ServiceA(deps.serviceB)
})
```

**✅ Break circular dependencies with events or interfaces:**
```ts
// Good - use event emitter or shared interface
container.bindTo('eventBus', () => new EventEmitter(), 'singleton')
container.bind('serviceA', {
  resolveDependencies: createAutoResolver([{ identifier: 'eventBus' }]),
  provider: (deps) => new ServiceA(deps.eventBus)
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
