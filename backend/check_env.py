from dotenv import load_dotenv
import os

load_dotenv('.env')
print('MAIL_SERVER=', os.getenv('MAIL_SERVER'))
print('MAIL_PORT=', os.getenv('MAIL_PORT'))
print('MAIL_USE_TLS=', os.getenv('MAIL_USE_TLS'))
print('MAIL_USERNAME_PRESENT=', os.getenv('MAIL_USERNAME') is not None)
print('MAIL_PASSWORD_PRESENT=', bool(os.getenv('MAIL_PASSWORD')))
print('FRONTEND_URL=', os.getenv('FRONTEND_URL'))
