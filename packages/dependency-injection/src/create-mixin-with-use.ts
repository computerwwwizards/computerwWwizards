
import { ContainerWithPlugins, IPrimitiveContainer, PlainObject } from "./types";

type Constructor<T = {}> = new (...args: any[]) => T;

export function createWithUse<TBase extends Constructor<IPrimitiveContainer<any>>>(
  Clazz: TBase
) {
  return class extends Clazz {
    constructor(...args: any[]) {
      super(...args);
    }
    
    use<Register extends PlainObject>(
      this: IPrimitiveContainer<Register>,
      ...handlers: Array<(container: IPrimitiveContainer<Register>) => IPrimitiveContainer<Register>>
    ): ContainerWithPlugins<Register, IPrimitiveContainer<Register>> {
      handlers.forEach((handler) => handler(this));
      
      return this as ContainerWithPlugins<Register, IPrimitiveContainer<Register>>;
    }
  };
}