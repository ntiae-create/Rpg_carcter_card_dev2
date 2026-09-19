const SUPABASE_URL = "https://bjkbfxcmyihdruqrwsdf.supabase.co";
const SUPABASE_KEY = "sb_publishable_j2Qi8rg5sr3qvtq6-HAvkQ_Deurk34_";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

window.supabaseClient = supabaseClient;

console.log("[supabase.js] Cliente criado:", !!window.supabaseClient);
console.log(
    "[supabase.js] from:",
    typeof window.supabaseClient?.from
);
console.log(
    "[supabase.js] auth:",
    !!window.supabaseClient?.auth
);
