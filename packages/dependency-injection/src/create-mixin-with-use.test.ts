import { describe, it, expect, vi } from 'vitest';
import { createWithUse } from '../src/create-mixin-with-use';
import { PrimitiveContainer, PrimitiveContainerWithUse } from '../src/primitive-container';
import { IPrimitiveContainer } from '../src/types';

describe('createWithUse mixin creator', () => {
  it('should create a class with use method', () => {
    const Enhanced = createWithUse(PrimitiveContainer);
    const container = new Enhanced();
    
    expect(container).toHaveProperty('use');
    expect(typeof container.use).toBe('function');
  });

  it('should preserve original class functionality', () => {
    interface Services {
      logger: { log: (msg: string) => void };
      config: { apiUrl: string };
    }

    const Enhanced = createWithUse(PrimitiveContainer);
  
    const container = new Enhanced<Services>();

    // Should have original methods
    expect(container).toHaveProperty('bindTo');
    expect(container).toHaveProperty('get');
    expect(container).toHaveProperty('unbind');

    // Should work with binding and getting
    container.bindTo('logger', () => ({ log: (msg: string) => console.log(msg) }));
    const logger = container.get('logger');
    
    expect(logger).toHaveProperty('log');
    expect(typeof logger.log).toBe('function');
  });

  it('should allow chaining use method calls', () => {
    interface Services {
      service1: string;
      service2: number;
    }

    const Enhanced = createWithUse(PrimitiveContainer);
    const container = new Enhanced<Services>();

    const plugin1 = (c: IPrimitiveContainer<Services>) => {
      c.bindTo('service1', () => 'test1');
    };

    const plugin2 = (c: IPrimitiveContainer<Services>) => {
      c.bindTo('service2', () => 42);
    };

    const result = container.use(plugin1, plugin2);
    
    expect(result).toBe(container);
    expect(container.get('service1')).toBe('test1');
    expect(container.get('service2')).toBe(42);
  });

  it('should work with multiple handlers in single use call', () => {
    interface Services {
      config: { env: string };
      logger: { log: (msg: string) => void };
      cache: Map<string, any>;
    }

    const container = new PrimitiveContainerWithUse<Services>();

    const configPlugin = (c: IPrimitiveContainer<Services>) => {
      c.bindTo('config', () => ({ env: 'test' }));
    };

    const loggerPlugin = (c: IPrimitiveContainer<Services>) => {
      c.bindTo('logger', () => ({ log: vi.fn() }));
    };

    const cachePlugin = (c: IPrimitiveContainer<Services>) => {
      c.bindTo('cache', () => new Map());
    };

    container.use(configPlugin, loggerPlugin, cachePlugin);

    expect(container.get('config').env).toBe('test');
    expect(container.get('logger')).toHaveProperty('log');
    expect(container.get('cache')).toBeInstanceOf(Map);
  });
});

describe('PrimitiveContainerWithUse', () => {
  it('should be an enhanced version of PrimitiveContainer', () => {
    interface Services {
      database: { connect: () => Promise<void> };
    }

    const container = new PrimitiveContainerWithUse<Services>();
    
    expect(container).toHaveProperty('use');
    expect(container).toHaveProperty('bindTo');
    expect(container).toHaveProperty('get');
    expect(container).toHaveProperty('unbind');
  });

  it('should support dependency injection patterns', () => {
    interface Services {
      config: { dbUrl: string };
      database: { connect: () => void };
      userService: { findUser: (id: string) => any };
    }

    const container = new PrimitiveContainerWithUse<Services>();

    const databasePlugin = (c: IPrimitiveContainer<Services>) => {
      c.bindTo('config', () => ({ dbUrl: 'test://localhost' }));
      c.bindTo('database', (ctx) => {
        const config = ctx.get('config');
        return { 
          connect: () => console.log(`Connecting to ${config.dbUrl}`)
        };
      });
    };

    const userServicePlugin = (c: IPrimitiveContainer<Services>) => {
      c.bindTo('userService', (ctx) => {
        const db = ctx.get('database');
        return {
          findUser: (id: string) => {
            db.connect();
            return { id, name: 'Test User' };
          }
        };
      });
    };

    container.use(databasePlugin, userServicePlugin);

    const userService = container.get('userService');
    const user = userService.findUser('123');
    
    expect(user).toEqual({ id: '123', name: 'Test User' });
  });

  it('should handle singleton scope correctly', () => {
    interface Services {
      counter: { value: number; increment: () => void };
    }

    const container = new PrimitiveContainerWithUse<Services>();

    const counterPlugin = (c: IPrimitiveContainer<Services>) => {
      c.bindTo('counter', () => {
        let value = 0;
        return {
          value,
          increment: function() { this.value++; }
        };
      }, 'singleton');
    };

    container.use(counterPlugin);

    const counter1 = container.get('counter');
    const counter2 = container.get('counter');
    
    expect(counter1).toBe(counter2); // Same instance
    
    counter1.increment();
    expect(counter2.value).toBe(1); // Shared state
  });
});