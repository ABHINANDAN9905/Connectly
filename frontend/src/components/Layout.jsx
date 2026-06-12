import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children, showSidebar = false }) => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith("/chat");

  return (
    <div className={isChatPage ? "h-screen flex flex-col overflow-hidden" : "min-h-screen flex flex-col"}>
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}

        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />

          <main
            className={`flex-1 ${
              isChatPage
                ? "overflow-hidden h-[calc(100dvh-4rem)]"
                : "overflow-y-auto"
            }`}
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