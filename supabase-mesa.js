/* ==========================================
   MESA ONLINE — RPG
   SUPABASE DA MESA
========================================== */

"use strict";

(function () {

    const SUPABASE_URL =
        "https://bjkbfxcmyihdruqrwsdf.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_j2Qi8rg5sr3qvtq6-HAvkQ_Deurk34_";


    if (!window.supabase) {

        console.error(
            "[Supabase Mesa] Biblioteca do Supabase não encontrada."
        );

        return;
    }


    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );


    window.supabaseClient =
        supabaseClient;


    console.log(
        "[Supabase Mesa] Cliente Supabase inicializado."
    );

})();
