"""
Meridian Retail Group — Auth Service Tests
Run: pytest tests/ -v
"""

import os
os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    from main import app, Base, engine
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


def test_health(client):
    r = client.get("/healthz")
    assert r.status_code == 200


def test_signup_returns_token(client):
    r = client.post("/api/auth/signup", json={
        "email": "test@meridian.com",
        "password": "SecurePass123",
        "full_name": "Test User",
    })
    assert r.status_code == 201
    assert "access_token" in r.json()


def test_signup_duplicate_email_rejected(client):
    client.post("/api/auth/signup", json={
        "email": "dup@meridian.com", "password": "pass123", "full_name": "A"
    })
    r = client.post("/api/auth/signup", json={
        "email": "dup@meridian.com", "password": "pass456", "full_name": "B"
    })
    assert r.status_code == 409


def test_login_success(client):
    client.post("/api/auth/signup", json={
        "email": "login@meridian.com", "password": "mypassword", "full_name": "Login Test"
    })
    r = client.post("/api/auth/login", json={
        "email": "login@meridian.com", "password": "mypassword"
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client):
    client.post("/api/auth/signup", json={
        "email": "wrong@meridian.com", "password": "correctpass", "full_name": "C"
    })
    r = client.post("/api/auth/login", json={
        "email": "wrong@meridian.com", "password": "wrongpass"
    })
    assert r.status_code == 401


def test_me_requires_token(client):
    r = client.get("/api/auth/me")
    assert r.status_code in [401, 403]
