import { BigNumber, Contract, providers } from "ethers";
import {
    PopulatedTransaction  } from "ethers"
import { CARTOONS_ADDRESS, CARTOONS_ABI, CARTOONS_CONTRACT_OWNER } from './cartoons-config'
import { GWEI } from "./util/EthGeneralUtil"
export const abiDecoder = require('abi-decoder'); // https://github.com/ConsenSys/abi-decoder
export const Web3 = require('web3')
require('dotenv').config() // lets us use the config in the .env file

// ==============================================
// Environment specific variables
// ==============================================
export let CHAIN_ID;
export let web3;
export let FLASHBOTS_ENDPOINT;
if (process.env.ENVIRONMENT == "mainnet") {
  CHAIN_ID = 1;
  web3 = new Web3(process.env.WSS_INFURA_MAINNET_URL);
  FLASHBOTS_ENDPOINT = "https://relay.flashbots.net/";
} else if (process.env.ENVIRONMENT == "goerli") {
  CHAIN_ID = 5;
  web3 = new Web3(process.env.WSS_INFURA_GOERLI_URL_99NA);
  FLASHBOTS_ENDPOINT = "https://relay-goerli.flashbots.net";
}
// const provider = new providers.JsonRpcProvider("http://localhost:8545", CHAIN_ID) // geth node
// const web3 = new Web3("http://localhost:8545") // mainnet
// const web3 = new Web3.providers.WebsocketProvider('ws://127.0.0.1:3334'); // geth node

// ==============================================
// VARIABLES TO SET AHEAD OF TIME
// ==============================================
export const INFURA_PROVIDER = process.env.NA_INFURA_PROVIDER_A_99NA
export const INFURA_PROVIDER_KEY = process.env.NA_INFURA_PROVIDER_KEY_99NA
export const mintPriceOfSingleNFT = BigNumber.from(GWEI * 70000000n)
export const mintsPerWallet = 2
// use "-1" if total supply function is called totalSupply()
export let totalSupply = -1
export function setTotalSupply(value) {
    totalSupply = value;
}
export const initialSendGasPrice = GWEI * 100n
export const maxSupply = 7777
export const maxGasVar = BigNumber.from(GWEI * 555n)
export const gasToAddToBlockAvg = GWEI * 50n // this value is added to the avg block gas that is ultimately used in your mint transactions
export const mintEthValue = mintPriceOfSingleNFT.mul(mintsPerWallet) // IGNORE
export const provider = new providers.InfuraProvider(CHAIN_ID, [INFURA_PROVIDER, INFURA_PROVIDER_KEY]) // IGNORE
abiDecoder.addABI(CARTOONS_ABI);

// ==============================================
// VARIABLES TO SET LIVE (if abi provided)
// ==============================================
export let CONTRACT_ADDRESS = CARTOONS_ADDRESS
export let existingSupplyFunction
export function setExistingSupplyFunction(value) {
    existingSupplyFunction = value;
}
export let publicMintEnabledFunction
export function setPublicMintEnabledFunction(value) {
    publicMintEnabledFunction = value;
}
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

export let CONTRACT_OWNER_ADDRESS = CARTOONS_CONTRACT_OWNER // IGNORE. only matters if watching mempool
export let ENABLE_PUBLIC_MINT_SIGNATURE = "0x2b707c71" // IGNORE. only matters if watching mempool

// ====================================
// GLOBAL VARIABLES
// ====================================
export let blocknum = 6457676
export function setBlocknum(value) {
    blocknum = value;
}
export let MIN_NONCE = 3
export let MAX_NONCE = 18
export let holyGrailTxSent = false
export function setHolyGrailTxSent(value) {
    holyGrailTxSent = value;
}
export let ContractObject = new Contract(CONTRACT_ADDRESS, CARTOONS_ABI, provider)
// nonce, [isMined, tx, isSent]
export let walletTransactionMap: Map<Number, [Boolean, PopulatedTransaction, Boolean]> = new Map(); // we can use this if we only need to make transactions from a single wallet
export let gasOverridePrice: bigint
export function setGasOverridePrice(value) {
    gasOverridePrice = value;
}
export let flashbotsMintBool = false
export function setFlashbotsMintBool(value) {
    flashbotsMintBool = value;
}
export let publicMintEnabled = false // we will assume public mint is enabled if the contract abi cannot be provided
export function setPublicMintEnabled(value) {
    publicMintEnabled = value;
}