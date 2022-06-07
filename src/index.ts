import * as _ from "lodash";
import { BigNumber, Contract, providers, Wallet } from "ethers";
import {
  providers as Providers,
  utils as Utils,
  ContractFactory,
  PopulatedTransaction,
  ContractFunction
} from "ethers"
import { FlashbotsBundleProvider, FlashbotsTransaction, FlashbotsTransactionResponse, RelayResponseError } from "@flashbots/ethers-provider-bundle";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { CARTOONS_ADDRESS, CARTOONS_ABI, CARTOONS_CONTRACT_OWNER, ALT_CARTOONS_CONTRACT_OWNER } from './cartoons-config'
import { env } from "process";
require('dotenv').config() // lets us use the config in the .env file
// This app is based heavily on https://github.com/flashbots/searcher-minter
var bigInt = require("big-integer");
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const jQuery = require( "jquery" )( window );

const ethers = require('ethers');
const { encode } = require('rlp')
const abiDecoder = require('abi-decoder'); // https://github.com/ConsenSys/abi-decoder
const Web3 = require('web3')
var HDWalletProvider = require("@truffle/hdwallet-provider");

const CHAIN_ID = 1; // mainnet
// const CHAIN_ID = 5; // goerli
const provider = new providers.JsonRpcProvider("http://localhost:8545", CHAIN_ID) // geth node

const FLASHBOTS_ENDPOINT = "https://relay.flashbots.net/"; // mainnet
// const FLASHBOTS_ENDPOINT = "https://relay-goerli.flashbots.net"; // goerli

// subscribing to see pending transactions through Infura
// const webSocketProvider = new providers.WebSocketProvider(process.env.WSS_INFURA_GOERLI_URL_99NA)
// const web3 = new Web3(webSocketProvider)
// const web3 = new Web3(process.env.WSS_INFURA_GOERLI_URL_99NA) // goerli
// const web3 = new Web3(process.env.WSS_INFURA_MAINNET_URL) // mainnet
// const web3 = new Web3("http://localhost:8545") // mainnet
const web3 = new Web3.providers.WebsocketProvider('ws://127.0.0.1:3334'); // geth node
// const web3 = new Web3(webSocketProvider);

// ethers.js can use Bignumber.js class or the JavaScript-native bigint. I changed this to bigint as it is easier to deal with
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n

var nullArray = []

// ==============================================
// VARIABLES TO SET AHEAD OF TIME
// ==============================================
var INFURA_PROVIDER = process.env.NA_INFURA_PROVIDER_A_99NA
var INFURA_PROVIDER_KEY = process.env.NA_INFURA_PROVIDER_KEY_99NA
var mintPriceOfSingleNFT = BigNumber.from(GWEI * 70000000n)
var mintsPerWallet = 2
// use "-1" if total supply function is called totalSupply()
var totalSupply = -1
var initialSendGasPrice = GWEI * 100n
var maxSupply = 7777
var maxGasVar = BigNumber.from(GWEI * 555n)
var gasToAddToBlockAvg = GWEI * 50n // this value is added to the avg block gas that is ultimately used in your mint transactions
var mintEthValue = mintPriceOfSingleNFT.mul(mintsPerWallet) // IGNORE
// const provider = new providers.InfuraProvider(CHAIN_ID, [INFURA_PROVIDER, INFURA_PROVIDER_KEY]) // IGNORE
abiDecoder.addABI(CARTOONS_ABI);

// ==============================================
// VARIABLES TO SET LIVE (if abi provided)
// ==============================================
var CONTRACT_ADDRESS = CARTOONS_ADDRESS
var existingSupplyFunction
var publicMintEnabledFunction
// var CONTRACT_ABI = [] // copy-paste abi from etherscan if available, otherwise set to nullArray
// var contractObject // IGNORE
// if (CONTRACT_ABI == nullArray) {} else { contractObject = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)} // IGNORE

