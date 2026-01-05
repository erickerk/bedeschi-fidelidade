#!/bin/bash

# Script para configurar variáveis de ambiente na Vercel automaticamente

echo "🔧 Configurando variáveis de ambiente na Vercel..."

# Variáveis
SUPABASE_URL="https://lvqcualqeevdenghexjm.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzQ3MDgsImV4cCI6MjA4MzA1MDcwOH0.-x0z-y2ETLwKTOCqOXoCu1Kro7LSUQX5SrEWF2Owkdw"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM"
APP_URL="https://bedeschi-fidelidade-app.vercel.app"

echo "📝 Adicionando variáveis..."

# Adicionar variáveis (requer estar logado no Vercel CLI)
vercel env add NEXT_PUBLIC_SUPABASE_URL --value "$SUPABASE_URL" --prod --yes
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY --value "$SUPABASE_ANON_KEY" --prod --yes
vercel env add SUPABASE_SERVICE_ROLE_KEY --value "$SUPABASE_SERVICE_KEY" --prod --yes
vercel env add NEXT_PUBLIC_APP_URL --value "$APP_URL" --prod --yes

echo "✅ Variáveis adicionadas!"
echo ""
echo "🚀 Fazendo redeploy..."
vercel --prod --yes

echo ""
echo "✨ Deploy concluído!"
echo "Acesse: https://bedeschi-fidelidade-app.vercel.app"
