import { Aptos, Account, SigningSchemeInput, Secp256k1PrivateKey, APTOS_COIN } from "@aptos-labs/ts-sdk";
import 'dotenv/config';

const bob = Account.fromPrivateKey({
    privateKey: new Secp256k1PrivateKey(process.env.BOB_PRIVATE_KEY as string),
})

const ted = Account.fromPrivateKey({
    privateKey: new Secp256k1PrivateKey(process.env.ALICE_PRIVATE_KEY as string)
});

const aptos = new Aptos(); // Devnet
async function main() {

    // Account
    await aptos.fundAccount({
        accountAddress: ted.accountAddress,
        amount: 1e18,
    });
    const amounts = await aptos.getAccountCoinAmount({ accountAddress: ted.accountAddress, coinType: APTOS_COIN });
    console.log("🚀 ~ main ~ amounts:", amounts)

    // -------------------- Build simple a transaction --------------------
    await sendSimpleTransactionWithoutSponsor();
    await sendSimpleTransactionWithSponsor();

}

const sendSimpleTransactionWithoutSponsor = async () => {
    // NOTE: the receiver must to init account before receiver
    const transactionRaw = await aptos.transaction.build.simple({
        sender: ted.accountAddress,
        data: {
            function: "0x1::coin::transfer",
            typeArguments: ["0x1::aptos_coin::AptosCoin"],
            functionArguments: [bob.accountAddress, 100],
        },
    });

    // using signAndSubmit combined
    const sendSimpleTx = await aptos.signAndSubmitTransaction({
        signer: ted,
        transaction: transactionRaw,
    });
    console.log("🚀 ~ sendSimpleTransactionWithoutSponsor ~ sendSimpleTx:", sendSimpleTx.hash)
}

const sendSimpleTransactionWithSponsor = async () => {
    // NOTE: the receiver must to init account before receiver
    const transaction = await aptos.transaction.build.simple({
        sender: bob.accountAddress,
        withFeePayer: true,
        data: {
            function: "0x1::coin::transfer",
            typeArguments: ["0x1::aptos_coin::AptosCoin"],
            functionArguments: [ted.accountAddress, 55],
        },
    });

    const senderAuthenticator = aptos.transaction.sign({
        signer: bob,
        transaction,
    });

    const feePayerSignerAuthenticator = aptos.transaction.signAsFeePayer({
        signer: ted,
        transaction,
    });
    console.log("🚀 ~ sendSimpleTransactionWithSponsor ~ feePayerSignerAuthenticator:", feePayerSignerAuthenticator)

    // using signAndSubmit combined
    const sendSimpleTx = await aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator,
        feePayerAuthenticator: feePayerSignerAuthenticator,
    });
    console.log("🚀 ~ main ~ sendSimpleTx:", sendSimpleTx)
}

main();