"""
Script de seed — cria usuário admin inicial e dados de teste.
Uso: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User, PerfilUsuario
from app.models.crm import Lead, Cliente, OrigemLead, StatusFunil
from app.models.projeto import Projeto, StatusProjeto, ConfigWIPProjetista
import app.models  # Registra todos os models


def seed():
    print("🌱 Iniciando seed do banco de dados...")

    # Cria todas as tabelas
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas criadas")

    db = SessionLocal()

    try:
        # === USUÁRIO ADMIN ===
        admin = db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                nome=settings.FIRST_ADMIN_NAME,
                email=settings.FIRST_ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.FIRST_ADMIN_PASSWORD),
                perfil=PerfilUsuario.DIRETORIA,
                is_superuser=True,
            )
            db.add(admin)
            db.flush()
            print(f"✅ Admin criado: {settings.FIRST_ADMIN_EMAIL}")

        # === EQUIPE DE TESTE ===
        usuarios_teste = [
            {"nome": "João Vendedor", "email": "vendedor@lidermoveis.com.br", "perfil": PerfilUsuario.VENDEDOR},
            {"nome": "Maria Gerente", "email": "gerente@lidermoveis.com.br", "perfil": PerfilUsuario.GERENTE_COMERCIAL},
            {"nome": "Carlos Projetista", "email": "projetista@lidermoveis.com.br", "perfil": PerfilUsuario.PROJETISTA},
            {"nome": "Ana Conferente", "email": "conferente@lidermoveis.com.br", "perfil": PerfilUsuario.CONFERENTE},
            {"nome": "Pedro Financeiro", "email": "financeiro@lidermoveis.com.br", "perfil": PerfilUsuario.FINANCEIRO},
        ]

        usuarios_criados = {}
        for u in usuarios_teste:
            existente = db.query(User).filter(User.email == u["email"]).first()
            if not existente:
                user = User(
                    nome=u["nome"],
                    email=u["email"],
                    hashed_password=get_password_hash("Teste@123"),
                    perfil=u["perfil"],
                )
                db.add(user)
                db.flush()
                usuarios_criados[u["perfil"]] = user
                print(f"✅ Usuário criado: {u['email']} [{u['perfil']}]")
            else:
                usuarios_criados[u["perfil"]] = existente

        # === WIP LIMIT para projetista ===
        projetista = usuarios_criados.get(PerfilUsuario.PROJETISTA)
        if projetista:
            config_wip = db.query(ConfigWIPProjetista).filter(
                ConfigWIPProjetista.projetista_id == projetista.id
            ).first()
            if not config_wip:
                db.add(ConfigWIPProjetista(projetista_id=projetista.id, wip_limit=3))
                print("✅ WIP limit configurado para projetista (máx. 3 projetos)")

        # === LEADS DE TESTE ===
        vendedor = usuarios_criados.get(PerfilUsuario.VENDEDOR)
        leads_teste = [
            {"nome": "Roberto Silva", "telefone": "11999990001", "origem": OrigemLead.INSTAGRAM, "status_funil": StatusFunil.NOVO_LEAD},
            {"nome": "Fernanda Costa", "telefone": "11999990002", "origem": OrigemLead.INDICACAO, "status_funil": StatusFunil.QUALIFICANDO},
            {"nome": "Marcos Oliveira", "telefone": "11999990003", "origem": OrigemLead.ARQUITETO, "status_funil": StatusFunil.EM_VISITA, "qualificado": True},
            {"nome": "Lucia Mendes", "telefone": "11999990004", "origem": OrigemLead.SHOWROOM, "status_funil": StatusFunil.EM_BRIEFING, "qualificado": True},
            {"nome": "Paulo Andrade", "telefone": "11999990005", "origem": OrigemLead.SITE_GOOGLE, "status_funil": StatusFunil.PERDIDO, "motivo_perda": "Orçamento acima da expectativa"},
        ]

        for l in leads_teste:
            existente = db.query(Lead).filter(Lead.telefone == l["telefone"]).first()
            if not existente:
                lead = Lead(
                    vendedor_id=vendedor.id if vendedor else None,
                    cidade="São Paulo",
                    estado="SP",
                    **l,
                )
                db.add(lead)

        print(f"✅ {len(leads_teste)} leads de teste criados")

        db.commit()
        print("\n🎉 Seed concluído com sucesso!")
        print("\n📋 Credenciais para acesso:")
        print(f"   Admin:      {settings.FIRST_ADMIN_EMAIL} / {settings.FIRST_ADMIN_PASSWORD}")
        print(f"   Vendedor:   vendedor@lidermoveis.com.br / Teste@123")
        print(f"   Gerente:    gerente@lidermoveis.com.br / Teste@123")
        print(f"   Projetista: projetista@lidermoveis.com.br / Teste@123")
        print(f"   Conferente: conferente@lidermoveis.com.br / Teste@123")
        print(f"\n🚀 API rodando em: http://localhost:8000")
        print(f"📖 Documentação:  http://localhost:8000/docs")

    except Exception as e:
        db.rollback()
        print(f"❌ Erro no seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
