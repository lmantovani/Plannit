from datetime import datetime, timedelta, timezone
from app.models.crm import Arquiteto, InteracaoArquiteto
from app.services.arquiteto_score import calcular_score


def test_calcular_score_nao_quebra_com_datetime_timezone_aware(db_session, diretoria_user):
    """
    Regressao: simula o que o Postgres real devolve (datetime timezone-aware)
    pra colunas DateTime(timezone=True) — o SQLite dos testes devolve naive
    por padrao, entao sem isso o bug nunca aparece localmente, só em producao.
    """
    agora_aware = datetime.now(timezone.utc)

    arquiteto = Arquiteto(nome="TZ Test", tipo="arquiteto", is_active=True)
    db_session.add(arquiteto)
    db_session.commit()
    db_session.refresh(arquiteto)

    db_session.add(InteracaoArquiteto(
        arquiteto_id=arquiteto.id, responsavel_id=diretoria_user.id,
        tipo="ligacao", resumo="Contato", data=agora_aware - timedelta(days=5),
    ))
    db_session.commit()
    db_session.refresh(arquiteto)

    # Simula o retorno timezone-aware do Postgres sobrescrevendo em memoria
    # (SQLite ja teria devolvido naive no refresh acima).
    arquiteto.criado_em = agora_aware - timedelta(days=100)

    resultado = calcular_score(db_session, arquiteto)  # não pode levantar TypeError

    assert resultado["score_geral"] >= 0
    assert resultado["detalhes"]["meses_desde_cadastro"] >= 3
