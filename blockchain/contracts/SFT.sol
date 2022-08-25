// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract SFT is ERC1155, Ownable, ERC1155Burnable, KeeperCompatibleInterface {
    uint8 public constant TIER_1 = 1; // 10% fluctuation
    uint8 public constant TIER_2 = 2; // 17% fluctuaton
    uint8 public constant TIER_3 = 3; // 25% fluctuation
    uint8 public constant TIER_4 = 4; // 35% fluctuation
    uint8 public constant TIER_5 = 5; // 50% fluctuation

    AggregatorV3Interface public pricefeed;

    uint256 interval;
    uint256 public lastTimeStamp;
    int256 public initialPrice;

    mapping(uint256 => string) private _uris;
    mapping(uint8 => bool) private _isLiquidated;

    // id:0 means liquidated, id:5 is healthiest SFT
    string[] healthUrisIpfs = [
        "https://ipfs.io/ipfs/QmTppFVUw434kCXN393qAKzhZAvTiywB1hv1xKa1xQxPEo/0.json",
        "https://ipfs.io/ipfs/QmTppFVUw434kCXN393qAKzhZAvTiywB1hv1xKa1xQxPEo/1.json",
        "https://ipfs.io/ipfs/QmTppFVUw434kCXN393qAKzhZAvTiywB1hv1xKa1xQxPEo/2.json",
        "https://ipfs.io/ipfs/QmTppFVUw434kCXN393qAKzhZAvTiywB1hv1xKa1xQxPEo/3.json",
        "https://ipfs.io/ipfs/QmTppFVUw434kCXN393qAKzhZAvTiywB1hv1xKa1xQxPEo/4.json",
        "https://ipfs.io/ipfs/QmTppFVUw434kCXN393qAKzhZAvTiywB1hv1xKa1xQxPEo/5.json"
    ];

    constructor(uint256 updateInterval, address _pricefeed) ERC1155("") {
        interval = updateInterval;
        lastTimeStamp = block.timestamp; //  seconds since unix epoch

        pricefeed = AggregatorV3Interface(_pricefeed);

        // set the price for the chosen currency pair.
        initialPrice = getLatestPrice();

        // all STFs start with an healthy image
        _uris[TIER_1] = healthUrisIpfs[5];
        _uris[TIER_2] = healthUrisIpfs[5];
        _uris[TIER_3] = healthUrisIpfs[5];
        _uris[TIER_4] = healthUrisIpfs[5];
        _uris[TIER_5] = healthUrisIpfs[5];
    }

    function uri(uint256 id) public view override returns (string memory) {
        return _uris[id];
    }

    function buySFT(uint256 id) public {
        _mint(msg.sender, id, 1, "");
    }

    function setTokenUri(uint256 id, string memory newUri) public {
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
                console.log("NO LIQUIDATION -> returning!");
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
            if (latestPrice < initialPrice / 4) {
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
            if (latestPrice < initialPrice / 5) {
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
            if (latestPrice < initialPrice / 10) {
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
            if (latestPrice < initialPrice / 20) {
                console.log("All SFTs get liquidated");
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
            console.log(" INTERVAL NOT UP!");
            return;
        }
    }
}
