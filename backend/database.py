from flask_pymongo import PyMongo
from bson import ObjectId
from models import User, Appointment

mongo = PyMongo()

def init_app(app):
    mongo.init_app(app)

def test_connection():
    try:
        mongo.db.command('ping')
        return True
    except Exception:
        return False

def insert_user(user):
    try:
        print(f"🔍 Attempting to insert user: {user.username}")
        user_dict = user.to_dict()
        print(f"📝 User data to insert: {user_dict}")
        
        # Check if database connection is working
        try:
            mongo.db.command('ping')
            print("✅ Database connection is active")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return None
        
        # Check if users collection exists
        collections = mongo.db.list_collection_names()
        print(f"📁 Available collections: {collections}")
        
        result = mongo.db.users.insert_one(user_dict)
        print(f"✅ User inserted successfully with ID: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        print(f"❌ Error inserting user: {e}")
        import traceback
        print(f"🔍 Stack trace: {traceback.format_exc()}")
        return None

def find_user_by_username(username):
    try:
        user_data = mongo.db.users.find_one({'username': username})
        if user_data:
            return User.from_dict(user_data)
        return None
    except Exception as e:
        print(f"Error finding user by username: {e}")
        return None

def find_user_by_id_number(id_number):
    try:
        user_data = mongo.db.users.find_one({'id_number': id_number})
        if user_data:
            return User.from_dict(user_data)
        return None
    except Exception as e:
        print(f"Error finding user by ID number: {e}")
        return None

def find_user_by_id(user_id):
    try:
        print(f"🔍 Searching for user with ID: {user_id}")
        # Convert string to ObjectId
        user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        if user_data:
            print(f"✅ User found in database: {user_data.get('username')}")
            return User.from_dict(user_data)
        else:
            print(f"❌ No user found with ID: {user_id}")
            return None
    except Exception as e:
        print(f"❌ Error finding user by ID: {e}")
        return None

def insert_appointment(appointment):
    try:
        result = mongo.db.appointments.insert_one(appointment.to_dict())
        print(f"✅ Appointment inserted with ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print(f"❌ Error inserting appointment: {e}")
        return None

def find_appointments_by_user_id(user_id):
    try:
        print(f"🔍 Searching for appointments for user: {user_id}")
        appointments_data = mongo.db.appointments.find({'user_id': user_id}).sort('date', -1)
        appointments = []
        for appointment_data in appointments_data:
            appointments.append(Appointment.from_dict(appointment_data))
        print(f"✅ Found {len(appointments)} appointments for user {user_id}")
        return appointments
    except Exception as e:
        print(f"❌ Error finding appointments by user ID: {e}")
        return []

def update_appointment_status(appointment_id, new_status):
    """Update the status of an appointment"""
    try:
        result = mongo.db.appointments.update_one(
            {'_id': ObjectId(appointment_id)},
            {'$set': {'status': new_status}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating appointment status: {e}")
        return False

def get_all_appointments():
    """Get all appointments (for admin/counselor view)"""
    try:
        appointments = mongo.db.appointments.find().sort('created_at', -1)
        return [Appointment.from_dict(appointment) for appointment in appointments]
    except Exception as e:
        print(f"Error getting all appointments: {e}")
        return []