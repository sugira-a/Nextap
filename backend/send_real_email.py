#!/usr/bin/env python
"""Send a real welcome email using configured SMTP and print detailed results.

Use with caution: this will attempt a real SMTP connection using credentials
in `backend/.env`. It sends to `MAIL_USERNAME` by default or to
`MAIL_TEST_RECIPIENT` if set.
"""
from pathlib import Path
import sys
import os
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / '.env')

from backend.app import create_app
from backend.app.utils.email import send_welcome_email

if __name__ == '__main__':
    env = os.getenv('FLASK_ENV', 'development')
    app = create_app(env)
    recipient = os.getenv('MAIL_TEST_RECIPIENT') or os.getenv('MAIL_USERNAME')
    if not recipient:
        print('ERROR: No recipient configured (MAIL_TEST_RECIPIENT or MAIL_USERNAME).')
        raise SystemExit(2)

    print('Using SMTP host:', os.getenv('MAIL_SERVER') or os.getenv('SMTP_HOST'))
    print('Using SMTP user:', os.getenv('MAIL_USERNAME') or os.getenv('SMTP_USER'))

    with app.app_context():
        try:
            ok = send_welcome_email(
                to_email=recipient,
                temporary_password='TempPassFromTestScript123!',
                company_name='NexTap SMTP Live Test',
                login_url=os.getenv('FRONTEND_URL', 'http://localhost:8080') + '/login',
                expires_hours=24,
            )
            print('send_welcome_email returned:', ok)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print('Exception during send_welcome_email:', str(e))
            raise
