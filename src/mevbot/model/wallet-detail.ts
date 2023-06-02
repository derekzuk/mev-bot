export type WalletDetail = {
    publicAddress: string;
    privateKey: string;
    transaction: any;
}

function createWalletDetail(publicAddress: string, privateKey: string) {
    return {
        publicAddress: publicAddress,
        privateKey: privateKey,
        transaction: null
    }
}