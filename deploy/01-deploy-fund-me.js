/* function deployFunc(hre) { //This syntax is valid, but we are going to use anonymous functions
    console.log("Hi!")
}

module.exports.default = deployFunc */

const { network } = require("hardhat")

/* module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre //The same as doing hre.getNamedAccounts and hre.deployments
    //But now we don't have to use hre. at the beggining anymore
} */

//We import the networkConfig that we created to help deploying our contracts to multiple chains
const { networkConfig, developmentChains } = require("../helper-hardhat-config")

//We import the contract verification function we created in the new utils folder
const { verify } = require("../utils/verify")

//We can do exactly the same as in the previous example, but with only one line
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //When going to deploy to a local network we want to use a mock for the Chainlink contract
    //But what happens if we want to change chains? We don't want to have to change the contract code everytime we deploy
    //We changed the code so the constructor receives the address of the corresponding PriceFeed

    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        //If we are on a local development chain
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") //We get the mock contract deployed beforehand
        ethUsdPriceFeedAddress = ethUsdAggregator.address //And we get its address to use as the price feed
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] //We pull the corresponding eth-usd price feed address from the network config
    }

    const args = [ethUsdPriceFeedAddress] //We put the corresponding PriceFeed address here
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, //This is how many block confirmations to wait before we keep going
    })
    log("-------------------------------------------")
    log("Starting contract verification...")
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //We only want to verify if we are not on a development chain and we have an etherscan API key
        await verify(fundMe.address, args)
    }
}

module.exports.tags = ["all", "fundme"]
