import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  business_type: 'Contabilidad' | 'Diseño' | 'Desarrollo de Software' | 'Marketing' | 'Consultoría' | 'E-commerce' | 'Educación' | 'Salud' | 'Legal' | 'Construcción' | 'Otro';
  business_name: string;
  location: string;
  currency: 'MXN' | 'USD' | 'EUR' | 'COP' | 'PEN' | 'ARS';
  team_size: 'Solo yo' | '2-5 personas' | '6-20 personas' | '21-50 personas' | 'Más de 50 personas';
  primary_goals: string[];
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

export async function createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        ...profile
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return null;
  }
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

export async function completeOnboarding(): Promise<boolean> {
  try {
    const result = await updateUserProfile({ onboarding_completed: true });
    return result !== null;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return false;
  }
}

export const BUSINESS_TYPES = [
  'Contabilidad',
  'Diseño',
  'Desarrollo de Software',
  'Marketing',
  'Consultoría',
  'E-commerce',
  'Educación',
  'Salud',
  'Legal',
  'Construcción',
  'Otro'
] as const;

export const LOCATIONS = [
  'México',
  'Estados Unidos',
  'Colombia',
  'Perú',
  'Argentina',
  'Chile',
  'España',
  'Otro'
] as const;

export const CURRENCIES = [
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'USD', label: 'USD - Dólar Americano' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'COP', label: 'COP - Peso Colombiano' },
  { value: 'PEN', label: 'PEN - Sol Peruano' },
  { value: 'ARS', label: 'ARS - Peso Argentino' }
] as const;

export const TEAM_SIZES = [
  'Solo yo',
  '2-5 personas',
  '6-20 personas',
  '21-50 personas',
  'Más de 50 personas'
] as const;

export const PRIMARY_GOALS = [
  'Gestión de Clientes',
  'Gestión de Proyectos',
  'Facturación',
  'Propuestas',
  'Reportes',
  'Colaboración',
  'Automatización'
] as const;
