import copy
import hmac
import os
import secrets
from contextlib import asynccontextmanager
from typing import Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

import database as store
from database import Account, Device, DeviceEvent, LoginSession, Run, lock_account, now_ts, transaction
from domain import (BENEFITS, complete_manual, credit, daily, day_at, desired, evaluate,
                    load_state, missions, new_run, snapshot, user_view)
from security import digest, password_hash, password_valid

@asynccontextmanager
async def lifespan(_):
    if store.engine is None:
        store.configure()
    yield

app = FastAPI(title="Boost Care HTTPS API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")],
                   allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"], allow_credentials=False)

class Credentials(BaseModel):
    carteirinha: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")
    senha: str = Field(min_length=8, max_length=128)

class Registration(Credentials):
    nome: str = Field(min_length=1, max_length=100)
    model_config = ConfigDict(extra="allow")

PROFILE_FIELDS = {"nome", "peso", "altura", "atividadeFisica", "tempoSentado", "distanciaDia", "agua", "sono", "celular", "pausas", "cafeina", "arLivre", "refeicoes"}

def bearer(authorization):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Entre novamente para continuar.")
    return authorization[7:]

def user_id(authorization: str | None = Header(default=None)):
    token = bearer(authorization)
    with store.Session() as db:
        session = db.get(LoginSession, digest(token))
        if not session or session.expires_at <= now_ts():
            raise HTTPException(401, "Sessão expirada. Entre novamente.")
        return session.account_id

def authorize_path(account_id, carteirinha):
    if account_id != carteirinha:
        raise HTTPException(403, "Esta conta não pertence à sessão.")

def issue_session(db, account, run, state):
    token = secrets.token_urlsafe(32)
    db.add(LoginSession(token_hash=digest(token), account_id=account.id, expires_at=now_ts() + 7 * 86400))
    return dict(status="ok", token=token, usuario=user_view(account, run, state))

def expected(data, run):
    if data.get("generation") != run.id:
        raise HTTPException(409, "Sessão de progresso mudou. Atualize a página antes de tentar novamente.")

@app.get("/")
def home():
    return {"mensagem": "Boost Care HTTPS API", "version": 2}

@app.get("/health")
def health():
    with store.Session() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok"}

@app.post("/cadastro")
def register(data: Registration):
    profile = {k: v for k, v in data.model_dump().items() if k in PROFILE_FIELDS and isinstance(v, str)}
    profile["nome"] = data.nome.strip()
    if not profile["nome"]:
        raise HTTPException(422, "Informe o nome.")
    try:
        with transaction() as db:
            if db.get(Account, data.carteirinha):
                raise HTTPException(409, "Carteirinha já cadastrada. Entre para alterar seu perfil.")
            run_id = str(uuid4())
            account = Account(id=data.carteirinha, profile=profile, password_hash=password_hash(data.senha),
                              active_run=run_id, normal_run=run_id, public_id=str(uuid4()))
            db.add(account)
            db.flush()
            run = new_run(db, account, False)
            run.id = run_id
            return issue_session(db, account, run, run.state)
    except IntegrityError as exc:
        raise HTTPException(409, "Carteirinha já cadastrada.") from exc

@app.post("/login")
def login(data: Credentials):
    with transaction() as db:
        account = lock_account(db, data.carteirinha)
        if not account or not password_valid(data.senha, account.password_hash):
            raise HTTPException(401, "Carteirinha ou senha inválida.")
        run, state = load_state(db, account)
        return issue_session(db, account, run, state)

@app.post("/logout")
def logout(authorization: str | None = Header(default=None), account_id=Depends(user_id)):
    with transaction() as db:
        session = db.get(LoginSession, digest(bearer(authorization)))
        if session:
            db.delete(session)
    return {"status": "ok"}

@app.post("/perfil")
def update_profile(data: dict, account_id=Depends(user_id)):
    with transaction() as db:
        account = lock_account(db, account_id)
        profile = dict(account.profile)
        profile.update({k: str(v)[:100] for k, v in data.items() if k in PROFILE_FIELDS})
        if not profile.get("nome", "").strip():
            raise HTTPException(422, "Informe o nome.")
        account.profile = profile
        run, state = load_state(db, account)
        return {"usuario": user_view(account, run, state)}

@app.get("/usuario/{carteirinha}")
def get_user(carteirinha: str, account_id=Depends(user_id)):
    authorize_path(account_id, carteirinha)
    with transaction() as db:
        account = lock_account(db, account_id)
        run, state = load_state(db, account)
        return user_view(account, run, state)

