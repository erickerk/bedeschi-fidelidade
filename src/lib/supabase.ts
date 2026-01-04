import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Cliente público (para auth do usuário)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin (para operações de fidelidade - bypass RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : supabase // Fallback para anon se não tiver service key

export type UserRole = 'ADMIN' | 'RECEPCAO' | 'QA'

export interface StaffProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role_id: string
  active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  roles?: {
    id: string
    code: UserRole
    name: string
    permissions: string[]
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getStaffProfile(userId: string): Promise<StaffProfile | null> {
  const { data, error } = await supabase
    .from('staff_profiles')
    .select(`
      *,
      roles (id, code, name, permissions)
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching staff profile:', error)
    return null
  }

  return data
}

export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getStaffProfile(userId)
  return profile?.roles?.code === 'ADMIN'
}
