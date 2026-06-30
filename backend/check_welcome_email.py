#!/usr/bin/env python
"""Local smoke test for the welcome email helper.

This avoids sending a real email by replacing smtplib.SMTP with a fake
transport that records the message and simulates a successful send.
"""

from __future__ import annotations

import os
import sys
from contextlib import contextmanager
from email.message import EmailMessage
from pathlib import Path
from flask import Flask

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import backend.app.utils.email as email_utils


class FakeSMTP:
    instances = []

    def __init__(self, host, port, timeout=10):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.starttls_called = False
        self.login_args = None
        self.sent_messages: list[EmailMessage] = []
        self.closed = False
        FakeSMTP.instances.append(self)

    def starttls(self):
        self.starttls_called = True

    def login(self, username, password):
        self.login_args = (username, password)

    def send_message(self, message):
        self.sent_messages.append(message)

    def quit(self):
        self.closed = True


@contextmanager
def patched_smtp():
    original = email_utils.smtplib.SMTP
    email_utils.smtplib.SMTP = FakeSMTP
    try:
        yield
    finally:
        email_utils.smtplib.SMTP = original


def main() -> int:
    os.environ.setdefault("MAIL_SERVER", "smtp.gmail.com")
    os.environ.setdefault("MAIL_PORT", "587")
    os.environ.setdefault("MAIL_USE_TLS", "True")
    os.environ.setdefault("MAIL_USERNAME", "demo@example.com")
    os.environ.setdefault("MAIL_PASSWORD", "demo-password")
    os.environ.setdefault("MAIL_DEFAULT_SENDER", "demo@example.com")

    app = Flask(__name__)

    with app.app_context(), patched_smtp():
        sent = email_utils.send_welcome_email(
            to_email="recipient@example.com",
            temporary_password="TempPass123!",
            company_name="NexTap Demo",
            login_url="http://localhost:8080/login",
            expires_hours=24,
        )

    smtp = FakeSMTP.instances[-1] if FakeSMTP.instances else None

    assert sent is True, "send_welcome_email should return True when SMTP succeeds"
    assert smtp is not None, "Fake SMTP was not instantiated"
    assert smtp.host == "smtp.gmail.com"
    assert smtp.port == 587
    assert smtp.starttls_called is True, "TLS should be enabled for Gmail SMTP"
    assert smtp.login_args == ("demo@example.com", "demo-password"), "SMTP login should use configured credentials"
    assert smtp.closed is True, "SMTP connection should be closed"
    assert len(smtp.sent_messages) == 1, "One email should be sent"

    message = smtp.sent_messages[0]
    assert message["To"] == "recipient@example.com"
    assert message["From"] == "demo@example.com"
    assert "Welcome to NexTap Demo" in message["Subject"]

    print("PASS: welcome email helper sent a message through the SMTP stub")
    print(f"SMTP host: {smtp.host}:{smtp.port}")
    print(f"Recipient: {message['To']}")
    print(f"Sender: {message['From']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())