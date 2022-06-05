# Flashbots searcher-minter

This repository is based on a very simple demo application of [Flashbots](https://docs.flashbots.net), which allows arbitrary submission of a single transaction to Flashbots. This could be used for many simple purposes, but in the demonstration, the goal was to mint an NFT.

# How to run

1. Create a .env file in the base folder \
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
index.ts will execute
 
#
 If you want to deploy your contracts to goerli or mainnet, you can use truffle. Add a migrations file to the /migrations folder and run the following. Note that this uses config in truffle-config.js:
 ```
 truffle --network goerli migrate
 ```
