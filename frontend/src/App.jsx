import { Routes, Route } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Vote from "./pages/Vote";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      
      <Header />

      <main className="flex-1 flex">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/vote/:id" element={<Vote />} />
          <Route path="*" element={<div className="m-auto text-white text-xl">Page not found</div>} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
