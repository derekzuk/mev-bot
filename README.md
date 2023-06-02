# MEV Bot (NFT Sniper)

This repository was originally based on a simple demo application of [Flashbots](https://docs.flashbots.net)(https://github.com/flashbots/searcher-minter), which allows arbitrary submission of a single transaction to Flashbots. This MEV bot could be adapted for many purposes, but in its current form it is used to snipe NFT drops.

# Executor Flow

The basic flow of this application is as follows:
1. `npm start` command triggers the main() function in bot-executor.ts
2. the main() function contains four functions. The following two functions set up the necessary variables and wallets:
- initialVariableSetup()
- etherscanApiInteractions()
3. The next two functions will run concurrently until the application is stopped. These will perform and track our mint transactions:
- subscribeToMempoolTransactions()
- watchEachNewBlock()

In **initialVariableSetup()**, we create the FlashbotsBundleProvider, and we populate the walletTransactionMap which will be used to track transactions.

In **etherscanApiInteractions()**, we first extract the mint function from the given smart contract. Next, we create the mint transactions that will be sent and populate the walletTransactionMap, where they will be kept track of.

The **subscribeToMempoolTransactions()** and **watchEachNewBlock()** functions run concurrently to send and resend mint transactions, as well as to keep track of the transaction statuses and chain monitoring.

The foundation of the **subscribeToMempoolTransactions()** function is the web3.eth.subscribe('pendingTransactions') function, which provides a stream of data coming from the ethereum mempool. With the stream, we do the following:
1. We first retrieve Transaction objects and then check whether they are relevant to us, meaning the transaction matches the contract address, contract owner address, and public mint signature we are looking for.
2. If all of these conditions match, we know the transaction to enable mints is in the mempool.
3. From here, we can do one of two things:
    1. Use Flashbots to bundle this transaction with our own set of mint transactions so that all of our mints are included in the block with the enable mint transaction, thus ensuring that all of our mints are processed. This requires we pay a tip/fee to the miner who includes our Flashbots bundle in the block.
    2. Alternatively, we send our own mint transactions using the same gas price as the enable mint transaction we found in the mempool. This will ideally result in our mint transactions being included directly after the enable mint transaction in the next block.

The **watchEachNewBlock()** function is our chain monitor. When each new block is added to the chain, we will look at it to determine the status of our mint transactions. This function performs the following steps:
1. Extract the TransactionResponse array from the block
2. Calculate the gas price we can potentially use if we resend transactions (gasOverridePrice)
3. Check if our mint transactions have been mined into the block. Set "mined" to true for that transaction if so.
4. If the mint function has been enabled in the contract we are watching, send all of our mint transactions that have not been mined into a block.

# How to run

1. Create a .env file in the base folder
2. Add Private Keys. ex: WALLET_PRIVATE_KEY="0x12390812803121293812389"
3. Run the following commands. truffle will populate your /build folder.
```shell
npm install
truffle compile
```
4. To run the application:
```shell
npm start
```
botExecutor.ts will execute
 
#
 If you want to deploy your contracts to goerli or mainnet, you can use truffle. Add a migrations file to the /migrations folder and run the following. Note that this uses config in truffle-config.js:
 ```
 truffle --network goerli migrate
 ```
