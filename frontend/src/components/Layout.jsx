import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children, showSidebar = false }) => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/chat");

  return (
    <div
      style={
        isChatPage
          ? { height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }
          : {}
      }
      className={!isChatPage ? "min-h-screen flex flex-col" : ""}
    >
      <Navbar />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {showSidebar && <Sidebar />}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <main
            style={{
              flex: 1,
              minHeight: 0,
              overflow: isChatPage ? "hidden" : "auto",
            }}
          >
            {children}
          </main>
        </div>
      </div>

      {!isChatPage && <Footer />}
    </div>
  );
};

export default Layout;