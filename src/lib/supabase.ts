import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  console.error(
    '[PPL/UL] Supabase credentials missing.\n' +
    'Create a .env.local file in the project root:\n\n' +
    '  VITE_SUPABASE_URL=https://qdliyanbtrukhjwdlffn.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=sb_publishable_DkJGurNJbiR2vBW1o1mQCg_qozDvuLG\n'
  );
}

// Use placeholder values so the module doesn't crash on load;
// auth calls will fail gracefully and show the login page.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder-key'
);
