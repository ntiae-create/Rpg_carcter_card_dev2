"use strict";

/*
==============================================================
 SUPABASE — MESA
 -------------------------------------------------------------
 Módulo isolado responsável pela integração da Mesa com
 o Supabase.

 IMPORTANTE:
 - Não altera mesa.js
 - Não altera auth.js
 - Não altera campaign.js
 - Não inicia automaticamente consultas pesadas
 - Apenas prepara a infraestrutura
==============================================================
*/

(function () {

    console.log("[Supabase Mesa] Carregando módulo...");


    /*
    ----------------------------------------------------------
    CONFIGURAÇÃO
    ----------------------------------------------------------
    */

    const CONFIG = {

        url:
            "https://bjkbfxcmyihdruqrwsdf.supabase.co",

        key:
            "sb_publishable_j2Qi8rg5sr3qvtq6-HAvkQ_Deurk34_"

    };


    let cliente = null;
    let inicializado = false;


    /*
    ----------------------------------------------------------
    LOCALIZA A BIBLIOTECA DO SUPABASE
    ----------------------------------------------------------
    */

    function obterBibliotecaSupabase() {

        if (
            window.supabase &&
            typeof window.supabase.createClient === "function"
        ) {

            return window.supabase;
        }

        return null;
    }


    /*
    ----------------------------------------------------------
    INICIALIZA O CLIENTE
    ----------------------------------------------------------
    */

    function inicializar() {

        if (inicializado) {

            console.log(
                "[Supabase Mesa] Já inicializado."
            );

            return cliente;
        }


        const biblioteca = obterBibliotecaSupabase();


        if (!biblioteca) {

            console.warn(
                "[Supabase Mesa] Biblioteca do Supabase não encontrada."
            );

            return null;
        }


        try {

            cliente = biblioteca.createClient(
                CONFIG.url,
                CONFIG.key
            );

            inicializado = true;


            console.log(
                "[Supabase Mesa] Cliente inicializado."
            );


            window.dispatchEvent(
                new CustomEvent(
                    "supabase:mesaPronto",
                    {
                        detail: {
                            cliente
                        }
                    }
                )
            );


            return cliente;

        } catch (erro) {

            console.error(
                "[Supabase Mesa] Erro ao criar cliente:",
                erro
            );

            cliente = null;
            inicializado = false;

            return null;
        }
    }


    /*
    ----------------------------------------------------------
    OBTÉM O CLIENTE
    ----------------------------------------------------------
    */

    function obterCliente() {

        if (!inicializado) {

            inicializar();
        }

        return cliente;
    }


    /*
    ----------------------------------------------------------
    VERIFICAÇÃO
    ----------------------------------------------------------
    */

    function estaDisponivel() {

        return (
            inicializado &&
            cliente !== null
        );
    }


    /*
    ----------------------------------------------------------
    DIAGNÓSTICO BÁSICO
    ----------------------------------------------------------
    */

    function diagnostico() {

        return {

            biblioteca:
                !!obterBibliotecaSupabase(),

            inicializado,

            disponivel:
                estaDisponivel(),

            url:
                CONFIG.url

        };
    }


    /*
    ----------------------------------------------------------
    API PÚBLICA
    ----------------------------------------------------------
    */

    window.SupabaseMesa = {

        inicializar,

        obterCliente,

        estaDisponivel,

        diagnostico

    };


    console.log(
        "[Supabase Mesa] Módulo disponível."
    );

})();
