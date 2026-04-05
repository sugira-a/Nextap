#!/usr/bin/env python
"""
Simple API test script to verify backend endpoints
Usage: python test_api.py
"""

import requests
import json
import time
from datetime import datetime, UTC

BASE_URL = "http://localhost:5000"

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"✓ {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

def test_health():
    """Test health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print_response("Health Check", response)
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Health Check failed: {e}")
        return False

def test_api_info():
    """Test API info endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/info", timeout=5)
        print_response("API Info", response)
        return response.status_code == 200
    except Exception as e:
        print(f"✗ API Info failed: {e}")
        return False

def test_register():
    """Test user registration"""
    try:
        unique_email = f"test_{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}@example.com"
        data = {
            "email": unique_email,
            "password": "Test123!@#",
            "first_name": "Test",
            "last_name": "User"
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=data,
            timeout=5,
            headers={"Content-Type": "application/json"}
        )
        print_response("Register User", response)
        
        if response.status_code == 201:
            payload = response.json()
            payload["_test_email"] = unique_email
            return payload
        return None
    except Exception as e:
        print(f"✗ Register failed: {e}")
        return None

def test_login(email, password):
    """Test user login"""
    try:
        data = {
            "email": email,
            "password": password
        }
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=data,
            timeout=5,
            headers={"Content-Type": "application/json"}
        )
        print_response("Login User", response)
        
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"✗ Login failed: {e}")
        return None

def test_get_user(token):
    """Test get current user"""
    try:
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            timeout=5,
            headers={"Authorization": f"Bearer {token}"}
        )
        print_response("Get Current User", response)
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Get user failed: {e}")
        return False


def cleanup_test_user(token):
    """Delete temporary test user created by this script."""
    try:
        response = requests.delete(
            f"{BASE_URL}/api/auth/me",
            timeout=5,
            headers={"Authorization": f"Bearer {token}"}
        )
        print_response("Cleanup Test User", response)
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Cleanup failed: {e}")
        return False

def main():
    print("\n🚀 NexTap Backend API Test Suite")
    print("================================\n")
    
    # Wait for backend to fully start
    print("Checking if backend is ready...")
    for i in range(10):
        try:
            requests.get(f"{BASE_URL}/health", timeout=2)
            print("✓ Backend is ready!\n")
            break
        except:
            if i == 9:
                print("✗ Backend not responding after 10 attempts")
                return
            time.sleep(1)
    
    # Run tests
    success_count = 0
    
    if test_health():
        success_count += 1
    
    if test_api_info():
        success_count += 1
    
    # Test registration
    register_response = test_register()
    if register_response:
        success_count += 1
        token = register_response.get('access_token')
        
        # Test login
        login_response = test_login(register_response.get("_test_email"), "Test123!@#")
        if login_response:
            success_count += 1
            token = login_response.get('access_token')
            
            # Test get user with token
            if test_get_user(token):
                success_count += 1

            # Cleanup temporary user so admin screens stay free of dummy data.
            cleanup_test_user(token)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"📊 Test Summary: {success_count}/5 tests passed")
    print(f"{'='*60}\n")
    
    if success_count == 5:
        print("✓ All tests passed! Backend is working correctly.")
    else:
        print(f"⚠ {5 - success_count} test(s) failed. Check output above.")

if __name__ == "__main__":
    main()
