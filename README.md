# Testing Crowdfunding Project

This project is a self-test, my first public smart contract development.
It's implemented with Hardhat, and contains the smart contracts, the deploy scripts, some extra scripts to interact with the crowfunding contract and some simple overall tests to try the syntax and inner workings of testing contracts.
It also has a verify.js script to verify the contract on Etherscan in case it's deployed on a live chain, some prettier and solhint config files, and a helper config file with extra arguments needed (like the addresses of the ETH/USD Chainlink oracle for different chains).

It also features a yarn.lock file to facilitate its use with yarn as that was the package manager used. The added yarn scripts are:

```shell
yarn test  - Deploys contracts to local Hardhat network and runs tests in test/unit
yarn lint  - Lints the contracts in contracts folder
yarn format  - Formats project files using prettier
yarn coverage  - Gets the coverage of the tests over the contracts 
```
