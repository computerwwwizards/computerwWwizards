
import { describe, it, expect } from 'vitest'
import { PreProcessDependencyContainer, PreProcessDependencyContainerWithUse, createAutoResolveDepsInOrder, createAutoResolver } from './pre-process-dependency-container'

describe('PreProcessDependencyContainer', () => {
  it('runs resolver before provider and passes resolved deps', () => {
    type Reg = { firstNumber: number; secondNumber: number; sum: number }

  const container = new PreProcessDependencyContainer<Reg>()

  container.bindTo('firstNumber', () => 1)
  container.bindTo('secondNumber', () => 2)

  container.bind('sum', {
      scope: 'transient',
      //@ts-expect-error
      resolveDependencies: createAutoResolveDepsInOrder([
        { identifier: 'firstNumber'},
        { identifier: 'secondNumber'}
      ]),
      provider: (resolved: [number, number]) => {

    const [first = 0, second = 0] = resolved
    return first + second
      }
    })
  expect(container.get('sum')).toBe(3)
  })

  it('createAutoResolver returns object mapped by keys', () => {
    type Reg = { firstNumber: number; secondNumber: number; bag: { firstNumber: number; secondNumber: number } }

  const container = new PreProcessDependencyContainer<Reg>()

  container.bindTo('firstNumber', () => 5)
  container.bindTo('secondNumber', () => 7)

  container.bind('bag', {
      scope: 'transient',
      resolveDependencies: createAutoResolver<Reg, 'firstNumber' | 'secondNumber'>([
        { identifier: 'firstNumber'},
        { identifier: 'secondNumber'}
      ]),
      provider: (resolved) => resolved
    })

  const bag = container.get('bag')
    
  expect(bag.firstNumber).toBe(5)
  expect(bag.secondNumber).toBe(7)
  })
})

describe('PreProcessDependencyContainerWithUse', () => {
    it('should have use method available', () => {
      const container = new PreProcessDependencyContainerWithUse<{ service: string }>()
      
      expect(container).toHaveProperty('use')
      expect(typeof container.use).toBe('function')
    })

    it('should work with plugins via use method', () => {
      interface Services {
        config: { env: string; port: number };
        logger: { log: (msg: string) => void };
        server: { start: () => void };
      }

      const container = new PreProcessDependencyContainerWithUse<Services>()

      const configPlugin = (c: any) => {
        c.bindTo('config', () => ({ env: 'test', port: 3000 }))
        return c
      }

      const loggerPlugin = (c: any) => {
        c.bind('logger', {
          resolveDependencies: createAutoResolver([
            { identifier: 'config' }
          ]),
          provider: (deps: any) => ({
            log: (msg: string) => console.log(`[${deps.config.env}] ${msg}`)
          })
        })
        return c
      }

      const serverPlugin = (c: any) => {
        c.bind('server', {
          resolveDependencies: createAutoResolver([
            { identifier: 'config' },
            { identifier: 'logger' }
          ]),
          provider: (deps: any) => ({
            start: () => {
              deps.logger.log(`Server starting on port ${deps.config.port}`)
            }
          })
        })
        return c
      }

      container.use(configPlugin, loggerPlugin, serverPlugin)

      const server = container.get('server')
      expect(server).toHaveProperty('start')
      expect(typeof server.start).toBe('function')
    })

    it('should support chaining use calls', () => {
      interface Services {
        service1: string;
        service2: number;
        combined: string;
      }

      const container = new PreProcessDependencyContainerWithUse<Services>()

      const plugin1 = (c: any) => {
        c.bindTo('service1', () => 'hello')
        return c
      }

      const plugin2 = (c: any) => {
        c.bindTo('service2', () => 42)
        return c
      }

      const combinedPlugin = (c: any) => {
        c.bind('combined', {
          resolveDependencies: createAutoResolver([
            { identifier: 'service1' },
            { identifier: 'service2' }
          ]),
          provider: (deps: any) => `${deps.service1}-${deps.service2}`
        })
        return c
      }

      const result = container.use(plugin1).use(plugin2, combinedPlugin)
      
      expect(result).toBe(container)
      expect(container.get('service1')).toBe('hello')
      expect(container.get('service2')).toBe(42)
      expect(container.get('combined')).toBe('hello-42')
    })
  })

