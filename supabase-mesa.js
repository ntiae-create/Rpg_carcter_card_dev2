"use strict";

/*
==============================================================
 SUPABASE — MESA
 -------------------------------------------------------------
 Módulo isolado de integração da Mesa com o Supabase.

 Este arquivo NÃO deve:
 - alterar mesa.js
 - alterar auth.js
 - alterar campaign.js
 - carregar personagens automaticamente
 - iniciar Realtime automaticamente

 Ele apenas prepara o cliente e recebe o contexto
 fornecido pelo supabase-entrada.js.
==============================================================
*/

(function () {

    console.log("[Supabase Mesa] Carregando módulo...");


    /*
    ==========================================================
     CONFIGURAÇÃO
    ==========================================================
    */

    const CONFIG = {

        url:
            "https://bjkbfxcmyihdruqrwsdf.supabase.co",

        key:
            "sb_publishable_j2Qi8rg5sr3qvtq6-HAvkQ_Deurk34_"

    };


    /*
    ==========================================================
     ESTADO INTERNO
    ==========================================================
    */

    const estado = {

        inicializado: false,

        bibliotecaDisponivel: false,

        cliente: null,

        origemCliente: null,

        mesmoClienteGlobal: false,

        contextoRecebido: false,

        contexto: null

    };


    /*
    ==========================================================
     VERIFICA A BIBLIOTECA DO SUPABASE
    ==========================================================
    */

    function verificarBiblioteca() {

        estado.bibliotecaDisponivel = !!(
            window.supabase &&
            typeof window.supabase.createClient === "function"
        );

        return estado.bibliotecaDisponivel;
    }


    /*
    ==========================================================
     OBTÉM O CLIENTE SUPABASE GLOBAL
    ==========================================================
    */

    function obterClienteGlobal() {

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ) {

            return window.supabaseClient;

        }

        return null;
    }


    /*
    ==========================================================
     INICIALIZAÇÃO
    ==========================================================
    */

    function inicializar() {

        console.log(
            "[Supabase Mesa] Solicitação de inicialização."
        );


        /*
        ------------------------------------------------------
        Evita inicializar novamente
        ------------------------------------------------------
        */

        if (estado.inicializado) {

            console.log(
                "[Supabase Mesa] Cliente já inicializado."
            );

            return estado.cliente;

        }


        /*
        ------------------------------------------------------
        PRIMEIRA OPÇÃO:
        reutilizar o cliente oficial já criado pelo supabase.js
        ------------------------------------------------------
        */

        const clienteGlobal =
            obterClienteGlobal();


        if (clienteGlobal) {

            estado.cliente =
                clienteGlobal;

            estado.origemCliente =
                "supabase.js";

            estado.mesmoClienteGlobal =
                true;

            estado.inicializado =
                true;


            console.log(
                "[Supabase Mesa] Cliente global reutilizado."
            );


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
                                estado.mesmoClienteGlobal

                        }
                    }
                )

            );


            return estado.cliente;

        }


        /*
        ------------------------------------------------------
        FALLBACK:
        caso o cliente global ainda não exista.
        ------------------------------------------------------
        */

        console.warn(
            "[Supabase Mesa] Cliente global não encontrado. Tentando criar cliente próprio."
        );


        if (!verificarBiblioteca()) {

            console.warn(
                "[Supabase Mesa] Biblioteca oficial do Supabase não encontrada."
            );

            return null;

        }


        try {

            estado.cliente =

                window.supabase.createClient(

                    CONFIG.url,

                    CONFIG.key

                );


            estado.origemCliente =
                "cliente-próprio";

            estado.mesmoClienteGlobal =
                false;

            estado.inicializado =
                true;


            console.log(
                "[Supabase Mesa] Cliente próprio criado como fallback."
            );


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
                                estado.mesmoClienteGlobal

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

            estado.mesmoClienteGlobal =
                false;

            estado.inicializado =
                false;


            return null;

        }

    }


    /*
    ==========================================================
     RECEBE O CONTEXTO DA ENTRADA
    ==========================================================
    */

    function receberContexto(contexto) {

        if (!contexto) {

            console.warn(
                "[Supabase Mesa] Contexto vazio recebido."
            );

            return false;

        }


        estado.contexto = {

            campanha:
                contexto.campanha || null,

            usuario:
                contexto.usuario || null,

            personagem:
                contexto.personagem || null

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


    /*
    ==========================================================
     OBTÉM O CLIENTE
    ==========================================================
    */

    function obterCliente() {

        return estado.cliente;

    }


    /*
    ==========================================================
     OBTÉM O CONTEXTO
    ==========================================================
    */

    function obterContexto() {

        return estado.contexto;

    }


    /*
    ==========================================================
     STATUS
    ==========================================================
    */

    function estaDisponivel() {

        return (

            estado.inicializado &&

            !!estado.cliente

        );

    }


    /*
    ==========================================================
     DIAGNÓSTICO
    ==========================================================
    */

    function diagnostico() {

        return {

            biblioteca:
                estado.bibliotecaDisponivel,

            inicializado:
                estado.inicializado,

            cliente:
                !!estado.cliente,

            origemCliente:
                estado.origemCliente,

            mesmoClienteGlobal:
                estado.mesmoClienteGlobal,

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


    /*
    ==========================================================
     API PÚBLICA
    ==========================================================
    */

    window.SupabaseMesa = {

        inicializar,

        receberContexto,

        obterCliente,

        obterContexto,

        estaDisponivel,

        diagnostico

    };


    console.log(
        "[Supabase Mesa] Módulo disponível."
    );

})();