// ==============================================
// VARIABLES TO SET LIVE (if no abi)
// ==============================================
// var CONTRACT_ADDRESS = ""
// var CONTRACT_ABI = nullArray // IGNORE
// var successfulMintInputData = "0x15ce4ede0000000000000000000000000000000000000000000000000000000000000001" // Only needed if you cannot populate CONTRACT_ABI:
// var contractObject // IGNORE
// if (CONTRACT_ABI == nullArray) {} else {contractObject = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)} // IGNORE
// var mintFunction // IGNORE
// var publicMintEnabledFunction = true
// var existingSupplyFunction // IGNORE
// var contractAbiProvided = (CONTRACT_ABI !== nullArray) // IGNORE



var CONTRACT_OWNER_ADDRESS = CARTOONS_CONTRACT_OWNER // IGNORE. only matters if watching mempool
var ENABLE_PUBLIC_MINT_SIGNATURE = "0x2b707c71" // IGNORE. only matters if watching mempool



// WT_PRIVATE_KEY_1 refers to the private key set up in the .env file
// const testWallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)
const wallet1 = new Wallet(process.env.WT_PRIVATE_KEY_1, provider)
const wallet2 = new Wallet(process.env.WT_PRIVATE_KEY_2, provider)
const wallet3 = new Wallet(process.env.WT_PRIVATE_KEY_3, provider)
const wallet4 = new Wallet(process.env.WT_PRIVATE_KEY_4, provider)
const wallet5 = new Wallet(process.env.WT_PRIVATE_KEY_5, provider)
const wallet6 = new Wallet(process.env.WT_PRIVATE_KEY_6, provider)
const wallet7 = new Wallet(process.env.WT_PRIVATE_KEY_7, provider)
const wallet8 = new Wallet(process.env.WT_PRIVATE_KEY_8, provider)
const wallet9 = new Wallet(process.env.WT_PRIVATE_KEY_9, provider)
const wallet10 = new Wallet(process.env.WT_PRIVATE_KEY_10, provider)
const wallet11 = new Wallet(process.env.WT_PRIVATE_KEY_11, provider)
const wallet12 = new Wallet(process.env.WT_PRIVATE_KEY_12, provider)
const wallet13 = new Wallet(process.env.WT_PRIVATE_KEY_13, provider)
const wallet14 = new Wallet(process.env.WT_PRIVATE_KEY_14, provider)
const wallet15 = new Wallet(process.env.WT_PRIVATE_KEY_15, provider)
const wallet16 = new Wallet(process.env.WT_PRIVATE_KEY_16, provider)
const wallet17 = new Wallet(process.env.WT_PRIVATE_KEY_17, provider)
const wallet18 = new Wallet(process.env.WT_PRIVATE_KEY_18, provider)
const wallet19 = new Wallet(process.env.WT_PRIVATE_KEY_19, provider)
const wallet20 = new Wallet(process.env.WT_PRIVATE_KEY_20, provider)
// const wallet21 = new Wallet(process.env.WT_PRIVATE_KEY_21, provider)
// const wallet22 = new Wallet(process.env.WT_PRIVATE_KEY_22, provider)
// const wallet23 = new Wallet(process.env.WT_PRIVATE_KEY_23, provider)
// const wallet24 = new Wallet(process.env.WT_PRIVATE_KEY_24, provider)
// const wallet25 = new Wallet(process.env.WT_PRIVATE_KEY_25, provider)
// const wallet26 = new Wallet(process.env.WT_PRIVATE_KEY_26, provider)
// const wallet27 = new Wallet(process.env.WT_PRIVATE_KEY_27, provider)
// const wallet28 = new Wallet(process.env.WT_PRIVATE_KEY_28, provider)
// const wallet29 = new Wallet(process.env.WT_PRIVATE_KEY_29, provider)
// const wallet30 = new Wallet(process.env.WT_PRIVATE_KEY_30, provider)
// const wallet31 = new Wallet(process.env.WT_PRIVATE_KEY_31, provider)
// const wallet32 = new Wallet(process.env.WT_PRIVATE_KEY_32, provider)
// const wallet33 = new Wallet(process.env.WT_PRIVATE_KEY_33, provider)
// const wallet34 = new Wallet(process.env.WT_PRIVATE_KEY_34, provider)
// const wallet35 = new Wallet(process.env.WT_PRIVATE_KEY_35, provider)
// const wallet36 = new Wallet(process.env.WT_PRIVATE_KEY_36, provider)
// const wallet37 = new Wallet(process.env.WT_PRIVATE_KEY_37, provider)
// const wallet38 = new Wallet(process.env.WT_PRIVATE_KEY_38, provider)
// const wallet39 = new Wallet(process.env.WT_PRIVATE_KEY_39, provider)
// const wallet40 = new Wallet(process.env.WT_PRIVATE_KEY_40, provider)
// const wallet41 = new Wallet(process.env.WT_PRIVATE_KEY_41, provider)
// const wallet42 = new Wallet(process.env.WT_PRIVATE_KEY_42, provider)
// const wallet43 = new Wallet(process.env.WT_PRIVATE_KEY_43, provider)
// const wallet44 = new Wallet(process.env.WT_PRIVATE_KEY_44, provider)
// const wallet45 = new Wallet(process.env.WT_PRIVATE_KEY_45, provider)
// const wallet46 = new Wallet(process.env.WT_PRIVATE_KEY_46, provider)
// const wallet47 = new Wallet(process.env.WT_PRIVATE_KEY_47, provider)
// const wallet48 = new Wallet(process.env.WT_PRIVATE_KEY_48, provider)
// const wallet49 = new Wallet(process.env.WT_PRIVATE_KEY_49, provider)
// const wallet50 = new Wallet(process.env.WT_PRIVATE_KEY_50, provider)

