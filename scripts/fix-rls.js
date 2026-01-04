/**
 * Script para corrigir RLS com função SECURITY DEFINER
 */

const PROJECT_ID = 'lvqcualqeevdenghexjm'
const ACCESS_TOKEN = 'sbp_fbf88a127de883ddbc531dd002d652e730504570'

async function runQuery(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body: JSON.stringify({ query: sql })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Query failed: ${response.status} - ${error}`)
  }

  return response.json()
}

async function fixRLS() {
  console.log('🔧 Corrigindo políticas RLS...\n')

  // 1. Criar função SECURITY DEFINER para verificar se é admin
  console.log('1️⃣ Criando função is_admin()...')
  await runQuery(`
    create or replace function public.is_admin()
    returns boolean
    language sql
    security definer
    stable
    as $$
      select exists (
        select 1 
        from public.staff_profiles sp
        join public.roles r on r.id = sp.role_id
        where sp.user_id = auth.uid() 
        and r.code = 'ADMIN'
      );
    $$;
  `)
  console.log('   ✅ Função is_admin() criada')

  // 2. Criar função para obter role do usuário atual
  console.log('2️⃣ Criando função get_my_role()...')
  await runQuery(`
    create or replace function public.get_my_role()
    returns text
    language sql
    security definer
    stable
    as $$
      select r.code 
      from public.staff_profiles sp
      join public.roles r on r.id = sp.role_id
      where sp.user_id = auth.uid()
      limit 1;
    $$;
  `)
  console.log('   ✅ Função get_my_role() criada')

  // 3. Remover políticas antigas de staff_profiles
  console.log('3️⃣ Removendo políticas antigas...')
  await runQuery(`drop policy if exists "staff_select_own" on public.staff_profiles;`)
  await runQuery(`drop policy if exists "staff_update_own" on public.staff_profiles;`)
  await runQuery(`drop policy if exists "staff_admin_select_all" on public.staff_profiles;`)
  await runQuery(`drop policy if exists "staff_admin_manage_all" on public.staff_profiles;`)
  await runQuery(`drop policy if exists "roles_admin_manage" on public.roles;`)
  console.log('   ✅ Políticas antigas removidas')

  // 4. Criar novas políticas usando is_admin()
  console.log('4️⃣ Criando novas políticas para staff_profiles...')
  
  // SELECT: usuário vê próprio perfil OU admin vê todos
  await runQuery(`
    create policy "staff_select_policy" on public.staff_profiles 
    for select to authenticated 
    using (
      auth.uid() = user_id 
      OR public.is_admin()
    );
  `)
  console.log('   ✅ Política staff_select_policy criada')

  // UPDATE: usuário atualiza próprio perfil OU admin atualiza qualquer
  await runQuery(`
    create policy "staff_update_policy" on public.staff_profiles 
    for update to authenticated 
    using (
      auth.uid() = user_id 
      OR public.is_admin()
    )
    with check (
      auth.uid() = user_id 
      OR public.is_admin()
    );
  `)
  console.log('   ✅ Política staff_update_policy criada')

  // INSERT: apenas admin pode inserir
  await runQuery(`
    create policy "staff_insert_policy" on public.staff_profiles 
    for insert to authenticated 
    with check (public.is_admin());
  `)
  console.log('   ✅ Política staff_insert_policy criada')

  // DELETE: apenas admin pode deletar
  await runQuery(`
    create policy "staff_delete_policy" on public.staff_profiles 
    for delete to authenticated 
    using (public.is_admin());
  `)
  console.log('   ✅ Política staff_delete_policy criada')

  // 5. Política para roles - apenas admin pode gerenciar
  console.log('5️⃣ Criando política para roles...')
  await runQuery(`
    create policy "roles_admin_manage" on public.roles 
    for all to authenticated 
    using (public.is_admin())
    with check (public.is_admin());
  `)
  console.log('   ✅ Política roles_admin_manage criada')

  console.log('\n✅ RLS corrigido com sucesso!')
}

async function main() {
  try {
    await fixRLS()
  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  }
}

main()
