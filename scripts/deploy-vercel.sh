#!/bin/bash

# Script para fazer deploy na Vercel com variáveis de ambiente configuradas

echo "🚀 Iniciando deploy na Vercel..."
echo "📝 Configurando variáveis de ambiente..."

# Verificar se está logado na Vercel
npx vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Você não está logado na Vercel. Execute: npx vercel login"
  exit 1
fi

# Fazer deploy
echo "📦 Fazendo deploy..."
npx vercel --prod --yes

echo "✅ Deploy concluído!"
echo "🔗 Acesse: https://bedeschi-fidelidade.vercel.app"
