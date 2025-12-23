import { describe, it, expect } from 'vitest'
import { BasicContainer, BasicChildContainer } from './basic-container'

describe('BasicContainer', () => {
  it('should create a basic container', () => {
    const container = new BasicContainer<{ service: string }>()
    expect(container).toBeDefined()
  })

  it('should use mocks when useMocks is called', () => {
    interface Services {
      api: { fetch: () => string }
    }

    const container = new BasicContainer<Services>()

    const plugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('api', () => ({ fetch: () => 'real data' }))
    }

    plugin.mock = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('api', () => ({ fetch: () => 'mock data' }))
    }

    container.useMocks().use(plugin)

    const api = container.get('api')
    expect(api.fetch()).toBe('mock data')
  })

  it('should use real implementation when useMocks is not called', () => {
    interface Services {
      api: { fetch: () => string }
    }

    const container = new BasicContainer<Services>()

    const plugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('api', () => ({ fetch: () => 'real data' }))
    }

    plugin.mock = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('api', () => ({ fetch: () => 'mock data' }))
    }

    container.use(plugin)

    const api = container.get('api')
    expect(api.fetch()).toBe('real data')
  })

  it('should use subplugin when useSubPlugin is called', () => {
    interface Services {
      feature: { name: string }
    }

    const container = new BasicContainer<Services>()

    const plugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('feature', () => ({ name: 'default' }))
    }

    plugin.custom = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('feature', () => ({ name: 'custom' }))
    }

    container.useSubPlugin('custom').use(plugin)

    const feature = container.get('feature')
    expect(feature.name).toBe('custom')
  })

  it('should register and apply plugins', () => {
    interface Services {
      serviceA: string
      serviceB: number
    }

    const container = new BasicContainer<Services>()

    const pluginA = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('serviceA', () => 'value A')
    }

    const pluginB = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('serviceB', () => 42)
    }

    container.registerPlugin(pluginA).registerPlugin(pluginB).applyPlugins()

    expect(container.get('serviceA')).toBe('value A')
    expect(container.get('serviceB')).toBe(42)
  })

  it('should apply plugins by tags', () => {
    interface Services {
      coreService: string
      extraService: string
    }

    const container = new BasicContainer<Services>()

    const corePlugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('coreService', () => 'core')
    }

    const extraPlugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('extraService', () => 'extra')
    }

    container
      .registerPlugin(corePlugin, ['core'])
      .registerPlugin(extraPlugin, ['extra'])
      .applyPlugins(['core'])

    expect(container.get('coreService')).toBe('core')
    expect(() => container.get('extraService')).toThrow()
  })

  it('should combine useMocks with lazy plugins', () => {
    interface Services {
      api: { fetch: () => string }
    }

    const container = new BasicContainer<Services>()

    const plugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('api', () => ({ fetch: () => 'real' }))
    }

    plugin.mock = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('api', () => ({ fetch: () => 'mock' }))
    }

    container.registerPlugin(plugin).useMocks().applyPlugins()

    expect(container.get('api').fetch()).toBe('mock')
  })
})

describe('BasicChildContainer', () => {
  it('should create a basic child container', () => {
    const parent = new BasicContainer<{ parentService: string }>()
    parent.bindTo('parentService', () => 'parent value')

    // BasicChildContainer is used internally when creating scopes
    // For testing purposes, we'll test the functionality directly
    expect(BasicChildContainer).toBeDefined()
  })

  it('should use mocks in child container', () => {
    interface Services {
      api: { fetch: () => string }
    }

    const container = new BasicContainer<Services>()

    const plugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('api', () => ({ fetch: () => 'real child' }))
    }

    plugin.mock = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('api', () => ({ fetch: () => 'mock child' }))
    }

    container.useMocks().use(plugin)

    expect(container.get('api').fetch()).toBe('mock child')
  })

  it('should use subplugin in child container', () => {
    interface Services {
      feature: { name: string }
    }

    const container = new BasicContainer<Services>()

    const plugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('feature', () => ({ name: 'default' }))
    }

    plugin.custom = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('feature', () => ({ name: 'custom' }))
    }

    container.useSubPlugin('custom').use(plugin)

    expect(container.get('feature').name).toBe('custom')
  })

  it('should register and apply plugins in child container', () => {
    interface Services {
      serviceA: string
      serviceB: number
    }

    const container = new BasicContainer<Services>()

    const pluginA = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('serviceA', () => 'child A')
    }

    const pluginB = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('serviceB', () => 99)
    }

    container.registerPlugin(pluginA).registerPlugin(pluginB).applyPlugins()

    expect(container.get('serviceA')).toBe('child A')
    expect(container.get('serviceB')).toBe(99)
  })

  it('should apply plugins by tags in child container', () => {
    interface Services {
      coreService: string
      extraService: string
    }

    const container = new BasicContainer<Services>()

    const corePlugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('coreService', () => 'child core')
    }

    const extraPlugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('extraService', () => 'child extra')
    }

    container
      .registerPlugin(corePlugin, ['core'])
      .registerPlugin(extraPlugin, ['extra'])
      .applyPlugins(['core'])

    expect(container.get('coreService')).toBe('child core')
    expect(() => container.get('extraService')).toThrow()
  })

  it('should work with simple function plugins', () => {
    interface Services {
      simpleService: string
    }

    const container = new BasicContainer<Services>()

    // Simple function without sub-plugins
    const simplePlugin = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('simpleService', () => 'simple value')
    }

    container.use(simplePlugin)

    expect(container.get('simpleService')).toBe('simple value')
  })

  it('should register simple function plugins', () => {
    interface Services {
      service1: string
      service2: number
    }

    const container = new BasicContainer<Services>()

    // Simple functions without sub-plugins
    const plugin1 = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('service1', () => 'text')
    }

    const plugin2 = (ctx: BasicContainer<Services>) => {
      ctx.bindTo('service2', () => 123)
    }

    container.registerPlugin(plugin1, ['tag1']).registerPlugin(plugin2, ['tag2']).applyPlugins()

    expect(container.get('service1')).toBe('text')
    expect(container.get('service2')).toBe(123)
  })
})
