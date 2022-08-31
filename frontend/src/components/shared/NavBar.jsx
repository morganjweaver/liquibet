import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

function Navbar() {
  const [connected, toggleConnect] = useState(false);
  const location = useLocation();
  const [currAddress, updateAddress] = useState("");

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    updateAddress(currAddress);
  }, [currAddress]);

  async function checkIfWalletIsConnected() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        const account = accounts[0];
        updateAddress(account);
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

    if (accounts.length === 0) {
      toggleConnect(false);
    } else {
      toggleConnect(true);
    }

    updateAddress(accounts[0]);
  }

  return (
    <div className="bg-primary">
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
              {location.pathname === "/" ? (
                <Link className="border-b-2 p-2" to="/">LiquiBet</Link>
              ) : (
                <Link className="hover:border-b-2 p-2" to="/">LiquiBet</Link>
              )}
              {location.pathname === "/pool" ? (
                <Link className="border-b-2 p-2" to="/pool">Pool</Link>
              ) : (
                <Link className="hover:border-b-2 p-2" to="/pool">Pool</Link>
              )}
              {location.pathname === "/mySFT" ? (
                <Link className="border-b-2 p-2" to="/mySFT">List My SFTs</Link>
              ) : (
                <Link className="hover:border-b-2 p-2" to="/mySFT">List My SFTs</Link>
              )}
              {!connected ? 
                <button
                  className="enableEthereumButton bg-[#B5289E] hover:bg-[#B5289EBB] text-white py-2 px-4 rounded text-sm"
                  onClick={connect}
                >
                  CONNECT WALLET
                </button>
                : 
                <span class="text-[#B5289E] py-2 font-bold">WALLET CONNECTED</span>
              }
            </ul>
          </li>
        </ul>
      </nav>
      <div className="text-bold text-right mr-10 text-sm text-white">
        {currAddress !== "" ? "Connected to" : "Not Connected. Please login."}{" "}
        {currAddress !== ""
          ? currAddress.substring(0, 6) +
            "..." +
            currAddress.substring(currAddress.length - 4)
          : ""}
      </div>
    </div>
  );
}

export default Navbar;
