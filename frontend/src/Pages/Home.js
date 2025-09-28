import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    birthdate: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login data:', formData);
    alert('Login functionality would be implemented here!');
  };

  const handleClearForm = () => {
    setFormData({
      username: '',
      password: '',
      birthdate: ''
    });
  };

  return (
    <div className="home-container">
      <section className="login-section">
        <div className="login-box">
          <h2 className="login-title">TUPT Counseling Scheduler</h2>
          <div className="login-subtitle">User Authentication</div>
          
          <form onSubmit={handleLoginSubmit}>
            <div>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <div>
              <label htmlFor="birthdate">Birthdate</label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="buttons">
              <button type="button" className="btn-clear" onClick={handleClearForm}>
                Clear
              </button>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <a href="#forgot" style={{ fontSize: '13px' }}>Forgot Password?</a>
                <button type="submit" className="btn-login">
                  Login
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <a href="#create-account" style={{ fontSize: '13px' }}>
                Create New Account
              </a>
            </div>
          </form>

          {/* For more information link */}
          <div className="more-info-container">
            <Link to="/info" className="more-info-link">
              For more information click here
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;