@app.get("/connect")
def connect(account_id=Depends(user_id)):
    with transaction() as db:
        account = lock_account(db, account_id)
        run, state = load_state(db, account)
        data = snapshot(db, account, run, state)
        data["fairAdmin"] = bool(os.getenv("FAIR_ADMIN_ACCOUNT") and account_id == os.getenv("FAIR_ADMIN_ACCOUNT"))
        data["fairEnabled"] = bool(os.getenv("FAIR_ADMIN_ACCOUNT"))
        run.state = state
        return data


def fair_admin(account_id):
    if not os.getenv("FAIR_ADMIN_ACCOUNT") or account_id != os.getenv("FAIR_ADMIN_ACCOUNT"):
        raise HTTPException(403, "Acesso restrito ao responsável pela demonstração.")


def fair_devices(db, admin):
    ids = admin.profile.get("fairDeviceIds")
    if ids:
        devices = list(db.scalars(select(Device).where(Device.id.in_(ids)).order_by(Device.id).with_for_update()))
    else:
        devices = list(db.scalars(select(Device).where(Device.account_id == admin.id).order_by(Device.id).with_for_update()))
        if len(devices) == 2 and {d.kind for d in devices} == {"band", "lamp"}:
            admin.profile = {**admin.profile, "fairDeviceIds": [d.id for d in devices]}
    if len(devices) != 2 or {d.kind for d in devices} != {"band", "lamp"}:
        raise HTTPException(409, "A demonstração exige uma pulseira e uma luminária vinculadas à conta responsável.")
    if devices[0].account_id != devices[1].account_id:
        raise HTTPException(409, "Os aparelhos estão vinculados a contas diferentes.")
    return devices


@app.get("/fair/admin")
def fair_status(account_id=Depends(user_id)):
    fair_admin(account_id)
    with transaction() as db:
        admin = lock_account(db, account_id)
        devices = fair_devices(db, admin)
        owner = db.get(Account, devices[0].account_id)
        return {"activeAccount": None if owner.id == admin.id else owner.id,
                "activeName": None if owner.id == admin.id else owner.profile.get("nome", ""),
                "devices": [{"id": d.id, "kind": d.kind, "status": "online" if d.last_seen and now_ts() - d.last_seen <= 15 else "offline",
                             "synchronized": d.generation == owner.active_run} for d in devices]}


class FairStart(BaseModel):
    carteirinha: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")


@app.post("/fair/admin/start")
def fair_start(data: FairStart, account_id=Depends(user_id)):
    fair_admin(account_id)
    if data.carteirinha == account_id:
        raise HTTPException(400, "Escolha a conta do participante.")
    with transaction() as db:
        admin = lock_account(db, account_id)
        devices = fair_devices(db, admin)
        if devices[0].account_id != account_id:
            raise HTTPException(409, "Encerre a vez atual antes de iniciar outra.")
        participant = lock_account(db, data.carteirinha)
        if not participant:
            raise HTTPException(404, "Conta do participante não encontrada.")
        run = new_run(db, participant, True)
        participant.active_run = run.id
        for device in devices:
            device.account_id = participant.id
            device.generation = ""
            device.applied_revision = ""
            device.applied_color = ""
            device.applied_at = None
        return {"activeAccount": participant.id, "activeName": participant.profile.get("nome", ""),
                "generation": run.id}


@app.post("/fair/admin/end")
def fair_end(account_id=Depends(user_id)):
    fair_admin(account_id)
    with transaction() as db:
        admin = lock_account(db, account_id)
        devices = fair_devices(db, admin)
        previous = devices[0].account_id
        if previous == account_id:
            return {"activeAccount": None}
        run = new_run(db, admin, True)
        admin.active_run = run.id
        for device in devices:
            device.account_id = admin.id
            device.generation = ""
            device.applied_revision = ""
            device.applied_color = ""
            device.applied_at = None
        return {"activeAccount": None, "previousAccount": previous}

@app.get("/missoes/{carteirinha}")
def personal(carteirinha: str, account_id=Depends(user_id)):
    authorize_path(account_id, carteirinha)
    return [m for m in connect(account_id)["manuais"] if m["kind"] == "personalizada" and not m["concluida"]]

@app.get("/missoes-gerais")
def general(carteirinha: str, account_id=Depends(user_id)):
    authorize_path(account_id, carteirinha)
    return [m for m in connect(account_id)["manuais"] if m["kind"] == "geral" and not m["concluida"]]

@app.post("/concluir-missao")
@app.post("/concluir-missao-geral")
def complete(data: dict, account_id=Depends(user_id)):
    with transaction() as db:
        account = lock_account(db, account_id)
        run, state = load_state(db, account)
        expected(data, run)
        result = complete_manual(db, account, run, state, data.get("idMissao"))
        if result == "mission_not_active":
            raise HTTPException(404, "Missão não está ativa hoje.")
        run.state = state
        remaining = [m for m in missions(account, state) if not m["concluida"]]
        return dict(status=result, missoes=[m for m in remaining if m["kind"] == "personalizada"],
                    missoesGerais=[m for m in remaining if m["kind"] == "geral"], usuario=user_view(account, run, state))

