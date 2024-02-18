import { Aptos, Account, APTOS_COIN, GetCollectionDataResponse, GetOwnedTokensResponse, AccountAddress, Hex } from "@aptos-labs/ts-sdk";
import 'dotenv/config';

const alice = Account.generate();

const aptos = new Aptos(); // Devnet

async function main() {
    // Account
    await aptos.fundAccount({
        accountAddress: alice.accountAddress,
        amount: 1e18,
    });
    const amounts = await aptos.getAccountCoinAmount({ accountAddress: alice.accountAddress, coinType: APTOS_COIN });

    const collection = await createCollection();
    const tokens = await mintToken(collection);
    // await transferToken(tokens);

}


const createCollection = async () => {
    const collectionName = "Example Collection " + Date.now();
    const collectionDescription = "Example description.";
    const collectionURI = "aptos.dev";


    const createCollectionTransaction = await aptos.createCollectionTransaction({
        creator: alice,
        description: collectionDescription,
        name: collectionName,
        uri: collectionURI,
        royaltyNumerator: 55, // 5.5%
        royaltyDenominator: 1000,
    });
    console.log("\n=== Create the collection ===\n");
    let committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: createCollectionTransaction });
    let pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    const alicesCollection = await aptos.getCollectionData({
        creatorAddress: alice.accountAddress,
        collectionName,
        minimumLedgerVersion: BigInt(pendingTxn.version),
    });
    console.log("🚀 ~ createCollection ~ alicesCollection:", alicesCollection)
    return alicesCollection;
}

const mintToken = async (collection: GetCollectionDataResponse) => {
    console.log("\n=== Alice Mints the digital asset ===\n");
    const tokenName = "Example Asset";
    const tokenDescription = "Example asset description.";
    const tokenURI = "aptos.dev/asset";

    const mintTokenTransaction = await aptos.mintDigitalAssetTransaction({
        creator: alice,
        collection: collection.collection_name,
        description: tokenDescription,
        name: tokenName,
        uri: tokenURI,
    });

    const committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: mintTokenTransaction });
    const pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    const alicesDigitalAsset = await aptos.getOwnedDigitalAssets({
        ownerAddress: alice.accountAddress,
        minimumLedgerVersion: BigInt(pendingTxn.version),
    });

    return alicesDigitalAsset;
}

const transferToken = async (tokens: GetOwnedTokensResponse) => {
    const transferTransaction = await aptos.transferDigitalAssetTransaction({
        sender: alice,
        digitalAssetAddress: tokens[0].token_data_id,
        recipient: new AccountAddress(Hex.fromHexInput("0x7e833ed1bc62cfb7857e382bf1fe106a794e325d72c92296c5f0022cda3b09fc").toUint8Array()),
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
        signer: alice,
        transaction: transferTransaction,
    });
    const pendingTxn = await aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
    });
    console.log("🚀 ~ transferToken ~ pendingTxn:", pendingTxn.hash)

    const tokensOfBob = await aptos.getOwnedDigitalAssets({
        ownerAddress: new AccountAddress(Hex.fromHexInput("0x7e833ed1bc62cfb7857e382bf1fe106a794e325d72c92296c5f0022cda3b09fc").toUint8Array()),
    });
    console.log("🚀 ~ transferToken ~ tokensOfBob:", tokensOfBob)
}

main();