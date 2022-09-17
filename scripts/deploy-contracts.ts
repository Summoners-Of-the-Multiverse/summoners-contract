import fs from 'fs/promises';
import { getDefaultProvider, utils } from 'ethers';
import { isTestnet, wallet } from '../config/constants';

const {
    utils: { deployContract },
} = require('@axelar-network/axelar-local-dev');
const { deployUpgradable } = require('@axelar-network/axelar-gmp-sdk-solidity');

// load contracts
const ExampleProxy = require('../artifacts/contracts/Proxy.sol/SotmProxy.json');
const NFTLinker = require('../artifacts/contracts/NFTLinker.sol/SotmNftLinker.json');
const ERC721 = require('../artifacts/contracts/ERC721demo.sol/Sotm721.json');

let chains = isTestnet ? require('../config/testnet.json') : require('../config/local.json');

// get chains
const bnbChain = chains.find((chain: any) => chain.name === 'BNB Chain');
const polygonChain = chains.find((chain: any) => chain.name === 'Polygon');

const nftTokenId = 0;

// deploy script
async function deployNFTContracts(chain: any) {
    console.log(`\n*****${chain.name.toUpperCase()}*****`);
    const provider = getDefaultProvider(chain.rpc);
    const walletConnectedToProvider = wallet.connect(provider);

    // deploy/mint an NFT to selected chain
    const erc721 = await deployContract(walletConnectedToProvider, ERC721, ['Summoners of the Multiverse', 'SOTM']);
    chain.erc721 = erc721.address;
    console.log(`ERC721Demo deployed on ${chain.name} ${erc721.address}.`);

    if (chain.name === "BNB Chain") {
        const hash = '7a8a7902a4ee5625dec2'
        const metadata = `https://api.npoint.io/${hash}`;
        await (await erc721.mintWithMetadata(nftTokenId, hash, metadata)).wait(1);
        console.log(`Minted token ${nftTokenId} ${hash} for ${chain.name} with metadata ${metadata}`);
    } else {
        const hash = 'efaecf7cee7cfe142516'
        const metadata = `https://api.npoint.io/${hash}`;
        await (await erc721.mintWithMetadata(nftTokenId, hash, metadata)).wait(1);
        console.log(`Minted token ${nftTokenId} ${hash} for ${chain.name}`);
    }

    const nftLinker = await deployUpgradable(
        chain.constAddressDeployer,
        walletConnectedToProvider,
        NFTLinker,
        ExampleProxy,
        [chain.gateway, chain.gasReceiver],
        [],
        utils.defaultAbiCoder.encode(['string'], [chain.name]),
        'nftLinker',
    );
    console.log(`NFTLinker deployed on ${chain.name}: ${nftLinker.address}`);
    chain.nftLinker = nftLinker.address;

}

async function main() {

    for await (let chain of [bnbChain, polygonChain]) {
        await deployNFTContracts(chain);
    }

    // update chains
    const updatedChains = [bnbChain, polygonChain];
    if (isTestnet) {
        await fs.writeFile('config/testnet.json', JSON.stringify(updatedChains, null, 2));
    } else {
        await fs.writeFile('config/local.json', JSON.stringify(updatedChains, null, 2));
    }
}

main();
