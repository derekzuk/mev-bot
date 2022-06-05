import { WalletDetails, createWalletDetails } from "./src/Objects/WalletDetails"

let allWalletDetails: WalletDetails[] = [];
allWalletDetails[0] = createWalletDetails("addy","pk");

export { allWalletDetails }