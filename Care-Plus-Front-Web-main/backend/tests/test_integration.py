from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import database as store
from database import Account, Base, Device, Run, transaction
from main import app
from security import digest

@pytest.fixture
def client(tmp_path):
    # TEST_DATABASE_URL may point at a disposable PostgreSQL DB for real row-lock testing.
    import os
    url = os.getenv("TEST_DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    store.configure(url)
    schema = None
    original_engine = store.engine
    if original_engine.dialect.name == "postgresql":
        from uuid import uuid4
        from sqlalchemy import text
        schema = "care_test_" + uuid4().hex
        with original_engine.begin() as conn:
            conn.execute(text(f'CREATE SCHEMA "{schema}"'))
        store.engine = original_engine.execution_options(schema_translate_map={None: schema})
        store.Session.configure(bind=store.engine)
    Base.metadata.create_all(store.engine)
    with TestClient(app) as c:
        yield c
    if schema:
        with original_engine.begin() as conn:
            conn.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
    original_engine.dispose()

def register(c, name="demo"):
    r = c.post("/cadastro", json={"nome": name, "carteirinha": name, "senha": "teste-12345", "trofeus": 99999})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"Authorization": "Bearer " + data["token"]}, data["usuario"]["generation"]

def setup(c):
    h, generation = register(c)
    r = c.post("/demo/mode", headers=h, json={"demo": True, "generation": generation})
    assert r.status_code == 200, r.text
    generation = r.json()["generation"]
    with transaction() as db:
        for id_, kind in (("band", "band"), ("lamp", "lamp")):
            db.add(Device(id=id_, account_id="demo", kind=kind, token_hash=digest(id_ + "-secret")))
    return h, generation

def sync(c, gen, events=None, device="band", **extra):
    return c.post(f"/devices/{device}/sync", headers={"Authorization": "Bearer " + device + "-secret"},
                  json=dict(generation=gen, events=events or [], **extra))

def ev(id_, type_, **kwargs):
    return dict(id=id_, type=type_, **kwargs)

def test_e2e_duplicate_reset_and_lamp(client):
    c = client
    h, g = setup(c)
    # No browser read is needed to calculate points and missions.
    events = [ev("steps-1", "steps", steps=20), ev("water-1", "water"), ev("water-2", "water")]
    r = sync(c, g, events)
    assert r.status_code == 200, r.text
    assert sync(c, g, events).json()["outcomes"][0]["duplicate"]
    state = c.get("/connect", headers=h).json()
    assert state["usuario"]["trofeus"] == 100
    assert state["pedometro"]["steps"] == 20
    assert state["aguaMl"] == 440
    assert state["luminaria"]["cor"] == "azul"
    mission = state["manuais"][0]
    sel = c.post("/missions/select", headers=h, json={"idMissao": mission["id"], "generation": g}).json()["selection"]
    r = sync(c, g, [ev("confirm-1", "confirm", selection_token=sel["token"])])
    assert r.json()["outcomes"][0]["result"] == "completed"
    sync(c, g, [ev("confirm-2", "confirm", selection_token=sel["token"])])
    state = c.get("/connect", headers=h).json()
    assert state["usuario"]["trofeus"] == 100 + mission["trofeus"]
    assert state["luminaria"]["cor"] == "verde"
    assert not state["luminaria"]["confirmada"]
    light = sync(c, g, device="lamp").json()["desired"]
    sync(c, g, device="lamp", applied={"revision": light["revision"], "color": light["cor"]})
    assert c.get("/connect", headers=h).json()["luminaria"]["confirmada"]
    assert c.post("/demo/reset", headers=h, json={"generation": g}).status_code == 400
    fresh = c.post("/demo/reset", headers=h, json={"generation": g, "confirmation": "REINICIAR"}).json()
    assert fresh["generation"] != g
    assert all(d["resetPending"] for d in fresh["devices"])
    assert fresh["usuario"]["trofeus"] == fresh["aguaMl"] == fresh["pedometro"]["steps"] == 0
    assert fresh["usuario"]["nome"] == "demo"
    assert {d["deviceId"] for d in fresh["devices"]} == {"band", "lamp"}
    # Old offline batch is invalid, including events never seen before reset.
    r = sync(c, g, [ev("offline-water", "water"), ev("offline-steps", "steps", steps=50)])
    assert r.json()["reset_required"]
    assert not r.json()["outcomes"]
    assert c.get("/connect", headers=h).json()["aguaMl"] == 0
    assert not c.get("/connect", headers=h).json()["luminaria"]["confirmada"]
    # API and device reboot/recreation keep the database authoritative.
    with TestClient(app) as reopened:
        assert reopened.get("/connect", headers=h).json()["generation"] == fresh["generation"]
    with store.Session() as db:
        assert len(list(db.scalars(select(Run).where(Run.account_id == "demo")))) == 3


