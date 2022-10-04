import { BigNumber } from "ethers";
import { ethers, getNamedAccounts, network } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";
import { AMOUNT, networkConfig } from "../hardhat-helper-config";
import {
    AggregatorV3Interface,
    IERC20,
    ILendingPool,
    ILendingPoolAddressesProvider,
} from "../typechain-types";
import { getWeth } from "./getWeth";

const main = async () => {
    await getWeth();
    const chainId = network.config.chainId!;
    const { deployer } = await getNamedAccounts();
    const lendingPool: ILendingPool = await getLendingPool(deployer);
    console.log(`LendingPool address: ${lendingPool.address}`);

    //Approve Aave contract: give access endingPool.address to pool our weth token from our account
    const wethTokenAddress = networkConfig[chainId].wethToken!;
    await approveErc20(
        wethTokenAddress,
        lendingPool.address,
        AMOUNT.toString(),
        deployer
    );
    // Deposit
    console.log("Depositing...");
    await lendingPool.deposit(wethTokenAddress, AMOUNT.toString(), deployer, 0);
    console.log("Deposited!");

    // Borrow
    let [availableBorrowsETH, totalDebtETH] = await getBorrowUserData(
        lendingPool,
        deployer
    );
    const daiEthPrice = await getDAIPrice();
    const amountDaiToBorrow = availableBorrowsETH.div(daiEthPrice);
    console.log(`You can borrow ${amountDaiToBorrow} DAI`);
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString());
    await borrowDai(
        networkConfig[chainId].daiTokenAddress,
        lendingPool,
        amountDaiToBorrowWei.toString(),
        deployer
    );
    await getBorrowUserData(lendingPool, deployer);

    // Repay
    await repay(
        amountDaiToBorrowWei.toString(),
        networkConfig[chainId].daiTokenAddress,
        lendingPool,
        deployer
    );
    await getBorrowUserData(lendingPool, deployer);
};

const repay = async (
    amount: string,
    daiAddress: string,
    lendingPool: ILendingPool,
    account: Address
) => {
    // Approve sending DAI back to Aave
    await approveErc20(daiAddress, lendingPool.address, amount, account);
    // Repay
    const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
    await repayTx.wait(1);
    console.log("Repaid!");
};

const borrowDai = async (
    daiAddress: string,
    lendingPool: ILendingPool,
    amountDaiToBorrow: string,
    account: Address
) => {
    const borrowTx = await lendingPool.borrow(
        daiAddress,
        amountDaiToBorrow,
        1,
        0,
        account
    );
    await borrowTx.wait(1);
    console.log("You have borrowed!");
};

const getDAIPrice = async () => {
    const daiEthPriceFeed: AggregatorV3Interface = await ethers.getContractAt(
        "AggregatorV3Interface",
        networkConfig[network.config.chainId!].daiEthPriceFeed!
    );
    const price = (await daiEthPriceFeed.latestRoundData())[1];
    console.log(`The Dai/ETH price is ${price}`);
    return price;
};

const getBorrowUserData = async (
    lendingPool: ILendingPool,
    account: Address
): Promise<[BigNumber, BigNumber]> => {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account);
    console.log(
        `You have ${ethers.utils.formatEther(
            totalCollateralETH.toString()
        )} worth of ETH deposited.`
    );
    console.log(
        `You have ${ethers.utils.formatEther(
            totalDebtETH.toString()
        )} worth of ETH borrowed`
    );
    console.log(
        `You can borrow ${ethers.utils.formatEther(
            availableBorrowsETH.toString()
        )} worth of ETH`
    );
    return [availableBorrowsETH, totalDebtETH];
};

const approveErc20 = async (
    erc20Address: string,
    spenderAddress: string,
    amountToSpend: string,
    account: Address
) => {
    const erc20Token: IERC20 = await ethers.getContractAt(
        "IERC20",
        erc20Address,
        account
    );
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);
    console.log("Approved!");
};

const getLendingPool = async (account: string) => {
    const chainId = network.config.chainId!;
    const lendingPoolAddressProvider: ILendingPoolAddressesProvider =
        await ethers.getContractAt(
            "ILendingPoolAddressesProvider",
            networkConfig[chainId].lendingPoolAddressesProvider,
            account
        );
    //get address of the landing pool
    const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool();
    const lendingPool: ILendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    );
    return lendingPool;
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
