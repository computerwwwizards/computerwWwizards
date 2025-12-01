export type Identifier = string | symbol | number

export type PlainObject = Record<Identifier, any>

export type Scope = 'singleton' | 'transient'

export type ProviderFn<
  ResultsByIdentifier extends PlainObject, 
  Key extends keyof ResultsByIdentifier
> =  (ctx: IPrimitiveContainer<ResultsByIdentifier>)=>ResultsByIdentifier[Key]



export type ContainerWithPlugins<
  T extends PlainObject, 
  ContainerType extends IPrimitiveContainer<T>
> = ContainerType & {
  use(
    ...handlers: ((container: ContainerType)=>ContainerType)[]
  ): ContainerWithPlugins<T, ContainerType>;
}

export interface IPrimitiveContainer<ResultsByIdentifier extends PlainObject >{
  bindTo<Identifier extends keyof ResultsByIdentifier>(
    identifier: Identifier, 
    provider: ProviderFn<ResultsByIdentifier, Identifier>,
    scope?: Scope
  ): this;
  get<Identifier extends keyof ResultsByIdentifier, R extends boolean = false>(
    identifier: Identifier, 
    doNotThrowIfNull?: R,
    meta?: any
  ): R extends true ? ResultsByIdentifier[Identifier] | undefined : ResultsByIdentifier[Identifier];
  unbind(identifier: keyof ResultsByIdentifier): this;
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
