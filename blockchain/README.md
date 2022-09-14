# LiquiBet: A Mutating NFT Asset Derivatives with Gambling and Lottery Mechanics

Chainlink x Encode Hackathon 2022

Morgan Weaver, Thomas Gehrmann, Stjepan Horvat, Solene Daviaud

Concept:

Crypto winter is upon us; why not gamble, degens? 

LiquiBet is an SFT gambling token and objet d'art based on ERC-1155.  Players choose a fungible token, such as BTC or MATIC, known as the ‘representational asset’ of the SFT, thereby ‘betting’ on the future of the coin.  Purchase is with a stablecoin such as DAI.  A betting period lasts for a set duration, such as one month, and the SFT doubles as the gambling contract, though the user must elect to enter the contract after token purchase, affording secondary market and derivative opportunities.  

The SFT image changes regularly depending on the price fluctuation of the representational token, and ranges from 'healthy' to 'liquidated' on a 6-point scale.  A Chainlink oracle tracks asset price, and updates the token image accordingly. All images were created with Midjourney to illustrate a cyberpunk motif.

Buy-in is set at one of five price tiers.  Higher buy-ins have greater price drop requirements to be liquidated.  When a contract gets liquidated, the buy-in is distributed to the higher tier players. 

What about the lowest tier, which receives no payouts?  All contracts double as a lottery ticket, with Chainlink VRF for fairness, with the lowest buy-in tier acting as the best deal on these lottery payouts as a compromise for the lack of liquidation payout. 

These dynamics of our v1 MVP offer at least two strategies for low-tier and high-tier buy-ins: play the lottery cheaply, or cash in on liquidations. 

What if a market crashes and all contracts are liquidated?  The payout is re-invested in the next lottery pool as incentivization for the next gambling lock-in period.


Setup:

See env.example, and ask Morgan for the Chainlink Randomness subscription ID.