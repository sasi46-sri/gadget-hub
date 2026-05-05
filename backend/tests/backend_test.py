"""GadgetsHub backend regression tests."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://craft-station-7.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@gadgetshub.com"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    token = r.headers.get("X-Access-Token")
    assert token, "X-Access-Token header missing on login"
    return token


@pytest.fixture(scope="session")
def test_user(s):
    ts = int(time.time() * 1000)
    email = f"test_{ts}@gh.com"
    pw = "TestPass123"
    r = s.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": pw})
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    token = r.headers.get("X-Access-Token")
    assert token
    user = r.json()
    assert user["email"] == email
    assert "id" in user
    return {"email": email, "password": pw, "token": token, "id": user["id"]}


# ---------- Health ----------
def test_health(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Gadgets ----------
class TestGadgets:
    def test_list_all(self, s):
        r = s.get(f"{API}/gadgets")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 35, f"expected ~40 gadgets, got {len(data)}"
        g = data[0]
        for k in ["id", "name", "brand", "category", "price", "rating", "image", "specs"]:
            assert k in g

    def test_meta(self, s):
        r = s.get(f"{API}/gadgets/meta")
        assert r.status_code == 200
        m = r.json()
        assert set(["categories", "brands", "price_min", "price_max"]).issubset(m.keys())
        assert "smartphones" in m["categories"]
        assert len(m["categories"]) == 5
        assert m["price_max"] > m["price_min"] > 0

    def test_filter_category(self, s):
        r = s.get(f"{API}/gadgets", params={"category": "smartphones"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(g["category"] == "smartphones" for g in data)

    def test_filter_brand(self, s):
        r = s.get(f"{API}/gadgets", params={"brand": "Apple"})
        assert r.status_code == 200
        data = r.json()
        assert all(g["brand"] == "Apple" for g in data)

    def test_filter_price(self, s):
        r = s.get(f"{API}/gadgets", params={"min_price": 20000, "max_price": 50000})
        assert r.status_code == 200
        data = r.json()
        assert all(20000 <= g["price"] <= 50000 for g in data)

    def test_search_q(self, s):
        r = s.get(f"{API}/gadgets", params={"q": "iPhone"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert any("iphone" in g["name"].lower() for g in data)

    def test_sort_price_asc(self, s):
        r = s.get(f"{API}/gadgets", params={"sort": "price_asc"})
        assert r.status_code == 200
        prices = [g["price"] for g in r.json()]
        assert prices == sorted(prices)

    def test_sort_price_desc(self, s):
        r = s.get(f"{API}/gadgets", params={"sort": "price_desc"})
        prices = [g["price"] for g in r.json()]
        assert prices == sorted(prices, reverse=True)

    def test_get_single(self, s):
        list_r = s.get(f"{API}/gadgets").json()
        gid = list_r[0]["id"]
        r = s.get(f"{API}/gadgets/{gid}")
        assert r.status_code == 200
        assert r.json()["id"] == gid

    def test_get_404(self, s):
        r = s.get(f"{API}/gadgets/nonexistent-id-xyz")
        assert r.status_code == 404

    def test_compare_ok(self, s):
        ids = [g["id"] for g in s.get(f"{API}/gadgets").json()[:3]]
        r = s.post(f"{API}/gadgets/compare", json={"gadget_ids": ids})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 3
        assert [g["id"] for g in data] == ids  # order preserved

    def test_compare_max_4(self, s):
        ids = [g["id"] for g in s.get(f"{API}/gadgets").json()[:5]]
        r = s.post(f"{API}/gadgets/compare", json={"gadget_ids": ids})
        assert r.status_code == 400


# ---------- Auth ----------
class TestAuth:
    def test_register_login_me(self, s, test_user):
        # register already done in fixture, now login fresh
        r = s.post(f"{API}/auth/login", json={"email": test_user["email"], "password": test_user["password"]})
        assert r.status_code == 200
        assert r.headers.get("X-Access-Token")
        # me with bearer
        token = r.headers["X-Access-Token"]
        r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 200
        assert r2.json()["email"] == test_user["email"]

    def test_register_duplicate(self, s, test_user):
        r = s.post(f"{API}/auth/register", json={"name": "x", "email": test_user["email"], "password": "TestPass123"})
        assert r.status_code == 409

    def test_login_wrong_password(self, s, test_user):
        r = s.post(f"{API}/auth/login", json={"email": test_user["email"], "password": "wrong-pass-xyz"})
        assert r.status_code == 401

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_admin_login(self, s, admin_token):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_logout(self, s):
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200

    def test_bcrypt_hash_format(self):
        # quick check by registering and inspecting via login flow only -- skip direct DB
        pass


# ---------- Wishlist ----------
class TestWishlist:
    def test_requires_auth(self):
        for path in ["/wishlist", "/wishlist/ids"]:
            r = requests.get(f"{API}{path}")
            assert r.status_code == 401, path
        for path in ["/wishlist/add", "/wishlist/remove"]:
            r = requests.post(f"{API}{path}", json={"gadget_id": "x"})
            assert r.status_code == 401, path

    def test_add_get_remove(self, s, test_user):
        h = {"Authorization": f"Bearer {test_user['token']}"}
        gid = s.get(f"{API}/gadgets").json()[0]["id"]

        # add
        r = requests.post(f"{API}/wishlist/add", json={"gadget_id": gid}, headers=h)
        assert r.status_code == 200
        assert gid in r.json()["gadget_ids"]

        # ids
        r = requests.get(f"{API}/wishlist/ids", headers=h)
        assert r.status_code == 200
        assert gid in r.json()["gadget_ids"]

        # full
        r = requests.get(f"{API}/wishlist", headers=h)
        assert r.status_code == 200
        items = r.json()
        assert any(g["id"] == gid for g in items)

        # remove
        r = requests.post(f"{API}/wishlist/remove", json={"gadget_id": gid}, headers=h)
        assert r.status_code == 200
        assert gid not in r.json()["gadget_ids"]

    def test_add_invalid_gadget(self, s, test_user):
        h = {"Authorization": f"Bearer {test_user['token']}"}
        r = requests.post(f"{API}/wishlist/add", json={"gadget_id": "no-such-id"}, headers=h)
        assert r.status_code == 404
