function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

// function isFlashbotsTransactionResponse(obj: any): obj is FlashbotsTransactionResponse {
//   return obj.bundleTransactions !== undefined
// }

// function isRelayResponseError(obj: any): obj is RelayResponseError {
//   return obj.error !== undefined
// }

// function matchFlashbotsTransaction(flashbotsTransaction: FlashbotsTransaction) {
//   if (isFlashbotsTransactionResponse(flashbotsTransaction)) {      
//       console.log("FlashbotsTransactionResponse. bundleTransactions.hash: " + flashbotsTransaction.bundleTransactions.map(x => x.hash))
//   }
//   if (isRelayResponseError(flashbotsTransaction)) {
//     console.log("RelayResponseError")
//     console.log("error.message: " + flashbotsTransaction.error.message)
//     console.log("error.code: " + flashbotsTransaction.error.code)
//   }
// }

module.exports={sleep}