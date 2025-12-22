import { createWithUse } from "./create-mixin-with-use";
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

  unbind(identifier: keyof ResultsbyIdentifier): this {
    this.registry.delete(identifier);
    
    return this;
  }
}


export const PrimitiveContainerWithUse = createWithUse(PrimitiveContainer)

export class ChildPrimitiveContainer <
  OwnResultsbyIdentifier extends  PlainObject,
  ParentResultsByIdentfier extends PlainObject
> extends PrimitiveContainer<OwnResultsbyIdentifier>
 implements 
  IPrimitiveContainer<OwnResultsbyIdentifier>
{
  constructor(private parent?: PrimitiveContainer<ParentResultsByIdentfier>){
    super();
  }

  override get<T extends keyof (OwnResultsbyIdentifier & ParentResultsByIdentfier), R extends boolean>(
    identifier: T, doNotThrowIIfNull?: R | undefined): (OwnResultsbyIdentifier & ParentResultsByIdentfier)[T] {
    const maybeInstance = super.get(identifier, true) ?? this.parent?.get(identifier, true);

    if(!doNotThrowIIfNull && !maybeInstance)
      throw new Error(`Not found ${String(identifier)}`)

    return maybeInstance!
  }
} 
