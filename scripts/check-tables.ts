import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lvqcualqeevdenghexjm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cWN1YWxxZWV2ZGVuZ2hleGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ3NDcwOCwiZXhwIjoyMDgzMDUwNzA4fQ.S5xcYUHdYML67ujw57ye9-vnpL_gluH10WdoZL3SXHM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  console.log('=== VERIFICANDO TABELAS ===\n');

  // 1. Verificar staff_users
  const { data: staff, error: staffError } = await supabase
    .from('staff_users')
    .select('*');

  console.log('STAFF_USERS:', staffError ? `❌ ERRO: ${staffError.message}` : `✅ ${staff?.length || 0} registros`);
  if (staff && staff.length > 0) {
    console.log('Exemplo:', staff[0]);
  }

  // 2. Verificar fidelity_services
  const { data: services, error: servicesError } = await supabase
    .from('fidelity_services')
    .select('*');

  console.log('\nFIDELITY_SERVICES:', servicesError ? `❌ ERRO: ${servicesError.message}` : `✅ ${services?.length || 0} registros`);
  if (services && services.length > 0) {
    console.log('Exemplo:', services[0]);
  }

  // 3. Verificar staff_profiles (caso exista)
  const { data: profiles, error: profilesError } = await supabase
    .from('staff_profiles')
    .select('*');

  console.log('\nSTAFF_PROFILES:', profilesError ? `❌ ERRO: ${profilesError.message}` : `✅ ${profiles?.length || 0} registros`);

  // 4. Verificar roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*');

  console.log('\nROLES:', rolesError ? `❌ ERRO: ${rolesError.message}` : `✅ ${roles?.length || 0} registros`);
  if (roles && roles.length > 0) {
    console.log('Roles disponíveis:', roles.map(r => r.code));
  }
}

checkTables();
