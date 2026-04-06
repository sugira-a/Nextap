#!/usr/bin/env python
"""Flask application entry point"""

import os
from dotenv import load_dotenv

try:
    from backend.app import create_app, db
except ModuleNotFoundError:
    from app import create_app, db

# Load environment variables
load_dotenv()

# Create app
app = create_app(os.getenv('FLASK_ENV', 'development'))

# Shell context for flask shell
@app.shell_context_processor
def make_shell_context():
    try:
        models_module = __import__('backend.app.models', fromlist=['User', 'Company', 'Card', 'Profile'])
    except ModuleNotFoundError:
        models_module = __import__('app.models', fromlist=['User', 'Company', 'Card', 'Profile'])

    return {
        'db': db,
        'User': models_module.User,
        'Company': models_module.Company,
        'Card': models_module.Card,
        'Profile': models_module.Profile,
    }

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
