"""Serviço de atribuição de leads — primeira interação automática ao ganhar
vendedor. As demais funções (puxar/devolver/reatribuir/duplicado) são
adicionadas nas próximas tarefas deste plano."""
from app.models.crm import Lead, InteracaoLead, OrigemLead

ORIGEM_LABEL = {
    OrigemLead.INSTAGRAM: "Instagram",
    OrigemLead.INDICACAO: "Indicação",
    OrigemLead.SITE_GOOGLE: "Site/Google",
    OrigemLead.CONSTRUTORA: "Construtora",
    OrigemLead.SHOWROOM: "Showroom",
    OrigemLead.ARQUITETO: "Especificador",
    OrigemLead.WHATSAPP: "WhatsApp",
    OrigemLead.TELEFONE: "Telefone",
    OrigemLead.OUTRO: "Outro",
}


def registrar_primeira_interacao(db, lead: Lead, responsavel_id: int) -> InteracaoLead:
    label = ORIGEM_LABEL.get(lead.origem, "Outro")
    interacao = InteracaoLead(
        lead_id=lead.id,
        responsavel_id=responsavel_id,
        tipo="sistema",
        resumo=f"Lead recebido — origem: {label}",
    )
    db.add(interacao)
    db.commit()
    db.refresh(interacao)
    return interacao
