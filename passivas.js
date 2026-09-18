/* ==========================================
   RPG — CONTROLADOR PRINCIPAL DAS PASSIVAS
========================================== */

"use strict";

(function () {

    /*
     * Este arquivo é o controlador central do sistema
     * de passivas.
     *
     * RESPONSABILIDADES:
     *
     * - Acessar os dados das passivas
     * - Manipular Stacks através do PassivasStacks
     * - Atualizar os efeitos visuais
     * - Expor uma API única para os outros sistemas
     * - Encaminhar eventos relacionados às passivas
     *
     * NÃO é responsabilidade deste arquivo:
     *
     * - Criar regras específicas de combate
     * - Causar dano
     * - Aplicar cura diretamente
     * - Controlar CTE
     * - Controlar a Mesa
     *
     * Esses sistemas podem utilizar a API abaixo.
     */


    /* ======================================================
       VERIFICAR SISTEMA
    ====================================================== */

    function sistemaDisponivel() {

        return Boolean(

            window.PassivasDados &&

            window.PassivasStacks &&

            window.PassivasEfeitos

        );

    }


    /* ======================================================
       DADOS
    ====================================================== */

    function obterPassiva(passivaId) {

        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.obter !==
                "function"
        ) {
            return null;
        }

        return window.PassivasDados.obter(
            passivaId
        );

    }


    function listarPassivas() {

        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.listar !==
                "function"
        ) {
            return [];
        }

        return window.PassivasDados.listar();

    }


    function listarPassivasPorClasse(classe) {

        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.listarPorClasse !==
                "function"
        ) {
            return [];
        }

        return window.PassivasDados.listarPorClasse(
            classe
        );

    }


    function existePassiva(passivaId) {

        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.existe !==
                "function"
        ) {
            return false;
        }

        return window.PassivasDados.existe(
            passivaId
        );

    }


    /* ======================================================
       VERIFICAR TIPO DE PASSIVA
    ====================================================== */

    function ehPassivaDeStack(passivaId) {

        const passiva =
            obterPassiva(
                passivaId
            );

        if (!passiva) {
            return false;
        }

        return (
            passiva.tipo === "stack" ||
            passiva.tipo === "stack_alvo"
        );

    }


    function ehPassivaDeStackAlvo(passivaId) {

        const passiva =
            obterPassiva(
                passivaId
            );

        if (!passiva) {
            return false;
        }

        return (
            passiva.tipo === "stack_alvo"
        );

    }


    function obterTipo(passivaId) {

        const passiva =
            obterPassiva(
                passivaId
            );

        return passiva
            ? passiva.tipo
            : null;

    }


    /* ======================================================
       STACKS
    ====================================================== */

    function obterStacks(
        jogadorId,
        passivaId
    ) {

        if (
            !window.PassivasStacks ||
            typeof window.PassivasStacks.obter !==
                "function"
        ) {
            return null;
        }

        return window.PassivasStacks.obter(
            jogadorId,
            passivaId
        );

    }


    function adicionarStack(
        jogadorId,
        passivaId,
        quantidade = 1
    ) {

        if (!ehPassivaDeStack(passivaId)) {

            console.warn(
                "[Passivas] Tentativa de adicionar Stack a uma passiva que não utiliza Stacks:",
                passivaId
            );

            return null;

        }


        if (
            !window.PassivasStacks ||
            typeof window.PassivasStacks.adicionar !==
                "function"
        ) {
            return null;
        }


        return window.PassivasStacks.adicionar(
            jogadorId,
            passivaId,
            quantidade
        );

    }


    function removerStack(
        jogadorId,
        passivaId,
        quantidade = 1
    ) {

        if (!ehPassivaDeStack(passivaId)) {
            return null;
        }


        if (
            !window.PassivasStacks ||
            typeof window.PassivasStacks.remover !==
                "function"
        ) {
            return null;
        }


        return window.PassivasStacks.remover(
            jogadorId,
            passivaId,
            quantidade
        );

    }


    function definirStacks(
        jogadorId,
        passivaId,
        valor
    ) {

        if (!ehPassivaDeStack(passivaId)) {
            return null;
        }


        if (
            !window.PassivasStacks ||
            typeof window.PassivasStacks.definir !==
                "function"
        ) {
            return null;
        }


        return window.PassivasStacks.definir(
            jogadorId,
            passivaId,
            valor
        );

    }


    function resetarPassiva(
        jogadorId,
        passivaId
    ) {

        if (!ehPassivaDeStack(passivaId)) {
            return null;
        }


        if (
            !window.PassivasStacks ||
            typeof window.PassivasStacks.resetar !==
                "function"
        ) {
            return null;
        }


        return window.PassivasStacks.resetar(
            jogadorId,
            passivaId
        );

    }


    function resetarJogador(
        jogadorId
    ) {

        if (
            !window.PassivasStacks ||
            typeof window.PassivasStacks.resetarJogador !==
                "function"
        ) {
            return;
        }


        window.PassivasStacks.resetarJogador(
            jogadorId
        );

    }


    function obterTodas(
        jogadorId
    ) {

        if (
            !window.PassivasStacks ||
            typeof window.PassivasStacks.obterTodas !==
                "function"
        ) {
            return {};
        }


        return window.PassivasStacks.obterTodas(
            jogadorId
        );

    }


    function stacksNoMaximo(
        jogadorId,
        passivaId
    ) {

        if (!ehPassivaDeStack(passivaId)) {
            return false;
        }


        if (
            !window.PassivasStacks ||
            typeof window.PassivasStacks.estaNoMaximo !==
                "function"
        ) {
            return false;
        }


        return window.PassivasStacks.estaNoMaximo(
            jogadorId,
            passivaId
        );

    }


    /* ======================================================
       ATALHOS DE GAMEPLAY
    ====================================================== */

    function ganharStack(
        jogadorId,
        passivaId
    ) {

        return adicionarStack(
            jogadorId,
            passivaId,
            1
        );

    }


    function perderStack(
        jogadorId,
        passivaId
    ) {

        return removerStack(
            jogadorId,
            passivaId,
            1
        );

    }


    function possuiStack(
        jogadorId,
        passivaId
    ) {

        const estado =
            obterStacks(
                jogadorId,
                passivaId
            );

        if (!estado) {
            return false;
        }

        return estado.valor > 0;

    }


    function stackMaximo(
        jogadorId,
        passivaId
    ) {

        return stacksNoMaximo(
            jogadorId,
            passivaId
        );

    }


    /* ======================================================
       VISUAL
    ====================================================== */

    function atualizarVisual(
        jogadorId,
        passivaId,
        estado
    ) {

        if (
            !window.PassivasEfeitos ||
            typeof window.PassivasEfeitos.atualizar !==
                "function"
        ) {
            return null;
        }


        return window.PassivasEfeitos.atualizar(
            jogadorId,
            passivaId,
            estado
        );

    }


    function limparVisual(
        jogadorId,
        passivaId
    ) {

        if (
            !window.PassivasEfeitos ||
            typeof window.PassivasEfeitos.limpar !==
                "function"
        ) {
            return;
        }


        window.PassivasEfeitos.limpar(
            jogadorId,
            passivaId
        );

    }


    function limparVisuaisJogador(
        jogadorId
    ) {

        if (
            !window.PassivasEfeitos ||
            typeof window.PassivasEfeitos.limparJogador !==
                "function"
        ) {
            return;
        }


        window.PassivasEfeitos.limparJogador(
            jogadorId
        );

    }


    function reaplicarVisuais() {

        if (
            !window.PassivasEfeitos ||
            typeof window.PassivasEfeitos.reaplicarTodos !==
                "function"
        ) {
            return;
        }


        window.PassivasEfeitos.reaplicarTodos();

    }


    function reaplicarVisualJogador(
        jogadorId
    ) {

        if (
            !window.PassivasStacks ||
            typeof window.PassivasStacks.obterTodas !==
                "function"
        ) {
            return;
        }


        const estados =
            window.PassivasStacks.obterTodas(
                jogadorId
            );


        Object.keys(
            estados
        ).forEach(
            function (passivaId) {

                atualizarVisual(
                    jogadorId,
                    passivaId,
                    estados[passivaId]
                );

            }
        );

    }


    /* ======================================================
       EVENTO — STACK ALTERADA
    ====================================================== */

    window.addEventListener(
        "passiva:stacksAlterada",
        function (evento) {

            const dados =
                evento.detail;

            if (!dados) {
                return;
            }


            /*
             * Repassamos o evento em uma forma
             * mais geral para o restante do sistema.
             */

            window.dispatchEvent(
                new CustomEvent(
                    "passiva:atualizada",
                    {
                        detail: {

                            jogadorId:
                                dados.jogadorId,

                            passivaId:
                                dados.passivaId,

                            anterior:
                                dados.anterior,

                            atual:
                                dados.atual,

                            minimo:
                                dados.minimo,

                            maximo:
                                dados.maximo,

                            percentual:
                                dados.percentual,

                            atingiuMaximo:
                                dados.atingiuMaximo

                        }
                    }
                )
            );

        }
    );


    /* ======================================================
       EVENTO — JOGADORES ATUALIZADOS
    ====================================================== */

    window.addEventListener(
        "mesa:jogadoresAtualizados",
        function () {

            setTimeout(
                function () {

                    reaplicarVisuais();

                },
                0
            );

        }
    );


    /* ======================================================
       EVENTO — JOGADOR ATUALIZADO
    ====================================================== */

    window.addEventListener(
        "mesa:jogadorAtualizado",
        function (evento) {

            const dados =
                evento.detail;

            if (!dados) {
                return;
            }


            const jogadorId =
                dados.jogadorId ||
                dados.userId ||
                dados.characterId ||
                dados.id;


            if (!jogadorId) {
                return;
            }


            setTimeout(
                function () {

                    reaplicarVisualJogador(
                        jogadorId
                    );

                },
                0
            );

        }
    );


    /* ======================================================
       EVENTO — PASSIVA ATIVADA
    ====================================================== */

    function emitirPassivaAtivada(
        jogadorId,
        passivaId,
        dadosExtras = {}
    ) {

        const passiva =
            obterPassiva(
                passivaId
            );

        if (!passiva) {
            return;
        }


        window.dispatchEvent(
            new CustomEvent(
                "passiva:ativada",
                {
                    detail: {

                        jogadorId:
                            jogadorId,

                        passivaId:
                            passivaId,

                        passiva:
                            passiva,

                        ...dadosExtras

                    }
                }
            )
        );

    }


    /* ======================================================
       EVENTO — PASSIVA DESATIVADA
    ====================================================== */

    function emitirPassivaDesativada(
        jogadorId,
        passivaId,
        dadosExtras = {}
    ) {

        const passiva =
            obterPassiva(
                passivaId
            );

        if (!passiva) {
            return;
        }


        window.dispatchEvent(
            new CustomEvent(
                "passiva:desativada",
                {
                    detail: {

                        jogadorId:
                            jogadorId,

                        passivaId:
                            passivaId,

                        passiva:
                            passiva,

                        ...dadosExtras

                    }
                }
            )
        );

    }


    /* ======================================================
       EVENTO — GATILHO DE PASSIVA
    ====================================================== */

    function emitirGatilho(
        jogadorId,
        passivaId,
        evento,
        dados = {}
    ) {

        const passiva =
            obterPassiva(
                passivaId
            );

        if (!passiva) {
            return;
        }


        window.dispatchEvent(
            new CustomEvent(
                "passiva:gatilho",
                {
                    detail: {

                        jogadorId:
                            jogadorId,

                        passivaId:
                            passivaId,

                        evento:
                            evento,

                        passiva:
                            passiva,

                        dados:
                            dados

                    }
                }
            )
        );

    }


    /* ======================================================
       CTE
    ====================================================== */

    /*
     * O CTE continua pertencendo ao sistema da Mesa.
     *
     * Este controlador apenas oferece um evento
     * para passivas que dependem de CTE.
     */

    function registrarCTESucesso(
        jogadorId,
        dados = {}
    ) {

        /*
         * A passiva oficial do Arqueiro utiliza
         * CTE para acumular Precisão.
         */

        const passiva =
            obterPassiva(
                "precisao"
            );

        if (!passiva) {
            return;
        }


        ganharStack(
            jogadorId,
            "precisao"
        );


        emitirGatilho(
            jogadorId,
            "precisao",
            "cte_sucesso",
            dados
        );

    }


    /* ======================================================
       API PÚBLICA
    ====================================================== */

    window.PassivasRPG = {

        /* Sistema */

        sistemaDisponivel:
            sistemaDisponivel,


        /* Dados */

        obterPassiva:
            obterPassiva,

        listarPassivas:
            listarPassivas,

        listarPassivasPorClasse:
            listarPassivasPorClasse,

        existePassiva:
            existePassiva,

        obterTipo:
            obterTipo,

        ehPassivaDeStack:
            ehPassivaDeStack,

        ehPassivaDeStackAlvo:
            ehPassivaDeStackAlvo,


        /* Stacks */

        obterStacks:
            obterStacks,

        obterTodas:
            obterTodas,

        adicionarStack:
            adicionarStack,

        removerStack:
            removerStack,

        definirStacks:
            definirStacks,

        resetarPassiva:
            resetarPassiva,

        resetarJogador:
            resetarJogador,

        stacksNoMaximo:
            stacksNoMaximo,


        /* Atalhos */

        ganharStack:
            ganharStack,

        perderStack:
            perderStack,

        possuiStack:
            possuiStack,

        stackMaximo:
            stackMaximo,


        /* Visual */

        atualizarVisual:
            atualizarVisual,

        limparVisual:
            limparVisual,

        limparVisuaisJogador:
            limparVisuaisJogador,

        reaplicarVisuais:
            reaplicarVisuais,

        reaplicarVisualJogador:
            reaplicarVisualJogador,


        /* Eventos */

        emitirPassivaAtivada:
            emitirPassivaAtivada,

        emitirPassivaDesativada:
            emitirPassivaDesativada,

        emitirGatilho:
            emitirGatilho,


        /* CTE */

        registrarCTESucesso:
            registrarCTESucesso

    };


    /* ======================================================
       INICIALIZAÇÃO
    ====================================================== */

    function inicializar() {

        if (!sistemaDisponivel()) {

            console.warn(
                "[Passivas] Dependências ainda não estão disponíveis."
            );

            return;

        }


        console.log(
            "[Passivas] Sistema principal carregado."
        );


        setTimeout(
            function () {

                reaplicarVisuais();

            },
            0
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar
        );

    } else {

        inicializar();

    }


})();
