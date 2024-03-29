import { BigNumber } from "ethers";
import { TransactionResponse } from "@ethersproject/abstract-provider"
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { GWEI, getMintFunctionInputs } from "./util/eth-general-util"
import { ALT_CARTOONS_CONTRACT_OWNER } from './config/cartoons-config'
import { 
    bigIntMax,
    bigIntMin
  } from "./mev-function-utils"
import { 
    blocknum,
    setBlocknum,
    MIN_NONCE,
    MAX_NONCE,
    holyGrailTxSent,
    setHolyGrailTxSent,
    ContractObject,
    walletTransactionMap,
    gasOverridePrice,
    setGasOverridePrice,
    flashbotsMintBool,
    setFlashbotsMintBool,
    publicMintEnabled,
    setPublicMintEnabled,
    mintsPerWallet,
    totalSupply,
    setTotalSupply,
    initialSendGasPrice,
    maxSupply,
    maxGasVar,
    gasToAddToBlockAvg,
    mintEthValue,
    provider,
    abiDecoder,
    web3,
    FLASHBOTS_ENDPOINT,
    CONTRACT_ADDRESS,
    setExistingSupplyFunction,
    setPublicMintEnabledFunction,
    CONTRACT_OWNER_ADDRESS,
    ENABLE_PUBLIC_MINT_SIGNATURE
  } from "./vars/variables"
  import {
    wallet1,
    // wallet2,
    // wallet3,
    // wallet4,
    // wallet5,
    // wallet6,
    // wallet7,
    // wallet8,
    // wallet9,
    // wallet10,
    // wallet11,
    // wallet12,
    // wallet13,
    // wallet14,
    // wallet15,
    // wallet16,
    // wallet17,
    // wallet18,
    // wallet19,
    // wallet20,
  } from "./vars/wallets"
import { WalletTransactionDetail } from "./model/wallet-transaction";
  require('dotenv').config() // lets us use the config in the .env file

export async function initialVariableSetup() {
    const flashbotsProvider = await FlashbotsBundleProvider.create(provider, wallet1, FLASHBOTS_ENDPOINT) // TODO: use my personal wallet to build reputation?

    // Initial wallet population
    var baseMintTx
    // key refers to the wallet nonce
    for (let i = MIN_NONCE; i < MAX_NONCE; i++) {
      let walletTransaction: WalletTransactionDetail = {
        isMined: false,
        tx: baseMintTx,
        isSent: false
      }
      walletTransactionMap.set(i,walletTransaction)
    }
}

