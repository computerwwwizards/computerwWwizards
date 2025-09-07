# @computerwwwizards/dependency-injection

A truly lightweight, callback-based dependency injection container for TypeScript/JavaScript projects. Designed for minimal overhead, maximum flexibility, and zero reliance on decorators or proxies.

This is intended to be used as a base for more complex and opinionated
DI containers.

## Why use this?

- **Tiny footprint**: No runtime bloat, no decorators, no proxies, no magic.
- **Elastic API**: Works with any value, any type, any pattern. You control how dependencies are resolved.
- **No proxy/decorator overhead**: Unlike InversifyJS or tsyringe, this package is browser-friendly and works with module federation setups.
- **No forced patterns**: You decide how to wire dependencies, using simple callbacks and context.
- **Explicit lifecycle**: Singletons live as long as the container; transients are created on demand.

### Motivation

Most DI libraries are heavy, opinionated, and rely on TypeScript decorators or proxies. This causes:
- Bundle size bloat
- Browser compatibility issues
- Problems with module federation (multiple containers, duplicated metadata)
- Hard-to-debug magic

This package solves those problems by being minimal, explicit, and callback-driven.

## Quick Start

```ts
import { PrimitiveContainer } from '@computerwwwizards/dependency-injection'

const container = new PrimitiveContainer()
container.bindTo('config', () => ({ apiUrl: 'https://api.example' }), 'singleton')
container.bindTo('timestamp', () => Date.now(), 'transient')

const config = container.get('config')
const timestamp = container.get('timestamp')