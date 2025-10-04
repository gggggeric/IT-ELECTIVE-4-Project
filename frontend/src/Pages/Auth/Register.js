import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css'; // Using the same CSS file

const Register = () => {
  const [formData, setFormData] = useState({
    idNumber: '',
    password: '',
    confirmPassword: '',
    birthdate: ''
  });

  const [passwordStrength, setPasswordStrength] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Check password strength when password changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) {
      setPasswordStrength('');
      return;
    }

    if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (password.length < 10) {
      setPasswordStrength('medium');
    } else {
      // Check for complexity
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      const complexityScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
      
      if (complexityScore >= 3) {
        setPasswordStrength('strong');
      } else {
        setPasswordStrength('medium');
      }
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    
    // Handle registration logic here
    console.log('Registration data:', formData);
    alert('Registration functionality would be implemented here!');
  };

  const handleClearForm = () => {
    setFormData({
      idNumber: '',
      password: '',
      confirmPassword: '',
      birthdate: ''
    });
    setPasswordStrength('');
  };

  return (
    <div className="home-container">
      <section className="login-section">
        <div className="login-box">
          <h2 className="login-title">TUPT Counseling Scheduler</h2>
          <div className="login-subtitle">Create New Account</div>
          
          <form onSubmit={handleRegisterSubmit}>
            <div>
              <label htmlFor="idNumber">ID Number</label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                placeholder="Enter your ID number"
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
            
            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                required
              />
              {passwordStrength && (
                <div className={`password-strength strength-${passwordStrength}`}></div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <div className="buttons">
              <button type="button" className="btn-clear" onClick={handleClearForm}>
                Clear
              </button>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Link to="/" style={{ fontSize: '13px', color: 'white' }}>Back to Login</Link>
                <button type="submit" className="btn-login">
                  Register
                </button>
              </div>
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

export default Register;