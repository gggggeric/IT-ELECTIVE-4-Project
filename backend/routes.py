from flask import jsonify, request
from database import find_user_by_username, find_user_by_id_number, insert_user, insert_appointment, find_appointments_by_user_id, update_appointment_status, get_all_appointments, find_user_by_id
from models import User, Appointment

def init_routes(app):
    @app.route('/')
    def index():
        return jsonify({
            'message': 'TUPT Counseling Scheduler API',
            'status': 'active'
        })

    @app.route('/register', methods=['POST'])
    def register():
        try:
            print("🚀 REGISTER ENDPOINT CALLED")
            data = request.get_json()
            print(f"📦 Received registration data: {data}")
            
            # Validate required fields
            if not data:
                print("❌ No JSON data provided")
                return jsonify({
                    'message': 'Invalid request data',
                    'error': 'No JSON data provided'
                }), 400
            
            required_fields = ['username', 'password', 'id_number', 'birthdate']
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                print(f"❌ Missing fields: {missing_fields}")
                return jsonify({
                    'message': 'Missing required fields',
                    'error': f'Missing fields: {", ".join(missing_fields)}',
                    'missing_fields': missing_fields
                }), 400
            
            print(f"🔍 Checking if username exists: {data['username']}")
            # Check if user already exists
            if find_user_by_username(data['username']):
                print(f"❌ Username already exists: {data['username']}")
                return jsonify({
                    'message': 'Registration failed',
                    'error': 'Username already exists'
                }), 409
            
            print(f"🔍 Checking if ID number exists: {data['id_number']}")
            # Check if ID number already exists
            if find_user_by_id_number(data['id_number']):
                print(f"❌ ID number already exists: {data['id_number']}")
                return jsonify({
                    'message': 'Registration failed', 
                    'error': 'ID number already registered'
                }), 409
            
            # Validate password length
            if len(data['password']) < 6:
                print(f"❌ Password too short: {len(data['password'])} characters")
                return jsonify({
                    'message': 'Registration failed',
                    'error': 'Password must be at least 6 characters long'
                }), 400
            
            print("✅ All validations passed, creating user...")
            # Create new user with default role 'user'
            password_hash = User.set_password(data['password'])
            user = User(
                username=data['username'],
                password_hash=password_hash,
                id_number=data['id_number'],
                birthdate=data['birthdate'],
                role=data.get('role', 'user')  # Default role is 'user'
            )
            
            print(f"👤 User object created: {user.username}")
            
            # Save user to database
            result = insert_user(user)
            print(f"💾 Database insertion result: {result}")
            
            if result:
                print(f"✅ User registered successfully: {user.username}")
                return jsonify({
                    'message': 'Registration successful! Please login.',
                    'user_id': str(user._id),
                    'user': {
                        'username': user.username,
                        'id_number': user.id_number,
                        'birthdate': user.birthdate,
                        'role': user.role
                    }
                }), 201
            else:
                print("❌ Failed to insert user into database")
                return jsonify({
                    'message': 'Registration failed',
                    'error': 'Failed to create user in database'
                }), 500
            
        except Exception as e:
            print(f"💥 Registration error: {str(e)}")
            import traceback
            print(f"🔍 Stack trace: {traceback.format_exc()}")
            return jsonify({
                'message': 'Registration error',
                'error': str(e)
            }), 500

    @app.route('/login', methods=['POST'])
    def login():
        try:
            data = request.get_json()
            
            if not data or not data.get('username') or not data.get('password'):
                return jsonify({
                    'message': 'Login failed',
                    'error': 'Username and password are required'
                }), 400
            
            user = find_user_by_username(data['username'])
            if user is None or not user.check_password(data['password']):
                return jsonify({
                    'message': 'Login failed',
                    'error': 'Invalid username or password'
                }), 401
            
            print(f"✅ User {user.username} logged in successfully. Role: {user.role}")
            
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'username': user.username,
                    'id_number': user.id_number,
                    'birthdate': user.birthdate,
                    'user_id': str(user._id),
                    'role': user.role
                }
            }), 200
            
        except Exception as e:
            print(f"❌ Login error: {e}")
            return jsonify({
                'message': 'Login error',
                'error': str(e)
            }), 500

    @app.route('/appointments', methods=['POST'])
    def create_appointment():
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data:
                return jsonify({
                    'message': 'Invalid request data',
                    'error': 'No JSON data provided'
                }), 400
            
            required_fields = ['user_id', 'date', 'preferred_time', 'concern_type']
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return jsonify({
                    'message': 'Missing required fields',
                    'error': f'Missing fields: {", ".join(missing_fields)}',
                    'missing_fields': missing_fields
                }), 400
            
            # Create new appointment with default status 'Pending' (not approved)
            appointment = Appointment(
                user_id=data['user_id'],
                date=data['date'],
                preferred_time=data['preferred_time'],
                concern_type=data['concern_type'],
                status=data.get('status', 'Pending')  # Default status is 'Pending'
            )
            
            # Save appointment to database
            result = insert_appointment(appointment)
            
            if result:
                print(f"✅ Appointment created for user {data['user_id']} on {data['date']} at {data['preferred_time']}")
                return jsonify({
                    'message': 'Appointment scheduled successfully! Waiting for approval.',
                    'appointment_id': str(appointment._id),
                    'appointment': appointment.to_dict()
                }), 201
            else:
                return jsonify({
                    'message': 'Appointment scheduling failed',
                    'error': 'Failed to create appointment in database'
                }), 500
            
        except Exception as e:
            print(f"❌ Appointment scheduling error: {e}")
            return jsonify({
                'message': 'Appointment scheduling error',
                'error': str(e)
            }), 500

    @app.route('/appointments/<user_id>', methods=['GET'])
    def get_user_appointments(user_id):
        try:
            appointments = find_appointments_by_user_id(user_id)
            
            print(f"✅ Retrieved {len(appointments)} appointments for user {user_id}")
            
            return jsonify({
                'message': 'Appointments retrieved successfully',
                'appointments': [appointment.to_dict() for appointment in appointments]
            }), 200
            
        except Exception as e:
            print(f"❌ Error retrieving appointments: {e}")
            return jsonify({
                'message': 'Error retrieving appointments',
                'error': str(e)
            }), 500

    # New endpoint to update appointment status (for admin approval)
    @app.route('/appointments/<appointment_id>/status', methods=['PUT'])
    def update_appointment_status_route(appointment_id):
        try:
            data = request.get_json()
            
            if not data or not data.get('status'):
                return jsonify({
                    'message': 'Invalid request data',
                    'error': 'Status is required'
                }), 400
            
            # Validate status values
            valid_statuses = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed']
            if data['status'] not in valid_statuses:
                return jsonify({
                    'message': 'Invalid status',
                    'error': f'Status must be one of: {", ".join(valid_statuses)}'
                }), 400
            
            result = update_appointment_status(appointment_id, data['status'])
            
            if result:
                return jsonify({
                    'message': f'Appointment status updated to {data["status"]}',
                    'appointment_id': appointment_id,
                    'status': data['status']
                }), 200
            else:
                return jsonify({
                    'message': 'Failed to update appointment status',
                    'error': 'Appointment not found or update failed'
                }), 404
            
        except Exception as e:
            print(f"❌ Error updating appointment status: {e}")
            return jsonify({
                'message': 'Error updating appointment status',
                'error': str(e)
            }), 500

    # New endpoint to get all appointments (for admin/counselor view)
    @app.route('/all-appointments', methods=['GET'])
    def get_all_appointments_route():
        try:
            appointments = get_all_appointments()
            
            return jsonify({
                'message': 'All appointments retrieved successfully',
                'appointments': [appointment.to_dict() for appointment in appointments]
            }), 200
            
        except Exception as e:
            print(f"❌ Error retrieving all appointments: {e}")
            return jsonify({
                'message': 'Error retrieving appointments',
                'error': str(e)
            }), 500

    # New endpoint to get user profile with role information
    @app.route('/user/<user_id>', methods=['GET'])
    def get_user_profile(user_id):
        try:
            user = find_user_by_id(user_id)
            if not user:
                return jsonify({
                    'message': 'User not found',
                    'error': 'Invalid user ID'
                }), 404
            
            return jsonify({
                'message': 'User profile retrieved successfully',
                'user': {
                    'username': user.username,
                    'id_number': user.id_number,
                    'birthdate': user.birthdate,
                    'user_id': str(user._id),
                    'role': user.role,
                    'created_at': user.created_at.isoformat() if hasattr(user.created_at, 'isoformat') else user.created_at
                }
            }), 200
            
        except Exception as e:
            print(f"❌ Error retrieving user profile: {e}")
            return jsonify({
                'message': 'Error retrieving user profile',
                'error': str(e)
            }), 500


        try:
            from database import mongo
            # Test database connection
            mongo.db.command('ping')
            
            # Test users collection
            users_count = mongo.db.users.count_documents({})
            appointments_count = mongo.db.appointments.count_documents({})
            
            return jsonify({
                'message': 'Database connection successful',
                'users_count': users_count,
                'appointments_count': appointments_count,
                'collections': mongo.db.list_collection_names()
            })
        except Exception as e:
            return jsonify({
                'message': 'Database connection failed',
                'error': str(e)
            }), 500

    @app.route('/dashboard')
    def dashboard():
        return jsonify({
            'message': 'Dashboard endpoint',
            'note': 'Authentication handled by frontend localStorage'
        })

    @app.route('/user/profile')
    def user_profile():
        return jsonify({
            'message': 'User profile endpoint',
            'note': 'Authentication handled by frontend localStorage'
        })

    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'API is running'
        })

    # Test endpoint to check if appointments collection exists
    @app.route('/test-appointments')
    def test_appointments():
        try:
            from database import mongo
            # Try to access appointments collection
            appointments_count = mongo.db.appointments.count_documents({})
            return jsonify({
                'message': 'Appointments collection is accessible',
                'appointments_count': appointments_count
            })
        except Exception as e:
            return jsonify({
                'message': 'Error accessing appointments collection',
                'error': str(e)
            }), 500