from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Departamento(Base):
    __tablename__ = "departamentos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    ativo = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Departamento {self.nome}>"


class Cargo(Base):
    __tablename__ = "cargos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"), nullable=False)
    ativo = Column(Boolean, default=True)

    departamento = relationship("Departamento")

    @property
    def departamento_nome(self):
        return self.departamento.nome if self.departamento else None

    def __repr__(self):
        return f"<Cargo {self.nome}>"
