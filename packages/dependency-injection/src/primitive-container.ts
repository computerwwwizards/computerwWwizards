import { IPrimitiveContainer, PlainObject } from "./types";

export class PrimitiveContainer<
  ResultsbyIdentifier extends  PlainObject
> implements 
  IPrimitiveContainer<ResultsbyIdentifier>
{
  constructor(private readonly registry = new Map<
    keyof ResultsbyIdentifier, 
    {
      provider: (ctx: IPrimitiveContainer<ResultsbyIdentifier>)=>any
      scope: 'singleton' | 'transient',
      reference?: any
    }
  >()){}

  bindTo<T extends keyof ResultsbyIdentifier>(
    identifier: T, 
    provider: (ctx: IPrimitiveContainer<ResultsbyIdentifier>) => ResultsbyIdentifier[T],
    scope: 'singleton' | 'transient' = 'transient'
  ) {
    const value = {provider, reference: undefined, scope}

    this.registry.set(identifier, value)

    return this;
  }

  get<T extends keyof ResultsbyIdentifier, R extends boolean>(
    identifier: T, 
    doNotThrowIIfNull?: R | undefined
  ):ResultsbyIdentifier[T]{
    const maybeValue = this.registry.get(identifier)
    const maybeProvider = maybeValue?.provider;
      
    if(!maybeProvider && !doNotThrowIIfNull)
      throw new Error(
        `Could not resolve ${String(identifier)}, did you register it?`
      )
    
    if(maybeValue?.scope === 'singleton')
      maybeValue.reference ??= maybeProvider?.(this)
    
    return maybeValue?.scope === 'singleton' ? 
      maybeValue.reference : 
      maybeProvider?.(this);
  }
}

