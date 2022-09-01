import React from "react";
import { Link } from "react-router-dom";

function SmallPoolCard({poolId, asset, startDateTime, lockPeriod, imgSrc}) {

  return (
    <div className="backdrop-1 px-4 py-3 inline-block w-96 h-200 mx-4 mb-5 mt-8 bg-[#8B47E1] border-2 border-[#8B47E1] rounded font-1 text-white">
      <h1 className="text-center pb-3">POOL {poolId}</h1>
      <div className="text-left">
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
      <div className="text-center">
        <Link to={`/pool/${poolId}`}>View details</Link>
      </div>
    </div>
  );
}

export default SmallPoolCard;
