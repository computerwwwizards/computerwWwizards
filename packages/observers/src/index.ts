export interface IObservableStore<T>{
  getValue():T;
  unsubscribe(listener: (currentValue:T)=>void): this;
  subscribe(listener: (currentValue:T)=>void): this;
  subscribeWithCleanup(listener: (currentValue:T)=>void): ()=>void;
  update(updater: T | ((prev: T)=>T)):this;
}

export class ObservableStore<T> implements IObservableStore<T>{
  protected listeners = new Set<(currentValue: T) => void>();
  protected value: T;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  getValue(): T {
    return this.value;
  }

  unsubscribe(listener: (currentValue: T) => void) {
    this.listeners.delete(listener);
    return this;
  }

  subscribe(listener: (currentValue: T) => void, emitCurrent = false): this {
    this.listeners.add(listener);
    if (emitCurrent) {
      listener(this.value);
    }
    return this;
  }

  subscribeWithCleanup(listener: (currentValue: T) => void, emitCurrent = false): () => void {
    this.listeners.add(listener);
    if (emitCurrent) {
      listener(this.value);
    }
    return () => {
      this.unsubscribe(listener);
    };
  }

  update(updater: T | ((prev: T) => T)) {
    if (typeof updater === 'function') {
      this.value = (updater as (prev: T) => T)(this.value);
    } else {
      this.value = updater;
    }
    this.listeners.forEach(cb => cb(this.value));
    return this;
  }
}

// Using record type for better type safety with sources
export type SourcesRecord<Sources extends Record<string, any>> = {
  [K in keyof Sources]: IObservableStore<Sources[K]>;
};

// Get the values type from the sources record
export type SourcesValues<Sources extends Record<string, any>> = {
  [K in keyof Sources]: Sources[K];
};

export interface IDerivedStore<T, S extends Record<string, any>> extends IObservableStore<T> {
  dispose(): this;
  getSources(): SourcesRecord<S>;
  getSourceValues(): SourcesValues<S>;
}

export class DerivedStore<T, S extends Record<string, any>>
  extends ObservableStore<T>
  implements IDerivedStore<T, S> {
  private cleanupFunctions: Array<() => void> = [];
  private isDisposed = false;

  constructor(
    private sources: SourcesRecord<S>,
    private deriveFn: (sourceValues: SourcesValues<S>, prevValue?: T) => T
  ) {
    // Initialize with derived value from current sources
    const sourceValues = Object.entries(sources).reduce(
      (values, [key, store]) => {
        values[key] = store.getValue();
        return values;
      },
      {} as Record<string, any>
    ) as SourcesValues<S>;
    super(deriveFn(sourceValues));
    // Subscribe to all sources
    Object.entries(this.sources).forEach(([key, store]) => {
      const cleanup = store.subscribeWithCleanup(() => {
        if (this.isDisposed) return;
        // Get current values from all sources
        const currentSourceValues = this.getSourceValues();
        // Update our value with the derivation function
        super.update(prevValue => this.deriveFn(currentSourceValues, prevValue));
      });
      this.cleanupFunctions.push(cleanup);
    });
  }

  getSources(): SourcesRecord<S> {
    return this.sources;
  }

  getSourceValues(): SourcesValues<S> {
    return Object.entries(this.sources).reduce(
      (values, [key, store]) => {
        values[key] = store.getValue();
        return values;
      },
      {} as Record<string, any>
    ) as SourcesValues<S>;
  }

  // Override update to allow both derived and direct updates
  update(updater: T | ((prev: T, sourceValues?: SourcesValues<S>) => T)) {
    const sourceValues = this.getSourceValues();
    return super.update(prevValue => {
      if (typeof updater === 'function') {
        return (updater as Function)(prevValue, sourceValues);
      }
      return updater;
    });
  }

  dispose() {
    this.isDisposed = true;
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    return this;
  }
}


export interface IChildObservableStore<C, P = C> extends IObservableStore<C> {
  setOnParentUpdate(onParentUpdate: (parentValue: P, childPrev: C) => C): this;
}

export class ChildObservableStore<C, P = C> extends ObservableStore<C> {
  private cleanup: (() => void) | null = null;
  constructor(
    initialValue: C,
    private parent: IObservableStore<P>,
    private onParentUpdate: (parentValue: P, childPrev: C) => C
  ) {
    super(initialValue);
    this.cleanup = this.parent.subscribeWithCleanup((parentValue) => {
      super.update((childPrev) => this.onParentUpdate(parentValue, childPrev));
    });
  }

  setOnParentUpdate(onParentUpdate: (parentValue: P, childPrev: C) => C){
    this.onParentUpdate = onParentUpdate

    return this;
  }

  update(updater:  C | ((childPrev: C, parentValue: P) => C )) {
    const parentValue = this.parent.getValue();

    return super
      .update(
        typeof updater === 'function' 
          ? (childPrev) => (updater as (childPrev: C, parentValue: P) => C)(childPrev, parentValue)
          : updater
      );
  }

  dispose() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    return this;
  }
}
