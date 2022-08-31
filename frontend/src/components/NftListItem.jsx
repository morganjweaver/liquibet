import React from "react";

function NftListItem({ image, tier, amount }) {
  // const file = item.item.metadata;
  return (
    <div className="justify-center items-center mx-2 mb-5 border-2 border-pink-200 rounded">
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
    </div>
  );
}

export default NftListItem;
