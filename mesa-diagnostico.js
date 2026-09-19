/* =========================================================
   MESA RPG — SISTEMA DE DIAGNÓSTICO
   VERSÃO DETALHADA
   + SUPABASE MESA
   + DIAGNÓSTICO DO CLIENTE GLOBAL
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
    Obtém somente um CLIENTE Supabase real.

    window.supabase =
        biblioteca oficial

    window.supabaseClient =
        cliente criado pelo supabase.js

    SupabaseMesa.obterCliente() =
        cliente utilizado pela camada isolada
    ---------------------------------------------------------
    */

    function obterSupabase() {

        const client =
            window.supabaseClient;


        if (
            client &&
            typeof client.from === "function" &&
            client.auth &&
            typeof client.auth.getUser === "function" &&
            typeof client.channel === "function"
        ) {

            return client;

        }


        /*
        Não usamos window.supabase aqui.

        window.supabase é a biblioteca,
        não o cliente.
        */

        return null;

    }


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
       STATUS DA INTERFACE
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
       DIAGNÓSTICO — SCRIPTS E AMBIENTE
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

        const elementosMesa =
            !!document.getElementById(
                "mesa-diagnostico"
            );

        const detalhes = [];


        detalhes.push(
            `MesaRPG: ${mesa ? "encontrado" : "ausente"}`
        );


        detalhes.push(
            `rpgAuth: ${auth ? "encontrado" : "ausente"}`
        );


        detalhes.push(
            `window.supabaseClient: ${
                supabaseClient
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


        detalhes.push(
            `Painel de diagnóstico: ${
                elementosMesa
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
                    "Algum arquivo JavaScript pode ter falhado durante o carregamento."
                ],
                "Verifique os arquivos JavaScript incluídos no mesa.html."
            );

        }


        registrarDiagnosticoTeste(
            "ambiente"
        );

    }


    /* =====================================================
       DIAGNÓSTICO — SUPABASE PRINCIPAL
    ===================================================== */

    function diagnosticarSupabase() {

        const clienteGlobal =
            window.supabaseClient || null;


        const biblioteca =
            window.supabase || null;


        const moduloMesa =
            window.SupabaseMesa || null;


        let clienteMesa = null;


        /*
        -----------------------------------------------------
        Tenta obter o cliente usado pelo SupabaseMesa.
        -----------------------------------------------------
        */

        try {

            if (
                moduloMesa &&
                typeof moduloMesa.obterCliente ===
                "function"
            ) {

                clienteMesa =
                    moduloMesa.obterCliente();

            }

        } catch (erro) {

            console.warn(
                "[MesaDiagnostico] Erro ao obter cliente do SupabaseMesa:",
                erro
            );

        }


        /*
        -----------------------------------------------------
        VALIDAÇÃO DO CLIENTE GLOBAL
        -----------------------------------------------------
        */

        const clienteGlobalValido =
            !!(
                clienteGlobal &&
                typeof clienteGlobal.from === "function" &&
                clienteGlobal.auth &&
                typeof clienteGlobal.auth.getUser === "function" &&
                typeof clienteGlobal.channel === "function"
            );


        /*
        -----------------------------------------------------
        VALIDAÇÃO DO CLIENTE DO SUPABASE MESA
        -----------------------------------------------------
        */

        const clienteMesaValido =
            !!(
                clienteMesa &&
                typeof clienteMesa.from === "function" &&
                clienteMesa.auth &&
                typeof clienteMesa.auth.getUser === "function" &&
                typeof clienteMesa.channel === "function"
            );


        /*
        -----------------------------------------------------
        VALIDAÇÃO DA BIBLIOTECA
        -----------------------------------------------------
        */

        const bibliotecaValida =
            !!(
                biblioteca &&
                typeof biblioteca.createClient === "function"
            );


        const detalhes = [];


        detalhes.push(
            `Biblioteca window.supabase: ${
                bibliotecaValida
                    ? "OK"
                    : "AUSENTE"
            }`
        );


        detalhes.push(
            `Cliente global window.supabaseClient: ${
                clienteGlobalValido
                    ? "VÁLIDO"
                    : clienteGlobal
                        ? "ENCONTRADO, MAS INVÁLIDO"
                        : "AUSENTE"
            }`
        );


        detalhes.push(
            `Cliente SupabaseMesa: ${
                clienteMesaValido
                    ? "VÁLIDO"
                    : clienteMesa
                        ? "ENCONTRADO, MAS INVÁLIDO"
                        : "AUSENTE"
            }`
        );


        /*
        -----------------------------------------------------
        VERIFICA SE É EXATAMENTE O MESMO OBJETO
        -----------------------------------------------------
        */

        const mesmoCliente =
            !!(
                clienteGlobal &&
                clienteMesa &&
                clienteGlobal === clienteMesa
            );


        detalhes.push(
            `Mesmo objeto global/Mesa: ${
                mesmoCliente
                    ? "SIM"
                    : "NÃO"
            }`
        );


        /*
        =====================================================
        CASO 1 — CLIENTE GLOBAL VÁLIDO
        =====================================================
        */

        if (clienteGlobalValido) {

            definirStatus(
                "supabase",
                "🟢 Conectado"
            );


            definirTeste(
                "supabase",
                "sucesso",
                "Supabase",
                "O cliente Supabase global foi encontrado e validado corretamente.",
                detalhes.join(" | "),
                "Nenhum problema estrutural detectado.",
                [],
                "Nenhuma ação necessária."
            );


            registrarDiagnosticoTeste(
                "supabase"
            );


            return clienteGlobal;

        }


        /*
        =====================================================
        CASO 2 — CLIENTE DO SUPABASE MESA VÁLIDO
        =====================================================
        */

        if (clienteMesaValido) {

            /*
            -------------------------------------------------
            O SUPABASE MESA ESTÁ USANDO O MESMO CLIENTE
            -------------------------------------------------
            */

            if (mesmoCliente) {

                definirStatus(
                    "supabase",
                    "🟢 Conectado"
                );


                definirTeste(
                    "supabase",
                    "sucesso",
                    "Supabase",
                    "O Supabase está conectado e o SupabaseMesa está utilizando o mesmo cliente global.",
                    detalhes.join(" | "),
                    "Nenhum problema estrutural detectado.",
                    [],
                    "Nenhuma ação necessária."
                );

            }

            /*
            -------------------------------------------------
            CLIENTE PRÓPRIO / FALLBACK
            -------------------------------------------------
            */

            else {

                definirStatus(
                    "supabase",
                    "🟡 Fallback"
                );


                definirTeste(
                    "supabase",
                    "aviso",
                    "Supabase",
                    "O Supabase está disponível através do SupabaseMesa, mas o cliente global window.supabaseClient não foi encontrado.",
                    detalhes.join(" | "),
                    "A Mesa possui um cliente funcional, porém não está utilizando o cliente global criado pelo supabase.js.",
                    [
                        "supabase.js não criou window.supabaseClient.",
                        "supabase.js pode não ter sido carregado.",
                        "O SupabaseMesa criou um cliente próprio como fallback."
                    ],
                    "Verifique se supabase.js está sendo carregado antes de supabase-mesa.js."
                );

            }


            registrarDiagnosticoTeste(
                "supabase"
            );


            return clienteMesa;

        }


        /*
        =====================================================
        CASO 3 — NENHUM CLIENTE
        =====================================================
        */

        definirStatus(
            "supabase",
            "🔴 Ausente"
        );


        definirTeste(
            "supabase",
            "erro",
            "Supabase",
            bibliotecaValida
                ? "A biblioteca Supabase foi encontrada, mas nenhum cliente Supabase válido está disponível."
                : "A biblioteca Supabase e nenhum cliente Supabase válido foram encontrados.",
            detalhes.join(" | "),
            "A Mesa não possui um cliente Supabase funcional para banco de dados, autenticação ou Realtime.",
            [
                "supabase.js não foi carregado.",
                "window.supabaseClient não foi criado.",
                "SupabaseMesa ainda não inicializou um cliente.",
                "A ordem dos scripts no mesa.html pode estar incorreta."
            ],
            "Verifique se a biblioteca do Supabase e o supabase.js estão carregados antes do supabase-mesa.js."
        );


        registrarDiagnosticoTeste(
            "supabase"
        );


        return null;

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
                "O módulo isolado da Mesa não foi encontrado.",
                detalhes.join(" | "),
                "A Mesa não possui sua camada isolada de acesso ao Supabase.",
                [
                    "supabase-mesa.js não foi carregado.",
                    "O script possui erro durante a inicialização.",
                    "A ordem dos scripts está incorreta."
                ],
                "Verifique se supabase-mesa.js está incluído no mesa.html."
            );


            registrarDiagnosticoTeste(
                "supabaseMesa"
            );


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
                    "O módulo foi encontrado, mas não possui a função diagnostico().",
                    "SupabaseMesa.diagnostico() não está disponível.",
                    "Não é possível verificar corretamente a camada isolada.",
                    [
                        "supabase-mesa.js está em versão antiga.",
                        "A API pública do módulo está incompleta."
                    ],
                    "Atualize o supabase-mesa.js para a versão que possui diagnostico()."
                );


                registrarDiagnosticoTeste(
                    "supabaseMesa"
                );


                return;

            }

        } catch (erro) {

            definirTeste(
                "supabaseMesa",
                "erro",
                "Supabase Mesa",
                "O módulo foi encontrado, mas seu diagnóstico interno apresentou erro.",
                obterMensagemErro(erro),
                "Não é possível confirmar o estado da camada isolada.",
                [
                    "Erro interno no supabase-mesa.js.",
                    "Cliente Supabase não foi criado corretamente."
                ],
                "Verifique o diagnóstico interno do SupabaseMesa."
            );


            registrarDiagnosticoTeste(
                "supabaseMesa"
            );


            return;

        }


        /*
        -----------------------------------------------------
        IMPORTANTE:

        O supabase-mesa.js atual pode reutilizar
        window.supabaseClient sem preencher corretamente
        estadoModulo.biblioteca.

        Por isso o diagnóstico verifica a biblioteca
        diretamente também.
        -----------------------------------------------------
        */

        const bibliotecaModulo =
            !!estadoModulo?.biblioteca;


        const bibliotecaGlobal =
            !!(
                window.supabase &&
                typeof window.supabase.createClient ===
                "function"
            );


        const biblioteca =
            bibliotecaModulo ||
            bibliotecaGlobal;


        const inicializado =
            !!estadoModulo?.inicializado;


        const cliente =
            !!estadoModulo?.cliente;


        const origemCliente =
            estadoModulo?.origemCliente ||
            "desconhecida";


        const mesmoClienteGlobal =
            !!estadoModulo?.mesmoClienteGlobal;


        const contexto =
            !!estadoModulo?.contextoRecebido;


        const campanha =
            !!estadoModulo?.campanha;


        const usuario =
            !!estadoModulo?.usuario;


        const personagem =
            !!estadoModulo?.personagem;


        /*
        -----------------------------------------------------
        VERIFICAÇÃO EXTRA DA REFERÊNCIA
        -----------------------------------------------------
        */

        const clienteGlobal =
            window.supabaseClient || null;


        const clienteMesa =
            obterSupabaseMesa();


        const mesmaReferencia =
            !!(
                clienteGlobal &&
                clienteMesa &&
                clienteGlobal === clienteMesa
            );


        detalhes.push(
            `Biblioteca: ${
                biblioteca
                    ? "OK"
                    : "ausente"
            }`
        );


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
            `Origem do cliente: ${origemCliente}`
        );


        detalhes.push(
            `Mesmo cliente global: ${
                mesmoClienteGlobal
                    ? "SIM"
                    : "NÃO"
            }`
        );


        detalhes.push(
            `Mesma referência real: ${
                mesmaReferencia
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


        detalhes.push(
            `Campanha: ${
                campanha
                    ? "recebida"
                    : "ausente"
            }`
        );


        detalhes.push(
            `Usuário: ${
                usuario
                    ? "recebido"
                    : "ausente"
            }`
        );


        detalhes.push(
            `Personagem: ${
                personagem
                    ? "recebido"
                    : "ausente"
            }`
        );


        /*
        =====================================================
        CLIENTE GLOBAL REUTILIZADO
        =====================================================
        */

        if (
            inicializado &&
            cliente &&
            (
                mesmoClienteGlobal ||
                mesmaReferencia ||
                origemCliente === "supabase.js"
            )
        ) {

            definirTeste(
                "supabaseMesa",
                "sucesso",
                "Supabase Mesa",
                "A camada isolada da Mesa está reutilizando o mesmo cliente Supabase global criado pelo supabase.js.",
                detalhes.join(" | "),
                "Nenhum problema estrutural detectado na conexão compartilhada.",
                [],
                "Nenhuma ação necessária nesta etapa."
            );

        }


        /*
        =====================================================
        CLIENTE PRÓPRIO — FALLBACK
        =====================================================
        */

        else if (
            inicializado &&
            cliente &&
            (
                origemCliente === "cliente-próprio" ||
                !mesmoClienteGlobal
            )
        ) {

            definirTeste(
                "supabaseMesa",
                "aviso",
                "Supabase Mesa",
                "A camada isolada da Mesa está funcionando, mas está usando um cliente Supabase próprio como fallback.",
                detalhes.join(" | "),
                "A Mesa possui conexão, porém não está reutilizando window.supabaseClient.",
                [
                    "window.supabaseClient não estava disponível durante a inicialização.",
                    "supabase-mesa.js precisou criar um cliente próprio.",
                    "Pode haver diferença entre os estados dos clientes."
                ],
                "Verifique a ordem de carregamento de supabase.js e supabase-mesa.js."
            );

        }


        /*
        =====================================================
        CLIENTE AUSENTE
        =====================================================
        */

        else if (
            biblioteca &&
            !cliente
        ) {

            definirTeste(
                "supabaseMesa",
                "erro",
                "Supabase Mesa",
                "A biblioteca Supabase foi encontrada, mas a camada da Mesa não possui um cliente válido.",
                detalhes.join(" | "),
                "A camada isolada ainda não consegue realizar operações no Supabase.",
                [
                    "Cliente global não foi encontrado.",
                    "Fallback não conseguiu criar o cliente.",
                    "Erro durante a inicialização do módulo."
                ],
                "Verifique a inicialização do supabase-mesa.js."
            );

        }


        /*
        =====================================================
        CONTEXTO AUSENTE
        =====================================================
        */

        else if (
            cliente &&
            !contexto
        ) {

            definirTeste(
                "supabaseMesa",
                "aviso",
                "Supabase Mesa",
                "O cliente Supabase está disponível, mas nenhum contexto da Mesa foi recebido.",
                detalhes.join(" | "),
                "A conexão existe, mas a camada ainda não recebeu campanha, usuário ou personagem.",
                [
                    "supabase-entrada.js ainda não enviou o contexto.",
                    "rpg_mesa_ativa não possui dados.",
                    "A inicialização da entrada ainda não terminou."
                ],
                "Verifique o contexto salvo da Mesa."
            );

        }


        /*
        =====================================================
        CASO PARCIAL
        =====================================================
        */

        else {

            definirTeste(
                "supabaseMesa",
                "aviso",
                "Supabase Mesa",
                "O módulo isolado foi encontrado, mas sua inicialização ainda está incompleta.",
                detalhes.join(" | "),
                "A conexão da Mesa ainda não pode ser considerada totalmente pronta.",
                [
                    "Biblioteca ainda não detectada.",
                    "Cliente ainda não criado.",
                    "Contexto ainda não recebido."
                ],
                "Verifique novamente após a inicialização da Mesa."
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
                "O sistema local da Mesa possui um usuário autenticado.",
                id
                    ? `ID do usuário: ${id}`
                    : "ID não informado.",
                "Nenhum impacto identificado.",
                [],
                "Nenhuma ação necessária."
            );


            registrarDiagnosticoTeste(
                "usuario"
            );


            return auth.user;

        }


        if (
            !supabase ||
            !supabase.auth ||
            typeof supabase.auth.getUser !== "function"
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
                "O cliente Supabase ou o método auth.getUser() não está disponível.",
                "Não é possível confirmar a sessão atual.",
                [
                    "Supabase ausente.",
                    "Cliente Supabase incompleto.",
                    "Sistema de autenticação ainda não inicializado."
                ],
                "Corrija primeiro o diagnóstico do Supabase."
            );


            registrarDiagnosticoTeste(
                "usuario"
            );


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


                registrarDiagnosticoTeste(
                    "usuario"
                );


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
                "supabase.auth.getUser() não retornou um usuário.",
                "A Mesa não consegue associar as ações atuais a um usuário autenticado.",
                [
                    "Sessão expirada.",
                    "Usuário não realizou login.",
                    "Sessão não foi restaurada corretamente."
                ],
                "Verifique o login e a restauração da sessão do usuário."
            );


            registrarDiagnosticoTeste(
                "usuario"
            );


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
                "O Supabase encontrou um erro ao consultar o usuário.",
                obterMensagemErro(erro),
                "A sessão do usuário não pôde ser confirmada.",
                [
                    "Sessão inválida.",
                    "Problema de configuração do Supabase.",
                    "Falha temporária na comunicação."
                ],
                "Verifique o erro informado e a sessão atual do usuário."
            );


            registrarDiagnosticoTeste(
                "usuario"
            );


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
                "Nenhuma campanha foi encontrada no estado atual da Mesa.",
                "obterCampanha() retornou null.",
                "A Mesa não possui uma campanha disponível para sincronização.",
                [
                    "A campanha ainda não foi carregada.",
                    "O usuário não pertence a uma campanha.",
                    "A sincronização inicial ainda não terminou."
                ],
                "Aguarde a sincronização ou verifique o carregamento da campanha."
            );


            registrarDiagnosticoTeste(
                "campanha"
            );


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
                "Uma campanha foi encontrada, mas ela não possui um ID identificável.",
                `Nome: ${nome}`,
                "Consultas e sincronizações que dependem do ID podem falhar.",
                [
                    "Objeto da campanha está incompleto.",
                    "Nome da coluna pode ser diferente do esperado."
                ],
                "Verifique a estrutura do objeto de campanha retornado pelo sistema."
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


        registrarDiagnosticoTeste(
            "campanha"
        );


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


        atualizarSlots(
            validos
        );


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
                "Nenhum personagem foi encontrado no estado atual.",
                "Quantidade: 0",
                "Os cards dos jogadores não possuem dados para exibir.",
                [
                    "A campanha ainda não foi sincronizada.",
                    "Não existem personagens vinculados à campanha.",
                    "A função de carregamento ainda não foi executada."
                ],
                "Use o botão de sincronização e verifique novamente."
            );

        } else if (slotsInvalidos.length) {

            definirTeste(
                "personagens",
                "aviso",
                "Personagens",
                `${validos.length} personagem(ns) encontrado(s), mas existem registros com slot inválido.`,
                `Slots ocupados: ${ocupados.length}/8 | Registros inválidos: ${slotsInvalidos.length}`,
                "Alguns personagens podem não aparecer corretamente nos slots.",
                [
                    "Slot nulo ou inexistente.",
                    "Slot fora do intervalo 1–8.",
                    "Dados antigos ou inconsistentes no banco."
                ],
                "Verifique o slot dos personagens no banco e na sincronização da Mesa."
            );

        } else {

            definirTeste(
                "personagens",
                "sucesso",
                "Personagens",
                `${validos.length} personagem(ns) encontrado(s) corretamente.`,
                `Slots ocupados: ${ocupados.length}/8`,
                "Nenhum problema estrutural detectado nesta etapa.",
                [],
                "Nenhuma ação necessária."
            );

        }


        registrarDiagnosticoTeste(
            "personagens"
        );


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
                    Number(
                        personagem?.slot
                    );


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


        let html =
            "";


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
                "A função de inicialização do Realtime está disponível e existe uma campanha para sincronizar.",
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
                "As alterações em tempo real podem não ser recebidas imediatamente.",
                [
                    "Campanha ainda não carregada.",
                    "Função de inicialização do Realtime ausente.",
                    "Realtime ainda está sendo inicializado."
                ],
                "Verifique o carregamento da Mesa e aguarde a sincronização inicial."
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


        registrarDiagnosticoTeste(
            "realtime"
        );

    }


    /* =====================================================
       DIAGNÓSTICO — FUNÇÕES DA MESA
    ===================================================== */

    function diagnosticarFuncoesMesa() {

        const funcoes = {

            estado:
                !!(
                    window.MesaRPG &&
                    typeof window.MesaRPG.estado === "function"
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
                "Nenhuma função pública esperada da Mesa foi encontrada.",
                "Todas as funções testadas estão ausentes.",
                "O diagnóstico não consegue consultar ou sincronizar o estado da Mesa.",
                [
                    "mesa.js não foi carregado.",
                    "MesaRPG não foi inicializado.",
                    "O nome das funções foi alterado."
                ],
                "Verifique o carregamento do mesa.js."
            );

        } else if (ausentes.length) {

            definirTeste(
                "funcoes",
                "aviso",
                "Funções da Mesa",
                "A Mesa possui algumas funções disponíveis, mas outras estão ausentes.",
                `Encontradas: ${encontradas.join(", ")} | Ausentes: ${ausentes.join(", ")}`,
                "Alguns recursos do diagnóstico ou sincronização podem não funcionar.",
                [
                    "Versão parcial do mesa.js.",
                    "Função removida ou renomeada.",
                    "Script carregado parcialmente."
                ],
                "Verifique se as funções ausentes são esperadas na versão atual da Mesa."
            );

        } else {

            definirTeste(
                "funcoes",
                "sucesso",
                "Funções da Mesa",
                "Todas as funções principais esperadas foram encontradas.",
                encontradas.join(", "),
                "Nenhum problema detectado.",
                [],
                "Nenhuma ação necessária."
            );

        }


        registrarDiagnosticoTeste(
            "funcoes"
        );

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
       RELATÓRIO DETALHADO
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
                "Nenhuma função de sincronização foi encontrada. Verifique o diagnóstico de Funções da Mesa."
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
                "Os dados da Mesa podem permanecer desatualizados.",
                [
                    "Erro no banco de dados.",
                    "Sessão inválida.",
                    "Função de sincronização com erro.",
                    "Problema de conexão."
                ],
                "Verifique os detalhes do erro e execute o diagnóstico novamente."
            );


            atualizarRelatorio();

        }

    }


    /* =====================================================
       EVENTOS DA MESA
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
            evento => {

                const pagina =
                    evento?.detail?.pagina ||
                    "desconhecida";


                registrar(
                    "info",
                    `SupabaseEntrada pronta. Página: ${pagina}`
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

                const erro =
                    evento?.reason;


                registrar(
                    "erro",
                    "Promise rejeitada: " +
                    obterMensagemErro(erro)
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
                "[MesaDiagnostico] Painel #mesa-diagnostico não encontrado."
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
       CLIQUE DO BOTÃO DE DIAGNÓSTICO
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
       CLIQUES INTERNOS DO PAINEL
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

        atualizar: atualizarDiagnostico,

        sincronizar: sincronizarAgora,

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
