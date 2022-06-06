import * as _ from "lodash";
import { BigNumber, Contract, providers, Wallet } from "ethers";
import {
  providers as Providers,
  utils as Utils,
  ContractFactory
} from "ethers"
import { FlashbotsBundleProvider, FlashbotsTransaction, FlashbotsTransactionResponse, RelayResponseError } from "@flashbots/ethers-provider-bundle";
import { QUICKSWAP_ADDRESS, QUICKSWAP_ABI } from './quickswap-config'
import { MILADY_ABI, MILADY_ADDRESS, TOADZDICKBUTTS_ABI, TOADZDICKBUTTS_ADDRESS } from './ape-config'
import { monitorEventLoopDelay } from "perf_hooks";
import { personalSign } from "@metamask/eth-sig-util";
import { textChangeRangeNewSpan } from "typescript";
import { solidityKeccak256 } from "ethers/lib/utils";
import { Key } from "selenium-webdriver"
import { sleep } from "./utils"
import { WalletDetails, createWalletDetails } from "./Objects/WalletDetails"
import { WatchedAddress, createWatchedAddress } from "./Objects/WatchedAddress"
import { allWalletDetails } from "../wallet-config" // a way to loop through wallets and transactions
import { Address } from "cluster";
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const jQuery = require( "jquery" )( window );
require('dotenv').config() // lets us use the config in the .env file
// This app is based heavily on https://github.com/flashbots/searcher-minter

// https://nodemailer.com/usage/using-gmail/
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'derekzuk@gmail.com',
    pass: 'sucnlqywhtdnjjql'
  }
});


const ethers = require('ethers');
const { encode } = require('rlp')
const abiDecoder = require('abi-decoder'); // https://github.com/ConsenSys/abi-decoder
const Web3 = require('web3')
var HDWalletProvider = require("@truffle/hdwallet-provider");

const CHAIN_ID = 1; // mainnet
// const CHAIN_ID = 5; // goerli
const provider = new providers.InfuraProvider(CHAIN_ID, [process.env.NA_INFURA_PROVIDER_A_99NA,process.env.NA_INFURA_PROVIDER_KEY_99NA])

// subscribing to see pending transactions through Infura
// const webSocketProvider = new providers.WebSocketProvider(process.env.WSS_INFURA_GOERLI_URL_99NA)
// const web3 = new Web3(process.env.WSS_INFURA_GOERLI_URL_99NA)
const web3 = new Web3(process.env.WSS_INFURA_MAINNET_URL) // mainnet
// const webSocketProvider = new Web3.providers.WebsocketProvider('ws://127.0.0.1:8546'); geth node
// const web3Ws = new Web3(webSocketProvider);

// aka executorWallet
const wallet1 = new Wallet(process.env.WALLET_PRIVATE_KEY, provider)

// ethers.js can use Bignumber.js class OR the JavaScript-native bigint. I changed this to bigint as it is MUCH easier to deal with
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n

var nullArray = []

// this appears to work async
let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  //   // Check if our mint transactions have been mined in
  //   function callback_Original() {
  //     return new Promise((resolve) => {
  //       transactions.map(function (t) {
  //         if (walletAddressesFromMap.includes(t.from.toLowerCase())) {                        
  //           var wallet = walletAddressToWalletMap.get(t.from.toLowerCase())
  //           var walletLoopValues = walletLoopMap.get(wallet)
  //           walletLoopValues[1] = true // set isMinedBoolean = true for this wallet
  //           walletLoopMap.set(wallet, walletLoopValues)
  //           console.log("Mint mined in for wallet " + walletLoopValues[0])
  //         }
  //       })
  //       resolve(true)
  //     });
  //   }
  //   await callback_Original()
  //   .then(response => {
      
  //   })
  //   .catch(error => {
  //   // Error
  //   console.log(error);
  //   });

