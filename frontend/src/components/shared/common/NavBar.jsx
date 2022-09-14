import { Link } from "react-router-dom";
import ConnectWallet from "./ConnectWallet";
import CustomNavLink from "./CustomNavLink";

function Navbar() {
  return (
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
            <ConnectWallet />
          </ul>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
