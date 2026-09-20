// ==========================================
// SUPABASE-ENTRADA.JS — Autenticação e Dados da Campanha
// ==========================================

async function inicializarAuth() {
    try {
        // Verifica se o Supabase carregou
        if (!window.supabaseClient) {
            console.warn("⚠️ Supabase não inicializado");
            window.rpgAuth = {
                userId: null,
                user: null,
                campaignId: null,
                campaign: null,
                campaignCharacters: [],
                carregado: false,
                erro: "Cliente Supabase não encontrado"
            };
            return;
        }

        // Pega a sessão do usuário
        const { data: { session }, error: erroSessao } = await window.supabaseClient.auth.getSession();
        
        if (erroSessao || !session) {
            console.warn("⚠️ Sem sessão ativa");
            window.rpgAuth = {
                userId: null,
                user: null,
                campaignId: null,
                campaign: null,
                campaignCharacters: [],
                carregado: true,
                erro: "Sem sessão de usuário"
            };
            return;
        }

        // Pega o UID do usuário logado
        const userId = session.user?.id || null;
        
        // Carrega os dados salvos localmente (campanha que entrou)
        const salvo = JSON.parse(localStorage.getItem("rpg_mesa_ativa") || "{}");
        
        // Monta o objeto de auth que a mesa usa
        window.rpgAuth = {
            userId: userId,
            user: session.user,
            campaignId: salvo.campaignId || null,
            campaign: salvo.campaign || null,
            campaignCharacters: [],
            carregado: true,
            erro: null
        };

        console.log("✅ Auth carregado:", { userId, campaignId: salvo.campaignId });
        
        // Avisa a mesa que os dados estão prontos
        document.dispatchEvent(new CustomEvent("rpg:campanhaAtualizada", {
            detail: {
                userId: userId,
                campaignId: salvo.campaignId
            }
        }));
    }
    catch (erro) {
        console.error("❌ Erro no auth:", erro);
        window.rpgAuth = {
            userId: null,
            user: null,
            campaignId: null,
            campaign: null,
            campaignCharacters: [],
            carregado: true,
            erro: erro.message
        };
    }
}

// Inicia automaticamente
inicializarAuth();
