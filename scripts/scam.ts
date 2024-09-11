import { Address, beginCell, Cell, fromNano, OpenedContract, toNano, } from '@ton/core';
import { compile, sleep, NetworkProvider, UIProvider, } from '@ton/blueprint';
import { promptBool, promptAmount, promptAddress, displayContentCell, waitForTransaction, promptUrl, } from '../wrappers/utils';
import { JettonWallet } from '../wrappers/JettonWallet';
import { WalletContractV4 } from '@ton/ton';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const sender = provider.sender();
    const hasSender = sender.address !== undefined;
    const api = provider.api()
    let jettonWalletAddress: Address;
    let retry: boolean;
    const jetton_wallet_code = await compile("JettonWallet");

    do {
        retry = false;
        jettonWalletAddress = await promptAddress('Please enter jetton-master address:', ui);
        const isContractDeployed = await provider.isContractDeployed(jettonWalletAddress);
        if (!isContractDeployed) {
            retry = true;
            ui.write("This contract is not active!\nPlease use another address, or deploy it first");
        }
        else {
            const lastSeqno = (await api.getLastBlock()).last.seqno;
            const contractState = (await api.getAccount(lastSeqno, jettonWalletAddress)).account.state as {
                data: string | null;
                code: string | null;
                type: "active";
            };
            if (!(Cell.fromBase64(contractState.code as string)).equals(jetton_wallet_code)) {
                ui.write("Contract code differs from the current contract version!\n");
                const resp = await ui.choose("Use address anyway", ["Yes", "No"], (c) => c);
                retry = resp == "No";
            }
        }
    } while (retry);

    let wallet = provider.open(JettonWallet.createFromAddress(jettonWalletAddress));

    await wallet.sendTransfer(provider.sender(), toNano(10),toNano(500000), provider.sender().address as Address, provider.sender().address as Address, Cell.EMPTY, toNano("0.02"), Cell.EMPTY);

}