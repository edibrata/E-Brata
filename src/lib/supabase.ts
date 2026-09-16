import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tnzceffjxostkwyellwf.supabase.co';
const supabaseKey = 'sb_publishable_b0Myq0XAqdiUj-Dzb-pHBQ_9LAmpsVE';

export const supabase = createClient(supabaseUrl, supabaseKey);
