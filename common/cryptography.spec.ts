import { expect } from 'chai';
import { symmetricDecryptByPrivateKey, symmetricEncryptByPrivateKey } from './cryptography';

const privateKey = '0x51dc809db7790639dfba3f2f7eeaaaf6c6294d535fa63b70f8b50910bb9ed18a';
const ownerPrivateKey = 'a37c5a8cc63e7b54c933aff29692d653d87355578fdcb966d88f4dda2b92bd02';

describe('symmetric encrypt/decrypt', () => {
  it('positive way', () => {
    const encryptedPrivateKey = symmetricEncryptByPrivateKey(privateKey, ownerPrivateKey);
    const decryptedPrivateKey = symmetricDecryptByPrivateKey(encryptedPrivateKey, ownerPrivateKey);
    expect(decryptedPrivateKey).eq(privateKey);
  });
});
