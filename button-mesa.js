/* ==========================================
   MESA ONLINE — RPG
   SISTEMA DE INTERAÇÃO DA MESA
========================================== */

"use strict";

(function () {


    /* ========================================================
       INICIALIZAÇÃO
    ======================================================== */

    function inicializarBotoesMesa() {

        registrarEventos();

        registrarBotaoDiagnostico();

        console.log(
            "[Button Mesa] Sistema de interação inicializado."
        );

    }



    /* ========================================================
       EVENTOS
    ======================================================== */

    function registrarEventos() {


        /* ----------------------------------------------
           CLIQUES GERAIS
        ---------------------------------------------- */

        document.addEventListener(
            "click",
            tratarCliqueGeral
        );


        /* ----------------------------------------------
           CLIQUE NOS CARDS DOS JOGADORES
        ---------------------------------------------- */

        document.addEventListener(
            "click",
            tratarCliqueCardJogador
        );

    }



    /* ========================================================
       BOTÃO DE DIAGNÓSTICO
       
       O diagnóstico possui um listener próprio.
       Ele NÃO depende do data-mesa-action.
    ======================================================== */

    function registrarBotaoDiagnostico() {

        const botao =
            document.getElementById(
                "btn-diagnostico"
            );


        if (!botao) {

            console.warn(
                "[Button Mesa] Botão de diagnóstico não encontrado."
            );

            return;

        }


        botao.addEventListener(
            "click",
            function (event) {

                /*
                 Impede que o clique continue sendo tratado
                 por outros sistemas da mesa.
                */

                event.preventDefault();

                event.stopPropagation();

                abrirDiagnostico();

            }
        );


        console.log(
            "[Button Mesa] Botão de diagnóstico conectado."
        );

    }



    /* ========================================================
       CLIQUE GERAL
    ======================================================== */

    function tratarCliqueGeral(event) {

        /*
         O botão de diagnóstico possui tratamento próprio.
         Portanto, ele não passa novamente pelo sistema geral.
        */

        if (
            event.target.closest(
                "#btn-diagnostico"
            )
        ) {

            return;

        }


        const elemento =
            event.target.closest(
                "[data-mesa-action]"
            );


        if (!elemento) {

            return;

        }


        event.preventDefault();


        const acao =
            elemento.dataset.mesaAction;


        executarAcao(
            acao,
            elemento,
            event
        );

    }



    /* ========================================================
       EXECUTAR AÇÃO GERAL
    ======================================================== */

    function executarAcao(
        acao,
        elemento,
        event
    ) {

        if (!acao) {

            return;

        }


        switch (acao) {


            /* ----------------------------------------------
               VOLTAR
            ---------------------------------------------- */

            case "voltar":

                voltarParaMesa();

                break;



            /* ----------------------------------------------
               MESA PRINCIPAL
            ---------------------------------------------- */

            case "mesa":

                mostrarMesaPrincipal();

                break;



            /* ----------------------------------------------
               FECHAR
            ---------------------------------------------- */

            case "fechar":

                fecharPainel();

                break;



            /* ----------------------------------------------
               ATUALIZAR
            ---------------------------------------------- */

            case "atualizar":

                atualizarMesa();

                break;



            /* ----------------------------------------------
               DIAGNÓSTICO
               
               Mantido como compatibilidade caso outro
               elemento ainda utilize data-mesa-action.
            ---------------------------------------------- */

            case "diagnostico":

                abrirDiagnostico();

                break;



            /* ----------------------------------------------
               CTE
            ---------------------------------------------- */

            case "cte":

                interagirCTE(
                    elemento,
                    event
                );

                break;



            /* ----------------------------------------------
               DESCONHECIDA
            ---------------------------------------------- */

            default:

                console.warn(
                    "[Button Mesa] Ação desconhecida:",
                    acao
                );

        }

    }



    /* ========================================================
       DIAGNÓSTICO
    ======================================================== */

    function abrirDiagnostico() {

        console.log(
            "[Button Mesa] Tentando abrir diagnóstico..."
        );


        /*
         Verifica se o sistema existe.
        */

        if (
            !window.MesaDiagnostico
        ) {

            console.error(
                "[Button Mesa] window.MesaDiagnostico não existe."
            );

            return;

        }


        /*
         Verifica se a função abrir existe.
        */

        if (
            typeof window.MesaDiagnostico.abrir !==
            "function"
        ) {

            console.error(
                "[Button Mesa] MesaDiagnostico.abrir() não existe."
            );

            return;

        }


        /*
         Abre o diagnóstico.
        */

        window.MesaDiagnostico.abrir();


        console.log(
            "[Button Mesa] Diagnóstico solicitado com sucesso."
        );

    }



    /* ========================================================
       CARD DO JOGADOR
    ======================================================== */

    function tratarCliqueCardJogador(event) {

        const card =
            event.target.closest(
                "[data-player]"
            );


        if (!card) {

            return;

        }


        /*
         Se o clique veio de um botão ou elemento interno
         que possui uma ação própria, não selecionamos o card.
        */

        if (
            event.target.closest(
                "button, a, input, select, textarea"
            )
        ) {

            return;

        }


        if (
            card.dataset.interactive ===
            "false"
        ) {

            return;

        }


        const slot =
            Number(
                card.dataset.player
            );


        if (

            !slot ||

            slot < 1 ||

            slot > 8

        ) {

            return;

        }


        if (

            window.MesaRPG &&

            typeof window.MesaRPG.selecionarJogador ===
            "function"

        ) {

            window.MesaRPG.selecionarJogador(
                slot
            );

        } else {

            console.warn(
                "[Button Mesa] MesaRPG ainda não está disponível."
            );

        }

    }



    /* ========================================================
       CTE
    ======================================================== */

    function interagirCTE(
        elemento,
        event,
        acao = null
    ) {

        const acaoCTE =
            acao ||
            elemento?.dataset?.cteAction ||
            "iniciar";


        /*
         O Button Mesa NÃO controla
         o tempo do CTE.

         Ele somente identifica a interação
         e encaminha para o Core.
        */

        switch (acaoCTE) {


            /* ----------------------------------------------
               INICIAR CTE
            ---------------------------------------------- */

            case "iniciar":

                iniciarCTE();

                break;


            /* ----------------------------------------------
               CLIQUE REAL DO CTE
            ---------------------------------------------- */

            case "clique":

                executarCliqueCTE(
                    elemento,
                    event
                );

                break;


            /* ----------------------------------------------
               CANCELAR CTE
            ---------------------------------------------- */

            case "cancelar":

                limparCTE();

                break;


            /* ----------------------------------------------
               OUTRAS INTERAÇÕES
            ---------------------------------------------- */

            default:

                document.dispatchEvent(

                    new CustomEvent(
                        "mesa:cteInteracao",
                        {

                            detail: {

                                acao:
                                    acaoCTE,

                                elemento,

                                evento:
                                    event

                            }

                        }

                    )

                );

        }

    }



    /* ========================================================
       CTE — CLIQUE REAL
    ======================================================== */

    function executarCliqueCTE(
        elemento,
        event
    ) {

        /*
         O clique chegou até aqui.

         Quem decide se o clique foi válido,
         se estava dentro do tempo e qual será
         o resultado é o mesa.js.
        */

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.executarCliqueCTE ===
            "function"

        ) {

            window.MesaRPG.executarCliqueCTE(
                elemento,
                event
            );

            return;

        }


        console.warn(
            "[Button Mesa] executarCliqueCTE() ainda não está disponível no MesaRPG."
        );

    }



    /* ========================================================
       VOLTAR PARA MESA
    ======================================================== */

    function voltarParaMesa() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.voltarParaMesaNormal ===
            "function"

        ) {

            window.MesaRPG.voltarParaMesaNormal();

            return;

        }


        console.warn(
            "[Button Mesa] MesaRPG ainda não está disponível."
        );

    }



    /* ========================================================
       MESA PRINCIPAL
    ======================================================== */

    function mostrarMesaPrincipal() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.mostrarTelaPrincipal ===
            "function"

        ) {

            window.MesaRPG.mostrarTelaPrincipal();

            return;

        }


        console.warn(
            "[Button Mesa] MesaRPG ainda não está disponível."
        );

    }



    /* ========================================================
       FECHAR PAINEL
    ======================================================== */

    function fecharPainel() {

        mostrarMesaPrincipal();

    }



    /* ========================================================
       ATUALIZAR MESA
    ======================================================== */

    function atualizarMesa() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.atualizarAssentos ===
            "function"

        ) {

            window.MesaRPG.atualizarAssentos();

        } else {

            console.warn(
                "[Button Mesa] MesaRPG ainda não está disponível."
            );

        }


        document.dispatchEvent(

            new CustomEvent(
                "mesa:atualizarSolicitado"
            )

        );

    }



    /* ========================================================
       CTE — ENCAMINHAR PARA O CORE
    ======================================================== */

    function iniciarCTE(
        opcoes = {}
    ) {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.iniciarCTE ===
            "function"

        ) {

            window.MesaRPG.iniciarCTE(
                opcoes
            );

            return;

        }


        console.warn(
            "[Button Mesa] MesaRPG ainda não está disponível."
        );

    }



    /* ========================================================
       CTE — LIMPAR
    ======================================================== */

    function limparCTE() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.limparCTE ===
            "function"

        ) {

            window.MesaRPG.limparCTE();

            return;

        }


        console.warn(
            "[Button Mesa] MesaRPG ainda não está disponível."
        );

    }



    /* ========================================================
       API PÚBLICA
    ======================================================== */

    window.ButtonMesa = {

        executarAcao,

        tratarCliqueCardJogador,

        voltarParaMesa,

        mostrarMesaPrincipal,

        fecharPainel,

        atualizarMesa,

        abrirDiagnostico,

        iniciarCTE,

        limparCTE,

        interagirCTE,

        executarCliqueCTE

    };



    /* ========================================================
       DOM READY
    ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(

            "DOMContentLoaded",

            inicializarBotoesMesa

        );

    } else {

        inicializarBotoesMesa();

    }


})();
