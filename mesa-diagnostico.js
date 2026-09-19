"use strict";

/* =========================================================
   MESA DIAGNÓSTICO
   SISTEMA DE MONITORAMENTO E TESTES DA MESA RPG

   IMPORTANTE:
   - NÃO altera a lógica principal da Mesa
   - Apenas monitora e testa
   - Compatível com SupabaseMesa
========================================================= */

(function () {

    console.log(
        "[Mesa Diagnóstico] Carregando sistema de diagnóstico..."
    );


    /* =====================================================
       ESTADO DO DIAGNÓSTICO
    ===================================================== */

    const Diagnostico = {

        aberto: false,

        logs: [],

        maxLogs: 150,

        ultimoRealtime: null,

        ultimaQuantidadePersonagens: null,

        inicializado: false,

        testes: {},

        ultimoDiagnostico: null

    };


    /* =====================================================
       UTILITÁRIOS
    ===================================================== */

    function adicionarLog(
        mensagem,
        tipo = "info"
    ) {

        const agora =
            new Date().toLocaleTimeString();

        const registro = {

            hora: agora,

            mensagem,

            tipo

        };


        Diagnostico.logs.push(
            registro
        );


        if (
            Diagnostico.logs.length >
            Diagnostico.maxLogs
        ) {

            Diagnostico.logs.shift();

        }


        console.log(
            `[Mesa Diagnóstico][${tipo}] ${mensagem}`
        );


        atualizarInterfaceLogs();

    }


    function obterEstadoMesa() {

        try {

            if (
                window.MesaRPG &&
                typeof window.MesaRPG.estado ===
                "function"
            ) {

                return window.MesaRPG.estado();

            }

        } catch (erro) {

            adicionarLog(
                "Erro ao obter estado da Mesa: " +
                erro.message,
                "erro"
            );

        }


        return null;
    }


    /* =====================================================
       SUPABASE
    ===================================================== */

    function obterSupabase() {

        if (
            window.supabaseClient
        ) {

            return window.supabaseClient;

        }


        if (
            window.supabase &&
            (
                typeof window.supabase.auth ===
                "object" ||
                typeof window.supabase.auth ===
                "function"
            )
        ) {

            return window.supabase;

        }


        return null;
    }


    /* =====================================================
       SUPABASE MESA
    ===================================================== */

    function obterSupabaseMesa() {

        try {

            if (
                window.SupabaseMesa &&
                typeof window.SupabaseMesa.obterCliente ===
                "function"
            ) {

                return window.SupabaseMesa.obterCliente();

            }

        } catch (erro) {

            adicionarLog(
                "Erro ao obter cliente do SupabaseMesa: " +
                erro.message,
                "erro"
            );

        }


        return null;
    }


    /* =====================================================
       AUTH
    ===================================================== */

    function obterAuth() {

        try {

            if (
                window.rpgAuth &&
                window.rpgAuth.user
            ) {

                return window.rpgAuth.user;

            }

        } catch (erro) {

            adicionarLog(
                "Erro ao obter usuário do rpgAuth: " +
                erro.message,
                "erro"
            );

        }


        return null;
    }


    /* =====================================================
       PERSONAGENS
    ===================================================== */

    function obterPersonagens() {

        try {

            const estado =
                obterEstadoMesa();


            if (
                estado &&
                Array.isArray(
                    estado.personagens
                )
            ) {

                return estado.personagens;

            }


            if (
                Array.isArray(
                    window.personagensMesa
                )
            ) {

                return window.personagensMesa;

            }

        } catch (erro) {

            adicionarLog(
                "Erro ao obter personagens: " +
                erro.message,
                "erro"
            );

        }


        return [];

    }


    /* =====================================================
       CAMPANHA
    ===================================================== */

    function obterCampanha() {

        try {

            const estado =
                obterEstadoMesa();


            if (
                estado &&
                estado.campanha
            ) {

                return estado.campanha;

            }


            if (
                window.campanhaAtual
            ) {

                return window.campanhaAtual;

            }

        } catch (erro) {

            adicionarLog(
                "Erro ao obter campanha: " +
                erro.message,
                "erro"
            );

        }


        return null;

    }


    /* =====================================================
       MENSAGEM DE ERRO
    ===================================================== */

    function obterMensagemErro(
        erro
    ) {

        if (!erro) {

            return "Erro desconhecido";

        }


        if (
            typeof erro ===
            "string"
        ) {

            return erro;

        }


        return (
            erro.message ||
            erro.error_description ||
            erro.details ||
            erro.hint ||
            "Erro desconhecido"
        );

    }


    /* =====================================================
       REGISTRO DE TESTES
    ===================================================== */

    function definirTeste(
        nome,
        status,
        detalhes = ""
    ) {

        Diagnostico.testes[nome] = {

            status,

            detalhes,

            horario:
                new Date().toLocaleTimeString()

        };

    }


    function registrarDiagnosticoTeste(
        nome,
        status,
        detalhes = ""
    ) {

        definirTeste(
            nome,
            status,
            detalhes
        );


        const prefixos = {

            sucesso: "OK",

            aviso: "AVISO",

            erro: "ERRO",

            info: "INFO"

        };


        adicionarLog(

            `${prefixos[status] || "INFO"} — ${nome}` +
            (
                detalhes
                    ? ` — ${detalhes}`
                    : ""
            ),

            status

        );

    }


    /* =====================================================
       DIAGNÓSTICO DO AMBIENTE
    ===================================================== */

    function diagnosticarAmbiente() {

        adicionarLog(
            "Verificando ambiente da Mesa...",
            "info"
        );


        const mesa =
            !!window.MesaRPG;

        const auth =
            !!window.rpgAuth;

        const supabaseClient =
            !!window.supabaseClient;

        const supabase =
            !!window.supabase;

        const supabaseMesa =
            !!window.SupabaseMesa;

        const supabaseEntrada =
            !!window.SupabaseEntrada;


        const painel =
            !!document.getElementById(
                "mesaDiagnostico"
            );


        const detalhes = [

            `MesaRPG: ${
                mesa
                    ? "OK"
                    : "ausente"
            }`,

            `rpgAuth: ${
                auth
                    ? "OK"
                    : "ausente"
            }`,

            `supabaseClient: ${
                supabaseClient
                    ? "OK"
                    : "ausente"
            }`,

            `supabase: ${
                supabase
                    ? "OK"
                    : "ausente"
            }`,

            `SupabaseMesa: ${
                supabaseMesa
                    ? "OK"
                    : "ausente"
            }`,

            `SupabaseEntrada: ${
                supabaseEntrada
                    ? "OK"
                    : "ausente"
            }`,

            `Painel: ${
                painel
                    ? "OK"
                    : "ausente"
            }`

        ].join(
            " | "
        );


        const ambienteValido =
            mesa &&
            (
                supabaseClient ||
                supabase
            );


        registrarDiagnosticoTeste(

            "Ambiente",

            ambienteValido
                ? "sucesso"
                : "erro",

            detalhes

        );


        return {

            mesa,

            auth,

            supabaseClient,

            supabase,

            supabaseMesa,

            supabaseEntrada,

            painel,

            valido:
                ambienteValido

        };

    }


    /* =====================================================
       DIAGNÓSTICO SUPABASE
    ===================================================== */

    async function diagnosticarSupabase() {

        adicionarLog(
            "Verificando conexão principal com Supabase...",
            "info"
        );


        const clientePrincipal =
            window.supabaseClient;

        const biblioteca =
            window.supabase;


        if (
            !clientePrincipal &&
            !biblioteca
        ) {

            registrarDiagnosticoTeste(

                "Supabase",

                "erro",

                "Cliente Supabase não encontrado."

            );


            return false;

        }


        const supabase =
            obterSupabase();


        if (!supabase) {

            registrarDiagnosticoTeste(

                "Supabase",

                "erro",

                "Não foi possível obter o cliente."

            );


            return false;

        }


        const possuiAuth =
            !!supabase.auth;


        const possuiFrom =
            typeof supabase.from ===
            "function";


        const possuiChannel =
            typeof supabase.channel ===
            "function";


        const conectado =
            possuiAuth &&
            possuiFrom &&
            possuiChannel;


        const detalhes = [

            `auth: ${
                possuiAuth
                    ? "OK"
                    : "ausente"
            }`,

            `from: ${
                possuiFrom
                    ? "OK"
                    : "ausente"
            }`,

            `channel: ${
                possuiChannel
                    ? "OK"
                    : "ausente"
            }`

        ].join(
            " | "
        );


        registrarDiagnosticoTeste(

            "Supabase",

            conectado
                ? "sucesso"
                : "aviso",

            detalhes

        );


        return conectado;

    }


    /* =====================================================
       DIAGNÓSTICO SUPABASE MESA
    ===================================================== */

    function diagnosticarSupabaseMesa() {

        adicionarLog(
            "Verificando camada SupabaseMesa...",
            "info"
        );


        const modulo =
            window.SupabaseMesa;

        const entrada =
            window.SupabaseEntrada;

        const clientePrincipal =
            window.supabaseClient;

        const bibliotecaGlobal =
            !!window.supabase;


        if (!modulo) {

            registrarDiagnosticoTeste(

                "SupabaseMesa",

                "erro",

                "Módulo SupabaseMesa não encontrado."

            );


            return false;

        }


        let estadoModulo =
            null;


        try {

            if (
                typeof modulo.diagnostico ===
                "function"
            ) {

                estadoModulo =
                    modulo.diagnostico();

            }

        } catch (erro) {

            adicionarLog(

                "Erro ao executar diagnóstico do SupabaseMesa: " +
                obterMensagemErro(erro),

                "erro"

            );

        }


        const inicializado =
            !!estadoModulo?.inicializado;

        const clienteInterno =
            !!estadoModulo?.cliente;

        const contexto =
            !!estadoModulo?.contextoRecebido;

        const campanha =
            !!estadoModulo?.campanha;

        const usuario =
            !!estadoModulo?.usuario;

        const personagem =
            !!estadoModulo?.personagem;


        const clienteMesa =
            obterSupabaseMesa();


        /*
         * CORREÇÃO:
         *
         * O SupabaseMesa não possui mais uma
         * propriedade "biblioteca" interna.
         *
         * A validação deve ser feita diretamente
         * sobre o cliente retornado pelo módulo.
         */

        const clienteValidoMesa =
            !!(
                clienteMesa &&
                typeof clienteMesa.from ===
                "function"
            );


        const possuiClienteMesa =
            !!clienteMesa;


        const mesmaReferencia =
            !!(
                clientePrincipal &&
                clienteMesa &&
                clientePrincipal ===
                clienteMesa
            );


        const clientesDiferentes =
            !!(
                clientePrincipal &&
                clienteMesa &&
                clientePrincipal !==
                clienteMesa
            );


        const bibliotecaDisponivel =
            bibliotecaGlobal ||
            !!(
                clientePrincipal &&
                typeof clientePrincipal.from ===
                "function"
            ) ||
            clienteValidoMesa;


        const detalhes = [

            `Biblioteca: ${
                bibliotecaDisponivel
                    ? "OK"
                    : "ausente"
            }`,

            `Cliente Mesa: ${
                clienteValidoMesa
                    ? "OK"
                    : "ausente"
            }`,

            `Cliente interno: ${
                clienteInterno
                    ? "OK"
                    : "ausente"
            }`,

            `Inicializado: ${
                inicializado
                    ? "OK"
                    : "não"
            }`,

            `Mesma referência: ${
                mesmaReferencia
                    ? "SIM"
                    : "NÃO"
            }`,

            `Clientes diferentes: ${
                clientesDiferentes
                    ? "SIM"
                    : "NÃO"
            }`,

            `Contexto: ${
                contexto
                    ? "OK"
                    : "ausente"
            }`,

            `Campanha: ${
                campanha
                    ? "OK"
                    : "ausente"
            }`,

            `Usuário: ${
                usuario
                    ? "OK"
                    : "ausente"
            }`,

            `Personagem: ${
                personagem
                    ? "OK"
                    : "ausente"
            }`

        ].join(
            " | "
        );


        /*
         * Situação ideal:
         *
         * Supabase principal existe
         * +
         * SupabaseMesa possui cliente válido
         * +
         * ambos apontam para a mesma referência.
         */

        if (
            clientePrincipal &&
            clienteValidoMesa &&
            mesmaReferencia
        ) {

            registrarDiagnosticoTeste(

                "SupabaseMesa",

                "sucesso",

                detalhes

            );


            return true;

        }


        /*
         * Existem dois clientes diferentes.
         */

        if (
            clientesDiferentes
        ) {

            registrarDiagnosticoTeste(

                "SupabaseMesa",

                "aviso",

                "SupabaseMesa e cliente principal usam referências diferentes. " +
                detalhes

            );


            return false;

        }


        /*
         * Existe cliente principal, mas
         * SupabaseMesa não conseguiu obtê-lo.
         */

        if (
            clientePrincipal &&
            !clienteValidoMesa
        ) {

            registrarDiagnosticoTeste(

                "SupabaseMesa",

                "erro",

                "Cliente principal existe, mas SupabaseMesa não possui um cliente válido. " +
                detalhes

            );


            return false;

        }


        /*
         * SupabaseMesa possui cliente válido,
         * mas não existe cliente principal.
         */

        if (
            clienteValidoMesa &&
            !clientePrincipal
        ) {

            registrarDiagnosticoTeste(

                "SupabaseMesa",

                "aviso",

                "SupabaseMesa possui cliente válido, mas o cliente principal não foi encontrado. " +
                detalhes

            );


            return true;

        }


        /*
         * Cliente existe, mas módulo ainda
         * não foi marcado como inicializado.
         */

        if (
            possuiClienteMesa &&
            !inicializado
        ) {

            registrarDiagnosticoTeste(

                "SupabaseMesa",

                "aviso",

                "Cliente existe, mas o módulo ainda não foi marcado como inicializado. " +
                detalhes

            );


            return false;

        }


        registrarDiagnosticoTeste(

            "SupabaseMesa",

            "erro",

            "SupabaseMesa indisponível. " +
            detalhes

        );


        return false;

    }


    /* =====================================================
       DIAGNÓSTICO DO USUÁRIO
    ===================================================== */

    async function diagnosticarUsuario(
        supabase
    ) {

        adicionarLog(
            "Verificando usuário autenticado...",
            "info"
        );


        let usuario =
            obterAuth();


        if (
            !usuario &&
            supabase &&
            supabase.auth
        ) {

            try {

                const resultado =
                    await supabase.auth.getUser();


                if (
                    resultado &&
                    resultado.data
                ) {

                    usuario =
                        resultado.data.user;

                }

            } catch (erro) {

                adicionarLog(

                    "Erro ao consultar usuário no Supabase: " +
                    obterMensagemErro(erro),

                    "erro"

                );

            }

        }


        if (usuario) {

            const identificador =
                usuario.email ||
                usuario.id ||
                "usuário autenticado";


            registrarDiagnosticoTeste(

                "Usuário",

                "sucesso",

                `Usuário encontrado: ${identificador}`

            );


            return true;

        }


        registrarDiagnosticoTeste(

            "Usuário",

            "aviso",

            "Nenhum usuário autenticado encontrado."

        );


        return false;

    }


    /* =====================================================
       DIAGNÓSTICO DA CAMPANHA
    ===================================================== */

    function diagnosticarCampanha() {

        adicionarLog(
            "Verificando campanha atual...",
            "info"
        );


        const campanha =
            obterCampanha();


        if (!campanha) {

            registrarDiagnosticoTeste(

                "Campanha",

                "aviso",

                "Nenhuma campanha encontrada."

            );


            return false;

        }


        const identificador =
            campanha.id ||
            campanha.campaignId ||
            campanha.nome ||
            campanha.name ||
            "campanha encontrada";


        registrarDiagnosticoTeste(

            "Campanha",

            "sucesso",

            `Campanha encontrada: ${identificador}`

        );


        return true;

    }


    /* =====================================================
       DIAGNÓSTICO DOS PERSONAGENS
    ===================================================== */

    function diagnosticarPersonagens() {

        adicionarLog(
            "Verificando personagens da Mesa...",
            "info"
        );


        const personagens =
            obterPersonagens();


        const quantidade =
            personagens.length;


        Diagnostico.ultimaQuantidadePersonagens =
            quantidade;


        if (
            quantidade > 0
        ) {

            registrarDiagnosticoTeste(

                "Personagens",

                "sucesso",

                `${quantidade} personagem(ns) encontrado(s).`

            );


            return true;

        }


        registrarDiagnosticoTeste(

            "Personagens",

            "aviso",

            "Nenhum personagem encontrado."

        );


        return false;

    }


    /* =====================================================
       DIAGNÓSTICO REALTIME
    ===================================================== */

    function diagnosticarRealtime() {

        adicionarLog(
            "Verificando Realtime da Mesa...",
            "info"
        );


        const estado =
            obterEstadoMesa();


        const possuiFuncao =
            !!(
                window.MesaRPG &&
                typeof window.MesaRPG.iniciarRealtimeMesa ===
                "function"
            );


        const campanha =
            !!estado?.campanha;


        if (
            possuiFuncao &&
            campanha
        ) {

            Diagnostico.ultimoRealtime =
                new Date();


            registrarDiagnosticoTeste(

                "Realtime",

                "sucesso",

                "Realtime da Mesa disponível para a campanha atual."

            );


            return true;

        }


        if (
            possuiFuncao
        ) {

            registrarDiagnosticoTeste(

                "Realtime",

                "aviso",

                "Função de Realtime disponível, mas nenhuma campanha foi detectada."

            );


            return false;

        }


        registrarDiagnosticoTeste(

            "Realtime",

            "erro",

            "Função iniciarRealtimeMesa não encontrada."

        );


        return false;

    }


    /* =====================================================
       DIAGNÓSTICO DAS FUNÇÕES DA MESA
    ===================================================== */

    function diagnosticarFuncoesMesa() {

        adicionarLog(
            "Verificando funções principais da Mesa...",
            "info"
        );


        const estado =
            !!(
                window.MesaRPG &&
                typeof window.MesaRPG.estado ===
                "function"
            );


        const carregarJogadores =
            !!(
                window.MesaRPG &&
                typeof window.MesaRPG.carregarJogadoresDaCampanha ===
                "function"
            );


        const realtime =
            !!(
                window.MesaRPG &&
                typeof window.MesaRPG.iniciarRealtimeMesa ===
                "function"
            );


        const sincronizar =
            typeof window.sincronizarPersonagensMesa ===
            "function";


        const detalhes = [

            `estado: ${
                estado
                    ? "OK"
                    : "ausente"
            }`,

            `carregar jogadores: ${
                carregarJogadores
                    ? "OK"
                    : "ausente"
            }`,

            `Realtime: ${
                realtime
                    ? "OK"
                    : "ausente"
            }`,

            `sincronizar: ${
                sincronizar
                    ? "OK"
                    : "ausente"
            }`

        ].join(
            " | "
        );


        const valido =
            estado &&
            (
                carregarJogadores ||
                sincronizar
            );


        registrarDiagnosticoTeste(

            "Funções da Mesa",

            valido
                ? "sucesso"
                : "aviso",

            detalhes

        );


        return valido;

    }


    /* =====================================================
       ATUALIZAR DIAGNÓSTICO
    ===================================================== */

    async function atualizarDiagnostico() {

        adicionarLog(
            "Executando diagnóstico completo...",
            "info"
        );


        const ambiente =
            diagnosticarAmbiente();


        const supabase =
            await diagnosticarSupabase();


        diagnosticarSupabaseMesa();


        await diagnosticarUsuario(
            obterSupabase()
        );


        diagnosticarCampanha();

        diagnosticarPersonagens();

        diagnosticarRealtime();

        diagnosticarFuncoesMesa();


        Diagnostico.ultimoDiagnostico =
            new Date();


        atualizarInterface();


        adicionarLog(
            "Diagnóstico completo finalizado.",
            "sucesso"
        );


        return {

            ambiente,

            supabase,

            testes:
                Diagnostico.testes

        };

    }


    /* =====================================================
       SINCRONIZAR AGORA
    ===================================================== */

    async function sincronizarAgora() {

        adicionarLog(
            "Solicitando sincronização manual...",
            "info"
        );


        try {

            if (
                window.MesaRPG &&
                typeof window.MesaRPG.carregarJogadoresDaCampanha ===
                "function"
            ) {

                const resultado =
                    await window.MesaRPG.carregarJogadoresDaCampanha();


                adicionarLog(
                    "Sincronização executada através da MesaRPG.",
                    "sucesso"
                );


                return resultado;

            }


            if (
                typeof window.sincronizarPersonagensMesa ===
                "function"
            ) {

                const resultado =
                    await window.sincronizarPersonagensMesa();


                adicionarLog(
                    "Sincronização executada através da função global.",
                    "sucesso"
                );


                return resultado;

            }


            adicionarLog(
                "Nenhuma função de sincronização encontrada.",
                "erro"
            );


            return null;

        } catch (erro) {

            adicionarLog(

                "Erro durante sincronização: " +
                obterMensagemErro(erro),

                "erro"

            );


            return null;

        }

    }


    /* =====================================================
       INTERFACE — LOGS
    ===================================================== */

    function atualizarInterfaceLogs() {

        const elemento =
            document.getElementById(
                "mesaDiagnosticoLogs"
            );


        if (!elemento) {

            return;

        }


        elemento.innerHTML =
            Diagnostico.logs
                .map(
                    log => {

                        const classe =
                            `log-${log.tipo}`;

                        return `
                            <div class="diagnostico-log ${classe}">
                                <span class="diagnostico-log-hora">
                                    [${log.hora}]
                                </span>

                                <span class="diagnostico-log-mensagem">
                                    ${escapeHTML(log.mensagem)}
                                </span>
                            </div>
                        `;

                    }
                )
                .join("");


        elemento.scrollTop =
            elemento.scrollHeight;

    }


    /* =====================================================
       INTERFACE — TESTES
    ===================================================== */

    function atualizarInterfaceTestes() {

        const elemento =
            document.getElementById(
                "mesaDiagnosticoTestes"
            );


        if (!elemento) {

            return;

        }


        elemento.innerHTML =
            Object.entries(
                Diagnostico.testes
            )
            .map(
                ([nome, teste]) => {

                    return `

                        <div class="diagnostico-teste">

                            <div class="diagnostico-teste-cabecalho">

                                <strong>
                                    ${escapeHTML(nome)}
                                </strong>

                                <span class="diagnostico-status diagnostico-status-${teste.status}">
                                    ${escapeHTML(teste.status)}
                                </span>

                            </div>

                            <div class="diagnostico-teste-detalhes">

                                ${escapeHTML(teste.detalhes || "")}

                            </div>

                            <div class="diagnostico-teste-hora">

                                ${escapeHTML(teste.horario || "")}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

    }


    /* =====================================================
       INTERFACE — STATUS GERAL
    ===================================================== */

    function atualizarInterfaceStatus() {

        const elemento =
            document.getElementById(
                "mesaDiagnosticoStatus"
            );


        if (!elemento) {

            return;

        }


        const testes =
            Object.values(
                Diagnostico.testes
            );


        const erros =
            testes.filter(
                teste =>
                    teste.status ===
                    "erro"
            ).length;


        const avisos =
            testes.filter(
                teste =>
                    teste.status ===
                    "aviso"
            ).length;


        if (
            erros > 0
        ) {

            elemento.textContent =
                "ERROS DETECTADOS";

            elemento.className =
                "mesa-diagnostico-status erro";


            return;

        }


        if (
            avisos > 0
        ) {

            elemento.textContent =
                "FUNCIONANDO COM AVISOS";

            elemento.className =
                "mesa-diagnostico-status aviso";


            return;

        }


        elemento.textContent =
            "SISTEMA OK";

        elemento.className =
            "mesa-diagnostico-status sucesso";

    }


    function atualizarInterface() {

        atualizarInterfaceLogs();

        atualizarInterfaceTestes();

        atualizarInterfaceStatus();

    }


    /* =====================================================
       ESCAPAR HTML
    ===================================================== */

    function escapeHTML(
        texto
    ) {

        return String(
            texto ?? ""
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

    }


    /* =====================================================
       ABRIR DIAGNÓSTICO
    ===================================================== */

    function abrir() {

        const painel =
            document.getElementById(
                "mesaDiagnostico"
            );


        if (!painel) {

            adicionarLog(
                "Painel de diagnóstico não encontrado.",
                "erro"
            );

            return;

        }


        Diagnostico.aberto =
            true;


        painel.classList.add(
            "ativo"
        );


        atualizarInterface();


        atualizarDiagnostico();

    }


    /* =====================================================
       FECHAR DIAGNÓSTICO
    ===================================================== */

    function fechar() {

        const painel =
            document.getElementById(
                "mesaDiagnostico"
            );


        if (!painel) {

            return;

        }


        Diagnostico.aberto =
            false;


        painel.classList.remove(
            "ativo"
        );

    }


    /* =====================================================
       LIMPAR LOGS
    ===================================================== */

    function limparLogs() {

        Diagnostico.logs =
            [];


        atualizarInterfaceLogs();


        adicionarLog(
            "Logs limpos.",
            "info"
        );

    }


    /* =====================================================
       EVENTOS DA MESA
    ===================================================== */

    window.addEventListener(
        "mesa:atualizada",
        function (evento) {

            adicionarLog(
                "Evento mesa:atualizada recebido.",
                "info"
            );


            if (
                evento &&
                evento.detail
            ) {

                const quantidade =
                    Array.isArray(
                        evento.detail.personagens
                    )
                        ? evento.detail.personagens.length
                        : null;


                if (
                    quantidade !== null
                ) {

                    Diagnostico.ultimaQuantidadePersonagens =
                        quantidade;

                }

            }


            if (
                Diagnostico.aberto
            ) {

                atualizarDiagnostico();

            }

        }
    );


    /* =====================================================
       EVENTOS SUPABASE
    ===================================================== */

    window.addEventListener(
        "supabase:mesaPronto",
        function () {

            adicionarLog(
                "Evento supabase:mesaPronto recebido.",
                "sucesso"
            );


            if (
                Diagnostico.aberto
            ) {

                diagnosticarSupabaseMesa();

                atualizarInterface();

            }

        }
    );


    window.addEventListener(
        "supabase:mesaContextoRecebido",
        function () {

            adicionarLog(
                "Contexto recebido pelo SupabaseMesa.",
                "sucesso"
            );


            if (
                Diagnostico.aberto
            ) {

                diagnosticarSupabaseMesa();

                atualizarInterface();

            }

        }
    );


    window.addEventListener(
        "supabase:entradaPronta",
        function () {

            adicionarLog(
                "Ponte SupabaseEntrada pronta.",
                "sucesso"
            );


            if (
                Diagnostico.aberto
            ) {

                atualizarInterface();

            }

        }
    );


    /* =====================================================
       ERROS GLOBAIS
    ===================================================== */

    window.addEventListener(
        "error",
        function (evento) {

            if (
                !evento
            ) {

                return;

            }


            const mensagem =
                evento.message ||
                "Erro JavaScript não identificado.";


            adicionarLog(
                `Erro global: ${mensagem}`,
                "erro"
            );

        }
    );


    window.addEventListener(
        "unhandledrejection",
        function (evento) {

            const motivo =
                evento?.reason;


            adicionarLog(

                "Promise rejeitada: " +
                obterMensagemErro(motivo),

                "erro"

            );

        }
    );


    /* =====================================================
       EVENTOS DA INTERFACE
    ===================================================== */

    document.addEventListener(
        "click",
        function (evento) {

            const alvo =
                evento.target;


            if (!alvo) {

                return;

            }


            if (
                alvo.closest(
                    "[data-diagnostico-abrir]"
                )
            ) {

                abrir();

                return;

            }


            if (
                alvo.closest(
                    "[data-diagnostico-fechar]"
                )
            ) {

                fechar();

                return;

            }


            if (
                alvo.closest(
                    "[data-diagnostico-atualizar]"
                )
            ) {

                atualizarDiagnostico();

                return;

            }


            if (
                alvo.closest(
                    "[data-diagnostico-sincronizar]"
                )
            ) {

                sincronizarAgora();

                return;

            }


            if (
                alvo.closest(
                    "[data-diagnostico-limpar]"
                )
            ) {

                limparLogs();

                return;

            }

        }
    );


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


        adicionarLog(
            "Sistema de diagnóstico inicializado.",
            "sucesso"
        );


        atualizarInterface();


        /*
         * Atualização periódica enquanto
         * o painel estiver aberto.
         */

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


    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.MesaDiagnostico = {

        abrir,

        fechar,

        limparLogs,

        atualizarDiagnostico,

        sincronizarAgora,

        diagnosticarAmbiente,

        diagnosticarSupabase,

        diagnosticarSupabaseMesa,

        diagnosticarUsuario,

        diagnosticarCampanha,

        diagnosticarPersonagens,

        diagnosticarRealtime,

        diagnosticarFuncoesMesa,

        obterEstadoMesa,

        obterSupabase,

        obterSupabaseMesa,

        estado:
            Diagnostico

    };


    /* =====================================================
       DOM READY
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


    console.log(
        "[Mesa Diagnóstico] Sistema disponível."
    );

})();
