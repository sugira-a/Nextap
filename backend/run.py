#!/usr/bin/env python
"""Flask application entry point"""

import os
from dotenv import load_dotenv
from app import create_app, db

# Load environment variables
load_dotenv()

# Create app
app = create_app(os.getenv('FLASK_ENV', 'development'))

# Shell context for flask shell
@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': __import__('app.models', fromlist=['User']).User,
        'Company': __import__('app.models', fromlist=['Company']).Company,
        'Card': __import__('app.models', fromlist=['Card']).Card,
        'Profile': __import__('app.models', fromlist=['Profile']).Profile,
    }

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
