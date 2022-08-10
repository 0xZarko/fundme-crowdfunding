// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        //We need the address and the ABI of the contract
        //Address of Chainlink ETH/USD contract on Rinkeby: 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        //The ABI we get with the top import like this:
        /*AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        );*/
        //We basically wrap the contract with the corresponding interface, so we don't need to import ALL the contract
        (, int256 price, , , ) = priceFeed.latestRoundData(); //The spaces are for variables that are returned but we don't need
        uint256 lastPrice = uint256(price);
        return (lastPrice * 10**(18 - priceFeed.decimals())); //Because Chainlink price has 8 decimals and we need 18
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed); //for example if Eth = 3000usd, we get 3000_000000000000000000
        //then, ethAmount has also 18 decimals, so for example for 1eth it will be 1_000000000000000000
        //so when we multiply this we will get 3000_000000000000000000000000000000000000, 36 zeroes
        //thats why we divide the result in 1e18
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18; //Always multiply first before divinding
        return ethAmountInUsd;
    }
}
