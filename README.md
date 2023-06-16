# AtomicSwap

Atomic Swap: An exchange of tokens from separate users without transfering tokens from one user to another.
Order: An offer to exchange quantity X of token A for quantity Y of token B. Tokens offered are sent to the contract address.
Maker: A user that makes or initiates an order.
Taker: The counterparty who takes or responds to an order.

# Properties

Guarantee of exchange: no occurence of a user receiving tokens without the equivalent promised exchange.
Refundable: tokens are refunded by escrow when a timeout occurs, or when an order is cancelled.
Order cancellation: orders without takers can be cancelled.
Basic orderbook: a store of orders functioning as an orderbook system.
Atomicity: an exchange of one token for another where it is either a total success or a total failure.

# Features

A maker offers token A in exchange for token B by making an order. The order specifies the quantity and price of exchange, and sends the offered token A to the contract address. Any taker with token B can accept the offer by taking the order. The taker sends the desired amount of token B to the contract address. The contract transfers the corresponding token amounts to each user's receiving address.
An order without takers can be cancelled. This enables users to rectify mistakes, such as inputting an incorrect price or taker address. Upon cancellation escrowed tokens will be refunded.
When making or taking an order, a timeout is specified. A timeout will result in escrowed tokens refunded back. This timeout is customizable.

```shell
npx hardhat help
npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
