"""PostgreSQL in production; explicit SQLite URL only for local development/tests."""
import os
from contextlib import contextmanager
from datetime import datetime, timezone
from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text, create_engine, event, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from dotenv import load_dotenv

load_dotenv()

def now_ts():
    return int(datetime.now(timezone.utc).timestamp())

class Base(DeclarativeBase):
    pass

class Account(Base):
    __tablename__ = "care_accounts"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    profile: Mapped[dict] = mapped_column(JSON)
    password_hash: Mapped[str] = mapped_column(Text)
    active_run: Mapped[str] = mapped_column(String(36))
    normal_run: Mapped[str] = mapped_column(String(36))
    public_id: Mapped[str] = mapped_column(String(36), unique=True)

class Run(Base):
    __tablename__ = "care_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("care_accounts.id"), index=True)
    demo: Mapped[bool] = mapped_column(Boolean)
    state: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[int] = mapped_column(Integer, default=now_ts)

class LoginSession(Base):
    __tablename__ = "care_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("care_accounts.id"), index=True)
    expires_at: Mapped[int] = mapped_column(Integer)

class Device(Base):
    __tablename__ = "care_devices"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("care_accounts.id"), index=True)
    kind: Mapped[str] = mapped_column(String(16))
    token_hash: Mapped[str] = mapped_column(String(64))
    last_seen: Mapped[int | None] = mapped_column(Integer, nullable=True)
    generation: Mapped[str] = mapped_column(String(36), default="")
    applied_revision: Mapped[str] = mapped_column(String(100), default="")
    applied_color: Mapped[str] = mapped_column(String(16), default="")
    applied_at: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diagnostics: Mapped[dict] = mapped_column(JSON, default=dict)

class DeviceEvent(Base):
    __tablename__ = "care_events"
    device_id: Mapped[str] = mapped_column(ForeignKey("care_devices.id"), primary_key=True)
    event_id: Mapped[str] = mapped_column(String(80), primary_key=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("care_runs.id"), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    result: Mapped[str] = mapped_column(String(40))
    received_at: Mapped[int] = mapped_column(Integer, default=now_ts)

class Ledger(Base):
    __tablename__ = "care_ledger"
    run_id: Mapped[str] = mapped_column(ForeignKey("care_runs.id"), primary_key=True)
    key: Mapped[str] = mapped_column(String(160), primary_key=True)
    amount: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[int] = mapped_column(Integer, default=now_ts)

engine = None
Session = None

def configure(url=None):
    global engine, Session
    url = url or os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("Configure DATABASE_URL. Use Supabase no Render ou sqlite:///care-local.db no desenvolvimento.")
    if url.startswith(("postgres://", "postgresql://")):
        url = "postgresql+psycopg://" + url.split("://", 1)[1]
    options = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        options["connect_args"] = {"check_same_thread": False, "timeout": 30}
    else:
        options.update(pool_size=3, max_overflow=2)
    engine = create_engine(url, **options)
    if url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def sqlite_pragmas(conn, _):
            conn.execute("PRAGMA foreign_keys=ON")
    Session = sessionmaker(engine, expire_on_commit=False)
    return engine

@contextmanager
def transaction():
    with Session() as db:
        # SQLite's FOR UPDATE is a no-op. Serialize writers in local tests as well.
        if engine.dialect.name == "sqlite":
            db.connection().exec_driver_sql("BEGIN IMMEDIATE")
        with db.begin_nested():
            yield db
        db.commit()

def lock_account(db, account_id):
    return db.scalar(select(Account).where(Account.id == account_id).with_for_update())
