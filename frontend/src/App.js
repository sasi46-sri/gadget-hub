import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompareTray from "@/components/CompareTray";
import HomePage from "@/pages/HomePage";
import BrowsePage from "@/pages/BrowsePage";
import GadgetDetailPage from "@/pages/GadgetDetailPage";
import ComparePage from "@/pages/ComparePage";
import WishlistPage from "@/pages/WishlistPage";

function App() {
  return (
    <div className="App relative min-h-screen">
      <BrowserRouter>
        <AuthProvider>
          <CompareProvider>
            <WishlistProvider>
              <Navbar />
              <main className="relative z-10">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/browse" element={<BrowsePage />} />
                  <Route path="/gadgets/:id" element={<GadgetDetailPage />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </main>
              <Footer />
              <CompareTray />
              <Toaster
                theme="dark"
                position="bottom-left"
                toastOptions={{
                  style: {
                    background: "rgba(18,18,20,0.95)",
                    border: "1px solid rgba(0,240,255,0.25)",
                    color: "#fff",
                    fontFamily: "Outfit, sans-serif",
                  },
                }}
              />
            </WishlistProvider>
          </CompareProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
