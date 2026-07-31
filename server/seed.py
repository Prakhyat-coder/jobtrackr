from app import app
from models import db, Application

SAMPLE_APPLICATIONS = [
    {
        "company": "Google",
        "title": "Senior Frontend Engineer",
        "date": "2026-07-15",
        "status": "Interviewing",
        "url": "https://careers.google.com",
        "notes": "System design round scheduled for next Tuesday."
    },
    {
        "company": "Stripe",
        "title": "Full Stack Developer",
        "date": "2026-07-20",
        "status": "Offer",
        "url": "https://stripe.com/jobs",
        "notes": "Received formal offer letter. Reviewing compensation package."
    },
    {
        "company": "Meta",
        "title": "Software Engineer II",
        "date": "2026-07-10",
        "status": "Applied",
        "url": "https://metacareers.com",
        "notes": "Submitted application via referral."
    },
    {
        "company": "Netflix",
        "title": "UI Systems Engineer",
        "date": "2026-07-02",
        "status": "Rejected",
        "url": "https://jobs.netflix.com",
        "notes": "Position filled internally."
    },
    {
        "company": "Apple",
        "title": "iOS / Web Developer",
        "date": "2026-07-28",
        "status": "Applied",
        "url": "https://apple.com/jobs",
        "notes": "Applied for Cupertino product team."
    },
    {
        "company": "Microsoft",
        "title": "Cloud Platform Engineer",
        "date": "2026-06-25",
        "status": "Withdrawn",
        "url": "https://careers.microsoft.com",
        "notes": "Withdrew application due to location preference."
    }
]

def seed_db():
    with app.app_context():
        print("Clearing existing database tables...")
        db.drop_all()
        db.create_all()

        print("Seeding sample job applications...")
        for data in SAMPLE_APPLICATIONS:
            app_record = Application(
                company=data["company"],
                title=data["title"],
                date=data["date"],
                status=data["status"],
                url=data["url"],
                notes=data["notes"]
            )
            db.session.add(app_record)

        db.session.commit()
        print("Database successfully seeded!")

if __name__ == "__main__":
    seed_db()
