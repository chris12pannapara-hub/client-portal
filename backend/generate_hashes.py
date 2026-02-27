# backend/generate_hashes.py
from passlib.hash import bcrypt

passwords = {
    "chris@portal.dev": "Chris@123!",
    "admin@portal.dev": "Admin@123!",
    "manager@portal.dev": "Manager@123!",
}

print("-- SQL UPDATE statements with correct hashes:\n")
for email, password in passwords.items():
    hash_value = bcrypt.hash(password)
    print(f"UPDATE users SET password_hash = '{hash_value}' WHERE email = '{email}';")