@app.post("/missions/select")
def select_mission(data: dict, account_id=Depends(user_id)):
    with transaction() as db:
        account = lock_account(db, account_id)
        run, state = load_state(db, account)
        expected(data, run)
        m = next((m for m in missions(account, state) if m["id"] == data.get("idMissao") and not m["concluida"]), None)
        if not m:
            raise HTTPException(404, "Selecione uma missão manual ativa.")
        state["selection"] = {"id": m["id"], "token": str(uuid4()), "titulo": m.get("titulo", m.get("missao"))}
        run.state = state
        return {"selection": state["selection"]}

@app.post("/missions/cancel")
def cancel_mission(data: dict, account_id=Depends(user_id)):
    with transaction() as db:
        account = lock_account(db, account_id)
        run, state = load_state(db, account)
        expected(data, run)
        state["selection"] = None
        run.state = state
        return {"status": "cancelled"}

@app.post("/demo/mode")
def demo_mode(data: dict, account_id=Depends(user_id)):
    if type(data.get("demo")) is not bool:
        raise HTTPException(422, "Informe demo: true ou false.")
    with transaction() as db:
        account = lock_account(db, account_id)
        run, state = load_state(db, account)
        expected(data, run)
        if data["demo"] != run.demo:
            run = new_run(db, account, True) if data["demo"] else db.get(Run, account.normal_run)
            account.active_run = run.id
            state = copy.deepcopy(run.state)
        result = snapshot(db, account, run, state)
        run.state = state
        return result

@app.post("/demo/reset")
def reset(data: dict, account_id=Depends(user_id)):
    if data.get("confirmation") != "REINICIAR":
        raise HTTPException(400, "Confirme o reinício da demonstração no site.")
    with transaction() as db:
        account = lock_account(db, account_id)
        run, _ = load_state(db, account)
        expected(data, run)
        if not run.demo:
            raise HTTPException(409, "O reset só está disponível em demonstração.")
        run = new_run(db, account, True)
        account.active_run = run.id
        # Archived runs, ledgers and IDs are retained. Device association is preserved.
        return snapshot(db, account, run, run.state)

@app.post("/sos/resolve")
def resolve_sos(data: dict, account_id=Depends(user_id)):
    with transaction() as db:
        account = lock_account(db, account_id)
        run, state = load_state(db, account)
        expected(data, run)
        state["sos"] = None
        run.state = state
        return {"status": "resolved"}

@app.get("/beneficios")
def benefits():
    return BENEFITS

@app.get("/beneficios-sorteados")
def available(carteirinha: str, quantidade: int = 6, renovar: bool = False, account_id=Depends(user_id)):
    authorize_path(account_id, carteirinha)
    return BENEFITS[:max(0, min(quantidade, 20))]

@app.post("/resgatar-beneficio")
def redeem(data: dict, account_id=Depends(user_id)):
    with transaction() as db:
        account = lock_account(db, account_id)
        run, state = load_state(db, account)
        expected(data, run)
        benefit = next((b for b in BENEFITS if b["id"] == data.get("idBeneficio")), None)
        if not benefit:
            raise HTTPException(404, "Benefício não encontrado.")
        if not any(b["id"] == benefit["id"] for b in state["benefits"]):
            if state["balance"] < benefit["custoTrofeus"]:
                raise HTTPException(409, "Troféus insuficientes.")
            credit(db, run, state, f"benefit:{benefit['id']}", -benefit["custoTrofeus"])
            state["benefits"].append(benefit)
        run.state = state
        return dict(status="ok", beneficio=benefit, usuario=user_view(account, run, state))

@app.post("/recompensa-scan")
def scan(data: dict, account_id=Depends(user_id)):
    with transaction() as db:
        account = lock_account(db, account_id)
        run, state = load_state(db, account)
        expected(data, run)
        day = day_at()
        if day not in state["scan"]:
            reward = dict(tipo="trofeus", titulo="Recompensa diária", destaque="+20 troféus",
                          descricao="Participação na demonstração diária. Sem análise facial.", valor=20)
            credit(db, run, state, f"scan:{day}", 20)
            state["scan"][day] = reward
        run.state = state
        return dict(recompensa=state["scan"][day], usuario=user_view(account, run, state))

