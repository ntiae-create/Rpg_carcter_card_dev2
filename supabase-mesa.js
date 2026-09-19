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
     INICIALIZAÇÃO
    ==========================================================
    */

    function inicializar() {

        console.log(
            "[Supabase Mesa] Solicitação de inicialização."
        );


        /*
        ------------------------------------------------------
        Evita criar mais de um cliente
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
        Verifica a biblioteca
        ------------------------------------------------------
        */

        if (!verificarBiblioteca()) {

            console.warn(
                "[Supabase Mesa] Biblioteca oficial do Supabase não encontrada."
            );

            return null;
        }


        /*
        ------------------------------------------------------
        Cria o cliente
        ------------------------------------------------------
        */

        try {

            estado.cliente =
                window.supabase.createClient(
                    CONFIG.url,
                    CONFIG.key
                );


            estado.inicializado = true;


            console.log(
                "[Supabase Mesa] Cliente criado com sucesso."
            );


            /*
            --------------------------------------------------
            Evento
            --------------------------------------------------
            */

            window.dispatchEvent(
                new CustomEvent(
                    "supabase:mesaPronto",
                    {
                        detail: {

                            cliente:
                                estado.cliente

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


            estado.cliente = null;

            estado.inicializado = false;


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


        estado.contextoRecebido = true;


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
