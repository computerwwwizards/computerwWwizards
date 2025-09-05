export type PlainObject = { [key: string | symbol]: any };

export interface IContainer<ResolutionMap extends PlainObject> {
  get<T extends keyof ResolutionMap>(identifier: T): ResolutionMap[T];
  bindTo<T extends keyof ResolutionMap>(
    identifier: T,
    provider: (context: this) => ResolutionMap[T],
  ): IContainer<ResolutionMap>;
}

export class Container<ResolutionMap extends PlainObject>
  implements IContainer<ResolutionMap>
{
  private providers = new Map<
    keyof ResolutionMap,
    (context: this) => ResolutionMap[keyof ResolutionMap]
  >();

  get<T extends keyof ResolutionMap>(identifier: T): ResolutionMap[T] {
    const provider = this.providers.get(identifier);
    if (!provider) {
      throw new Error(
        `No provider found for identifier: ${String(identifier)}`,
      );
    }
    return provider(this) as ResolutionMap[T];
  }

  bindTo<T extends keyof ResolutionMap>(
    identifier: T,
    provider: (context: this) => ResolutionMap[T],
  ): IContainer<ResolutionMap> {
    this.providers.set(identifier, provider);
    return this;
  }
}
