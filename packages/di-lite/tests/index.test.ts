import { describe, it, expect, vi } from 'vitest';
import { DIContainer } from '../src';

interface Dependencies {
  'serviceA': ServiceA;
  'serviceB': ServiceB;
  'config': { host: string };
}

class ServiceA {
  constructor(public config: { host: string }) {}
  greet() {
    return `Hello from ServiceA on ${this.config.host}`;
  }
}

class ServiceB {
  constructor(private serviceA: ServiceA) {}
  doSomething() {
    return this.serviceA.greet().replace('ServiceA', 'ServiceB');
  }
}

describe('DIContainer', () => {
  it('should bind and get a transient dependency', () => {
    const container = new DIContainer<Dependencies>();
    const provider = vi.fn(() => new ServiceA({ host: 'localhost' }));
    container.bindTo('serviceA', provider, 'trasient');

    const service1 = container.get('serviceA');
    const service2 = container.get('serviceA');

    expect(service1).toBeInstanceOf(ServiceA);
    expect(service2).toBeInstanceOf(ServiceA);
    expect(service1).not.toBe(service2);
    expect(provider).toHaveBeenCalledTimes(2);
  });

  it('should bind and get a singleton dependency', () => {
    const container = new DIContainer<Dependencies>();
    const provider = vi.fn(() => new ServiceA({ host: 'localhost' }));
    container.bindTo('serviceA', provider, 'singleton');

    const service1 = container.get('serviceA');
    const service2 = container.get('serviceA');

    expect(service1).toBeInstanceOf(ServiceA);
    expect(service2).toBeInstanceOf(ServiceA);
    expect(service1).toBe(service2);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it('should throw an error for an unbound dependency', () => {
    const container = new DIContainer<Dependencies>();
    expect(() => container.get('serviceA')).toThrow('No binding for serviceA');
  });

  it('should return undefined for an unbound dependency when throwIfNull is false', () => {
    const container = new DIContainer<Dependencies>();
    const service = container.get('serviceA', false);
    expect(service).toBeUndefined();
  });

  it('should resolve dependencies that depend on other dependencies', () => {
    const container = new DIContainer<Dependencies>();
    container.bindTo('config', () => ({ host: 'computerwizards.io' }), 'singleton');
    container.bindTo('serviceA', (ctx) => new ServiceA(ctx.get('config')), 'singleton');
    container.bindTo('serviceB', (ctx) => new ServiceB(ctx.get('serviceA')), 'singleton');

    const serviceB = container.get('serviceB');
    expect(serviceB.doSomething()).toBe('Hello from ServiceB on computerwizards.io');
  });

  it('should use transient as default scope', () => {
    const container = new DIContainer<Dependencies>();
    const provider = vi.fn(() => new ServiceA({ host: 'localhost' }));
    container.bindTo('serviceA', provider);

    const service1 = container.get('serviceA');
    const service2 = container.get('serviceA');

    expect(service1).not.toBe(service2);
    expect(provider).toHaveBeenCalledTimes(2);
  });
});
