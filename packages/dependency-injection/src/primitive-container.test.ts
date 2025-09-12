
import { describe, it, expect } from 'vitest'
import { PrimitiveContainer, PrimitiveContainerWithUse } from './primitive-container'

describe('PrimitiveContainer', () => {
  it('binds and resolves transient providers', () => {
  const container = new PrimitiveContainer<{ value: number }>()

  container.bindTo('value', () => Math.random(), 'transient')

  const firstValue = container.get('value')
  const secondValue = container.get('value')

  expect(typeof firstValue).toBe('number')
  expect(typeof secondValue).toBe('number')
  expect(firstValue).not.toBe(secondValue)
  })

  it('binds and resolves singleton providers', () => {
  const container = new PrimitiveContainer<{ singletonObj: { n: number } }>()

  container.bindTo('singletonObj', () => ({ n: Math.random() }), 'singleton')

  const firstInstance = container.get('singletonObj')
  const secondInstance = container.get('singletonObj')

  expect(firstInstance).toBe(secondInstance)
  })

  it('throws when resolving unknown identifier', () => {
  const container = new PrimitiveContainer<{ value: number }>()

  expect(() => container.get('value')).toThrow()
  // allow not throwing when flag is true
  expect(() => container.get('value', true)).not.toThrow()
  })

  it('supports dependency injection via context', () => {
    interface Services {
      config: { apiUrl: string };
      client: { get: (path: string) => string };
    }

    const container = new PrimitiveContainer<Services>()

    container.bindTo('config', () => ({ apiUrl: 'https://api.example.com' }), 'singleton')
    container.bindTo('client', (ctx) => {
      const config = ctx.get('config')
      return {
        get: (path: string) => `${config.apiUrl}${path}`
      }
    })

    const client = container.get('client')
    expect(client.get('/users')).toBe('https://api.example.com/users')
  })

  it('supports method chaining', () => {
    const container = new PrimitiveContainer<{ a: string, b: number }>()

    const result = container
      .bindTo('a', () => 'test')
      .bindTo('b', () => 42)
      .unbind('a')

    expect(result).toBe(container)
    expect(() => container.get('a')).toThrow()
    expect(container.get('b')).toBe(42)
  })
})

describe('PrimitiveContainerWithUse', () => {
  it('should have use method available', () => {
    const container = new PrimitiveContainerWithUse<{ service: string }>()
    
    expect(container).toHaveProperty('use')
    expect(typeof container.use).toBe('function')
  })

  it('should work with plugins via use method', () => {
    interface Services {
      logger: { log: (msg: string) => void };
      config: { env: string };
    }

    const container = new PrimitiveContainerWithUse<Services>()

    const loggerPlugin = (c: any) => {
      c.bindTo('logger', () => ({ log: (msg: string) => console.log(msg) }))
      return c
    }

    const configPlugin = (c: any) => {
      c.bindTo('config', () => ({ env: 'test' }))
      return c
    }

    container.use(loggerPlugin, configPlugin)

    expect(container.get('logger')).toHaveProperty('log')
    expect(container.get('config').env).toBe('test')
  })

  it('should support chaining use calls', () => {
    interface Services {
      service1: string;
      service2: number;
    }

    const container = new PrimitiveContainerWithUse<Services>()

    const plugin1 = (c: any) => {
      c.bindTo('service1', () => 'value1')
      return c
    }

    const plugin2 = (c: any) => {
      c.bindTo('service2', () => 123)
      return c
    }

    const result = container.use(plugin1).use(plugin2)
    
    expect(result).toBe(container)
    expect(container.get('service1')).toBe('value1')
    expect(container.get('service2')).toBe(123)
  })
})
