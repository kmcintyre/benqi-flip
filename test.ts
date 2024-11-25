import { createPublicClient, parseAbi, http, formatEther, formatUnits, getContract, getAddress } from 'viem'
import { avalanche } from 'viem/chains'

const read = createPublicClient({
    chain: avalanche,
    transport: http("https://api.avax.network/ext/bc/C/rpc"),
})

const me = '0x52E49872153fb72F96a0E4a04356d06d5b4AaCd8';
const qiAvax = '0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c';
const balance = await read.getBalance({ address: me });
console.log(`balance: ${formatEther(balance)}`);

const comptroller = '0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4'

const comptrollerAbi = parseAbi([
   'function getAccountLiquidity(address account) public view returns (uint, uint, uint)',
   'function getAllMarkets() public view returns (address[] memory)'
]);

const benqiContract = getContract({
    address: comptroller,
    abi: comptrollerAbi,
    client: read,
});

const accountLiquidity = await benqiContract.read.getAccountLiquidity([
    me,
  ])

console.log('accountLiquidity:', formatEther(accountLiquidity[1]));

const allMarkets = await benqiContract.read.getAllMarkets();

console.log('allMarkets:', allMarkets)

const marketsAbi = parseAbi([
    'function name() public view returns (string name)',
    'function decimals() public view returns (uint8 decimals)',
    'function underlying() public view returns (address underlying)',
    'function balanceOf(address account) public view returns (uint256 balance)',
    'function borrowBalanceStored(address account) public view returns (uint256 borrowed)'
 ]);

 const underlyingAbi = parseAbi([
    'function name() public view returns (string name)',
    'function decimals() public view returns (uint8 decimals)',
 ]);


const data = await Promise.all(allMarkets.map( c => {
    return Promise.all([
        c === qiAvax ? Promise.resolve(getAddress('0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7')) : getContract({ address: c, abi: marketsAbi, client: read }).read.underlying(),
        getContract({ address: c, abi: marketsAbi, client: read }).read.balanceOf([me]),
        getContract({ address: c, abi: marketsAbi, client: read }).read.borrowBalanceStored([me])
    ]).then(res => {
        const underlying = getContract({address: res[0], abi: underlyingAbi, client: read})
        return Promise.all([
            underlying.read.name(),
            underlying.read.decimals()
                ]).then(res2 => {
                    return {
                        contract: c,
                        name: res2[0],
                        decimals: res2[1],
                        balance: formatUnits(res[1], res2[1]),
                        borrowed: formatUnits(res[2], res2[1])
                    }
                })
    })
}))

console.log('data:', data)

// const balances = await Promise.all(contracts.map( c => {
//     return getContract({ address: c.contract, abi: marketsAbi, client: read }).read.balanceOf([me])
// }))

// console.log('balances:', balances.map( (b) => formatEther(b)))

// const borrowed = await Promise.all(allMarkets.map( c => {
//     return 
// }))

// console.log('borrowed:', borrowed.map( (b) => formatEther(b)))

// const BenqiController = {
//     address: '',
//     abi: parseAbi([
//         'function getAccountLiquidity(address account, number number) external view returns (uint256 liquidity)',
//     ]),
// };

// const AccountLiquidity = [{
//     BenqiController,
//     functionName: 'getAccountLiquidity',
//     args: [0x52E49872153fb72F96a0E4a04356d06d5b4AaCd8, null],
// }];

//const blockNumber = await client.getBlockNumber() 

//const balances = await client.multicall({ contracts: AccountLiquidity, allowFailure: false });



//client.multicall

//console.log('blockNumber:', blockNumber)