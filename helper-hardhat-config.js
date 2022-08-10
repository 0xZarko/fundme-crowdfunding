const networkConfig = {
    4: {
        name: "Rinkeby",
        ethUsdPriceFeed: "0x8a753747a1fa494ec906ce90e9f37563a8af630e",
    },
    137: {
        name: "Polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    },
}

const developmentChains = ["hardhat", "localhost"]

const DECIMALS = 8
const INITIAL_ANSWER = 200000000000 //It has to have 8 decimals

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}
