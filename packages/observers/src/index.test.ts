describe('ObservableStore subscribe emitCurrent option', () => {
  it('should NOT emit current value on subscribe by default', () => {
    const store = new ObservableStore(123);
    let called = false;
    let value = null;
    store.subscribe(v => { called = true; value = v; });
    expect(called).toBe(false);
    expect(value).toBe(null);
    store.update(456);
    expect(called).toBe(true);
    expect(value).toBe(456);
  });

  it('should emit current value on subscribe when emitCurrent is true', () => {
    const store = new ObservableStore(789);
    let called = false;
    let value = null;
    store.subscribe(v => { called = true; value = v; }, true);
    expect(called).toBe(true);
    expect(value).toBe(789);
    store.update(101);
    expect(value).toBe(101);
  });

  it('subscribeWithCleanup should also support emitCurrent', () => {
    const store = new ObservableStore('init');
    let value = null;
    const cleanup = store.subscribeWithCleanup(v => { value = v; }, true);
    expect(value).toBe('init');
    store.update('next');
    expect(value).toBe('next');
    cleanup();
    store.update('final');
    expect(value).toBe('next'); // Should not update after cleanup
  });
});
import { ObservableStore, DerivedStore } from './index';
import { describe, it, expect } from 'vitest'

describe('DerivedStore', () => {
  it('should derive state from multiple named sources and update when any source changes', () => {
    const userStore = new ObservableStore({ id: 1, name: 'John' });
    const preferencesStore = new ObservableStore({ theme: 'dark', fontSize: 14 });
    const cartStore = new ObservableStore<{items: { id: number, name: string, price: number }[], total: number}>({ items: [], total: 0 });

    const appStateStore = new DerivedStore(
      {
        user: userStore,
        prefs: preferencesStore,
        cart: cartStore
      },
      (sources) => ({
        currentUser: sources.user,
        displayMode: sources.prefs.theme,
        fontSize: sources.prefs.fontSize,
        cartItemCount: sources.cart.items.length,
        showCheckout: sources.cart.items.length > 0,
        welcomeMessage: `Welcome ${sources.user.name}!`,
        totalWithTax: sources.cart.total * 1.08
      })
    );

    let lastState: any = null;
    const cleanup = appStateStore.subscribeWithCleanup(state => {
      lastState = state;
    }, true);

    // Initial derived state
    expect(lastState.currentUser.name).toBe('John');
    expect(lastState.displayMode).toBe('dark');
    expect(lastState.cartItemCount).toBe(0);
    expect(lastState.showCheckout).toBe(false);

    // Update user
    userStore.update(prev => ({ ...prev, name: 'Jane' }));
    expect(lastState.currentUser.name).toBe('Jane');
    expect(lastState.welcomeMessage).toBe('Welcome Jane!');

    // Update cart
    cartStore.update(prev => ({
      ...prev,
      items: [...prev.items, { id: 1, name: 'Product', price: 29.99 }],
      total: prev.total + 29.99
    }));
    expect(lastState.cartItemCount).toBe(1);
    expect(lastState.showCheckout).toBe(true);
    expect(lastState.totalWithTax).toBeCloseTo(29.99 * 1.08);

    // Cleanup
    appStateStore.dispose();
    cleanup();
  });
});
