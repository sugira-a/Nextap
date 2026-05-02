import os
import smtplib
from email.message import EmailMessage
from flask import current_app


def send_reset_email(to_email: str, reset_link: str) -> bool:
    """Send a professional HTML password reset email.

    Returns True if sent, False otherwise. If SMTP is not configured, logs the link
    to the application logger and returns False (development fallback).
    """
    # Support either SMTP_* env names or legacy MAIL_* names from .env.example
    smtp_host = os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER")
    if not smtp_host:
        current_app.logger.info("SMTP not configured — reset link for %s: %s", to_email, reset_link)
        return False

    smtp_port = int(os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or 587)
    smtp_user = os.getenv("SMTP_USER") or os.getenv("MAIL_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD")
    from_addr = os.getenv("EMAIL_FROM") or os.getenv("MAIL_FROM") or os.getenv("MAIL_USERNAME") or f"noreply@{os.getenv('MAIL_DOMAIN', 'localhost')}"
    use_tls = (os.getenv("SMTP_USE_TLS") or os.getenv("MAIL_USE_TLS") or "True").lower() in {"1","true","yes"}

    subject = "Reset your NexTap password"
    
    # Compact HTML email template
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb;">
    <table style="width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-collapse: collapse;">
        <tr>
            <td style="padding: 32px 24px;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Reset your password</h2>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">Hi there,</p>
                <p style="margin: 0 0 24px 0; font-size: 14px; color: #666;">Click the button below to reset your NexTap account password.</p>
                <div style="margin: 0 0 24px 0; text-align: center;">
                    <a href="{reset_link}" style="display: inline-block; padding: 10px 32px; background: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Reset Password</a>
                </div>
                <p style="margin: 0 0 16px 0; font-size: 13px; color: #999;">Or copy this link: <a href="{reset_link}" style="color: #0066cc; text-decoration: none; word-break: break-all;">{reset_link}</a></p>
                <p style="margin: 0; font-size: 13px; color: #999;">Didn't request this? Ignore this email or contact support.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 16px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb; font-size: 12px; color: #999; text-align: center;">
                © 2026 NexTap. All rights reserved.
            </td>
        </tr>
    </table>
</body>
</html>"""

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content("Reset your password by clicking the link above")
    msg.add_alternative(html_body, subtype="html")

    try:
        current_app.logger.debug(f"Attempting to send email via {smtp_host}:{smtp_port}")
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
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
