import os
import smtplib
from email.message import EmailMessage
from flask import current_app


def _smtp_config():
    """Return SMTP config tuple: (host, port, user, pass, from_addr, use_tls)"""
    smtp_host = os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or 587)
    smtp_user = os.getenv("SMTP_USER") or os.getenv("MAIL_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD")
    from_addr = (
        os.getenv("EMAIL_FROM")
        or os.getenv("MAIL_FROM")
        or os.getenv("MAIL_DEFAULT_SENDER")
        or smtp_user
        or f"noreply@{os.getenv('MAIL_DOMAIN', 'localhost')}"
    )
    use_tls = (os.getenv("SMTP_USE_TLS") or os.getenv("MAIL_USE_TLS") or "True").lower() in {"1", "true", "yes"}
    return smtp_host, smtp_port, smtp_user, smtp_pass, from_addr, use_tls


def send_welcome_email(to_email: str, temporary_password: str, company_name: str, login_url: str, expires_hours: int = 24) -> bool:
    """Send a welcome email with temporary credentials and a clear CTA to login.

    Returns True if sent, False otherwise. If SMTP not configured, logs the credentials to app logger.
    """
    smtp_host, smtp_port, smtp_user, smtp_pass, from_addr, use_tls = _smtp_config()
    if not smtp_host:
        current_app.logger.info("SMTP not configured — welcome creds for %s: %s / %s", to_email, to_email, temporary_password)
        return False

    subject = f"Welcome to {company_name}"

    # Simplified, concise welcome email
    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;margin:0;padding:0;background:#f6f7f9}}.wrap{{max-width:600px;margin:36px auto;background:#fff;padding:28px;border-radius:8px}}</style>
</head>
<body>
  <div class="wrap">
    <h2 style="margin:0 0 12px 0;font-size:18px">Welcome to {company_name}</h2>
    <p style="margin:0 0 16px 0;color:#555;font-size:14px">Your admin account is ready.</p>

    <p style="margin:0 0 10px 0;font-size:13px;color:#333">Temporary password</p>
    <pre style="background:#f3f4f6;padding:10px;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace">{temporary_password}</pre>

    <div style="text-align:left;margin-top:16px">
      <a href="{login_url}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Sign in</a>
    </div>

    <p style="margin:18px 0 0 0;font-size:12px;color:#888">This link and password expire in {expires_hours} hours.</p>
  </div>
  <div style="text-align:center;color:#aaa;font-size:12px;margin-top:14px">© 2026 {company_name}</div>
</body>
</html>"""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content(
        f"Welcome to {company_name}.\n\n"
        f"Temporary password: {temporary_password}\n"
        f"Sign in: {login_url}\n"
        f"This link and password expire in {expires_hours} hours."
    )
    msg.add_alternative(html_body, subtype="html")

    try:
        current_app.logger.debug(
            "Attempting to send welcome email via %s:%s (tls=%s, sender=%s)",
            smtp_host,
            smtp_port,
            use_tls,
            from_addr,
        )
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        # Optional debug capture to log full SMTP conversation when troubleshooting
        if os.getenv('MAIL_DEBUG', '').lower() in {'1', 'true', 'yes'}:
            import io, sys
            _stderr_buf = io.StringIO()
            _old_stderr = sys.stderr
            sys.stderr = _stderr_buf
            try:
                server.set_debuglevel(1)
                if use_tls:
                    server.starttls()
                if smtp_user and smtp_pass:
                    server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            finally:
                try:
                    server.quit()
                except Exception:
                    pass
                sys.stderr = _old_stderr
                current_app.logger.debug("SMTP debug output:\n%s", _stderr_buf.getvalue())
        else:
            if use_tls:
                server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()
        current_app.logger.info("✓ Sent welcome email to %s", to_email)
        return True
    except Exception as e:
        current_app.logger.exception("Failed to send welcome email to %s: %s", to_email, str(e))
        return False


def send_reset_email(to_email: str, reset_link: str) -> bool:
    """Send a professional HTML password reset email.

    Returns True if sent, False otherwise. If SMTP is not configured, logs the link
    to the application logger and returns False (development fallback).
    """
    smtp_host, smtp_port, smtp_user, smtp_pass, from_addr, use_tls = _smtp_config()
    if not smtp_host:
        current_app.logger.info("SMTP not configured — reset link for %s: %s", to_email, reset_link)
        return False

    subject = "Reset your password"

    # Simplified reset email
    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;margin:0;padding:0;background:#f6f7f9}}.wrap{{max-width:600px;margin:36px auto;background:#fff;padding:28px;border-radius:8px}}</style>
</head>
<body>
  <div class="wrap">
    <h2 style="margin:0 0 12px 0;font-size:18px">Reset your password</h2>
    <p style="margin:0 0 16px 0;color:#555;font-size:14px">Click the button below to set a new password for your account.</p>

    <div style="text-align:left;margin-top:16px">
      <a href="{reset_link}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Reset password</a>
    </div>

    <p style="margin:16px 0 0 0;font-size:12px;color:#888;word-break:break-all">Or use this link: {reset_link}</p>
    <p style="margin:10px 0 0 0;font-size:12px;color:#888">If you didn't request this, you can ignore this email.</p>
  </div>
  <div style="text-align:center;color:#aaa;font-size:12px;margin-top:14px">© 2026 NexTap</div>
</body>
</html>"""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content("Reset your password: " + reset_link)
    msg.add_alternative(html_body, subtype="html")

    try:
        current_app.logger.debug(f"Attempting to send email via {smtp_host}:{smtp_port}")
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        # Optional debug capture to log full SMTP conversation when troubleshooting
        if os.getenv('MAIL_DEBUG', '').lower() in {'1', 'true', 'yes'}:
            import io, sys
            _stderr_buf = io.StringIO()
            _old_stderr = sys.stderr
            sys.stderr = _stderr_buf
            try:
                server.set_debuglevel(1)
                if use_tls:
                    server.starttls()
                if smtp_user and smtp_pass:
                    server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            finally:
                try:
                    server.quit()
                except Exception:
                    pass
                sys.stderr = _old_stderr
                current_app.logger.debug("SMTP debug output:\n%s", _stderr_buf.getvalue())
        else:
            if use_tls:
                server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()
        current_app.logger.info("✓ Sent reset email to %s from %s", to_email, from_addr)
        return True
    except smtplib.SMTPAuthenticationError as e:
        current_app.logger.error("SMTP Auth failed for %s: %s", smtp_user, str(e))
        return False
    except smtplib.SMTPException as e:
        current_app.logger.error("SMTP error sending to %s: %s", to_email, str(e))
        return False
    except Exception as e:
        current_app.logger.exception("Failed to send reset email to %s: %s", to_email, str(e))
        return False
