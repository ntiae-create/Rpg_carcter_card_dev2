/* =========================================================
   MESA ONLINE — ABLY
   Camada multiplayer da Mesa

   IMPORTANTE:
   - A chave secreta do Ably NÃO fica neste arquivo.
   - O token é obtido através da Edge Function do Supabase.
   - Não altera mesa.js.
========================================================= */

(function () {

    "use strict";

    console.log("[MESA ONLINE] Inicializando...");

    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

    const ABLY_TOKEN_URL =
        "https://bjkbfxcmyihdruqrwsdf.supabase.co/functions/v1/ably-token";


    /* =====================================================
       ESTADO
    ===================================================== */

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

        const salvo =
            obterMesaAtiva();

        const auth =
            window.rpgAuth || {};

        const campanha =
            auth.campaign || {};

        const usuario =
            auth.user || {};

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
            document.querySelector(
                "#diagnostico-log"
            );


        if (!log) return;


        const linha =
            document.createElement("div");


        linha.textContent =
            "[ONLINE] " + texto;


        log.appendChild(linha);


        log.scrollTop =
            log.scrollHeight;
    }


    function atualizarMultiplayer(status) {

        const elemento =
            document.querySelector(
                '[data-diagnostico="multiplayer"]'
            );


        if (elemento) {

            elemento.textContent =
                status;
        }
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
       EVENTOS PÚBLICOS
    ===================================================== */

    function emitirEvento(nome, detalhe) {

        try {

            window.dispatchEvent(
                new CustomEvent(
                    nome,
                    {
                        detail:
                            detalhe || {}
                    }
                )
            );

        } catch (erro) {

            console.warn(
                "[MESA ONLINE] Erro ao emitir evento:",
                erro
            );
        }
    }


    /* =====================================================
       OBTER TOKEN ABLY
    ===================================================== */

    async function obterTokenAbly() {

        if (!estado.campanhaId) {

            throw new Error(
                "Campanha não identificada."
            );
        }


        const supabase =
            window.supabaseClient ||
            window.supabase ||
            window.sb;


        let accessToken = null;


        /*
         * Tentamos primeiro o cliente Supabase
         * caso esteja disponível.
         */

        if (
            supabase &&
            supabase.auth &&
            typeof supabase.auth.getSession === "function"
        ) {

            const resultado =
                await supabase.auth.getSession();


            accessToken =
                resultado?.data?.session?.access_token ||
                null;
        }


        /*
         * Alguns projetos guardam o cliente
         * em outra variável. O rpgAuth também
         * pode possuir a sessão.
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


        diagnostico(
            "Solicitando token temporário ao Supabase..."
        );


        const resposta =
            await fetch(
                ABLY_TOKEN_URL,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " +
                            accessToken
                    },

                    body:
                        JSON.stringify({

                            campanhaId:
                                estado.campanhaId

                        })
                }
            );


        const texto =
            await resposta.text();


        let dados;


        try {

            dados =
                JSON.parse(texto);

        } catch {

            dados = {
                error: texto
            };
        }


        if (!resposta.ok) {

            console.error(
                "[MESA ONLINE] Erro ao obter token:",
                dados
            );

            throw new Error(
                dados?.error ||
                dados?.detalhes ||
                "Falha ao obter token Ably."
            );
        }


        if (!dados?.token) {

            throw new Error(
                "A função ably-token não retornou um token."
            );
        }


        diagnostico(
            "Token Ably recebido."
        );


        return dados.token;
    }


    /* =====================================================
       CONEXÃO ABLY
    ===================================================== */

    async function conectarAbly() {

        try {

            obterDadosMesa();


            if (!estado.campanhaId) {

                diagnostico(
                    "Não foi possível descobrir a campanha."
                );

                atualizarRealtime(
                    "Sem campanha"
                );

                atualizarMultiplayer(
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

                atualizarMultiplayer(
                    "Sem usuário"
                );

                return;
            }


            if (!window.Ably) {

                diagnostico(
                    "Biblioteca Ably não carregada."
                );

                atualizarRealtime(
                    "Ably ausente"
                );

                atualizarMultiplayer(
                    "Ably ausente"
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
                (
                    estado.slot ??
                    "nenhum"
                )
            );


            if (
                ably &&
                canal &&
                estado.conectado
            ) {

                diagnostico(
                    "Ably já está conectado."
                );

                return;
            }


            atualizarRealtime(
                "Conectando Ably..."
            );

            atualizarMultiplayer(
                "Conectando..."
            );


            const token =
                await obterTokenAbly();


            diagnostico(
                "Criando conexão Ably..."
            );


            ably =
                new window.Ably.Realtime({
                    token
                });


            ably.connection.on(
                function (change) {

                    console.log(
                        "[MESA ONLINE] Ably:",
                        change.current
                    );


                    diagnostico(
                        "Ably: " +
                        change.current
                    );


                    if (
                        change.current ===
                        "connected"
                    ) {

                        estado.conectado =
                            true;


                        atualizarRealtime(
                            "Conectado"
                        );


                        atualizarMultiplayer(
                            "Conectado"
                        );


                        emitirEvento(
                            "mesa:multiplayerConectado",
                            {
                                campanhaId:
                                    estado.campanhaId
                            }
                        );


                        entrarNoCanal();

                    }


                    else if (
                        change.current ===
                        "disconnected"
                    ) {

                        estado.conectado =
                            false;


                        atualizarRealtime(
                            "Desconectado"
                        );


                        atualizarMultiplayer(
                            "Desconectado"
                        );


                        emitirEvento(
                            "mesa:multiplayerDesconectado"
                        );

                    }


                    else if (
                        change.current ===
                        "failed"
                    ) {

                        estado.conectado =
                            false;


                        atualizarRealtime(
                            "Falha"
                        );


                        atualizarMultiplayer(
                            "Falha"
                        );


                        emitirEvento(
                            "mesa:multiplayerErro",
                            {
                                erro:
                                    "Conexão Ably falhou."
                            }
                        );

                    }

                }
            );


        } catch (erro) {

            console.error(
                "[MESA ONLINE] Erro:",
                erro
            );


            estado.conectado =
                false;


            atualizarRealtime(
                "Erro"
            );


            atualizarMultiplayer(
                "Erro"
            );


            diagnostico(
                "ERRO: " +
                (
                    erro?.message ||
                    erro
                )
            );


            emitirEvento(
                "mesa:multiplayerErro",
                {
                    erro:
                        erro?.message ||
                        String(erro)
                }
            );
        }
    }


    /* =====================================================
       ENTRAR NO CANAL
    ===================================================== */

    function entrarNoCanal() {

        if (!ably) {

            diagnostico(
                "Ably ainda não está disponível."
            );

            return;
        }


        if (!estado.campanhaId) {

            diagnostico(
                "Campanha não encontrada."
            );

            return;
        }


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


        canal.presence.enter(
            {
                usuarioId:
                    estado.usuarioId,

                personagemId:
                    estado.personagemId,

                slot:
                    estado.slot,

                nome:
                    estado.nome,

                isMaster:
                    estado.isMaster
            },

            function (erro) {

                if (erro) {

                    console.error(
                        "[MESA ONLINE] Erro no Presence:",
                        erro
                    );


                    diagnostico(
                        "Erro no Presence: " +
                        erro.message
                    );

                    return;
                }


                diagnostico(
                    "Presence Ably ativo."
                );


                atualizarJogadoresOnline();


                canal.presence.subscribe(
                    function () {

                        atualizarJogadoresOnline();

                    }
                );

            }
        );


        canal.subscribe(
            function (mensagem) {

                console.log(
                    "[MESA ONLINE] Mensagem recebida:",
                    mensagem
                );

            }
        );


        emitirEvento(
            "mesa:multiplayerCanal",
            {
                canal:
                    nomeCanal
            }
        );
    }


    /* =====================================================
       JOGADORES ONLINE
    ===================================================== */

    async function atualizarJogadoresOnline() {

        if (!canal) return;


        try {

            const membros =
                await canal.presence.get();


            diagnostico(
                "Jogadores online: " +
                membros.length
            );


            emitirEvento(
                "mesa:multiplayerJogadoresAtualizados",
                {
                    jogadores:
                        membros
                }
            );


        } catch (erro) {

            console.warn(
                "[MESA ONLINE] Erro ao obter jogadores:",
                erro
            );
        }
    }


    /* =====================================================
       EVENTO DA CAMPANHA
    ===================================================== */

    window.addEventListener(
        "mesa:campanhaAlterada",
        function () {

            console.log(
                "[MESA ONLINE] Campanha alterada."
            );


            if (canal) {

                try {

                    canal.presence.leave();

                } catch {}

            }


            ably = null;
            canal = null;


            estado.conectado =
                false;


            obterDadosMesa();


            conectarAbly();

        }
    );


    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.mesaOnline = {

        estado:

            estado,

        conectar:

            conectarAbly,

        obterDados:

            obterDadosMesa,

        atualizarJogadores:

            atualizarJogadoresOnline,

        get canal() {

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
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );

    } else {

        iniciar();

    }

})();
