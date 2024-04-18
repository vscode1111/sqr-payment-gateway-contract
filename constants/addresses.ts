import { DeployNetworks } from '~types';

export const SQR_PAYMENT_GATEWAY_NAME = 'SQRPaymentGateway';
export const ERC20_TOKEN_NAME = 'ERC20Token';

export enum CONTRACT_LIST {
  SQR_PAYMENT_GATEWAY = 'SQR_PAYMENT_GATEWAY',
}

export const TOKENS: Record<CONTRACT_LIST, DeployNetworks> = {
  SQR_PAYMENT_GATEWAY: {
    // bsc: '0xC85AC922880b2eD44a2D9a78739740990B6219f5', //Test
    // bsc: '0x7D82090d0f7901Dfe612486E6D5A9A1d1c6e5f62', //Test
    // bsc: '0x82eFbC9ec9546b78aD223dE39eBD1D5F9243E18f', //Test
    // bsc: '0x258AF60a788fef0289994997c813D5933AcCd52A', //Test
    // bsc: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852', //Main - fcfs
    // bsc: '0xe561e403093A19A770d5EE515aC1d5434275c026', //Main - sqrp-gated
    bsc: '0x8e6585Dd84c1cDc340727f66183992AaCe7Bfc18', //Main - white-llst
    // bsc: '', //Prod
  },
};
