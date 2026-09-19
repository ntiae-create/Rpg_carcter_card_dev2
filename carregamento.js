/* =========================================================
   RPG — CARREGAMENTO CENTRAL
   Supabase → personagem → módulos → interface
========================================================= */

const CarregamentoRPG = (() => {

    /* =====================================================
       ESTADO
    ===================================================== */

    let carregando = false;

    let carregado = false;

    let ultimoPersonagemId = null;

    let ultimaCampanhaId = null;


    /* =====================================================
       INICIAR
    ===================================================== */

    function iniciar() {

        registrarEventos();

        tentarCarregar();

    }


    /* =====================================================
       EVENTOS
    ===================================================== */

    function registrarEventos() {

        window.addEventListener(
            "rpgAuth:campanhaSincronizada",
            () => {

                tentarCarregar();

            }
        );


        window.addEventListener(
            "mesa:campanhaAlterada",
            () => {

                carregado = false;

                ultimoPersonagemId = null;

                ultimaCampanhaId = null;

                tentarCarregar();

            }
        );


        window.addEventListener(
            "rpgAuth:sessaoAtualizada",
            () => {

                carregado = false;

                ultimoPersonagemId = null;

                ultimaCampanhaId = null;

                tentarCarregar();

            }
        );

    }


    /* =====================================================
       TENTAR CARREGAR
    ===================================================== */

    async function tentarCarregar() {

        if (carregando) {

            return;

        }


        if (!window.supabaseClient) {

            return;

        }


        if (!window.rpgAuth) {

            return;

        }


        if (!window.rpgAuth.user) {

            return;

        }


        const campanha =
            obterCampanhaAtiva();


        /*
           Para jogadores precisamos da campanha.

           Para o Mestre, o personagem pode ser
           independente da campanha, portanto o
           carregamento será feito pelo supabaseId
           salvo no personagem local.
        */

        const ehMestre =
            window.rpgAuth.isMaster === true;


        if (
            !ehMestre &&
            (!campanha || !campanha.id)
        ) {

            return;

        }


        carregando = true;


        try {

            const personagem =
                await buscarPersonagem(
                    window.rpgAuth.user.id,
                    campanha
                        ? campanha.id
                        : null
                );


            if (!personagem) {

                /*
                   Não apagamos o personagem local
                   quando nenhum registro é encontrado.
                   Isso evita destruir o estado atual
                   simplesmente porque a campanha ainda
                   não foi sincronizada.
                */

                carregando = false;

                return;

            }


            /*
               Evita restaurar exatamente o mesmo
               personagem repetidamente.
            */

            if (
                carregado &&
                ultimoPersonagemId === personagem.id &&
                (
                    !campanha ||
                    ultimaCampanhaId === campanha.id
                )
            ) {

                carregando = false;

                return;

            }


            restaurarPersonagem(
                personagem
            );


            atualizarModulos();


            sincronizarMesa(
                personagem,
                campanha
            );


            carregado = true;

            ultimoPersonagemId =
                personagem.id;

            ultimaCampanhaId =
                campanha
                    ? campanha.id
                    : null;


        }

        catch (erro) {

            console.error(
                "[CarregamentoRPG] Erro ao carregar personagem:",
                erro
            );

        }


        carregando = false;

    }


    /* =====================================================
       CAMPANHA ATIVA
    ===================================================== */

    function obterCampanhaAtiva() {

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.obterCampanhaAtiva ===
            "function"
        ) {

            const campanha =
                window.rpgCampaign.obterCampanhaAtiva();


            if (campanha) {

                return campanha;

            }

        }


        if (
            window.rpgAuth &&
            window.rpgAuth.campaign
        ) {

            return window.rpgAuth.campaign;

        }


        return null;

    }


    /* =====================================================
       BUSCAR PERSONAGEM
    ===================================================== */

    async function buscarPersonagem(
        userId,
        campaignId
    ) {

        const ehMestre =
            window.rpgAuth &&
            window.rpgAuth.isMaster === true;


        /*
           ==================================================
           MESTRE
           ==================================================

           O personagem do Mestre não precisa pertencer
           à campanha.

           Usamos primeiro o ID do personagem que já
           está identificado no estado local.

           Isso é importante porque o Mestre pode possuir
           mais de um personagem independente.
        */

        if (ehMestre) {

            let characterId = null;


            /*
               Primeiro tenta o personagem global atual.
            */

            if (
                typeof character !== "undefined" &&
                character &&
                character.supabaseId
            ) {

                characterId =
                    character.supabaseId;

            }


            /*
               Caso o estado global ainda não tenha o ID,
               tenta o localStorage diretamente.
            */

            if (!characterId) {

                try {

                    const STORAGE_KEY =
                        "rpg_character_card";


                    const salvo =
                        localStorage.getItem(
                            STORAGE_KEY
                        );


                    if (salvo) {

                        const dados =
                            JSON.parse(
                                salvo
                            );


                        if (
                            dados &&
                            dados.supabaseId
                        ) {

                            characterId =
                                dados.supabaseId;

                        }

                    }

                }

                catch (erro) {

                    console.warn(
                        "[CarregamentoRPG] Não foi possível ler o personagem salvo:",
                        erro
                    );

                }

            }


            /*
               Se temos o ID, buscamos exatamente
               aquele personagem pertencente ao usuário.
            */

            if (characterId) {

                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .from("characters")
                        .select("*")
                        .eq(
                            "id",
                            characterId
                        )
                        .eq(
                            "user_id",
                            userId
                        )
                        .maybeSingle();


                if (error) {

                    throw error;

                }


                if (data) {

                    return data;

                }

            }


            /*
               Fallback seguro:
               se não houver supabaseId, tenta encontrar
               um personagem independente do Mestre.

               Não usamos maybeSingle aqui porque o Mestre
               pode possuir vários personagens independentes.
            */

            const {
                data: personagens,
                error: erroFallback
            } =
                await window.supabaseClient
                    .from("characters")
                    .select("*")
                    .eq(
                        "user_id",
                        userId
                    )
                    .is(
                        "campaign_id",
                        null
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (erroFallback) {

                throw erroFallback;

            }


            /*
               Se houver apenas um personagem independente,
               podemos utilizá-lo.

               Se houver vários e nenhum supabaseId puder
               identificar o atual, não escolhemos
               arbitrariamente um personagem.
            */

            if (
                Array.isArray(personagens) &&
                personagens.length === 1
            ) {

                return personagens[0];

            }


            return null;

        }


        /*
           ==================================================
           JOGADOR
           ==================================================

           Jogadores continuam sendo carregados
           exclusivamente pelo usuário + campanha.
        */

        if (!campaignId) {

            return null;

        }


        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("characters")
                .select("*")
                .eq(
                    "user_id",
                    userId
                )
                .eq(
                    "campaign_id",
                    campaignId
                )
                .maybeSingle();


        if (error) {

            throw error;

        }


        return data || null;

    }


    /* =====================================================
       RESTAURAR PERSONAGEM
    ===================================================== */

    function restaurarPersonagem(
        dados
    ) {

        if (
            typeof character === "undefined"
        ) {

            return;

        }


        /*
           ==================================================
           IDENTIFICAÇÃO
           ==================================================
        */

        character.supabaseId =
            dados.id || null;


        character.campaign_id =
            dados.campaign_id || null;


        character.slot =
            dados.slot ?? null;


        /*
           ==================================================
           DADOS PRINCIPAIS
           ==================================================
        */

        if (
            dados.name !== undefined
        ) {

            character.name =
                dados.name;

        }


        if (
            dados.race !== undefined
        ) {

            character.race =
                dados.race;

        }


        if (
            dados.class !== undefined
        ) {

            character.class =
                dados.class;

        }


        if (
            dados.affinity !== undefined
        ) {

            character.affinity =
                dados.affinity;

        }


        /*
           ==================================================
           PROGRESSÃO
           ==================================================
        */

        if (
            dados.level !== undefined
        ) {

            character.level =
                dados.level;

        }


        if (
            dados.xp !== undefined
        ) {

            character.xp =
                dados.xp;

        }


        if (
            dados.crest_xp !== undefined
        ) {

            character.crestXP =
                dados.crest_xp;

        }


        if (
            dados.attribute_points !== undefined
        ) {

            character.attributePoints =
                dados.attribute_points;

        }


        /*
           ==================================================
           SANIDADE
           ==================================================
        */

        if (
            !character.resources ||
            typeof character.resources !== "object"
        ) {

            character.resources = {};

        }


        if (
            dados.sanity !== undefined
        ) {

            character.resources.sanidade =
                dados.sanity;

        }


        /*
           ==================================================
           RECURSOS
           ==================================================
        */

        if (
            dados.hp !== undefined
        ) {

            character.resources.hp =
                dados.hp;

        }


        if (
            dados.mp !== undefined
        ) {

            character.resources.mp =
                dados.mp;

        }


        if (
            dados.est !== undefined
        ) {

            character.resources.est =
                dados.est;

        }


        /*
           ==================================================
           IMAGEM
           ==================================================

           Se o Supabase possui image_url, ele tem
           prioridade.

           Não comparamos com a arte automática aqui,
           porque uma URL salva no banco representa
           explicitamente a imagem daquele personagem.
        */

        if (
            dados.image_url &&
            String(
                dados.image_url
            ).trim()
        ) {

            character.imageURL =
                String(
                    dados.image_url
                ).trim();


            character.imageAuto =
                false;

        }

        else {

            character.imageURL =
                "";


            character.imageAuto =
                true;

        }


        /*
           ==================================================
           CONFIRMAÇÃO
           ==================================================
        */

        if (
            dados.confirmed !== undefined
        ) {

            character.confirmed =
                dados.confirmed;

        }


        /*
           ==================================================
           SALVAR NO ESTADO LOCAL
           ==================================================

           O localStorage serve como cache local do
           personagem restaurado.
        */

        try {

            localStorage.setItem(
                "rpg_character_card",
                JSON.stringify(
                    character
                )
            );

        }

        catch (erro) {

            console.warn(
                "[CarregamentoRPG] Não foi possível atualizar o armazenamento local:",
                erro
            );

        }

    }


    /* =====================================================
       ATUALIZAR MÓDULOS
    ===================================================== */

    function atualizarModulos() {

        /*
           CHARACTER
        */

        if (
            typeof CharacterModule !==
            "undefined"
        ) {

            /*
               Se não existe imagem salva,
               permite que o CharacterModule gere
               a arte automática através de raça + classe.
            */

            if (
                !character.imageURL &&
                typeof CharacterModule.aplicarArteAutomatica ===
                "function"
            ) {

                CharacterModule.aplicarArteAutomatica();

            }

            else if (
                typeof CharacterModule.atualizarImagem ===
                "function"
            ) {

                CharacterModule.atualizarImagem();

            }

        }


        /*
           COMBATE
        */

        if (
            typeof CombatModule !==
            "undefined"
        ) {

            if (
                typeof CombatModule.atualizar ===
                "function"
            ) {

                CombatModule.atualizar();

            }

        }


        /*
           INVENTÁRIO
        */

        if (
            typeof InventoryModule !==
            "undefined"
        ) {

            if (
                typeof InventoryModule.atualizar ===
                "function"
            ) {

                InventoryModule.atualizar();

            }

        }


        /*
           INTERFACE PRINCIPAL
        */

        if (
            typeof atualizarInterface ===
            "function"
        ) {

            atualizarInterface();

        }

    }


    /* =====================================================
       SINCRONIZAR MESA
    ===================================================== */

    function sincronizarMesa(
        personagem,
        campanha
    ) {

        if (
            !window.rpgAuth
        ) {

            return;

        }


        /*
           Atualiza a referência do personagem atual
           dentro do contexto de autenticação quando
           possível.
        */

        window.rpgAuth.currentCharacter =
            personagem;


        window.rpgAuth.campaignCharacter =
            personagem;


        /*
           Personagem do Mestre pode não possuir
           campaign_id/slot.

           Portanto não alteramos esses valores aqui.
        */

        if (
            campanha &&
            campanha.id &&
            personagem.campaign_id === campanha.id
        ) {

            window.rpgAuth.campaignCharacter =
                personagem;

        }


        /*
           Notifica os módulos que dependem do
           personagem restaurado.
        */

        window.dispatchEvent(
            new CustomEvent(
                "rpg:personagemCarregado",
                {
                    detail: {
                        personagem:
                            personagem,

                        campanha:
                            campanha || null
                    }
                }
            )
        );


        window.dispatchEvent(
            new CustomEvent(
                "mesa:jogadorAtualizado",
                {
                    detail: {
                        characterId:
                            personagem.id,

                        slot:
                            personagem.slot,

                        userId:
                            personagem.user_id
                    }
                }
            )
        );

    }


    /* =====================================================
       RECARREGAR
    ===================================================== */

    async function recarregar() {

        carregado = false;

        ultimoPersonagemId = null;

        ultimaCampanhaId = null;

        await tentarCarregar();

    }


    /* =====================================================
       ESTADO
    ===================================================== */

    function obterEstado() {

        return {

            carregando,

            carregado,

            ultimoPersonagemId,

            ultimaCampanhaId

        };

    }


    /* =====================================================
       API PÚBLICA
    ===================================================== */

    return {

        iniciar,

        recarregar,

        tentarCarregar,

        obterEstado

    };

})();


/* =========================================================
   DISPONIBILIZAR GLOBALMENTE
========================================================= */

window.CarregamentoRPG =
    CarregamentoRPG;


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            CarregamentoRPG.iniciar();

        }
    );

}

else {

    CarregamentoRPG.iniciar();

}
