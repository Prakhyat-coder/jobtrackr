from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from models import db, Application
import os

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Vite dev server

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# Create tables on first run
with app.app_context():
    db.create_all()


# GET all applications
@app.route("/api/applications", methods=["GET"])
def get_applications():
    apps = Application.query.order_by(Application.created_at.desc()).all()
    return jsonify([a.to_dict() for a in apps])


# POST create new application
@app.route("/api/applications", methods=["POST"])
def create_application():
    data = request.get_json()
    app = Application(
        company = data["company"],
        title   = data["title"],
        date    = data["date"],
        status  = data.get("status", "Applied"),
        url     = data.get("url", ""),
        notes   = data.get("notes", "")
    )
    db.session.add(app)
    db.session.commit()
    return jsonify(app.to_dict()), 201


# PUT update application
@app.route("/api/applications/<int:id>", methods=["PUT"])
def update_application(id):
    app = Application.query.get_or_404(id)
    data = request.get_json()
    app.company = data.get("company", app.company)
    app.title   = data.get("title",   app.title)
    app.date    = data.get("date",     app.date)
    app.status  = data.get("status",   app.status)
    app.url     = data.get("url",      app.url)
    app.notes   = data.get("notes",    app.notes)
    db.session.commit()
    return jsonify(app.to_dict())


# DELETE application
@app.route("/api/applications/<int:id>", methods=["DELETE"])
def delete_application(id):
    app = Application.query.get_or_404(id)
    db.session.delete(app)
    db.session.commit()
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(debug=True, port=4000)