require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function check() {
  const { data: staff } = await s.from("staff_profiles").select("*");
  console.log("Staff:", staff?.length || 0);

  const { data: users } = await s.auth.admin.listUsers();
  console.log("Auth Users:", users?.users?.length || 0);
  if (users?.users) {
    users.users.forEach((u) => console.log(`  - ${u.email}`));
  }
}
check();
