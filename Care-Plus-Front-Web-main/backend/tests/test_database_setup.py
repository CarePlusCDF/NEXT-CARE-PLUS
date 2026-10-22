import sys
from pathlib import Path

import pytest
from dotenv import dotenv_values
from sqlalchemy.engine import make_url

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from manage import supabase_connection_url

POOLER = "postgresql://postgres.example:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

def test_password_special_characters_and_dotenv_roundtrip(tmp_path):
    from dotenv import set_key
    password = "teste@:/?#%&= +\"'\\senha"
    result = supabase_connection_url(POOLER, password)
    parsed = make_url(result)
    assert parsed.password == password
    assert parsed.drivername == "postgresql+psycopg"
    assert parsed.query["sslmode"] == "require"
    env = tmp_path / ".env"
    set_key(str(env), "DATABASE_URL", result, quote_mode="always")
    assert make_url(dotenv_values(env)["DATABASE_URL"]).password == password

@pytest.mark.parametrize("connection", [
    "postgresql://postgres:secret@db.example.supabase.co:5432/postgres",
    POOLER.replace(":5432/", ":6543/"),
    "not-a-uri-with-private-data",
])
def test_rejects_wrong_method_without_exposing_input(connection):
    with pytest.raises(ValueError) as exc:
        supabase_connection_url(connection, "secret")
    assert "Session pooler" in str(exc.value)
    assert connection not in str(exc.value)

def test_preserves_stronger_ssl_mode():
    result = supabase_connection_url(POOLER + "?sslmode=verify-full&sslrootcert=root.pem", "secret")
    assert make_url(result).query == {"sslmode": "verify-full", "sslrootcert": "root.pem"}

@pytest.mark.parametrize("existing", [False, True])
def test_guided_setup_preserves_other_settings_and_hides_credentials(tmp_path, monkeypatch, capsys, existing):
    import manage
    monkeypatch.setattr(manage, "__file__", str(tmp_path / "manage.py"))
    env = tmp_path / ".env"
    (tmp_path / ".env.example").write_text("DATABASE_URL=example\nDEMO_STEPS=20\n", encoding="utf-8")
    if existing:
        env.write_text("DATABASE_URL=old\nDEMO_STEPS=35\n", encoding="utf-8")
    answers = iter([POOLER, "sensitive@password"])
    monkeypatch.setattr(manage.getpass, "getpass", lambda _: next(answers))
    manage.configure_database()
    result = dotenv_values(env)
    assert make_url(result["DATABASE_URL"]).password == "sensitive@password"
    assert result["DEMO_STEPS"] == ("35" if existing else "20")
    output = capsys.readouterr().out
    assert "sensitive" not in output and "postgresql://" not in output
