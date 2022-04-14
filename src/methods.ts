import { ethers, Contract, Wallet } from "ethers";
import { config } from "./config";

export class Blockchain {
  private accountsContract: Contract = undefined;
  private wallet: Wallet = undefined;

  async setupWallet(jwt) {
    if (!jwt) {
      throw new Error("Invalid jwt token");
    }
    const res = await fetch("https://auth.webaverse.com/mnemonic", {
      headers: new Headers({
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      }),
    });
    if (res.status >= 400) {
      throw new Error("Invalid jwt token");
    }
    const { mnemonic } = await res.json();
    const provider = new ethers.providers.JsonRpcProvider(config.sidechainURL);
    this.wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(provider);
    this.accountsContract = new ethers.Contract(
      config.accountsContract.address,
      config.accountsContract.abi,
      this.wallet
    );
  }

  async getProfile() {
    const address = await this.wallet?.getAddress();
    if (!address) {
      throw new Error('wallet not initialized');
    }
    const res = await fetch(`https://nft.webaverse.com/account/${address}`);
    let profile = await res.json();
    if (profile.address) {
      // removing address because it's the address of sidechain
      delete profile.address;
    }
    return profile;
  }

  async setProfile(key: string, value: string) {
    const address = await this.wallet.getAddress();
    const tx = await this.accountsContract.setMetadata(address, key, value);
    await tx.wait();
  }
}
