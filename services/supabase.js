const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Backend operations may fail due to Row Level Security (RLS).");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
