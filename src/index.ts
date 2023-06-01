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
import { GWEI, ETHER, encodeSignedTransaction, getMintFunctionInputs } from "./util/EthGeneralUtil"
import { 
  sleep,
  isFlashbotsTransactionResponse,
  isRelayResponseError,
  matchFlashbotsTransaction,
  bigIntMax,
  bigIntMin
} from "./utils"
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
  INFURA_PROVIDER, 
  INFURA_PROVIDER_KEY,
  mintPriceOfSingleNFT,
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
  CHAIN_ID,
  web3,
  FLASHBOTS_ENDPOINT,
  CONTRACT_ADDRESS,
  existingSupplyFunction,
  publicMintEnabledFunction,
  CONTRACT_OWNER_ADDRESS,
  ENABLE_PUBLIC_MINT_SIGNATURE
} from "./variables"
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
} from "./wallets"
import {
  initialVariableSetup,
  etherscanApiInteractions,
  subscribeToMempoolTransactions,
  watchEachNewBlock
} from "./mev-functions"
require('dotenv').config() // lets us use the config in the .env file

// This app is based heavily on https://github.com/flashbots/searcher-minter
var bigInt = require("big-integer");
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const jQuery = require( "jquery" )( window );
const ethers = require('ethers');
const { encode } = require('rlp')
var HDWalletProvider = require("@truffle/hdwallet-provider");

async function main() {
  await initialVariableSetup()
  await etherscanApiInteractions();
  // initialSend(); // optional
  // TODO: does this need an await?
  subscribeToMempoolTransactions(); // This runs concurrently with watchEachNewBlock()
  // TODO: does this need an await?
  watchEachNewBlock(); // This runs concurrently with subscribeToMempoolTransactions()
}

main();
