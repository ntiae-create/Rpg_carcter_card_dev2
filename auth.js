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
        // Nunca escolher automaticamente
        // a primeira campanha.
        campaign: null,

        // Todas as campanhas vinculadas
        // ao usuário.
        campaigns: [],

        // Verdadeiro somente quando o usuário
        // logado é o mestre da campanha ativa.
        isMaster: false,

        // Todos os membros da campanha ativa.
        campaignMembers: [],

        // TODOS os personagens da campanha ativa.
        //
        // IMPORTANTE:
        // Este array NÃO representa apenas
        // o personagem do usuário logado.
        campaignCharacters: [],

        // Personagem pertencente ao usuário
        // atualmente autenticado.
        //
        // Pode ser null.
        //
        // Isso é especialmente importante para
        // o Mestre, que pode não possuir personagem.
        currentCharacter: null,

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
    // ENCONTRAR PERSONAGEM DO USUÁRIO
    // ==========================================
    //
    // IMPORTANTE:
    //
    // campaignCharacters contém TODOS os
    // personagens da campanha.
    //
    // currentCharacter contém SOMENTE o
    // personagem pertencente ao usuário logado.
    //
    // O Mestre pode perfeitamente ter:
    //
    // currentCharacter = null
    //
    // enquanto:
    //
    // campaignCharacters = [jogadores...]
    //
    // Isso NÃO significa que a campanha
    // esteja sem personagens.
    // ==========================================

    function atualizarPersonagemAtual() {

        const usuario =
            window.rpgAuth.user;

        const personagens =
            Array.isArray(
                window.rpgAuth.campaignCharacters
            )
                ? window.rpgAuth.campaignCharacters
                : [];


        if (!usuario) {

            window.rpgAuth.currentCharacter =
                null;

            return null;

        }


        const personagem =
            personagens.find(
                character =>
                    character &&
                    character.user_id &&
                    String(character.user_id) ===
                    String(usuario.id)
            ) || null;


        window.rpgAuth.currentCharacter =
            personagem;


        return personagem;

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


        return window.rpgAuth.isMaster;

    }


    // ==========================================
    // SINCRONIZAR CAMPANHA ATIVA
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

            window.rpgAuth.currentCharacter =
                null;

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

            window.rpgAuth.campaign =
                campanha;

        }


        atualizarStatusMestre();


        await carregarDadosCampanha();


        try {

            window.dispatchEvent(
                new CustomEvent(
                    "rpgAuth:campanhaSincronizada",
                    {
                        detail: {
                            campanha:
                                window.rpgAuth.campaign,

                            isMaster:
                                window.rpgAuth.isMaster,

                            personagens:
                                window.rpgAuth
                                    .campaignCharacters,

                            personagemAtual:
                                window.rpgAuth
                                    .currentCharacter
                        }
                    }
                )
            );

        }

        catch (error) {

            // Falha no evento não deve impedir
            // o restante da autenticação.

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

        window.rpgAuth.currentCharacter =
            null;

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

                window.rpgAuth.profile =
                    null;

                return false;

            }


            window.rpgAuth.profile =
                data || null;


            return true;

        }

        catch (error) {

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

                window.rpgAuth.campaignMembers =
                    [];

                mostrarDiagnostico(
                    `❌ Erro ao carregar jogadores: ${error.message}`,
                    "erro"
                );

                return false;

            }


            window.rpgAuth.campaignMembers =
                data || [];


            return true;

        }

        catch (error) {

            window.rpgAuth.campaignMembers =
                [];

            return false;

        }

    }


    // ==========================================
    // CARREGAR PERSONAGENS DA CAMPANHA
    // ==========================================
    //
    // ATENÇÃO:
    //
    // Esta consulta é POR CAMPANHA.
    //
    // NÃO fazemos:
    //
    // .eq("user_id", usuario.id)
    //
    // porque isso faria o Mestre enxergar
    // somente personagens dele.
    //
    // A Mesa precisa receber todos os
    // personagens que pertencem à campanha.
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

            window.rpgAuth.currentCharacter =
                null;

            return false;

        }


        try {

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

                window.rpgAuth.campaignCharacters =
                    [];

                window.rpgAuth.currentCharacter =
                    null;


                mostrarDiagnostico(
                    `❌ Erro ao carregar personagens da campanha: ${error.message}`,
                    "erro"
                );


                return false;

            }


            const personagens =
                Array.isArray(data)
                    ? data
                    : [];


            window.rpgAuth.campaignCharacters =
                personagens;


            /*
             * Agora, separadamente, descobrimos
             * se o usuário atual possui um
             * personagem dentro dessa campanha.
             *
             * Se for o Mestre e não possuir,
             * currentCharacter simplesmente fica null.
             *
             * Isso NÃO altera campaignCharacters.
             */

            atualizarPersonagemAtual();


            return true;

        }

        catch (error) {

            window.rpgAuth.campaignCharacters =
                [];

            window.rpgAuth.currentCharacter =
                null;


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

            window.rpgAuth.currentCharacter =
                null;

            return false;

        }


        const campaignId =
            window.rpgAuth.campaign.id;


        if (!campaignId) {

            window.rpgAuth.campaignMembers =
                [];

            window.rpgAuth.campaignCharacters =
                [];

            window.rpgAuth.currentCharacter =
                null;

            return false;

        }


        const membrosCarregados =
            await carregarMembrosCampanha(
                campaignId
            );


        const personagensCarregados =
            await carregarPersonagensCampanha(
                campaignId
            );


        /*
         * O personagem atual é derivado
         * DEPOIS da lista completa.
         */

        atualizarPersonagemAtual();


        return (
            membrosCarregados ||
            personagensCarregados
        );

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


            window.rpgAuth.campaigns =
                campanhasUnicas;


            // ==================================
            // NENHUMA CAMPANHA
            // ==================================

            if (
                window.rpgAuth.campaigns.length === 0
            ) {

                window.rpgAuth.campaign =
                    null;

                window.rpgAuth.isMaster =
                    false;

                window.rpgAuth.campaignMembers =
                    [];

                window.rpgAuth.campaignCharacters =
                    [];

                window.rpgAuth.currentCharacter =
                    null;


                mostrarDiagnostico(
                    "ℹ️ Conta autenticada. Nenhuma campanha vinculada ainda.",
                    "info"
                );


                return true;

            }


            // ==================================
            // RECUPERAR CAMPANHA ATIVA
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

                    window.rpgAuth.campaign =
                        null;

                }

            }

            else {

                window.rpgAuth.campaign =
                    null;

            }


            // ==================================
            // ATUALIZAR MESTRE
            // ==================================

            atualizarStatusMestre();


            // ==================================
            // CARREGAR CAMPANHA ATIVA
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

                window.rpgAuth.currentCharacter =
                    null;

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


        atualizarStatusMestre();


        atualizarPersonagemAtual();

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


                mostrarMensagem(
                    "Não foi possível entrar."
                );


                mostrarDiagnostico(
                    `❌ ${error.message}`,
                    "erro"
                );


                return false;

            }


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

                mostrarMensagem(
                    `Não foi possível criar a conta: ${error.message}`
                );


                mostrarDiagnostico(
                    `❌ ${error.message}`,
                    "erro"
                );


                return false;

            }


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
                    function () {

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

                window.rpgAuth.campaign =
                    null;

                window.rpgAuth.isMaster =
                    false;

                window.rpgAuth.campaignMembers =
                    [];

                window.rpgAuth.campaignCharacters =
                    [];

                window.rpgAuth.currentCharacter =
                    null;

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


    // ==========================================
    // TODOS OS PERSONAGENS DA CAMPANHA
    // ==========================================

    window.obterPersonagensCampanha =
        function () {

            return (
                window.rpgAuth
                    .campaignCharacters || []
            );

        };


    // ==========================================
    // PERSONAGEM DO USUÁRIO ATUAL
    // ==========================================

    window.obterPersonagemAtual =
        function () {

            return (
                window.rpgAuth
                    .currentCharacter || null
            );

        };


    // ==========================================
    // CAMPANHA ATUAL
    // ==========================================

    window.obterCampanhaAtual =
        function () {

            return (
                window.rpgAuth
                    .campaign || null
            );

        };


    // ==========================================
    // VERIFICAR MESTRE
    // ==========================================

    window.usuarioEhMestre =
        function () {

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


            window.rpgAuth.isMaster =
                resultado;


            return resultado;

        };


    // ==========================================
    // PERFIL
    // ==========================================

    window.obterPerfilUsuario =
        function () {

            return (
                window.rpgAuth
                    .profile || null
            );

        };


    // ==========================================
    // RECARREGAR CAMPANHA
    // ==========================================

    window.recarregarDadosCampanha =
        carregarDadosCampanha;


    // ==========================================
    // RECARREGAR PERSONAGENS
    // ==========================================

    window.recarregarPersonagensCampanha =
        carregarPersonagensCampanha;


    // ==========================================
    // INICIAR QUANDO DOM ESTIVER PRONTO
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
