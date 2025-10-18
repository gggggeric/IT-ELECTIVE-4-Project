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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Status options
  const statusOptions = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];

  useEffect(() => {
    checkAuthentication();
  }, [navigate]);

  const checkAuthentication = () => {
    const userData = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated && userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      
      // Check if user is admin
      if (userObj.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }
      
      fetchAllAppointments();
    } else {
      navigate('/');
    }
  };

  const fetchAllAppointments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('http://localhost:5000/all-appointments');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setAppointments(data.appointments || []);
        applyFilters(data.appointments || [], statusFilter, selectedDate);
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setError('');
      
      // Client-side validation for pending appointments
      const appointment = appointments.find(apt => apt._id === appointmentId);
      if (appointment && appointment.status === 'Pending' && !['Approved', 'Rejected'].includes(newStatus)) {
        setError('Pending appointments can only be approved or rejected.');
        alert('Error: Pending appointments can only be approved or rejected.');
        return;
      }

      const response = await fetch(`http://localhost:5000/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state instead of refetching all appointments
        setAppointments(prevAppointments => 
          prevAppointments.map(apt => 
            apt._id === appointmentId 
              ? { ...apt, status: newStatus }
              : apt
          )
        );
        
        // Update filtered appointments as well
        setFilteredAppointments(prevFiltered => 
          prevFiltered.map(apt => 
            apt._id === appointmentId 
              ? { ...apt, status: newStatus }
              : apt
          )
        );
        
        // Show success message
        alert(`Appointment ${newStatus.toLowerCase()} successfully!`);
      } else {
        throw new Error(data.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(error.message);
      alert(`Error: ${error.message}`);
    }
  };

  const applyFilters = (appts, statusFilter, date) => {
    let filtered = appts;
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    // Apply date filter
    if (date) {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === date.toDateString();
      });
    }
    
    setFilteredAppointments(filtered);
  };

  const handleStatusFilterChange = (e) => {
    const filter = e.target.value;
    setStatusFilter(filter);
    applyFilters(appointments, filter, selectedDate);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    applyFilters(appointments, statusFilter, date);
  };

  const handleStatusFilterClick = (status) => {
    setStatusFilter(status);
    applyFilters(appointments, status, selectedDate);
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
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
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

  if (error && error.includes('Access denied')) {
    return (
      <div className="dashboard-gradient-background">
        <div className="dashboard-container">
          <div className="dashboard-box equal-box">
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ color: '#ff6b6b', marginBottom: '20px' }}>{error}</div>
              <p>Redirecting to user dashboard...</p>
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
                <div className="admin-header">
                  <h2 className="dashboard-title">Admin Dashboard</h2>
                  <div className="admin-welcome">
                    Welcome, {user?.username}
                    <button onClick={handleLogout} className="logout-btn">
                      Logout
                    </button>
                  </div>
                </div>
                
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
                
                {error && !error.includes('Access denied') && (
                  <div className="error-message" style={{ 
                    background: 'rgba(255, 107, 107, 0.2)', 
                    color: '#FF6B6B', 
                    padding: '10px', 
                    borderRadius: '5px', 
                    marginBottom: '15px',
                    border: '1px solid #FF6B6B'
                  }}>
                    {error}
                  </div>
                )}
                
                {/* Filter Controls */}
                <div style={{ marginBottom: '20px' }}>
                  <div className="filter-controls">
                    <label>Filter by Status:</label>
                    <select 
                      value={statusFilter} 
                      onChange={handleStatusFilterChange}
                      className="status-select"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="status-filters">
                    {statusOptions.filter(s => s !== 'All').map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusFilterClick(status)}
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
                    {selectedDate && ` - ${selectedDate.toLocaleDateString()}`}
                  </h3>
                  
                  <div className="appointments-list">
                    {filteredAppointments.length === 0 ? (
                      <div className="no-appointments">
                        No appointments found
                        {statusFilter !== 'All' && ` with status: ${statusFilter}`}
                        {selectedDate && ` on ${selectedDate.toLocaleDateString()}`}
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
                            <div className="appointment-info">
                              <div className="appointment-time">
                                <strong>Time:</strong> {appointment.preferred_time}
                              </div>
                              <div className="appointment-concern">
                                <strong>Concern:</strong> {appointment.concern_type}
                              </div>
                              <div className="appointment-user">
                                <strong>Student:</strong> {appointment.user_info?.username || 'Unknown'} 
                                ({appointment.user_info?.id_number || 'N/A'})
                              </div>
                              <div className="appointment-created">
                                <strong>Scheduled:</strong> {new Date(appointment.created_at).toLocaleString()}
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
                              {(appointment.status === 'Rejected' || appointment.status === 'Cancelled') && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, 'Pending')}
                                  className="action-btn reset"
                                >
                                  Reset to Pending
                                </button>
                              )}
                              {appointment.status === 'Completed' && (
                                <div className="completed-text" style={{color: '#4CAF50', fontStyle: 'italic'}}>
                                  Completed - No actions available
                                </div>
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