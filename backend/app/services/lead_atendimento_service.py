"""Serviço de atribuição de leads — primeira interação automática ao ganhar
vendedor. As demais funções (puxar/devolver/reatribuir/duplicado) são
adicionadas nas próximas tarefas deste plano."""
from typing import Optional
from app.models.crm import Lead, InteracaoLead, OrigemLead, Cliente

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


def verificar_duplicado(db, telefone: str) -> Optional[dict]:
    """Verifica se telefone já existe como lead ou cliente (aviso não-bloqueante)."""
    lead = db.query(Lead).filter(Lead.telefone == telefone).order_by(Lead.criado_em.desc()).first()
    if lead:
        return {"tipo": "lead", "id": lead.id, "nome": lead.nome}
    cliente = db.query(Cliente).filter(Cliente.telefone == telefone).first()
    if cliente:
        return {"tipo": "cliente", "id": cliente.id, "nome": cliente.nome}
    return None
