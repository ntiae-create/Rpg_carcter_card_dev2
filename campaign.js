/* =========================================================
   CAMPAIGN.JS
   SISTEMA DE CAMPANHAS / CÓDIGO DA MESA
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       ESTADO
    ===================================================== */

    window.rpgCampaign = {

        campaigns: [],

        activeCampaign: null,

        loaded: false

    };


    /* =====================================================
       NORMALIZAÇÃO
    ===================================================== */

    function normalizarCodigoMesa(codigo) {

        return String(codigo || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");

    }


    /* =====================================================
       CLIENTE SUPABASE
    ===================================================== */

    function obterSupabase() {

        /*
         * O auth.js utiliza supabaseClient.
         *
         * Mantemos window.supabase como compatibilidade
         * caso algum arquivo antigo ainda o utilize.
         */

        return (
            window.supabaseClient ||
            window.supabase ||
            null
        );

    }


    /* =====================================================
       EVENTO DE CAMPANHA
    ===================================================== */

    function dispararEventoCampanha() {

        try {

            window.dispatchEvent(

                new CustomEvent(
                    "mesa:campanhaAlterada",
                    {
                        detail: {
                            campanha:
                                window.rpgCampaign
                                    .activeCampaign
                        }
                    }
                )

            );

        }

        catch (erro) {

            console.warn(
                "[Campaign] Não foi possível disparar evento:",
                erro
            );

        }

    }


    /* =====================================================
       CAMPANHAS
    ===================================================== */

    async function carregarCampanhas() {

        const supabase =
            obterSupabase();


        if (
            !supabase ||
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {

            console.warn(
                "[Campaign] Usuário ou Supabase ainda não disponível."
            );

            return [];

        }


        const userId =
            window.rpgAuth.user.id;


        try {

            /* =============================================
               CAMPANHAS ONDE O USUÁRIO É MESTRE
            ============================================= */

            const {

                data: campanhasMestre,

                error: erroMestre

            } =
                await supabase

                    .from("campaigns")

                    .select(`
                        id,
                        name,
                        master_id,
                        codigo_mesa,
                        created_at
                    `)

                    .eq(
                        "master_id",
                        userId
                    );


            if (erroMestre) {

                console.error(
                    "[Campaign] Erro ao carregar campanhas do mestre:",
                    erroMestre
                );

            }


            /* =============================================
               CAMPANHAS ONDE O USUÁRIO É JOGADOR
            ============================================= */

            const {

                data: membros,

                error: erroMembros

            } =
                await supabase

                    .from("campaign_members")

                    .select(
                        "campaign_id"
                    )

                    .eq(
                        "user_id",
                        userId
                    );


            if (erroMembros) {

                console.error(
                    "[Campaign] Erro ao carregar membros:",
                    erroMembros
                );

            }


            const idsCampanhasJogador =

                (membros || [])

                    .map(
                        membro =>
                            membro.campaign_id
                    )

                    .filter(Boolean);


            let campanhasJogador = [];


            /* =============================================
               BUSCAR CAMPANHAS DOS MEMBROS
            ============================================= */

            if (
                idsCampanhasJogador.length > 0
            ) {

                const {

                    data,

                    error

                } =
                    await supabase

                        .from("campaigns")

                        .select(`
                            id,
                            name,
                            master_id,
                            codigo_mesa,
                            created_at
                        `)

                        .in(
                            "id",
                            idsCampanhasJogador
                        );


                if (error) {

                    console.error(
                        "[Campaign] Erro ao carregar campanhas do jogador:",
                        error
                    );

                }

                else {

                    campanhasJogador =
                        data || [];

                }

            }


            /* =============================================
               JUNTAR CAMPANHAS
            ============================================= */

            const mapa =
                new Map();


            [
                ...(campanhasMestre || []),
                ...campanhasJogador
            ]

                .forEach(
                    campanha => {

                        if (
                            campanha &&
                            campanha.id
                        ) {

                            mapa.set(
                                String(campanha.id),
                                campanha
                            );

                        }

                    }
                );


            const campanhas =
                Array.from(
                    mapa.values()
                );


            window.rpgCampaign.campaigns =
                campanhas;


            window.rpgCampaign.loaded =
                true;


            /* =============================================
               VALIDAR CAMPANHA QUE JÁ ESTAVA ATIVA
            ============================================= */

            const campanhaAnterior =
                window.rpgCampaign
                    .activeCampaign;


            if (
                campanhaAnterior &&
                campanhaAnterior.id
            ) {

                const campanhaEncontrada =
                    campanhas.find(
                        campanha =>
                            String(
                                campanha.id
                            ) ===
                            String(
                                campanhaAnterior.id
                            )
                    );


                if (campanhaEncontrada) {

                    /*
                     * Atualizamos os dados da campanha
                     * sem selecionar outra automaticamente.
                     */

                    window.rpgCampaign
                        .activeCampaign =
                        campanhaEncontrada;

                }

                else {

                    /*
                     * A campanha ativa anterior não
                     * pertence mais ao usuário.
                     */

                    window.rpgCampaign
                        .activeCampaign =
                        null;

                }

            }


            /*
             * IMPORTANTE:
             *
             * Se não havia campanha ativa,
             * continuamos com null.
             *
             * NUNCA fazemos:
             *
             * campaigns[0]
             */

            sincronizarCampanhaAuth();


            console.log(
                "[Campaign] Campanhas carregadas:",
                campanhas
            );


            console.log(
                "[Campaign] Campanha ativa:",
                window.rpgCampaign
                    .activeCampaign
            );


            return campanhas;

        }

        catch (erro) {

            console.error(
                "[Campaign] Erro inesperado:",
                erro
            );


            window.rpgCampaign.loaded =
                true;


            return [];

        }

    }


    /* =====================================================
       CAMPANHA ATIVA
    ===================================================== */

    function obterCampanhaAtiva() {

        return (
            window.rpgCampaign
                .activeCampaign ||
            null
        );

    }


    function obterCampanhas() {

        return (
            window.rpgCampaign
                .campaigns ||
            []
        );

    }


    /* =====================================================
       DEFINIR CAMPANHA ATIVA
    ===================================================== */

    function definirCampanhaAtiva(
        campanha
    ) {

        /*
         * Desativar campanha.
         */

        if (!campanha) {

            window.rpgCampaign
                .activeCampaign =
                null;


            sincronizarCampanhaAuth();


            dispararEventoCampanha();


            console.log(
                "[Campaign] Nenhuma campanha ativa."
            );


            return null;

        }


        /*
         * Garantia mínima de estrutura.
         */

        if (!campanha.id) {

            console.warn(
                "[Campaign] Tentativa de ativar campanha sem ID:",
                campanha
            );


            return null;

        }


        /*
         * Se a campanha já estiver na lista,
         * usamos a versão armazenada nela.
         */

        const campanhaEncontrada =
            encontrarCampanhaPorId(
                campanha.id
            );


        window.rpgCampaign
            .activeCampaign =

            campanhaEncontrada ||
            campanha;


        /*
         * Atualiza o estado local do auth
         * imediatamente.
         */

        sincronizarCampanhaAuth();


        /*
         * Informa o restante do sistema.
         *
         * O auth.js escuta este evento e carrega
         * membros/personagens da campanha.
         */

        dispararEventoCampanha();


        console.log(
            "[Campaign] Campanha ativa:",
            window.rpgCampaign
                .activeCampaign
        );


        return (
            window.rpgCampaign
                .activeCampaign
        );

    }


    /* =====================================================
       CÓDIGO DA MESA
    ===================================================== */

    function obterCodigoMesa(
        campanha = null
    ) {

        const alvo =
            campanha ||
            window.rpgCampaign
                .activeCampaign;


        if (!alvo) {

            return null;

        }


        return (
            alvo.codigo_mesa ||
            null
        );

    }


    /* =====================================================
       BUSCAR CAMPANHA PELO CÓDIGO
    ===================================================== */

    async function buscarCampanhaPorCodigo(
        codigo
    ) {

        const codigoNormalizado =
            normalizarCodigoMesa(
                codigo
            );


        if (!codigoNormalizado) {

            return null;

        }


        const supabase =
            obterSupabase();


        if (!supabase) {

            console.error(
                "[Campaign] Supabase não disponível."
            );


            return null;

        }


        try {

            const {

                data,

                error

            } =
                await supabase

                    .from("campaigns")

                    .select(`
                        id,
                        name,
                        master_id,
                        codigo_mesa,
                        created_at
                    `)

                    .eq(
                        "codigo_mesa",
                        codigoNormalizado
                    )

                    .maybeSingle();


            if (error) {

                console.error(
                    "[Campaign] Erro ao procurar código da mesa:",
                    error
                );


                return null;

            }


            return data || null;

        }

        catch (erro) {

            console.error(
                "[Campaign] Erro inesperado ao procurar mesa:",
                erro
            );


            return null;

        }

    }


    /* =====================================================
       SINCRONIZAÇÃO COM AUTH
    ===================================================== */

    function sincronizarCampanhaAuth() {

        if (!window.rpgAuth) {

            return;

        }


        const campanha =
            window.rpgCampaign
                .activeCampaign ||
            null;


        window.rpgAuth.campaign =
            campanha;


        window.rpgAuth.campaigns =
            window.rpgCampaign
                .campaigns || [];


        /*
         * Atualiza o status de mestre.
         *
         * Não fazemos aqui a consulta de membros.
         *
         * O auth.js já possui o listener de
         * mesa:campanhaAlterada que faz isso.
         */

        if (
            window.rpgAuth.user &&
            campanha &&
            campanha.master_id
        ) {

            window.rpgAuth.isMaster =

                String(
                    window.rpgAuth.user.id
                ) ===

                String(
                    campanha.master_id
                );

        }

        else {

            window.rpgAuth.isMaster =
                false;

        }

    }


    /* =====================================================
       ENCONTRAR CAMPANHA PELO ID
    ===================================================== */

    function encontrarCampanhaPorId(
        id
    ) {

        if (!id) {

            return null;

        }


        return (

            window.rpgCampaign
                .campaigns || []

        ).find(

            campanha =>

                campanha &&

                String(
                    campanha.id
                ) ===

                String(id)

        ) || null;

    }


    /* =====================================================
       SELECIONAR CAMPANHA PELO ID
    ===================================================== */

    async function selecionarCampanhaPorId(
        id
    ) {

        if (!id) {

            return null;

        }


        const supabase =
            obterSupabase();


        let campanha =
            encontrarCampanhaPorId(
                id
            );


        /*
         * Se ainda não estiver carregada,
         * busca diretamente no banco.
         */

        if (
            !campanha &&
            supabase
        ) {

            try {

                const {

                    data,

                    error

                } =
                    await supabase

                        .from("campaigns")

                        .select(`
                            id,
                            name,
                            master_id,
                            codigo_mesa,
                            created_at
                        `)

                        .eq(
                            "id",
                            id
                        )

                        .maybeSingle();


                if (error) {

                    console.error(
                        "[Campaign] Erro ao buscar campanha por ID:",
                        error
                    );


                    return null;

                }


                campanha =
                    data || null;

            }

            catch (erro) {

                console.error(
                    "[Campaign] Erro inesperado ao buscar campanha por ID:",
                    erro
                );


                return null;

            }

        }


        if (!campanha) {

            console.warn(
                "[Campaign] Campanha não encontrada:",
                id
            );


            return null;

        }


        /*
         * Se ela ainda não estiver na lista,
         * adicionamos para manter o estado consistente.
         */

        if (
            !encontrarCampanhaPorId(
                campanha.id
            )
        ) {

            window.rpgCampaign
                .campaigns
                .push(campanha);

        }


        /*
         * Agora sim a campanha é explicitamente
         * selecionada.
         */

        definirCampanhaAtiva(
            campanha
        );


        return campanha;

    }


    /* =====================================================
       SELECIONAR CAMPANHA PELO CÓDIGO
    ===================================================== */

    async function selecionarCampanhaPorCodigo(
        codigo
    ) {

        const campanha =
            await buscarCampanhaPorCodigo(
                codigo
            );


        if (!campanha) {

            return null;

        }


        /*
         * Adiciona à lista caso ainda não exista.
         */

        const existente =
            encontrarCampanhaPorId(
                campanha.id
            );


        if (!existente) {

            window.rpgCampaign
                .campaigns
                .push(campanha);

        }


        /*
         * A partir daqui a entrada na campanha
         * é explícita.
         */

        definirCampanhaAtiva(
            campanha
        );


        return campanha;

    }


    /* =====================================================
       LIMPAR CAMPANHA ATIVA
    ===================================================== */

    function limparCampanhaAtiva() {

        definirCampanhaAtiva(
            null
        );

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    async function inicializar() {

        if (
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {

            return;

        }


        await carregarCampanhas();

    }


    /*
     * Aguarda o auth.js disponibilizar
     * o usuário autenticado.
     */

    let tentativas = 0;


    const intervaloInicializacao =

        setInterval(

            async () => {

                tentativas++;


                if (
                    window.rpgAuth &&
                    window.rpgAuth.user
                ) {

                    clearInterval(
                        intervaloInicializacao
                    );


                    await inicializar();


                    return;

                }


                if (
                    tentativas >= 40
                ) {

                    clearInterval(
                        intervaloInicializacao
                    );


                    console.warn(
                        "[Campaign] Usuário não ficou disponível durante a inicialização."
                    );

                }

            },

            250

        );


    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.rpgCampaign.carregarCampanhas =
        carregarCampanhas;


    window.rpgCampaign.obterCampanhaAtiva =
        obterCampanhaAtiva;


    window.rpgCampaign.obterCampanhas =
        obterCampanhas;


    window.rpgCampaign.definirCampanhaAtiva =
        definirCampanhaAtiva;


    window.rpgCampaign.obterCodigoMesa =
        obterCodigoMesa;


    window.rpgCampaign.buscarCampanhaPorCodigo =
        buscarCampanhaPorCodigo;


    window.rpgCampaign.encontrarCampanhaPorId =
        encontrarCampanhaPorId;


    window.rpgCampaign.selecionarCampanhaPorId =
        selecionarCampanhaPorId;


    window.rpgCampaign.selecionarCampanhaPorCodigo =
        selecionarCampanhaPorCodigo;


    window.rpgCampaign.limparCampanhaAtiva =
        limparCampanhaAtiva;


    /* =====================================================
       COMPATIBILIDADE
    ===================================================== */

    window.carregarCampanhas =
        carregarCampanhas;


    window.obterCampanhaAtiva =
        obterCampanhaAtiva;


    window.obterCodigoMesa =
        obterCodigoMesa;


    window.buscarCampanhaPorCodigo =
        buscarCampanhaPorCodigo;


    window.definirCampanhaAtiva =
        definirCampanhaAtiva;


    window.selecionarCampanhaPorId =
        selecionarCampanhaPorId;


    window.selecionarCampanhaPorCodigo =
        selecionarCampanhaPorCodigo;


})();
