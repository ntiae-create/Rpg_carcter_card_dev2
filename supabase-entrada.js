"use strict";

/*
==============================================================
 SUPABASE — ENTRADA DA MESA
 -------------------------------------------------------------
 Este arquivo funciona como uma ponte entre a aplicação
 e o módulo específico do Supabase da Mesa.

 IMPORTANTE:
 - Não altera mesa.js
 - Não altera auth.js
 - Não altera campaign.js
 - Não cria outro projeto Supabase
 - Não executa consultas diretamente
==============================================================
*/

(function () {

    console.log("[Supabase Entrada] Inicializando...");

    /*
    ----------------------------------------------------------
    CONTROLE DE SEGURANÇA
    ----------------------------------------------------------
    Se precisarmos desativar toda a integração nova,
    basta mudar para false.
    ----------------------------------------------------------
    */

    const ATIVO = true;

    if (!ATIVO) {

        console.warn(
            "[Supabase Entrada] Integração da Mesa desativada."
        );

        window.SupabaseEntrada = {
            ativo: false,
            disponivel: false
        };

        return;
    }


    /*
    ----------------------------------------------------------
    VERIFICA SE O MÓDULO DA MESA EXISTE
    ----------------------------------------------------------
    */

    function verificarModuloMesa() {

        if (
            !window.SupabaseMesa ||
            typeof window.SupabaseMesa.inicializar !== "function"
        ) {

            console.warn(
                "[Supabase Entrada] supabase-mesa.js ainda não está disponível."
            );

            return false;
        }

        return true;
    }


    /*
    ----------------------------------------------------------
    INICIALIZAÇÃO
    ----------------------------------------------------------
    */

    function iniciar() {

        if (!verificarModuloMesa()) {
            return;
        }

        try {

            window.SupabaseMesa.inicializar();

            console.log(
                "[Supabase Entrada] Supabase da Mesa conectado ao módulo."
            );

        } catch (erro) {

            console.error(
                "[Supabase Entrada] Erro ao iniciar Supabase da Mesa:",
                erro
            );

        }
    }


    /*
    ----------------------------------------------------------
    API PÚBLICA
    ----------------------------------------------------------
    */

    window.SupabaseEntrada = {

        ativo: true,

        iniciar,

        verificarModuloMesa

    };


    /*
    ----------------------------------------------------------
    EXPÕE O EVENTO DE ENTRADA
    ----------------------------------------------------------
    */

    window.dispatchEvent(
        new CustomEvent("supabase:entradaDisponivel")
    );


    /*
    ----------------------------------------------------------
    TENTA INICIAR QUANDO A PÁGINA ESTIVER PRONTA
    ----------------------------------------------------------
    */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
            { once: true }
        );

    } else {

        iniciar();

    }


})();
