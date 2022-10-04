import { ethers, getNamedAccounts } from "hardhat";
import { AMOUNT } from "../hardhat-helper-config";
import { IWeth } from "../typechain-types";

const MAINNET_WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

export const getWeth = async () => {
    const { deployer } = await getNamedAccounts();
    //call deposit function on the weth contract
    const iWeth: IWeth = await ethers.getContractAt("IWeth", MAINNET_WETH, deployer);
    const tx = await iWeth.deposit({ value: AMOUNT });
    await tx.wait(1);
    const wethBalance = await iWeth.balanceOf(deployer);
    console.log(`Got ${ethers.utils.formatEther(wethBalance.toString())} WETH `);
};
