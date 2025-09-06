
import { describe, it, expect } from 'vitest'
import { PrimitiveContainer } from './primitive-container'

describe('PrimitiveContainer', () => {
  it('binds and resolves transient providers', () => {
  const container = new PrimitiveContainer<{ value: number }>()

  container.bindTo('value', () => Math.random(), 'transient')

  const firstValue = container.get('value')
  const secondValue = container.get('value')

  expect(typeof firstValue).toBe('number')
  expect(typeof secondValue).toBe('number')
  expect(firstValue).not.toBe(secondValue)
  })

  it('binds and resolves singleton providers', () => {
  const container = new PrimitiveContainer<{ singletonObj: { n: number } }>()

  container.bindTo('singletonObj', () => ({ n: Math.random() }), 'singleton')

  const firstInstance = container.get('singletonObj')
  const secondInstance = container.get('singletonObj')

  expect(firstInstance).toBe(secondInstance)
  })

  it('throws when resolving unknown identifier', () => {
  const container = new PrimitiveContainer<{ value: number }>()

  expect(() => container.get('value')).toThrow()
  // allow not throwing when flag is true
  expect(() => container.get('value', true)).not.toThrow()
  })
})
