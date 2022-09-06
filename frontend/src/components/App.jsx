import Header from "./shared/Header";
import NotFound from "./shared/NotFound";
import Home from "./pages/Home";
import PoolDetails from "./pages/PoolDetails";
import MySFTs from "./pages/MySFTs";
import SftDetails from "./pages/SftDetails";
import Footer from "./shared/Footer";
import NavBar from "./shared/NavBar";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Fragment } from "react";

function App() {
  return (
    <Fragment>
    <div className="px-16 bg-primary h-screen">
      <NavBar />
      <ToastContainer position="bottom-right" />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="mySFTs" element={<MySFTs />} />
          <Route path="pool/:id" element={<PoolDetails />} />
          <Route path="sft/:id" element={<SftDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {/* <Footer /> */}
    </Fragment>
  );
}

export default App;
