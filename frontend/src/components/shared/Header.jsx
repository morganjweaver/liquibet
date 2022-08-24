import React from "react";

function Header() {
  return (
    <header className="sticky top-0 z-50 px-2 py-2 text-center bg-black"
            style={{ borderBottom: "2px dashed pink"}}>
      <img
        src="/images/lazer-logo-2.png"
        alt="logo"
        style={{ height: "52px", display: "inline-block" }}
      />
    </header>
  );
}

export default Header;
