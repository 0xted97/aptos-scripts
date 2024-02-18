

import { Account, Aptos } from "@aptos-labs/ts-sdk";


type Task = {
    address: string;
    completed: boolean;
    content: string;
    task_id: string;
};

const aptos = new Aptos(); // Devnet

const bob = Account.generate();


async function main() {
    const module = "0x75e35bd39272c3d7c17a2cb29357bee70e26e8a3844dd9296438ce4cff8739f2";

    await aptos.fundAccount({
        accountAddress: bob.accountAddress,
        amount: 1e18,
    });

    // Add new list
    const newListRaw = await aptos.transaction.build.simple({
        sender: bob.accountAddress,
        data: {
            function: `${module}::todolist::create_list`,
            functionArguments: [],
        },

    });
    // sign and submit transaction to chain
    const newListTx = await aptos.signAndSubmitTransaction({
        signer: bob,
        transaction: newListRaw,
    });

    // wait for transaction
    await aptos.waitForTransaction({ transactionHash: newListTx.hash });
    console.log("🚀 ~ main ~ newListTx:", newListTx.hash)

    // Add new task
    const newTaskRaw = await aptos.transaction.build.simple({
        sender: bob.accountAddress,
        data: {
            function: `${module}::todolist::create_task`,
            functionArguments: ["Learn Javascript " + Date.now()],
        },

    });
    // sign and submit transaction to chain
    const newTaskTx = await aptos.signAndSubmitTransaction({
        signer: bob,
        transaction: newTaskRaw,
    });

    // wait for transaction
    await aptos.waitForTransaction({ transactionHash: newTaskTx.hash });
    console.log("🚀 ~ main ~ newTaskTx:", newTaskTx.hash);

    // Complete task
    const completedRaw = await aptos.transaction.build.simple({
        sender: bob.accountAddress,
        data: {
            function: `${module}::todolist::complete_task`,
            functionArguments: [1],
        },

    });
    // sign and submit transaction to chain
    const completedTx = await aptos.signAndSubmitTransaction({
        signer: bob,
        transaction: completedRaw,
    });

    // wait for transaction
    await aptos.waitForTransaction({ transactionHash: completedTx.hash });
    console.log("🚀 ~ main ~ completedTx:", completedTx.hash)


    const res = await aptos.account.getAccountResource({
        accountAddress: bob.accountAddress,
        resourceType: `${module}::todolist::TodoList`,
    });
    const tableHandle = (res as any).tasks.handle;
    const taskCounter = (res as any).task_counter;

    let tasks = [];
    let counter = 1;

    while (counter <= taskCounter) {
        const tableItem = {
            key_type: "u64",
            value_type: `${module}::todolist::Task`,
            key: `${counter}`,
        };
        const task = await aptos.getTableItem<Task>({ handle: tableHandle, data: tableItem });
        tasks.push(task);
        counter++;
    }
    console.log("🚀 ~ main ~ tasks:", tasks)


}

main();