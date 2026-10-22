"""Explicit database setup and device provisioning. Never runs JSON imports on startup."""
import argparse
import getpass
import json
import secrets
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError
from dotenv import set_key
import database as store
from database import Account, Base, Device, lock_account, transaction
from domain import new_run
from security import digest, password_hash

def supabase_connection_url(connection, password):
    """Build a session-pooler URL without printing or manually escaping credentials."""
    try:
        url = make_url(connection.strip())
        valid = (
            url.drivername in {"postgres", "postgresql", "postgresql+psycopg"}
            and bool(url.host and url.host.endswith(".pooler.supabase.com"))
            and url.port == 5432
            and bool(url.username and url.username.startswith("postgres."))
            and url.database == "postgres"
        )
    except (ArgumentError, ValueError):
        valid = False
    if not valid:
        raise ValueError("Copie a URI completa de Connect > Session pooler (porta 5432).")
    if not password:
        raise ValueError("Informe a senha do banco definida ao criar o projeto.")
    sslmode = url.query.get("sslmode", "require")
    if sslmode not in {"require", "verify-ca", "verify-full"}:
        sslmode = "require"
    return url.set(drivername="postgresql+psycopg", password=password).update_query_dict(
        {"sslmode": sslmode}
    ).render_as_string(hide_password=False)

def configure_database():
    print("Configuracao local do Supabase. As entradas abaixo ficam ocultas ao colar/digitar.")
    connection = getpass.getpass("Cole a URI de Connect > Session pooler e pressione Enter: ")
    password = getpass.getpass("Cole a senha do BANCO Supabase e pressione Enter: ")
    try:
        value = supabase_connection_url(connection, password)
    except ValueError as exc:
        raise SystemExit(str(exc)) from None
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        example = env_path.with_name(".env.example")
        env_path.write_text(example.read_text(encoding="utf-8"), encoding="utf-8")
    set_key(str(env_path), "DATABASE_URL", value, quote_mode="always")
    print("Conexao salva em backend/.env. A senha nao foi exibida. Nenhuma tabela foi alterada.")

def migrate():
    Base.metadata.create_all(store.engine)
    if store.engine.dialect.name == "postgresql":
        with store.engine.begin() as conn:
            # This API connects directly as the database owner. Browser/IoT never access PostgREST.
            for name in Base.metadata.tables:
                conn.execute(text(f'ALTER TABLE "{name}" ENABLE ROW LEVEL SECURITY'))
                conn.execute(text(f'REVOKE ALL ON TABLE "{name}" FROM anon, authenticated'))

def provision(account_id, device_id, kind):
    token = secrets.token_urlsafe(32)
    with transaction() as db:
        account = lock_account(db, account_id)
        if not account:
            raise SystemExit("Crie a conta pelo site antes de provisionar.")
        if db.get(Device, device_id):
            raise SystemExit("ID já provisionado. Use outro ID; nenhum vínculo foi sobrescrito.")
        if db.query(Device).filter_by(account_id=account_id, kind=kind).first():
            raise SystemExit("Esta conta já possui um dispositivo deste tipo.")
        db.add(Device(id=device_id, account_id=account_id, kind=kind, token_hash=digest(token)))
        return dict(device_id=device_id, token=token, initial_generation=account.active_run)

def import_user(path, account_id):
    source = json.loads(Path(path).read_text(encoding="utf-8"))
    old = source[account_id]
    from main import PROFILE_FIELDS
    from uuid import uuid4
    password = getpass.getpass("Nova senha (mínimo 8 caracteres): ")
    if len(password) < 8:
        raise SystemExit("Senha muito curta.")
    with transaction() as db:
        if db.get(Account, account_id):
            raise SystemExit("Conta já existe. Importação cancelada.")
        rid = str(uuid4())
        a = Account(id=account_id, profile={k: str(v) for k, v in old.items() if k in PROFILE_FIELDS},
                    password_hash=password_hash(password), active_run=rid, normal_run=rid, public_id=str(uuid4()))
        db.add(a)
        db.flush()
        run = new_run(db, a, False)
        run.id = rid
        run.state["balance"] = max(0, int(old.get("trofeus", 0)))
        run.state["earned"] = max(run.state["balance"], int(old.get("trofeusAcumulados", 0)))
        run.state["benefits"] = old.get("beneficiosResgatados", [])
        # Legacy unverified steps/completions are not re-awarded.
    print("Perfil, saldo, total histórico e benefícios importados. Arquivo original preservado.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("configure-database")
    commands.add_parser("migrate")
    p = commands.add_parser("device")
    p.add_argument("--account", required=True)
    p.add_argument("--id", required=True)
    p.add_argument("--kind", choices=["band", "lamp"], required=True)
    p = commands.add_parser("import-user")
    p.add_argument("--file", required=True)
    p.add_argument("--account", required=True)
    args = parser.parse_args()
    if args.command == "configure-database":
        configure_database()
        raise SystemExit(0)
    store.configure()
    if args.command == "migrate":
        migrate()
        print("Esquema atualizado.")
    elif args.command == "device":
        print(json.dumps(provision(args.account, args.id, args.kind), indent=2))
    else:
        import_user(args.file, args.account)
