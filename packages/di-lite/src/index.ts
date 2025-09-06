export type Identifier = string | symbol | number

export type PlainObject = Record<Identifier, any>

export type ProviderFn<ResultsByIdentifier extends PlainObject, T extends keyof ResultsByIdentifier> =  (ctx: MinimalContainer<ResultsByIdentifier>)=>ResultsByIdentifier[T]

export interface MinimalContainer<ResultsByIdentifier extends PlainObject >{
  bindTo<T extends keyof ResultsByIdentifier>(
    identifier: T, 
    provider: ProviderFn<ResultsByIdentifier, T>,
    scope?: 'singleton' | 'trasient'
  ): this;
  get<T extends keyof ResultsByIdentifier, R extends boolean>(
    identifier: T, 
    throwIfNull?: R
  ): R extends false? ResultsByIdentifier[T]: ResultsByIdentifier[T] | undefined
}

export class Container<ResultsbyIdentifier extends  PlainObject> implements 
  MinimalContainer<ResultsbyIdentifier>
{
  constructor(private readonly registry = new Map<
    keyof ResultsbyIdentifier, 
    {
      provider: (ctx: Container<ResultsbyIdentifier>)=>any
      scope: 'singleton' | 'trasient',
      reference?: any
    }
  >()){}

  bindTo<T extends keyof ResultsbyIdentifier>(
    identifier: T, 
    provider: (ctx: Container<ResultsbyIdentifier>) => ResultsbyIdentifier[T],
    scope: 'singleton' | 'trasient' = 'trasient'
  ) {
    const value = {provider, reference: undefined, scope}

    this.registry.set(identifier, value)

    return this;
  }

  get<T extends keyof ResultsbyIdentifier, R extends boolean>(
    identifier: T, 
    doNotThrowIIfNull?: R | undefined
  ){
    const maybeValue = this.registry.get(identifier)
    const maybeProvider = maybeValue?.provider;
      
    if(!maybeProvider && !doNotThrowIIfNull)
      throw new Error(`Could not resolve ${String(identifier)}, did you register?`)
    
    if(maybeValue?.scope === 'singleton')
      maybeValue.reference ??= maybeProvider?.(this)
    
    return maybeValue?.scope === 'singleton' ? maybeValue.reference : maybeProvider?.(this);
  }
}