async function detectPublicMint(contractAddress: string, data: string, from: string) {
  return new Promise<Boolean>(resolve => {
    try {
      jQuery.getJSON('https://api.etherscan.io/api?module=contract&action=getabi&address=' + contractAddress + '&APIKey=21DHGMJ8Z9JRFRBBWBWJKZ2ASMWGCPZXQF', function (data) {
      var contractABI = nullArray
      if (data.status !== "1") {
        console.log("data.status !== 1")
        resolve(false); // shoudl be false. "true" just for testing
        return false
      }
      contractABI = JSON.parse(data.result);
      // console.log("contractABI: " + JSON.stringify(contractABI));
      if (contractABI !== nullArray){
          var ContractObject = new Contract(contractAddress, contractABI, provider)
          // look through object for features that indicate mint:
          contractABI.forEach(abiObject => {
            try {
              if (abiObject.stateMutability == "payable" && abiObject.type == "function") {
                // Probably the mint function, although there may be multiple that we need to further filter:
                console.log("Potential mint function: " + JSON.stringify(abiObject))
                if (abiObject.inputs !== undefined && abiObject.inputs !== null && abiObject.inputs.length == 1) {
                  var isQuantity = (abiObject.inputs[0].type == "uint256" || abiObject.inputs[0].internalType == "uint256")
                  if (isQuantity) {
                    console.log("mint function found!")
                    timesSeen.set(contractAddress, [1, [from]]);
                    resolve(true);
                    return true
                  } else {
                    resolve(false)
                    return false
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
                    console.log("mint function found! 2 args")
                    resolve(true)
                    timesSeen.set(contractAddress, [1, [from]]);
                    return true
                  } else {
                    resolve(false)
                    return false
                  }
                } else {
                  resolve(false);
                  return false
                }
              } else {
                resolve(false);
                return false
              }          
            } catch (e) {
              console.log("e: " + e);
              resolve(false);
              return false
            }
          })        
      } else {
          console.log("Error" );
          resolve(false);
          return false
      }            
    });
  } catch (e) {
    console.log("e: " + e);
    resolve(false);
    return false
  }
  })
}

// GLOBAL VARIABLES
var timesSeen = new Map();

