import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqdptkybwgcnsjdslhev.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZHB0a3lid2djbnNqZHNsaGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMTE3MTksImV4cCI6MjA3MzY4NzcxOX0.z4miSmTH2voxDAnmdcxpa6M-1D3vviZKhziNN8j0leU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
