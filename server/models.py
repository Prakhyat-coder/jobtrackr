from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
db = SQLAlchemy()

class Application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(db.Integer, primary_key=True)
    company= db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    date  = db.Column(db.String(20), nullable=False)
    status    = db.Column(db.String(20),  nullable=False, default="Applied")
    url       = db.Column(db.String(255), nullable=True)
    notes     = db.Column(db.Text,        nullable=True)
    created_at = db.Column(db.DateTime,   default=datetime.utcnow)

def to_dict(self):
        return {
            "id":         self.id,
            "company":    self.company,
            "title":      self.title,
            "date":       self.date,
            "status":     self.status,
            "url":        self.url or "",
            "notes":      self.notes or "",
            "created_at": self.created_at.isoformat()
        }