import React from "react";
import SmallPoolCard from "../shared/SmallPoolCard";

function Home() {
  return (
    <div className="px-16 bg-primary h-screen-minus">
      <h1 className="text-4xl font-1 font-bold font-size-headline color-1">LIQUIBET</h1>
      <h2 className="mt-8 text-4xl text-white font-1 font-bold font-size-headline">
        Buy, bet, and don't get liquidated!
      </h2>
      <p className="mt-8 text-white font-1">
        A dynamic SFT Asset Derivative with Gambling and Lottery Mechanics
      </p>
      <SmallPoolCard />
    </div>
  );
}

export default Home;
