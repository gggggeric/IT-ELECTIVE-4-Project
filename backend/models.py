from flask_login import UserMixin
from bson import ObjectId
import bcrypt
from datetime import datetime

class User(UserMixin):
    def __init__(self, username, password_hash, id_number=None, birthdate=None, _id=None, created_at=None):
        self.username = username
        self.password_hash = password_hash
        self.id_number = id_number
        self.birthdate = birthdate
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
            'password_hash': self.password_hash,
            'id_number': self.id_number,
            'birthdate': self.birthdate,
            '_id': str(self._id),
            'created_at': self.created_at
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            username=data['username'],
            password_hash=data['password_hash'],
            id_number=data.get('id_number'),
            birthdate=data.get('birthdate'),
            _id=data.get('_id', ObjectId()),
            created_at=data.get('created_at')
        )