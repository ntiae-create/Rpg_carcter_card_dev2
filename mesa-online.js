/* =========================================================
   MESA ONLINE — ABLY
   PRIMEIRO TESTE DE MULTIPLAYER

   NÃO ALTERA mesa.js
   NÃO ALTERA OS CLIQUES EXISTENTES
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

    const ABLY_API_KEY = "COLE_SUA_CHAVE_AQUI";


    /* =====================================================
       ESTADO
    ===================================================== */

    let ably = null;
    let channel = null;

    let roomId = null;
    let clientId = null;


    /* =====================================================
       LOG
    ===================================================== */

    function log(...args) {

        console.log(
            "[MESA ONLINE]",
            ...args
        );

    }


    /* =====================================================
       PEGAR DADOS DA CAMPANHA
    ===================================================== */

    function obterCampanha() {

        try {

            const dados =
                JSON.parse(
                    localStorage.getItem("rpg_mesa_ativa")
                );

            if (!dados) {
                return null;
            }

            return dados;

        } catch (erro) {

            console.error(
                "[MESA ONLINE] Erro ao ler campanha:",
                erro
            );

            return null;
        }
    }


    /* =====================================================
       CRIAR ID DO CLIENTE
    ===================================================== */

    function obterClientId(campanha) {

        /*
         * Primeiro tentamos usar o personagem.
         */

        if (campanha?.characterId) {

            return `character-${campanha.characterId}`;

        }


        /*
         * Depois tentamos o usuário.
         */

        if (campanha?.userId) {

            return `user-${campanha.userId}`;

        }


        /*
         * Último recurso:
         * identificador persistente do navegador.
         */

        let id =
            localStorage.getItem(
                "rpg_mesa_client_id"
            );

        if (!id) {

            id =
                "browser-" +
                crypto.randomUUID();

            localStorage.setItem(
                "rpg_mesa_client_id",
                id
            );

        }

        return id;
    }


    /* =====================================================
       PEGAR ROOM DA CAMPANHA
    ===================================================== */

    function obterRoom(campanha) {

        if (!campanha?.campaignId) {

            throw new Error(
                "campaignId não encontrado."
            );

        }

        return `rpg-mesa-${campanha.campaignId}`;
    }


    /* =====================================================
       INICIAR
    ===================================================== */

    async function iniciarMesaOnline() {

        log("Iniciando multiplayer...");


        const campanha =
            obterCampanha();


        if (!campanha) {

            console.warn(
                "[MESA ONLINE] Nenhuma campanha encontrada."
            );

            return;
        }


        roomId =
            obterRoom(campanha);


        clientId =
            obterClientId(campanha);


        log("Room:", roomId);
        log("Client ID:", clientId);


        /*
         * Cria conexão com Ably.
         */

        ably =
            new Ably.Realtime({

                key: ABLY_API_KEY,

                clientId: clientId

            });


        /*
         * Monitora conexão.
         */

        ably.connection.on(
            (stateChange) => {

                log(
                    "Conexão:",
                    stateChange.current
                );

                atualizarDiagnostico(
                    stateChange.current
                );

            }
        );


        /*
         * Aguarda conexão.
         */

        await ably.connection.once(
            "connected"
        );


        log("ABLY CONECTADO");


        /*
         * Obtém o canal da campanha.
         */

        channel =
            ably.channels.get(roomId);


        /*
         * Eventos de presença.
         */

        await channel.presence.subscribe(
            "enter",
            membro => {

                log(
                    "ENTROU:",
                    membro.clientId
                );

                atualizarJogadoresOnline();

            }
        );


        await channel.presence.subscribe(
            "leave",
            membro => {

                log(
                    "SAIU:",
                    membro.clientId
                );

                atualizarJogadoresOnline();

            }
        );


        /*
         * Entra na presença da Mesa.
         */

        await channel.presence.enter({

            campaignId:
                campanha.campaignId,

            characterId:
                campanha.characterId ?? null,

            slot:
                campanha.slot ?? null,

            master:
                campanha.masterId ===
                campanha.userId

        });


        log(
            "ENTROU NA MESA ONLINE"
        );


        /*
         * Atualiza lista inicial.
         */

        await atualizarJogadoresOnline();

    }


    /* =====================================================
       LISTAR JOGADORES ONLINE
    ===================================================== */

    async function atualizarJogadoresOnline() {

        if (!channel) {
            return;
        }


        try {

            const membros =
                await channel.presence.get();


            log(
                "Jogadores online:",
                membros
            );


            /*
             * Guarda globalmente para outros módulos.
             */

            window.rpgMesaOnlinePlayers =
                membros;


            /*
             * Atualiza visual.
             */

            marcarJogadoresOnline(
                membros
            );


            /*
             * Diagnóstico.
             */

            const elemento =
                document.querySelector(
                    '[data-diagnostico="realtime"]'
                );

            if (elemento) {

                elemento.textContent =
                    `🟢 ${membros.length} online`;

            }

        } catch (erro) {

            console.error(
                "[MESA ONLINE] Erro ao obter presença:",
                erro
            );

        }

    }


    /* =====================================================
       MARCAR CARDS ONLINE
    ===================================================== */

    function marcarJogadoresOnline(
        membros
    ) {

        /*
         * Primeiro limpamos apenas a nossa
         * marcação visual.
         *
         * Não removemos classes usadas pelo mesa.js.
         */

        document
            .querySelectorAll(
                ".player-card"
            )
            .forEach(card => {

                card.removeAttribute(
                    "data-online"
                );

            });


        /*
         * Para o primeiro teste:
         * tentamos associar o slot enviado
         * pela presença.
         */

        membros.forEach(
            membro => {

                const dados =
                    membro.data || {};


                if (
                    dados.slot === null ||
                    dados.slot === undefined
                ) {
                    return;
                }


                const card =
                    document.querySelector(
                        `.player-card[data-seat="${dados.slot}"]`
                    );


                if (!card) {
                    return;
                }


                card.setAttribute(
                    "data-online",
                    "true"
                );

            }
        );

    }


    /* =====================================================
       DIAGNÓSTICO
    ===================================================== */

    function atualizarDiagnostico(
        estado
    ) {

        const elemento =
            document.querySelector(
                '[data-diagnostico="realtime"]'
            );

        if (!elemento) {
            return;
        }


        const estadosOnline = [
            "connected",
            "attaching",
            "attached"
        ];


        if (
            estadosOnline.includes(
                estado
            )
        ) {

            elemento.textContent =
                "🟢 Conectado";

        } else {

            elemento.textContent =
                `🔴 ${estado}`;

        }

    }


    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.rpgMesaOnline = {

        getChannel() {

            return channel;

        },

        getPlayers() {

            return (
                window.rpgMesaOnlinePlayers ||
                []
            );

        },

        getRoomId() {

            return roomId;

        },

        getClientId() {

            return clientId;

        },

        async refresh() {

            await atualizarJogadoresOnline();

        }

    };


    /* =====================================================
       INICIAR QUANDO A PÁGINA ESTIVER PRONTA
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarMesaOnline
        );

    } else {

        iniciarMesaOnline();

    }


})();
