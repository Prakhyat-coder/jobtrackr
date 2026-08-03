from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from models import db, Application
import os
import re

load_dotenv()

app = Flask(__name__)

origins = [re.compile(r"http://(localhost|127\.0\.0\.1)(:\d+)?")]
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL"))

CORS(app, origins=origins)

db_url = os.getenv("DATABASE_URL", "sqlite:///jobtrackr.db")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

VALID_STATUSES = {"Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"}

with app.app_context():
    db.create_all()


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request"}), 400

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


# GET all applications (with optional search and status query parameters)
@app.route("/api/applications", methods=["GET"])
def get_applications():
    query = Application.query
    
    status_filter = request.args.get("status")
    if status_filter and status_filter in VALID_STATUSES:
        query = query.filter(Application.status == status_filter)
        
    search = request.args.get("search")
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Application.company.ilike(search_pattern)) | 
            (Application.title.ilike(search_pattern))
        )
        
    apps = query.order_by(Application.created_at.desc()).all()
    return jsonify([a.to_dict() for a in apps])


# POST create new application
@app.route("/api/applications", methods=["POST"])
def create_application():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON request body"}), 400
        
    company = data.get("company", "").strip()
    title = data.get("title", "").strip()
    date = data.get("date", "").strip()
    status = data.get("status", "Applied").strip()
    url = data.get("url", "").strip()
    notes = data.get("notes", "").strip()
    
    if not company or not title or not date:
        return jsonify({"error": "company, title, and date are required fields"}), 400
        
    if status not in VALID_STATUSES:
        status = "Applied"
        
    try:
        app_obj = Application(
            company=company,
            title=title,
            date=date,
            status=status,
            url=url,
            notes=notes
        )
        db.session.add(app_obj)
        db.session.commit()
        return jsonify(app_obj.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 400


# PUT update application
@app.route("/api/applications/<int:id>", methods=["PUT"])
def update_application(id):
    app_obj = Application.query.get_or_404(id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON request body"}), 400
        
    if "company" in data:
        app_obj.company = data["company"].strip() or app_obj.company
    if "title" in data:
        app_obj.title = data["title"].strip() or app_obj.title
    if "date" in data:
        app_obj.date = data["date"].strip() or app_obj.date
    if "status" in data:
        new_status = data["status"].strip()
        if new_status in VALID_STATUSES:
            app_obj.status = new_status
    if "url" in data:
        app_obj.url = data["url"].strip()
    if "notes" in data:
        app_obj.notes = data["notes"].strip()
        
    try:
        db.session.commit()
        return jsonify(app_obj.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 400


# DELETE application
@app.route("/api/applications/<int:id>", methods=["DELETE"])
def delete_application(id):
    app_obj = Application.query.get_or_404(id)
    db.session.delete(app_obj)
    db.session.commit()
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=4000)
