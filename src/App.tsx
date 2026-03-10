import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Main from "./pages/Main";
import Admin from "./pages/Admin";
import "./App.css";

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="App">
        <nav className="App-nav">
          <Link to="/" className="nav-link">
            Главная
          </Link>
          <Link to="/admin" className="nav-link">
            Админ
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
