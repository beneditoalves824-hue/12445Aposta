import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public supabase: SupabaseClient;

  // IMPORTANT: Replace these placeholders with your actual Supabase project URL and Anon Key.
  private supabaseUrl = 'YOUR_SUPABASE_URL';
  private supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

  constructor() {
    if (this.supabaseUrl === 'YOUR_SUPABASE_URL' || this.supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
        throw new Error("Please update YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY in src/services/supabase.service.ts");
    }
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }
}
