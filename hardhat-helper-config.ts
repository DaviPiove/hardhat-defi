import { ethers } from "hardhat";

interface INetworkConfigItem {
    name: string;
    lendingPoolAddressesProvider: string;
    wethToken: string;
    daiEthPriceFeed: string;
    daiTokenAddress: string;
}

interface INetworkConfig {
    [key: string]: INetworkConfigItem;
}

export const networkConfig: INetworkConfig = {
    31337: {
        name: "localhost",
        lendingPoolAddressesProvider: "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        wethToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        daiEthPriceFeed: "0x773616E4d11A78F511299002da57A0a94577F1f4",
        daiTokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
};

export const AMOUNT = ethers.utils.parseEther("0.02");

export const developmentChains = ["hardhat", "localhost"];