var walletArr = [wallet1, 
  // wallet2, wallet3, wallet4, wallet5, 
  // wallet6, wallet7, wallet8, wallet9, wallet10,
  // wallet11, wallet12, wallet13, wallet14, wallet15, wallet16, wallet17, wallet18, wallet19, wallet20
]
var nonce3Addresses = [wallet1.address.toLowerCase(), 
  wallet2.address.toLowerCase()
]

// this appears to work async
let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// TODO: move to a Utils file
function isFlashbotsTransactionResponse(obj: any): obj is FlashbotsTransactionResponse {
  return obj.bundleTransactions !== undefined
}

function isRelayResponseError(obj: any): obj is RelayResponseError {
  return obj.error !== undefined
}

function matchFlashbotsTransaction(flashbotsTransaction: FlashbotsTransaction) {
  if (isFlashbotsTransactionResponse(flashbotsTransaction)) {      
      console.log("FlashbotsTransactionResponse. bundleTransactions.hash: " + flashbotsTransaction.bundleTransactions.map(x => x.hash))
  }
  if (isRelayResponseError(flashbotsTransaction)) {
    console.log("RelayResponseError")
    console.log("error.message: " + flashbotsTransaction.error.message)
    console.log("error.code: " + flashbotsTransaction.error.code)
  }
}

// Works. Used for flashbotting other peoples transactions.
function encodeSignedTransaction(tx) {
  if (!tx || !tx.v || !tx.r || !tx.s) {
    throw 'missing signed component(s)';
  }
  const type2 = (tx.type == 2);
  const params = [];
  // Type 2 marker or something
  if (type2) {
    if (tx.chainId == 1) { // mainnet
      params.push('0x01');
    } else if (tx.chainId == 5) { // goerli
      params.push('0x05');
    }
  }
  // Nonce
  params.push((!tx.nonce || tx.nonce == '0') ? '0x' :
    ethers.utils.hexlify(tx.nonce));
  // Gas price fields
  if (type2) {
    params.push(ethers.utils.parseEther(
      ethers.utils.formatEther(tx.maxPriorityFeePerGas))._hex);
    params.push(ethers.utils.parseEther(
      ethers.utils.formatEther(tx.maxFeePerGas))._hex);
  } else {
    params.push(web3.utils.numberToHex(parseInt(tx.gasPrice)));
  }
  // Gas limit
  params.push(ethers.utils.hexlify(tx.gas));
  // To
  params.push(tx.to);
  // Value
  params.push((!tx.value || tx.value == '0') ? '0x' :
      ethers.utils.hexlify(ethers.BigNumber.from(tx.value)));
  // Input
  params.push(tx.input);
  // Some random type 2 thing?
  if (type2) {
    params.push([]);
  }
  // Signature components
  if (type2) {
    params.push(tx.v == '0x0' ? '0x' : tx.v);
  } else {
    params.push(tx.v);
  }
  params.push(tx.r);
  params.push(tx.s);

  if (type2) {
    const res = '0x02' + encode(params).toString('hex');
    if (ethers.utils.keccak256(res) !== tx.hash) { throw new Error("serializing failed!"); }
    return res;    
  } else {
    const res = '0x' + encode(params).toString('hex');
    if (ethers.utils.keccak256(res) !== tx.hash) { throw new Error("serializing failed!"); }
    return res;
  }
}

