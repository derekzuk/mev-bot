import * as _ from "lodash";
import { BigNumber, Contract, providers, Wallet } from "ethers";
import {
  providers as Providers,
  utils as Utils,
  ContractFactory
} from "ethers"
import { FlashbotsBundleProvider, FlashbotsTransaction, FlashbotsTransactionResponse, RelayResponseError } from "@flashbots/ethers-provider-bundle";
import { QUICKSWAP_ADDRESS, QUICKSWAP_ABI } from './quickswap-config'
import { monitorEventLoopDelay } from "perf_hooks";
import { personalSign } from "@metamask/eth-sig-util";
import { textChangeRangeNewSpan } from "typescript";
import { solidityKeccak256 } from "ethers/lib/utils";
import { Key } from "selenium-webdriver"
import { sleep } from "./utils"
import { WalletDetails, createWalletDetails } from "./Objects/WalletDetails"
import { allWalletDetails } from "../wallet-config" // a way to loop through wallets and transactions
require('dotenv').config() // lets us use the config in the .env file
// This app is based heavily on https://github.com/flashbots/searcher-minter

// https://nodemailer.com/usage/using-gmail/
// var nodemailer = require('nodemailer');
// var transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'derekzuk@gmail.com',
//     pass: 'sucnlqywhtdnjjql'
//   }
// });
// var mailOptions = {
//   from: 'derekzuk@gmail.com',
//   to: 'dkuz008@gmail.com',
//   subject: 'Sending Email using Node.js',
//   text: 'That was easy!'
// };
// transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });


const ethers = require('ethers');
const { encode } = require('rlp')
const abiDecoder = require('abi-decoder'); // https://github.com/ConsenSys/abi-decoder
const Web3 = require('web3')
var HDWalletProvider = require("@truffle/hdwallet-provider");

// const CHAIN_ID = 1; // mainnet
const CHAIN_ID = 5; // goerli
const provider = new providers.InfuraProvider(CHAIN_ID, [process.env.INFURA_PROVIDER_A_99NA,process.env.INFURA_PROVIDER_KEY_99NA])

const FLASHBOTS_ENDPOINT = "https://relay-goerli.flashbots.net";
// const FLASHBOTS_ENDPOINT = "https://rpc.flashbots.net"; // mainnet
// const FLASHBOTS_ENDPOINT = "https://relay.flashbots.net"; // <--- use this to send bundles?

// Using ethers.js - the example below uses a mnemonic ethers wallet documentation
// let mnemonic = "";
// let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
// console.log("pk: " + mnemonicWallet.privateKey);

if (process.env.WALLET_PRIVATE_KEY === undefined) {
  console.error("Please provide WALLET_PRIVATE_KEY env")
  process.exit(1)
}

// subscribing to see pending transactions through Infura
// const webSocketProvider = new providers.WebSocketProvider(process.env.WSS_INFURA_GOERLI_URL_99NA)
// const web3 = new Web3(process.env.WSS_INFURA_GOERLI_URL_99NA)
const web3 = new Web3(process.env.WSS_INFURA_MAINNET_URL) // mainnet
// const webSocketProvider = new Web3.providers.WebsocketProvider('ws://127.0.0.1:8546'); geth node
// const web3Ws = new Web3(webSocketProvider);

//bloxroute (transactions reach mempool faster)
// https://docs.bloxroute.com/gateway/gateway-installation

// aka executorWallet
const wallet1 = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)
// const wallet7 = new Wallet(process.env.WALLET_PRIVATE_KEY7, provider)
// const mmWallet1 = new Wallet(process.env.MM_WALLET_PK_1, provider)

// ethers.js can use Bignumber.js class OR the JavaScript-native bigint. I changed this to bigint as it is MUCH easier to deal with
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n