def test_fair_handoff_keeps_accounts_separate(client, monkeypatch):
    c = client
    admin, original_generation = setup(c)
    visitor_a, _ = register(c, "visitor-a")
    visitor_b, _ = register(c, "visitor-b")
    monkeypatch.setenv("FAIR_ADMIN_ACCOUNT", "demo")
    assert c.get("/fair/admin", headers=visitor_a).status_code == 403
    assert c.post("/fair/admin/start", headers=visitor_a, json={"carteirinha": "visitor-b"}).status_code == 403
    assert c.get("/fair/admin", headers=admin).json()["activeAccount"] is None

    first = c.post("/fair/admin/start", headers=admin, json={"carteirinha": "visitor-a"})
    assert first.status_code == 200, first.text
    generation_a = first.json()["generation"]
    assert c.post("/fair/admin/start", headers=admin, json={"carteirinha": "visitor-b"}).status_code == 409
    assert c.get("/connect", headers=visitor_a).json()["usuario"]["trofeus"] == 0
    assert sync(c, original_generation, [ev("old-water", "water")]).json()["reset_required"]
    assert sync(c, generation_a, [ev("a-water", "water")]).status_code == 200
    assert c.get("/connect", headers=visitor_a).json()["aguaMl"] == 220
    assert c.get("/connect", headers=admin).json()["aguaMl"] == 0

    assert c.post("/fair/admin/end", headers=admin).status_code == 200
    second = c.post("/fair/admin/start", headers=admin, json={"carteirinha": "visitor-b"})
    assert second.status_code == 200, second.text
    generation_b = second.json()["generation"]
    assert sync(c, generation_a, [ev("late-water", "water")]).json()["reset_required"]
    assert c.get("/connect", headers=visitor_b).json()["aguaMl"] == 0
    assert sync(c, generation_b, [ev("b-steps", "steps", steps=10)]).status_code == 200
    assert c.get("/connect", headers=visitor_b).json()["pedometro"]["steps"] == 10
    assert c.get("/connect", headers=visitor_a).json()["aguaMl"] == 220

def test_parallel_awards_and_scan(client):
    c = client
    h, g = setup(c)
    m = c.get("/connect", headers=h).json()["manuais"][0]
    def conclude(_):
        return c.post("/concluir-missao-geral", headers=h, json={"generation": g, "idMissao": m["id"], "trofeus": 999999})
    with ThreadPoolExecutor(max_workers=8) as pool:
        responses = list(pool.map(conclude, range(12)))
    assert all(r.status_code == 200 for r in responses)
    assert c.get("/usuario/demo", headers=h).json()["trofeus"] == m["trofeus"]
    assert c.post("/concluir-missao", headers=h, json={"generation": g, "idMissao": "missing", "trofeus": 99}).status_code == 404
    with ThreadPoolExecutor(max_workers=8) as pool:
        responses = list(pool.map(lambda _: c.post("/recompensa-scan", headers=h, json={"generation": g}), range(8)))
    assert all(r.status_code == 200 for r in responses)
    assert c.get("/usuario/demo", headers=h).json()["trofeus"] == m["trofeus"] + 20
    with ThreadPoolExecutor(max_workers=8) as pool:
        responses = list(pool.map(lambda _: sync(c, g, [ev("same", "steps", steps=20)]), range(8)))
    assert all(r.status_code == 200 for r in responses)
    assert c.get("/connect", headers=h).json()["pedometro"]["steps"] == 20

def test_cancel_sos_isolation_and_validation(client):
    c = client
    h, g = setup(c)
    h2, _ = register(c, "other")
    assert c.get("/usuario/demo").status_code == 401
    assert c.get("/usuario/demo", headers=h2).status_code == 403
    assert c.post("/login", json={"carteirinha": "demo", "senha": "wrong123"}).status_code == 401
    assert c.get("/usuario/demo", headers=h).json()["trofeus"] == 0
    assert sync(c, g, [ev("bad", "steps", steps=-1)]).status_code == 422
    assert sync(c, g, [ev("bad", "water")], device="lamp").status_code == 403
    assert sync(c, g, [ev("noselection", "confirm")]).json()["outcomes"][0]["result"] == "no_selection"
    state = c.get("/connect", headers=h).json()
    m = state["manuais"][0]
    sel = c.post("/missions/select", headers=h, json={"idMissao": m["id"], "generation": g}).json()["selection"]
    sync(c, g, [ev("water", "water"), ev("cancel", "cancel", selection_token=sel["token"])])
    state = c.get("/connect", headers=h).json()
    assert state["selection"] is None and state["aguaMl"] == 220
    sync(c, g, [ev("sos", "sos")])
    state = c.get("/connect", headers=h).json()
    assert state["sos"] and state["luminaria"]["cor"] == "vermelha"
    assert c.get("/connect", headers=h2).json()["sos"] is None
    c.post("/sos/resolve", headers=h, json={"generation": g})
    assert c.get("/connect", headers=h).json()["sos"] is None
    assert c.get("/ranking", headers=h).json()[0]["atual"]
    assert len(c.get("/ranking", headers=h).json()) == 1  # demo and normal are separate

