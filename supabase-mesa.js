/* =========================================================
   SUPABASE — MESA RPG
   Cliente separado exclusivamente para a mesa.

   IMPORTANTE:
   - Usa o mesmo projeto Supabase do sistema principal.
   - Não altera window.supabaseClient.
   - Não cria autenticação própria.
   - Não registra listeners.
   - Não dispara eventos.
========================================================= */

(function () {

    "use strict";


    const SUPABASE_MESA_URL =
        "https://bjkbfxcmyihdruqrwsdf.supabase.co";


    const SUPABASE_MESA_KEY =
        "sb_publishable_j2Qi8rg5sr3qvtq6-HAvkQ_Deurk34_";


    /*
     * A biblioteca oficial precisa existir antes deste arquivo.
     */

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "[Supabase Mesa] Biblioteca do Supabase não foi carregada."
        );

        window.supabaseMesa = null;

        return;
    }


    /*
     * Cria o cliente exclusivo da mesa.
     */

    const supabaseMesa =
        window.supabase.createClient(
            SUPABASE_MESA_URL,
            SUPABASE_MESA_KEY
        );


    /*
     * Disponibiliza somente para a mesa.
     */

    window.supabaseMesa = supabaseMesa;


    console.log(
        "[Supabase Mesa] Cliente inicializado."
    );

})();
