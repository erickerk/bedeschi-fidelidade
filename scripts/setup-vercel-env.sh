#!/bin/bash

# Script para configurar variáveis de ambiente na Vercel
# Uso: bash scripts/setup-vercel-env.sh

echo "🔧 Configurando variáveis de ambiente na Vercel..."

# Adicionar variáveis de ambiente
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY << EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzQ3MDgsImV4cCI6MjA4MzA1MDcwOH0.-x0z-y2ETLwKTOCqOXoCu1Kro7LSUQX5SrEWF2Owkdw
Production
EOF

npx vercel env add SUPABASE_SERVICE_ROLE_KEY << EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM
Production
EOF

npx vercel env add NEXT_PUBLIC_APP_URL << EOF
https://bedeschi-fidelidade.vercel.app
Production
EOF

npx vercel env add NEXT_PUBLIC_APP_NAME << EOF
Bedeschi Fidelidade
Production
EOF

echo "✅ Variáveis de ambiente configuradas!"
echo "📋 Listando variáveis:"
npx vercel env list
