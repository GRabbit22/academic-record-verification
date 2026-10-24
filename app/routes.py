
import os
import sqlite3
import tempfile

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import (
    login_user,
    logout_user,
    login_required,
    current_user,
)

from app.database import get_connection
from app.hashing import calculate_hash
from app.auth import AdminUser, verify_admin_credentials

main = Blueprint("main", __name__)


def get_uploaded_hash(document):
    upload_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "instance",
        "uploads",
    )
    os.makedirs(upload_dir, exist_ok=True)

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            dir=upload_dir, delete=False
        ) as temp:
            temp_path = temp.name

        document.save(temp_path)
        return calculate_hash(temp_path)

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@main.route("/")
def home():
    return render_template("index.html")


@main.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if current_user.is_authenticated:
        return redirect(url_for("main.home"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        if verify_admin_credentials(username, password):
            login_user(AdminUser())
            flash("Admin login successful.", "success")
            return redirect(url_for("main.home"))

        flash("Invalid admin ID or password.", "error")

    return render_template("admin_login.html")


@main.route("/admin/logout", methods=["POST"])
@login_required
def admin_logout():
    logout_user()
    flash("You have been logged out.", "success")
    return redirect(url_for("main.home"))


@main.route("/register", methods=["POST"])
@login_required
def register():
    student_name = request.form.get("student_name", "").strip()
    record_name = request.form.get("record_name", "").strip()
    document = request.files.get("document")

    if not student_name or not record_name:
        return "Student name and record name are required.", 400

    if not document or not document.filename:
        return "Please upload a document.", 400

    file_hash = get_uploaded_hash(document)

    try:
        with get_connection() as conn:
            conn.execute(
                """
                INSERT INTO records
                (student_name, record_name, file_hash)
                VALUES (?, ?, ?)
                """,
                (student_name, record_name, file_hash),
            )

        message = "Academic record registered successfully!"
        status = "success"

    except sqlite3.IntegrityError:
        message = "This document hash is already registered."
        status = "error"

    return render_template(
        "status.html",
        message=message,
        status=status,
        file_hash=file_hash,
    )


@main.route("/verify", methods=["POST"])
def verify():
    document = request.files.get("document")

    if not document or not document.filename:
        return "Please upload a document to verify.", 400

    file_hash = get_uploaded_hash(document)

    with get_connection() as conn:
        record = conn.execute(
            """
            SELECT student_name, record_name, created_at
            FROM records
            WHERE file_hash = ?
            """,
            (file_hash,),
        ).fetchone()

    if record:
        message = "VERIFIED: This document matches a registered record."
        status = "success"
    else:
        message = "NOT VERIFIED: No matching registered record found."
        status = "error"

    return render_template(
        "status.html",
        message=message,
        status=status,
        file_hash=file_hash,
        record=record,
    )
