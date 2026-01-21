#!/bin/bash

# Script para executar migração de pontos (1 ano) no Supabase
# Usando psql para conectar ao PostgreSQL

echo "🚀 Iniciando migração de pontos (1 ano)..."
echo ""

# Credenciais do Supabase
SUPABASE_HOST="lvqcualqeevdenghexjm.supabase.co"
SUPABASE_PORT="5432"
SUPABASE_USER="postgres"
SUPABASE_PASSWORD="Bedeschi@2024#Fidelidade"
SUPABASE_DB="postgres"

# Executar migração
psql -h "$SUPABASE_HOST" \
     -p "$SUPABASE_PORT" \
     -U "$SUPABASE_USER" \
     -d "$SUPABASE_DB" \
     -f ./EXECUTAR_MIGRACAO_AQUI.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migração executada com sucesso!"
    echo "✨ Migração 012 - Sistema de validade de pontos (1 ano) implementado!"
else
    echo ""
    echo "❌ Erro ao executar migração"
    exit 1
fi
