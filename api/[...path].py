"""Vercel Flask API entrypoint."""

import os
from dotenv import load_dotenv

from backend.app import create_app, db

load_dotenv()

app = create_app(os.getenv('FLASK_ENV', 'production'))


@app.shell_context_processor
def make_shell_context():
    from backend.app import models

    return {
        'db': db,
        'User': models.User,
        'Company': models.Company,
        'Card': models.Card,
        'Profile': models.Profile,
    }