const bigIntMax = (...args) => args.reduce((m, e) => e > m ? e : m); // calculate max
const bigIntMin = (...args) => args.reduce((m, e) => e < m ? e : m); // calculate min

// get probable mint function:
async function getMintFunctionInputs() {
  var returnVal = []
  return new Promise<any[]>(async resolve => {
    await jQuery.getJSON('https://api.etherscan.io/api?module=contract&action=getabi&address=' + "0xee29700134aab4f45b113e43e29ff06ce10687b7" + '&APIKey=' + process.env.ETHERSCAN_API_KEY, function (data) {
      var contractABI = nullArray
      contractABI = JSON.parse(data.result);
      // console.log("contractABI: " + JSON.stringify(contractABI));
      if (contractABI !== nullArray){
          ContractObject = new Contract(CONTRACT_ADDRESS, contractABI, provider)
          // look through object for features that indicate mint:
          contractABI.forEach(abiObject => {            
            try {
              if (abiObject.stateMutability == "payable" && abiObject.type == "function") {
                // Probably the mint function, although there may be multiple that we need to further filter:
                console.log("Potential mint function: " + JSON.stringify(abiObject))
                if (abiObject.inputs !== undefined && abiObject.inputs !== null && abiObject.inputs.length == 1) {
                  var isQuantity = (abiObject.inputs[0].type == "uint256" || abiObject.inputs[0].internalType == "uint256")
                  if (isQuantity) {
                    returnVal.push(abiObject)
                  }
                } else if ((abiObject.inputs !== undefined && abiObject.inputs !== null && abiObject.inputs.length == 2)) {
                  // look for type address and type uint
                  var quantityIndex = -1
                  var toAddressIndex = -1
                  for (let i = 0; i < 2; i++) {
                    if (abiObject.inputs[i].type == "uint256" || abiObject.inputs[i].internalType == "uint256") {
                      // this is presumably the quantity to mint
                      quantityIndex = i
                    } else if (abiObject.inputs[i].type == "address" || abiObject.inputs[i].internalType == "address") {
                      // this is presumably the toAddress
                      toAddressIndex = i
                    }
                  }
                  if (quantityIndex > -1 && toAddressIndex > -1) {
                    returnVal.push(abiObject)
                  }
                }
              }              
            } catch (e) {
              console.log("e: " + e);
            }
          })
          
      } else {
          console.log("Error" );
      }            
  });
  resolve(returnVal)
  })
}

// ====================================
// GLOBAL VARIABLES
// ====================================
var blocknum = 6457676
var MIN_NONCE = 3
var MAX_NONCE = 18
var holyGrailTxSent = false
var ContractObject = new Contract(CONTRACT_ADDRESS, CARTOONS_ABI, provider)
// nonce, [isMined, tx, isSent]
var walletTransactionMap: Map<Number, [Boolean, PopulatedTransaction, Boolean]> = new Map(); // we can use this if we only need to make transactions from a single wallet
var gasOverridePrice: bigint
var flashbotsMintBool = false
var publicMintEnabled = false // we will assume public mint is enabled if the contract abi cannot be provided

