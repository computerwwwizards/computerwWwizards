export type Identifier = string | symbol | number

export type PlainObject = Record<Identifier, any>

export type ProviderFn<
  ResultsByIdentifier extends PlainObject, T extends keyof ResultsByIdentifier
> =  (ctx: IPrimitiveContainer<ResultsByIdentifier>)=>ResultsByIdentifier[T]

export interface IPrimitiveContainer<ResultsByIdentifier extends PlainObject >{
  bindTo<T extends keyof ResultsByIdentifier>(
    identifier: T, 
    provider: ProviderFn<ResultsByIdentifier, T>,
    scope?: 'singleton' | 'transient'
  ): this;
  get<T extends keyof ResultsByIdentifier, R extends boolean>(
    identifier: T, 
    throwIfNull?: R,
    meta?: any
  ): R extends false? ResultsByIdentifier[T]: ResultsByIdentifier[T] | undefined
}


export interface BindOptions<
  Register extends PlainObject, 
  T extends keyof Register, 
  M = unknown, 
  Meta = any
>{
  scope?: 'transient' | 'singleton';
  resolveDependencies?: (ctx: IPreProcessDependencyContainer<Register>, meta?: Meta)=> M
  provider: (resolvedDeps: M, ctx: IPreProcessDependencyContainer<Register>, meta?: Meta)=>Register[T];
  meta?: Meta
}

/**
 * Each time client code binds it needs a depedency resolution
 * callback to be registered, so this callback is goign to be
 * executed before the provider in order to pass its results
 * to the provider for easy use and manual injection
 */
export interface IPreProcessDependencyContainer<
  Register extends PlainObject
> extends IPrimitiveContainer<Register>{
  bind<
    T extends keyof Register, 
    M = unknown,
    Meta = any
  >(identifier: T, options: BindOptions<Register, T, M, Meta>):this;
}
