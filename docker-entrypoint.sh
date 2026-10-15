#!/bin/sh
set -e

echo "🚀 Iniciando Plannit em ambiente de produção..."

# Executa as migrations automaticamente se DATABASE_URL ou DB_HOST estiver configurado
if [ -n "$DATABASE_URL" ] || [ -n "$DB_HOST" ]; then
  echo "📦 Executando migrations do banco de dados (migration:run --force)..."
  node ace.js migration:run --force || {
    echo "⚠️ Aviso: Falha ao rodar migrations. Continuando inicialização..."
  }
else
  echo "ℹ️ Nenhuma variável de banco detectada (DATABASE_URL ou DB_HOST). Pulando migrations automáticas."
fi

echo "✨ Iniciando servidor web Plannit..."
exec "$@"

