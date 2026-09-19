"use strict";

const SUPABASE_MESA_URL =
    "https://bjkbfxcmyihdruqrwsdf.supabase.co";

const SUPABASE_MESA_KEY =
    "sb_publishable_j2Qi8rg5sr3qvtq6-HAvkQ_Deurk34_";

const supabaseMesa =
    supabase.createClient(
        SUPABASE_MESA_URL,
        SUPABASE_MESA_KEY
    );

window.supabaseMesa = supabaseMesa;
