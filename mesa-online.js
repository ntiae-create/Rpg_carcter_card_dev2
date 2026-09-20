/* =========================================================
   MESA ONLINE
   Integração Online da Mesa RPG com Supabase

   RESPONSABILIDADES:
   - Conectar a Mesa ao Supabase
   - Identificar a campanha atual
   - Identificar o jogador atual
   - Sincronizar slots
   - Escutar alterações em tempo real
   - Enviar alterações para o Supabase
   - Expor eventos para mesa.js

   NÃO RESPONSABILIDADES:
   - Botões
   - Clique dos cards
   - Interface visual
   - Animações
   - HTML
   - Regras visuais da Mesa

   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

    const MesaOnline = {

        supabase: null,

        campanhaId: null,

        usuarioId: null,

        personagemId: null,

        slotId: null,

        inscrito: false,

        canais: [],

        estado: {

            campanha: null,

            jogadores: [],

            slots: [],

            personagens: [],

            combate: null

        },

        listeners: {},

        inicializado: false

    };


    /* =====================================================
       EVENTOS INTERNOS
    ===================================================== */

    function emitir(evento, dados = null) {

        const lista = MesaOnline.listeners[evento];

        if (!lista) {
            return;
        }

        lista.forEach(callback => {

            try {

                callback(dados);

            } catch (erro) {

                console.error(
                    `[MESA ONLINE] Erro no evento "${evento}":`,
                    erro
                );

            }

        });

    }


    MesaOnline.on = function (evento, callback) {

        if (typeof callback !== "function") {
            return () => {};
        }

        if (!MesaOnline.listeners[evento]) {
            MesaOnline.listeners[evento] = [];
        }

        MesaOnline.listeners[evento].push(callback);

        return function removerListener() {

            MesaOnline.listeners[evento] =
                MesaOnline.listeners[evento].filter(
                    fn => fn !== callback
                );

        };

    };


    /* =====================================================
       OBTÉM O CLIENTE SUPABASE
    ===================================================== */

    function obterSupabase() {

        if (window.supabaseClient) {

            return window.supabaseClient;

        }

        /*
         * Compatibilidade caso o projeto antigo tenha
         * colocado o cliente em outro nome.
         */

        if (window.supabase) {

            /*
             * Evita confundir a biblioteca global
             * com o cliente criado pelo projeto.
             */

            if (
                typeof window.supabase.from === "function"
            ) {

                return window.supabase;

            }

        }

        return null;

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    MesaOnline.iniciar = async function (opcoes = {}) {

        if (MesaOnline.inicializado) {

            console.warn(
                "[MESA ONLINE] Já foi inicializado."
            );

            return MesaOnline;

        }


        MesaOnline.supabase = obterSupabase();


        if (!MesaOnline.supabase) {

            console.error(
                "[MESA ONLINE] Cliente Supabase não encontrado."
            );

            emitir("erro", {
                tipo: "SUPABASE_NAO_ENCONTRADO"
            });

            return null;

        }


        /*
         * Permite passar IDs diretamente:
         *
         * MesaOnline.iniciar({
         *     campanhaId: "...",
         *     usuarioId: "..."
         * });
         */

        MesaOnline.campanhaId =
            opcoes.campanhaId ||
            obterCampanhaDaPagina();


        MesaOnline.usuarioId =
            opcoes.usuarioId ||
            await obterUsuarioAtual();


        if (!MesaOnline.usuarioId) {

            console.warn(
                "[MESA ONLINE] Usuário não autenticado."
            );

            emitir("erro", {
                tipo: "USUARIO_NAO_AUTENTICADO"
            });

            return null;

        }


        if (!MesaOnline.campanhaId) {

            console.warn(
                "[MESA ONLINE] Campanha não identificada."
            );

            emitir("erro", {
                tipo: "CAMPANHA_NAO_IDENTIFICADA"
            });

            return null;

        }


        MesaOnline.inicializado = true;


        emitir("iniciando", {

            campanhaId: MesaOnline.campanhaId,

            usuarioId: MesaOnline.usuarioId

        });


        try {

            await carregarEstadoInicial();

            iniciarRealtime();

            emitir("online", MesaOnline.estado);

            return MesaOnline;

        } catch (erro) {

            console.error(
                "[MESA ONLINE] Falha ao iniciar:",
                erro
            );

            emitir("erro", erro);

            return null;

        }

    };


    /* =====================================================
       DESCOBRIR CAMPANHA
    ===================================================== */

    function obterCampanhaDaPagina() {

        /*
         * Ordem de prioridade:
         *
         * 1. window.campanhaId
         * 2. data-campanha-id do body
         * 3. URL ?campanha=
         * 4. URL ?campanha_id=
         * 5. localStorage
         */

        if (window.campanhaId) {

            return window.campanhaId;

        }


        const bodyId =
            document.body?.dataset?.campanhaId;

        if (bodyId) {

            return bodyId;

        }


        const params =
            new URLSearchParams(
                window.location.search
            );


        const urlId =
            params.get("campanha") ||
            params.get("campanha_id");


        if (urlId) {

            return urlId;

        }


        try {

            return localStorage.getItem(
                "campanhaId"
            );

        } catch {

            return null;

        }

    }


    /* =====================================================
       USUÁRIO ATUAL
    ===================================================== */

    async function obterUsuarioAtual() {

        const {
            data,
            error
        } = await MesaOnline.supabase.auth.getUser();


        if (error) {

            console.error(
                "[MESA ONLINE] Erro ao obter usuário:",
                error
            );

            return null;

        }


        return data?.user?.id || null;

    }


    /* =====================================================
       ESTADO INICIAL
    ===================================================== */

    async function carregarEstadoInicial() {

        /*
         * A partir daqui mantemos a estrutura do estado
         * independente da interface.
         *
         * As consultas específicas podem ser adaptadas
         * às tabelas definitivas do projeto.
         */


        await carregarCampanha();

        await carregarJogadores();

        await carregarSlots();

        await carregarPersonagens();


        emitir(
            "estado-inicial",
            MesaOnline.estado
        );

    }


    /* =====================================================
       CAMPANHA
    ===================================================== */

    async function carregarCampanha() {

        const {
            data,
            error
        } = await MesaOnline.supabase
            .from("campanhas")
            .select("*")
            .eq("id", MesaOnline.campanhaId)
            .maybeSingle();


        if (error) {

            console.error(
                "[MESA ONLINE] Erro ao carregar campanha:",
                error
            );

            throw error;

        }


        MesaOnline.estado.campanha = data;

    }


    /* =====================================================
       JOGADORES
    ===================================================== */

    async function carregarJogadores() {

        const {
            data,
            error
        } = await MesaOnline.supabase
            .from("campanha_usuarios")
            .select("*")
            .eq(
                "campanha_id",
                MesaOnline.campanhaId
            );


        if (error) {

            console.error(
                "[MESA ONLINE] Erro ao carregar jogadores:",
                error
            );

            /*
             * Não derruba toda a Mesa caso a tabela
             * tenha nome diferente.
             */

            emitir("aviso", {
                tipo: "JOGADORES_NAO_CARREGADOS",
                erro
            });

            return;

        }


        MesaOnline.estado.jogadores =
            data || [];

    }


    /* =====================================================
       SLOTS
    ===================================================== */

    async function carregarSlots() {

        const {
            data,
            error
        } = await MesaOnline.supabase
            .from("slots_personagem")
            .select("*")
            .eq(
                "campanha_id",
                MesaOnline.campanhaId
            )
            .order(
                "numero",
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                "[MESA ONLINE] Erro ao carregar slots:",
                error
            );

            emitir("aviso", {
                tipo: "SLOTS_NAO_CARREGADOS",
                erro
            });

            return;

        }


        MesaOnline.estado.slots =
            data || [];


        identificarMeuSlot();

    }


    /* =====================================================
       IDENTIFICAR SLOT DO USUÁRIO
    ===================================================== */

    function identificarMeuSlot() {

        const slot =
            MesaOnline.estado.slots.find(
                item =>
                    item.usuario_id ===
                    MesaOnline.usuarioId
            );


        if (!slot) {

            MesaOnline.slotId = null;

            MesaOnline.personagemId = null;

            return;

        }


        MesaOnline.slotId = slot.id;

        MesaOnline.personagemId =
            slot.personagem_id || null;

    }


    /* =====================================================
       PERSONAGENS
    ===================================================== */

    async function carregarPersonagens() {

        /*
         * Carregamos apenas personagens relacionados
         * à campanha.
         */

        const {
            data,
            error
        } = await MesaOnline.supabase
            .from("personagens")
            .select("*")
            .eq(
                "campanha_id",
                MesaOnline.campanhaId
            );


        if (error) {

            console.error(
                "[MESA ONLINE] Erro ao carregar personagens:",
                error
            );

            emitir("aviso", {
                tipo: "PERSONAGENS_NAO_CARREGADOS",
                erro
            });

            return;

        }


        MesaOnline.estado.personagens =
            data || [];

    }


    /* =====================================================
       REALTIME
    ===================================================== */

    function iniciarRealtime() {

        if (MesaOnline.inscrito) {
            return;
        }


        const canal =
            MesaOnline.supabase
                .channel(
                    `mesa-${MesaOnline.campanhaId}`
                );


        /*
         * -------------------------------------------------
         * ALTERAÇÕES DE SLOTS
         * -------------------------------------------------
         */

        canal.on(

            "postgres_changes",

            {
                event: "*",

                schema: "public",

                table: "slots_personagem",

                filter:
                    `campanha_id=eq.${MesaOnline.campanhaId}`

            },

            payload => {

                processarAlteracaoSlot(
                    payload
                );

            }

        );


        /*
         * -------------------------------------------------
         * ALTERAÇÕES DE PERSONAGENS
         * -------------------------------------------------
         */

        canal.on(

            "postgres_changes",

            {
                event: "*",

                schema: "public",

                table: "personagens",

                filter:
                    `campanha_id=eq.${MesaOnline.campanhaId}`

            },

            payload => {

                processarAlteracaoPersonagem(
                    payload
                );

            }

        );


        /*
         * -------------------------------------------------
         * ALTERAÇÕES DA CAMPANHA
         * -------------------------------------------------
         */

        canal.on(

            "postgres_changes",

            {
                event: "*",

                schema: "public",

                table: "campanhas",

                filter:
                    `id=eq.${MesaOnline.campanhaId}`

            },

            payload => {

                processarAlteracaoCampanha(
                    payload
                );

            }

        );


        /*
         * -------------------------------------------------
         * CONECTAR
         * -------------------------------------------------
         */

        canal.subscribe(status => {

            console.log(
                "[MESA ONLINE] Realtime:",
                status
            );


            if (status === "SUBSCRIBED") {

                MesaOnline.inscrito = true;

                emitir(
                    "realtime-conectado"
                );

            }


            if (
                status === "CHANNEL_ERROR" ||
                status === "TIMED_OUT"
            ) {

                emitir(
                    "realtime-erro",
                    status
                );

            }

        });


        MesaOnline.canais.push(canal);

    }


    /* =====================================================
       PROCESSAR SLOT
    ===================================================== */

    function processarAlteracaoSlot(
        payload
    ) {

        const novo =
            payload.new;

        const antigo =
            payload.old;


        if (payload.eventType === "INSERT") {

            MesaOnline.estado.slots.push(
                novo
            );

        }


        else if (
            payload.eventType === "UPDATE"
        ) {

            const index =
                MesaOnline.estado.slots.findIndex(
                    slot =>
                        slot.id === novo.id
                );


            if (index !== -1) {

                MesaOnline.estado.slots[index] =
                    novo;

            }

            else {

                MesaOnline.estado.slots.push(
                    novo
                );

            }

        }


        else if (
            payload.eventType === "DELETE"
        ) {

            MesaOnline.estado.slots =
                MesaOnline.estado.slots.filter(
                    slot =>
                        slot.id !== antigo.id
                );

        }


        identificarMeuSlot();


        emitir(
            "slot-alterado",
            {
                payload,
                slots:
                    MesaOnline.estado.slots
            }
        );

    }


    /* =====================================================
       PROCESSAR PERSONAGEM
    ===================================================== */

    function processarAlteracaoPersonagem(
        payload
    ) {

        const novo =
            payload.new;

        const antigo =
            payload.old;


        if (payload.eventType === "INSERT") {

            MesaOnline.estado.personagens.push(
                novo
            );

        }


        else if (
            payload.eventType === "UPDATE"
        ) {

            const index =
                MesaOnline.estado.personagens.findIndex(
                    personagem =>
                        personagem.id === novo.id
                );


            if (index !== -1) {

                MesaOnline.estado.personagens[index] =
                    novo;

            }

            else {

                MesaOnline.estado.personagens.push(
                    novo
                );

            }

        }


        else if (
            payload.eventType === "DELETE"
        ) {

            MesaOnline.estado.personagens =
                MesaOnline.estado.personagens.filter(
                    personagem =>
                        personagem.id !== antigo.id
                );

        }


        emitir(
            "personagem-alterado",
            {
                payload,
                personagens:
                    MesaOnline.estado.personagens
            }
        );

    }


    /* =====================================================
       PROCESSAR CAMPANHA
    ===================================================== */

    function processarAlteracaoCampanha(
        payload
    ) {

        if (
            payload.eventType === "DELETE"
        ) {

            MesaOnline.estado.campanha =
                null;

        }

        else {

            MesaOnline.estado.campanha =
                payload.new;

        }


        emitir(
            "campanha-alterada",
            payload
        );

    }


    /* =====================================================
       ATUALIZAR SLOT
    ===================================================== */

    MesaOnline.atualizarSlot = async function (
        slotId,
        dados
    ) {

        if (!MesaOnline.supabase) {
            throw new Error(
                "Supabase não inicializado."
            );
        }


        if (!MesaOnline.campanhaId) {
            throw new Error(
                "Campanha não identificada."
            );
        }


        const {
            data,
            error
        } = await MesaOnline.supabase
            .from("slots_personagem")
            .update(dados)
            .eq("id", slotId)
            .eq(
                "campanha_id",
                MesaOnline.campanhaId
            )
            .select()
            .single();


        if (error) {

            console.error(
                "[MESA ONLINE] Erro ao atualizar slot:",
                error
            );

            emitir(
                "erro-operacao",
                error
            );

            throw error;

        }


        return data;

    };


    /* =====================================================
       ATUALIZAR PERSONAGEM
    ===================================================== */

    MesaOnline.atualizarPersonagem =
        async function (
            personagemId,
            dados
        ) {

            if (!MesaOnline.supabase) {

                throw new Error(
                    "Supabase não inicializado."
                );

            }


            const {
                data,
                error
            } =
                await MesaOnline.supabase
                    .from("personagens")
                    .update(dados)
                    .eq(
                        "id",
                        personagemId
                    )
                    .eq(
                        "campanha_id",
                        MesaOnline.campanhaId
                    )
                    .select()
                    .single();


            if (error) {

                console.error(
                    "[MESA ONLINE] Erro ao atualizar personagem:",
                    error
                );

                emitir(
                    "erro-operacao",
                    error
                );

                throw error;

            }


            return data;

        };


    /* =====================================================
       ATUALIZAR MEU PERSONAGEM
    ===================================================== */

    MesaOnline.atualizarMeuPersonagem =
        async function (
            dados
        ) {

            if (
                !MesaOnline.personagemId
            ) {

                throw new Error(
                    "Este jogador não possui personagem."
                );

            }


            return MesaOnline.atualizarPersonagem(
                MesaOnline.personagemId,
                dados
            );

        };


    /* =====================================================
       ENVIAR ESTADO DE COMBATE
    ===================================================== */

    MesaOnline.enviarEstadoCombate =
        async function (
            dados
        ) {

            /*
             * Esta função fica preparada para a tabela
             * definitiva do sistema de combate.
             *
             * NÃO cria uma tabela automaticamente.
             */

            emitir(
                "combate-enviado",
                dados
            );


            return dados;

        };


    /* =====================================================
       RECARREGAR ESTADO
    ===================================================== */

    MesaOnline.recarregar = async function () {

        await carregarEstadoInicial();

        emitir(
            "estado-recarregado",
            MesaOnline.estado
        );


        return MesaOnline.estado;

    };


    /* =====================================================
       GETTERS
    ===================================================== */

    MesaOnline.getEstado = function () {

        return MesaOnline.estado;

    };


    MesaOnline.getCampanhaId = function () {

        return MesaOnline.campanhaId;

    };


    MesaOnline.getUsuarioId = function () {

        return MesaOnline.usuarioId;

    };


    MesaOnline.getPersonagemId = function () {

        return MesaOnline.personagemId;

    };


    MesaOnline.getSlotId = function () {

        return MesaOnline.slotId;

    };


    /* =====================================================
       DESCONECTAR
    ===================================================== */

    MesaOnline.desconectar = async function () {

        MesaOnline.canais.forEach(
            canal => {

                try {

                    MesaOnline.supabase.removeChannel(
                        canal
                    );

                } catch (erro) {

                    console.warn(
                        "[MESA ONLINE] Erro ao remover canal:",
                        erro
                    );

                }

            }
        );


        MesaOnline.canais = [];

        MesaOnline.inscrito = false;

        MesaOnline.inicializado = false;


        emitir(
            "desconectado"
        );

    };


    /* =====================================================
       EXPOR GLOBALMENTE
    ===================================================== */

    window.MesaOnline = MesaOnline;


    console.log(
        "[MESA ONLINE] módulo carregado."
    );


})();
