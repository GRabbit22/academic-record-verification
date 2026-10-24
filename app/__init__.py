
import os

from flask import Flask
from flask_login import LoginManager

from app.database import init_db

login_manager = LoginManager()
login_manager.login_view = "main.admin_login"
login_manager.login_message = "Please log in as an admin to access registration."


def create_app():
    app = Flask(__name__)

    app.secret_key = os.environ.get("FLASK_SECRET_KEY")

    if not app.secret_key:
        raise RuntimeError(
            "Set the FLASK_SECRET_KEY environment variable before starting Flask."
        )

    login_manager.init_app(app)
    init_db()

    from app.routes import main
    app.register_blueprint(main)

    return app


@login_manager.user_loader
def load_user(user_id):
    from app.auth import AdminUser

    if user_id == "admin":
        return AdminUser()

    return None
