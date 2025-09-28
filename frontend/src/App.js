import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import TopBar from './Pages/TopBar';  
import Home from './Pages/Home'; 
import Info from './Pages/Info';

function App() {
  return (
    <Router>
      <div className="App">
        <TopBar />  {/* Add the TopBar component */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
               <Route path="/info" element={<Info />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;