def test_old_day_offline_and_stale_selection(client):
    c = client
    h, g = setup(c)
    from domain import day_at
    # 01:00 UTC is still the previous day in Sao Paulo.
    ts = int(datetime(2026, 1, 2, 1, tzinfo=timezone.utc).timestamp())
    assert day_at(ts) == "2026-01-01"
    with transaction() as db:
        db.get(Run, g).created_at = ts - 1000
    sync(c, g, [ev("yesterday", "steps", steps=20, occurred_at=ts)])
    assert c.get("/connect", headers=h).json()["pedometro"]["steps"] == 0
    assert c.get("/connect", headers=h).json()["usuario"]["trofeus"] == 50
    ms = c.get("/connect", headers=h).json()["manuais"]
    sel = c.post("/missions/select", headers=h, json={"idMissao": ms[0]["id"], "generation": g}).json()["selection"]
    c.post("/missions/select", headers=h, json={"idMissao": ms[1]["id"], "generation": g})
    r = sync(c, g, [ev("stale", "confirm", selection_token=sel["token"])])
    assert r.json()["outcomes"][0]["result"] == "selection_changed"
    assert c.get("/connect", headers=h).json()["selection"]["id"] == ms[1]["id"]

def test_benefits_balance_normal_preserved_and_offline(client):
    c = client
    h, normal = register(c)
    c.post("/recompensa-scan", headers=h, json={"generation": normal})
    with transaction() as db:
        a = db.get(Account, "demo")
        r = db.get(Run, a.active_run)
        state = dict(r.state)
        state.update(balance=1000, earned=1000)
        r.state = state
    first = c.post("/resgatar-beneficio", headers=h, json={"generation": normal, "idBeneficio": 1}).json()["usuario"]
    second = c.post("/resgatar-beneficio", headers=h, json={"generation": normal, "idBeneficio": 1}).json()["usuario"]
    assert first["trofeus"] == second["trofeus"] == 600
    assert second["trofeusAcumulados"] == 1000
    demo = c.post("/demo/mode", headers=h, json={"generation": normal, "demo": True}).json()
    assert demo["usuario"]["trofeus"] == 0
    restored = c.post("/demo/mode", headers=h, json={"generation": demo["generation"], "demo": False}).json()
    assert restored["usuario"]["trofeus"] == 600
    assert restored["usuario"]["trofeusAcumulados"] == 1000
    assert c.post("/demo/reset", headers=h, json={"generation": normal, "confirmation": "REINICIAR"}).status_code == 409
    assert restored["pedometro"]["status"] == "offline"

def test_stale_ack_conflicting_id_and_reset_retry(client):
    c = client
    h, g = setup(c)
    initial = sync(c, g, device="lamp").json()["desired"]
    sync(c, g, [ev("water-1", "water"), ev("water-2", "water")])
    # An ACK of the old color does not confirm the new requested color.
    sync(c, g, device="lamp", applied={"revision": initial["revision"], "color": initial["cor"]})
    assert not c.get("/connect", headers=h).json()["luminaria"]["confirmada"]
    r = sync(c, g, [ev("new-before-conflict", "water"), ev("water-1", "steps", steps=3)])
    assert r.status_code == 409
    assert c.get("/connect", headers=h).json()["aguaMl"] == 440  # whole batch rolled back
    bad = sync(c, g, [ev("future", "water", occurred_at=store.now_ts() + 4000)])
    assert bad.json()["outcomes"][0]["result"] == "invalid_time"
    with transaction() as db:
        db.get(Device, "band").last_seen = store.now_ts() - 16
    assert c.get("/connect", headers=h).json()["pedometro"]["status"] == "offline"
    reset_request = {"generation": g, "confirmation": "REINICIAR"}
    reset = c.post("/demo/reset", headers=h, json=reset_request)
    assert reset.status_code == 200
    assert c.post("/demo/reset", headers=h, json=reset_request).status_code == 409
    new_g = reset.json()["generation"]
    # A previous revision can never acknowledge a reset generation.
    sync(c, new_g, device="lamp", applied={"revision": initial["revision"], "color": initial["cor"]})
    assert not c.get("/connect", headers=h).json()["luminaria"]["confirmada"]
    with transaction() as db:
        db.get(Device, "band").diagnostics = {"queueFull": True, "queueDepth": 128}
    assert c.get("/connect", headers=h).json()["devices"][0]["diagnostics"]["queueFull"]

def test_login_profile_whitelist_and_logout(client):
    c = client
    h, _ = register(c)
    login = c.post("/login", json={"carteirinha": "demo", "senha": "teste-12345"})
    assert login.status_code == 200
    second = {"Authorization": "Bearer " + login.json()["token"]}
    r = c.post("/perfil", headers=second, json={"nome": "Nome atualizado", "trofeus": 99999,
                                               "carteirinha": "other", "senha": "new-password"})
    assert r.status_code == 200
    user = r.json()["usuario"]
    assert user["carteirinha"] == "demo" and user["trofeus"] == 0 and user["nome"] == "Nome atualizado"
    assert c.post("/logout", headers=second).status_code == 200
    assert c.get("/connect", headers=second).status_code == 401
    assert c.get("/connect", headers=h).status_code == 200
    assert c.post("/login", json={"carteirinha": "demo", "senha": "teste-12345"}).status_code == 200
