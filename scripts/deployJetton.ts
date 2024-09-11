import 'dotenv/config';
import { address, toNano, } from '@ton/core';
import { JettonWallet } from '../wrappers/JettonWallet';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const owner = address(process.env.JETTON_OWNER ? process.env.JETTON_OWNER : "");
    const minter = address(process.env.JETTON_MINTER ? process.env.JETTON_MINTER : "");
    const wallet_code = await compile('JettonWallet');
    const wallet = provider.open(
        JettonWallet.createFromConfig(
            {
                owner: owner,
                minter: minter,
                wallet_code: wallet_code
            },
            await compile('JettonWallet')
        )
    );

    await wallet.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(wallet.address);

}