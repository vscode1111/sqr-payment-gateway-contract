import { DeployNetworks } from '~types';

export const SQR_PAYMENT_GATEWAY_NAME = 'SQRPaymentGateway';
export const SQR_TOKEN_NAME = 'SQRToken';

export enum CONTRACT_LIST {
  SQR_PAYMENT_GATEWAY = 'SQR_PAYMENT_GATEWAY',
}

export const TOKENS: Record<CONTRACT_LIST, DeployNetworks> = {
  SQR_PAYMENT_GATEWAY: {
    // bsc: '0xC85AC922880b2eD44a2D9a78739740990B6219f5', //s-Main
    bsc: '0x7D82090d0f7901Dfe612486E6D5A9A1d1c6e5f62', //Main
    // bsc: '0x282f8613996343F25FE01f223AB34E6348a2260b', //Prod
  },
};
