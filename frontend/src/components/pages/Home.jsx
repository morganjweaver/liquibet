import React, { useEffect, useState } from "react";
import agent from "../../agent";
import NftListItem from "../NftListItem";

function Home() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const getData = async () => {
      const data = await agent.File.list();
      setItems(data);
    };
    getData();
  }, []);

  return (
    <div class="bg-black px-2 grid grid-flow-row grid-cols-5 grid-rows-2 justify-center items-center pt-5 text-white">
      {items &&
        items.map((item) => <NftListItem key={item.fileId} item={item} />)}
    </div>
  );
}

export default Home;
