import { describe, expect, test } from 'vitest';
import { Container } from '../src/index';

describe('Container', () => {
  test('should bind a provider and get the value', () => {
    type ResolutionMap = {
      foo: string;
    };
    const container = new Container<ResolutionMap>();
    container.bindTo('foo', () => 'bar');
    expect(container.get('foo')).toBe('bar');
  });

  test('should throw an error when getting an unbound identifier', () => {
    type ResolutionMap = {
      foo: string;
    };
    const container = new Container<ResolutionMap>();
    expect(() => container.get('foo')).toThrow(
      'No provider found for identifier: foo',
    );
  });

  test('should allow dependent services', () => {
    type ResolutionMap = {
      foo: string;
      bar: string;
    };
    const container = new Container<ResolutionMap>();
    container.bindTo('foo', () => 'foo-value');
    container.bindTo('bar', (c) => `${c.get('foo')}-bar`);
    expect(container.get('bar')).toBe('foo-value-bar');
  });
});
