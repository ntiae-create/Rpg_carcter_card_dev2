/* =========================================================
   MESA ONLINE — ABLY
   Camada multiplayer da Mesa
   NÃO altera mesa.js
========================================================= */

(function () {

    "use strict";

    console.log("[MESA ONLINE] Inicializando...");

    let ably = null;
    let canal = null;

    let estado = {
        conectado: false,
        campanhaId: null,
        usuarioId: null,
        personagemId: null,
        slot: null,
        nome: null,
        isMaster: false
    };

    /* =====================================================
       LOCALSTORAGE
    ===================================================== */

    function obterMesaAtiva() {

        try {

            const salvo = localStorage.getItem("rpg_mesa_ativa");

            if (!salvo) {
                console.warn("[MESA ONLINE] rpg_mesa_ativa não encontrado.");
                return null;
            }

            return JSON.parse(salvo);

        } catch (erro) {

            console.error(
                "[MESA ONLINE] Erro ao ler rpg_mesa_ativa:",
                erro
            );

            return null;
        }
    }


    /* =====================================================
       DESCOBRIR DADOS DA MESA
    ===================================================== */

    function obterDadosMesa() {

        const salvo = obterMesaAtiva();

        const auth = window.rpgAuth || {};
        const campanha = auth.campaign || {};

        const usuario =
            auth.user ||
            {};

        const jogador =
            auth.campaignCharacter ||
            auth.currentCharacter ||
            {};

        estado.campanhaId =
            salvo?.campaignId ||
            salvo?.campaign_id ||
            campanha?.id ||
            window.rpgCampaign?.activeCampaign?.id ||
            null;

        estado.usuarioId =
            salvo?.userId ||
            usuario?.id ||
            null;

        estado.personagemId =
            salvo?.characterId ||
            jogador?.id ||
            null;

        estado.slot =
            salvo?.slot ||
            auth.campaignSlot ||
            jogador?.slot ||
            null;

        estado.nome =
            jogador?.name ||
            jogador?.nome ||
            salvo?.characterName ||
            usuario?.email ||
            "Jogador";

        estado.isMaster =
            auth.isMaster === true ||
            salvo?.isMaster === true ||
            (
                campanha?.master_id &&
                usuario?.id &&
                campanha.master_id === usuario.id
            );

        console.log(
            "[MESA ONLINE] Dados encontrados:",
            estado
        );

        return estado;
    }


    /* =====================================================
       DIAGNÓSTICO
    ===================================================== */

    function diagnostico(texto) {

        console.log("[MESA ONLINE]", texto);

        const log =
            document.querySelector("#diagnostico-log");

        if (!log) return;

        const linha =
            document.createElement("div");

        linha.textContent =
            "[ONLINE] " + texto;

        log.appendChild(linha);

        log.scrollTop =
            log.scrollHeight;
    }


    function atualizarRealtime(status) {

        const elemento =
            document.querySelector(
                '[data-diagnostico="realtime"]'
            );

        if (!elemento) return;

        elemento.textContent =
            status;
    }


    /* =====================================================
       ABLY
    ===================================================== */

    async function conectarAbly() {

        obterDadosMesa();

        if (!estado.campanhaId) {

            diagnostico(
                "Não foi possível descobrir a campanha."
            );

            atualizarRealtime(
                "Sem campanha"
            );

            return;
        }

        if (!estado.usuarioId) {

            diagnostico(
                "Não foi possível descobrir o usuário."
            );

            atualizarRealtime(
                "Sem usuário"
            );

            return;
        }

        /*
         * IMPORTANTE:
         *
         * A chave secreta do Ably NÃO deve ficar aqui.
         *
         * Por enquanto deixamos a estrutura pronta.
         * A autenticação segura será ligada no próximo passo.
         */

        diagnostico(
            "Campanha encontrada: " +
            estado.campanhaId
        );

        diagnostico(
            "Usuário encontrado: " +
            estado.usuarioId
        );

        diagnostico(
            "Slot: " +
            (estado.slot ?? "nenhum")
        );

        diagnostico(
            "Preparando conexão multiplayer..."
        );

        /*
         * A conexão real será ativada assim que
         * configurarmos a autenticação segura do Ably.
         */

        atualizarRealtime(
            "Aguardando autenticação Ably"
        );
    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        console.log(
            "[MESA ONLINE] Camada multiplayer carregada."
        );

        conectarAbly();
    }


    /* =====================================================
       EVENTO PÚBLICO
       Outros arquivos poderão avisar quando a campanha
       estiver pronta.
    ===================================================== */

    window.addEventListener(
        "mesa:campanhaAlterada",
        function () {

            console.log(
                "[MESA ONLINE] Campanha alterada."
            );

            obterDadosMesa();
        }
    );


    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.mesaOnline = {

        estado: estado,

        conectar: conectarAbly,

        obterDados: obterDadosMesa,

        get canal() {
            return canal;
        },

        get ably() {
            return ably;
        }

    };


    /* =====================================================
       ESPERAR DOM
    ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );

    } else {

        iniciar();

    }

})();