async function main() {  
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, wallet1, FLASHBOTS_ENDPOINT) // TODO: use my personal wallet?

    // Initial wallet population
    var baseMintTx
    // key refers to the wallet nonce
    for (let i = MIN_NONCE; i < MAX_NONCE; i++) {
      walletTransactionMap.set(i,[false, baseMintTx, false])
    }

  // ===========================================
  // ETHERSCAN API INTERACTIONS
  // ===========================================
  var mintFunctionInputs = await getMintFunctionInputs()
  console.log("mintFunctionInputs: " + JSON.stringify(mintFunctionInputs))
  var finalMintFunctionInput
  if (mintFunctionInputs.length == 1) {
    finalMintFunctionInput = mintFunctionInputs[0]
  } else {
    // run logic to pick the real public mint function
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
          walletTransactionMap.set(i, [false, mintTransactionFromEtherscan, false]);
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
          // TODO: populate mints for every wallet
          if (quantityIndex == 0) {
            var mintTransactionFromEtherscan = await ContractObject.populateTransaction[mintFunctionName](mintsPerWallet, wallet1.address)
            mintTransactionFromEtherscan.from = wallet1.address
            mintTransactionFromEtherscan.value = mintEthValue // This is the ETH sent to the payable mint function in the contract
            mintTransactionFromEtherscan.nonce = i            
            mintTransactionFromEtherscan.gasPrice = BigNumber.from(initialSendGasPrice)
            mintTransactionFromEtherscan.gasLimit = BigNumber.from(140000n)
            walletTransactionMap.set(i, [false, mintTransactionFromEtherscan, false]);
          } else {
            var mintTransactionFromEtherscan = await ContractObject.populateTransaction[mintFunctionName](wallet1.address, mintsPerWallet)
            mintTransactionFromEtherscan.from = wallet1.address
            mintTransactionFromEtherscan.value = mintEthValue // This is the ETH sent to the payable mint function in the contract
            mintTransactionFromEtherscan.nonce = i
            mintTransactionFromEtherscan.gasPrice = BigNumber.from(initialSendGasPrice)
            mintTransactionFromEtherscan.gasLimit = BigNumber.from(140000n)
            walletTransactionMap.set(i, [false, mintTransactionFromEtherscan, false]);
          }
        }
      }
    }
  } catch (e) {
    console.log(e)
  }

  console.log("nonce3: " + JSON.stringify(walletTransactionMap.get(MIN_NONCE)))
  console.log("4: " + JSON.stringify(walletTransactionMap.get(MAX_NONCE-1)))


  // // ====================================
  // // INITIAL SEND
  // // ====================================
  // if (publicMintEnabled == false) {
  //   try {
  //     publicMintEnabled = await ContractObject.isPublicMintActive()
  //     publicMintEnabledFunction = ContractObject.isPublicMintActive()
  //   } catch {
  //     console.log("not called isPublicMintActive()")
  //     try {
  //       publicMintEnabled = await ContractObject._isActive()
  //       publicMintEnabledFunction = ContractObject._isActive()
  //     } catch {
  //       console.log("not called _isActive()")
  //     }
  //   }
  // }
  // if (totalSupply == -1) {
  //   totalSupply = await ContractObject.totalSupply()
  //   existingSupplyFunction = ContractObject.totalSupply()
  // }
  // console.log("publicMintEnabed: " + publicMintEnabled)
  // console.log("totalSupply: " + totalSupply)
  // if (publicMintEnabled && (totalSupply < maxSupply - 50)) {
  //   walletLoopMap.forEach((valueArr, wallet) => {
  //     var walletNumber = valueArr[0]
  //     var txIsMined = valueArr[1]
  //     var tx = valueArr[2]
  //     var txSent = valueArr[3]

  //     // var sentTx = wallet.sendTransaction(tx)
  //     console.log("tx sent for wallet " + walletNumber)
  //     walletLoopMap.set(wallet, [walletNumber, txIsMined, tx, true])
  //   })
  // }

  // ====================================
  // SUBSCRIBE TO MEMPOOL TRANSACTIONS
  // ====================================
  // You either need to know the specific mint time or have your own node to use this section of code
  // Infura limits the number of requests you can make per day
  const subscription = web3.eth.subscribe('pendingTransactions', function (error, result) {})
  .on("data", async function (transactionHash) {
      if (blocknum !== null && blocknum !== undefined) {
        try {
            web3.eth.getTransaction(transactionHash)
            .then(async function (transaction) {
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
                      flashbotsMintBool = decodedData.params[0].value
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
                          // const raw = encodeSignedTransaction(transaction)
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
                              // var sentTestTx = wallet1.sendTransaction(hgTx) 
                              // console.log("sentTestTx: "+ JSON.stringify(sentTestTx));
                              walletTransactionMap.set(i, [false,hgTx,true])
                            }
                            holyGrailTxSent = true
                          // }
                      }               
                }
              } else {
                // do nothing
              }
          }); 
        } catch (e) {
          console.log("error: " + e)
        }
    }
  })


  // =================================
  //      WATCH EACH NEW BLOCK
  // =================================
  provider.on('block', async (blockNumber) => {
    console.log("blockNumber: " + blockNumber)
    blocknum = blockNumber
    const blockWithTransactions = await provider.getBlockWithTransactions(blockNumber)
    const transactions = blockWithTransactions.transactions

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
    gasOverridePrice = BigInt(truncated) + gasToAddToBlockAvg
    console.log("gasOverridePrice: " + gasOverridePrice)

    publicMintEnabled = await ContractObject.isPublicMintActive()
    console.log("publicMintEnabled: " + publicMintEnabled)

    // Check if our mint transactions have been mined in
    function callback_Original() {
      return new Promise((resolve) => {
        transactions.map(function (t) {
          if (wallet1.address.toLowerCase().includes(t.from.toLowerCase())) {
            var txNonce = t.nonce
            var walletTransactionMapValues = walletTransactionMap.get(txNonce)
            if (walletTransactionMapValues !== null && walletTransactionMapValues !== undefined) {
              walletTransactionMapValues[0] = true // set isMinedBoolean = true for this wallet
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
    await callback_Original()
    .then(response => {
    })
    .catch(error => {
    // Error
    console.log(error);
    });


    // ================================
    // SENDING MINT TRANSACTIONS
    // ================================
    if (publicMintEnabled) {
      // loop through each wallet and determine if we want to send a mint tx
      totalSupply = await ContractObject.totalSupply()
      console.log("totalSupply: " + totalSupply)
      for (let i = MIN_NONCE; i < MAX_NONCE; i++) {
        var walletTransactionMapValues = walletTransactionMap.get(i)
        var txIsMined = walletTransactionMapValues[0]
        var tx = walletTransactionMapValues[1]
        var txSent = walletTransactionMapValues[2]

        if (!txIsMined && holyGrailTxSent) {
          if (!txSent && (totalSupply < maxSupply - 300) || ((BigNumber.from(tx.gasPrice).lt(gasOverridePrice)) && (totalSupply < maxSupply - 50))) {
            console.log("Possibly sending tx for nonce " + i)                
            if (!txSent) {
              const maxWillingGas = bigIntMin(gasOverridePrice, maxGasVar)
              const calculatedGas = bigIntMax(maxWillingGas, tx.gasPrice) // RISK. if max gas is still not enough to get mined in
              tx.gasPrice = BigNumber.from(calculatedGas)
            } else {
              const calculatedGas = bigIntMin(gasOverridePrice, maxGasVar) // RISK. if max gas is still not enough to get mined in
              tx.gasPrice = BigNumber.from(calculatedGas)
            }                
            // tx.nonce = 0 // This bot assumes you are using fresh wallets
            console.log("tx to send: " + JSON.stringify(tx))
            // var sentTx = wallet1.sendTransaction(tx)
            // console.log("tx sent for nonce " + i)
            walletTransactionMap.set(i, [txIsMined, tx, true])
          } else {
            console.log("tx.gasPrice.lt(gasOverridePrice): " + tx.gasPrice.lt(gasOverridePrice));
            console.log("gas price too low or totalSupply too high to resend tx. gasOverride: " + BigNumber.from(gasOverridePrice) 
            + ", tx.gasPrice: " + BigNumber.from(tx.gasPrice) 
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
  })
}

main();
