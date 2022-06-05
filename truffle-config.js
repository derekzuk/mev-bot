var HDWalletProvider = require("@truffle/hdwallet-provider");
require('dotenv').config() // lets us use the config in the .env file

module.exports = {
    networks: {
      development: {
        host: "127.0.0.1",
        port: 7545,
        network_id: "*" // Match any network id
      },
      goerli: {
        provider: () => new HDWalletProvider(process.env.WALLET_PRIVATE_KEY, process.env.INFURA_GOERLI_URL_99NA),
        network_id: 5,       
        gas: 5500000,        
        confirmations: 2,    // # of confs to wait between deployments. (default: 0)
        timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
        skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
      }
    },
    compilers: {
       solc: {
         version: "0.6.6"  // ex:  "0.4.20". (Default: Truffle's installed solc)
       }
    },
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
  