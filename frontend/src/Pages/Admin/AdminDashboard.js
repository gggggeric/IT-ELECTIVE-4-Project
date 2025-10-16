import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Status options
  const statusOptions = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];

  useEffect(() => {
    // Use 'currentUser' to match what's stored in login
    const userData = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated && userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      
      // Check if user is admin
      if (userObj.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
        navigate('/dashboard');
        return;
      }
      
      fetchAllAppointments();
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchAllAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/all-appointments');
      const data = await response.json();
      
      if (response.ok) {
        setAppointments(data.appointments);
        setFilteredAppointments(data.appointments);
      } else {
        console.error('Failed to fetch appointments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Appointment ${newStatus.toLowerCase()} successfully!`);
        fetchAllAppointments(); // Refresh the list
      } else {
        alert(`Failed to update appointment: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Error updating appointment status');
    }
  };

  const handleStatusFilterChange = (e) => {
    const filter = e.target.value;
    setStatusFilter(filter);
    
    if (filter === 'All') {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(appointments.filter(apt => apt.status === filter));
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Filter appointments by selected date
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
    setFilteredAppointments(filtered);
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#FFA500';
      case 'Approved': return '#90EE90';
      case 'Rejected': return '#FF6B6B';
      case 'Cancelled': return '#B0B0B0';
      case 'Completed': return '#4CAF50';
      default: return '#FFFFFF';
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user'); // Remove any existing 'user' key as well
    
    // Navigate to login page
    navigate('/');
  };

  // Calendar component
  const Calendar = ({ onDateSelect, selectedDate, appointments }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const navigateMonth = (direction) => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(currentMonth.getMonth() + direction);
      setCurrentMonth(newMonth);
    };

    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const renderCalendarDays = () => {
      const daysInMonth = getDaysInMonth(currentMonth);
      const firstDay = getFirstDayOfMonth(currentMonth);
      const days = [];

      // Empty days for the first week
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
      }

      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dayAppointments = getAppointmentsForDate(date);
        const hasAppointments = dayAppointments.length > 0;
        const isSelected = date.toDateString() === selectedDate.toDateString();
        
        days.push(
          <div
            key={day}
            className={`calendar-day ${hasAppointments ? 'has-appointment' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => onDateSelect(date)}
            style={{
              background: isSelected ? 'rgba(198, 40, 40, 0.5)' : '',
              border: isSelected ? '2px solid #c62828' : ''
            }}
          >
            {day}
            {hasAppointments && <div className="appointment-dot"></div>}
          </div>
        );
      }

      return days;
    };

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}>
            ‹
          </button>
          <h3 className="calendar-month">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}>
            ›
          </button>
        </div>
        
        <div className="calendar-weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div className="calendar-days">
          {renderCalendarDays()}
        </div>
        
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="appointment-dot"></div>
            <span>Has Appointments</span>
          </div>
          <div className="logout-section">
            <div className="admin-welcome">
              Welcome, Admin {user?.username}
            </div>
            <button 
              onClick={handleLogout}
              className="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="dashboard-gradient-background">
        <div className="dashboard-container">
          <div className="dashboard-box equal-box">
            <div style={{ textAlign: 'center', color: 'white' }}>
              Loading Admin Dashboard...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-gradient-background">
      <div className="dashboard-container">
        <div className="dashboard-section">
          <div className="dashboard-layout">
            {/* Left Column - Calendar and Quick Stats */}
            <div className="column">
              <div className="dashboard-box equal-box">
                <h2 className="dashboard-title">Admin Dashboard</h2>
                
                {/* Quick Stats */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 className="dashboard-subtitle">Quick Stats</h3>
                  <div className="admin-stats-grid">
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: '#FFA500' }}>
                        {appointments.filter(apt => apt.status === 'Pending').length}
                      </div>
                      <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: '#90EE90' }}>
                        {appointments.filter(apt => apt.status === 'Approved').length}
                      </div>
                      <div className="stat-label">Approved</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: '#4CAF50' }}>
                        {appointments.filter(apt => apt.status === 'Completed').length}
                      </div>
                      <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: '#FF6B6B' }}>
                        {appointments.filter(apt => apt.status === 'Rejected').length}
                      </div>
                      <div className="stat-label">Rejected</div>
                    </div>
                  </div>
                </div>

                {/* Calendar */}
                <Calendar 
                  onDateSelect={handleDateChange}
                  selectedDate={selectedDate}
                  appointments={appointments}
                />
              </div>
            </div>

            {/* Right Column - Appointments Management */}
            <div className="column">
              <div className="dashboard-box equal-box">
                <h2 className="dashboard-title">Appointments Management</h2>
                
                {/* Filter Controls */}
                <div style={{ marginBottom: '20px' }}>
                  <label>Filter by Status:</label>
                  <select 
                    value={statusFilter} 
                    onChange={handleStatusFilterChange}
                    style={{ marginBottom: '15px' }}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  
                  <div className="status-filters">
                    {statusOptions.filter(s => s !== 'All').map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`status-filter-btn ${statusFilter === status ? 'active' : ''}`}
                        style={{
                          background: statusFilter === status ? getStatusColor(status) : 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appointments List */}
                <div className="history-section">
                  <h3 className="section-title">
                    Appointments ({filteredAppointments.length})
                    {statusFilter !== 'All' && ` - ${statusFilter}`}
                  </h3>
                  
                  <div className="appointments-list">
                    {filteredAppointments.length === 0 ? (
                      <div className="no-appointments">
                        No appointments found
                        {statusFilter !== 'All' && ` with status: ${statusFilter}`}
                      </div>
                    ) : (
                      filteredAppointments.map(appointment => (
                        <div key={appointment._id} className="appointment-item">
                          <div className="appointment-header">
                            <div className="appointment-date">
                              {formatDate(appointment.date)}
                            </div>
                            <div 
                              className="appointment-status"
                              style={{
                                background: `rgba(${getStatusColor(appointment.status).replace('#', '')}, 0.2)`,
                                color: getStatusColor(appointment.status),
                                border: `1px solid ${getStatusColor(appointment.status)}`
                              }}
                            >
                              {appointment.status}
                            </div>
                          </div>
                          
                          <div className="appointment-details">
                            <div>
                              <div className="appointment-time">
                                Time: {appointment.preferred_time}
                              </div>
                              <div className="appointment-concern">
                                Concern: {appointment.concern_type}
                              </div>
                              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '5px' }}>
                                User ID: {appointment.user_id}
                              </div>
                            </div>
                            
                            <div className="appointment-actions">
                              {appointment.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'Approved')}
                                    className="action-btn approve"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'Rejected')}
                                    className="action-btn reject"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {appointment.status === 'Approved' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'Completed')}
                                    className="action-btn complete"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'Cancelled')}
                                    className="action-btn cancel"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {(appointment.status === 'Rejected' || appointment.status === 'Cancelled' || appointment.status === 'Completed') && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, 'Pending')}
                                  className="action-btn reset"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;