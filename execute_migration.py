#!/usr/bin/env python3
"""
Script para executar migração de pontos (1 ano) no Supabase
Usando conexão direta ao PostgreSQL
"""

import os
import sys

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ Erro: psycopg2 não está instalado")
    print("   Execute: pip install psycopg2-binary")
    sys.exit(1)

# Configurações do Supabase
SUPABASE_HOST = "lvqcualqeevdenghexjm.supabase.co"
SUPABASE_PORT = 5432
SUPABASE_USER = "postgres"
SUPABASE_PASSWORD = "Bedeschi@2024#Fidelidade"
SUPABASE_DB = "postgres"

def execute_migration():
    """Executa a migração no banco de dados"""
    
    print("🚀 Iniciando migração de pontos (1 ano)...\n")
    
    try:
        # Conectar ao banco de dados
        print("🔗 Conectando ao Supabase PostgreSQL...")
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            port=SUPABASE_PORT,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD,
            database=SUPABASE_DB,
            sslmode='require'
        )
        
        cursor = conn.cursor()
        print("✅ Conectado!\n")
        
        # Ler arquivo SQL
        print("📖 Lendo arquivo de migração...")
        with open('EXECUTAR_MIGRACAO_AQUI.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Executar SQL
        print("⚙️  Executando migração...\n")
        cursor.execute(sql_content)
        conn.commit()
        
        print("\n✅ Migração executada com sucesso!")
        print("✨ Migração 012 - Sistema de validade de pontos (1 ano) implementado!")
        print("\n📊 Alterações aplicadas:")
        print("   ✅ Validade padrão das regras alterada para 365 dias")
        print("   ✅ Coluna points_expires_at adicionada aos clientes")
        print("   ✅ Tabela fidelity_points_history criada")
        print("   ✅ Função expire_old_points() criada")
        print("   ✅ Função renew_points_expiration() criada")
        print("   ✅ Trigger renew_points_on_update criada")
        print("   ✅ Políticas RLS configuradas")
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Erro de conexão: {e}")
        print("\n💡 Dica: Verifique se a senha do PostgreSQL está correta")
        return False
    except psycopg2.Error as e:
        print(f"❌ Erro SQL: {e}")
        return False
    except FileNotFoundError:
        print("❌ Erro: Arquivo EXECUTAR_MIGRACAO_AQUI.sql não encontrado")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

if __name__ == "__main__":
    success = execute_migration()
    sys.exit(0 if success else 1)
