# Observable Store

A minimal TypeScript library for creating observable state containers with subscription capabilities.

## Core Philosophy

- **Minimal API**: Only the essential methods needed for state management
- **Client Responsibility**: Subscribers handle their own equality checks and error handling
- **Mutation Support**: Values can be directly mutated if desired
- **Framework Agnostic**: Works with any UI framework or vanilla JS

## Core Components

### `ObservableStore<T>`

A basic store that holds a value of type `T` and notifies subscribers when that value changes.

### `DerivedStore<T, S>`

A store that derives its value from other observable stores, automatically updating when any source store changes.

### `ChildObservableStore<C, P>`

A store that is linked to a parent store, with its own value that can be updated independently or derived from the parent's value.

## API Reference

### ObservableStore

```typescript
class ObservableStore<T> {
  constructor(initialValue: T)
  
  // Get the current value
  getValue(): T
  
  // Subscribe to changes
  subscribe(listener: (currentValue: T) => void, emitCurrent = false): this
  
  // Subscribe with a cleanup function
  subscribeWithCleanup(listener: (currentValue: T) => void, emitCurrent = false): () => void
  
  // Unsubscribe a listener
  unsubscribe(listener: (currentValue: T) => void): this
  
  // Update the store's value
  update(updater: T | ((prev: T) => T)): this
}
```

### DerivedStore

```typescript
class DerivedStore<T, S extends Record<string, any>> extends ObservableStore<T> {
  constructor(
    sources: SourcesRecord<S>,
    deriveFn: (sourceValues: SourcesValues<S>, prevValue?: T) => T
  )
  
  // Get all source stores
  getSources(): SourcesRecord<S>
  
  // Get the current values of all source stores
  getSourceValues(): SourcesValues<S>
  
  // Clean up subscriptions
  dispose(): this
  
  // Override to support both direct updates and updates with source values
  update(updater: T | ((prev: T, sourceValues?: SourcesValues<S>) => T)): this
}
```

### ChildObservableStore

```typescript
class ChildObservableStore<C, P = C> extends ObservableStore<C> {
  constructor(
    initialValue: C,
    parent: IObservableStore<P>,
    onParentUpdate: (parentValue: P, childPrev: C) => C
  )
  
  // Change how parent updates affect this store
  setOnParentUpdate(onParentUpdate: (parentValue: P, childPrev: C) => C): this
  
  // Update with access to parent value
  update(updater: C | ((childPrev: C, parentValue: P) => C)): this
  
  // Clean up subscription to parent
  dispose(): this
}
```

## Usage Examples

### Basic Store

```typescript
const counter = new ObservableStore(0);

// Subscribe to changes
counter.subscribe(value => console.log(`Counter: ${value}`));

// Update the value
counter.update(prev => prev + 1); // Logs: "Counter: 1"
counter.update(5);                // Logs: "Counter: 5"

// You can also mutate the value directly if needed
counter.update(prev => {
  prev.someProperty = newValue; // Direct mutation
  return prev; // Return same reference
});
```

### Derived Store

```typescript
const userStore = new ObservableStore({ name: 'John', age: 30 });
const settingsStore = new ObservableStore({ theme: 'dark', fontSize: 14 });

const appState = new DerivedStore(
  { user: userStore, settings: settingsStore },
  ({ user, settings }) => ({
    userName: user.name,
    userAge: user.age,
    isDarkMode: settings.theme === 'dark',
    fontSize: settings.fontSize,
  })
);

appState.subscribe(state => console.log(state));
userStore.update(prev => ({ ...prev, name: 'Jane' }));
// Logs: { userName: 'Jane', userAge: 30, isDarkMode: true, fontSize: 14 }
```

### With React's useSyncExternalStore

```typescript
function useStore<T>(store: IObservableStore<T>) {
  return useSyncExternalStore(
    callback => store.subscribeWithCleanup(callback),
    () => store.getValue()
  );
}

function Counter() {
  const count = useStore(counterStore);
  return <div>{count}</div>;
}
```

## Implementation Notes

### Error Handling

The library doesn't catch errors from subscribers. If any subscriber throws, it will break the notification chain. This is an intentional design choice to keep the primitives minimal:

```javascript
// Client code responsibility example
store.subscribe(value => {
  try {
    // Handle the update safely
    processSafely(value);
  } catch (error) {
    // Handle errors locally
    console.error('Error processing update:', error);
  }
});
```

### Equality Checking

The library doesn't perform equality checks on values. Subscribers are responsible for determining if an update is meaningful:

```javascript
let previousValue = null;
store.subscribe(value => {
  // Client-side equality check
  if (JSON.stringify(value) !== JSON.stringify(previousValue)) {
    // Only process meaningful changes
    doSomething(value);
    previousValue = JSON.parse(JSON.stringify(value));
  }
});
```


## Future Improvements

- **Updater Configuration**: Plan to allow passing configuration objects to `update` methods, enabling custom error handling and edge case management per update.
- **Enhanced Mutable Operations**: Plan to add more utilities for direct mutation, batch mutation, and fine-grained control over how state is changed and emitted.
- **Plugin System**: Add support for plugins that can intercept, filter, or transform values before they reach subscribers. Plugins may also filter which callbacks/subscribers are executed, allowing for advanced control over notification logic (e.g., only notify certain subscribers based on value or context). This enables features like logging, filtering, or custom processing without changing client code. We are also planning to evaluate rough points between RxJS and this library, and create plugins to add stream support (such as filtering, mapping, and reactive pipelines) if needed.
- **Lazy Subscribers**: Support subscribers that can be created ahead of time and work with a fallback value if no emitter is available. This enables more flexible state sharing and decoupling between emitters and subscribers, useful for multi-framework or async scenarios.

## License

MIT