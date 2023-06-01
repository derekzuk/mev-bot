import { FlashbotsBundleProvider, FlashbotsTransaction, FlashbotsTransactionResponse, RelayResponseError } from "@flashbots/ethers-provider-bundle";

// this appears to work async
export function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

export function isFlashbotsTransactionResponse(obj: any): obj is FlashbotsTransactionResponse {
  return obj.bundleTransactions !== undefined
}

export function isRelayResponseError(obj: any): obj is RelayResponseError {
  return obj.error !== undefined
}

export function matchFlashbotsTransaction(flashbotsTransaction: FlashbotsTransaction) {
  if (isFlashbotsTransactionResponse(flashbotsTransaction)) {      
      console.log("FlashbotsTransactionResponse. bundleTransactions.hash: " + flashbotsTransaction.bundleTransactions.map(x => x.hash))
  }
  if (isRelayResponseError(flashbotsTransaction)) {
    console.log("RelayResponseError")
    console.log("error.message: " + flashbotsTransaction.error.message)
    console.log("error.code: " + flashbotsTransaction.error.code)
  }
}

export const bigIntMax = (...args) => args.reduce((m, e) => e > m ? e : m); // calculate max
export const bigIntMin = (...args) => args.reduce((m, e) => e < m ? e : m); // calculate min