"use strict";

/* =========================================================
   SUPABASE MESA
   Cliente principal + contexto da Mesa RPG
========================================================= */

(function () {

    console.log("[Supabase Mesa] Carregando módulo...");

    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

    const CONFIG = {

        url:
            "https://bjkbfxcmyihdruqrwsdf.supabase.co",

        key:
            "sb_publishable_j2Qi8rg5sr3qvtq6-HAvkQ_Deurk34_"

    };


    /* =====================================================
       ESTADO
    ===================================================== */

    const estado = {

        inicializado:
            false,

        bibliotecaDisponivel:
            false,

        cliente:
            null,

        origemCliente:
            null,

        mesmoClienteGlobal:
            true,

        contextoRecebido:
            false,

        contexto:
            null

    };


    /* =====================================================
       VERIFICAR BIBLIOTECA
    ===================================================== */

    function verificarBiblioteca() {

        estado.bibliotecaDisponivel =
            !!(
                window.supabase &&
                typeof window.supabase.createClient === "function"
            );

        return estado.bibliotecaDisponivel;

    }


    /* =====================================================
       CRIAR CLIENTE PRINCIPAL
    ===================================================== */

    function inicializar() {

        console.log(
            "[Supabase Mesa] Solicitação de inicialização."
        );


        /* ---------------------------------------------
           Já inicializado
        --------------------------------------------- */

        if (
            estado.inicializado &&
            estado.cliente
        ) {

            console.log(
                "[Supabase Mesa] Cliente já inicializado."
            );

            return estado.cliente;

        }


        /* ---------------------------------------------
           Verificar biblioteca
        --------------------------------------------- */

        if (!verificarBiblioteca()) {

            console.error(
                "[Supabase Mesa] Biblioteca oficial do Supabase não encontrada."
            );

            estado.inicializado =
                false;

            estado.cliente =
                null;

            return null;

        }


        /* ---------------------------------------------
           Criar cliente
        --------------------------------------------- */

        try {

            estado.cliente =
                window.supabase.createClient(
                    CONFIG.url,
                    CONFIG.key
                );


            estado.origemCliente =
                "supabase-mesa.js";


            estado.mesmoClienteGlobal =
                true;


            estado.inicializado =
                true;


            /* -----------------------------------------
               Disponibilizar globalmente
            ----------------------------------------- */

            window.supabaseClient =
                estado.cliente;


            console.log(
                "[Supabase Mesa] Cliente principal criado."
            );

            console.log(
                "[Supabase Mesa] window.supabaseClient disponível."
            );


            /* -----------------------------------------
               Evento de pronto
            ----------------------------------------- */

            window.dispatchEvent(

                new CustomEvent(
                    "supabase:mesaPronto",
                    {
                        detail: {

                            cliente:
                                estado.cliente,

                            origem:
                                estado.origemCliente,

                            mesmoClienteGlobal:
                                true

                        }
                    }
                )

            );


            return estado.cliente;


        } catch (erro) {

            console.error(
                "[Supabase Mesa] Erro ao criar cliente:",
                erro
            );


            estado.cliente =
                null;

            estado.origemCliente =
                null;

            estado.inicializado =
                false;

            return null;

        }

    }


    /* =====================================================
       RECEBER CONTEXTO DA MESA
    ===================================================== */

    function receberContexto(contexto) {

        if (!contexto) {

            console.warn(
                "[Supabase Mesa] Contexto vazio recebido."
            );

            return false;

        }


        estado.contexto = {

            campanha:
                contexto.campanha ||
                null,

            usuario:
                contexto.usuario ||
                null,

            personagem:
                contexto.personagem ||
                null

        };


        estado.contextoRecebido =
            true;


        console.log(
            "[Supabase Mesa] Contexto recebido:",
            estado.contexto
        );


        window.dispatchEvent(

            new CustomEvent(
                "supabase:mesaContextoRecebido",
                {
                    detail: {

                        contexto:
                            estado.contexto

                    }
                }
            )

        );


        return true;

    }


    /* =====================================================
       OBTER CLIENTE
    ===================================================== */

    function obterCliente() {

        return estado.cliente;

    }


    /* =====================================================
       OBTER CONTEXTO
    ===================================================== */

    function obterContexto() {

        return estado.contexto;

    }


    /* =====================================================
       VERIFICAR DISPONIBILIDADE
    ===================================================== */

    function estaDisponivel() {

        return (

            estado.inicializado &&
            !!estado.cliente

        );

    }


    /* =====================================================
       DIAGNÓSTICO
    ===================================================== */

    function diagnostico() {

        const clientePrincipal =
            window.supabaseClient || null;


        const clienteMesa =
            estado.cliente || null;


        return {

            /* Biblioteca */

            biblioteca:
                estado.bibliotecaDisponivel,


            /* Inicialização */

            inicializado:
                estado.inicializado,


            /* Clientes */

            cliente:
                !!clienteMesa,

            clienteMesa:
                !!clienteMesa,

            clientePrincipal:
                !!clientePrincipal,


            /* Origem */

            origemCliente:
                estado.origemCliente,


            /* Referência */

            mesmoClienteGlobal:
                !!(
                    clientePrincipal &&
                    clienteMesa &&
                    clientePrincipal === clienteMesa
                ),


            clientesDiferentes:
                !!(
                    clientePrincipal &&
                    clienteMesa &&
                    clientePrincipal !== clienteMesa
                ),


            /* Contexto */

            contextoRecebido:
                estado.contextoRecebido,


            campanha:
                !!estado.contexto?.campanha,


            usuario:
                !!estado.contexto?.usuario,


            personagem:
                !!estado.contexto?.personagem

        };

    }


    /* =====================================================
       EXPOR MÓDULO
    ===================================================== */

    window.SupabaseMesa = {

        inicializar,

        receberContexto,

        obterCliente,

        obterContexto,

        estaDisponivel,

        diagnostico

    };


    /* =====================================================
       DISPONIBILIZAR IMEDIATAMENTE
    ===================================================== */

    console.log(
        "[Supabase Mesa] Módulo disponível."
    );


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar,
            { once: true }
        );

    } else {

        inicializar();

    }

})();
