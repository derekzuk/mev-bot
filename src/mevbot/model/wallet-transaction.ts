import { PopulatedTransaction  } from "ethers"

export type WalletTransactionDetail = {
    isMined: boolean;
    tx: PopulatedTransaction;
    isSent: boolean;
};