const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config") //We have to import all the needed variables from the helper

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        //We check to see if any of our development chains was selected
        log("Local network detected, deploying mocks...")
        await deploy("MockV3Aggregator", {
            //If we are in a development chain, we deploy the mock
            contract: "MockV3Aggregator",
            from: deployer,
            log: true, //This makes it spit a little bit of logging information useful for debugging
            args: [DECIMALS, INITIAL_ANSWER], //We pass the arguments defined in the helper to the mock
        })
        log("Mocks deployed!")
        log("-------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"] //By adding this, we can run "yarn hardhat deploy --tags mocks" to deploy only the mocks
