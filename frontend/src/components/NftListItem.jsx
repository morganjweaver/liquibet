import React from "react";
import { Link } from "react-router-dom";

function NftListItem({ image, tier, amount, tokenId }) {
  // const file = item.item.metadata;
  return (
    <div className="justify-center items-center text-center mx-2 mb-5 border-2 border-pink-400 rounded">
      <div className="text-center">
        <p>Tier {tier}</p>
        <p>Amount: {amount}</p>
      </div>
      <img
        className="mt-2 rounded shadow-xl"
        src={image}
        style={{ height: "320px" }}
        alt=""
      />
      <div className="p-2">
        <Link to={`/sft/${tokenId}`}>View details</Link>
      </div>
    </div>
  );
}

export default NftListItem;
