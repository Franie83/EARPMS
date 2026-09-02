
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

ROLES={"super-admin","director","principal","teacher"}

def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper

def roles_required(*roles):
    allowed=set(roles)
    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            role=get_jwt().get("role")
            if role not in allowed:
                return jsonify(error="Forbidden"),403
            return fn(*args, **kwargs)
        return wrapper
    return deco
