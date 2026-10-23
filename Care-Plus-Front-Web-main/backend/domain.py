"""All progress rules run inside the account transaction, including IoT ingestion."""
import copy
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo
from sqlalchemy import select
from database import Device, Ledger, Run, now_ts

TZ = ZoneInfo("America/Sao_Paulo")
ROOT = Path(__file__).parent
BENEFITS = json.loads((ROOT / "beneficios.json").read_text(encoding="utf-8"))
GENERAL = json.loads((ROOT / "missoesGerais.json").read_text(encoding="utf-8"))
COLORS = {"apagada": ("Apagada", "#9BA3AE", [0, 0, 0]), "amarela": ("Amarela", "#FFFF00", [255, 255, 0]),
          "azul": ("Azul", "#0000FF", [0, 0, 255]), "verde": ("Verde", "#00FF00", [0, 255, 0]),
          "vermelha": ("SOS — vermelha", "#FF0000", [255, 0, 0])}

def day_at(ts=None):
    return datetime.fromtimestamp(now_ts() if ts is None else ts, TZ).date().isoformat()

def config(demo):
    result = {"steps": int(os.getenv("DEMO_STEPS" if demo else "DAILY_STEPS", "20" if demo else "5000")),
            "water": int(os.getenv("DEMO_WATER_ML" if demo else "DAILY_WATER_ML", "440" if demo else "3000")),
            "manual": int(os.getenv("DEMO_MANUAL" if demo else "DAILY_MANUAL", "1")),
            "cup": int(os.getenv("CUP_WATER_ML", "220"))}
    if any(value <= 0 for value in result.values()):
        raise ValueError("Metas e volume do copo devem ser maiores que zero.")
    return result

def new_run(db, account, demo):
    run = Run(id=str(uuid4()), account_id=account.id, demo=demo,
              state={"days": {}, "balance": 0, "earned": 0, "benefits": [], "scan": {},
                     "selection": None, "sos": None, "last_button": "", "config": config(demo)})
    db.add(run)
    return run

def daily(state, day=None):
    return state["days"].setdefault(day or day_at(), {"steps": 0, "water": 0, "manual": 0,
                                                        "completed": [], "missions": None})

def missions(account, state):
    d = daily(state)
    if d["missions"] is None:
        # Keep the existing habit-based rules, now with stable daily IDs.
        from mission_catalog import personalized
        personal = personalized(account.profile)
        # A daily deterministic set cannot regenerate IDs and award the same mission twice.
        offset = sum(map(ord, day_at() + account.id)) % len(GENERAL)
        general = [GENERAL[(offset + i) % len(GENERAL)] for i in range(3)]
        d["missions"] = [dict(m, id=f"{day_at()}:{kind}:{i}", kind=kind, concluida=False)
                         for kind, items in (("personalizada", personal), ("geral", general))
                         for i, m in enumerate(items)]
    return d["missions"]

def credit(db, run, state, key, amount):
    if db.get(Ledger, (run.id, key)):
        return False
    db.add(Ledger(run_id=run.id, key=key, amount=amount))
    state["balance"] += amount
    if amount > 0:
        state["earned"] += amount
    return True

def complete_manual(db, account, run, state, mission_id):
    m = next((m for m in missions(account, state) if m["id"] == mission_id), None)
    if not m:
        return "mission_not_active"
    if m["concluida"]:
        return "already_completed"
    m["concluida"] = True
    d = daily(state)
    d["manual"] += 1
    credit(db, run, state, "mission:" + m["id"], m["trofeus"])
    d["completed"].append(m["id"])
    if (state.get("selection") or {}).get("id") == mission_id:
        state["selection"] = None
    evaluate(db, run, state)
    return "completed"

def evaluate(db, run, state, day=None):
    day = day or day_at()
    d = daily(state, day)
    c = state["config"]
    # Manual missions already grant their own points; this milestone only controls color.
    for key, amount in (("steps", 50), ("water", 50)):
        if d[key] >= c[key] and key not in d["completed"]:
            credit(db, run, state, f"connect:{day}:{key}", amount)
            d["completed"].append(key)

def connect_missions(state):
    d, c = daily(state), state["config"]
    tomorrow = datetime.combine(datetime.now(TZ).date() + timedelta(days=1), datetime.min.time(), TZ)
    seconds = int((tomorrow - datetime.now(TZ)).total_seconds())
    reset = {"seconds": seconds, "label": f"{seconds // 3600}h {(seconds % 3600) // 60}min"}
    return [dict(id=k, titulo=t, tipo=typ, meta=c[k], atual=d[k], unidade=u,
                 trofeus=p, progresso=min(100, int(d[k] / c[k] * 100)),
                 concluida=(k in d["completed"] if k != "manual" else d[k] >= c[k]), resetEm=reset)
            for k, t, typ, u, p in (("steps", f"Dar {c['steps']} passos no dia", "steps", "passos", 50),
                                   ("water", f"Beber {c['water']}ml de água", "water", "ml", 50),
                                   ("manual", f"Concluir {c['manual']} missão manual", "manual", "missões", 0))]