export async function etherscanApiInteractions() {
    // Extract the mint function from the given smart contract
    var mintFunctionInputs = await getMintFunctionInputs(ContractObject, CONTRACT_ADDRESS, provider)
    console.log("mintFunctionInputs: " + JSON.stringify(mintFunctionInputs))
    var finalMintFunctionInput
    if (mintFunctionInputs.length == 1) {
      finalMintFunctionInput = mintFunctionInputs[0]
    } else {
      // Run logic to pick the real public mint function
      mintFunctionInputs.forEach(mintFunc => {
        if (mintFunc.name.toLowerCase() == "mint" 
        || mintFunc.name.toLowerCase() == "buy" 
        || mintFunc.name.toLowerCase() == "purchase" 
        || mintFunc.name.toLowerCase() == "publicmint" 
        || mintFunc.name.toLowerCase() == "publicsale" 
        || mintFunc.name.toLowerCase() == "publicsalemint" 
        || mintFunc.name.toLowerCase() == "adopt" 
        || mintFunc.name.toLowerCase() == "publicadopt") {
          finalMintFunctionInput = mintFunc
        }
      })
    }
  
    console.log("finalMintFunctionInput: " + JSON.stringify(finalMintFunctionInput))
  
    // Create the mint transactions that will be sent and populate the walletTransactionMap
    try {
      for (let i = MIN_NONCE; i < MAX_NONCE; i++) {
        var mintFunctionName = finalMintFunctionInput.name
        
        if (finalMintFunctionInput.inputs !== undefined && finalMintFunctionInput.inputs !== null && finalMintFunctionInput.inputs.length == 1) {
          var isQuantity = (finalMintFunctionInput.inputs[0].type == "uint256" || finalMintFunctionInput.inputs[0].internalType == "uint256")
          if (isQuantity) {
            var mintFunctionName = finalMintFunctionInput.name
            var mintTransactionFromEtherscan = await ContractObject.populateTransaction[mintFunctionName](mintsPerWallet)
            mintTransactionFromEtherscan.from = wallet1.address
            mintTransactionFromEtherscan.value = mintEthValue // This is the ETH sent to the payable mint function in the contract
            mintTransactionFromEtherscan.nonce = i
            mintTransactionFromEtherscan.gasPrice = BigNumber.from(initialSendGasPrice)
            mintTransactionFromEtherscan.gasLimit = BigNumber.from(140000n)
            let walletTransaction: WalletTransactionDetail = {
              isMined: false,
              tx: mintTransactionFromEtherscan,
              isSent: false
            }
            walletTransactionMap.set(i, walletTransaction);
          }
        } else if ((finalMintFunctionInput.inputs !== undefined && finalMintFunctionInput.inputs !== null && finalMintFunctionInput.inputs.length == 2)) {
          // look for type address and type uint
          var quantityIndex = -1
          var toAddressIndex = -1
          for (let i = 0; i < 2; i++) {
            if (finalMintFunctionInput.inputs[i].type == "uint256" || finalMintFunctionInput.inputs[i].internalType == "uint256") {
              // this is presumably the quantity to mint
              quantityIndex = i
            } else if (finalMintFunctionInput.inputs[i].type == "address" || finalMintFunctionInput.inputs[i].internalType == "address") {
              // this is presumably the toAddress
              toAddressIndex = i
            }
          }
          if (quantityIndex > -1 && toAddressIndex > -1) {
            let mintTransactionFromEtherscan;
            if (quantityIndex == 0) {
              mintTransactionFromEtherscan = await ContractObject.populateTransaction[mintFunctionName](mintsPerWallet, wallet1.address)
            } else {
              mintTransactionFromEtherscan = await ContractObject.populateTransaction[mintFunctionName](wallet1.address, mintsPerWallet)
            }

            mintTransactionFromEtherscan.from = wallet1.address
            mintTransactionFromEtherscan.value = mintEthValue // This is the ETH sent to the payable mint function in the contract
            mintTransactionFromEtherscan.nonce = i            
            mintTransactionFromEtherscan.gasPrice = BigNumber.from(initialSendGasPrice)
            mintTransactionFromEtherscan.gasLimit = BigNumber.from(140000n)
            let walletTransaction: WalletTransactionDetail = {
              isMined: false,
              tx: mintTransactionFromEtherscan,
              isSent: false
            }
            walletTransactionMap.set(i, walletTransaction);            
          }
        }
      }
    } catch (e) {
      console.log(e)
    }
}

// As of now, this function is not needed, but it could be used circumstantially
export async function initialSend() {
    // Populate the publicMintEnabled variables. These are used to determine when we should send our initial mint transactions.
    if (publicMintEnabled == false) {
        try {
            setPublicMintEnabled(await ContractObject.isPublicMintActive())
            setPublicMintEnabledFunction(ContractObject.isPublicMintActive())
        } catch {
            console.log("not called isPublicMintActive()")
            try {
                setPublicMintEnabled(await ContractObject._isActive())
                setPublicMintEnabledFunction(ContractObject._isActive())
            } catch {
                console.log("not called _isActive()")
            }
        }
    }
    if (totalSupply == -1) {
        setTotalSupply(await ContractObject.totalSupply())
        setExistingSupplyFunction(ContractObject.totalSupply())
    }
        console.log("publicMintEnabed: " + publicMintEnabled)
        console.log("totalSupply: " + totalSupply)
    if (publicMintEnabled && (totalSupply < maxSupply - 50)) {
        // TODO: reconstruct walletLoopMap logic
        const walletLoopMap = new Map();
        walletLoopMap.forEach((valueArr, wallet) => {
            var walletNumber = valueArr[0]
            var txIsMined = valueArr[1]
            var tx = valueArr[2]
            var txSent = valueArr[3]
        
            var sentTx = wallet.sendTransaction(tx)
            console.log("tx sent for wallet " + walletNumber)
            walletLoopMap.set(wallet, [walletNumber, txIsMined, tx, true])
        })
    }
}

