/* ==========================================
   RPG — SISTEMA DE STACKS DAS PASSIVAS
========================================== */

"use strict";

(function () {

    /*
     * Este arquivo controla APENAS o estado
     * das passivas que utilizam Stacks.
     *
     * Ele NÃO decide as regras de ativação.
     * Os outros sistemas podem adicionar,
     * remover ou definir Stacks através desta API.
     */


    const estadoStacks = {};


    /* ======================================================
       UTILITÁRIOS
    ====================================================== */

    function obterDefinicao(passivaId) {

        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.obter !== "function"
        ) {
            return null;
        }

        return window.PassivasDados.obter(passivaId);

    }


    function normalizarIdJogador(jogadorId) {

        if (
            jogadorId === null ||
            jogadorId === undefined
        ) {
            return null;
        }

        return String(jogadorId);

    }


    function limitarValor(valor, minimo, maximo) {

        let resultado = Number(valor);

        if (!Number.isFinite(resultado)) {
            resultado = minimo;
        }

        resultado = Math.max(
            minimo,
            resultado
        );

        /*
         * Algumas passivas não possuem limite
         * definido. Nesse caso, maximo pode ser null.
         */

        if (
            maximo !== null &&
            maximo !== undefined
        ) {

            resultado = Math.min(
                maximo,
                resultado
            );

        }

        return resultado;

    }


    function passivaUtilizaStacks(passiva) {

        if (!passiva) {
            return false;
        }

        return (
            passiva.tipo === "stack" ||
            passiva.tipo === "stack_alvo"
        );

    }


    /* ======================================================
       GARANTIR ESTADO
    ====================================================== */

    function garantirEstado(
        jogadorId,
        passivaId
    ) {

        jogadorId = normalizarIdJogador(jogadorId);

        if (!jogadorId || !passivaId) {
            return null;
        }

        const passiva = obterDefinicao(passivaId);

        if (!passiva) {
            console.warn(
                "[PassivasStacks] Passiva não encontrada:",
                passivaId
            );

            return null;
        }

        if (!passivaUtilizaStacks(passiva)) {

            console.warn(
                "[PassivasStacks] A passiva não utiliza Stacks:",
                passivaId
            );

            return null;

        }

        if (!estadoStacks[jogadorId]) {
            estadoStacks[jogadorId] = {};
        }

        if (!estadoStacks[jogadorId][passivaId]) {

            const configuracao =
                passiva.stacks || {};

            const minimo =
                Number.isFinite(configuracao.minimo)
                    ? configuracao.minimo
                    : 0;

            const maximo =
                configuracao.maximo === null ||
                configuracao.maximo === undefined
                    ? null
                    : configuracao.maximo;

            const inicial =
                configuracao.inicial !== undefined
                    ? configuracao.inicial
                    : minimo;

            estadoStacks[jogadorId][passivaId] = {

                jogadorId: jogadorId,

                passivaId: passivaId,

                valor: limitarValor(
                    inicial,
                    minimo,
                    maximo
                ),

                minimo: minimo,

                maximo: maximo

            };

        }

        return estadoStacks[jogadorId][passivaId];

    }


    /* ======================================================
       OBTER STACKS
    ====================================================== */

    function obter(
        jogadorId,
        passivaId
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );

        if (!estado) {
            return null;
        }

        return {

            jogadorId: estado.jogadorId,

            passivaId: estado.passivaId,

            valor: estado.valor,

            minimo: estado.minimo,

            maximo: estado.maximo,

            percentual:
                calcularPercentual(estado)

        };

    }


    /* ======================================================
       CALCULAR PORCENTAGEM
    ====================================================== */

    function calcularPercentual(estado) {

        if (!estado) {
            return 0;
        }

        /*
         * Passivas sem máximo definido não podem
         * ter uma porcentagem de preenchimento confiável.
         */

        if (
            estado.maximo === null ||
            estado.maximo === undefined
        ) {

            return 0;

        }

        const intervalo =
            estado.maximo - estado.minimo;

        if (intervalo <= 0) {
            return 100;
        }

        return (
            (
                estado.valor - estado.minimo
            ) / intervalo
        ) * 100;

    }


    /* ======================================================
       DEFINIR STACKS
    ====================================================== */

    function definir(
        jogadorId,
        passivaId,
        valor
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );

        if (!estado) {
            return null;
        }

        const anterior =
            estado.valor;

        estado.valor =
            limitarValor(
                valor,
                estado.minimo,
                estado.maximo
            );

        emitirAlteracao(
            estado,
            anterior
        );

        return obter(
            jogadorId,
            passivaId
        );

    }


    /* ======================================================
       ADICIONAR STACK
    ====================================================== */

    function adicionar(
        jogadorId,
        passivaId,
        quantidade = 1
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );

        if (!estado) {
            return null;
        }

        const anterior =
            estado.valor;

        const valorAdicionar =
            Number(quantidade);

        if (!Number.isFinite(valorAdicionar)) {
            return obter(
                jogadorId,
                passivaId
            );
        }

        estado.valor =
            limitarValor(
                estado.valor + valorAdicionar,
                estado.minimo,
                estado.maximo
            );

        emitirAlteracao(
            estado,
            anterior
        );

        return obter(
            jogadorId,
            passivaId
        );

    }


    /* ======================================================
       REMOVER STACK
    ====================================================== */

    function remover(
        jogadorId,
        passivaId,
        quantidade = 1
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );

        if (!estado) {
            return null;
        }

        const anterior =
            estado.valor;

        const valorRemover =
            Number(quantidade);

        if (!Number.isFinite(valorRemover)) {
            return obter(
                jogadorId,
                passivaId
            );
        }

        estado.valor =
            limitarValor(
                estado.valor - valorRemover,
                estado.minimo,
                estado.maximo
            );

        emitirAlteracao(
            estado,
            anterior
        );

        return obter(
            jogadorId,
            passivaId
        );

    }


    /* ======================================================
       RESETAR PASSIVA
    ====================================================== */

    function resetar(
        jogadorId,
        passivaId
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );

        if (!estado) {
            return null;
        }

        const anterior =
            estado.valor;

        estado.valor =
            estado.minimo;

        emitirAlteracao(
            estado,
            anterior
        );

        return obter(
            jogadorId,
            passivaId
        );

    }


    /* ======================================================
       RESETAR TODAS AS PASSIVAS DO JOGADOR
    ====================================================== */

    function resetarJogador(jogadorId) {

        jogadorId =
            normalizarIdJogador(jogadorId);

        if (!jogadorId) {
            return;
        }

        if (!estadoStacks[jogadorId]) {
            return;
        }

        Object.keys(
            estadoStacks[jogadorId]
        ).forEach(function (passivaId) {

            resetar(
                jogadorId,
                passivaId
            );

        });

    }


    /* ======================================================
       OBTER TODAS AS STACKS DO JOGADOR
    ====================================================== */

    function obterTodas(jogadorId) {

        jogadorId =
            normalizarIdJogador(jogadorId);

        if (!jogadorId) {
            return {};
        }

        /*
         * Primeiro garantimos que todas as passivas
         * de Stack conhecidas tenham estado inicial.
         */

        if (
            window.PassivasDados &&
            typeof window.PassivasDados.listar === "function"
        ) {

            window.PassivasDados
                .listar()
                .forEach(function (passiva) {

                    if (
                        passivaUtilizaStacks(passiva)
                    ) {

                        garantirEstado(
                            jogadorId,
                            passiva.id
                        );

                    }

                });

        }

        const resultado = {};

        Object.keys(
            estadoStacks[jogadorId] || {}
        ).forEach(function (passivaId) {

            resultado[passivaId] =
                obter(
                    jogadorId,
                    passivaId
                );

        });

        return resultado;

    }


    /* ======================================================
       VERIFICAR SE ESTÁ NO MÁXIMO
    ====================================================== */

    function estaNoMaximo(
        jogadorId,
        passivaId
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );

        if (!estado) {
            return false;
        }

        if (
            estado.maximo === null ||
            estado.maximo === undefined
        ) {

            return false;

        }

        return (
            estado.valor >=
            estado.maximo
        );

    }


    /* ======================================================
       EMITIR EVENTO
    ====================================================== */

    function emitirAlteracao(
        estado,
        anterior
    ) {

        if (
            anterior ===
            estado.valor
        ) {
            return;
        }

        const percentual =
            calcularPercentual(estado);

        window.dispatchEvent(
            new CustomEvent(
                "passiva:stacksAlterada",
                {
                    detail: {

                        jogadorId:
                            estado.jogadorId,

                        passivaId:
                            estado.passivaId,

                        anterior:
                            anterior,

                        atual:
                            estado.valor,

                        minimo:
                            estado.minimo,

                        maximo:
                            estado.maximo,

                        percentual:
                            percentual,

                        atingiuMaximo:
                            estado.maximo !== null &&
                            estado.maximo !== undefined &&
                            estado.valor >= estado.maximo

                    }
                }
            )
        );

    }


    /* ======================================================
       API PÚBLICA
    ====================================================== */

    window.PassivasStacks = {

        obter: obter,

        obterTodas: obterTodas,

        definir: definir,

        adicionar: adicionar,

        remover: remover,

        resetar: resetar,

        resetarJogador: resetarJogador,

        estaNoMaximo: estaNoMaximo

    };


    console.log(
        "[Passivas] Sistema de Stacks carregado."
    );

})();
