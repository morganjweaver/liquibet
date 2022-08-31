import React from "react";
import { Link } from "react-router-dom";

function SmallPoolCard({poolId, asset, startDateTime, lockPeriod, imgSrc}) {

  return (
    <div class="px-4 py-3 inline-block w-80 h-200 mx-4 mb-5 mt-8 bg-[#8B47E1] border-2 border-[#8B47E1] rounded font-1 text-white">
      <h1 class="text-center pb-3">POOL {poolId}</h1>
      <div class="text-left">
        <h2>Asset: {asset}</h2>
        <p>Start Date: {startDateTime}</p>
        <p>Lock Period: {lockPeriod}</p>
      </div>
      <img
        src={imgSrc}
        alt=""
        width={60}
        height={60}
        className="my-4 center"
      />
      {/* <button onClick={navigate .push("/pool")}></button> */}
      <div class="text-center">
        <Link to={`/pool/${poolId}`}>View details</Link>
      </div>
    </div>
  );
}

export default SmallPoolCard;
