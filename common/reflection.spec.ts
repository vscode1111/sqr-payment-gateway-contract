import { expect } from 'chai';
import { C, N, NF, NF2, P } from './reflection';

interface TestInterface {
  field1: number;
  field2: number;
}

class TestClass {}

describe('reflection', () => {
  describe('check P function', () => {
    it('field1', () => {
      const result = P<TestInterface>((p) => p.field1);
      expect(result).eq('field1');
    });

    it('field2', () => {
      const result = P<TestInterface>((m) => m.field2);
      expect(result).eq('field2');
    });
  });

  describe('check С function', () => {
    it('TestClass', () => {
      const result = C(TestClass);
      expect(result).eq('TestClass');
    });
  });

  describe('check N function', () => {
    it('field1', () => {
      const result = N<TestInterface>('field1');
      expect(result).eq('field1');
    });

    it('field2', () => {
      const result = N<TestInterface>('field2');
      expect(result).eq('field2');
    });
  });

  describe('check N factory', () => {
    const N1 = NF<TestInterface>();

    it('field1', () => {
      const result = N1('field1');
      expect(result).eq('field1');
    });

    it('field2', () => {
      const result = N1('field2');
      expect(result).eq('field2');
    });
  });

  describe('check N2 factory', () => {
    const N1 = NF2<TestInterface>((name) => `TestInterface.${name}`);

    it('field1', () => {
      const result = N1('field1');
      expect(result).eq('TestInterface.field1');
    });

    it('field2', () => {
      const result = N1('field2');
      expect(result).eq('TestInterface.field2');
    });
  });
});