// You either need to know the specific mint time or have your own node to use this section of code
// Infura limits the number of requests you can make per day
export async function subscribeToMempoolTransactions() {
    const subscription = web3.eth.subscribe('pendingTransactions', function (error, result) {})
    .on("data", async function (transactionHash) {
        if (blocknum !== null && blocknum !== undefined) {
          try {
              web3.eth.getTransaction(transactionHash)
              .then(async function (transaction) {
                // Inspect the transaction, see if it is relevant, and send mint transactions if all conditions are met
                processMempoolTransaction(transaction);
            }); 
          } catch (e) {
            console.log("error: " + e)
          }
      }
    })
}

function processMempoolTransaction(transaction: any) {
  if (transaction !== null && transaction.hash !== null && transaction.hash !== undefined) {
    var from = transaction.from
    var to = transaction.to
    // look for the transaction that sets the public mint live from the contract owner                  
    if (to !== null && to !== undefined && from !== null && from !== undefined
      && transaction.to.toLowerCase().includes(CONTRACT_ADDRESS)
      && (from.toLowerCase().includes(CONTRACT_OWNER_ADDRESS) || from.toLowerCase().includes(ALT_CARTOONS_CONTRACT_OWNER))
      && transaction.input.toLowerCase().includes(ENABLE_PUBLIC_MINT_SIGNATURE)) { // publicMintEnabled signature
          console.log("isActive() tx detected!")

          // TODO: we could place logic here to extract details from this tx if we have time
          // and use it to populate the flashbotsMintBool var                      
          const decodedData = abiDecoder.decodeMethod(transaction.input);
          console.log("JSON.stringify(decodedData): " + JSON.stringify(decodedData))
          setFlashbotsMintBool(decodedData.params[0].value)
          console.log("flashbotsMintBool: " + flashbotsMintBool)
          
          // TODO: TypeError: Cannot mix BigInt and other types, use explicit conversions
          if (flashbotsMintBool && !holyGrailTxSent) {
            var holyGrailGasPrice       
            if (transaction.gasPrice !== null || transaction.gasPrice !== undefined) {
              holyGrailGasPrice = transaction.gasPrice
            } else {
              holyGrailGasPrice = transaction.maxFeePerGas
            }
            
              // // We test a flashbots bundle with the mint enabled function, and if it works then we assume its good and blast off mint transactions
              // const raw = encodeSignedTransaction(transaction, web3)
              // const wallet1tx = walletLoopMap.get(wallet1)[2]
              // const bundledTransactions = [
              //   {
              //     signedTransaction: raw // serialized signed transaction hex
              //   },
              //   {
              //     signer: wallet1,
              //     transaction: wallet1tx
              //   }
              // ];                        
              // const signedBundle = await flashbotsProvider.signBundle(bundledTransactions) // does it simulate when you sign?
              // const simulation = await flashbotsProvider.simulate(signedBundle, blocknum + 1 ) // TODO: skip simulation?
              // if ("error" in simulation || simulation.firstRevert !== undefined) {
              //   console.log(`Simulation Error, skipping`)
              //   console.log("simulation error: " + JSON.stringify(simulation))
              // } else {
              //   console.log("successful simulation. sending bundle");

                // SEND HOLY GRAIL TRANSACTIONS
                console.log("sending holy grail transactions")
                for (let i = MIN_NONCE; i < MAX_NONCE; i++) {
                  const hgTx = walletTransactionMap.get(i)[1]  
                  hgTx.gasPrice = holyGrailGasPrice
                  var sentTestTx = wallet1.sendTransaction(hgTx) 
                  console.log("sentTestTx: "+ JSON.stringify(sentTestTx));
                  let walletTransaction: WalletTransactionDetail = {
                    isMined: false,
                    tx: hgTx,
                    isSent: true
                  }
                  walletTransactionMap.set(i, walletTransaction)
                }
                setHolyGrailTxSent(true);
              // }
          }               
    }
  } else {
    // do nothing
  }
}

export async function watchEachNewBlock() {
  provider.on('block', async (blockNumber) => {
    // Set relevant variables (blockNum, gas), and extract transactions from the block
    const transactions: TransactionResponse[] = await processBlock(blockNumber)

    // Check if our mint transactions have been mined in
    await checkIfMintTransactionAreMined(transactions);

    // Sent mint transactions if the mint is enabled in the contract
    await sendMintTransactions();
  })
}

