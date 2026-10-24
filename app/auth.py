
import os
import hmac

from flask_login import UserMixin
from werkzeug.security import check_password_hash


class AdminUser(UserMixin):
    id = "admin"


def verify_admin_credentials(username, password):
    admin_username = os.environ.get("ADMIN_USERNAME")
    admin_password_hash = os.environ.get("ADMIN_PASSWORD_HASH")

    if not admin_username or not admin_password_hash:
        return False

    username_matches = hmac.compare_digest(username, admin_username)
    password_matches = check_password_hash(admin_password_hash, password)

    return username_matches and password_matches
