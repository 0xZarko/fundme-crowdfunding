// - Solidity Style Guide - //
// - First: SPDX and pragma - //
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// - Second: Imports - //
//We import the new library PriceConverter we created
import "./PriceConverter.sol";

// - Third: Error codes - //
error FundMe__NotOwner(); //It's good practice to add the name of the contract to know who threw the error

// - Fourth: Interfaces and libraries (NOT IMPORTED) - //
//In this case we don't have any

// - Fifth: Contracts - //
/** @title A contract for crowdfunding
 * 	@author Zarko
 * 	@notice This contract is to demo a sample funding contract
 *	@dev This implements Price Feeds as our library
 */
contract FundMe {
    // -- Solidity Style Guide: Contracts -- //
    // -- First: Type Declarations -- //
    using PriceConverter for uint256; //This means all PriceConverter library functions are designed to work with uint256 values
    //After adding this line we can use things like msg.value.getConversionRate();

    // -- Second: State Variables -- //
    uint256 public constant MINIMUM_USD = 50 * 1e18; //Adding the constant keyword means it cannot be modified anywhere else, nevertheless we save on
    //deployment gas because it doesn't take storage space anymore. Constant values have a different naming convention
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner; //We can specify the owner of this contract
    AggregatorV3Interface private s_priceFeed; //we create a global variable to modularize the price feed selection

    // -- Third: Events -- //

    // -- Fourth: Modifiers -- //
    modifier onlyOwner() {
        //A modifier is a piece of code that executes when calling a function that has the designed keyword in its declaration
        //require(msg.sender == i_owner, "Caller is not owner."); //This gets executed first
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _; //Then this gets executed (this syntax means "Execute the function code")
    }

    // -- Fifth: Functions -- //

    //The constructor is the function that's called immediatly after deploying the contract
    constructor(address priceFeedAddress) {
        //We can pass arguments to the constructor to make it easier for us to deploy with different configurations
        i_owner = msg.sender; //Whoever deploys this contract gets automatically selected as its owner
        s_priceFeed = AggregatorV3Interface(priceFeedAddress); //Now we can select different priceFeed contracts depending on which chain we are deploying
    }

    //What happens if someone sends this contract eth without calling the fund function or if someone calls a function that doesn't exists
    //There are two functions for these cases: the receive function and the fallback function
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     *  @notice This function funds the contract
     *	@dev This implements Price Feeds as our library
     */
    function fund() public payable {
        //The keyword payable means this function can receive ETH through the msg.value
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough!"
        ); //We can directly use the function from the variable with the library import
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender); //msg.sender has the address of whoever called the function
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++ //Loop that resets the mapping of (address => funds provided)
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0); //We reset the funders array so it has no elements again. The 0 means the new array has 0 elements in it

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed.");
    }

    function cheaperWithdraw() public payable onlyOwner {
        //By copying the funders address into memory first before reading from it, we save a ton of gas
        address[] memory funders = s_funders; //Mappings can't be in memory
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++ //Loop that resets the mapping of (address => funds provided)
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0; //This is unavoidable, mappings can't be in memory
        }

        s_funders = new address[](0); //We reset the funders array so it has no elements again. The 0 means the new array has 0 elements in it

        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    //We make the getter functions so we can make variables private and save some gas
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
