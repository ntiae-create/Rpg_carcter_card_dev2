/* =========================================================
   MESA RPG — ENTRADA NA CAMPANHA
   =========================================================

   FLUXO:

   PERSONAGEM CONFIRMADO
          ↓
      CÓDIGO DA MESA
          ↓
      VALIDAR CAMPANHA
          ↓
      ┌───────────────┐
      │ É o Mestre?   │
      └───────┬───────┘
          SIM │ NÃO
              │
              ├───────────────┐
              ↓               ↓
           MESTRE          JOGADOR
                              ↓
                       PERSONAGEM
                         CONFIRMADO
                              ↓
                    FUNÇÃO SQL DO BANCO
                              ↓
                   CAMPAIGN_ID + SLOT
                              ↓
                     CAMPANHA ATIVA
                              ↓
                         mesa.html

   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

    const MAX_JOGADORES = 8;
    const STORAGE_KEY = "rpg_mesa_ativa";


    /* =====================================================
       ESTADO
    ===================================================== */

    let elementos = {};
    let processandoEntrada = false;


    /* =====================================================
       SUPABASE
    ===================================================== */

    function obterSupabase() {

        return (
            window.supabaseClient ||
            window.supabase ||
            null
        );

    }


    /* =====================================================
       USUÁRIO
    ===================================================== */

    function obterUsuario() {

        return window.rpgAuth?.user || null;

    }


    /* =====================================================
       CÓDIGO
    ===================================================== */

    function normalizarCodigo(codigo) {

        return String(codigo || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");

    }


    /* =====================================================
       MENSAGEM
    ===================================================== */

    function mostrarMensagem(texto, tipo = "info") {

        const elemento =
            elementos.mensagem ||
            document.getElementById(
                "campaign-join-message"
            );

        if (!elemento) {
            return;
        }

        elemento.textContent = texto;
        elemento.dataset.type = tipo;

        elemento.style.display =
            texto ? "block" : "none";

    }


    /* =====================================================
       PROCESSAMENTO
    ===================================================== */

    function definirProcessando(valor) {

        processandoEntrada =
            Boolean(valor);

        const botao =
            elementos.entrar ||
            document.getElementById(
                "join-campaign-button"
            );

        const input =
            elementos.codigo ||
            document.getElementById(
                "campaign-code-input"
            );

        if (botao) {

            botao.disabled =
                processandoEntrada;

            botao.textContent =
                processandoEntrada
                    ? "⏳ ENTRANDO..."
                    : "⚔️ ENTRAR";

        }

        if (input) {

            input.disabled =
                processandoEntrada;

        }

    }


    /* =====================================================
       PERSONAGEM CONFIRMADO
    ===================================================== */

    function personagemEstaConfirmado(personagem) {

        if (!personagem) {
            return false;
        }

        const nome =
            personagem.nome ??
            personagem.name;

        const raca =
            personagem.raca ??
            personagem.race;

        const classe =
            personagem.classe ??
            personagem.class;

        return Boolean(
            String(nome || "").trim() &&
            String(raca || "").trim() &&
            String(classe || "").trim()
        );

    }


    /* =====================================================
       BUSCAR CAMPANHA
    ===================================================== */

    async function buscarCampanha(codigo) {

        const codigoNormalizado =
            normalizarCodigo(codigo);

        if (!codigoNormalizado) {
            return null;
        }


        /* -------------------------------------------------
           campaign.js
        ------------------------------------------------- */

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.buscarCampanhaPorCodigo ===
                "function"
        ) {

            try {

                const campanha =
                    await window.rpgCampaign
                        .buscarCampanhaPorCodigo(
                            codigoNormalizado
                        );

                if (campanha) {
                    return campanha;
                }

            } catch (erro) {

                console.warn(
                    "⚠️ Falha ao buscar campanha pelo campaign.js:",
                    erro
                );

            }

        }


        /* -------------------------------------------------
           FALLBACK SUPABASE
        ------------------------------------------------- */

        const supabase =
            obterSupabase();

        if (!supabase) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        const {
            data,
            error
        } =
            await supabase
                .from("campaigns")
                .select("*")
                .eq(
                    "codigo_mesa",
                    codigoNormalizado
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        return data || null;

    }


    /* =====================================================
       ENCONTRAR PERSONAGEM DO USUÁRIO
       ===================================================== */

    async function encontrarPersonagem(campanha) {

        const usuario =
            obterUsuario();

        const supabase =
            obterSupabase();

        if (
            !usuario?.id ||
            !supabase ||
            !campanha?.id
        ) {

            return null;

        }


        /* -------------------------------------------------
           1. PERSONAGEM JÁ VINCULADO À CAMPANHA
        ------------------------------------------------- */

        const {
            data: personagensCampanha,
            error: erroCampanha
        } =
            await supabase
                .from("characters")
                .select("*")
                .eq(
                    "user_id",
                    usuario.id
                )
                .eq(
                    "campaign_id",
                    campanha.id
                )
                .limit(20);


        if (erroCampanha) {

            console.warn(
                "⚠️ Erro buscando personagem da campanha:",
                erroCampanha
            );

        }


        if (
            personagensCampanha &&
            personagensCampanha.length > 0
        ) {

            const confirmado =
                personagensCampanha.find(
                    personagemEstaConfirmado
                );

            if (confirmado) {
                return confirmado;
            }

        }


        /* -------------------------------------------------
           2. PERSONAGEM INDEPENDENTE
        ------------------------------------------------- */

        const {
            data: personagensIndependentes,
            error: erroIndependente
        } =
            await supabase
                .from("characters")
                .select("*")
                .eq(
                    "user_id",
                    usuario.id
                )
                .is(
                    "campaign_id",
                    null
                )
                .limit(20);


        if (erroIndependente) {

            console.warn(
                "⚠️ Erro buscando personagem independente:",
                erroIndependente
            );

        }


        if (
            personagensIndependentes &&
            personagensIndependentes.length > 0
        ) {

            const confirmado =
                personagensIndependentes.find(
                    personagemEstaConfirmado
                );

            if (confirmado) {
                return confirmado;
            }

        }


        /* -------------------------------------------------
           3. FALLBACK AUTH
        ------------------------------------------------- */

        const personagemAuth =
            window.rpgAuth?.currentCharacter ||
            window.rpgAuth?.campaignCharacter ||
            null;


        if (
            personagemAuth &&
            personagemEstaConfirmado(
                personagemAuth
            )
        ) {

            return personagemAuth;

        }


        return null;

    }


    /* =====================================================
       VERIFICAR MEMBRO
       ===================================================== */

    async function usuarioJaEhMembro(
        campanhaId,
        usuarioId
    ) {

        const supabase =
            obterSupabase();

        if (!supabase) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        const {
            data,
            error
        } =
            await supabase
                .from("campaign_members")
                .select(
                    "id, campaign_id, user_id, role"
                )
                .eq(
                    "campaign_id",
                    campanhaId
                )
                .eq(
                    "user_id",
                    usuarioId
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        return data || null;

    }


    /* =====================================================
       ADICIONAR MEMBRO
       ===================================================== */

    async function adicionarMembro(
        campanhaId,
        usuarioId
    ) {

        const existente =
            await usuarioJaEhMembro(
                campanhaId,
                usuarioId
            );


        if (existente) {
            return existente;
        }


        const supabase =
            obterSupabase();


        if (!supabase) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        const {
            data,
            error
        } =
            await supabase
                .from("campaign_members")
                .insert({
                    campaign_id: campanhaId,
                    user_id: usuarioId,
                    role: "player"
                })
                .select()
                .single();


        if (error) {

            /*
             * Caso tenha ocorrido uma corrida entre
             * duas tentativas de entrada, verificamos
             * novamente se o membro já existe.
             */

            const novamente =
                await usuarioJaEhMembro(
                    campanhaId,
                    usuarioId
                );

            if (novamente) {
                return novamente;
            }

            throw error;

        }


        return data;

    }


    /* =====================================================
       SLOTS OCUPADOS
       ===================================================== */

    async function obterSlotsOcupados(
        campanhaId
    ) {

        const supabase =
            obterSupabase();

        if (!supabase) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        const slots =
            new Set();


        /*
         * O SLOT OFICIAL FICA NO PERSONAGEM.
         *
         * Não consultamos campaign_members.slot,
         * porque essa coluna não é necessária
         * para o funcionamento da mesa.
         */

        const {
            data: personagens,
            error
        } =
            await supabase
                .from("characters")
                .select("id, user_id, slot")
                .eq(
                    "campaign_id",
                    campanhaId
                );


        if (error) {

            throw error;

        }


        (personagens || []).forEach(
            personagem => {

                const slot =
                    Number(
                        personagem.slot
                    );


                if (
                    Number.isInteger(slot) &&
                    slot >= 1 &&
                    slot <= MAX_JOGADORES
                ) {

                    slots.add(slot);

                }

            }
        );


        return slots;

    }


    /* =====================================================
       ENCONTRAR PRIMEIRO SLOT
       ===================================================== */

    async function encontrarPrimeiroSlot(
        campanhaId
    ) {

        const ocupados =
            await obterSlotsOcupados(
                campanhaId
            );


        for (
            let slot = 1;
            slot <= MAX_JOGADORES;
            slot++
        ) {

            if (
                !ocupados.has(slot)
            ) {

                return slot;

            }

        }


        return null;

    }


    /* =====================================================
       SLOT DO PERSONAGEM
       ===================================================== */

    function obterSlotPersonagem(
        personagem
    ) {

        if (!personagem) {
            return null;
        }


        const slot =
            Number(
                personagem.slot
            );


        if (
            Number.isInteger(slot) &&
            slot >= 1 &&
            slot <= MAX_JOGADORES
        ) {

            return slot;

        }


        return null;

    }


    /* =====================================================
       VERIFICAR SE SLOT JÁ ESTÁ SENDO USADO
       ===================================================== */

    async function slotPertenceOutroPersonagem(
        campanhaId,
        slot,
        personagemId
    ) {

        const supabase =
            obterSupabase();

        if (!supabase) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        const {
            data,
            error
        } =
            await supabase
                .from("characters")
                .select("id")
                .eq(
                    "campaign_id",
                    campanhaId
                )
                .eq(
                    "slot",
                    slot
                )
                .limit(10);


        if (error) {
            throw error;
        }


        return (
            data || []
        ).some(
            personagem =>
                String(personagem.id) !==
                String(personagemId)
        );

    }


    /* =====================================================
       ASSOCIAR PERSONAGEM
       ===================================================== */

    async function associarPersonagem(
        personagem,
        campanha,
        slot
    ) {

        const supabase =
            obterSupabase();


        if (!supabase) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        if (!personagem?.id) {

            throw new Error(
                "Personagem inválido."
            );

        }


        if (
            !campanha?.id
        ) {

            throw new Error(
                "Campanha inválida."
            );

        }


        if (
            !Number.isInteger(
                Number(slot)
            ) ||
            Number(slot) < 1 ||
            Number(slot) > MAX_JOGADORES
        ) {

            throw new Error(
                "Slot inválido."
            );

        }


        const slotOcupado =
            await slotPertenceOutroPersonagem(
                campanha.id,
                Number(slot),
                personagem.id
            );


        if (slotOcupado) {

            throw new Error(
                "Esse slot já está ocupado por outro personagem."
            );

        }


        const {
            data,
            error
        } =
            await supabase
                .from("characters")
                .update({
                    campaign_id: campanha.id,
                    slot: Number(slot)
                })
                .eq(
                    "id",
                    personagem.id
                )
                .eq(
                    "user_id",
                    obterUsuario()?.id
                )
                .select()
                .single();


        if (error) {
            throw error;
        }


        return data;

    }


    /* =====================================================
       NOVO FLUXO — ENTRAR JOGADOR PELA FUNÇÃO SQL
       ===================================================== */

    async function entrarJogadorCampanha(
        personagem,
        campanha
    ) {

        const supabase =
            obterSupabase();

        if (!supabase) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        if (!personagem?.id) {

            throw new Error(
                "Personagem inválido."
            );

        }


        if (!campanha?.id) {

            throw new Error(
                "Campanha inválida."
            );

        }


        const {
            data,
            error
        } =
            await supabase.rpc(
                "entrar_jogador_campanha",
                {
                    p_character_id:
                        personagem.id,

                    p_campaign_id:
                        campanha.id
                }
            );


        if (error) {
            throw error;
        }


        if (!data?.success) {

            throw new Error(
                "Não foi possível vincular o personagem à campanha."
            );

        }


        const slot =
            Number(data.slot);


        if (
            !Number.isInteger(slot) ||
            slot < 1 ||
            slot > MAX_JOGADORES
        ) {

            throw new Error(
                "A campanha foi vinculada, mas o slot retornado é inválido."
            );

        }


        return {
            ...personagem,
            campaign_id:
                data.campaign_id ||
                campanha.id,
            campaignId:
                data.campaign_id ||
                campanha.id,
            slot
        };

    }


    /* =====================================================
       SALVAR MESA ATIVA
       ===================================================== */

    function salvarMesaAtiva(
        campanha,
        personagem = null,
        slot = null
    ) {

        if (!campanha?.id) {
            return false;
        }


        const usuario =
            obterUsuario();


        const dados = {

            campaignId:
                campanha.id,

            campaign_id:
                campanha.id,

            campaignCode:
                campanha.codigo_mesa ||
                campanha.codigoMesa ||
                "",

            campaignName:
                campanha.nome ||
                campanha.name ||
                "Campanha",

            masterId:
                campanha.master_id ||
                campanha.masterId ||
                null,

            userId:
                usuario?.id ||
                null,

            characterId:
                personagem?.id ||
                null,

            slot:
                Number.isInteger(
                    Number(slot)
                )
                    ? Number(slot)
                    : null,

            savedAt:
                Date.now()

        };


        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(dados)
            );

            return true;

        } catch (erro) {

            console.error(
                "❌ Não foi possível salvar a mesa ativa:",
                erro
            );

            return false;

        }

    }


    /* =====================================================
       OBTER MESA ATIVA LOCAL
       ===================================================== */

    function obterMesaAtivaLocal() {

        try {

            const salvo =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!salvo) {
                return null;
            }


            const dados =
                JSON.parse(
                    salvo
                );


            if (
                !dados ||
                !dados.campaignId
            ) {

                return null;

            }


            return dados;

        } catch (erro) {

            console.warn(
                "⚠️ Mesa ativa local inválida:",
                erro
            );

            return null;

        }

    }


    /* =====================================================
       LIMPAR MESA ATIVA
       ===================================================== */

    function limparMesaAtivaLocal() {

        try {

            localStorage.removeItem(
                STORAGE_KEY
            );

        } catch (erro) {

            console.warn(
                "⚠️ Não foi possível limpar mesa ativa:",
                erro
            );

        }

    }


    /* =====================================================
       ATUALIZAR AUTH
       ===================================================== */

    async function atualizarAuth(
        campanha,
        ehMestre,
        personagem = null,
        slot = null
    ) {

        if (!window.rpgAuth) {
            return;
        }


        /*
         * A campanha ativa é definida pelo
         * campaign.js + auth.js.
         *
         * Isso acontece antes de qualquer
         * redirecionamento.
         */

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.definirCampanhaAtiva ===
                "function"
        ) {

            try {

                await window.rpgCampaign
                    .definirCampanhaAtiva(
                        campanha
                    );

            } catch (erro) {

                console.warn(
                    "⚠️ Falha ao definir campanha ativa:",
                    erro
                );

            }

        }


        /*
         * Sincronização oficial do auth.js.
         */

        if (
            typeof window.sincronizarCampanhaAuth ===
                "function"
        ) {

            try {

                await window.sincronizarCampanhaAuth(
                    campanha
                );

            } catch (erro) {

                console.warn(
                    "⚠️ Falha ao sincronizar auth:",
                    erro
                );

            }

        }


        /*
         * Garantia local.
         */

        window.rpgAuth.campaign =
            campanha;


        const usuario =
            obterUsuario();


        const masterId =
            campanha.master_id ||
            campanha.masterId ||
            null;


        /*
         * O banco é a fonte da verdade
         * para determinar quem é o mestre.
         */

        window.rpgAuth.isMaster =
            Boolean(
                usuario?.id &&
                masterId &&
                String(usuario.id) ===
                String(masterId)
            );


        /*
         * Personagem do jogador.
         */

        if (personagem) {

            window.rpgAuth.campaignCharacter =
                personagem;

            window.rpgAuth.currentCharacter =
                personagem;

        }


        /*
         * Slot atual.
         */

        if (
            slot !== null &&
            slot !== undefined
        ) {

            window.rpgAuth.campaignSlot =
                Number(slot);

        }


        /*
         * Garantia final.

         */

        if (
            ehMestre &&
            usuario?.id &&
            masterId
        ) {

            window.rpgAuth.isMaster =
                String(usuario.id) ===
                String(masterId);

        }

    }


    /* =====================================================
       ENTRAR NA MESA
       ===================================================== */

    function entrarNaMesa() {

        /*
         * O contexto já foi salvo antes desta
         * função ser chamada.
         */

        setTimeout(
            function () {

                window.location.href =
                    "mesa.html";

            },
            100
        );

    }


    /* =====================================================
       ENTRAR POR CÓDIGO
       ===================================================== */

    async function entrarPorCodigo() {

        if (processandoEntrada) {
            return;
        }


        const usuario =
            obterUsuario();


        if (!usuario?.id) {

            mostrarMensagem(
                "Você precisa estar conectado.",
                "error"
            );

            return;

        }


        const codigo =
            normalizarCodigo(
                elementos.codigo?.value
            );


        if (!codigo) {

            mostrarMensagem(
                "Digite o código da mesa.",
                "error"
            );

            elementos.codigo?.focus();

            return;

        }


        const supabase =
            obterSupabase();


        if (!supabase) {

            mostrarMensagem(
                "Conexão com o servidor não encontrada.",
                "error"
            );

            return;

        }


        definirProcessando(true);

        mostrarMensagem(
            "Verificando a mesa...",
            "info"
        );


        try {

            /* =============================================
               1. BUSCAR CAMPANHA
            ============================================= */

            const campanha =
                await buscarCampanha(
                    codigo
                );


            if (!campanha?.id) {

                throw new Error(
                    "Nenhuma mesa foi encontrada com esse código."
                );

            }


            /* =============================================
               2. IDENTIFICAR MESTRE
            ============================================= */

            const masterId =
                campanha.master_id ||
                campanha.masterId ||
                null;


            const ehMestre =
                Boolean(
                    masterId &&
                    String(masterId) ===
                    String(usuario.id)
                );


            /* =============================================
               3. MESTRE
            ============================================= */

            if (ehMestre) {

                salvarMesaAtiva(
                    campanha,
                    null,
                    null
                );


                await atualizarAuth(
                    campanha,
                    true,
                    null,
                    null
                );


                mostrarMensagem(
                    "Mesa encontrada. Entrando como Mestre...",
                    "success"
                );


                entrarNaMesa();

                return;

            }


            /* =============================================
               4. JOGADOR — PERSONAGEM
            ============================================= */

            const personagem =
                await encontrarPersonagem(
                    campanha
                );


            if (!personagem) {

                throw new Error(
                    "Você precisa ter um personagem confirmado para entrar nessa mesa."
                );

            }


            if (
                !personagemEstaConfirmado(
                    personagem
                )
            ) {

                throw new Error(
                    "Seu personagem ainda não está confirmado."
                );

            }


            /* =============================================
               5. VINCULAR JOGADOR PELO BANCO
            ============================================= */

            const personagemAtualizado =
                await entrarJogadorCampanha(
                    personagem,
                    campanha
                );


            Object.assign(
                personagem,
                personagemAtualizado
            );


            const slot =
                Number(
                    personagem.slot
                );


            /* =============================================
               6. GARANTIR DADOS LOCAIS
            ============================================= */

            personagem.campaign_id =
                campanha.id;

            personagem.campaignId =
                campanha.id;

            personagem.slot =
                Number(slot);


            /* =============================================
               7. SALVAR MESA
            ============================================= */

            salvarMesaAtiva(
                campanha,
                personagem,
                slot
            );


            /* =============================================
               8. SINCRONIZAR AUTH
            ============================================= */

            await atualizarAuth(
                campanha,
                false,
                personagem,
                slot
            );


            /* =============================================
               9. MESA
            ============================================= */

            mostrarMensagem(
                `Mesa encontrada. Entrando no slot ${slot}...`,
                "success"
            );


            entrarNaMesa();


        } catch (erro) {

            console.error(
                "❌ Erro ao entrar na mesa:",
                erro
            );


            let mensagem =
                erro?.message ||
                "Não foi possível entrar na mesa.";


            const mensagemLower =
                mensagem.toLowerCase();


            if (
                mensagemLower.includes(
                    "duplicate"
                ) ||
                mensagemLower.includes(
                    "unique"
                )
            ) {

                mensagem =
                    "Você já está vinculado a essa mesa.";

            }


            mostrarMensagem(
                mensagem,
                "error"
            );


            definirProcessando(false);

        }

    }


    /* =====================================================
       CONTINUAR CAMPANHA
       ===================================================== */

    async function continuarCampanha() {

        if (processandoEntrada) {
            return;
        }


        const salvo =
            obterMesaAtivaLocal();


        if (!salvo?.campaignId) {

            mostrarMensagem(
                "Nenhuma campanha ativa foi encontrada.",
                "error"
            );

            return;

        }


        const usuario =
            obterUsuario();


        if (!usuario?.id) {

            mostrarMensagem(
                "Você precisa estar conectado.",
                "error"
            );

            return;

        }


        const supabase =
            obterSupabase();


        if (!supabase) {

            mostrarMensagem(
                "Conexão com o servidor não encontrada.",
                "error"
            );

            return;

        }


        definirProcessando(true);

        mostrarMensagem(
            "Recuperando sua mesa...",
            "info"
        );


        try {

            /* =============================================
               1. VALIDAR CAMPANHA
            ============================================= */

            const {
                data: campanha,
                error
            } =
                await supabase
                    .from("campaigns")
                    .select("*")
                    .eq(
                        "id",
                        salvo.campaignId
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!campanha) {

                limparMesaAtivaLocal();

                throw new Error(
                    "A campanha salva não existe mais."
                );

            }


            /* =============================================
               2. MESTRE
            ============================================= */

            const masterId =
                campanha.master_id ||
                campanha.masterId ||
                null;


            const ehMestre =
                Boolean(
                    masterId &&
                    String(masterId) ===
                    String(usuario.id)
                );


            if (ehMestre) {

                salvarMesaAtiva(
                    campanha,
                    null,
                    null
                );


                await atualizarAuth(
                    campanha,
                    true,
                    null,
                    null
                );


                entrarNaMesa();

                return;

            }


            /* =============================================
               3. JOGADOR
            ============================================= */

            let personagem =
                null;


            /* -------------------------------------------------
               Tentar personagem salvo
            ------------------------------------------------- */

            if (salvo.characterId) {

                const {
                    data,
                    error: erroPersonagem
                } =
                    await supabase
                        .from("characters")
                        .select("*")
                        .eq(
                            "id",
                            salvo.characterId
                        )
                        .eq(
                            "user_id",
                            usuario.id
                        )
                        .maybeSingle();


                if (
                    !erroPersonagem &&
                    data
                ) {

                    personagem =
                        data;

                }

            }


            /* -------------------------------------------------
               Fallback
            ------------------------------------------------- */

            if (!personagem) {

                personagem =
                    await encontrarPersonagem(
                        campanha
                    );

            }


            if (!personagem) {

                throw new Error(
                    "Seu personagem não foi encontrado nessa mesa."
                );

            }


            if (
                !personagemEstaConfirmado(
                    personagem
                )
            ) {

                throw new Error(
                    "Seu personagem ainda não está confirmado."
                );

            }


            /* =============================================
               4. VINCULAR/RECUPERAR PERSONAGEM
            ============================================= */

            let slot =
                obterSlotPersonagem(
                    personagem
                );


            /*
             * Se o personagem já possui campanha e slot,
             * usamos os dados existentes.
             *
             * Caso contrário, o banco fará o vínculo completo
             * e atribuirá um slot através da função SQL.
             */

            if (
                String(
                    personagem.campaign_id
                ) !==
                String(
                    campanha.id
                ) ||
                !slot
            ) {

                personagem =
                    await entrarJogadorCampanha(
                        personagem,
                        campanha
                    );

                slot =
                    Number(
                        personagem.slot
                    );

            }


            /* =============================================
               5. GARANTIR DADOS LOCAIS
            ============================================= */

            personagem.campaign_id =
                campanha.id;

            personagem.campaignId =
                campanha.id;

            personagem.slot =
                Number(slot);


            /* =============================================
               6. SALVAR
            ============================================= */

            salvarMesaAtiva(
                campanha,
                personagem,
                slot
            );


            /* =============================================
               7. AUTH
            ============================================= */

            await atualizarAuth(
                campanha,
                false,
                personagem,
                slot
            );


            /* =============================================
               8. MESA
            ============================================= */

            entrarNaMesa();


        } catch (erro) {

            console.error(
                "❌ Erro ao continuar campanha:",
                erro
            );


            mostrarMensagem(
                erro?.message ||
                "Não foi possível continuar a campanha.",
                "error"
            );


            definirProcessando(false);

        }

    }


    /* =====================================================
       ABRIR FORMULÁRIO
       ===================================================== */

    function abrirFormularioCodigo() {

        const container =
            elementos.formContainer ||
            document.getElementById(
                "campaign-join-form-container"
            );


        if (!container) {
            return;
        }


        container.hidden =
            false;


        const input =
            elementos.codigo ||
            document.getElementById(
                "campaign-code-input"
            );


        if (input) {

            input.focus();

        }


        mostrarMensagem(
            "",
            "info"
        );

    }


    /* =====================================================
       ESCONDER FORMULÁRIO
       ===================================================== */

    function esconderFormularioCodigo() {

        const container =
            elementos.formContainer ||
            document.getElementById(
                "campaign-join-form-container"
            );


        if (container) {

            container.hidden =
                true;

        }

    }


    /* =====================================================
       COPIAR CÓDIGO
       ===================================================== */

    async function copiarCodigoCampanha() {

        const salvo =
            obterMesaAtivaLocal();


        const codigo =
            salvo?.campaignCode ||
            salvo?.codigoMesa ||
            "";


        if (!codigo) {

            mostrarMensagem(
                "Nenhum código de mesa disponível.",
                "error"
            );

            return;

        }


        try {

            await navigator.clipboard.writeText(
                codigo
            );


            mostrarMensagem(
                "Código da mesa copiado!",
                "success"
            );


        } catch (erro) {

            console.warn(
                "⚠️ Não foi possível copiar:",
                erro
            );


            mostrarMensagem(
                `Código da mesa: ${codigo}`,
                "info"
            );

        }

    }


    /* =====================================================
       VERIFICAR MESA ATIVA
       ===================================================== */

    async function verificarMesaAtiva() {

        const salvo =
            obterMesaAtivaLocal();


        if (!salvo?.campaignId) {
            return false;
        }


        const usuario =
            obterUsuario();


        if (!usuario?.id) {
            return false;
        }


        const supabase =
            obterSupabase();


        if (!supabase) {
            return false;
        }


        try {

            /*
             * Aqui apenas VALIDAMOS o registro salvo.
             *
             * Não redirecionamos.
             * Não escolhemos campanha.
             */

            const {
                data: campanha,
                error
            } =
                await supabase
                    .from("campaigns")
                    .select(
                        "id, name, master_id, codigo_mesa, created_at"
                    )
                    .eq(
                        "id",
                        salvo.campaignId
                    )
                    .maybeSingle();


            if (
                error ||
                !campanha
            ) {

                limparMesaAtivaLocal();

                return false;

            }


            /*
             * Confirmamos apenas que a campanha
             * continua existindo.
             */

            return true;


        } catch (erro) {

            console.warn(
                "⚠️ Erro verificando mesa ativa:",
                erro
            );

            return false;

        }

    }


    /* =====================================================
       REGISTRAR EVENTOS
       ===================================================== */

    function registrarEventos() {

        /* -------------------------------------------------
           ABRIR FORMULÁRIO
        ------------------------------------------------- */

        const abrir =
            elementos.abrirCodigo ||
            document.getElementById(
                "open-campaign-code-button"
            );


        if (abrir) {

            abrir.addEventListener(
                "click",
                abrirFormularioCodigo
            );

        }


        /* -------------------------------------------------
           ENTRAR
        ------------------------------------------------- */

        const entrar =
            elementos.entrar ||
            document.getElementById(
                "join-campaign-button"
            );


        if (entrar) {

            entrar.addEventListener(
                "click",
                entrarPorCodigo
            );

        }


        /* -------------------------------------------------
           CÓDIGO
        ------------------------------------------------- */

        const codigo =
            elementos.codigo ||
            document.getElementById(
                "campaign-code-input"
            );


        if (codigo) {

            codigo.addEventListener(
                "input",
                function () {

                    this.value =
                        normalizarCodigo(
                            this.value
                        );

                }
            );


            codigo.addEventListener(
                "keydown",
                function (evento) {

                    if (
                        evento.key ===
                        "Enter"
                    ) {

                        evento.preventDefault();

                        entrarPorCodigo();

                    }

                }
            );

        }


        /* -------------------------------------------------
           CONTINUAR
        ------------------------------------------------- */

        const continuar =
            elementos.continuar ||
            document.getElementById(
                "continue-campaign-button"
            );


        if (continuar) {

            continuar.addEventListener(
                "click",
                continuarCampanha
            );

        }


        /* -------------------------------------------------
           CONTINUAR PLAYER
        ------------------------------------------------- */

        const continuarPlayer =
            document.getElementById(
                "continue-campaign-button-player"
            );


        if (continuarPlayer) {

            continuarPlayer.addEventListener(
                "click",
                continuarCampanha
            );

        }


        /* -------------------------------------------------
           COPIAR
        ------------------------------------------------- */

        const copiar =
            document.getElementById(
                "copy-campaign-code"
            );


        if (copiar) {

            copiar.addEventListener(
                "click",
                copiarCodigoCampanha
            );

        }

    }


    /* =====================================================
       INTERFACE INICIAL
       ===================================================== */

    function atualizarInterfaceInicial() {

        const salvo =
            obterMesaAtivaLocal();


        const continuar =
            elementos.continuar ||
            document.getElementById(
                "continue-campaign-button"
            );


        if (continuar) {

            continuar.style.display =
                salvo?.campaignId
                    ? ""
                    : "none";

        }

    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    async function inicializar() {

        elementos = {

            codigo:
                document.getElementById(
                    "campaign-code-input"
                ),

            entrar:
                document.getElementById(
                    "join-campaign-button"
                ),

            mensagem:
                document.getElementById(
                    "campaign-join-message"
                ),

            formContainer:
                document.getElementById(
                    "campaign-join-form-container"
                ),

            abrirCodigo:
                document.getElementById(
                    "open-campaign-code-button"
                ),

            continuar:
                document.getElementById(
                    "continue-campaign-button"
                )

        };


        registrarEventos();

        atualizarInterfaceInicial();


        /* -------------------------------------------------
           AGUARDAR AUTH
        ------------------------------------------------- */

        let tentativas =
            0;

        const maxTentativas =
            40;


        const aguardarUsuario =
            setInterval(
                async function () {

                    tentativas++;


                    const usuario =
                        obterUsuario();


                    if (usuario?.id) {

                        clearInterval(
                            aguardarUsuario
                        );


                        /*
                         * Apenas verifica se a mesa
                         * salva ainda existe.
                         *
                         * Não ativa automaticamente.
                         * Não redireciona.
                         */

                        await verificarMesaAtiva();

                        atualizarInterfaceInicial();

                        return;

                    }


                    if (
                        tentativas >=
                        maxTentativas
                    ) {

                        clearInterval(
                            aguardarUsuario
                        );

                    }

                },
                250
            );

    }


    /* =====================================================
       API GLOBAL
       ===================================================== */

    window.rpgMesaEntrada = {

        entrarPorCodigo,

        continuarCampanha,

        abrirFormularioCodigo,

        esconderFormularioCodigo,

        copiarCodigoCampanha,

        verificarMesaAtiva,

        salvarMesaAtiva,

        obterMesaAtivaLocal,

        limparMesaAtivaLocal,

        personagemEstaConfirmado,

        buscarCampanha

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
