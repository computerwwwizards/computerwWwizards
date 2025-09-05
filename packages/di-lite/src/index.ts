export type Identifier = string | symbol | number

export type PlainObject = Record<Identifier, any>

export interface Container<ResultsByIdentifier extends PlainObject> {
  bindTo<T extends keyof ResultsByIdentifier>(
    identifier: T,
    provider: (ctx: Container<ResultsByIdentifier>) => ResultsByIdentifier[T],
    scope?: 'singleton' | 'trasient'
  ): this;
  get<T extends keyof ResultsByIdentifier, R extends boolean = true>(
    identifier: T,
    throwIfNull?: R
  ): R extends false ? ResultsByIdentifier[T] | undefined : ResultsByIdentifier[T]
}

type Provider<R extends PlainObject, T extends keyof R> = (ctx: Container<R>) => R[T];

interface Binding<R extends PlainObject, T extends keyof R> {
  provider: Provider<R, T>;
  scope: 'singleton' | 'trasient';
  instance?: R[T];
}

export class DIContainer<ResultsByIdentifier extends PlainObject> implements Container<ResultsByIdentifier> {
  private bindings = new Map<keyof ResultsByIdentifier, Binding<ResultsByIdentifier, any>>();

  bindTo<T extends keyof ResultsByIdentifier>(
    identifier: T,
    provider: (ctx: Container<ResultsByIdentifier>) => ResultsByIdentifier[T],
    scope: 'singleton' | 'trasient' = 'trasient'
  ): this {
    this.bindings.set(identifier, { provider, scope });
    return this;
  }

  get<T extends keyof ResultsByIdentifier, R extends boolean = true>(
    identifier: T,
    throwIfNull: R = true as R
  ): R extends false ? ResultsByIdentifier[T] | undefined : ResultsByIdentifier[T] {
    const binding = this.bindings.get(identifier);

    if (!binding) {
      if (throwIfNull) {
        throw new Error(`No binding for ${identifier.toString()}`);
      }
      return undefined as any;
    }

    if (binding.scope === 'singleton') {
      return binding.instance ??= binding.provider(this);
    }

    return binding.provider(this);
  }
}
