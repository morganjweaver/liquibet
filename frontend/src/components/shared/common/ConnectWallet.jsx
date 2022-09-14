import { useEffect, useState } from "react";
import { isWalletConnected, connectWallet } from "../../../services/blockchainService";

function ConnectWallet() {
  const [connected, toggleConnect] = useState(false);

  useEffect(() => {
    (async () => {
      toggleConnect(await isWalletConnected());
    })();
  }, []);

  async function connect() {
    toggleConnect(await connectWallet());
  }

  return (
    <>
      {!connected ? 
        <button
          className="enableEthereumButton backdrop-1-sm bg-[#B5289E] hover:bg-[#B5289EBB] text-white py-2 px-4 rounded text-sm"
          onClick={connect}
        >
          CONNECT WALLET
        </button>
        : 
        <span className="text-[#B5289E] py-2 font-bold">CONNECTED</span>
      }
    </>
  )
}

export default ConnectWallet