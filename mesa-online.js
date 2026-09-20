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
       CONFIGURAÇÃO
    ===================================================== */

    const ABLY_TOKEN_URL =
        "https://bjkbfxcmyihdruqrwsdf.supabase.co/functions/v1/ably-token";


    /* =====================================================
       LOCALSTORAGE
    ===================================================== */

    function obterMesaAtiva() {

        try {

            const salvo =
                localStorage.getItem("rpg_mesa_ativa");

            if (!salvo) {

                console.warn(
                    "[MESA ONLINE] rpg_mesa_ativa não encontrado."
                );

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

        console.log(
            "[MESA ONLINE]",
            texto
        );

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
       OBTER TOKEN ABLY
    ===================================================== */

     function obterTokenAbly() {

        diagnostico(
            "Solicitando token seguro do Ably..."
        );

        /*
         * IMPORTANTE:
         *
         * Nunca colocamos a chave secreta do Ably
         * neste arquivo.
         */

        let accessToken = null;

        /*
         * Tentativa 1:
         * cliente Supabase disponível globalmente.
         */

        const clientesSupabase = [

            window.supabaseClient,

            window.sb,

            window.supabaseMesa?.client,

            window.SupabaseMesa?.client

        ];

        for (
            const cliente of clientesSupabase
        ) {

            if (
                cliente &&
                typeof cliente.auth?.getSession === "function"
            ) {

                try {

                    const resultado =
                        await cliente.auth.getSession();

                    accessToken =
                        resultado?.data?.session?.access_token ||
                        null;

                    if (accessToken) {
                        break;
                    }

                } catch (erro) {

                    console.warn(
                        "[MESA ONLINE] Falha ao obter sessão:",
                        erro
                    );
                }
            }
        }


        /*
         * Tentativa 2:
         * sessão já guardada no rpgAuth.
         */

        if (!accessToken) {

            accessToken =
                window.rpgAuth?.session?.access_token ||
                null;
        }


        if (!accessToken) {

            throw new Error(
                "Sessão Supabase não encontrada."
            );
        }


        const resposta =
            await fetch(
                ABLY_TOKEN_URL,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            "Bearer " + accessToken,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        campanhaId:
                            estado.campanhaId
                    })
async function obterTokenAbly() {

    diagnostico(
        "Solicitando autenticação segura do Ably..."
    );

    /*
     * IMPORTANTE:
     *
     * A chave secreta do Ably NUNCA fica
     * neste arquivo.
     *
     * A Edge Function do Supabase devolve
     * um TokenRequest para o SDK do Ably.
     */

    let accessToken = null;


    /* =================================================
       TENTATIVA 1 — CLIENTE SUPABASE GLOBAL
    ================================================= */

    const clientesSupabase = [

        window.supabaseClient,

        window.sb,

        window.supabaseMesa?.client,

        window.SupabaseMesa?.client

    ];


    for (
        const cliente of clientesSupabase
    ) {

        if (
            cliente &&
            typeof cliente.auth?.getSession ===
            "function"
        ) {

            try {

                const resultado =
                    await cliente.auth.getSession();

                accessToken =
                    resultado?.data?.session?.access_token ||
                    null;

                if (accessToken) {

                    break;

                }

            } catch (erro) {

                console.warn(
                    "[MESA ONLINE] Falha ao obter sessão Supabase:",
                    erro
                );

            }

        }

    }


    /* =================================================
       TENTATIVA 2 — RPG AUTH
    ================================================= */

    if (!accessToken) {

        accessToken =
            window.rpgAuth?.session?.access_token ||
            null;

    }


    if (!accessToken) {

        throw new Error(
            "Sessão Supabase não encontrada."
        );

    }


    /* =================================================
       SOLICITAR TOKEN AO SUPABASE
    ================================================= */

    const resposta =
        await fetch(
            ABLY_TOKEN_URL,
            {

                method: "POST",

                headers: {

                    "Authorization":
                        "Bearer " +
                        accessToken,

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    campanhaId:
                        estado.campanhaId

                })

            }
        );


    const texto =
        await resposta.text();


    let dados = null;


    try {

        dados =
            JSON.parse(texto);

    } catch {

        dados = null;

    }


    if (!resposta.ok) {

        throw new Error(

            dados?.error ||
            dados?.detalhes ||
            "Erro ao obter autenticação Ably."

        );

    }


    if (!dados) {

        throw new Error(
            "Resposta inválida da autenticação Ably."
        );

    }


    diagnostico(
        "TokenRequest Ably recebido."
    );


    return dados;

}


    /* =====================================================
       ATUALIZAR PRESENÇA
    ===================================================== */

    async function atualizarPresenca() {

        if (!canal) return;

        try {

            await canal.presence.enter({
                usuarioId:
                    estado.usuarioId,

                personagemId:
                    estado.personagemId,

                nome:
                    estado.nome,

                slot:
                    estado.slot,

                isMaster:
                    estado.isMaster
            });

            diagnostico(
                "Presença registrada na Mesa."
            );

        } catch (erro) {

            console.error(
                "[MESA ONLINE] Erro na presença:",
                erro
            );

            diagnostico(
                "Erro ao registrar presença."
            );
        }
    }


    /* =====================================================
       ATUALIZAR JOGADORES ONLINE
    ===================================================== */

    async function atualizarJogadoresOnline() {

        if (!canal) return;

        try {

            const membros =
                await canal.presence.get();

            const jogadores =
                membros.items || [];

            diagnostico(
                "Jogadores online: " +
                jogadores.length
            );

            window.dispatchEvent(
                new CustomEvent(
                    "mesa:multiplayerJogadoresAtualizados",
                    {
                        detail: {
                            jogadores:
                                jogadores
                        }
                    }
                )
            );

        } catch (erro) {

            console.error(
                "[MESA ONLINE] Erro ao atualizar jogadores:",
                erro
            );
        }
    }


    /* =====================================================
       CONEXÃO ABLY
    ===================================================== */

    async function conectarAbly() {

        obterDadosMesa();


        /* ---------------------------------------------
           VERIFICAÇÃO DA CAMPANHA
        --------------------------------------------- */

        if (!estado.campanhaId) {

    diagnostico(
        "Campanha ainda não disponível. Aguardando o sistema de entrada..."
    );

    atualizarRealtime(
        "Aguardando campanha"
    );

    return;

}
        /* ---------------------------------------------
           VERIFICAÇÃO DO USUÁRIO
        --------------------------------------------- */

        if (!estado.usuarioId) {

            diagnostico(
                "Não foi possível descobrir o usuário."
            );

            atualizarRealtime(
                "Sem usuário"
            );

            return;
        }


        /* ---------------------------------------------
           ABLY DISPONÍVEL?
        --------------------------------------------- */

        if (!window.Ably) {

            diagnostico(
                "Biblioteca Ably não encontrada."
            );

            atualizarRealtime(
                "Ably indisponível"
            );

            return;
        }


        /* ---------------------------------------------
           EVITAR DUPLICAÇÃO
        --------------------------------------------- */

        if (
            ably &&
            estado.conectado
        ) {

            diagnostico(
                "Multiplayer já está conectado."
            );

            return;
        }


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
            "Preparando autenticação Ably..."
        );

        atualizarRealtime(
            "Autenticando Ably..."
        );


        try {

            /* -----------------------------------------
               TOKEN
            ----------------------------------------- */

            const token =
                await obterTokenAbly();


            diagnostico(
    "Criando conexão Ably..."
);


/*
 * O Supabase Edge Function devolve um
 * TokenRequest.
 *
 * O SDK do Ably recebe esse TokenRequest
 * através do authCallback.
 */

ably =
    new window.Ably.Realtime({

        authCallback: async function (
            params,
            callback
        ) {

            try {

                const tokenRequest =
                    await obterTokenAbly();

                callback(
                    null,
                    tokenRequest
                );

            } catch (erro) {

                callback(
                    erro,
                    null
                );

            }

        }

    });


            /* -----------------------------------------
               EVENTOS DA CONEXÃO
            ----------------------------------------- */

            ably.connection.on(
                function (evento) {

                    console.log(
                        "[MESA ONLINE] Ably:",
                        evento
                    );


                    if (
                        evento.current === "connected"
                    ) {

                        estado.conectado =
                            true;

                        atualizarRealtime(
                            "Conectado"
                        );

                        diagnostico(
                            "Multiplayer conectado!"
                        );


                        window.dispatchEvent(
                            new CustomEvent(
                                "mesa:multiplayerConectado",
                                {
                                    detail: {
                                        estado:
                                            estado
                                    }
                                }
                            )
                        );

                    }


                    if (
                        evento.current === "disconnected" ||
                        evento.current === "suspended"
                    ) {

                        estado.conectado =
                            false;

                        atualizarRealtime(
                            evento.current
                        );

                        diagnostico(
                            "Multiplayer desconectado: " +
                            evento.current
                        );


                        window.dispatchEvent(
                            new CustomEvent(
                                "mesa:multiplayerDesconectado",
                                {
                                    detail: {
                                        estado:
                                            estado
                                    }
                                }
                            )
                        );

                    }


                    if (
                        evento.current === "failed"
                    ) {

                        estado.conectado =
                            false;

                        atualizarRealtime(
                            "Falha"
                        );

                        diagnostico(
                            "Falha na conexão Ably."
                        );


                        window.dispatchEvent(
                            new CustomEvent(
                                "mesa:multiplayerErro",
                                {
                                    detail: {
                                        erro:
                                            evento.reason ||
                                            evento
                                    }
                                }
                            )
                        );
                    }

                }
            );


            /* -----------------------------------------
               CANAL DA CAMPANHA
            ----------------------------------------- */

            const nomeCanal =
                "rpg:mesa:" +
                estado.campanhaId;


            diagnostico(
                "Entrando no canal: " +
                nomeCanal
            );


            canal =
                ably.channels.get(
                    nomeCanal
                );


            /* -----------------------------------------
               PRESENÇA
            ----------------------------------------- */

            canal.presence.subscribe(
                "enter",
                function () {

                    atualizarJogadoresOnline();

                }
            );


            canal.presence.subscribe(
                "leave",
                function () {

                    atualizarJogadoresOnline();

                }
            );


            canal.presence.subscribe(
                "update",
                function () {

                    atualizarJogadoresOnline();

                }
            );


            /* -----------------------------------------
               ENTRAR NA PRESENÇA
            ----------------------------------------- */

            await atualizarPresenca();


            /* -----------------------------------------
               LISTAR JOGADORES
            ----------------------------------------- */

            await atualizarJogadoresOnline();


            diagnostico(
                "Canal multiplayer preparado."
            );


        } catch (erro) {

            console.error(
                "[MESA ONLINE] Erro ao conectar:",
                erro
            );

            estado.conectado =
                false;

            atualizarRealtime(
                "Erro"
            );

            diagnostico(
                "Erro multiplayer: " +
                (
                    erro?.message ||
                    String(erro)
                )
            );


            window.dispatchEvent(
                new CustomEvent(
                    "mesa:multiplayerErro",
                    {
                        detail: {
                            erro:
                                erro
                        }
                    }
                )
            );

        }

    }


    /* =====================================================
       DESCONECTAR
    ===================================================== */

    async function desconectarAbly() {

        try {

            if (canal) {

                try {

                    await canal.presence.leave();

                } catch {}

            }


            if (ably) {

                ably.close();

            }

        } catch (erro) {

            console.warn(
                "[MESA ONLINE] Erro ao desconectar:",
                erro
            );

        } finally {

            ably = null;
            canal = null;

            estado.conectado =
                false;

            atualizarRealtime(
                "Desconectado"
            );

        }
    }


    /* =====================================================
       EVENTO DE CAMPANHA ALTERADA
    ===================================================== */

    window.addEventListener(
        "mesa:campanhaAlterada",
        async function () {

            console.log(
                "[MESA ONLINE] Campanha alterada."
            );

            obterDadosMesa();


            /*
             * Se a campanha mudou, a conexão anterior
             * precisa ser encerrada antes de entrar no
             * novo canal.
             */

            await desconectarAbly();

            await conectarAbly();

        }
    );

window.addEventListener(
    "rpg:campanhaAtualizada",
    async function () {

        console.log(
            "[MESA ONLINE] Campanha atualizada pelo sistema."
        );

        obterDadosMesa();


        if (
            !estado.campanhaId
        ) {

            diagnostico(
                "Campanha ainda não disponível. Aguardando..."
            );

            return;

        }


        if (
            !estado.conectado
        ) {

            await conectarAbly();

        }

    }
);
    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.mesaOnline = {

        estado: estado,

        conectar:
            conectarAbly,

        desconectar:
            desconectarAbly,

        obterDados:
            obterDadosMesa,

        atualizarJogadores:
            atualizarJogadoresOnline,

        get canal() {
            return canal;
        },

        /*
         * Alias para facilitar o diagnóstico.
         */

        get channel() {
            return canal;
        },

        get ably() {
            return ably;
        }

    };


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        console.log(
            "[MESA ONLINE] Camada multiplayer carregada."
        );

        conectarAbly();

    }


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