@app.get("/ranking")
def ranking(account_id=Depends(user_id)):
    with store.Session() as db:
        current = db.get(Account, account_id)
        demo = db.get(Run, current.active_run).demo
        rows = db.execute(select(Account, Run).join(Run, Account.active_run == Run.id).where(Run.demo == demo)).all()
        result = [dict(id=a.public_id, nome=a.profile["nome"].split()[0], pontos=r.state["earned"], atual=a.id == account_id) for a, r in rows]
        result.sort(key=lambda x: (-x["pontos"], x["id"]))
        return [dict(x, posicao=i + 1) for i, x in enumerate(result)]

class Event(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=80)
    type: Literal["steps", "water", "confirm", "cancel", "sos"]
    steps: int = Field(default=0, ge=0, le=1000, strict=True)
    occurred_at: int | None = Field(default=None, ge=1, le=4102444800)
    selection_token: str = Field(default="", max_length=36)

class Applied(BaseModel):
    revision: str = Field(max_length=100)
    color: Literal["apagada", "roxa", "azul", "verde", "vermelha"]

class Sync(BaseModel):
    generation: str = Field(default="", max_length=36)
    events: list[Event] = Field(default_factory=list, max_length=32)
    applied: Applied | None = None
    queue_depth: int = Field(default=0, ge=0, le=10000)
    queue_full: bool = False
    sensor_ok: bool = True

@app.post("/devices/{device_id}/sync")
def device_sync(device_id: str, data: Sync, authorization: str | None = Header(default=None)):
    token = bearer(authorization)
    with transaction() as db:
        device = db.get(Device, device_id)
        if not device or not hmac.compare_digest(device.token_hash, digest(token)):
            raise HTTPException(401, "Credencial do dispositivo inválida.")
        account = lock_account(db, device.account_id)
        device = db.scalar(select(Device).where(Device.id == device_id).with_for_update().execution_options(populate_existing=True))
        if device.account_id != account.id:
            raise HTTPException(409, "Vínculo do aparelho mudou. Tente sincronizar novamente.")
        run, state = load_state(db, account)
        device.last_seen = now_ts()
        device.diagnostics = dict(queueDepth=data.queue_depth, queueFull=data.queue_full, sensorOk=data.sensor_ok)
        outcomes = []
        mismatch = data.generation != run.id
        if not mismatch:
            selected = state.get("selection")
            if selected and not selected["id"].startswith(day_at() + ":"):
                state["selection"] = None
            device.generation = run.id
            if device.kind == "lamp" and data.events:
                raise HTTPException(403, "Luminária não registra atividade da pulseira.")
            for e in data.events:
                payload = e.model_dump()
                previous = db.get(DeviceEvent, (device.id, e.id))
                if previous:
                    if previous.run_id != run.id or previous.payload != payload:
                        raise HTTPException(409, "ID de evento reutilizado com conteúdo diferente.")
                    outcomes.append(dict(id=e.id, result=previous.result, duplicate=True))
                    continue
                result = "accepted"
                if e.occurred_at and e.occurred_at > now_ts() + 300:
                    result = "invalid_time"
                elif e.occurred_at and e.occurred_at < run.created_at - 300:
                    result = "before_generation"
                else:
                    day = day_at(e.occurred_at)
                    d = daily(state, day)
                    if e.type == "steps":
                        d["steps"] += e.steps
                    elif e.type == "water":
                        d["water"] += state["config"]["cup"]
                    elif e.type == "sos":
                        state["sos"] = dict(eventId=e.id, receivedAt=now_ts(), deviceId=device.id)
                    elif e.type in ("confirm", "cancel"):
                        selection = state.get("selection")
                        if day != day_at():
                            result = "selection_expired"
                        elif not selection:
                            result = "no_selection"
                        elif not e.selection_token or selection["token"] != e.selection_token:
                            result = "selection_changed"
                        elif e.type == "confirm":
                            result = complete_manual(db, account, run, state, selection["id"])
                        else:
                            state["selection"] = None
                            result = "cancelled"
                    if e.type != "steps":
                        state["last_button"] = e.type + ":" + result
                    evaluate(db, run, state, day)
                db.add(DeviceEvent(device_id=device.id, event_id=e.id, run_id=run.id, payload=payload, result=result))
                db.flush()
                outcomes.append(dict(id=e.id, result=result, duplicate=False))
            light = desired(run, state)
            if device.kind == "lamp" and data.applied:
                if data.applied.revision == light["revision"] and data.applied.color == light["cor"]:
                    device.applied_revision = data.applied.revision
                    device.applied_color = data.applied.color
                    device.applied_at = now_ts()
        light = desired(run, state)
        run.state = state
        return dict(generation=run.id, reset_required=mismatch, outcomes=outcomes, desired=light,
                    selection=state.get("selection"), server_time=now_ts(), day=day_at(),
                    steps=daily(state)["steps"], water_ml=daily(state)["water"])
