require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("dotenv").config() //We add this to work with env files

//This OR syntax is so Hardhat doesn't get mad at us if we don't use Rinkeby and don't define this parameters in the .env
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "https://rinkeby/example"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey"
const ETHERSCAN_API = process.env.ETHERSCAN_API || "key"
const COINMARKETCAP_API = process.env.COINMARKETCAP_API || "key"

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    //solidity: "0.8.7",
    solidity: {
        //We can have multiple Solidity compilers so we can more easily work with other contracts
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API,
    },
    gasReporter: {
        enabled: true, //We should set this to false when we are not interested in gas reports
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        //coinmarketcap: COINMARKETCAP_API, //We have to comment it so we don't use too much of the API
        token: "ETH", //This is so we can check how much it will cost in another blockchain (for example, in MATIC or FTM)
    },
    namedAccounts: {
        deployer: {
            default: 0,
            4: 0,
            31337: 0,
        },
    },
}