async function processBlock(blockNumber: any) {
  console.log("blockNumber: " + blockNumber)
  setBlocknum(blockNumber);
  const blockWithTransactions = await provider.getBlockWithTransactions(blockNumber)
  const transactions: TransactionResponse[] = blockWithTransactions.transactions

  // get gas price that made it into the current block
  const numberOfTransactions = await blockWithTransactions.transactions.length;
  console.log("numberOfTransactions in block: " + numberOfTransactions)
  // resubmission price tends to be relatively high
  const slicedGasPrice = blockWithTransactions.transactions.map(t => t.gasPrice.toNumber())
  .sort((n1,n2) => n1 - n2)
  .slice(20,numberOfTransactions-20)
  const sum = slicedGasPrice.reduce((a, b) => a + b, 0);
  const lowAvg = (sum / slicedGasPrice.length) || (GWEI * 100n);
  const truncated = Math.trunc(Number(lowAvg))
  setGasOverridePrice(BigInt(truncated) + gasToAddToBlockAvg)
  console.log("gasOverridePrice: " + gasOverridePrice)

  setPublicMintEnabled(await ContractObject.isPublicMintActive())
  console.log("publicMintEnabled: " + publicMintEnabled)

  return transactions;
}

async function checkIfMintTransactionAreMined(transactions: TransactionResponse[]) {
  function checkIfMintTransactionsMined() {
    return new Promise((resolve) => {
      transactions.map(function (t) {
        if (wallet1.address.toLowerCase().includes(t.from.toLowerCase())) {
          var txNonce = t.nonce
          var walletTransactionMapValues = walletTransactionMap.get(txNonce)
          if (walletTransactionMapValues !== null && walletTransactionMapValues !== undefined) {
            walletTransactionMapValues.isMined = true;
            walletTransactionMap.set(txNonce, walletTransactionMapValues)
            console.log("Mint mined in for txNonce " + txNonce)
          } else {
            console.log("nonce not found in walletTransactionMap: " + t.nonce)
          }
        }
      })
      resolve(true)
    });
  }

  // We wait for this check to run before triggering the sendMintTransactions() function
  await checkIfMintTransactionsMined()
    .then(response => {
  })
  .catch(error => {
      // Error
    console.log(error);
  });
}

async function sendMintTransactions() {
    if (publicMintEnabled) {
        // loop through each wallet and determine if we want to send a mint tx
        setTotalSupply(await ContractObject.totalSupply())
        console.log("totalSupply: " + totalSupply)
        for (let i = MIN_NONCE; i < MAX_NONCE; i++) {
          var walletTransaction = walletTransactionMap.get(i)
    
          if (!walletTransaction.isMined && holyGrailTxSent) {
            if (!walletTransaction.isSent && (totalSupply < maxSupply - 300) || ((BigNumber.from(walletTransaction.tx.gasPrice).lt(gasOverridePrice)) && (totalSupply < maxSupply - 50))) {
              console.log("Possibly sending tx for nonce " + i)                
              if (!walletTransaction.isSent) {
                const maxWillingGas = bigIntMin(gasOverridePrice, maxGasVar)
                const calculatedGas = bigIntMax(maxWillingGas, walletTransaction.tx.gasPrice) // RISK. if max gas is still not enough to get mined in
                walletTransaction.tx.gasPrice = BigNumber.from(calculatedGas)
              } else {
                const calculatedGas = bigIntMin(gasOverridePrice, maxGasVar) // RISK. if max gas is still not enough to get mined in
                walletTransaction.tx.gasPrice = BigNumber.from(calculatedGas)
              }                
              // tx.nonce = 0 // This bot assumes you are using fresh wallets
              console.log("tx to send: " + JSON.stringify(walletTransaction.tx))
              var sentTx = wallet1.sendTransaction(walletTransaction.tx)
              console.log("tx sent for nonce " + i + ". Details: " + JSON.stringify(sentTx))
              let newWalletTransaction: WalletTransactionDetail = {
                isMined: walletTransaction.isMined,
                tx: walletTransaction.tx,
                isSent: true
              }
              walletTransactionMap.set(i, newWalletTransaction)
            } else {
              console.log("tx.gasPrice.lt(gasOverridePrice): " + walletTransaction.tx.gasPrice.lt(gasOverridePrice));
              console.log("gas price too low or totalSupply too high to resend tx. gasOverride: " + BigNumber.from(gasOverridePrice) 
              + ", tx.gasPrice: " + BigNumber.from(walletTransaction.tx.gasPrice) 
              + ", totalSupply: " + totalSupply 
              + ", nonce: " + i)
            }
          } else {
            console.log("tx is mined or holy grail tx not sent for nonce " + i)
          }
        }
      } else {
        // public mint not enabled
      }
}