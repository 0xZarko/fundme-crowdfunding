const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) //We dont do these tests if we are deploying to a testnet
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe, mockV3Aggregator, deployer
          beforeEach(async function () {
              //We are going to deploy the contract using hardhat-deploy
              //const accounts = await ethers.getSigners() //This returns the accounts array of the network to use it with indexes
              deployer = (await getNamedAccounts()).deployer //We get the deployer account
              await deployments.fixture(["all"]) //We deploy all our contracts with only this line
              fundMe = await ethers.getContract("FundMe", deployer) //We connect the deployer account to the contract, so the TX are done by him
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("Sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed() //We get the priceFeed address that has been setup
                  assert.equal(response, mockV3Aggregator.address) //And we check if its equal to the mock contract (it should be)
              })
          })

          describe("fund", function () {
              //Since we are going to test line by line, we should first test the "require" assertion
              it("Fails if you don't send enough eth", async function () {
                  await expect(
                      fundMe.fund(/*We call it without value so it reverts*/)
                  ).to.be.revertedWith(
                      //We test require statements with an expect()to.be.reverted instead of assert
                      "Didn't send enough!"
                  )
              })
              //const sendValue = "1000000000000000000" //We send 1 eth
              const sendValue = ethers.utils.parseEther("1") //This also equals 1 eth
              it("Updates the amount funded in the mapping", async function () {
                  await fundMe.fund({ value: sendValue }) //To test if it updates the mapping correctly we send it 1 eth
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  ) //And then check if the deployer has now the correct value in the mapping
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", function () {
              const sendValue = ethers.utils.parseEther("1")
              beforeEach(async function () {
                  //Since we are going to call withdraw, we should fund the contract first
                  await fundMe.fund({ value: sendValue })
              })
              it("Can withdraw when having a single funder", async function () {
                  //Assert: First we want to check the starting balance of both the contract and the deployer
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act: Run the withdraw function
                  const transactionResponse = await fundMe.withdraw() //We call the withdraw function
                  const transactionReceipt = await transactionResponse.wait(1) //Wait for it to be confirmed

                  const { gasUsed, effectiveGasPrice } = transactionReceipt //Obtain the total price payed for the TX
                  const totalGasCost = gasUsed.mul(effectiveGasPrice) //So we can discount it from the deployer balance

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      //We get the contract balance after "withdraw"
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(
                          //We get the deployer's balance after "withdraw"
                          deployer
                      )

                  //Assert: Check if the entire fundMe balance is now in the deployer wallet
                  assert.equal(
                      //We check if the deployer's ending balance (minus gas costs) is equal to the total initial balance
                      endingDeployerBalance.add(totalGasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  )
                  assert.equal(endingFundMeBalance.toString(), "0") //And we check if the contract is empty after withdrawing
              })

              it("Can withdraw when having multiple funders", async function () {
                  //Assert: First we want to fund with multiple accounts, and then check the starting balance of both the contract and the deployer
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      //We start with i=1 because the zeroth index corresponds to the deployer account
                      const fundMeConnectedContract = await fundMe.connect(
                          //We have to connect the account to the contract
                          //Because we have defaulted to connect the deployer account to the contract
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue }) //Then each account will fund 1 eth
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act: Run the withdraw function
                  const transactionResponse = await fundMe.withdraw() //We call the withdraw function
                  const transactionReceipt = await transactionResponse.wait(1) //Wait for it to be confirmed

                  const { gasUsed, effectiveGasPrice } = transactionReceipt //Obtain the total price payed for the TX
                  const totalGasCost = gasUsed.mul(effectiveGasPrice) //So we can discount it from the deployer balance

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      //We get the contract balance after "withdraw"
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(
                          //We get the deployer's balance after "withdraw"
                          deployer
                      )

                  //Assert: Check if the entire fundMe balance is now in the deployer wallet
                  assert.equal(
                      //We check if the deployer's ending balance (minus gas costs) is equal to the total initial balance
                      endingDeployerBalance.add(totalGasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  )
                  assert.equal(endingFundMeBalance.toString(), "0") //And we check if the contract is empty after withdrawing

                  //We also want to check that the funders array is resetted properly
                  await expect(fundMe.getFunder(0)).to.be.reverted //Checking the first position is enough
                  //And that in the mappings the accounts have amountFunded as 0
                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          "0"
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  //Assert: First we want to get the attacker (not owner) account
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )

                  //Act and assert: Run the withdraw function and see if it reverts (it should)
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })

          describe("cheaper withdraw", function () {
              const sendValue = ethers.utils.parseEther("1")
              beforeEach(async function () {
                  //Since we are going to call withdraw, we should fund the contract first
                  await fundMe.fund({ value: sendValue })
              })
              it("Can cheaper withdraw when having a single funder", async function () {
                  //Assert: First we want to check the starting balance of both the contract and the deployer
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act: Run the withdraw function
                  const transactionResponse = await fundMe.cheaperWithdraw() //We call the withdraw function
                  const transactionReceipt = await transactionResponse.wait(1) //Wait for it to be confirmed

                  const { gasUsed, effectiveGasPrice } = transactionReceipt //Obtain the total price payed for the TX
                  const totalGasCost = gasUsed.mul(effectiveGasPrice) //So we can discount it from the deployer balance

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      //We get the contract balance after "withdraw"
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(
                          //We get the deployer's balance after "withdraw"
                          deployer
                      )

                  //Assert: Check if the entire fundMe balance is now in the deployer wallet
                  assert.equal(
                      //We check if the deployer's ending balance (minus gas costs) is equal to the total initial balance
                      endingDeployerBalance.add(totalGasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  )
                  assert.equal(endingFundMeBalance.toString(), "0") //And we check if the contract is empty after withdrawing
              })

              it("Can cheaper withdraw when having multiple funders", async function () {
                  //Assert: First we want to fund with multiple accounts, and then check the starting balance of both the contract and the deployer
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      //We start with i=1 because the zeroth index corresponds to the deployer account
                      const fundMeConnectedContract = await fundMe.connect(
                          //We have to connect the account to the contract
                          //Because we have defaulted to connect the deployer account to the contract
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue }) //Then each account will fund 1 eth
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act: Run the withdraw function
                  const transactionResponse = await fundMe.cheaperWithdraw() //We call the withdraw function
                  const transactionReceipt = await transactionResponse.wait(1) //Wait for it to be confirmed

                  const { gasUsed, effectiveGasPrice } = transactionReceipt //Obtain the total price payed for the TX
                  const totalGasCost = gasUsed.mul(effectiveGasPrice) //So we can discount it from the deployer balance

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      //We get the contract balance after "withdraw"
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(
                          //We get the deployer's balance after "withdraw"
                          deployer
                      )

                  //Assert: Check if the entire fundMe balance is now in the deployer wallet
                  assert.equal(
                      //We check if the deployer's ending balance (minus gas costs) is equal to the total initial balance
                      endingDeployerBalance.add(totalGasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  )
                  assert.equal(endingFundMeBalance.toString(), "0") //And we check if the contract is empty after withdrawing

                  //We also want to check that the funders array is resetted properly
                  await expect(fundMe.getFunder(0)).to.be.reverted //Checking the first position is enough
                  //And that in the mappings the accounts have amountFunded as 0
                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          "0"
                      )
                  }
              })

              it("Only allows the owner to cheaper withdraw", async function () {
                  //Assert: First we want to get the attacker (not owner) account
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )

                  //Act and assert: Run the withdraw function and see if it reverts (it should)
                  await expect(
                      attackerConnectedContract.cheaperWithdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
      })
