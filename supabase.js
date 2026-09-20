"use strict";

(function () {

    console.log("[supabase.js] Iniciando...");
    
window.__SUPABASE_JS_CARREGOU = true;
    
    const SUPABASE_URL =
        "https://bjkbfxcmyihdruqrwsdf.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_j2Qi8rg5sr3qvtq6-HAvkQ_Deurk34_";

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "[supabase.js] Biblioteca do Supabase não encontrada."
        );

        return;
    }

    const cliente =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    window.supabaseClient = cliente;

    console.log(
        "[supabase.js] Cliente criado."
    );

    console.log(
        "[supabase.js] from:",
        typeof cliente.from
    );

    console.log(
        "[supabase.js] auth:",
        !!cliente.auth
    );

})();
