const ethers = require('ethers');
const { encode } = require('rlp');

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

export { GWEI, ETHER, encodeSignedTransaction }