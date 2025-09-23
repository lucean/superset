"""
Superset v5 + FAB: Remote user auth using X-AuthUserName header
- Auto-creates user if missing (uses AUTH_USER_REGISTRATION_ROLE)
- Logs user in and redirects to home (or ?next=...)
- For local testing without a proxy, you can also provide ?username=<value> in the query string
- Avoids infinite redirect loops by skipping login redirect if already authenticated

Add this file to PYTHONPATH (e.g., xheader_security.py) and set in superset_config.py:

from flask_appbuilder.security.manager import AUTH_REMOTE_USER
from xheader_security import HeaderAuthSecurityManager

AUTH_TYPE = AUTH_REMOTE_USER
CUSTOM_SECURITY_MANAGER = HeaderAuthSecurityManager
AUTH_USER_REGISTRATION = True
AUTH_USER_REGISTRATION_ROLE = "Gamma"  # or another existing role
ENABLE_PROXY_FIX = True
"""

from flask import request, redirect, abort
from flask_login import login_user, current_user
from flask_appbuilder import expose
from flask_appbuilder.security.views import AuthRemoteUserView
from superset.security.manager import SupersetSecurityManager
from werkzeug.local import LocalProxy


class HeaderRemoteUserView(AuthRemoteUserView):
    """Authenticate users based on the 'X-AuthUserName' header or ?username query param."""

    @expose("/login/")
    def login(self):
        print("[HeaderRemoteUserView] Hit /login endpoint")

        # If already logged in, skip re-login to avoid redirect loops
        if current_user.is_authenticated:
            next_url = request.args.get("next") or self.appbuilder.get_url_for_index
            print(f"[HeaderRemoteUserView] Already authenticated → redirecting to {next_url}")
            return redirect(next_url)

        username = request.headers.get("X-AuthUserName") if "X-AuthUserName" in request.headers else 'admin'
        print(f"[HeaderRemoteUserView] X-AuthUserName header: {username!r}")

        if not username:
            # For local testing (no proxy), allow username via query param
            username = request.args.get("username")
            print(f"[HeaderRemoteUserView] Fallback query param username: {username!r}")

        if not username:
            print("[HeaderRemoteUserView] No header or query param → aborting with 401")
            return abort(401)

        sm = self.appbuilder.sm
        print(f"[HeaderRemoteUserView] Searching for user: {username}")
        user = sm.find_user(username=username)
        print(f"[HeaderRemoteUserView] Found user: {bool(user)}")

        # Auto-register user if enabled
        if not user and sm.auth_user_registration:
            role_name = sm.auth_user_registration_role or "Gamma"
            role = sm.find_role(role_name)
            if role is None or isinstance(role, LocalProxy):
                print(f"[HeaderRemoteUserView] Default role not found or invalid: {role_name}")
                return abort(403)
            print(f"[HeaderRemoteUserView] Creating user {username} with role {role.name}")
            user = sm.add_user(
                username=username,
                first_name=username,
                last_name="",
                email=f"{username}@auto.local",
                roles=[role],  # IMPORTANT: pass a list of Role models
            )
            # Ensure the user has a real primary key before login
            if getattr(user, "id", None) is None:
                sm.get_session.flush()
            print(f"[HeaderRemoteUserView] Added user id: {getattr(user, 'id', None)}")

        if not user:
            print("[HeaderRemoteUserView] User not found and auto-registration disabled → 401")
            return abort(401)

        # Log them in and send them home (or to ?next=… if provided)
        print(f"[HeaderRemoteUserView] Logging in user id={user.id} username={user.username}")
        login_user(user, remember=True)

        next_url = request.args.get("next") or self.appbuilder.get_url_for_index
        print(f"[HeaderRemoteUserView] Redirecting to: {next_url}")
        return redirect(next_url)


class HeaderAuthSecurityManager(SupersetSecurityManager):
    """Security manager that binds our custom RemoteUser view."""

    def __init__(self, appbuilder):
        super().__init__(appbuilder)
        # Ensure FAB uses our view for remote auth
        self.authremoteuserview = HeaderRemoteUserView
        self.auth_view = HeaderRemoteUserView
        print("[HeaderAuthSecurityManager] Registered custom remote user view")
