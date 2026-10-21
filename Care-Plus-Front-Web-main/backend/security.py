import hashlib
import hmac
import secrets

def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()

def password_hash(value):
    salt = secrets.token_hex(16)
    result = hashlib.scrypt(value.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
    return f"scrypt${salt}${result}"

def password_valid(value, encoded):
    try:
        _, salt, expected = encoded.split("$")
        actual = hashlib.scrypt(value.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False