def desired(run, state):
    goals = connect_missions(state)
    level = sum(m["concluida"] for m in goals)
    color = "vermelha" if state.get("sos") else ["apagada", "amarela", "azul", "verde"][level]
    label, hexa, rgb = COLORS[color]
    revision = f"{run.id}:{day_at()}:{color}:palette2"
    return dict(cor=color, label=label, hex=hexa, rgb=rgb, nivel=level, revision=revision,
                fonte="backend", resetEm=goals[0]["resetEm"], eventosConfirmados=level)

def achievements(state):
    days = list(state["days"].values())
    defs = [("first-step", "Primeiros passos", "Registre pelo menos um passo.", any(d["steps"] > 0 for d in days)),
            ("hydrated", "Hidratado", "Complete a meta de água de um dia.", any("water" in d["completed"] for d in days)),
            ("walker", "Caminhante", "Complete a meta de passos de um dia.", any("steps" in d["completed"] for d in days)),
            ("all-goals", "Dia completo", "Complete passos, água e a meta manual no mesmo dia.",
             any(d["steps"] >= state["config"]["steps"] and d["water"] >= state["config"]["water"] and
                 d["manual"] >= state["config"]["manual"] for d in days))]
    return [dict(id=i, title=t, desc=d, conquistado=ok) for i, t, d, ok in defs]

def user_view(account, run, state):
    daily(state)
    history = {day: len(d["completed"]) for day, d in state["days"].items()}
    lit = sorted(day for day, n in history.items() if n >= 3)
    current = datetime.now(TZ).date()
    if history.get(current.isoformat(), 0) < 3:
        current -= timedelta(days=1)
    streak = 0
    while current.isoformat() in lit:
        streak += 1
        current -= timedelta(days=1)
    return {**account.profile, "carteirinha": account.id, "trofeus": state["balance"],
            "trofeusAcumulados": state["earned"], "beneficiosResgatados": state["benefits"],
            "missoesConcluidasHoje": history[day_at()], "missoesPorDia": history, "streak": streak,
            "streakDiasAcendidos": lit, "conquistas": achievements(state), "demo": run.demo,
            "generation": run.id}

def device_view(device, run):
    age = now_ts() - device.last_seen if device.last_seen else None
    return dict(deviceId=device.id, kind=device.kind, status="online" if age is not None and age <= 15 else "offline",
                lastSeen=device.last_seen, ageSeconds=age, resetPending=device.generation != run.id,
                diagnostics=device.diagnostics)

def snapshot(db, account, run, state):
    d = daily(state)
    selected = state.get("selection")
    if selected and not any(m["id"] == selected["id"] and not m["concluida"] for m in missions(account, state)):
        state["selection"] = None
    devices = list(db.scalars(select(Device).where(Device.account_id == account.id)))
    band = next((x for x in devices if x.kind == "band"), None)
    lamp = next((x for x in devices if x.kind == "lamp"), None)
    light = desired(run, state)
    confirmed = bool(lamp and lamp.applied_revision == light["revision"] and lamp.applied_at and now_ts() - lamp.applied_at <= 15)
    light.update(confirmada=confirmed, aplicada=lamp.applied_color if lamp else None,
                 confirmadaEm=lamp.applied_at if lamp else None, status=device_view(lamp, run)["status"] if lamp else "offline")
    now = datetime.now(TZ)
    bandview = device_view(band, run) if band else dict(status="offline", deviceId="Não configurada", lastSeen=None)
    return dict(pedometro={**bandview, "steps": d["steps"], "dailyStepsAverage": round(d["steps"] / max(1, now.hour * 60 + now.minute), 1),
                            "buttonEvent": state["last_button"], "name": account.profile["nome"], "error": ""},
                luminaria=light, aguaMl=d["water"], copoAguaMl=state["config"]["cup"],
                missoes=connect_missions(state), manuais=missions(account, state), selection=state.get("selection"),
                sos=state.get("sos"), devices=[device_view(x, run) for x in devices], demo=run.demo,
                generation=run.id, day=day_at(), scanReward=state["scan"].get(day_at()),
                usuario=user_view(account, run, state), novasConclusoes=[])

def load_state(db, account):
    run = db.get(Run, account.active_run)
    return run, copy.deepcopy(run.state)
