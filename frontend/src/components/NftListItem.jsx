import React from "react";

function NftListItem(item) {
  const file = item.item.metadata;
  return (
    <div className="justify-center items-center mx-2 mb-5 border-2 border-pink-200 rounded">
      <div className="text-center">
        <p>{file.name}</p>
        <p>{file.description}</p>
      </div>
      <img
        className="mt-2 rounded shadow-xl"
        src={`https://${file.image}`}
        style={{ height: "320px" }}
        alt=""
      />
    </div>
  );
}

export default NftListItem;
