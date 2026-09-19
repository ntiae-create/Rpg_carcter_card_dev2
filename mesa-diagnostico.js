/* =========================================================
   MESA RPG — SISTEMA DE DIAGNÓSTICO
   VERSÃO DETALHADA
   + SUPABASE
   + SUPABASE MESA
   + SUPABASE ENTRADA
   + VERIFICAÇÃO DE CONEXÃO ENTRE OS MÓDULOS
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

        ultimaQuantidadePersonagens: null,

        inicializado: false,

        testes: {},

        ultimoDiagnostico: null

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function obterEstadoMesa() {

        try {

            if (
                window.MesaRPG &&
                typeof window.MesaRPG.estado === "function"
            ) {

                return window.MesaRPG.estado();

            }

        } catch (erro) {

            registrar(
                "erro",
                "Falha ao obter o estado interno da Mesa: " +
                obterMensagemErro(erro)
            );

        }

        return null;

    }


    /*
    ---------------------------------------------------------
    SUPABASE PRINCIPAL

    window.supabase
        = biblioteca oficial

    window.supabaseClient
        = cliente criado pelo supabase.js

    O diagnóstico NÃO cria cliente.
    ---------------------------------------------------------
    */

    function obterSupabase() {

        const cliente =
            window.supabaseClient;


        if (
            cliente &&
            typeof cliente.from === "function" &&
            cliente.auth &&
            typeof cliente.auth.getUser === "function" &&
            typeof cliente.channel === "function"
        ) {

            return cliente;

        }


        return null;

    }


    /*
    ---------------------------------------------------------
    SUPABASE MESA

    O diagnóstico pega EXATAMENTE o cliente que
    supabase-mesa.js está utilizando.
    ---------------------------------------------------------
    */

    function obterSupabaseMesa() {

        if (
            window.SupabaseMesa &&
            typeof window.SupabaseMesa.obterCliente ===
            "function"
        ) {

            return window.SupabaseMesa.obterCliente();

        }

        return null;

    }


    function obterAuth() {

        return window.rpgAuth || null;

    }


    function obterPersonagens() {

        const auth =
            obterAuth();


        if (
            auth &&
            Array.isArray(auth.campaignCharacters)
        ) {

            return auth.campaignCharacters;

        }


        const estado =
            obterEstadoMesa();


        if (
            estado &&
            Array.isArray(estado.personagens)
        ) {

            return estado.personagens;

        }


        return [];

    }


    function obterCampanha() {

        const estado =
            obterEstadoMesa();


        if (
            estado &&
            estado.campanha
        ) {

            return estado.campanha;

        }


        const auth =
            obterAuth();


        if (
            auth &&
            auth.campaign
        ) {

            return auth.campaign;

        }


        return null;

    }


    function obterMensagemErro(erro) {

        if (!erro) {

            return "Erro desconhecido.";

        }


        if (erro.message) {

            return erro.message;

        }


        if (typeof erro === "string") {

            return erro;

        }


        try {

            return JSON.stringify(erro);

        } catch (_) {

            return String(erro);

        }

    }


    function definirTeste(
        chave,
        status,
        titulo,
        descricao,
        detalhes,
        impacto,
        causas,
        recomendacao
    ) {

        Diagnostico.testes[chave] = {

            chave,

            status,

            titulo,

            descricao,

            detalhes,

            impacto,

            causas: Array.isArray(causas)
                ? causas
                : [],

            recomendacao

        };

    }


    function registrarDiagnosticoTeste(chave) {

        const teste =
            Diagnostico.testes[chave];


        if (!teste) return;


        let tipo = "info";


        if (teste.status === "sucesso") {

            tipo = "sucesso";

        }

        if (teste.status === "aviso") {

            tipo = "aviso";

        }

        if (teste.status === "erro") {

            tipo = "erro";

        }


        registrar(
            tipo,
            `${teste.titulo}: ${teste.descricao}`
        );

    }


    /* =====================================================
       LOG
    ===================================================== */

    function registrar(tipo, mensagem) {

        const agora =
            new Date();


        const hora =
            agora.toLocaleTimeString(
                "pt-BR",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );


        Diagnostico.logs.push({

            tipo,

            mensagem,

            hora

        });


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


        if (!elemento) return;


        if (!Diagnostico.logs.length) {

            elemento.innerHTML = `
                <div class="diagnostico-log-vazio">
                    Aguardando eventos...
                </div>
            `;

            return;

        }


        elemento.innerHTML =
            Diagnostico.logs
                .slice()
                .reverse()
                .map(item => {

                    let classe =
                        "diagnostico-log-info";


                    if (
                        item.tipo === "sucesso"
                    ) {

                        classe =
                            "diagnostico-log-sucesso";

                    }


                    if (
                        item.tipo === "aviso"
                    ) {

                        classe =
                            "diagnostico-log-aviso";

                    }


                    if (
                        item.tipo === "erro"
                    ) {

                        classe =
                            "diagnostico-log-erro";

                    }


                    return `
                        <div class="diagnostico-log-item">

                            <span class="diagnostico-log-hora">
                                [${item.hora}]
                            </span>

                            <span class="${classe}">
                                ${escaparHTML(item.mensagem)}
                            </span>

                        </div>
                    `;

                })
                .join("");

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
       STATUS
    ===================================================== */

    function definirStatus(chave, texto) {

        const elemento =
            document.querySelector(
                `[data-diagnostico="${chave}"]`
            );


        if (!elemento) return;


        elemento.textContent =
            texto;

    }


    /* =====================================================
       DIAGNÓSTICO — AMBIENTE
    ===================================================== */

    function diagnosticarAmbiente() {

        const mesa =
            !!window.MesaRPG;

        const auth =
            !!window.rpgAuth;

        const supabaseClient =
            !!window.supabaseClient;

        const supabaseGlobal =
            !!window.supabase;

        const supabaseMesa =
            !!window.SupabaseMesa;

        const supabaseEntrada =
            !!window.SupabaseEntrada;

        const detalhes = [];


        detalhes.push(
            `MesaRPG: ${
                mesa
                    ? "encontrado"
                    : "ausente"
            }`
        );


        detalhes.push(
            `rpgAuth: ${
                auth
                    ? "encontrado"
                    : "ausente"
            }`
        );


        detalhes.push(
            `window.supabase: ${
                supabaseGlobal
                    ? "biblioteca encontrada"
                    : "ausente"
            }`
        );


        detalhes.push(
            `window.supabaseClient: ${
                supabaseClient
                    ? "cliente encontrado"
                    : "ausente"
            }`
        );


        detalhes.push(
            `SupabaseMesa: ${
                supabaseMesa
                    ? "encontrado"
                    : "ausente"
            }`
        );


        detalhes.push(
            `SupabaseEntrada: ${
                supabaseEntrada
                    ? "encontrado"
                    : "ausente"
            }`
        );


        if (
            mesa ||
            auth ||
            supabaseClient ||
            supabaseGlobal ||
            supabaseMesa ||
            supabaseEntrada
        ) {

            definirTeste(
                "ambiente",
                "sucesso",
                "Ambiente da Mesa",
                "Os componentes principais da aplicação foram localizados.",
                detalhes.join(" | "),
                "Nenhum impacto identificado.",
                [],
                "Nenhuma ação necessária."
            );

        } else {

            definirTeste(
                "ambiente",
                "erro",
                "Ambiente da Mesa",
                "Nenhum componente principal da Mesa foi localizado.",
                detalhes.join(" | "),
                "A Mesa provavelmente não conseguirá inicializar seus sistemas.",
                [
                    "Scripts da Mesa não foram carregados.",
                    "A ordem dos scripts no HTML pode estar incorreta.",
                    "Algum arquivo JavaScript pode ter falhado."
                ],
                "Verifique os arquivos JavaScript incluídos no mesa.html."
            );

        }


        registrarDiagnosticoTeste("ambiente");

    }


    /* =====================================================
       DIAGNÓSTICO — SUPABASE PRINCIPAL
    ===================================================== */

    function diagnosticarSupabase() {

        const client =
            window.supabaseClient;

        const biblioteca =
            window.supabase;

        const detalhes = [];


        const bibliotecaValida =
            !!(
                biblioteca &&
                typeof biblioteca.createClient === "function"
            );


        const clienteValido =
            !!(
                client &&
                typeof client.from === "function" &&
                client.auth &&
                typeof client.auth.getUser === "function" &&
                typeof client.channel === "function"
            );


        detalhes.push(
            `Biblioteca window.supabase: ${
                bibliotecaValida
                    ? "OK"
                    : "AUSENTE"
            }`
        );


        detalhes.push(
            `Cliente window.supabaseClient: ${
                client
                    ? "ENCONTRADO"
                    : "AUSENTE"
            }`
        );


        detalhes.push(
            `Cliente válido: ${
                clienteValido
                    ? "SIM"
                    : "NÃO"
            }`
        );


        if (!bibliotecaValida) {

            detalhes.push(
                "Biblioteca oficial não encontrada."
            );

        } else {

            detalhes.push(
                "Biblioteca oficial encontrada."
            );

        }


        if (!client) {

            definirStatus(
                "supabase",
                "🔴 Ausente"
            );


            definirTeste(
                "supabase",
                "erro",
                "Supabase",
                "O cliente criado pelo supabase.js não foi encontrado.",
                detalhes.join(" | "),
                "A Mesa não possui acesso ao cliente Supabase principal.",
                [
                    "supabase.js não foi carregado.",
                    "supabase.js não criou window.supabaseClient.",
                    "A ordem dos scripts está incorreta."
                ],
                "Verifique se a biblioteca Supabase é carregada antes do supabase.js."
            );


            registrarDiagnosticoTeste("supabase");


            return null;

        }


        if (!clienteValido) {

            definirStatus(
                "supabase",
                "🟡 Inválido"
            );


            definirTeste(
                "supabase",
                "aviso",
                "Supabase",
                "window.supabaseClient existe, mas não possui a estrutura esperada.",
                detalhes.join(" | "),
                "As operações da Mesa podem falhar.",
                [
                    "O cliente foi sobrescrito.",
                    "supabase.js possui inicialização incompleta."
                ],
                "Verifique o conteúdo do supabase.js."
            );


            registrarDiagnosticoTeste("supabase");


            return null;

        }


        detalhes.push(
            "auth(): disponível"
        );


        detalhes.push(
            "from(): disponível"
        );


        detalhes.push(
            "channel(): disponível"
        );


        definirStatus(
            "supabase",
            "🟢 Conectado"
        );


        definirTeste(
            "supabase",
            "sucesso",
            "Supabase",
            "Cliente criado pelo supabase.js encontrado e validado.",
            detalhes.join(" | "),
            "Nenhum problema estrutural detectado.",
            [],
            "Nenhuma ação necessária."
        );


        registrarDiagnosticoTeste("supabase");


        return client;

    }


    /* =====================================================
       DIAGNÓSTICO — ENCONTRO DOS CLIENTES
    ===================================================== */

    function diagnosticarConexaoSupabase() {

        const clienteGlobal =
            window.supabaseClient;

        const clienteMesa =
            obterSupabaseMesa();

        const entrada =
            window.SupabaseEntrada;

        const detalhes = [];


        const globalValido =
            !!(
                clienteGlobal &&
                typeof clienteGlobal.from === "function"
            );


        const mesaValido =
            !!(
                clienteMesa &&
                typeof clienteMesa.from === "function"
            );


        const mesmaReferencia =
            !!(
                globalValido &&
                mesaValido &&
                clienteGlobal === clienteMesa
            );


        detalhes.push(
            `Cliente do supabase.js: ${
                globalValido
                    ? "ENCONTRADO"
                    : "AUSENTE"
            }`
        );


        detalhes.push(
            `Cliente do SupabaseMesa: ${
                mesaValido
                    ? "ENCONTRADO"
                    : "AUSENTE"
            }`
        );


        detalhes.push(
            `Mesma referência: ${
                mesmaReferencia
                    ? "SIM"
                    : "NÃO"
            }`
        );


        detalhes.push(
            `SupabaseEntrada: ${
                entrada
                    ? "ENCONTRADO"
                    : "AUSENTE"
            }`
        );


        if (
            mesmaReferencia &&
            entrada
        ) {

            definirTeste(
                "conexaoSupabase",
                "sucesso",
                "Conexão Supabase",
                "supabase.js e supabase-mesa.js estão utilizando o mesmo cliente Supabase, e o SupabaseEntrada está presente como ponte.",
                detalhes.join(" | "),
                "Nenhum problema detectado na ligação entre os módulos.",
                [],
                "Nenhuma ação necessária."
            );


            registrar(
                "sucesso",
                "Supabase: cliente do supabase.js encontrado e reutilizado pelo SupabaseMesa."
            );

        }

        else if (
            globalValido &&
            mesaValido &&
            !mesmaReferencia
        ) {

            definirTeste(
                "conexaoSupabase",
                "aviso",
                "Conexão Supabase",
                "Existem dois clientes Supabase diferentes entre o supabase.js e o SupabaseMesa.",
                detalhes.join(" | "),
                "A Mesa pode estar trabalhando com estados diferentes de conexão.",
                [
                    "SupabaseMesa criou um cliente próprio.",
                    "window.supabaseClient não estava disponível quando SupabaseMesa foi inicializado."
                ],
                "Faça o supabase-mesa.js reutilizar window.supabaseClient."
            );


            registrar(
                "aviso",
                "Supabase: existem dois clientes diferentes."
            );

        }

        else if (
            globalValido &&
            !mesaValido
        ) {

            definirTeste(
                "conexaoSupabase",
                "aviso",
                "Conexão Supabase",
                "O cliente do supabase.js existe, mas o SupabaseMesa ainda não está conectado a ele.",
                detalhes.join(" | "),
                "A camada isolada da Mesa ainda não possui o cliente principal.",
                [
                    "SupabaseMesa ainda não foi inicializado.",
                    "supabase-mesa.js não conseguiu obter window.supabaseClient."
                ],
                "Verifique a ordem de carregamento dos scripts."
            );


            registrar(
                "aviso",
                "Supabase: cliente global encontrado, mas ainda não conectado ao SupabaseMesa."
            );

        }

        else {

            definirTeste(
                "conexaoSupabase",
                "erro",
                "Conexão Supabase",
                "Não foi possível encontrar o cliente Supabase principal.",
                detalhes.join(" | "),
                "A Mesa não possui uma conexão Supabase compartilhada.",
                [
                    "supabase.js não carregou.",
                    "window.supabaseClient não foi criado.",
                    "SupabaseMesa não conseguiu obter o cliente."
                ],
                "Verifique primeiro o supabase.js e depois o supabase-mesa.js."
            );


            registrar(
                "erro",
                "Supabase: cliente principal ausente."
            );

        }


        registrarDiagnosticoTeste(
            "conexaoSupabase"
        );

    }


    /* =====================================================
       DIAGNÓSTICO — SUPABASE MESA
    ===================================================== */

    function diagnosticarSupabaseMesa() {

        const modulo =
            window.SupabaseMesa;

        const entrada =
            window.SupabaseEntrada;

        const detalhes = [];


        detalhes.push(
            `SupabaseMesa: ${
                modulo
                    ? "encontrado"
                    : "ausente"
            }`
        );


        detalhes.push(
            `SupabaseEntrada: ${
                entrada
                    ? "encontrado"
                    : "ausente"
            }`
        );


        if (!modulo) {

            definirTeste(
                "supabaseMesa",
                "erro",
                "Supabase Mesa",
                "O módulo supabase-mesa.js não foi encontrado.",
                detalhes.join(" | "),
                "A Mesa não possui sua camada isolada de acesso ao Supabase.",
                [
                    "supabase-mesa.js não foi carregado.",
                    "O script apresentou erro.",
                    "A ordem dos scripts está incorreta."
                ],
                "Verifique se supabase-mesa.js está incluído no mesa.html."
            );


            registrarDiagnosticoTeste("supabaseMesa");


            return;

        }


        let estadoModulo = null;


        try {

            if (
                typeof modulo.diagnostico ===
                "function"
            ) {

                estadoModulo =
                    modulo.diagnostico();

            } else {

                definirTeste(
                    "supabaseMesa",
                    "erro",
                    "Supabase Mesa",
                    "O módulo foi encontrado, mas não possui diagnostico().",
                    "A função de diagnóstico interno não existe.",
                    "Não é possível confirmar o estado do módulo.",
                    [
                        "supabase-mesa.js está desatualizado.",
                        "A API pública está incompleta."
                    ],
                    "Verifique o supabase-mesa.js."
                );


                registrarDiagnosticoTeste("supabaseMesa");


                return;

            }

        } catch (erro) {

            definirTeste(
                "supabaseMesa",
                "erro",
                "Supabase Mesa",
                "O diagnóstico interno do SupabaseMesa apresentou erro.",
                obterMensagemErro(erro),
                "Não é possível confirmar o estado da camada isolada.",
                [
                    "Erro interno no supabase-mesa.js.",
                    "Cliente não inicializado."
                ],
                "Verifique o supabase-mesa.js."
            );


            registrarDiagnosticoTeste("supabaseMesa");


            return;

        }


        const cliente =
            !!estadoModulo?.cliente;

        const inicializado =
            !!estadoModulo?.inicializado;

        const origem =
            estadoModulo?.origemCliente ||
            "desconhecida";

        const mesmoGlobal =
            !!estadoModulo?.mesmoClienteGlobal;

        const contexto =
            !!estadoModulo?.contextoRecebido;


        detalhes.push(
            `Cliente: ${
                cliente
                    ? "OK"
                    : "ausente"
            }`
        );


        detalhes.push(
            `Inicializado: ${
                inicializado
                    ? "SIM"
                    : "NÃO"
            }`
        );


        detalhes.push(
            `Origem: ${origem}`
        );


        detalhes.push(
            `Mesmo cliente global: ${
                mesmoGlobal
                    ? "SIM"
                    : "NÃO"
            }`
        );


        detalhes.push(
            `Contexto: ${
                contexto
                    ? "recebido"
                    : "ausente"
            }`
        );


        if (
            inicializado &&
            cliente &&
            mesmoGlobal
        ) {

            definirTeste(
                "supabaseMesa",
                "sucesso",
                "Supabase Mesa",
                "O SupabaseMesa está utilizando o mesmo cliente criado pelo supabase.js.",
                detalhes.join(" | "),
                "A camada isolada está conectada ao cliente principal.",
                [],
                "Nenhuma ação necessária."
            );

        }

        else if (
            inicializado &&
            cliente &&
            !mesmoGlobal
        ) {

            definirTeste(
                "supabaseMesa",
                "aviso",
                "Supabase Mesa",
                "O SupabaseMesa está funcionando com um cliente próprio.",
                detalhes.join(" | "),
                "A conexão existe, mas não está compartilhando o cliente do supabase.js.",
                [
                    "window.supabaseClient não estava disponível durante a inicialização.",
                    "O SupabaseMesa criou um cliente de fallback."
                ],
                "Verifique a ordem de carregamento de supabase.js e supabase-mesa.js."
            );

        }

        else {

            definirTeste(
                "supabaseMesa",
                "erro",
                "Supabase Mesa",
                "O SupabaseMesa foi encontrado, mas ainda não possui um cliente funcional.",
                detalhes.join(" | "),
                "A camada isolada ainda não consegue acessar o Supabase.",
                [
                    "Cliente global ausente.",
                    "Inicialização incompleta.",
                    "Erro ao criar ou obter o cliente."
                ],
                "Verifique primeiro o diagnóstico do Supabase."
            );

        }


        registrarDiagnosticoTeste(
            "supabaseMesa"
        );

    }


    /* =====================================================
       DIAGNÓSTICO — AUTENTICAÇÃO
    ===================================================== */

    async function diagnosticarUsuario(supabase) {

        const auth =
            obterAuth();


        if (
            auth &&
            auth.user
        ) {

            const id =
                auth.user.id ||
                auth.user.user_id ||
                auth.user.uid;


            definirStatus(
                "usuario",
                id
                    ? "🟢 " + id.slice(0, 8) + "..."
                    : "🟢 Autenticado"
            );


            definirTeste(
                "usuario",
                "sucesso",
                "Autenticação",
                "O sistema local possui um usuário autenticado.",
                id
                    ? `ID do usuário: ${id}`
                    : "ID não informado.",
                "Nenhum impacto identificado.",
                [],
                "Nenhuma ação necessária."
            );


            registrarDiagnosticoTeste("usuario");


            return auth.user;

        }


        if (
            !supabase ||
            !supabase.auth ||
            typeof supabase.auth.getUser !==
            "function"
        ) {

            definirStatus(
                "usuario",
                "🟡 Desconhecido"
            );


            definirTeste(
                "usuario",
                "aviso",
                "Autenticação",
                "Não foi possível consultar o usuário autenticado.",
                "O cliente Supabase não está disponível para autenticação.",
                "Não é possível confirmar a sessão.",
                [
                    "Supabase ausente.",
                    "Cliente incompleto.",
                    "Autenticação ainda não inicializada."
                ],
                "Corrija primeiro o diagnóstico do Supabase."
            );


            registrarDiagnosticoTeste("usuario");


            return null;

        }


        try {

            const resposta =
                await supabase.auth.getUser();

            const usuario =
                resposta?.data?.user;


            if (usuario) {

                definirStatus(
                    "usuario",
                    "🟢 " +
                    usuario.id.slice(0, 8) +
                    "..."
                );


                definirTeste(
                    "usuario",
                    "sucesso",
                    "Autenticação",
                    "Usuário autenticado encontrado pelo Supabase.",
                    `ID: ${usuario.id}`,
                    "Nenhum impacto identificado.",
                    [],
                    "Nenhuma ação necessária."
                );


                registrarDiagnosticoTeste("usuario");


                return usuario;

            }


            definirStatus(
                "usuario",
                "🔴 Não autenticado"
            );


            definirTeste(
                "usuario",
                "erro",
                "Autenticação",
                "O Supabase respondeu, mas não existe usuário autenticado.",
                "auth.getUser() não retornou um usuário.",
                "A Mesa não consegue associar as ações ao usuário.",
                [
                    "Sessão expirada.",
                    "Usuário não realizou login.",
                    "Sessão não foi restaurada."
                ],
                "Verifique o login e a sessão."
            );


            registrarDiagnosticoTeste("usuario");


            return null;

        } catch (erro) {

            definirStatus(
                "usuario",
                "🔴 Erro"
            );


            definirTeste(
                "usuario",
                "erro",
                "Autenticação",
                "Erro ao consultar o usuário no Supabase.",
                obterMensagemErro(erro),
                "A sessão não pôde ser confirmada.",
                [
                    "Sessão inválida.",
                    "Problema de configuração.",
                    "Falha temporária."
                ],
                "Verifique o erro e a sessão."
            );


            registrarDiagnosticoTeste("usuario");


            return null;

        }

    }


    /* =====================================================
       DIAGNÓSTICO — CAMPANHA
    ===================================================== */

    function diagnosticarCampanha() {

        const campanha =
            obterCampanha();


        if (!campanha) {

            definirStatus(
                "campanha",
                "🔴 Nenhuma"
            );


            definirTeste(
                "campanha",
                "erro",
                "Campanha",
                "Nenhuma campanha foi encontrada.",
                "obterCampanha() retornou null.",
                "A Mesa não possui campanha disponível.",
                [
                    "Campanha ainda não carregada.",
                    "Usuário não pertence a campanha.",
                    "Sincronização ainda não terminou."
                ],
                "Aguarde a sincronização."
            );


            registrarDiagnosticoTeste("campanha");


            return null;

        }


        const id =
            campanha.id ||
            campanha.campaign_id ||
            campanha.campaignId;


        const nome =
            campanha.name ||
            campanha.nome ||
            "Sem nome";


        if (!id) {

            definirStatus(
                "campanha",
                "🟡 Sem ID"
            );


            definirTeste(
                "campanha",
                "aviso",
                "Campanha",
                "Uma campanha foi encontrada, mas não possui ID identificável.",
                `Nome: ${nome}`,
                "Consultas dependentes do ID podem falhar.",
                [
                    "Objeto incompleto.",
                    "Nome da coluna diferente."
                ],
                "Verifique o objeto da campanha."
            );

        } else {

            definirStatus(
                "campanha",
                "🟢 OK"
            );


            definirTeste(
                "campanha",
                "sucesso",
                "Campanha",
                "Campanha encontrada corretamente.",
                `Nome: ${nome} | ID: ${id}`,
                "Nenhum impacto identificado.",
                [],
                "Nenhuma ação necessária."
            );

        }


        registrarDiagnosticoTeste("campanha");


        return campanha;

    }


    /* =====================================================
       DADOS DA CAMPANHA
    ===================================================== */

    function atualizarDadosCampanha() {

        const campanha =
            obterCampanha();


        const id =
            document.getElementById(
                "diagnostico-campanha-id"
            );

        const nome =
            document.getElementById(
                "diagnostico-campanha-nome"
            );

        const master =
            document.getElementById(
                "diagnostico-master-id"
            );


        if (!campanha) {

            if (id) id.textContent = "—";

            if (nome) nome.textContent = "—";

            if (master) master.textContent = "—";

            return;

        }


        if (id) {

            id.textContent =
                campanha.id ||
                campanha.campaign_id ||
                campanha.campaignId ||
                "—";

        }


        if (nome) {

            nome.textContent =
                campanha.name ||
                campanha.nome ||
                "Sem nome";

        }


        if (master) {

            master.textContent =
                campanha.master_id ||
                campanha.masterId ||
                "—";

        }

    }


    /* =====================================================
       DIAGNÓSTICO — PERSONAGENS
    ===================================================== */

    function diagnosticarPersonagens() {

        const personagens =
            obterPersonagens();


        const validos =
            Array.isArray(personagens)
                ? personagens
                : [];


        const ocupados =
            validos.filter(
                personagem =>
                    personagem &&
                    personagem.slot != null
            );


        definirStatus(
            "personagens",
            String(validos.length)
        );


        definirStatus(
            "slots",
            `${ocupados.length}/8`
        );


        atualizarSlots(validos);


        const slotsInvalidos =
            validos.filter(
                personagem => {

                    const slot =
                        Number(personagem?.slot);


                    return (
                        personagem &&
                        (
                            !Number.isInteger(slot) ||
                            slot < 1 ||
                            slot > 8
                        )
                    );

                }
            );


        if (!validos.length) {

            definirTeste(
                "personagens",
                "aviso",
                "Personagens",
                "Nenhum personagem foi encontrado.",
                "Quantidade: 0",
                "Os cards não possuem dados para exibir.",
                [
                    "Campanha ainda não sincronizada.",
                    "Não existem personagens.",
                    "Carregamento ainda não executado."
                ],
                "Execute a sincronização."
            );

        }

        else if (slotsInvalidos.length) {

            definirTeste(
                "personagens",
                "aviso",
                "Personagens",
                `${validos.length} personagem(ns) encontrado(s), mas existem registros com slot inválido.`,
                `Slots ocupados: ${ocupados.length}/8 | Inválidos: ${slotsInvalidos.length}`,
                "Alguns personagens podem não aparecer corretamente.",
                [
                    "Slot nulo.",
                    "Slot fora de 1–8.",
                    "Dados inconsistentes."
                ],
                "Verifique os slots no banco."
            );

        }

        else {

            definirTeste(
                "personagens",
                "sucesso",
                "Personagens",
                `${validos.length} personagem(ns) encontrado(s).`,
                `Slots ocupados: ${ocupados.length}/8`,
                "Nenhum problema detectado.",
                [],
                "Nenhuma ação necessária."
            );

        }


        registrarDiagnosticoTeste("personagens");


        if (
            Diagnostico.ultimaQuantidadePersonagens !==
            validos.length
        ) {

            if (
                Diagnostico.ultimaQuantidadePersonagens !==
                null
            ) {

                registrar(
                    "info",
                    `Quantidade de personagens alterada: ${validos.length}`
                );

            }


            Diagnostico.ultimaQuantidadePersonagens =
                validos.length;

        }

    }


    /* =====================================================
       SLOTS
    ===================================================== */

    function atualizarSlots(personagens) {

        const container =
            document.getElementById(
                "diagnostico-slots"
            );


        if (!container) return;


        const mapa =
            new Map();


        personagens.forEach(
            personagem => {

                const slot =
                    Number(personagem?.slot);


                if (
                    Number.isInteger(slot) &&
                    slot >= 1 &&
                    slot <= 8
                ) {

                    mapa.set(
                        slot,
                        personagem
                    );

                }

            }
        );


        let html = "";


        for (
            let slot = 1;
            slot <= 8;
            slot++
        ) {

            const personagem =
                mapa.get(slot);


            if (personagem) {

                const nome =
                    personagem.name ||
                    personagem.nome ||
                    "Sem nome";


                const characterId =
                    personagem.id ||
                    personagem.characterId ||
                    "—";


                const userId =
                    personagem.user_id ||
                    personagem.userId ||
                    "—";


                html += `

                    <div class="diagnostico-slot ocupado">

                        <div class="diagnostico-slot-topo">

                            <span class="diagnostico-slot-numero">
                                Slot ${slot}
                            </span>

                            <span class="diagnostico-slot-status">
                                🟢 OCUPADO
                            </span>

                        </div>

                        <div class="diagnostico-slot-nome">
                            ${escaparHTML(nome)}
                        </div>

                        <div class="diagnostico-slot-id">
                            Character: ${escaparHTML(characterId)}
                        </div>

                        <div class="diagnostico-slot-id">
                            User: ${escaparHTML(userId)}
                        </div>

                    </div>

                `;

            } else {

                html += `

                    <div class="diagnostico-slot vazio">

                        <div class="diagnostico-slot-topo">

                            <span class="diagnostico-slot-numero">
                                Slot ${slot}
                            </span>

                            <span class="diagnostico-slot-status">
                                ⚪ VAZIO
                            </span>

                        </div>

                        <div class="diagnostico-slot-nome">
                            Nenhum personagem
                        </div>

                    </div>

                `;

            }

        }


        container.innerHTML =
            html;

    }


    /* =====================================================
       DIAGNÓSTICO — REALTIME
    ===================================================== */

    function diagnosticarRealtime() {

        const estado =
            obterEstadoMesa();

        const campanha =
            obterCampanha();

        const possuiMesa =
            !!window.MesaRPG;

        const possuiFuncaoRealtime =
            !!(
                window.MesaRPG &&
                typeof window.MesaRPG.iniciarRealtimeMesa ===
                "function"
            );

        const detalhes = [];


        detalhes.push(
            `MesaRPG: ${
                possuiMesa
                    ? "disponível"
                    : "ausente"
            }`
        );


        detalhes.push(
            `iniciarRealtimeMesa(): ${
                possuiFuncaoRealtime
                    ? "disponível"
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


        if (
            possuiFuncaoRealtime &&
            campanha
        ) {

            definirStatus(
                "realtime",
                "🟢 Ativo"
            );


            definirTeste(
                "realtime",
                "sucesso",
                "Realtime",
                "A função de inicialização do Realtime está disponível e existe uma campanha.",
                detalhes.join(" | "),
                "Nenhum problema estrutural detectado.",
                [],
                "Nenhuma ação necessária."
            );


            Diagnostico.ultimoRealtime =
                new Date();

        } else {

            definirStatus(
                "realtime",
                "🟡 Aguardando"
            );


            definirTeste(
                "realtime",
                "aviso",
                "Realtime",
                "Não foi possível confirmar uma conexão Realtime ativa.",
                detalhes.join(" | "),
                "Alterações em tempo real podem não ser recebidas.",
                [
                    "Campanha não carregada.",
                    "Função ausente.",
                    "Realtime ainda inicializando."
                ],
                "Verifique o carregamento da Mesa."
            );

        }


        if (
            estado &&
            estado.campanha
        ) {

            definirStatus(
                "realtime",
                "🟢 Ativo"
            );

        }


        registrarDiagnosticoTeste("realtime");

    }


    /* =====================================================
       FUNÇÕES DA MESA
    ===================================================== */

    function diagnosticarFuncoesMesa() {

        const funcoes = {

            estado:
                !!(
                    window.MesaRPG &&
                    typeof window.MesaRPG.estado ===
                    "function"
                ),

            carregarJogadores:
                !!(
                    window.MesaRPG &&
                    typeof window.MesaRPG.carregarJogadoresDaCampanha ===
                    "function"
                ),

            realtime:
                !!(
                    window.MesaRPG &&
                    typeof window.MesaRPG.iniciarRealtimeMesa ===
                    "function"
                ),

            sincronizar:
                typeof window.sincronizarPersonagensMesa ===
                "function"

        };


        const encontradas =
            Object.entries(funcoes)
                .filter(
                    ([_, valor]) => valor
                )
                .map(
                    ([chave]) => chave
                );


        const ausentes =
            Object.entries(funcoes)
                .filter(
                    ([_, valor]) => !valor
                )
                .map(
                    ([chave]) => chave
                );


        if (!encontradas.length) {

            definirTeste(
                "funcoes",
                "erro",
                "Funções da Mesa",
                "Nenhuma função pública esperada foi encontrada.",
                "Todas as funções estão ausentes.",
                "O diagnóstico não consegue consultar a Mesa.",
                [
                    "mesa.js não carregado.",
                    "MesaRPG não inicializado.",
                    "Funções renomeadas."
                ],
                "Verifique o mesa.js."
            );

        } else if (ausentes.length) {

            definirTeste(
                "funcoes",
                "aviso",
                "Funções da Mesa",
                "Algumas funções estão ausentes.",
                `Encontradas: ${encontradas.join(", ")} | Ausentes: ${ausentes.join(", ")}`,
                "Alguns recursos podem não funcionar.",
                [
                    "Versão parcial do mesa.js.",
                    "Função removida.",
                    "Script carregado parcialmente."
                ],
                "Verifique as funções ausentes."
            );

        } else {

            definirTeste(
                "funcoes",
                "sucesso",
                "Funções da Mesa",
                "Todas as funções principais foram encontradas.",
                encontradas.join(", "),
                "Nenhum problema detectado.",
                [],
                "Nenhuma ação necessária."
            );

        }


        registrarDiagnosticoTeste("funcoes");

    }


    /* =====================================================
       ATUALIZAÇÃO COMPLETA
    ===================================================== */

    async function atualizarDiagnostico() {

        Diagnostico.testes = {};


        diagnosticarAmbiente();


        const supabase =
            diagnosticarSupabase();


        diagnosticarSupabaseMesa();


        diagnosticarConexaoSupabase();


        await diagnosticarUsuario(
            supabase
        );


        diagnosticarCampanha();


        diagnosticarPersonagens();


        diagnosticarRealtime();


        diagnosticarFuncoesMesa();


        atualizarDadosCampanha();


        Diagnostico.ultimoDiagnostico =
            new Date();


        atualizarResumoDiagnostico();

        atualizarRelatorio();

    }


    /* =====================================================
       RESUMO
    ===================================================== */

    function atualizarResumoDiagnostico() {

        const testes =
            Object.values(
                Diagnostico.testes
            );


        const erros =
            testes.filter(
                teste =>
                    teste.status === "erro"
            );


        const avisos =
            testes.filter(
                teste =>
                    teste.status === "aviso"
            );


        const sucessos =
            testes.filter(
                teste =>
                    teste.status === "sucesso"
            );


        const resumo =
            document.getElementById(
                "diagnostico-resumo"
            );


        if (!resumo) return;


        resumo.innerHTML = `

            <div class="diagnostico-resumo-item">
                <strong>${sucessos.length}</strong>
                <span>OK</span>
            </div>

            <div class="diagnostico-resumo-item">
                <strong>${avisos.length}</strong>
                <span>Avisos</span>
            </div>

            <div class="diagnostico-resumo-item">
                <strong>${erros.length}</strong>
                <span>Erros</span>
            </div>

        `;

    }


    /* =====================================================
       RELATÓRIO
    ===================================================== */

    function gerarRelatorio() {

        const testes =
            Object.values(
                Diagnostico.testes
            );


        if (!testes.length) {

            return `
                <div class="diagnostico-relatorio-vazio">
                    Nenhum diagnóstico executado ainda.
                </div>
            `;

        }


        return testes
            .map(
                teste => {

                    let classe =
                        "diagnostico-detalhe-info";

                    let icone =
                        "ℹ️";


                    if (
                        teste.status === "sucesso"
                    ) {

                        classe =
                            "diagnostico-detalhe-sucesso";

                        icone =
                            "🟢";

                    }


                    if (
                        teste.status === "aviso"
                    ) {

                        classe =
                            "diagnostico-detalhe-aviso";

                        icone =
                            "🟡";

                    }


                    if (
                        teste.status === "erro"
                    ) {

                        classe =
                            "diagnostico-detalhe-erro";

                        icone =
                            "🔴";

                    }


                    const causas =
                        teste.causas.length
                            ? `
                                <ul>
                                    ${
                                        teste.causas
                                            .map(
                                                causa =>
                                                    `<li>${escaparHTML(causa)}</li>`
                                            )
                                            .join("")
                                    }
                                </ul>
                            `
                            : `
                                <div class="diagnostico-sem-causas">
                                    Nenhuma causa suspeita.
                                </div>
                            `;


                    return `

                        <article class="diagnostico-detalhe ${classe}">

                            <div class="diagnostico-detalhe-cabecalho">

                                <strong>
                                    ${icone}
                                    ${escaparHTML(teste.titulo)}
                                </strong>

                            </div>


                            <div class="diagnostico-detalhe-descricao">

                                ${escaparHTML(teste.descricao)}

                            </div>


                            <div class="diagnostico-detalhe-bloco">

                                <strong>🔎 Detalhes</strong>

                                <div>
                                    ${escaparHTML(teste.detalhes)}
                                </div>

                            </div>


                            <div class="diagnostico-detalhe-bloco">

                                <strong>⚠️ Impacto</strong>

                                <div>
                                    ${escaparHTML(teste.impacto)}
                                </div>

                            </div>


                            <div class="diagnostico-detalhe-bloco">

                                <strong>🧩 Possíveis causas</strong>

                                ${causas}

                            </div>


                            <div class="diagnostico-detalhe-bloco">

                                <strong>🛠️ Recomendação</strong>

                                <div>
                                    ${escaparHTML(teste.recomendacao)}
                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

    }


    function atualizarRelatorio() {

        const elemento =
            document.getElementById(
                "diagnostico-detalhes"
            );


        if (!elemento) return;


        elemento.innerHTML =
            gerarRelatorio();

    }


    /* =====================================================
       SINCRONIZAÇÃO MANUAL
    ===================================================== */

    async function sincronizarAgora() {

        registrar(
            "info",
            "Solicitando sincronização manual..."
        );


        try {

            if (
                window.MesaRPG &&
                typeof window.MesaRPG.carregarJogadoresDaCampanha ===
                "function"
            ) {

                await window.MesaRPG.carregarJogadoresDaCampanha();


                registrar(
                    "sucesso",
                    "Sincronização da campanha concluída."
                );


                await atualizarDiagnostico();

                return;

            }


            if (
                typeof window.sincronizarPersonagensMesa ===
                "function"
            ) {

                await window.sincronizarPersonagensMesa();


                registrar(
                    "sucesso",
                    "Sincronização local executada."
                );


                await atualizarDiagnostico();

                return;

            }


            registrar(
                "erro",
                "Nenhuma função de sincronização foi encontrada."
            );


        } catch (erro) {

            registrar(
                "erro",
                "Erro durante a sincronização: " +
                obterMensagemErro(erro)
            );


            definirTeste(
                "sincronizacao",
                "erro",
                "Sincronização",
                "A tentativa de sincronização manual falhou.",
                obterMensagemErro(erro),
                "Os dados podem permanecer desatualizados.",
                [
                    "Erro no banco.",
                    "Sessão inválida.",
                    "Função de sincronização com erro.",
                    "Problema de conexão."
                ],
                "Verifique o erro e execute o diagnóstico novamente."
            );


            atualizarRelatorio();

        }

    }


    /* =====================================================
       EVENTOS
    ===================================================== */

    function registrarEventos() {

        document.addEventListener(
            "mesa:jogadoresAtualizados",
            evento => {

                const personagens =
                    evento?.detail?.personagens;


                const quantidade =
                    Array.isArray(personagens)
                        ? personagens.length
                        : 0;


                Diagnostico.ultimoRealtime =
                    new Date();


                registrar(
                    "sucesso",
                    `Realtime atualizou personagens: ${quantidade}`
                );


                atualizarDiagnostico();

            }
        );


        document.addEventListener(
            "mesa:estadoJogadoresAtualizado",
            () => {

                registrar(
                    "info",
                    "Estado dos jogadores atualizado."
                );


                atualizarDiagnostico();

            }
        );


        document.addEventListener(
            "mesa:jogadorAtualizado",
            evento => {

                const detalhe =
                    evento?.detail;


                const id =
                    detalhe?.jogadorId ??
                    detalhe?.id ??
                    "desconhecido";


                registrar(
                    "info",
                    `Jogador atualizado: ${id}`
                );


                atualizarDiagnostico();

            }
        );


        document.addEventListener(
            "rpg:campanhaAtualizada",
            () => {

                registrar(
                    "info",
                    "Campanha atualizada."
                );


                atualizarDiagnostico();

            }
        );


        document.addEventListener(
            "mesa:jogadores:personagensSincronizados",
            evento => {

                const quantidade =
                    evento?.detail?.personagens?.length ??
                    evento?.detail?.length ??
                    0;


                registrar(
                    "info",
                    `Cards sincronizados: ${quantidade} personagens.`
                );


                atualizarDiagnostico();

            }
        );


        window.addEventListener(
            "supabase:mesaPronto",
            evento => {

                const origem =
                    evento?.detail?.origem ||
                    "desconhecida";


                const mesmoGlobal =
                    evento?.detail?.mesmoClienteGlobal;


                registrar(
                    "sucesso",
                    `SupabaseMesa pronto. Origem: ${origem} | Mesmo cliente global: ${
                        mesmoGlobal
                            ? "SIM"
                            : "NÃO"
                    }`
                );


                atualizarDiagnostico();

            }
        );


        window.addEventListener(
            "supabase:mesaContextoRecebido",
            () => {

                registrar(
                    "sucesso",
                    "SupabaseMesa recebeu o contexto da Mesa."
                );


                atualizarDiagnostico();

            }
        );


        window.addEventListener(
            "supabase:entradaPronta",
            () => {

                registrar(
                    "sucesso",
                    "SupabaseEntrada encontrou e preparou o contexto da Mesa."
                );


                atualizarDiagnostico();

            }
        );


        window.addEventListener(
            "error",
            evento => {

                registrar(
                    "erro",
                    `Erro JavaScript: ${
                        evento?.message ||
                        "Erro desconhecido."
                    }`
                );

            }
        );


        window.addEventListener(
            "unhandledrejection",
            evento => {

                registrar(
                    "erro",
                    "Promise rejeitada: " +
                    obterMensagemErro(evento?.reason)
                );

            }
        );

    }


    /* =====================================================
       INTERFACE
    ===================================================== */

    function abrir() {

        const painel =
            document.getElementById(
                "mesa-diagnostico"
            );


        if (!painel) {

            console.error(
                "[MesaDiagnostico] Painel não encontrado."
            );

            return;

        }


        painel.hidden = false;

        Diagnostico.aberto = true;


        registrar(
            "info",
            "Executando diagnóstico completo..."
        );


        atualizarDiagnostico()
            .then(
                () => {

                    atualizarRelatorio();

                    registrar(
                        "sucesso",
                        "Diagnóstico completo concluído."
                    );

                    atualizarRelatorio();

                }
            )
            .catch(
                erro => {

                    registrar(
                        "erro",
                        "Falha durante o diagnóstico: " +
                        obterMensagemErro(erro)
                    );

                    atualizarRelatorio();

                }
            );

    }


    function fechar() {

        const painel =
            document.getElementById(
                "mesa-diagnostico"
            );


        if (!painel) return;


        painel.hidden = true;

        Diagnostico.aberto = false;

    }


    function limparLogs() {

        Diagnostico.logs = [];

        atualizarLog();


        registrar(
            "info",
            "Registros limpos."
        );

    }


    /* =====================================================
       BOTÃO DIAGNÓSTICO
    ===================================================== */

    function registrarCliqueDiagnostico() {

        document.addEventListener(
            "click",
            evento => {

                const botao =
                    evento.target.closest(
                        "#btn-diagnostico"
                    );


                if (!botao) return;


                evento.preventDefault();

                evento.stopPropagation();


                abrir();

            },
            true
        );

    }


    /* =====================================================
       CLIQUES DO PAINEL
    ===================================================== */

    function registrarCliquesPainel() {

        document.addEventListener(
            "click",
            evento => {

                const fecharBotao =
                    evento.target.closest(
                        "#btn-fechar-diagnostico"
                    );


                if (fecharBotao) {

                    evento.preventDefault();

                    evento.stopPropagation();

                    fechar();

                    return;

                }


                const limparBotao =
                    evento.target.closest(
                        "#btn-limpar-diagnostico"
                    );


                if (limparBotao) {

                    evento.preventDefault();

                    evento.stopPropagation();

                    limparLogs();

                    return;

                }


                const sincronizarBotao =
                    evento.target.closest(
                        "#btn-sincronizar-diagnostico"
                    );


                if (sincronizarBotao) {

                    evento.preventDefault();

                    evento.stopPropagation();

                    sincronizarAgora();

                    return;

                }


                const atualizarBotao =
                    evento.target.closest(
                        "#btn-atualizar-diagnostico"
                    );


                if (atualizarBotao) {

                    evento.preventDefault();

                    evento.stopPropagation();


                    atualizarDiagnostico()
                        .then(
                            () => {

                                atualizarRelatorio();

                                registrar(
                                    "sucesso",
                                    "Diagnóstico atualizado."
                                );

                            }
                        )
                        .catch(
                            erro => {

                                registrar(
                                    "erro",
                                    "Erro ao atualizar diagnóstico: " +
                                    obterMensagemErro(erro)
                                );

                                atualizarRelatorio();

                            }
                        );

                }

            },
            true
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


        registrarCliqueDiagnostico();

        registrarCliquesPainel();

        registrarEventos();


        registrar(
            "sucesso",
            "Sistema de diagnóstico iniciado."
        );


        setTimeout(
            () => {

                atualizarDiagnostico()
                    .then(
                        () => atualizarRelatorio()
                    )
                    .catch(
                        erro => {

                            registrar(
                                "erro",
                                "Falha na leitura inicial: " +
                                obterMensagemErro(erro)
                            );

                            atualizarRelatorio();

                        }
                    );

            },
            300
        );


        setInterval(
            () => {

                if (
                    Diagnostico.aberto
                ) {

                    atualizarDiagnostico()
                        .then(
                            () => atualizarRelatorio()
                        )
                        .catch(
                            erro => {

                                registrar(
                                    "erro",
                                    "Erro na atualização automática: " +
                                    obterMensagemErro(erro)
                                );

                                atualizarRelatorio();

                            }
                        );

                }

            },
            5000
        );

    }


    /* =====================================================
       API GLOBAL
    ===================================================== */

    window.MesaDiagnostico = {

        abrir,

        fechar,

        registrar,

        atualizar:
            atualizarDiagnostico,

        sincronizar:
            sincronizarAgora,

        relatorio: function () {

            return Diagnostico.testes;

        }

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
            inicializar
        );

    } else {

        inicializar();

    }

})();
