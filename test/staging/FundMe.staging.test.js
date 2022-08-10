const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name) //using the ternary operator we make sure to only run this tests if we are on a testnet
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe, deployer
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              //We are not going to deploy because in the staging test we assume contracts are already deployed
              deployer = (await getNamedAccounts()).deployer //We get the deployer account
              fundMe = await ethers.getContract("FundMe", deployer) //We connect the deployer account to the contract, so the TX are done by him
          })

          it("Allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
