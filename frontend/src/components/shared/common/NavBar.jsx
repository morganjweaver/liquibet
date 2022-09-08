import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import CustomNavLink from "./CustomNavLink";

function Navbar() {
  const [connected, toggleConnect] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  async function checkIfWalletIsConnected() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        toggleConnect(true);
        return;
      }
    }
  }

  async function connect() {
    if (!window.ethereum) {
      alert("Get MetaMask!");
      return;
    }

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== "0x5") {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x5" }],
      });
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    toggleConnect(accounts.length > 0);
  }

  return (
    <div>
      <nav>
        <ul className="flex items-end justify-between py-3 bg-transparent pr-5 text-white">
          <li className="flex items-end ml-5 pb-2">
            <Link to="/">
              <img
                src="/images/liquibet-logo.png"
                alt=""
                width={120}
                height={120}
                className="inline-block -mt-2"
              />
            </Link>
          </li>
          <li className="w-2/6">
            <ul className="lg:flex justify-between mr-10 text-lg navbar-links">
              <CustomNavLink text="LiquiBet" to="/" />
              <CustomNavLink text="My SFTs" to="/mySFTs" />
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
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Navbar;
