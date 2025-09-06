import { PrimitiveContainer } from "./primitive-container";
import { BindOptions, IPreProcessDependencyContainer, PlainObject } from "./types";

export class PreProcessDependencyContainer <
  Register extends PlainObject
> extends PrimitiveContainer<Register> 
implements IPreProcessDependencyContainer<Register> 
{
  bind<
    T extends keyof Register, 
    M = unknown,  
    Meta = any
  >(identifier: T, options: BindOptions<Register, T, M,Meta>){
    const {
      provider,
      resolveDependencies,
      scope = 'singleton',
      meta
    } = options

    return super.bindTo(identifier, (ctx)=>{
      const resolvedDependencies = resolveDependencies?.(
        ctx as IPreProcessDependencyContainer<Register>, 
        meta
      )!;

      return provider(
        resolvedDependencies, 
        ctx as IPreProcessDependencyContainer<Register>, 
      meta);
    }, scope)
  }
}

export const createAutoResolveDepsInOrder = <T extends PlainObject>(
  deps: ({identifier:keyof T, dontThrowIfNull?: boolean})[]
)=>(ctx:IPreProcessDependencyContainer<T>)=>{
  return deps.map(({identifier, dontThrowIfNull}) => ctx.get(identifier, dontThrowIfNull))
}

export const createAutoResolver = <T extends PlainObject, Key extends keyof T>(deps: ({identifier:Key, dontThrowIfNull?: boolean})[])=>(
  ctx: IPreProcessDependencyContainer<T>
):Pick<T, Key>=>{
  return Object
    .fromEntries(
      deps
        .map(({identifier, dontThrowIfNull}) =>[identifier, ctx.get(identifier, dontThrowIfNull)])
    ) as Pick<T, Key>;
}