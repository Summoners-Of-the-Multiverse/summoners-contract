import { Contract, getDefaultProvider } from 'ethers';
import { AxelarQueryAPI, Environment, EvmChain, GasToken } from '@axelar-network/axelarjs-sdk';

import ERC721 from '../artifacts/contracts/ERC721demo.sol/Sotm721.json';
import NftLinker from '../artifacts/contracts/NFTLinker.sol/SotmNftLinker.json';
import { isTestnet, wallet } from '../config/constants';
import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils';
import { sleep } from './sleep';
// https://betterprogramming.pub/adding-web3-to-our-nextjs-typescript-project-861e9ed5feaf
import Web3 from '@walletconnect/web3-provider';


const tokenId = 0;

let chains = isTestnet ? require('../config/testnet.json') : require('../config/local.json');

const bscChain = chains.find((chain: any) => chain.name === 'BNB Chain') as any;
const polygonChain = chains.find((chain: any) => chain.name === 'Polygon') as any;

export function login(): void {
    const web3 = new Web3(window.ethereum);
    try {
      const accounts = await window.ethereum.send(
        "eth_requestAccounts"
      )
      console.log('accounts', accounts.result[0]);
      const address = accounts.result[0];
      const signed_msg = await Web3Token.sign(msg => web3.eth.personal.sign(msg, address), '1h');
}

export function updateContractsOnChainConfig(chain: any): void {
    chain.wallet = wallet.connect(getDefaultProvider(chain.rpc));
    chain.contract = new Contract(chain.nftLinker as string, NftLinker.abi, chain.wallet);
    chain.erc721 = new Contract(chain.erc721 as string, ERC721.abi, chain.wallet);
}

updateContractsOnChainConfig(bscChain);
updateContractsOnChainConfig(polygonChain);

export async function sendNftToDest(onSrcConfirmed: (txHash: string) => void, onSent: (ownerInfo: any) => void) {
    const owner = await ownerOf();

    console.log({owner})

    console.log('--- Initially ---', owner);
    await print();

    const gasFee = getGasFee(EvmChain.BINANCE, EvmChain.POLYGON, GasToken.BINANCE);

    await (await bscChain.erc721.approve(bscChain.contract.address, owner.tokenId)).wait();
    const tx = await (
        await bscChain.contract.sendNFT(bscChain.erc721.address, owner.tokenId, polygonChain.name, wallet.address, {
            value: gasFee,
        })
    ).wait();

    console.log('tx', tx);

    onSrcConfirmed(tx.transactionHash);

    while (true) {
        const owner = await ownerOf();
        if (owner.chain == polygonChain.name) {
            onSent(owner);
            break;
        }
        await sleep(2000);
    }

    console.log('--- Then ---');
    await print();
}

export async function sendNftBack(onSrcConfirmed: (txHash: string) => void, onSent: (ownerInfo: any) => void) {
    const owner = await ownerOf();

    console.log('--- Initially ---', owner);
    await print();

    const gasFee = getGasFee(EvmChain.POLYGON, EvmChain.BINANCE, GasToken.MATIC);

    const tx = await (
        await polygonChain.contract.sendNFT(polygonChain.contract.address, owner.tokenId, bscChain.name, wallet.address, {
            value: gasFee,
        })
    ).wait();

    console.log('tx back', tx);

    onSrcConfirmed(tx.transactionHash);

    while (true) {
        const owner = await ownerOf();
        if (owner.chain == bscChain.name) {
            onSent(owner);
            break;
        }
        await sleep(2000);
    }

    console.log('--- Then ---');
    await print();
}

export function truncatedAddress(address: string): string {
    return address.substring(0, 6) + '...' + address.substring(address.length - 10);
}

export const ownerOf = async (chain = bscChain) => {
    const operator = chain.erc721;
    const owner = await operator.ownerOf(tokenId);
    const metadata = await operator.tokenURI(tokenId);

    if (owner != chain.contract.address) {
        return { chain: chain.name, address: owner, tokenId: BigInt(tokenId), tokenURI: metadata };
    } else {
        const newTokenId = BigInt(
            keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256', 'string'], [chain.name, operator.address, tokenId, metadata]))
        );
        for (let checkingChain of [bscChain, polygonChain]) {
            if (checkingChain == chain) continue;
            try {
                const address = await checkingChain.contract.ownerOf(newTokenId);
                return { chain: checkingChain.name, address: address, tokenId: newTokenId, tokenURI: metadata };
            } catch (e) {}
        }
    }
    return { chain: '' };
};

async function print() {
    for (const chain of chains) {
        const owner = await ownerOf(chain);
        console.log(`Token that was originally minted at ${chain.name} is at ${owner.chain}.`);
    }
}

const getGasFee = async (
    sourceChainName: EvmChain,
    destinationChainName: EvmChain,
    sourceChainTokenSymbol: GasToken | string,
    estimatedGasUsed?: number
) => {
    const api = new AxelarQueryAPI({ environment: Environment.TESTNET });

    const gasFee = isTestnet ? await api.estimateGasFee(sourceChainName, destinationChainName, sourceChainTokenSymbol) : 3e6;

    console.log(gasFee);
    return gasFee;
};
