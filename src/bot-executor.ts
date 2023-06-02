import * as _ from "lodash";
import {
  initialVariableSetup,
  etherscanApiInteractions,
  subscribeToMempoolTransactions,
  watchEachNewBlock
} from "./mevbot/mev-functions"
require('dotenv').config() // this lets us use the config in the .env file

// This application is based heavily on https://github.com/flashbots/searcher-minter
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const { encode } = require('rlp')

// This is the function that executes when we run the 'npm start' command
async function main() {
  await initialVariableSetup()
  await etherscanApiInteractions();

  // These functions may need an 'await'
  subscribeToMempoolTransactions(); // This runs concurrently with watchEachNewBlock()
  watchEachNewBlock(); // This runs concurrently with subscribeToMempoolTransactions()  
}

main();
