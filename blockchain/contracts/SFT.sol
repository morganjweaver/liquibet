// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./interfaces/IERC1155Token.sol";

contract SFT is
    ERC1155,
    Ownable,
    ERC1155Burnable,
    ERC1155Supply,
    KeeperCompatibleInterface
{
    uint8 public constant TIER_1 = 1; // 10% fluctuation
    uint8 public constant TIER_2 = 2; // 17% fluctuaton
    uint8 public constant TIER_3 = 3; // 25% fluctuation
    uint8 public constant TIER_4 = 4; // 35% fluctuation
    uint8 public constant TIER_5 = 5; // 50% fluctuation

    AggregatorV3Interface public pricefeed;

    uint256 interval;
    uint256 public lastTimeStamp;
    int256 public initialPrice;

    mapping(uint256 => string) public _uris;
    mapping(uint8 => bool) private _isLiquidated;

    // id:0 means liquidated, id:5 is healthiest SFT
    string[] public healthUrisIpfs = [
        "https://liquibet.infura-ipfs.io/ipfs/QmTCDNmaz2UGH5e8eRxo5uGK1sx1SEwehvTTiHkMoNMzFk",
        "https://liquibet.infura-ipfs.io/ipfs/Qme4NtSi6Au1Q38tm2LJPK1k3DLCobN1BEfteTgygLtECP",
        "https://liquibet.infura-ipfs.io/ipfs/QmXfpFou3fJGPWnP3AATDLjuUEygRU9MM91vb6Z4fks7Sc",
        "https://liquibet.infura-ipfs.io/ipfs/QmVmuVe4PGxpkHPncacitu5vcM2CEZHxJKaRCFCUuRhby6",
        "https://liquibet.infura-ipfs.io/ipfs/QmPTWcwHHLQMJ1bS63g97Wi4Bngh3Nwc64kGbBjzbFaFV9",
        "https://liquibet.infura-ipfs.io/ipfs/QmeM4ZUihLEqR4JmV613QV466BYMFAEdavQsbPyKe9nwf9"
    ];

    constructor(uint256 updateInterval, address _pricefeed) ERC1155("") {
        interval = updateInterval;
        lastTimeStamp = block.timestamp; //  seconds since unix epoch

        pricefeed = AggregatorV3Interface(_pricefeed);

        // set the price for the chosen currency pair.
        initialPrice = getLatestPrice();

        // all SFTs start with a healthy image
        _uris[TIER_1] = healthUrisIpfs[5];
        _uris[TIER_2] = healthUrisIpfs[5];
        _uris[TIER_3] = healthUrisIpfs[5];
        _uris[TIER_4] = healthUrisIpfs[5];
        _uris[TIER_5] = healthUrisIpfs[5];
    }

    function uri(uint256 id) override public view returns (string memory) {
        return _uris[id];
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) public onlyOwner {
        _mint(to, id, amount, data);
        setTokenUri(id, healthUrisIpfs[5]);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public
      onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    function setTokenUri(uint256 id, string memory newUri) public onlyOwner {
        _uris[id] = newUri;
    }

    // Chainlink functions
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = pricefeed.latestRoundData();

        return price;
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /*performData */
        )
    {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        //We highly recommend revalidating the upkeep in the performUpkeep function
        if ((block.timestamp - lastTimeStamp) > interval) {
            lastTimeStamp = block.timestamp;
            int latestPrice = getLatestPrice();

            if (latestPrice >= initialPrice) {
                return;
            }

            if (latestPrice < initialPrice / 2) {
                console.log("All SFTs get liquidated");
                setTokenUri(TIER_1, healthUrisIpfs[0]);
                setTokenUri(TIER_2, healthUrisIpfs[0]);
                setTokenUri(TIER_3, healthUrisIpfs[0]);
                setTokenUri(TIER_4, healthUrisIpfs[0]);
                setTokenUri(TIER_5, healthUrisIpfs[0]);
                _isLiquidated[TIER_1] = true;
                _isLiquidated[TIER_2] = true;
                _isLiquidated[TIER_3] = true;
                _isLiquidated[TIER_4] = true;
                _isLiquidated[TIER_5] = true;
                return;
            }
            if (latestPrice < (initialPrice / 4) * 3) {
                setTokenUri(TIER_1, healthUrisIpfs[0]);
                setTokenUri(TIER_2, healthUrisIpfs[0]);
                setTokenUri(TIER_3, healthUrisIpfs[0]);
                setTokenUri(TIER_4, healthUrisIpfs[0]);
                if (!_isLiquidated[TIER_5]) {
                    setTokenUri(TIER_5, healthUrisIpfs[1]);
                }
                _isLiquidated[TIER_1] = true;
                _isLiquidated[TIER_2] = true;
                _isLiquidated[TIER_3] = true;
                _isLiquidated[TIER_4] = true;
                return;
            }
            if (latestPrice < (initialPrice / 5) * 4) {
                setTokenUri(TIER_1, healthUrisIpfs[0]);
                setTokenUri(TIER_2, healthUrisIpfs[0]);
                setTokenUri(TIER_3, healthUrisIpfs[0]);
                if (!_isLiquidated[TIER_4]) {
                    setTokenUri(TIER_4, healthUrisIpfs[1]);
                }
                if (!_isLiquidated[TIER_5]) {
                    setTokenUri(TIER_5, healthUrisIpfs[2]);
                }
                _isLiquidated[TIER_1] = true;
                _isLiquidated[TIER_2] = true;
                _isLiquidated[TIER_3] = true;
                return;
            }
            if (latestPrice < (initialPrice / 10) * 9) {
                setTokenUri(TIER_1, healthUrisIpfs[0]);
                setTokenUri(TIER_2, healthUrisIpfs[0]);
                if (!_isLiquidated[TIER_3]) {
                    setTokenUri(TIER_3, healthUrisIpfs[1]);
                }
                if (!_isLiquidated[TIER_4]) {
                    setTokenUri(TIER_4, healthUrisIpfs[2]);
                }
                if (!_isLiquidated[TIER_5]) {
                    setTokenUri(TIER_5, healthUrisIpfs[3]);
                }
                _isLiquidated[TIER_1] = true;
                _isLiquidated[TIER_2] = true;
                return;
            }
            if (latestPrice < (initialPrice / 20) * 19) {
                setTokenUri(TIER_1, healthUrisIpfs[0]);
                if (!_isLiquidated[TIER_2]) {
                    setTokenUri(TIER_2, healthUrisIpfs[1]);
                }
                if (!_isLiquidated[TIER_3]) {
                    setTokenUri(TIER_3, healthUrisIpfs[2]);
                }
                if (!_isLiquidated[TIER_4]) {
                    setTokenUri(TIER_4, healthUrisIpfs[3]);
                }
                if (!_isLiquidated[TIER_5]) {
                    setTokenUri(TIER_5, healthUrisIpfs[4]);
                }
                _isLiquidated[TIER_1] = true;
                return;
            }
        } else {
            return;
        }
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        ERC1155Supply._beforeTokenTransfer(
            operator,
            from,
            to,
            ids,
            amounts,
            data
        );
    }
}
