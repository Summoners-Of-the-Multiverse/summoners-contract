// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {Proxy} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradables/Proxy.sol";

contract SotmProxy is Proxy {
    function contractId()
        internal
        pure
        override
        returns (bytes32)
    {
        // need to change this id when re-deploy
        return keccak256("sotm_linker3");
    }
}
