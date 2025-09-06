
import { describe, it, expect } from 'vitest'
import { PreProcessDependencyContainer, createAutoResolveDepsInOrder, createAutoResolver } from './pre-process-dependency-container'

describe('PreProcessDependencyContainer', () => {
  it('runs resolver before provider and passes resolved deps', () => {
    type Reg = { firstNumber: number; secondNumber: number; sum: number }

  const container = new PreProcessDependencyContainer<Reg>()

  container.bindTo('firstNumber', () => 1)
  container.bindTo('secondNumber', () => 2)

  container.bind('sum', {
      scope: 'transient',
      resolveDependencies: createAutoResolveDepsInOrder([
        { identifier: 'firstNumber'},
        { identifier: 'secondNumber'}
      ]),
      provider: (resolved: (number| undefined)[]) => {

    const [first = 0, second = 0] = resolved
    return first + second
      }
    })
  expect(container.get('sum')).toBe(3)
  })

  it('createAutoResolver returns object mapped by keys', () => {
    type Reg = { firstNumber: number; secondNumber: number; bag: { firstNumber: number; secondNumber: number } }

  const container = new PreProcessDependencyContainer<Reg>()

  container.bindTo('firstNumber', () => 5)
  container.bindTo('secondNumber', () => 7)

  container.bind('bag', {
      scope: 'transient',
      resolveDependencies: createAutoResolver<Reg, 'firstNumber' | 'secondNumber'>([
        { identifier: 'firstNumber'},
        { identifier: 'secondNumber'}
      ]),
      provider: (resolved) => resolved
    })

  const bag = container.get('bag')

  expect(bag.firstNumber).toBe(5)
  expect(bag.secondNumber).toBe(7)
  })
})
