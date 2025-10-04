from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure, ServerSelectionTimeoutError
from models import User
import time

class MongoDB:
    def __init__(self, app=None):
        self.client = None
        self.db = None
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        try:
            print("🔄 Attempting to connect to MongoDB...")
            
            # Add connection timeout options
            self.client = MongoClient(
                app.config['MONGO_URI'],
                serverSelectionTimeoutMS=10000,  # 10 seconds timeout
                connectTimeoutMS=10000,
                socketTimeoutMS=10000
            )
            
            # Test the connection by pinging the database
            print("🔄 Testing connection...")
            self.client.admin.command('ping')
            
            # If we get here, connection is successful
            self.db = self.client[app.config['MONGO_DB_NAME']]
            
            # Create unique indexes
            print("🔄 Creating database indexes...")
            self.db.users.create_index('username', unique=True)
            self.db.users.create_index('email', unique=True)
            
            print("✅ Successfully connected to MongoDB Atlas!")
            print(f"✅ Database: {app.config['MONGO_DB_NAME']}")
            print(f"✅ Collection: users")
            
        except ServerSelectionTimeoutError:
            print("❌ ERROR: Cannot connect to MongoDB - Server selection timeout")
            print("💡 Check your internet connection and MongoDB Atlas IP whitelist")
            raise
        except ConnectionFailure as e:
            print(f"❌ ERROR: Failed to connect to MongoDB - {e}")
            print("💡 Check your MongoDB URI and credentials")
            raise
        except OperationFailure as e:
            print(f"❌ ERROR: Database operation failed - {e}")
            print("💡 Check your database user permissions")
            raise
        except Exception as e:
            print(f"❌ ERROR: Unexpected error - {e}")
            raise

    def test_connection(self):
        """Test if the connection is still alive"""
        try:
            self.client.admin.command('ping')
            return True
        except:
            return False

    def insert_user(self, user_data):
        try:
            result = self.db.users.insert_one(user_data.to_dict())
            print(f"✅ User '{user_data.username}' inserted successfully")
            return result.inserted_id
        except Exception as e:
            print(f"❌ Error inserting user: {e}")
            raise

    def find_user_by_username(self, username):
        try:
            user_data = self.db.users.find_one({'username': username})
            if user_data:
                print(f"✅ Found user by username: {username}")
                return User.from_dict(user_data)
            print(f"ℹ️  User not found by username: {username}")
            return None
        except Exception as e:
            print(f"❌ Error finding user by username: {e}")
            return None

    def find_user_by_email(self, email):
        try:
            user_data = self.db.users.find_one({'email': email})
            if user_data:
                print(f"✅ Found user by email: {email}")
                return User.from_dict(user_data)
            print(f"ℹ️  User not found by email: {email}")
            return None
        except Exception as e:
            print(f"❌ Error finding user by email: {e}")
            return None

    def find_user_by_id(self, user_id):
        try:
            from bson import ObjectId
            if not ObjectId.is_valid(user_id):
                print(f"❌ Invalid user ID format: {user_id}")
                return None
            user_data = self.db.users.find_one({'_id': ObjectId(user_id)})
            if user_data:
                print(f"✅ Found user by ID: {user_id}")
                return User.from_dict(user_data)
            print(f"ℹ️  User not found by ID: {user_id}")
            return None
        except Exception as e:
            print(f"❌ Error finding user by ID: {e}")
            return None

# Initialize database
mongo = MongoDB()