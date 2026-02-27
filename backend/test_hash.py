# backend/test_hash.py
from passlib.hash import bcrypt

# The hash from our seed data file
seed_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"

# Test if it verifies against our passwords
print("Testing seed data hash against passwords:")
print(f"  'Chris@123!': {bcrypt.verify('Chris@123!', seed_hash)}")
print(f"  'Admin@123!': {bcrypt.verify('Admin@123!', seed_hash)}")

# Generate the CORRECT hash for 'Chris@123!'
print("\n✅ Generating correct hash for 'Chris@123!':")
correct_hash = bcrypt.hash("Chris@123!")
print(correct_hash)