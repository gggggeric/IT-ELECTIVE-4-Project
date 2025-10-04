from flask import jsonify, request
from database import find_user_by_username, find_user_by_id_number, insert_user
from models import User

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
            data = request.get_json()
            
            # Validate required fields
            if not data:
                return jsonify({
                    'message': 'Invalid request data',
                    'error': 'No JSON data provided'
                }), 400
            
            required_fields = ['username', 'password', 'id_number', 'birthdate']
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return jsonify({
                    'message': 'Missing required fields',
                    'error': f'Missing fields: {", ".join(missing_fields)}',
                    'missing_fields': missing_fields
                }), 400
            
            # Check if user already exists
            if find_user_by_username(data['username']):
                return jsonify({
                    'message': 'Registration failed',
                    'error': 'Username already exists'
                }), 409
            
            # Check if ID number already exists
            if find_user_by_id_number(data['id_number']):
                return jsonify({
                    'message': 'Registration failed', 
                    'error': 'ID number already registered'
                }), 409
            
            # Validate password length
            if len(data['password']) < 6:
                return jsonify({
                    'message': 'Registration failed',
                    'error': 'Password must be at least 6 characters long'
                }), 400
            
            # Create new user
            password_hash = User.set_password(data['password'])
            user = User(
                username=data['username'],
                password_hash=password_hash,
                id_number=data['id_number'],
                birthdate=data['birthdate']
            )
            
            # Save user to database
            result = insert_user(user)
            
            if result:
                return jsonify({
                    'message': 'Registration successful! Please login.',
                    'user_id': str(user._id),
                    'user': {
                        'username': user.username,
                        'id_number': user.id_number,
                        'birthdate': user.birthdate
                    }
                }), 201
            else:
                return jsonify({
                    'message': 'Registration failed',
                    'error': 'Failed to create user in database'
                }), 500
            
        except Exception as e:
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
            
            print(f"✅ User {user.username} logged in successfully")
            
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'username': user.username,
                    'id_number': user.id_number,
                    'birthdate': user.birthdate
                }
            }), 200
            
        except Exception as e:
            print(f"❌ Login error: {e}")
            return jsonify({
                'message': 'Login error',
                'error': str(e)
            }), 500

    @app.route('/dashboard')
    def dashboard():
        # Simple endpoint that doesn't require authentication
        # Frontend will handle authentication via localStorage
        return jsonify({
            'message': 'Dashboard endpoint',
            'note': 'Authentication handled by frontend localStorage'
        })

    @app.route('/user/profile')
    def user_profile():
        # Simple endpoint that doesn't require authentication
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