// this appears to work async
let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const quickswapContract = new Contract(QUICKSWAP_ADDRESS, QUICKSWAP_ABI, provider)
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, wallet1, FLASHBOTS_ENDPOINT)

  // Example of a quickswap transaction:
  abiDecoder.addABI(QUICKSWAP_ABI);  
  const testData = "0x7ff36ab500000000000000000000000000000000000000000000000000000000711f4b050000000000000000000000000000000000000000000000000000000000000080000000000000000000000000690c7d43ad5d328244c0216d0b6f7959d031bd6800000000000000000000000000000000000000000000000000000000c416c4a300000000000000000000000000000000000000000000000000000000000000020000000000000000000000000d500b1d8e8ef31e21c99d1db9a6444d3adf1270000000000000000000000000c2132d05d31c914a87c6611c10748aeb04b58e8f";
  const decodedData = abiDecoder.decodeMethod(testData);
  console.log("JSON.stringify(decodedData): " + JSON.stringify(decodedData))

  // amount out, path (address[]), to (address), deadline (uint256)
  // ["0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270","0xD485025A90854D0ABf3ce0B2744640840becA24C"] WMATIC and MILK
  var swapTx = await quickswapContract.populateTransaction.swapExactETHForTokens(
    100000000000000000n, // MILK token. TODO: remember to check decimals
    ["0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270","0xD485025A90854D0ABf3ce0B2744640840becA24C"],
    wallet1.address,
    3289890555n // (Feb-15-2022 05:04:55 PM +UTC), these appear to be units of seconds
    )
  swapTx.value = BigNumber.from(GWEI * 500000n);
  swapTx.nonce = 151 // TODO: confirm
  swapTx.gasPrice = BigNumber.from(GWEI * 5n);
  swapTx.gasLimit = BigNumber.from(150000);   


  // GLOBAL VARS
  var flashbotsSimulated = false;
  var fbRequests = 0;
  var blockTran1Detected
  var t1IsSent = false;
  var sentTransaction1  
  var tran1IsMined = false
  var t1SaltAndSigDefined = false;
  var t1salt
  var t1signature
  var blocknum
  var currentPetId
  var gasOverridePrice: bigint
  var workingSalt
  var workingSignature
  var firstMintGas = GWEI * 800n;
  var maxGas = GWEI * 6000n; // ~ 1 ETH in transaction fees
  var resendMaxGas = GWEI * 10000n;
  const bigIntMax = (...args) => args.reduce((m, e) => e > m ? e : m); // calculate max
  const bigIntMin = (...args) => args.reduce((m, e) => e < m ? e : m); // calculate min
  // ====================================
  // SUBSCRIBE TO MEMPOOL TRANSACTIONS
  // ====================================
  // const subscription = web3.subscribe('pendingTransactions', function (error, result) {})
  // .on("data", async function (transactionHash) {
  //     // this won't do anything until the transaction has been mined
  //     // https://stackoverflow.com/questions/67263301/gettransaction-vs-gettransactionreceipt

  //     // https://web3js.readthedocs.io/en/v1.2.0/web3-eth.html#gettransaction
  //     // https://ethereum.stackexchange.com/questions/111528/decode-input-parameter-without-abi      
  //     // TODO: stop trying to submit transactions each block after you successfully get them off
  //     // Retry submissions with increased gas until you see them all go through?
  //     if (blocknum !== null && blocknum !== undefined) {        
  //       try {
  //           web3.eth.getTransaction(transactionHash)
  //           .then(async function (transaction) {
  //             if (transaction !== null && transaction.hash !== null && transaction.hash !== undefined) {
  //               // console.log("transaction.hash: " + transaction.hash)              

  //               // console.log(getRawTransaction(transaction))
  //               // condition to attempt frontrun
  //               if (!flashbotsSimulated && fbRequests < 20 
  //                 && String(transaction.input).includes(String("0x5ae401dc"))
  //                 && String(transaction.input).includes(String("d87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c"))) { // USDC
  //                   console.log("frontrun opportunity detected")
  //                   console.log("transaction.hash: " + transaction.hash);
  //                   console.log("transaction.input: " + transaction.input);


  //                   // function balanceOf(address tokenOwner) public view returns (uint balance) {
  //                   //   return balances[tokenOwner];
  //                   // }


  //                   var senderAddress = transaction.from.substring(2);
  //                   console.log("senderAddress: " + senderAddress);
  //                   const newInput = transaction.input.replaceAll(senderAddress.toLowerCase(),String(wallet1.address).toLowerCase());
  //                   console.log("newInput: " + newInput);
  //                   transaction.from = wallet1.address
  //                   var transaction2 = {
  //                     from: wallet1.address,
  //                     to: transaction.to,
  //                     nonce: 77,
  //                     data: newInput,
  //                     gasPrice: BigNumber.from(GWEI * 500n),
  //                     gasLimit: 200000
  //                   }
  //                   // transaction2.from = wallet1.address
  //                   // transaction2.to = transaction.to
  //                   // transaction2.data = transaction.input
  //                   // transaction2.type = 2 // ?
  //                   // transaction2.value = transaction.value // ?
  //                   // transaction2.gasPrice = transaction.gasPrice


  //                   // const resendT1Transaction = await coolpetsContract.populateTransaction.publicAdopt(22, sigaaa);
  //                   // resendT1Transaction.value = BigNumber.from(GWEI * 500000n); // This is the ETH sent to the payable mint function in the contract
  //                   // // resendT1Transaction.nonce = 159 // TODO: confirm
  //                   // resendT1Transaction.maxPriorityFeePerGas = BigNumber.from(GWEI * 4n); // TODO: gas recalculation
  //                   // resendT1Transaction.maxFeePerGas = BigNumber.from(GWEI * 4n);
  //                   // resendT1Transaction.gasLimit = BigNumber.from(150000);
  //                   // console.log("resendT1Transaction.data: " + resendT1Transaction.data);
  //                   // var resentT1Transaction = await wallet1.sendTransaction(resendT1Transaction) 
  //                   // console.log("initial send: "+ resentT1Transaction.hash);
  //                   // sentTransaction1 = resentT1Transaction;

  //                   const raw = encodeSignedTransaction(transaction)
  //                   console.log("raw: " + raw)
  //                   const bundledTransactions = [
  //                     {
  //                       signer: wallet1,
  //                       transaction: transaction2
  //                     },
  //                     {
  //                       signedTransaction: raw // serialized signed transaction hex
  //                     }
  //                   ];
  //                   try {
  //                     const signedBundle = await flashbotsProvider.signBundle(bundledTransactions) // does it simulate when you sign?
  //                     flashbotsProvider.getBalance
  //                     const simulation = await flashbotsProvider.simulate(signedBundle, blocknum + 1 )                    
  //                     const s = JSON.stringify(simulation)
  //                     fbRequests += 2;
  //                     // if ("error" in simulation || simulation.firstRevert !== undefined || s.includes("error")) {
  //                     if ("error" in simulation || simulation.firstRevert !== undefined) {
  //                       console.log(`Simulation Error, skipping`)
  //                       console.log("simulation error: " + JSON.stringify(simulation))
  //                     } else {
  //                       console.log("successful simulation");
  //                       console.log("simulation: " + JSON.stringify(simulation));
  //                       // flashbotsSimulated = true;
  //                       // send it with higher gas? send it to flashbots?
  //                       // var resentTransaction = await wallet1.sendTransaction(transaction) 
  //                       // console.log("resentTransaction: " + resentTransaction);
  
  //                       // flashbots resend:
  //                       console.log(`Submitting frontrun transaction: ${transaction.gasPrice} GWEI`)
  //                       const bundlePromises =  _.map([blocknum + 1, blocknum + 2], targetBlockNumber =>
  //                         flashbotsProvider.sendRawBundle(
  //                           signedBundle,
  //                           targetBlockNumber
  //                         ))
  //                       // const res: FlashbotsTransaction[] = await Promise.all(bundlePromises)
  //                       // // Log response type and some data
  //                       // res.map(x => matchFlashbotsTransaction(x));
  //                     }
  //                   } catch (e) {
  //                     console.log("error signing blundle: " + e)
  //                   }
  //               }
  //             } else {
  //               // do nothing
  //             }
  //         }); 
  //       } catch (e) {
  //         console.log("error: " + e)
  //       }
  //   }
  // })

  // =================================  
  //      WATCH EACH NEW BLOCK
  // =================================
  provider.on('block', async (blockNumber) => {
    console.log("block number: " + blockNumber)
    blocknum = blockNumber  
  })
}

main();