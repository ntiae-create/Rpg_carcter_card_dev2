// ==========================================
// AUTENTICAÇÃO — RPG CHARACTER CARD
// ==========================================

(function () {
    "use strict";


    // ==========================================
    // ESTADO DA AUTENTICAÇÃO
    // ==========================================

    window.rpgAuth = {
        user: null,
        session: null,

        // Campanha atualmente ativa.
        // IMPORTANTE:
        // Nunca escolher automaticamente a primeira campanha.
        campaign: null,

        // Todas as campanhas que pertencem
        // ou estão vinculadas ao usuário.
        campaigns: [],

        // Verdadeiro somente quando a campanha
        // ativa pertence ao usuário como mestre.
        isMaster: false,

        campaignMembers: [],
        campaignCharacters: [],

        profile: null
    };


    // ==========================================
    // MENSAGEM DE LOGIN
    // ==========================================

    function mostrarMensagem(texto, sucesso = false) {

        const mensagem =
            document.getElementById("auth-message");

        if (!mensagem) return;

        mensagem.textContent = texto;

        mensagem.style.color =
            sucesso
                ? "#86efac"
                : "#fca5a5";
    }


    // ==========================================
    // DIAGNÓSTICO VISUAL
    // ==========================================

    function mostrarDiagnostico(texto, tipo = "info") {

        let elemento =
            document.getElementById("auth-diagnostic");


        if (!elemento) {

            elemento =
                document.createElement("div");


            elemento.id =
                "auth-diagnostic";


            Object.assign(
                elemento.style,
                {
                    position: "fixed",
                    bottom: "15px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: "99999",
                    width: "min(92vw, 520px)",
                    padding: "12px 15px",
                    borderRadius: "12px",
                    background: "rgba(11, 9, 16, 0.97)",
                    border: "1px solid #6f3aa8",
                    boxShadow:
                        "0 0 20px rgba(124, 58, 237, 0.30)",
                    textAlign: "center",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    opacity: "1",
                    transition: "opacity 0.4s ease"
                }
            );


            document.body.appendChild(
                elemento
            );

        }


        if (elemento._diagnosticoTimer) {

            clearTimeout(
                elemento._diagnosticoTimer
            );

        }


        if (tipo === "sucesso") {

            elemento.style.color =
                "#86efac";

        }

        else if (tipo === "erro") {

            elemento.style.color =
                "#fca5a5";

        }

        else if (tipo === "aviso") {

            elemento.style.color =
                "#fde68a";

        }

        else {

            elemento.style.color =
                "#c4b5fd";

        }


        elemento.style.opacity =
            "1";

        elemento.textContent =
            texto;


        let tempo = 3000;


        if (tipo === "erro") {

            tempo = 6000;

        }

        else if (tipo === "aviso") {

            tempo = 4500;

        }

        else if (tipo === "info") {

            tempo = 2500;

        }


        elemento._diagnosticoTimer =
            setTimeout(
                function () {

                    elemento.style.opacity =
                        "0";


                    setTimeout(
                        function () {

                            if (
                                elemento &&
                                elemento.parentNode
                            ) {

                                elemento.remove();

                            }

                        },
                        400
                    );

                },
                tempo
            );

    }


    // ==========================================
    // ATUALIZAR STATUS DE MESTRE
    // ==========================================

    function atualizarStatusMestre() {

        const usuario =
            window.rpgAuth.user;

        const campanha =
            window.rpgAuth.campaign;


        if (
            !usuario ||
            !campanha ||
            !campanha.master_id
        ) {

            window.rpgAuth.isMaster =
                false;

            return false;

        }


        const usuarioId =
            String(usuario.id);


        const mestreId =
            String(campanha.master_id);


        window.rpgAuth.isMaster =
            usuarioId === mestreId;


        console.log(
            "🎲 RPG AUTH — Verificação de Mestre:",
            {
                usuarioId,
                mestreId,
                campanha:
                    campanha.name ||
                    campanha.nome ||
                    campanha.id,
                isMaster:
                    window.rpgAuth.isMaster
            }
        );


        return window.rpgAuth.isMaster;

    }


    // ==========================================
    // SINCRONIZAR CAMPANHA ATIVA
    // ==========================================
    //
    // Esta função é usada pelo campaign.js.
    //
    // Quando campaign.js define uma campanha,
    // o auth.js recebe essa campanha e recalcula
    // imediatamente se o usuário é o mestre.
    // ==========================================

    async function sincronizarCampanhaAtiva(
        campanha
    ) {

        if (!campanha || !campanha.id) {

            window.rpgAuth.campaign =
                null;

            window.rpgAuth.isMaster =
                false;

            window.rpgAuth.campaignMembers =
                [];

            window.rpgAuth.campaignCharacters =
                [];

            return false;
        }


        const campanhaEncontrada =
            (window.rpgAuth.campaigns || [])
                .find(
                    item =>
                        item &&
                        String(item.id) ===
                        String(campanha.id)
                );


        if (campanhaEncontrada) {

            window.rpgAuth.campaign =
                campanhaEncontrada;

        }

        else {

            /*
             * A campanha pode ter acabado de ser
             * criada ou carregada pelo campaign.js.
             *
             * Nesse caso preservamos os dados
             * recebidos, desde que exista ID.
             */

            window.rpgAuth.campaign =
                campanha;

        }


        atualizarStatusMestre();


        /*
         * Carrega os membros/personagens somente
         * depois de definir a campanha ativa.
         */

        await carregarDadosCampanha();


        /*
         * Informa ao restante do sistema que o
         * contexto de autenticação foi atualizado.
         */

        try {

            window.dispatchEvent(
                new CustomEvent(
                    "rpgAuth:campanhaSincronizada",
                    {
                        detail: {
                            campanha:
                                window.rpgAuth.campaign,

                            isMaster:
                                window.rpgAuth.isMaster
                        }
                    }
                )
            );

        }

        catch (error) {

            console.warn(
                "⚠️ Não foi possível disparar evento de sincronização:",
                error
            );

        }


        return true;

    }


    // ==========================================
    // LIMPAR DADOS DA CAMPANHA
    // ==========================================

    function limparDadosCampanha() {

        window.rpgAuth.campaign =
            null;

        window.rpgAuth.campaigns =
            [];

        window.rpgAuth.isMaster =
            false;

        window.rpgAuth.campaignMembers =
            [];

        window.rpgAuth.campaignCharacters =
            [];

    }


    // ==========================================
    // CARREGAR PERFIL DO USUÁRIO
    // ==========================================

    async function carregarPerfil(user) {

        if (!window.supabaseClient) {

            return false;
        }


        if (!user) {

            window.rpgAuth.profile =
                null;

            return false;
        }


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("profiles")
                    .select(
                        "id, username, created_at"
                    )
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();


            if (error) {

                console.error(
                    "❌ ERRO AO CARREGAR PERFIL:",
                    error
                );

                window.rpgAuth.profile =
                    null;

                return false;
            }


            window.rpgAuth.profile =
                data || null;


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO CARREGAR PERFIL:",
                error
            );

            window.rpgAuth.profile =
                null;

            return false;
        }

    }


    // ==========================================
    // CRIAR PERFIL
    // ==========================================

    async function criarPerfil(
        user,
        username
    ) {

        if (!window.supabaseClient) {

            return false;
        }


        if (!user || !username) {

            return false;
        }


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("profiles")
                    .insert({

                        id:
                            user.id,

                        username:
                            username.trim()

                    })
                    .select(
                        "id, username, created_at"
                    )
                    .single();


            if (error) {

                console.error(
                    "❌ ERRO AO CRIAR PERFIL:",
                    error
                );


                mostrarDiagnostico(
                    `❌ Não foi possível criar o perfil: ${error.message}`,
                    "erro"
                );


                return false;
            }


            window.rpgAuth.profile =
                data;


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO CRIAR PERFIL:",
                error
            );


            return false;
        }

    }


    // ==========================================
    // REENVIAR CONFIRMAÇÃO DE E-MAIL
    // ==========================================

    async function reenviarConfirmacaoEmail(
        email
    ) {

        if (!window.supabaseClient) {

            mostrarMensagem(
                "Supabase não está disponível."
            );

            return false;
        }


        email =
            email?.trim();


        if (!email) {

            mostrarMensagem(
                "Digite seu e-mail primeiro."
            );

            return false;
        }


        try {

            mostrarMensagem(
                "Enviando confirmação..."
            );


            const {
                error
            } =
                await window.supabaseClient.auth
                    .resend({

                        type:
                            "signup",

                        email:
                            email

                    });


            if (error) {

                console.error(
                    "❌ ERRO AO REENVIAR CONFIRMAÇÃO:",
                    error
                );


                mostrarMensagem(
                    `Não foi possível reenviar: ${error.message}`
                );


                mostrarDiagnostico(
                    `❌ ${error.message}`,
                    "erro"
                );


                return false;
            }


            mostrarMensagem(
                "E-mail de confirmação reenviado!",
                true
            );


            mostrarDiagnostico(
                "📧 Verifique sua caixa de entrada e também a pasta de spam.",
                "sucesso"
            );


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO REENVIAR CONFIRMAÇÃO:",
                error
            );


            mostrarMensagem(
                "Não foi possível reenviar o e-mail."
            );


            return false;
        }

    }


    // ==========================================
    // MOSTRAR BOTÃO DE CONFIRMAÇÃO
    // ==========================================

    function mostrarBotaoConfirmacao(
        email
    ) {

        const container =
            document.getElementById(
                "auth-confirmation-area"
            );


        if (!container) {

            return;

        }


        container.innerHTML =
            "";


        const botao =
            document.createElement(
                "button"
            );


        botao.type =
            "button";


        botao.textContent =
            "REENVIAR CONFIRMAÇÃO DO E-MAIL";


        Object.assign(
            botao.style,
            {
                width: "100%",
                padding: "10px",
                marginTop: "8px",
                border: "1px solid #8b5cf6",
                borderRadius: "10px",
                background: "#100b18",
                color: "#c084fc",
                fontWeight: "bold",
                cursor: "pointer"
            }
        );


        botao.addEventListener(
            "click",
            async function () {

                botao.disabled =
                    true;


                botao.style.opacity =
                    "0.6";


                await reenviarConfirmacaoEmail(
                    email
                );


                botao.disabled =
                    false;


                botao.style.opacity =
                    "1";

            }
        );


        container.appendChild(
            botao
        );

    }


    // ==========================================
    // CARREGAR MEMBROS DA CAMPANHA
    // ==========================================

    async function carregarMembrosCampanha(
        campaignId
    ) {

        if (!window.supabaseClient) {

            return false;
        }


        if (!campaignId) {

            window.rpgAuth.campaignMembers =
                [];

            return false;
        }


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("campaign_members")
                    .select(
                        "id, campaign_id, user_id"
                    )
                    .eq(
                        "campaign_id",
                        campaignId
                    );


            if (error) {

                console.error(
                    "❌ ERRO AO CONSULTAR CAMPAIGN_MEMBERS:",
                    error
                );


                mostrarDiagnostico(
                    `❌ Erro ao carregar jogadores: ${error.message}`,
                    "erro"
                );


                window.rpgAuth.campaignMembers =
                    [];

                return false;
            }


            window.rpgAuth.campaignMembers =
                data || [];


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO CARREGAR MEMBROS:",
                error
            );


            window.rpgAuth.campaignMembers =
                [];

            return false;
        }

    }


    // ==========================================
    // CARREGAR PERSONAGENS DA CAMPANHA
    // ==========================================

    async function carregarPersonagensCampanha(
        campaignId
    ) {

        if (!window.supabaseClient) {

            return false;
        }


        if (!campaignId) {

            window.rpgAuth.campaignCharacters =
                [];

            return false;
        }


        try {

            console.log(
                "🔎 RPG AUTH — Buscando personagens da campanha:",
                campaignId
            );


            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("characters")
                    .select("*")
                    .eq(
                        "campaign_id",
                        campaignId
                    );


            if (error) {

                console.error(
                    "❌ ERRO AO CONSULTAR CHARACTERS:",
                    error
                );


                mostrarDiagnostico(
                    `❌ Erro ao carregar personagens: ${error.message}`,
                    "erro"
                );


                window.rpgAuth.campaignCharacters =
                    [];

                return false;
            }


            window.rpgAuth.campaignCharacters =
                data || [];


            console.log(
                "✅ RPG AUTH — Personagens encontrados:",
                window.rpgAuth.campaignCharacters
            );


            console.log(
                "📊 RPG AUTH — Quantidade de personagens:",
                window.rpgAuth.campaignCharacters.length
            );


            if (
                window.rpgAuth.campaignCharacters.length === 0
            ) {

                console.warn(
                    "⚠️ Nenhum personagem encontrado para esta conta/campanha.",
                    {
                        campaignId,
                        userId:
                            window.rpgAuth.user?.id ||
                            null
                    }
                );

            }


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO CARREGAR PERSONAGENS:",
                error
            );


            window.rpgAuth.campaignCharacters =
                [];


            mostrarDiagnostico(
                `❌ Erro inesperado ao carregar personagens: ${error.message}`,
                "erro"
            );


            return false;
        }

    }


    // ==========================================
    // CARREGAR DADOS COMPLETOS DA CAMPANHA
    // ==========================================

    async function carregarDadosCampanha() {

        if (
            !window.rpgAuth.campaign
        ) {

            window.rpgAuth.campaignMembers =
                [];

            window.rpgAuth.campaignCharacters =
                [];

            return false;
        }


        const campaignId =
            window.rpgAuth.campaign.id;


        if (!campaignId) {

            window.rpgAuth.campaignMembers =
                [];

            window.rpgAuth.campaignCharacters =
                [];

            return false;
        }


        const membrosCarregados =
            await carregarMembrosCampanha(
                campaignId
            );


        if (!membrosCarregados) {

            return false;
        }


        await carregarPersonagensCampanha(
            campaignId
        );


        return true;

    }


    // ==========================================
    // CARREGAR CAMPANHAS DO USUÁRIO
    // ==========================================

    async function carregarCampanhas(
        user
    ) {

        if (!window.supabaseClient) {

            mostrarDiagnostico(
                "❌ Supabase Client não encontrado.",
                "erro"
            );

            return false;
        }


        if (!user) {

            return false;
        }


        try {

            // ==================================
            // CAMPANHAS DO MESTRE
            // ==================================

            const {
                data: campanhasMestre,
                error: erroMestre
            } =
                await window.supabaseClient
                    .from("campaigns")
                    .select(
                        "id, name, master_id, created_at"
                    )
                    .eq(
                        "master_id",
                        user.id
                    );


            if (erroMestre) {

                console.error(
                    "❌ ERRO AO CONSULTAR CAMPANHAS DO MESTRE:",
                    erroMestre
                );


                mostrarDiagnostico(
                    `❌ Erro ao consultar campanhas: ${erroMestre.message}`,
                    "erro"
                );


                return false;
            }


            // ==================================
            // CAMPANHAS ONDE É MEMBRO
            // ==================================

            const {
                data: participacoes,
                error: erroParticipacoes
            } =
                await window.supabaseClient
                    .from("campaign_members")
                    .select(
                        "id, campaign_id, user_id"
                    )
                    .eq(
                        "user_id",
                        user.id
                    );


            if (erroParticipacoes) {

                console.error(
                    "❌ ERRO AO CONSULTAR PARTICIPAÇÕES:",
                    erroParticipacoes
                );


                mostrarDiagnostico(
                    `❌ Erro ao consultar participações: ${erroParticipacoes.message}`,
                    "erro"
                );


                return false;
            }


            const campaignIds =
                (participacoes || [])
                    .map(
                        membro =>
                            membro.campaign_id
                    )
                    .filter(
                        id =>
                            !!id
                    );


            // ==================================
            // CAMPANHAS DOS MEMBROS
            // ==================================

            let campanhasMembro =
                [];


            if (
                campaignIds.length > 0
            ) {

                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .from("campaigns")
                        .select(
                            "id, name, master_id, created_at"
                        )
                        .in(
                            "id",
                            campaignIds
                        );


                if (error) {

                    console.error(
                        "❌ ERRO AO CONSULTAR CAMPANHAS DOS MEMBROS:",
                        error
                    );


                    mostrarDiagnostico(
                        `❌ Erro ao consultar campanhas: ${error.message}`,
                        "erro"
                    );


                    return false;
                }


                campanhasMembro =
                    data || [];

            }


            // ==================================
            // JUNTAR CAMPANHAS
            // ==================================

            const todasCampanhas = [
                ...(campanhasMestre || []),
                ...(campanhasMembro || [])
            ];


            // ==================================
            // REMOVER DUPLICADAS
            // ==================================

            const campanhasUnicas =
                [];


            const idsAdicionados =
                new Set();


            for (
                const campanha
                of todasCampanhas
            ) {

                if (
                    !campanha ||
                    !campanha.id
                ) {

                    continue;
                }


                const idString =
                    String(
                        campanha.id
                    );


                if (
                    idsAdicionados.has(
                        idString
                    )
                ) {

                    continue;
                }


                idsAdicionados.add(
                    idString
                );


                campanhasUnicas.push(
                    campanha
                );

            }


            /*
             * IMPORTANTE:
             *
             * Aqui armazenamos todas as campanhas,
             * mas NÃO ativamos nenhuma.
             */

            window.rpgAuth.campaigns =
                campanhasUnicas;


            // ==================================
            // NENHUMA CAMPANHA
            // ==================================

            if (
                window.rpgAuth.campaigns.length === 0
            ) {

                limparDadosCampanha();


                /*
                 * limparDadosCampanha também limpa
                 * campaigns, então restauramos o
                 * array vazio explicitamente.
                 */

                window.rpgAuth.campaigns =
                    [];


                mostrarDiagnostico(
                    "ℹ️ Conta autenticada. Nenhuma campanha vinculada ainda.",
                    "info"
                );


                return true;
            }


            // ==================================
            // RECUPERAR CAMPANHA QUE JÁ ESTAVA ATIVA
            // ==================================

            let campanhaAtiva =
                null;


            if (
                window.rpgCampaign &&
                typeof window.rpgCampaign
                    .obterCampanhaAtiva ===
                    "function"
            ) {

                try {

                    campanhaAtiva =
                        window.rpgCampaign
                            .obterCampanhaAtiva();

                }

                catch (error) {

                    console.warn(
                        "⚠️ Não foi possível obter campanha ativa pelo campaign.js:",
                        error
                    );

                    campanhaAtiva =
                        null;

                }

            }


            // ==================================
            // VALIDAR CAMPANHA ATIVA
            // ==================================

            if (
                campanhaAtiva &&
                campanhaAtiva.id
            ) {

                const campanhaEncontrada =
                    window.rpgAuth.campaigns.find(
                        campanha =>
                            String(
                                campanha.id
                            ) ===
                            String(
                                campanhaAtiva.id
                            )
                    );


                if (
                    campanhaEncontrada
                ) {

                    window.rpgAuth.campaign =
                        campanhaEncontrada;

                }

                else {

                    /*
                     * A campanha salva anteriormente
                     * não pertence mais ao usuário.
                     */

                    window.rpgAuth.campaign =
                        null;

                }

            }

            else {

                /*
                 * NÃO EXISTE campanha ativa.
                 *
                 * Isso é intencional.
                 */

                window.rpgAuth.campaign =
                    null;

            }


            // ==================================
            // ATUALIZAR MESTRE
            // ==================================

            atualizarStatusMestre();


            // ==================================
            // CARREGAR DADOS DA CAMPANHA ATIVA
            // ==================================

            if (
                window.rpgAuth.campaign
            ) {

                await carregarDadosCampanha();

            }

            else {

                window.rpgAuth.campaignMembers =
                    [];

                window.rpgAuth.campaignCharacters =
                    [];

            }


            // ==================================
            // DIAGNÓSTICO
            // ==================================

            if (
                window.rpgAuth.campaign
            ) {

                mostrarDiagnostico(
                    `✅ Campanha ativa: ${window.rpgAuth.campaign.name}`,
                    "sucesso"
                );

            }

            else {

                mostrarDiagnostico(
                    "ℹ️ Conta autenticada. Nenhuma campanha ativa.",
                    "info"
                );

            }


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO CARREGAR CAMPANHAS:",
                error
            );


            mostrarDiagnostico(
                `⚠️ Login realizado, mas houve um problema ao carregar a campanha: ${error.message}`,
                "aviso"
            );


            return false;
        }

    }


    // ==========================================
    // ATUALIZAR ESTADO DA SESSÃO
    // ==========================================

    async function atualizarEstadoSessao(
        session
    ) {

        window.rpgAuth.session =
            session || null;


        window.rpgAuth.user =
            session?.user || null;


        if (!session?.user) {

            limparDadosCampanha();

            window.rpgAuth.profile =
                null;

            return;
        }


        await carregarPerfil(
            session.user
        );


        await carregarCampanhas(
            session.user
        );


        /*
         * Garantia adicional:
         * se já existir campanha ativa,
         * recalculamos o status do mestre.
         */

        atualizarStatusMestre();

    }


    // ==========================================
    // LOGIN
    // ==========================================

    async function entrarComEmailSenha(
        email,
        senha
    ) {

        if (!window.supabaseClient) {

            mostrarMensagem(
                "Supabase não está disponível."
            );

            return false;
        }


        if (!email || !senha) {

            mostrarMensagem(
                "Preencha e-mail e senha."
            );

            return false;
        }


        email =
            email.trim();


        mostrarMensagem(
            "Entrando..."
        );


        const areaConfirmacao =
            document.getElementById(
                "auth-confirmation-area"
            );


        if (areaConfirmacao) {

            areaConfirmacao.innerHTML =
                "";

        }


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient.auth
                    .signInWithPassword({

                        email:
                            email,

                        password:
                            senha

                    });


            if (error) {

                console.error(
                    "Erro de autenticação:",
                    error
                );


                // ==============================
                // E-MAIL NÃO CONFIRMADO
                // ==============================

                if (
                    error.code ===
                    "email_not_confirmed" ||

                    error.message
                        ?.toLowerCase()
                        .includes(
                            "email not confirmed"
                        )
                ) {

                    mostrarMensagem(
                        "Seu e-mail ainda não foi confirmado."
                    );


                    mostrarDiagnostico(
                        "📧 Confirme seu e-mail antes de entrar.",
                        "aviso"
                    );


                    mostrarBotaoConfirmacao(
                        email
                    );


                    return false;

                }


                // ==============================
                // CREDENCIAIS INVÁLIDAS
                // ==============================

                if (
                    error.code ===
                    "invalid_credentials"
                ) {

                    mostrarMensagem(
                        "E-mail ou senha incorretos."
                    );


                    mostrarDiagnostico(
                        "❌ Verifique o e-mail e a senha.",
                        "erro"
                    );


                    return false;

                }


                // ==============================
                // OUTROS ERROS
                // ==============================

                mostrarMensagem(
                    "Não foi possível entrar."
                );


                mostrarDiagnostico(
                    `❌ ${error.message}`,
                    "erro"
                );


                return false;
            }


            console.log(
                "Usuário autenticado:",
                data.user
            );


            await atualizarEstadoSessao(
                data.session
            );


            mostrarMensagem(
                "Login realizado com sucesso!",
                true
            );


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO NO LOGIN:",
                error
            );


            mostrarMensagem(
                "Não foi possível entrar."
            );


            mostrarDiagnostico(
                `❌ Erro ao entrar: ${error.message}`,
                "erro"
            );


            return false;
        }

    }


    // ==========================================
    // CRIAR CONTA
    // ==========================================

    async function criarConta(
        username,
        email,
        senha
    ) {

        if (!window.supabaseClient) {

            mostrarMensagem(
                "Supabase não está disponível."
            );

            return false;
        }


        username =
            username?.trim();

        email =
            email?.trim();


        if (
            !username ||
            !email ||
            !senha
        ) {

            mostrarMensagem(
                "Preencha nome de usuário, e-mail e senha."
            );

            return false;
        }


        if (
            username.length < 3
        ) {

            mostrarMensagem(
                "O nome de usuário precisa ter pelo menos 3 caracteres."
            );

            return false;
        }


        if (
            senha.length < 6
        ) {

            mostrarMensagem(
                "A senha precisa ter pelo menos 6 caracteres."
            );

            return false;
        }


        mostrarMensagem(
            "Criando conta..."
        );


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient.auth
                    .signUp({

                        email:
                            email,

                        password:
                            senha,

                        options: {

                            data: {

                                username:
                                    username

                            }

                        }

                    });


            if (error) {

                console.error(
                    "❌ ERRO AO CRIAR CONTA:",
                    error
                );


                mostrarMensagem(
                    `Não foi possível criar a conta: ${error.message}`
                );


                mostrarDiagnostico(
                    `❌ ${error.message}`,
                    "erro"
                );


                return false;
            }


            console.log(
                "✅ Conta criada:",
                data.user
            );


            if (
                data.user &&
                data.session
            ) {

                await criarPerfil(
                    data.user,
                    username
                );


                await atualizarEstadoSessao(
                    data.session
                );


                mostrarMensagem(
                    "Conta criada com sucesso!",
                    true
                );


                mostrarDiagnostico(
                    "✅ Conta criada com sucesso!",
                    "sucesso"
                );


                return true;

            }


            mostrarMensagem(
                "Conta criada! Verifique seu e-mail para confirmar a conta.",
                true
            );


            mostrarDiagnostico(
                "📧 Conta criada. Verifique seu e-mail para confirmar sua conta.",
                "sucesso"
            );


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO CRIAR CONTA:",
                error
            );


            mostrarMensagem(
                `Erro ao criar conta: ${error.message}`
            );


            return false;
        }

    }


    // ==========================================
    // FUNÇÕES PÚBLICAS
    // ==========================================

    window.entrarComEmailSenha =
        entrarComEmailSenha;


    window.criarConta =
        criarConta;


    window.reenviarConfirmacaoEmail =
        reenviarConfirmacaoEmail;


    /*
     * Disponibiliza a sincronização para
     * campaign.js.
     */

    window.sincronizarCampanhaAuth =
        sincronizarCampanhaAtiva;


    // ==========================================
    // PAINEL DE LOGIN
    // ==========================================

    function criarPainelLogin() {

        if (
            document.getElementById(
                "auth-login-panel"
            )
        ) {

            return;
        }


        const painel =
            document.createElement(
                "div"
            );


        painel.id =
            "auth-login-panel";


        painel.innerHTML = `

            <div style="
                width: min(92vw, 380px);
                padding: 28px;
                border-radius: 20px;
                background:
                    linear-gradient(
                        160deg,
                        #171020,
                        #0b0910
                    );
                border: 1px solid #6f3aa8;
                box-shadow:
                    0 0 35px
                    rgba(124, 58, 237, 0.30);
                color: #f5f0ff;
                text-align: center;
            ">

                <h2 style="
                    margin: 0 0 8px;
                ">
                    RPG CHARACTER CARD
                </h2>

                <p style="
                    margin: 0 0 22px;
                    color: #aaa0bd;
                ">
                    Entre na sua conta
                </p>

                <div id="auth-login-fields">

                    <input
                        id="auth-email"
                        type="email"
                        autocomplete="email"
                        placeholder="E-mail"
                        style="
                            width: 100%;
                            box-sizing: border-box;
                            padding: 12px;
                            margin-bottom: 10px;
                            border: 1px solid #68408a;
                            border-radius: 10px;
                            background: #100b18;
                            color: #f5f0ff;
                            outline: none;
                        "
                    >

                    <input
                        id="auth-password"
                        type="password"
                        autocomplete="current-password"
                        placeholder="Senha"
                        style="
                            width: 100%;
                            box-sizing: border-box;
                            padding: 12px;
                            margin-bottom: 14px;
                            border: 1px solid #68408a;
                            border-radius: 10px;
                            background: #100b18;
                            color: #f5f0ff;
                            outline: none;
                        "
                    >

                    <button
                        id="auth-login-button"
                        type="button"
                        style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #8b5cf6;
                            border-radius: 10px;
                            background: #241633;
                            color: #f5f0ff;
                            font-weight: bold;
                            cursor: pointer;
                        "
                    >
                        ENTRAR
                    </button>

                    <button
                        id="auth-create-account-button"
                        type="button"
                        style="
                            width: 100%;
                            padding: 10px;
                            margin-top: 10px;
                            border: 1px solid #68408a;
                            border-radius: 10px;
                            background: #100b18;
                            color: #c084fc;
                            font-weight: bold;
                            cursor: pointer;
                        "
                    >
                        CRIAR CONTA
                    </button>

                    <div
                        id="auth-confirmation-area"
                    ></div>

                </div>


                <div
                    id="auth-register-fields"
                    style="display: none;"
                >

                    <input
                        id="auth-username"
                        type="text"
                        autocomplete="username"
                        placeholder="Nome de usuário"
                        style="
                            width: 100%;
                            box-sizing: border-box;
                            padding: 12px;
                            margin-bottom: 10px;
                            border: 1px solid #68408a;
                            border-radius: 10px;
                            background: #100b18;
                            color: #f5f0ff;
                            outline: none;
                        "
                    >

                    <input
                        id="auth-register-email"
                        type="email"
                        autocomplete="email"
                        placeholder="E-mail"
                        style="
                            width: 100%;
                            box-sizing: border-box;
                            padding: 12px;
                            margin-bottom: 10px;
                            border: 1px solid #68408a;
                            border-radius: 10px;
                            background: #100b18;
                            color: #f5f0ff;
                            outline: none;
                        "
                    >

                    <input
                        id="auth-register-password"
                        type="password"
                        autocomplete="new-password"
                        placeholder="Senha"
                        style="
                            width: 100%;
                            box-sizing: border-box;
                            padding: 12px;
                            margin-bottom: 10px;
                            border: 1px solid #68408a;
                            border-radius: 10px;
                            background: #100b18;
                            color: #f5f0ff;
                            outline: none;
                        "
                    >

                    <input
                        id="auth-register-password-confirm"
                        type="password"
                        autocomplete="new-password"
                        placeholder="Confirmar senha"
                        style="
                            width: 100%;
                            box-sizing: border-box;
                            padding: 12px;
                            margin-bottom: 14px;
                            border: 1px solid #68408a;
                            border-radius: 10px;
                            background: #100b18;
                            color: #f5f0ff;
                            outline: none;
                        "
                    >

                    <button
                        id="auth-register-button"
                        type="button"
                        style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #8b5cf6;
                            border-radius: 10px;
                            background: #241633;
                            color: #f5f0ff;
                            font-weight: bold;
                            cursor: pointer;
                        "
                    >
                        CRIAR CONTA
                    </button>

                    <button
                        id="auth-back-login-button"
                        type="button"
                        style="
                            width: 100%;
                            padding: 10px;
                            margin-top: 10px;
                            border: 1px solid #68408a;
                            border-radius: 10px;
                            background: #100b18;
                            color: #c084fc;
                            font-weight: bold;
                            cursor: pointer;
                        "
                    >
                        VOLTAR PARA LOGIN
                    </button>

                </div>


                <p
                    id="auth-message"
                    style="
                        min-height: 18px;
                        margin: 14px 0 0;
                        font-size: 12px;
                        color: #8f839d;
                    "
                ></p>

            </div>
        `;


        Object.assign(
            painel.style,
            {
                position: "fixed",
                inset: "0",
                zIndex: "99999",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "rgba(5, 4, 9, 0.94)",
                fontFamily: "Arial, sans-serif"
            }
        );


        document.body.appendChild(
            painel
        );


        // ==================================
        // ELEMENTOS DE LOGIN
        // ==================================

        const botaoLogin =
            document.getElementById(
                "auth-login-button"
            );


        const email =
            document.getElementById(
                "auth-email"
            );


        const senha =
            document.getElementById(
                "auth-password"
            );


        // ==================================
        // ELEMENTOS DE CADASTRO
        // ==================================

        const username =
            document.getElementById(
                "auth-username"
            );


        const registerEmail =
            document.getElementById(
                "auth-register-email"
            );


        const registerPassword =
            document.getElementById(
                "auth-register-password"
            );


        const registerPasswordConfirm =
            document.getElementById(
                "auth-register-password-confirm"
            );


        const botaoCriarConta =
            document.getElementById(
                "auth-register-button"
            );


        const botaoMostrarCadastro =
            document.getElementById(
                "auth-create-account-button"
            );


        const botaoVoltarLogin =
            document.getElementById(
                "auth-back-login-button"
            );


        const camposLogin =
            document.getElementById(
                "auth-login-fields"
            );


        const camposCadastro =
            document.getElementById(
                "auth-register-fields"
            );


        // ==================================
        // ENTRAR
        // ==================================

        botaoLogin.addEventListener(
            "click",
            async function () {

                const sucesso =
                    await entrarComEmailSenha(
                        email.value,
                        senha.value
                    );


                if (sucesso) {

                    painel.remove();

                }

            }
        );


        senha.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    botaoLogin.click();

                }

            }
        );


        // ==================================
        // MOSTRAR CADASTRO
        // ==================================

        botaoMostrarCadastro.addEventListener(
            "click",
            function () {

                camposLogin.style.display =
                    "none";

                camposCadastro.style.display =
                    "block";

                mostrarMensagem(
                    ""
                );

                username.focus();

            }
        );


        // ==================================
        // VOLTAR PARA LOGIN
        // ==================================

        botaoVoltarLogin.addEventListener(
            "click",
            function () {

                camposCadastro.style.display =
                    "none";

                camposLogin.style.display =
                    "block";

                mostrarMensagem(
                    ""
                );

                email.focus();

            }
        );


        // ==================================
        // CRIAR CONTA
        // ==================================

        botaoCriarConta.addEventListener(
            "click",
            async function () {

                if (
                    registerPassword.value !==
                    registerPasswordConfirm.value
                ) {

                    mostrarMensagem(
                        "As senhas não são iguais."
                    );

                    return;

                }


                const sucesso =
                    await criarConta(
                        username.value,
                        registerEmail.value,
                        registerPassword.value
                    );


                if (
                    sucesso &&
                    window.rpgAuth.session
                ) {

                    painel.remove();

                }

            }
        );


        registerPasswordConfirm.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    botaoCriarConta.click();

                }

            }
        );


        email.focus();

    }


    // ==========================================
    // INICIAR AUTENTICAÇÃO
    // ==========================================

    async function iniciarAutenticacao() {

        if (!window.supabaseClient) {

            mostrarDiagnostico(
                "❌ Supabase Client não encontrado.",
                "erro"
            );


            return;
        }


        const {
            data,
            error
        } =
            await window.supabaseClient.auth
                .getSession();


        if (error) {

            console.error(
                "Erro ao recuperar sessão:",
                error
            );


            mostrarDiagnostico(
                `❌ Erro ao recuperar sessão: ${error.message}`,
                "erro"
            );


            criarPainelLogin();


            return;
        }


        if (data.session) {

            await atualizarEstadoSessao(
                data.session
            );


            return;
        }


        criarPainelLogin();

    }


    // ==========================================
    // OBSERVAR ALTERAÇÕES DE AUTENTICAÇÃO
    // ==========================================

    window.supabaseClient?.auth
        .onAuthStateChange(
            function (
                event,
                session
            ) {

                setTimeout(
                    () => {

                        atualizarEstadoSessao(
                            session
                        );

                    },
                    0
                );

            }
        );


    // ==========================================
    // OBSERVAR ALTERAÇÃO DA CAMPANHA
    // ==========================================
    //
    // O campaign.js dispara:
    //
    // mesa:campanhaAlterada
    //
    // quando a campanha ativa muda.
    //
    // Aqui sincronizamos o auth.js novamente.
    // ==========================================

    window.addEventListener(
        "mesa:campanhaAlterada",
        async function (event) {

            const campanha =
                event?.detail?.campanha ||
                event?.detail ||
                null;


            if (
                campanha &&
                campanha.id
            ) {

                await sincronizarCampanhaAtiva(
                    campanha
                );

            }

            else {

                /*
                 * Se a campanha foi removida/desativada,
                 * limpamos apenas o contexto ativo.
                 */

                window.rpgAuth.campaign =
                    null;

                window.rpgAuth.isMaster =
                    false;

                window.rpgAuth.campaignMembers =
                    [];

                window.rpgAuth.campaignCharacters =
                    [];

            }

        }
    );


    // ==========================================
    // FUNÇÕES PÚBLICAS
    // ==========================================

    window.obterMembrosCampanha =
        function () {

            return (
                window.rpgAuth
                    .campaignMembers || []
            );

        };


    window.obterPersonagensCampanha =
        function () {

            return (
                window.rpgAuth
                    .campaignCharacters || []
            );

        };


    window.obterCampanhaAtual =
        function () {

            return (
                window.rpgAuth
                    .campaign || null
            );

        };


    window.usuarioEhMestre =
        function () {

            /*
             * Fazemos uma verificação direta também,
             * para evitar depender exclusivamente
             * de uma variável antiga.
             */

            const usuario =
                window.rpgAuth.user;

            const campanha =
                window.rpgAuth.campaign;


            if (
                !usuario ||
                !campanha ||
                !campanha.master_id
            ) {

                return false;

            }


            const resultado =
                String(usuario.id) ===
                String(campanha.master_id);


            /*
             * Mantém o estado sincronizado.
             */

            window.rpgAuth.isMaster =
                resultado;


            return resultado;

        };


    window.obterPerfilUsuario =
        function () {

            return (
                window.rpgAuth
                    .profile || null
            );

        };


    window.recarregarDadosCampanha =
        carregarDadosCampanha;


    // ==========================================
    // INICIAR QUANDO O DOM ESTIVER PRONTO
    // ==========================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarAutenticacao
        );

    }

    else {

        iniciarAutenticacao();

    }

})();
