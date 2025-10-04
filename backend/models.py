from flask_login import UserMixin
from bson import ObjectId
import bcrypt
from datetime import datetime

class User(UserMixin):
    def __init__(self, username, email, password_hash, _id=None, created_at=None):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self._id = _id or ObjectId()
        self.created_at = created_at or datetime.utcnow()

    def get_id(self):
        return str(self._id)

    @staticmethod
    def set_password(password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'username': self.username,
            'email': self.email,
            'password_hash': self.password_hash,
            'created_at': self.created_at
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            username=data['username'],
            email=data['email'],
            password_hash=data['password_hash'],
            _id=data.get('_id'),
            created_at=data.get('created_at')
        )