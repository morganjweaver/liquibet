import Header from "./shared/Header";
import NotFound from "./shared/NotFound";
import Home from "./pages/Home";
import Pool from "./pages/Pool";
import MySFT from "./pages/MySFT";
import Footer from "./shared/Footer";
import NavBar from "./shared/NavBar";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Fragment } from "react";

function App() {
  return (
    <Fragment>
    <div class="px-16 bg-primary h-screen">
      <NavBar />
      <ToastContainer position="bottom-right" />
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="mySFT" element={<MySFT />} />
          <Route path="pool/:id" element={<Pool />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {/* <Footer /> */}
    </Fragment>
  );
}

export default App;
