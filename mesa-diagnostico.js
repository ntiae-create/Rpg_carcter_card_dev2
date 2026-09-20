/* =========================================================
   MESA ONLINE — DIAGNÓSTICO
   RPG MASTER CAOS

   Responsabilidades:
   - Diagnóstico do ambiente
   - Diagnóstico Supabase
   - Diagnóstico campanha
   - Diagnóstico usuário
   - Diagnóstico personagens
   - Diagnóstico slots
   - Diagnóstico Supabase Realtime
   - Diagnóstico Multiplayer Ably
   - Logs da Mesa
   - Sincronização manual
   - Monitoramento de eventos
========================================================= */

(function () {

    "use strict";

    /* =====================================================
       ESTADO
    ===================================================== */

    const Diagnostico = {

        aberto: false,

        logs: [],

        maxLogs: 150,

        ultimoRealtime: null,

        ultimoMultiplayer: null,

        ultimaQuantidadePersonagens: null,

        jogadoresOnline: 0,

        inicializado: false,

        testes: {},

        ultimoDiagnostico: null,

        intervalo: null

    };


    /* =====================================================
       UTILITÁRIOS
    ===================================================== */

    function obterEstadoMesa() {

        try {

            if (
                window.MesaRPG &&
                typeof window.MesaRPG === "object"
            ) {
                return window.MesaRPG;
            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter MesaRPG:",
                erro
            );

        }

        return null;
    }


    function obterSupabase() {

    try {

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ) {
            return window.supabaseClient;
        }

    } catch (erro) {

        console.warn(
            "[MESA DIAGNÓSTICO] Erro ao obter cliente Supabase:",
            erro
        );

    }

    return null;
}


    function obterSupabaseMesa() {

        try {

            if (
                window.supabaseMesa &&
                typeof window.supabaseMesa === "object"
            ) {
                return window.supabaseMesa;
            }

            if (
                window.SupabaseMesa &&
                typeof window.SupabaseMesa === "object"
            ) {
                return window.SupabaseMesa;
            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter Supabase Mesa:",
                erro
            );

        }

        return null;
    }


    function obterAuth() {

        try {

            if (
                window.rpgAuth &&
                typeof window.rpgAuth === "object"
            ) {
                return window.rpgAuth;
            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter rpgAuth:",
                erro
            );

        }

        return null;
    }


    function obterPersonagens() {

        try {

            if (
                window.MesaRPG &&
                Array.isArray(window.MesaRPG.personagens)
            ) {
                return window.MesaRPG.personagens;
            }

            if (
                window.rpgAuth &&
                Array.isArray(window.rpgAuth.personagens)
            ) {
                return window.rpgAuth.personagens;
            }

            if (
                window.personagensMesa &&
                Array.isArray(window.personagensMesa)
            ) {
                return window.personagensMesa;
            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter personagens:",
                erro
            );

        }

        return [];
    }


    function obterCampanha() {

        try {

            const auth = obterAuth();

            if (
                auth &&
                auth.campaign
            ) {
                return auth.campaign;
            }

            if (
                window.rpgCampaign &&
                typeof window.rpgCampaign === "object"
            ) {
                return window.rpgCampaign;
            }

            if (
                window.MesaRPG &&
                window.MesaRPG.campanha
            ) {
                return window.MesaRPG.campanha;
            }

            if (
                window.MesaRPG &&
                window.MesaRPG.campaign
            ) {
                return window.MesaRPG.campaign;
            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter campanha:",
                erro
            );

        }

        return null;
    }


    function obterMensagemErro(erro) {

        if (!erro) {
            return "Erro desconhecido.";
        }

        if (typeof erro === "string") {
            return erro;
        }

        if (erro.message) {
            return erro.message;
        }

        try {

            return JSON.stringify(erro);

        } catch {

            return String(erro);

        }

    }


    function escaparHTML(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       TESTES
    ===================================================== */

    function definirTeste(
        chave,
        status,
        titulo,
        mensagem,
        detalhes = "",
        impacto = "",
        causas = [],
        acao = ""
    ) {

        Diagnostico.testes[chave] = {

            chave,

            status,

            titulo,

            mensagem,

            detalhes,

            impacto,

            causas: Array.isArray(causas)
                ? causas
                : [causas],

            acao,

            timestamp: new Date()

        };

    }


    function registrarDiagnosticoTeste(chave) {

        const teste = Diagnostico.testes[chave];

        if (!teste) {
            return;
        }

        const prefixos = {

            sucesso: "🟢",

            aviso: "🟡",

            erro: "🔴",

            info: "🔵"

        };

        const icone =
            prefixos[teste.status] || "⚪";

        registrar(
            teste.status,
            `${icone} ${teste.titulo}: ${teste.mensagem}`
        );

    }


    /* =====================================================
       LOG
    ===================================================== */

    function registrar(tipo, mensagem) {

        const entrada = {

            tipo: tipo || "info",

            mensagem: String(mensagem ?? ""),

            data: new Date()

        };

        Diagnostico.logs.push(entrada);

        if (
            Diagnostico.logs.length >
            Diagnostico.maxLogs
        ) {

            Diagnostico.logs.shift();

        }

        atualizarLog();

    }


    function atualizarLog() {

        const elemento =
            document.getElementById(
                "diagnostico-log"
            );

        if (!elemento) {
            return;
        }

        if (!Diagnostico.logs.length) {

            elemento.innerHTML =
                "Nenhum evento registrado.";

            return;

        }

        elemento.innerHTML =
            Diagnostico.logs
                .slice()
                .reverse()
                .map((item) => {

                    const hora =
                        item.data instanceof Date
                            ? item.data.toLocaleTimeString(
                                "pt-BR"
                            )
                            : "";

                    return `
                        <div class="diagnostico-log-item diagnostico-log-${escaparHTML(item.tipo)}">
                            <span class="diagnostico-log-hora">
                                [${escaparHTML(hora)}]
                            </span>

                            <span class="diagnostico-log-mensagem">
                                ${escaparHTML(item.mensagem)}
                            </span>
                        </div>
                    `;

                })
                .join("");

    }


    /* =====================================================
       STATUS VISUAL
    ===================================================== */

    function definirStatus(chave, texto) {

        const elemento =
            document.querySelector(
                `[data-diagnostico="${chave}"]`
            );

        if (!elemento) {
            return;
        }

        elemento.textContent = texto;

    }


    /* =====================================================
       AMBIENTE
    ===================================================== */

    function diagnosticarAmbiente() {

        const supabase =
            !!window.supabase;

        const mesaRPG =
            !!window.MesaRPG;

        const mesaOnline =
            !!window.mesaOnline;

        const ably =
            !!window.Ably;

        const diagnostico =
            !!window.MesaDiagnostico;

        const detalhes = [

            `Supabase: ${supabase ? "OK" : "ausente"}`,

            `MesaRPG: ${mesaRPG ? "OK" : "ausente"}`,

            `mesaOnline: ${mesaOnline ? "OK" : "ausente"}`,

            `Ably SDK: ${ably ? "OK" : "ausente"}`,

            `Diagnóstico: ${diagnostico ? "OK" : "inicializando"}`

        ];

        definirTeste(
            "ambiente",
            supabase && mesaRPG
                ? "sucesso"
                : "aviso",
            "Ambiente",
            supabase && mesaRPG
                ? "Ambiente principal carregado."
                : "Alguns componentes ainda não foram encontrados.",
            detalhes.join(" | "),
            "",
            [],
            ""
        );

        registrarDiagnosticoTeste("ambiente");

    }


    /* =====================================================
       SUPABASE
    ===================================================== */

    function diagnosticarSupabase() {

        const supabase =
            obterSupabase();

        if (!supabase) {

            definirStatus(
                "supabase",
                "🔴 Ausente"
            );

            definirTeste(
                "supabase",
                "erro",
                "Supabase",
                "O cliente Supabase não foi encontrado.",
                "window.supabase não está disponível.",
                "A Mesa não poderá acessar os dados persistentes.",
                [
                    "supabase.js pode não ter carregado.",
                    "A biblioteca do Supabase pode não ter carregado."
                ],
                "Verifique os scripts carregados pelo mesa.html."
            );

            registrarDiagnosticoTeste(
                "supabase"
            );

            return;

        }

        definirStatus(
            "supabase",
            "🟢 Carregado"
        );

        definirTeste(
            "supabase",
            "sucesso",
            "Supabase",
            "Cliente Supabase encontrado.",
            "window.supabase está disponível.",
            "",
            [],
            ""
        );

        registrarDiagnosticoTeste(
            "supabase"
        );

    }


    /* =====================================================
       SUPABASE MESA
    ===================================================== */

    function diagnosticarSupabaseMesa() {

        const mesa =
            obterSupabaseMesa();

        if (!mesa) {

            definirTeste(
                "supabaseMesa",
                "aviso",
                "Supabase Mesa",
                "O módulo específico da Mesa não foi encontrado.",
                "Isso não significa necessariamente que o Supabase esteja quebrado.",
                [
                    "O módulo pode utilizar outro nome global.",
                    "O script pode ainda estar carregando."
                ],
                "",
                []
            );

            registrarDiagnosticoTeste(
                "supabaseMesa"
            );

            return;

        }

        definirTeste(
            "supabaseMesa",
            "sucesso",
            "Supabase Mesa",
            "Módulo Supabase da Mesa encontrado.",
            "O módulo está disponível no navegador.",
            "",
            [],
            ""
        );

        registrarDiagnosticoTeste(
            "supabaseMesa"
        );

    }


    /* =====================================================
       USUÁRIO
    ===================================================== */

    async function diagnosticarUsuario(supabase) {

        const auth =
            obterAuth();

        let usuario = null;

        try {

            if (
                supabase &&
                typeof supabase.auth?.getUser ===
                "function"
            ) {

                const resposta =
                    await supabase.auth.getUser();

                usuario =
                    resposta?.data?.user ||
                    null;

            }

        } catch (erro) {

            registrar(
                "erro",
                "Erro ao consultar usuário Supabase: " +
                obterMensagemErro(erro)
            );

        }

        const userId =
            usuario?.id ||
            auth?.user?.id ||
            auth?.userId ||
            auth?.usuario?.id ||
            null;

        if (!userId) {

            definirStatus(
                "usuario",
                "🟡 Não identificado"
            );

            definirTeste(
                "usuario",
                "aviso",
                "Usuário",
                "Nenhum usuário autenticado foi identificado.",
                "Não foi possível encontrar o UUID do usuário.",
                "A entrada na campanha pode ainda não ter sido concluída.",
                [
                    "Sessão Supabase ainda não carregada.",
                    "rpgAuth ainda não recebeu o usuário."
                ],
                "Verifique a autenticação e aguarde o carregamento da Mesa."
            );

            registrarDiagnosticoTeste(
                "usuario"
            );

            return;

        }

        definirStatus(
            "usuario",
            "🟢 Identificado"
        );

        definirTeste(
            "usuario",
            "sucesso",
            "Usuário",
            "Usuário autenticado identificado.",
            `UUID: ${userId}`,
            "",
            [],
            ""
        );

        registrarDiagnosticoTeste(
            "usuario"
        );

    }


    /* =====================================================
       CAMPANHA
    ===================================================== */

    function diagnosticarCampanha() {

        const campanha =
            obterCampanha();

        if (!campanha) {

            definirStatus(
                "campanha",
                "🔴 Ausente"
            );

            definirTeste(
                "campanha",
                "erro",
                "Campanha",
                "Nenhuma campanha foi encontrada.",
                "rpgAuth.campaign / rpgCampaign não estão disponíveis.",
                "A Mesa não sabe qual campanha deve sincronizar.",
                [
                    "A entrada da Mesa ainda não terminou.",
                    "O contexto da campanha não foi carregado."
                ],
                "Volte à entrada da Mesa e carregue a campanha novamente."
            );

            registrarDiagnosticoTeste(
                "campanha"
            );

            return;

        }

        const id =
            campanha.id ||
            campanha.campaign_id ||
            campanha.campaignId ||
            null;

        const nome =
            campanha.nome ||
            campanha.name ||
            campanha.titulo ||
            "Sem nome";

        definirStatus(
            "campanha",
            id
                ? "🟢 Encontrada"
                : "🟡 Sem ID"
        );

        definirTeste(
            "campanha",
            id
                ? "sucesso"
                : "aviso",
            "Campanha",
            id
                ? `Campanha "${nome}" encontrada.`
                : "Campanha encontrada, mas sem ID.",
            id
                ? `ID: ${id}`
                : "Não foi possível localizar o ID da campanha.",
            "",
            [],
            ""
        );

        registrarDiagnosticoTeste(
            "campanha"
        );

        atualizarDadosCampanha();

    }


    /* =====================================================
       DADOS DA CAMPANHA
    ===================================================== */

    function atualizarDadosCampanha() {

        const campanha =
            obterCampanha();

        if (!campanha) {
            return;
        }

        const id =
            campanha.id ||
            campanha.campaign_id ||
            campanha.campaignId ||
            "—";

        const nome =
            campanha.nome ||
            campanha.name ||
            campanha.titulo ||
            "—";

        const masterId =
            campanha.master_id ||
            campanha.masterId ||
            "—";

        const campoId =
            document.getElementById(
                "diagnostico-campanha-id"
            );

        const campoNome =
            document.getElementById(
                "diagnostico-campanha-nome"
            );

        const campoMaster =
            document.getElementById(
                "diagnostico-master-id"
            );

        if (campoId) {
            campoId.textContent = id;
        }

        if (campoNome) {
            campoNome.textContent = nome;
        }

        if (campoMaster) {
            campoMaster.textContent = masterId;
        }

    }


    /* =====================================================
       PERSONAGENS
    ===================================================== */

    function diagnosticarPersonagens() {

        const personagens =
            obterPersonagens();

        const quantidade =
            personagens.length;

        Diagnostico.ultimaQuantidadePersonagens =
            quantidade;

        definirStatus(
            "personagens",
            `🟢 ${quantidade}`
        );

        definirTeste(
            "personagens",
            "sucesso",
            "Personagens",
            `${quantidade} personagem(ns) encontrados.`,
            quantidade
                ? "A Mesa recebeu personagens para sincronização."
                : "Nenhum personagem foi encontrado no contexto atual.",
            "",
            [],
            ""
        );

        registrarDiagnosticoTeste(
            "personagens"
        );

        atualizarSlots(
            personagens
        );

    }


    /* =====================================================
       SLOTS
    ===================================================== */

    function atualizarSlots(personagens) {

        const quantidade =
            Array.isArray(personagens)
                ? personagens.length
                : 0;

        const elemento =
            document.getElementById(
                "diagnostico-slots"
            );

        if (elemento) {

            elemento.textContent =
                String(quantidade);

        }

        const campanha =
            obterCampanha();

        let texto =
            `${quantidade} personagem(ns)`;

        if (campanha) {

            texto +=
                " carregados na campanha.";

        }

        const testeExistente =
            Diagnostico.testes.slots;

        if (!testeExistente) {

            definirTeste(
                "slots",
                "sucesso",
                "Slots",
                texto,
                "A quantidade representa os personagens encontrados no contexto atual.",
                "",
                [],
                ""
            );

        } else {

            testeExistente.mensagem =
                texto;

            testeExistente.timestamp =
                new Date();

        }

        definirStatus(
            "slots",
            `🟢 ${quantidade}`
        );

        registrarDiagnosticoTeste(
            "slots"
        );

    }


    /* =====================================================
       SUPABASE REALTIME
    ===================================================== */

    function diagnosticarRealtime() {

        const possuiFuncaoRealtime =
            !!(
                window.MesaRPG &&
                typeof window.MesaRPG
                    .iniciarRealtimeMesa ===
                "function"
            );

        const campanha =
            obterCampanha();

        if (
            possuiFuncaoRealtime &&
            campanha
        ) {

            Diagnostico.ultimoRealtime =
                new Date();

            definirStatus(
                "realtime",
                "🟢 Ativo"
            );

            definirTeste(
                "realtime",
                "sucesso",
                "Supabase Realtime",
                "A função de inicialização do Realtime está disponível e existe uma campanha para sincronizar.",
                `Campanha: ${
                    campanha.id ||
                    campanha.campaign_id ||
                    campanha.campaignId ||
                    "sem ID"
                }`,
                "",
                [],
                ""
            );

            registrarDiagnosticoTeste(
                "realtime"
            );

            return;

        }

        if (!campanha) {

            definirStatus(
                "realtime",
                "🟡 Aguardando campanha"
            );

            definirTeste(
                "realtime",
                "aviso",
                "Supabase Realtime",
                "O Realtime está aguardando o contexto da campanha.",
                "Nenhuma campanha disponível para iniciar a sincronização.",
                "",
                [
                    "A entrada da Mesa ainda pode estar carregando."
                ],
                "Aguarde o carregamento da campanha."
            );

            registrarDiagnosticoTeste(
                "realtime"
            );

            return;

        }

        definirStatus(
            "realtime",
            "🟡 Não inicializado"
        );

        definirTeste(
            "realtime",
            "aviso",
            "Supabase Realtime",
            "A função de inicialização do Realtime não foi encontrada.",
            "MesaRPG.iniciarRealtimeMesa não está disponível.",
            "",
            [
                "mesa.js pode ainda não ter carregado.",
                "supabase-mesa.js pode não ter exposto a função."
            ],
            "Verifique a ordem dos scripts no mesa.html."
        );

        registrarDiagnosticoTeste(
            "realtime"
        );

    }


    /* =====================================================
       MULTIPLAYER ABLY
    ===================================================== */

    async function diagnosticarMultiplayer() {

        const multiplayer =
            window.mesaOnline || null;

        const campanha =
            obterCampanha();

        const sdkAbly =
            !!window.Ably;

        const detalhes = [];

        detalhes.push(
            `mesaOnline: ${
                multiplayer
                    ? "encontrado"
                    : "ausente"
            }`
        );

        detalhes.push(
            `Ably SDK: ${
                sdkAbly
                    ? "carregado"
                    : "ausente"
            }`
        );

        detalhes.push(
            `Campanha: ${
                campanha
                    ? "encontrada"
                    : "ausente"
            }`
        );


        /* -------------------------------------------------
           MESA ONLINE AUSENTE
        ------------------------------------------------- */

        if (!multiplayer) {

            definirStatus(
                "multiplayer",
                "🔴 Ausente"
            );

            definirTeste(
                "multiplayer",
                "erro",
                "Multiplayer Ably",
                "mesa-online.js não foi encontrado.",
                detalhes.join(" | "),
                "A camada multiplayer não está disponível.",
                [
                    "mesa-online.js pode não ter carregado.",
                    "O script pode estar fora do mesa.html.",
                    "Pode existir erro JavaScript antes da inicialização."
                ],
                "Verifique se mesa-online.js está sendo carregado no mesa.html."
            );

            registrarDiagnosticoTeste(
                "multiplayer"
            );

            return;

        }


        /* -------------------------------------------------
           CAMPANHA AUSENTE
        ------------------------------------------------- */

        if (!campanha) {

            definirStatus(
                "multiplayer",
                "🟡 Aguardando"
            );

            definirTeste(
                "multiplayer",
                "aviso",
                "Multiplayer Ably",
                "A camada multiplayer foi carregada, mas a campanha ainda não está disponível.",
                detalhes.join(" | "),
                "O canal multiplayer ainda não pode ser definido corretamente.",
                [
                    "A campanha ainda está sendo carregada.",
                    "rpgAuth.campaign ainda não foi preenchido."
                ],
                "Aguarde a entrada da Mesa terminar."
            );

            registrarDiagnosticoTeste(
                "multiplayer"
            );

            return;

        }


        /* -------------------------------------------------
           SDK AUSENTE
        ------------------------------------------------- */

        if (!sdkAbly) {

            definirStatus(
                "multiplayer",
                "🔴 SDK ausente"
            );

            definirTeste(
                "multiplayer",
                "erro",
                "Multiplayer Ably",
                "O SDK do Ably não foi encontrado.",
                detalhes.join(" | "),
                "Não é possível criar uma conexão multiplayer.",
                [
                    "A biblioteca CDN do Ably pode não ter carregado.",
                    "Pode existir bloqueio de rede ou erro no script."
                ],
                "Verifique o carregamento da biblioteca Ably no mesa.html."
            );

            registrarDiagnosticoTeste(
                "multiplayer"
            );

            return;

        }


        /* -------------------------------------------------
           OBJETOS DA CONEXÃO
        ------------------------------------------------- */

        const ably =
            multiplayer.ably ||
            null;

        const canal =
            multiplayer.canal ||
            multiplayer.channel ||
            null;


        if (!ably) {

            definirStatus(
                "multiplayer",
                "🟡 Aguardando autenticação"
            );

            definirTeste(
                "multiplayer",
                "aviso",
                "Multiplayer Ably",
                "A camada multiplayer está carregada, mas ainda não existe uma conexão Ably ativa.",
                detalhes.join(" | "),
                "A Mesa ainda não está compartilhando eventos entre navegadores.",
                [
                    "A autenticação do Ably ainda não foi configurada.",
                    "A conexão pode ainda não ter sido inicializada."
                ],
                "Configurar a autenticação segura do Ably em mesa-online.js."
            );

            registrarDiagnosticoTeste(
                "multiplayer"
            );

            return;

        }


        /* -------------------------------------------------
           ESTADO DA CONEXÃO
        ------------------------------------------------- */

        let estadoConexao =
            "desconhecido";

        try {

            estadoConexao =
                ably.connection?.state ||
                "desconhecido";

        } catch (erro) {

            estadoConexao =
                "erro";

            detalhes.push(
                "Erro ao consultar estado da conexão."
            );

        }


        detalhes.push(
            `Conexão: ${estadoConexao}`
        );


        if (canal) {

            detalhes.push(
                `Canal: ${
                    canal.name ||
                    "ativo"
                }`
            );

        } else {

            detalhes.push(
                "Canal: não encontrado"
            );

        }


        /* -------------------------------------------------
           PRESENÇA
        ------------------------------------------------- */

        let quantidadePresenca =
            Diagnostico.jogadoresOnline || 0;

        if (
            canal &&
            canal.presence &&
            typeof canal.presence.get ===
            "function" &&
            estadoConexao === "connected"
        ) {

            try {

                const membros =
                    await canal.presence.get();

                quantidadePresenca =
                    Array.isArray(membros)
                        ? membros.length
                        : 0;

                Diagnostico.jogadoresOnline =
                    quantidadePresenca;

                detalhes.push(
                    `Jogadores online: ${quantidadePresenca}`
                );

            } catch (erro) {

                detalhes.push(
                    "Presença: não foi possível consultar."
                );

                registrar(
                    "aviso",
                    "Não foi possível consultar a presença Ably: " +
                    obterMensagemErro(erro)
                );

            }

        }


        Diagnostico.ultimoMultiplayer =
            new Date();


        /* -------------------------------------------------
           CONECTADO
        ------------------------------------------------- */

        if (
            estadoConexao ===
            "connected"
        ) {

            definirStatus(
                "multiplayer",
                `🟢 Conectado${
                    quantidadePresenca >= 0
                        ? ` (${quantidadePresenca})`
                        : ""
                }`
            );

            definirTeste(
                "multiplayer",
                "sucesso",
                "Multiplayer Ably",
                "Conexão multiplayer estabelecida.",
                detalhes.join(" | "),
                "A camada multiplayer está pronta para sincronizar eventos.",
                [],
                ""
            );

            registrarDiagnosticoTeste(
                "multiplayer"
            );

            return;

        }


        /* -------------------------------------------------
           CONEXÃO EM PROCESSO
        ------------------------------------------------- */

        const estadosConectando = [

            "initialized",
            "connecting",
            "disconnected",
            "suspended"

        ];

        if (
            estadosConectando.includes(
                estadoConexao
            )
        ) {

            definirStatus(
                "multiplayer",
                `🟡 ${estadoConexao}`
            );

            definirTeste(
                "multiplayer",
                "aviso",
                "Multiplayer Ably",
                `Ably está em estado "${estadoConexao}".`,
                detalhes.join(" | "),
                "O multiplayer ainda não está totalmente conectado.",
                [],
                "Aguarde a conexão terminar."
            );

            registrarDiagnosticoTeste(
                "multiplayer"
            );

            return;

        }


        /* -------------------------------------------------
           ERRO
        ------------------------------------------------- */

        definirStatus(
            "multiplayer",
            "🔴 Erro"
        );

        definirTeste(
            "multiplayer",
            "erro",
            "Multiplayer Ably",
            `A conexão Ably está em estado "${estadoConexao}".`,
            detalhes.join(" | "),
            "A sincronização multiplayer pode não funcionar.",
            [
                "A conexão Ably pode ter falhado.",
                "Pode existir problema de autenticação.",
                "Pode existir problema de rede."
            ],
            "Verifique o console do navegador e a autenticação Ably."
        );

        registrarDiagnosticoTeste(
            "multiplayer"
        );

    }


    /* =====================================================
       FUNÇÕES DA MESA
    ===================================================== */

    function diagnosticarFuncoesMesa() {

        const mesa =
            obterEstadoMesa();

        const funcoes = {

            carregarJogadores:
                !!(
                    mesa &&
                    typeof mesa.carregarJogadoresDaCampanha ===
                    "function"
                ),

            realtime:
                !!(
                    mesa &&
                    typeof mesa.iniciarRealtimeMesa ===
                    "function"
                ),

            sincronizar:
                typeof window.sincronizarPersonagensMesa ===
                "function"

        };


        const quantidade =
            Object.values(funcoes)
                .filter(Boolean)
                .length;


        definirTeste(
            "funcoesMesa",
            quantidade ===
                Object.keys(funcoes).length
                ? "sucesso"
                : "aviso",
            "Funções da Mesa",
            `${quantidade}/${Object.keys(funcoes).length} funções principais disponíveis.`,
            Object.entries(funcoes)
                .map(
                    ([nome, ativa]) =>
                        `${nome}: ${ativa ? "OK" : "ausente"}`
                )
                .join(" | "),
            "",
            [],
            ""
        );

        registrarDiagnosticoTeste(
            "funcoesMesa"
        );

    }


    /* =====================================================
       RESUMO
    ===================================================== */

    function atualizarResumoDiagnostico() {

        const testes =
            Object.values(
                Diagnostico.testes
            );

        const sucessos =
            testes.filter(
                (teste) =>
                    teste.status ===
                    "sucesso"
            ).length;

        const avisos =
            testes.filter(
                (teste) =>
                    teste.status ===
                    "aviso"
            ).length;

        const erros =
            testes.filter(
                (teste) =>
                    teste.status ===
                    "erro"
            ).length;


        const resumo =
            document.getElementById(
                "diagnostico-resumo"
            );

        if (resumo) {

            resumo.textContent =
                `${sucessos} OK • ${avisos} avisos • ${erros} erros`;

        }


        Diagnostico.ultimoDiagnostico = {

            data: new Date(),

            sucessos,

            avisos,

            erros,

            total: testes.length

        };

    }


    /* =====================================================
       RELATÓRIO
    ===================================================== */

    function gerarRelatorio() {

        const detalhes =
            document.getElementById(
                "diagnostico-detalhes"
            );

        if (!detalhes) {
            return;
        }

        const testes =
            Object.values(
                Diagnostico.testes
            );

        if (!testes.length) {

            detalhes.innerHTML =
                "<p>Nenhum diagnóstico executado.</p>";

            return;

        }


        detalhes.innerHTML =
            testes
                .map((teste) => {

                    const classe =
                        `diagnostico-teste-${escaparHTML(
                            teste.status
                        )}`;

                    const causas =
                        Array.isArray(
                            teste.causas
                        ) &&
                        teste.causas.length
                            ? `
                                <ul>
                                    ${
                                        teste.causas
                                            .map(
                                                (causa) =>
                                                    `<li>${escaparHTML(causa)}</li>`
                                            )
                                            .join("")
                                    }
                                </ul>
                              `
                            : "";

                    return `
                        <div class="diagnostico-teste ${classe}">

                            <div class="diagnostico-teste-titulo">
                                ${escaparHTML(teste.titulo)}
                            </div>

                            <div class="diagnostico-teste-mensagem">
                                ${escaparHTML(teste.mensagem)}
                            </div>

                            ${
                                teste.detalhes
                                    ? `
                                        <div class="diagnostico-teste-detalhes">
                                            ${escaparHTML(teste.detalhes)}
                                        </div>
                                      `
                                    : ""
                            }

                            ${
                                teste.impacto
                                    ? `
                                        <div class="diagnostico-teste-impacto">
                                            <strong>Impacto:</strong>
                                            ${escaparHTML(teste.impacto)}
                                        </div>
                                      `
                                    : ""
                            }

                            ${
                                causas
                                    ? `
                                        <div class="diagnostico-teste-causas">
                                            <strong>Possíveis causas:</strong>
                                            ${causas}
                                        </div>
                                      `
                                    : ""
                            }

                            ${
                                teste.acao
                                    ? `
                                        <div class="diagnostico-teste-acao">
                                            <strong>Ação:</strong>
                                            ${escaparHTML(teste.acao)}
                                        </div>
                                      `
                                    : ""
                            }

                        </div>
                    `;

                })
                .join("");

    }


    /* =====================================================
       DIAGNÓSTICO COMPLETO
    ===================================================== */

    async function atualizarDiagnostico() {

        registrar(
            "info",
            "Iniciando diagnóstico completo da Mesa."
        );


        /* ---------------------------------------------
           Ambiente
        --------------------------------------------- */

        diagnosticarAmbiente();


        /* ---------------------------------------------
           Supabase
        --------------------------------------------- */

        diagnosticarSupabase();


        /* ---------------------------------------------
           Supabase Mesa
        --------------------------------------------- */

        diagnosticarSupabaseMesa();


        /* ---------------------------------------------
           Usuário
        --------------------------------------------- */

        await diagnosticarUsuario(
            obterSupabase()
        );


        /* ---------------------------------------------
           Campanha
        --------------------------------------------- */

        diagnosticarCampanha();


        /* ---------------------------------------------
           Personagens
        --------------------------------------------- */

        diagnosticarPersonagens();


        /* ---------------------------------------------
           Realtime Supabase
        --------------------------------------------- */

        diagnosticarRealtime();


        /* ---------------------------------------------
           Multiplayer Ably
        --------------------------------------------- */

        await diagnosticarMultiplayer();


        /* ---------------------------------------------
           Funções da Mesa
        --------------------------------------------- */

        diagnosticarFuncoesMesa();


        /* ---------------------------------------------
           Resumo
        --------------------------------------------- */

        atualizarResumoDiagnostico();

        gerarRelatorio();


        registrar(
            "sucesso",
            "Diagnóstico completo finalizado."
        );

    }


    /* =====================================================
       SINCRONIZAR AGORA
    ===================================================== */

    async function sincronizarAgora() {

        registrar(
            "info",
            "Sincronização manual solicitada."
        );


        try {

            if (
                window.MesaRPG &&
                typeof window.MesaRPG
                    .carregarJogadoresDaCampanha ===
                "function"
            ) {

                await window.MesaRPG
                    .carregarJogadoresDaCampanha();

                registrar(
                    "sucesso",
                    "Jogadores da campanha sincronizados."
                );

            } else if (
                typeof window
                    .sincronizarPersonagensMesa ===
                "function"
            ) {

                await window
                    .sincronizarPersonagensMesa();

                registrar(
                    "sucesso",
                    "Personagens da Mesa sincronizados."
                );

            } else {

                registrar(
                    "aviso",
                    "Nenhuma função de sincronização disponível."
                );

            }

        } catch (erro) {

            registrar(
                "erro",
                "Erro na sincronização: " +
                obterMensagemErro(erro)
            );

        }


        await atualizarDiagnostico();

    }


    /* =====================================================
       EVENTOS
    ===================================================== */

    function registrarEventos() {

        /* ---------------------------------------------
           Jogadores atualizados
        --------------------------------------------- */

        window.addEventListener(
            "mesa:jogadoresAtualizados",
            function (evento) {

                registrar(
                    "sucesso",
                    "Evento mesa:jogadoresAtualizados recebido."
                );

                if (
                    evento &&
                    evento.detail
                ) {

                    registrar(
                        "info",
                        "Dados de jogadores atualizados."
                    );

                }

                diagnosticarPersonagens();

                atualizarResumoDiagnostico();

            }
        );


        /* ---------------------------------------------
           Estado dos jogadores
        --------------------------------------------- */

        window.addEventListener(
            "mesa:estadoJogadoresAtualizado",
            function () {

                registrar(
                    "info",
                    "Estado dos jogadores atualizado."
                );

            }
        );


        /* ---------------------------------------------
           Jogador individual
        --------------------------------------------- */

        window.addEventListener(
            "mesa:jogadorAtualizado",
            function () {

                registrar(
                    "info",
                    "Dados de um jogador foram atualizados."
                );

            }
        );


        /* ---------------------------------------------
           Campanha
        --------------------------------------------- */

        window.addEventListener(
            "rpg:campanhaAtualizada",
            function () {

                registrar(
                    "sucesso",
                    "Contexto da campanha atualizado."
                );

                diagnosticarCampanha();

                diagnosticarMultiplayer();

            }
        );


        /* ---------------------------------------------
           Personagens sincronizados
        --------------------------------------------- */

        window.addEventListener(
            "mesa:jogadores:personagensSincronizados",
            function () {

                registrar(
                    "sucesso",
                    "Personagens sincronizados."
                );

                diagnosticarPersonagens();

            }
        );


        /* ---------------------------------------------
           Supabase Mesa pronto
        --------------------------------------------- */

        window.addEventListener(
            "supabase:mesaPronto",
            function () {

                registrar(
                    "sucesso",
                    "Supabase Mesa informou que está pronto."
                );

                diagnosticarSupabaseMesa();

            }
        );


        /* ---------------------------------------------
           Contexto recebido
        --------------------------------------------- */

        window.addEventListener(
            "supabase:mesaContextoRecebido",
            function () {

                registrar(
                    "sucesso",
                    "Contexto da Mesa recebido do Supabase."
                );

                diagnosticarCampanha();

            }
        );


        /* ---------------------------------------------
           Entrada pronta
        --------------------------------------------- */

        window.addEventListener(
            "supabase:entradaPronta",
            function () {

                registrar(
                    "sucesso",
                    "Entrada da Mesa concluída."
                );

                atualizarDiagnostico();

            }
        );


        /* ---------------------------------------------
           ABLY — CONECTADO
        --------------------------------------------- */

        window.addEventListener(
            "mesa:multiplayerConectado",
            function (evento) {

                registrar(
                    "sucesso",
                    "Multiplayer Ably conectado."
                );

                if (
                    evento?.detail
                ) {

                    registrar(
                        "info",
                        JSON.stringify(
                            evento.detail
                        )
                    );

                }

                atualizarDiagnostico();

            }
        );


        /* ---------------------------------------------
           ABLY — JOGADORES
        --------------------------------------------- */

        window.addEventListener(
            "mesa:multiplayerJogadoresAtualizados",
            function (evento) {

                registrar(
                    "sucesso",
                    "Presença multiplayer atualizada."
                );

                if (
                    evento?.detail
                ) {

                    const quantidade =
                        evento.detail.quantidade ??
                        evento.detail.count ??
                        evento.detail.jogadoresOnline;

                    if (
                        typeof quantidade ===
                        "number"
                    ) {

                        Diagnostico.jogadoresOnline =
                            quantidade;

                    }

                }

                diagnosticarMultiplayer();

            }
        );


        /* ---------------------------------------------
           ABLY — DESCONECTADO
        --------------------------------------------- */

        window.addEventListener(
            "mesa:multiplayerDesconectado",
            function (evento) {

                registrar(
                    "aviso",
                    "Multiplayer Ably desconectado."
                );

                if (
                    evento?.detail
                ) {

                    registrar(
                        "aviso",
                        JSON.stringify(
                            evento.detail
                        )
                    );

                }

                diagnosticarMultiplayer();

            }
        );


        /* ---------------------------------------------
           ABLY — ERRO
        --------------------------------------------- */

        window.addEventListener(
            "mesa:multiplayerErro",
            function (evento) {

                const detalhe =
                    evento?.detail;

                registrar(
                    "erro",
                    "Erro no multiplayer Ably: " +
                    (
                        detalhe?.message ||
                        detalhe?.error ||
                        JSON.stringify(
                            detalhe ||
                            {}
                        )
                    )
                );

                diagnosticarMultiplayer();

            }
        );


        /* ---------------------------------------------
           ERRO GLOBAL
        --------------------------------------------- */

        window.addEventListener(
            "error",
            function (evento) {

                registrar(
                    "erro",
                    `Erro JavaScript: ${
                        evento.message ||
                        "erro desconhecido"
                    }`
                );

            }
        );


        /* ---------------------------------------------
           PROMISE REJEITADA
        --------------------------------------------- */

        window.addEventListener(
            "unhandledrejection",
            function (evento) {

                registrar(
                    "erro",
                    "Promise rejeitada: " +
                    obterMensagemErro(
                        evento.reason
                    )
                );

            }
        );

    }


    /* =====================================================
       ABRIR
    ===================================================== */

    function abrir() {

        const painel =
            document.getElementById(
                "mesa-diagnostico"
            );

        if (!painel) {

            registrar(
                "erro",
                "Painel de diagnóstico não encontrado."
            );

            return;

        }

        Diagnostico.aberto =
            true;

        painel.hidden =
            false;

        painel.style.display =
            "flex";

        atualizarDiagnostico();

        if (!Diagnostico.intervalo) {

            Diagnostico.intervalo =
                setInterval(
                    function () {

                        if (
                            Diagnostico.aberto
                        ) {

                            atualizarDiagnostico();

                        }

                    },
                    5000
                );

        }

    }


    /* =====================================================
       FECHAR
    ===================================================== */

    function fechar() {

        const painel =
            document.getElementById(
                "mesa-diagnostico"
            );

        Diagnostico.aberto =
            false;

        if (painel) {

            painel.hidden =
                true;

            painel.style.display =
                "none";

        }

        if (
            Diagnostico.intervalo
        ) {

            clearInterval(
                Diagnostico.intervalo
            );

            Diagnostico.intervalo =
                null;

        }

    }


    /* =====================================================
       LIMPAR LOGS
    ===================================================== */

    function limparLogs() {

        Diagnostico.logs = [];

        atualizarLog();

        registrar(
            "info",
            "Logs limpos."
        );

    }


    /* =====================================================
       EVENTOS DA INTERFACE
    ===================================================== */

    function registrarEventosInterface() {

        /* ---------------------------------------------
           Botão abrir diagnóstico
        --------------------------------------------- */

        document.addEventListener(
            "click",
            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-diagnostico"
                    );

                if (!botao) {
                    return;
                }

                evento.preventDefault();

                abrir();

            }
        );


        /* ---------------------------------------------
           Botão fechar
        --------------------------------------------- */

        document.addEventListener(
            "click",
            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-fechar-diagnostico"
                    );

                if (!botao) {
                    return;
                }

                evento.preventDefault();

                fechar();

            }
        );


        /* ---------------------------------------------
           Botão limpar
        --------------------------------------------- */

        document.addEventListener(
            "click",
            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-limpar-diagnostico"
                    );

                if (!botao) {
                    return;
                }

                evento.preventDefault();

                limparLogs();

            }
        );


        /* ---------------------------------------------
           Botão sincronizar
        --------------------------------------------- */

        document.addEventListener(
            "click",
            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-sincronizar-diagnostico"
                    );

                if (!botao) {
                    return;
                }

                evento.preventDefault();

                sincronizarAgora();

            }
        );


        /* ---------------------------------------------
           Botão atualizar
        --------------------------------------------- */

        document.addEventListener(
            "click",
            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-atualizar-diagnostico"
                    );

                if (!botao) {
                    return;
                }

                evento.preventDefault();

                atualizarDiagnostico();

            }
        );

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function inicializar() {

        if (
            Diagnostico.inicializado
        ) {
            return;
        }

        Diagnostico.inicializado =
            true;


        registrar(
            "info",
            "Sistema de diagnóstico da Mesa iniciado."
        );


        registrarEventos();

        registrarEventosInterface();


        /* ---------------------------------------------
           Primeiro diagnóstico
        --------------------------------------------- */

        setTimeout(
            function () {

                atualizarDiagnostico();

            },
            300
        );

    }


    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.MesaDiagnostico = {

        abrir,

        fechar,

        registrar,

        atualizar:
            atualizarDiagnostico,

        sincronizar:
            sincronizarAgora,

        relatorio:
            gerarRelatorio,

        limpar:
            limparLogs,

        diagnosticarMultiplayer,

        estado:
            Diagnostico

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar,
            {
                once: true
            }
        );

    } else {

        inicializar();

    }


})();