async function main() {  

  var watchedAddressArr = [createWatchedAddress("0x71e7b94490837ccaf45f9f6c7c20a3e17bbeb7d3","bonzi.eth (mw recommended)"),
  createWatchedAddress("0x88923378021bea85f9b09ce571a309e12c7d2262","8892.eth"),
  createWatchedAddress("0x398d282487b44b6e53Ce0AebcA3CB60C3B6325E9","GCR"),
  createWatchedAddress("0x886478d3cf9581b624cb35b5446693fc8a58b787","zeneca.eth (terraforms buyer)"),
  createWatchedAddress("0xc142995F05436c91Bba172B7d17522A301323236","dinovault.eth (terraforms buyer)"),
  createWatchedAddress("0x8A5a244B08678a7DE0605494fe4E76C552935d38","mnemonic.eth (terraforms buyer)"),
  createWatchedAddress("0xb59825AfBba29d5257F877A8a64265c3A10fC2Ab","hot.maffs.eth (terraforms buyer)"),
  createWatchedAddress("0xC665A60F22dDa926B920DEB8FFAC0EF9D8a17460","vault.mikegee.eth (terraforms buyer)"),
  createWatchedAddress("0x9634445e293A87aB77Ca3Cf5B43da94AaBc544B6","watermellonemojis.eth (terraforms buyer)"),
  createWatchedAddress("0xB32B4350C25141e779D392C1DBe857b62b60B4c9","flur.eth (terraforms buyer)"),
  createWatchedAddress("0xfC576E579AACc0E122f1Ac84E3F7f64b2ea31383","jmstn.eth (terraforms buyer)"),
  createWatchedAddress("0x2C0a5Ed29d463f6c6180fF4DAdAb248158b6DA5B","uron.eth (terraforms buyer)"),
  createWatchedAddress("0x8E018350D31c897ce2f1070fd40855d31C849465","popularvault.eth (terraforms buyer)"),
  createWatchedAddress("0x03f0e71ac43276FCF0b327b1AbE8CDF5974aeCC1","ethharing.eth (terraforms buyer)"),
  createWatchedAddress("0x012E168ACb9fdc90a4ED9fd6cA2834D9bF5b579e","chanes.eth (terraforms buyer)"),
  createWatchedAddress("0x42dE10A720c59eD8dcC6E55d5E61e03B5AD70905","izabel.eth (terraforms buyer)"),
  createWatchedAddress("0x6Afdf83501Af209D2455e49eD9179c209852A701","kutoa.eth (terraforms buyer)"),
  createWatchedAddress("0xD72bb0961368F1A5c566E0ac3AFCA62afFa20F14","pleurer.eth (terraforms buyer)"),
  createWatchedAddress("0xBD33B53B6394D72145250900D3c64518679591D8","fez.eth (terraforms buyer)"),
  createWatchedAddress("0x55Cf34223929A9D893C1EA402735a3a6FC6e5F74","cryptopunk237.eth (terraforms buyer)"),
  createWatchedAddress("0x9aF256B6A43d8A2B7c427DF049D2d32B700B9998","pathogen.eth (terraforms buyer)"),
  createWatchedAddress("0xc008FCe4b57d66D8E0770306b28b04aC45565cf0","jiangyxz.eth (terraforms buyer)"),
  createWatchedAddress("0x4897D38b0974051D8Fa34364E37a5993f4A966a5","h4x.eth (terraforms buyer)"),
  createWatchedAddress("0x86F58ad823E50e34190B597290a547301DBA994E","unic0rn.eth (terraforms buyer)"),
  createWatchedAddress("0x8f10ae3ffD993bFb0A71E58E1bb606439dD5b301","dankp.eth (terraforms buyer)"),
  createWatchedAddress("0x5AB5844Dd55Ab73212D1527e4CF72FEA884e39DD","uxt.eth (terraforms buyer)"),
  createWatchedAddress("0xc229d7D3dD662A1b107E29AA84bb0C8Ff609CF3A","whom.eth (terraforms buyer)"),
  createWatchedAddress("0x4d4937f2e4A79e2d09461F74Fd62C05B630d7618","oft.eth (terraforms buyer)"),
  createWatchedAddress("0x3ba53Cea97BfFf5A303fFC66dc4F390383BCd62e","joshbuckley.eth (terraforms buyer)"),
  createWatchedAddress("0x0D529254C79465560290aD9B35f00F710ae2B3Af","alexxu.eth (terraforms buyer)"),
  createWatchedAddress("0x49c3FeaFDdaefC3Bed06F4ff87CE86610C2c1076","hot.izebel.eth (terraforms buyer)"),
  createWatchedAddress("0x8B6Fb9Fd6A29960c7D7A376158575278D1a6f8Ba","ethblower.eth (terraforms buyer)"),
  createWatchedAddress("0x5bc40e5A028fEFe873776802206913B2e24d1597","depression.eth (terraforms buyer)"),
  createWatchedAddress("0x01503DC708ce3C55017194847A07aCb679D49f47","lilac.eth (terraforms buyer)"),
  createWatchedAddress("0xb84f6DA1B9AccEE009BDaba61573179b666b0d1A","monkeybiz.eth (terraforms buyer)"),
  createWatchedAddress("0x2E0D63fFCB08eA20fF3AcDbB72dfEc97343885d2","flashrekt.eth (terraforms buyer)"),
  createWatchedAddress("0x879253B5Cc2B13bb976e075F0571F85454A315f6","ippo.eth (terraforms buyer)"),
  createWatchedAddress("0x882FF1134F17017fE2c1F4B464EEe7d4f0B0d476","1414.eth (terraforms buyer)"),
  createWatchedAddress("0x6bdac4F8dFdA978b26DF826Ae4eF57f6D3b4f6b7","ilikecalculus.eth (terraforms buyer)"),
  createWatchedAddress("0x338699008f8A12422Ab0d69361F7f83741D3CEca","*el-ranye.eth (terraforms buyer)"),
  createWatchedAddress("0xD387A6E4e84a6C86bd90C158C6028A58CC8Ac459","Pranksy (INFLUENCER)"),
  createWatchedAddress("0x24D9BE8C2589c9873BC636E24972Cdb891CDbc25","wimpz.eth (terraforms buyer)"),
  createWatchedAddress("0x1fbb6906b298fd6f9f79ae55729869ac08377747","rva.eth"),
  createWatchedAddress("0xd4db6d8ef756141de0d838808ddb8ffcd847d7ff","thedave.eth"),
  createWatchedAddress("0x7d112b3216455499f848ad9371df0667a0d87eb6","treesnakecat.eth"),
  createWatchedAddress("0x7aa335dd4b35a47e4ac23e6b9201893665c3c12d","wattana.eth"),
  createWatchedAddress("0x5d57a0f243615177fd26427b323a1fbec433b865","tensafefrogs.eth"),
  createWatchedAddress("0xa23cb68780be74b254a5f7210ec6cf1c76289953","warbglblg.eth"),
  createWatchedAddress("0xf8d0a4542b1277d8a330e69cc56bdc109029c623","watashinakamura.eth"),
  createWatchedAddress("0x553bfc1e4a9c48bcbcebad54aa4cd5b48c8b037d","fireape.eth"),
  createWatchedAddress("0x5b4f87cadc9625cb9b9cff449324d204e799d19a","brickthefloor.eth"),
  createWatchedAddress("0xC3C50d8Ae310A06800696Ff7218458350cfcCA1d","underinvestedbyalot.eth"),  
  createWatchedAddress("0x416eba0df5f99cd0c98226d883bc094a1f934c97","jcorp.eth"),
  createWatchedAddress("0xd5fe01f5095d871aaa27f6eed563a6807874453f","liquidoxygen.eth"),
  createWatchedAddress("0xC8Dd545b6076AE732E97ec0ad6A3FBf9518Db2f5","newsteezy.eth (active minter, not sure if successful)"),
  createWatchedAddress("0xBA5EDc0d2Ae493C9574328d77dc36eEF19F699e2","ggcrypto.eth (seems hooked up/insider?)"),
  createWatchedAddress("0x6e3f8E093Fe749398aac60515686fC4FC4baC514","apuri.eth"),
  createWatchedAddress("0xB72dc1e80A501256ED235a32A815b78FDDFBf811","mrjonkane.eth"),
  createWatchedAddress("0x342D662cE44BC2509D563C3a2c7AB8996801E714","aeonwgmi.eth"),
  createWatchedAddress("0x24245e6c515187aB9b103BD278dAd0d5A08EdBaA","linonft.eth"),
  createWatchedAddress("0x64ff257D292d66Be0B5AB173b122f88308BC1b45","apobee.eth"),
  createWatchedAddress("0x6A28D347E31b1e39402285EDE15807139D03E303","djwc47.eth"),
  createWatchedAddress("0x98b48D5138b6BDeF95e0e89997CdeBFEa7B23251","shanksss.eth"),
  createWatchedAddress("0xCDA8de8824A2E99Ae8ce2095d43c8a405845Ef71","n8mensch.eth (uncertain if successful"),  
  createWatchedAddress("0x0297C8d39bb7c90BFe03e60ED674D175E843D62b","SHEET minter"),    
  createWatchedAddress("0x91bd472FA97A7aDABac8922815aADf239d2C6F0A","SHEET minter"),
  createWatchedAddress("0xE85DBD073e76A89D31ED6F7Cab7f4Aa3f0076837","jpzzz.eth (SHEET minter)"),
  createWatchedAddress("0xf433bdbf45ae8396805F5882C9F395b246E62AF8","smscuro.eth (SHEET minter)"),
  createWatchedAddress("0x83742fAdDdE0b5b2b307Ac46F24a1C118d332549","mys7ix.eth (SHEET minter)"),
  createWatchedAddress("0xAaB6d07c3529e4d6Ac82E288B45Bc91DC38858dB","hexven.eth (SHEET minter)"),
  createWatchedAddress("0x74Bb4995D5F1302b55b14BF6c1Df9eB39e3F57Ce","artmin.eth (SHEET minter)"),
  createWatchedAddress("0xAFaB10574b138f8bA3DAf22d176e6E5b81a86576","slingn.eth (SHEET minter)"),
  createWatchedAddress("0x7B8a6e7777793614F27799199E32E80F03d18dBe","foreverrugged.eth (SHEET minter)"),
  createWatchedAddress("0x63d48Ed3f50aBA950c17e37CA03356CCd6b6a280","0xwave.eth (SHEET minter)"),
  createWatchedAddress("0x162f3a373A8605Fd0dA52b1b6D44dc8BCc97F0AA","harristotle.eth (SHEET minter)"),
  createWatchedAddress("0x2a2196D979004974FD81b234c04Bf9D49137205a","snapjaw.eth (SHEET minter)"),
  createWatchedAddress("0xbAaBA861464F25f52c2eE10CC3AC024F4f77812a","idonotknowwhatimdoing.eth (SHEET minter)"),
  createWatchedAddress("0x271ae5A9e689ee106EeF2E70861122Aaf2A3135f","ettebub.eth (SHEET minter)"),
  createWatchedAddress("0x730Aba725664974eFB753ee72cA789541C733Db4","barrymcockiner.eth (SHEET minter)"),
  createWatchedAddress("0x304aA04D546750b0AF651EcDbaf1Aa1cA57E0b58","allcoinsyieldcapital.eth (SHEET minter)"),
  createWatchedAddress("0xC3b5533cFED62C10e8fc04AeCbD4BD09312841D0","hot.0xwave.eth (SHEET minter)"),  
  createWatchedAddress("0xb597B202294Dd5a4A616FCc2F178588BFc6D2c16","alwayshorny.eth (SHEET minter)"),  
  createWatchedAddress("0x92e9b91AA2171694d740E7066F787739CA1Af9De","morello.eth (SHEET minter)"),  
  createWatchedAddress("0xAF64f945d16e02a665e794B004dA2678A58c85C4","dumpty.eth (SHEET minter)"),  
  createWatchedAddress("0x0297C8d39bb7c90BFe03e60ED674D175E843D62b","big SHEET minters"),  
  createWatchedAddress("0x7B1d5b018F6AC057B07De5313ACBa17A98d740cD","pamibaby.eth (SHEET minter)"),
  createWatchedAddress("0xfa18dA7E2DB0802312Bf47Ed927CCFfeebA4036A","cryptofate.eth (SHEET minter)"),
  createWatchedAddress("0x7a70536c4d695b1ec9df972e91461e834bfb00e8","memeticpower.eth (SHEET minter)"),
  createWatchedAddress("0x54b174179ae825ed630da40b625bb3c883cd40ae","naterivers.eth (INFLUENCER)"),
  createWatchedAddress("0xa442ddf27063320789b59a8fdca5b849cd2cdeac","tropofarmer.eth (INFLUENCER)"),
  createWatchedAddress("0x452429cd43341359fAfcf021Fd85957851D7acfD","hgn.eth (loserclub buyer)"),
  createWatchedAddress("0x71Bb56f50EFC0a528A30a8a75A50328B16A6579e","vykintas.eth (loserclub buyer)"),
  createWatchedAddress("0xbBaDdBbc19Ce2ba8bD2186C9959f1652c0C10733","subcat.eth (loserclub buyer)"),
  createWatchedAddress("0x4a4c43230e64b397f6A0f11C8714f880741d5A9D","nftmetaman.eth (loserclub buyer)"),
  createWatchedAddress("0x30e9F0032472285b888b419b7539a04aeBCb10aa","jacobcohen.eth (loserclub buyer)"),
  createWatchedAddress("0x4D1f2BC30D59EE4F96d5503fe27c3767919E3e8b","postmahomes.eth (loserclub buyer)"),
  createWatchedAddress("0xd4eaE02F2F93A30eFFD3d9a1bA7F0bF51185BA68","invalidbyte.eth (loserclub buyer)"),
  createWatchedAddress("0xA01C0735C7cA5f8efc1e63efa5F2D1C4fc1a4714","farinasaur.eth (loserclub buyer)"),
  createWatchedAddress("0xc28D30dD716A40b0c19215b732ce7Be0E80A5098","djohnsonft.eth (loserclub buyer)"),
  createWatchedAddress("0x07058f4BdC6BdaeE93b49fe30Ff11FDa646ceca0","chico9626.eth (loserclub buyer)"),
  createWatchedAddress("0x4f0a07f1f705f0db9736ddc3c3b22a3eabecc5a0","timyeung.eth (Phantabears buyer)"),
  createWatchedAddress("0xc5F59709974262c4AFacc5386287820bDBC7eB3A","farokh.eth (INFLUENCER)"),
  createWatchedAddress("0xf53feaeb035361c046e5669745695e450ebb4028","*orz-allinornothing.eth (Phantabears buyer)"),
  createWatchedAddress("0x97f3e6408f9679830cbf93b57b30693be566939f","jerry0202.eth (Phantabears buyer)"),
  createWatchedAddress("0xec4b08bdab84e2096091a0fe56db0b6349411b6a","seanxu.eth (Phantabears buyer)"),
  createWatchedAddress("0x81f7ef7586c7da8fdb0bb94032f3ad06ae21f644","(former?) BAYC owner. Phantabears buyer"),
  createWatchedAddress("0x61fd0d043d519f5a2bd05785000f30db96809429","985.eth (Phantabears buyer)"),
  createWatchedAddress("0x85477c7e126624875a814ec618bb9573846bf646","worldofmetaverse.eth (Phantabears buyer)"),
  createWatchedAddress("0xf60f6d5acfaae09e666f0efac21b29290e4a9109","konata.eth (Phantabears buyer)")]  
  watchedAddressArr.map(x => {
    x.address = x.address.toLowerCase()
  })
  var watchedAddresses = watchedAddressArr.map(x => x.address)
  
  var ignoredToAddresses = [
    "0x1111111254fb6c44bac0bed2854e76f90643097d", // 1inch
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // wrapped ETH
    "0x7be8076f4ea4a4ad08075c2508e481d6c946d12b", // opensea
    "0xdac17f958d2ee523a2206206994597c13d831ec7",  // tether
    "0x881d40237659c251811cec9c364ef91dc08d300c", // metamask swap router
    "0xb8901acB165ed027E32754E0FFe830802919727f",  // hop protocol
    "0x1E4EDE388cbc9F4b5c79681B7f94d36a11ABEBC9", // X2Y2
    "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", // Uniswap router
    "0x7f268357A8c2552623316e2562D90e642bB538E5", // Wyvern exchange
    "0x0c734134d68adbc6eeeb7477f77409fdf7bc9dee", // SHEET fighter
    "0xc4ccddcd0239d8425b54322e8e5f99d19fb7ba43", // X2Y2
    "0xa351b769a01b445c04aa1b8e6275e03ec05c1e75", // ethernal elves
    "0xA98cC213495B178Bc0AA690223325bBed2Dbbc71", // block queens
    "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f", // sushiswap
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // usdc
    "0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f", // arbitrum inbox
    "0x0000000035634b55f3d99b071b5a354f48e10bef", // gems
    "0x59728544b08ab483533076417fbbb2fd0b17ce3a", // looksrare
    "0xe592427a0aece92de3edee1f18e0157c05861564", // uniswap v3
    "0xc36442b4a4522e871399cd717abdd847ab11fe88", // uniswap positions
    "0xe0176ba60efddb29cac5b15338c9962daee9de0c", // PREMINTCOL
    "0xED5AF388653567Af2F388E6224dC7C4b3241C544" // azuki
  ] 
  ignoredToAddresses = ignoredToAddresses.map(x => x.toLowerCase())

  // =================================  
  //      WATCH EACH NEW BLOCK
  // =================================
  provider.on('block', async (blockNumber) => {
    const blockWithTransactions = await provider.getBlockWithTransactions(blockNumber)

    const transactions = blockWithTransactions.transactions
    await Promise.all(transactions.map(async t => {
      // // howlerz
      // if (t.from.toLowerCase().includes("0x0116d4c19d23b22cea9d78911d05cbc387136599")
      // || t.from.toLowerCase().includes("0xb75cbdf4e348cb39caf3e4cad0dae97a3b8f5f06")) {
      //   var mailOptions = {
      //     from: 'derekzuk@gmail.com',
      //     to: 'derekzuk@gmail.com',
      //     subject: 'Howlerz wallet activity',
      //     text: 'howlerz tx at https://etherscan.io/address/0x0116d4c19d23b22cea9d78911d05cbc387136599'
      //   };
      //   transporter.sendMail(mailOptions, function(error, info){
      //     if (error) {
      //       console.log(error);
      //     } else {
      //       console.log('Email sent: ' + info.response);
      //     }
      //   });
      // }

      if (watchedAddresses.includes(t.from.toLowerCase())
      && !ignoredToAddresses.includes(t.to.toLowerCase())) {
        console.log("blockNumber: " + blockNumber)
        var timesSeenRecord = timesSeen.get(t.to.toLowerCase())
        var apeIndex = 0
        var sendEmail = false;
        if (timesSeenRecord == undefined || timesSeenRecord == null) {
          // TODO: this is fucked. it always returns false for some reason.
          var publicMintDetected = await detectPublicMint(t.to.toLowerCase(), t.data, t.from.toLowerCase());
          if (publicMintDetected) {
            console.log("public mint function detected in t.to contract")
            timesSeen.set(t.to.toLowerCase(), [1, [t.from.toLowerCase()]]);
            apeIndex = 1
          } else {
            // ignore interactions that are not likely public mints
            console.log("ignoring")
          }
        } else {
          console.log("seen before!")
          var apeIndexArr = timesSeen.get(t.to.toLowerCase())
          console.log("apeIndexArr: " + apeIndexArr);
          apeIndex = apeIndexArr[0]
          var apeAddresses = apeIndexArr[1]
          console.log("apeAddresses: " + apeAddresses)
          if (!apeAddresses.includes(t.from.toLowerCase())){
            sendEmail = true;
            apeAddresses.push(t.from.toLowerCase())
            console.log("new apeAddresses: " + apeAddresses)
            timesSeen.set(t.to.toLowerCase(), [apeIndexArr[0] + 1, apeAddresses])
            apeIndex = apeIndex+1
            console.log("new ape index: " + apeIndex)
          } else {
              // do nothing
          }
        }                
        var watchedAddressRecord = watchedAddressArr.find(a => a.address === t.from.toLowerCase())
        console.log("Contract interaction " + 'https://etherscan.io/tx/' + t.hash + " description: " + watchedAddressRecord.description + ", apeIndex: " + apeIndex)         

        if (apeIndex > 1 && sendEmail) {
          // ape index is > 1. We send an email
          console.log("APE INDEX: " + apeIndex)          
          // send email
          var mailOptions = {
            from: 'derekzuk@gmail.com',
            to: 'derekzuk@gmail.com',
            subject: 'TX from watched address: ' + t.from,
            text: 'https://etherscan.io/tx/' + t.hash + " description: " + watchedAddressRecord.description + " apeIndex: " + apeIndex
          };
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        }
      }
    }))

  })
}

main();