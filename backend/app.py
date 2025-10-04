from flask import Flask, render_template
from flask_login import LoginManager
from database import mongo
from routes import init_routes
import os
from dotenv import load_dotenv  # Add this import

# Load environment variables from .env file
load_dotenv()  # Add this line

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')

# MongoDB configuration from environment variables
MONGO_USERNAME = os.environ.get('MONGO_USERNAME')
MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME')

# Validate that all required environment variables are set
required_env_vars = ['MONGO_USERNAME', 'MONGO_PASSWORD', 'MONGO_DB_NAME']
missing_vars = [var for var in required_env_vars if not os.environ.get(var)]

if missing_vars:
    print(f"💥 CRITICAL: Missing required environment variables: {', '.join(missing_vars)}")
    print("💡 Please set these environment variables before running the application")
    exit(1)

app.config['MONGO_URI'] = f'mongodb+srv://{MONGO_USERNAME}:{MONGO_PASSWORD}@cluster1.hcz8tdb.mongodb.net/{MONGO_DB_NAME}?retryWrites=true&w=majority&appName=Cluster1'
app.config['MONGO_DB_NAME'] = MONGO_DB_NAME

# Initialize extensions
try:
    mongo.init_app(app)
    print("🎉 MongoDB initialization completed successfully!")
except Exception as e:
    print(f"💥 CRITICAL: Failed to initialize MongoDB: {e}")
    print("💡 Please check your credentials and connection")
    exit(1)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'

@login_manager.user_loader
def load_user(user_id):
    return mongo.find_user_by_id(user_id)

# Initialize routes
init_routes(app)

@app.route('/test-db')
def test_db():
    """Route to test database connection"""
    if mongo.test_connection():
        return "✅ Database connection is active!"
    else:
        return "❌ Database connection failed!"

if __name__ == '__main__':
    print("🚀 Starting Flask application...")
    print(f"📊 Database: {MONGO_DB_NAME}")
    print(f"👤 MongoDB User: {MONGO_USERNAME}")
    print(f"🌐 Server will run on: http://127.0.0.1:5000")
    app.run(debug=True)