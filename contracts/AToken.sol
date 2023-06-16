// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AToken is ERC20, Ownable {
    constructor() ERC20("AToken", "ATK") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

// contract AToken is ERC20 {
//     constructor(
//         string memory name,
//         string memory symbol,
//         uint256 initialSupply
//     ) ERC20(name, symbol) {
//         _mint(msg.sender, initialSupply);
//     }
// }
