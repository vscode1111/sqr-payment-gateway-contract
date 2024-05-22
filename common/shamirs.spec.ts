import { expect } from 'chai';
import sss, { SplitOptions } from 'shamirs-secret-sharing';

const privateKey = '227dbb8586117d55284e26620bc76534dfbd2394be34cf4a09cb775d593b6f2b';
const options: SplitOptions = {
  shares: 5,
  threshold: 3,
};

describe('shamirs', () => {
  it('positive way', () => {
    const secret = Buffer.from(privateKey);
    const shares = sss.split(secret, options);
    const sharesBase64 = shares.map((share) => share.toString('base64'));
    const newShares = sharesBase64.map((share) => Buffer.from(share, 'base64'));
    const recovered = sss.combine([newShares[0], newShares[1], newShares[4]]);
    expect(recovered.toString()).eq(privateKey);
  });
});
