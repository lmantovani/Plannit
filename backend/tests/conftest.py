import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

import app.models  # garante que todos os models sejam registrados no Base.metadata
from app.core.database import Base, get_db
from app.core.security import get_current_user, get_password_hash
from app.main import app as fastapi_app
from app.models.user import User, PerfilUsuario


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.pop(get_db, None)


@pytest.fixture()
def diretoria_user(db_session):
    user = User(
        nome="Admin Teste",
        email="admin.teste@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.DIRETORIA,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_client(client, diretoria_user):
    def _override_get_current_user():
        return diretoria_user

    fastapi_app.dependency_overrides[get_current_user] = _override_get_current_user
    yield client
    fastapi_app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def projetista_user(db_session):
    user = User(
        nome="Projetista Teste",
        email="projetista.teste@plannit.com.br",
        hashed_password=get_password_hash("Teste@123"),
        perfil=PerfilUsuario.PROJETISTA,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def create_client_com_user(db_session):
    """Factory fixture para criar clientes autenticados com usuários específicos."""
    def _create_client(user):
        def _override_get_db():
            yield db_session

        def _override_get_current_user():
            return user

        fastapi_app.dependency_overrides[get_db] = _override_get_db
        fastapi_app.dependency_overrides[get_current_user] = _override_get_current_user
        return TestClient(fastapi_app)

    return _create_client
