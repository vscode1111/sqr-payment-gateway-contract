import { expect } from 'chai';
import { toWeiWithFixed } from './converts';

describe('converts', () => {
  it('toWeiWithFixed', () => {
    expect(String(toWeiWithFixed(3.56811126839198423234, 8))).eq('356811127');
    expect(String(toWeiWithFixed(3.56811126839198423234, 8n))).eq('356811127');
  });
});
