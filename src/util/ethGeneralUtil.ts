const ethers = require('ethers');
import { Contract, providers, providers as Providers } from "ethers";
const { encode } = require('rlp');
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const jQuery = require( "jquery" )( window );

// ethers.js can use Bignumber.js class OR the JavaScript-native bigint. I changed this to bigint as it is MUCH easier to deal with
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n

// Works. Used for flashbotting other peoples transactions.
function encodeSignedTransaction(tx, web3: any) {
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

  var nullArray = [];

  // get probable mint function:
  async function getMintFunctionInputs(contractObject: Contract, CONTRACT_ADDRESS: string, provider: providers.JsonRpcProvider) {
    var returnVal = []
    return new Promise<any[]>(async resolve => {
      await jQuery.getJSON('https://api.etherscan.io/api?module=contract&action=getabi&address=' + "0xee29700134aab4f45b113e43e29ff06ce10687b7" + '&APIKey=' + process.env.ETHERSCAN_API_KEY, function (data) {
        var contractABI = nullArray
        contractABI = JSON.parse(data.result);
        // console.log("contractABI: " + JSON.stringify(contractABI));
        if (contractABI !== nullArray){
          contractObject = new Contract(CONTRACT_ADDRESS, contractABI, provider)
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

export { GWEI, ETHER, encodeSignedTransaction, getMintFunctionInputs }