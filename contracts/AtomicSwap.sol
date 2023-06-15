// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AtomicSwap {
    enum SwapMessageType {
        TYPE_UNSPECIFIED,
        TYPE_MSG_MAKE_SWAP,
        TYPE_MSG_TAKE_SWAP,
        TYPE_MSG_CANCEL_SWAP
    }

    enum Status {
        INITIAL,
        SYNC,
        CANCEL,
        COMPLETE
    }

    struct Coin {
        address token;
        uint256 amount;
    }

    struct MakeSwapMsg {
        Coin sellToken;
        Coin buyToken;
        // the maker's address
        address makerAddress;
        // the maker's address on the taker chain
        address makerReceivingAddress;
        // if desiredTaker is specified,
        // only the desiredTaker is allowed to take this order
        // this is the address on the taker chain
        address desiredTaker;
        uint256 creationTimestamp;
        uint256 expirationTimestamp;
    }

    struct TakeSwapMsg {
        uint8 orderId;
        // the tokens to be sold
        Coin sellToken;
        // the taker's address
        address takerAddress;
        // the taker's address on the maker chain
        address takerReceivingAddress;
        uint256 creationTimestamp;
    }

    struct CancelSwapMsg {
        uint8 orderId;
        address makerAddress;
    }

    struct Order {
        uint8 id;
        MakeSwapMsg maker;
        Status status;
        TakeSwapMsg taker;
        uint256 cancelTimestamp;
        uint256 completeTimestamp;
    }

    event MakeSwapMsgEvent(
        uint8 indexed id,
        address makerAddress,
        Coin sellToken,
        Coin buyToken,
        address desiredTaker,
        uint256 creationTimestamp,
        uint256 expirationTimestamp,
        SwapMessageType
    );

    event TakeSwapMsgEvent(
        uint8 indexed id,
        address takerAddress,
        Coin sellToken,
        uint256 creationTimestamp,
        SwapMessageType
    );

    event CancelSwapMsgEvent(
        uint8 indexed id,
        address makerAddress,
        uint256 cancelTimestamp,
        SwapMessageType
    );

    uint8 private orderID;
    mapping(uint8 => Order) public orders;

    modifier onlyMaker(uint8 orderId) {
        Order storage order = orders[orderId];
        require(
            order.maker.makerAddress == msg.sender,
            "Only maker can cancel"
        );
        _;
    }

    function makeSwap(
        Coin memory sellToken,
        Coin memory buyToken,
        address makerReceivingAddress,
        address desiredTaker,
        uint256 expirationTimestamp
    ) public {
        require(
            sellToken.token != address(0),
            "SellToken should not be zero address"
        );
        require(
            sellToken.amount > 0,
            "SellToken mount should not be zero amount"
        );
        require(
            buyToken.amount > 0,
            "buyToken mount should not be zero amount"
        );
        require(
            buyToken.token != address(0),
            "buyToken should not be zero address"
        );

        require(
            makerReceivingAddress != address(0),
            "MakerReceivingAddress should not be zero address"
        );
        require(
            desiredTaker != address(0),
            "DesiredTaker should not be zero address"
        );
        require(
            expirationTimestamp > block.timestamp,
            "ExpirationTimestamp should be greater than zero"
        );

        MakeSwapMsg memory makeSwapMsg = MakeSwapMsg({
            sellToken: sellToken,
            buyToken: buyToken,
            makerAddress: msg.sender,
            makerReceivingAddress: makerReceivingAddress,
            desiredTaker: desiredTaker,
            creationTimestamp: block.timestamp,
            expirationTimestamp: expirationTimestamp
        });

        orders[orderID] = Order({
            id: orderID,
            maker: makeSwapMsg,
            status: Status.INITIAL,
            taker: TakeSwapMsg({
                orderId: 0,
                sellToken: Coin({token: address(0), amount: 0}),
                takerAddress: address(0),
                takerReceivingAddress: address(0),
                creationTimestamp: 0
            }),
            cancelTimestamp: 0,
            completeTimestamp: 0
        });

        orderID++;

        IERC20(makeSwapMsg.sellToken.token).transferFrom(
            msg.sender,
            address(this),
            makeSwapMsg.sellToken.amount
        );

        emit MakeSwapMsgEvent(
            orderID,
            msg.sender,
            sellToken,
            buyToken,
            desiredTaker,
            block.timestamp,
            expirationTimestamp,
            SwapMessageType.TYPE_MSG_MAKE_SWAP
        );
    }

    function takeSwap(
        uint8 orderId,
        Coin memory sellToken,
        address takerReceivingAddress
    ) public {
        require(orderId > 0, "OrderId should not be zero");
        require(
            sellToken.token != address(0),
            "SellToken should not be zero address"
        );
        require(
            sellToken.amount > 0,
            "SellToken mount should not be zero amount"
        );
        require(
            takerReceivingAddress != address(0),
            "MakerReceivingAddress should not be zero address"
        );

        Order storage order = orders[orderId];
        MakeSwapMsg memory makeSwapMsg = order.maker;
        require(
            makeSwapMsg.expirationTimestamp >= block.timestamp,
            "Order has expired"
        );
        require(order.status == Status.INITIAL, "Order cannot be sync");
        require(makeSwapMsg.desiredTaker == msg.sender, "Invaild taker");
        require(makeSwapMsg.buyToken.token == sellToken.token, "Invaild token");
        require(
            makeSwapMsg.buyToken.amount == sellToken.amount,
            "Invaild token amount"
        );

        IERC20(sellToken.token).transferFrom(
            msg.sender,
            address(this),
            sellToken.amount
        );

        order.status = Status.SYNC;
        order.taker = TakeSwapMsg({
            orderId: orderID,
            sellToken: sellToken,
            takerAddress: msg.sender,
            takerReceivingAddress: takerReceivingAddress,
            creationTimestamp: block.timestamp
        });

        emit TakeSwapMsgEvent(
            orderID,
            msg.sender,
            sellToken,
            block.timestamp,
            SwapMessageType.TYPE_MSG_TAKE_SWAP
        );

        // Start send sellToken and buyToken to receiving addresses
        IERC20(makeSwapMsg.sellToken.token).transfer(
            takerReceivingAddress,
            makeSwapMsg.sellToken.amount
        );
        IERC20(sellToken.token).transfer(
            makeSwapMsg.makerReceivingAddress,
            sellToken.amount
        );

        order.status = Status.COMPLETE;
        order.completeTimestamp = block.timestamp;
    }

    function cancelSwap(uint8 orderId) public onlyMaker(orderId) {
        require(orderId > 0, "OrderId should not be zero");
        Order storage order = orders[orderId];
        require(order.status == Status.INITIAL, "Order cannot be cancelled");

        MakeSwapMsg memory makeSwapMsg = order.maker;
        IERC20(makeSwapMsg.sellToken.token).transfer(
            makeSwapMsg.makerReceivingAddress,
            makeSwapMsg.sellToken.amount
        );

        order.status = Status.CANCEL;
        order.cancelTimestamp = block.timestamp;

        emit CancelSwapMsgEvent(
            orderId,
            msg.sender,
            block.timestamp,
            SwapMessageType.TYPE_MSG_CANCEL_SWAP
        );
    }
}
