class WalletDetails {
    publicAddress: string;
    privateKey: string;
    transaction: any
}

function createWalletDetails(a: string, pk: string) {
    var wd = new WalletDetails();
    wd.publicAddress = a;
    wd.privateKey = pk;
    wd.transaction = null;
    return wd;
}

export { WalletDetails, createWalletDetails }