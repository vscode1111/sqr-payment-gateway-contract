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
    // bsc: '0x8e6585Dd84c1cDc340727f66183992AaCe7Bfc18', //Main - white-list
    // bsc: '0x88fD85b2621b6C9548A404eA250376AC5BEFeC13', //Main - fcfs - depositGoal: 100K
    // bsc: '0x48f4b9A3A95d97B62D1958Dbd5Bd3f906242A762', //Main - sqrp-gated - depositGoal: 100 - 27 Apr - 30 Apr
    // bsc: '0x43e278854ae4a7b9b7dB7Dfb7cc7d60FEB2304f2', //Main - fcfs - 10K
    bsc: '0x62608676F04AFe23554242Cfe09cEB84A2eb4287', //Main - fcfs - 10K - USDT

    // bsc: '0x6fae03D2FbBAf8821DC3248ca61cA239f60A9Bac', //Stage - fcfs - depositGoal: 1 - USDT
    // bsc: '0x69060bc1A054a3c60d2607aAE0D403748Ad0F48c', //Stage - sqrp-gated - depositGoal: 1 - USDT
    // bsc: '0x4eB0f912ba6AbB9C1036c733D2ac0730e6C72469', //Stage - white-list - depositGoal: 1 - USDT
    // bsc: '0xFd41de115a0317Fd0Dc7F102B9f6968e99fa269b', //Stage - sqrp-gated - depositGoal: 1 - USDT - 27 Apr - 30 Apr
    // bsc: '0x44c8f558A6EE0B5935C37F6836a51CC753f9B657', //Stage - sqrp-gated - depositGoal: 1 - USDT - 1 May - 3 May
    // bsc: '', //Prod
  },
};
