/* =========================================================
   RPG — SISTEMA CENTRAL DE CARREGAMENTO
   Supabase → Estado do RPG → Interface
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
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        if (
            document.readyState === "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                iniciar,
                { once: true }
            );

            return;

        }


        registrarEventos();


        /*
           Tentativa inicial.

           Não criamos polling próprio.
           Os eventos de AUTH/CAMPANHA
           são responsáveis por disparar
           novas tentativas.
        */

        tentarCarregar();

    }


    /* =====================================================
       EVENTOS
    ===================================================== */

    function registrarEventos() {

        if (
            window.__carregamentoRPGEventos
        ) {

            return;

        }


        window.__carregamentoRPGEventos =
            true;


        /*
           Quando a autenticação/campanha
           termina de sincronizar.
        */

        window.addEventListener(
            "rpgAuth:campanhaSincronizada",
            () => {

                tentarCarregar();

            }
        );


        /*
           Quando a campanha ativa muda.
        */

        window.addEventListener(
            "mesa:campanhaAlterada",
            () => {

                /*
                   Uma nova campanha significa
                   que podemos ter outro personagem.
                */

                carregado = false;

                ultimoPersonagemId = null;

                ultimaCampanhaId = null;


                tentarCarregar();

            }
        );


        /*
           Quando a sessão mudar.
        */

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


        if (
            !window.supabaseClient
        ) {

            return;

        }


        if (
            !window.rpgAuth
        ) {

            return;

        }


        if (
            !window.rpgAuth.user
        ) {

            return;

        }


        /*
           A campanha precisa estar definida.

           Não selecionamos automaticamente
           uma campanha.
        */

        const campanha =
            obterCampanhaAtiva();


        if (!campanha || !campanha.id) {

            return;

        }


        const user =
            window.rpgAuth.user;


        carregando = true;


        try {

            const personagem =
                await buscarPersonagem(
                    user.id,
                    campanha.id
                );


            if (!personagem) {

                /*
                   Não existe personagem
                   nessa campanha.

                   Não criamos um automaticamente.
                */

                console.info(
                    "[CarregamentoRPG] Nenhum personagem encontrado para a campanha ativa."
                );


                carregado = false;

                ultimoPersonagemId = null;

                ultimaCampanhaId =
                    campanha.id;


                return;

            }


            /*
               Evita recarregar exatamente
               o mesmo personagem na mesma campanha.
            */

            if (
                carregado &&
                ultimoPersonagemId ===
                    personagem.id &&
                ultimaCampanhaId ===
                    campanha.id
            ) {

                return;

            }


            /*
               Restaura o personagem
               no objeto global existente.
            */

            restaurarPersonagem(
                personagem,
                campanha
            );


            /*
               Depois que o estado foi restaurado,
               os módulos podem atualizar a interface.
            */

            atualizarModulos();


            /*
               Sincroniza informações da mesa.
            */

            sincronizarMesa(
                personagem,
                campanha
            );


            carregado = true;

            ultimoPersonagemId =
                personagem.id;

            ultimaCampanhaId =
                campanha.id;


            dispararEventoCarregamento(
                personagem,
                campanha
            );


            console.info(
                "[CarregamentoRPG] Personagem carregado:",
                personagem.name
            );

        }

        catch (error) {

            console.error(
                "[CarregamentoRPG] Erro ao carregar personagem:",
                error
            );

        }

        finally {

            carregando = false;

        }

    }


    /* =====================================================
       CAMPANHA ATIVA
    ===================================================== */

    function obterCampanhaAtiva() {

        /*
           Primeira fonte:
           campaign.js
        */

        if (
            window.rpgCampaign &&
            typeof
                window.rpgCampaign
                    .obterCampanhaAtiva ===
                "function"
        ) {

            const campanha =
                window.rpgCampaign
                    .obterCampanhaAtiva();


            if (
                campanha &&
                campanha.id
            ) {

                return campanha;

            }

        }


        /*
           Segunda fonte:
           auth.js
        */

        if (
            window.rpgAuth &&
            window.rpgAuth.campaign &&
            window.rpgAuth.campaign.id
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

            console.error(
                "[CarregamentoRPG] Erro ao buscar personagem:",
                error
            );


            throw error;

        }


        return data || null;

    }


    /* =====================================================
       RESTAURAR PERSONAGEM
    ===================================================== */

    function restaurarPersonagem(
        dados,
        campanha
    ) {

        /*
           character é uma variável global
           criada pelo script.js.

           Não usamos window.character,
           pois variáveis globais declaradas
           com let/const não precisam existir
           como propriedade de window.
        */

        if (
            typeof character === "undefined" ||
            !character
        ) {

            console.warn(
                "[CarregamentoRPG] Objeto character não encontrado."
            );


            return;

        }


        /*
           -------------------------------------------------
           DADOS PRINCIPAIS
           -------------------------------------------------
        */

        if (
            dados.name !== undefined
        ) {

            character.name =
                dados.name || "";

        }


        if (
            dados.race !== undefined
        ) {

            character.race =
                dados.race || "Humano";

        }


        if (
            dados.class !== undefined
        ) {

            character.class =
                dados.class || "Guerreiro";

        }


        if (
            dados.affinity !== undefined
        ) {

            character.affinity =
                dados.affinity || "";

        }


        if (
            dados.level !== undefined
        ) {

            character.level =
                Number(
                    dados.level
                ) || 1;

        }


        if (
            dados.xp !== undefined
        ) {

            character.xp =
                Number(
                    dados.xp
                ) || 0;

        }


        if (
            dados.crest_xp !== undefined
        ) {

            character.crestXP =
                Number(
                    dados.crest_xp
                ) || 0;

        }


        if (
            dados.attribute_points !==
            undefined
        ) {

            character.attributePoints =
                Number(
                    dados.attribute_points
                ) || 0;

        }


        /* =================================================
           CAMPANHA / SLOT
        ================================================= */

        character.campaign_id =
            dados.campaign_id ||
            campanha.id;


        if (
            dados.slot !== undefined
        ) {

            character.slot =
                dados.slot;

        }


        /*
           ID do Supabase.

           O salvamentos.js utiliza esse
           valor para atualizar a linha correta.
        */

        if (
            dados.id
        ) {

            character.supabaseId =
                dados.id;

        }


        /* =================================================
           RECURSOS
        ================================================= */

        if (
            !character.resources
        ) {

            character.resources = {};

        }


        if (
            dados.hp !== undefined
        ) {

            character.resources.hp =
                Number(
                    dados.hp
                ) || 0;

        }


        if (
            dados.mp !== undefined
        ) {

            character.resources.mp =
                Number(
                    dados.mp
                ) || 0;

        }


        if (
            dados.est !== undefined
        ) {

            character.resources.est =
                Number(
                    dados.est
                ) || 0;

        }


        if (
            dados.sanity !== undefined
        ) {

            character.resources.sanidade =
                Number(
                    dados.sanity
                ) || 0;

        }


        /* =================================================
           IMAGEM
        ================================================= */

        if (
            dados.image_url
        ) {

            character.imageURL =
                String(
                    dados.image_url
                ).trim();


            /*
               Verifica se a imagem salva no Supabase
               corresponde à arte automática atual
               da raça + classe.

               Se corresponder:
               imageAuto = true

               Se for diferente:
               imageAuto = false
               (imagem manual)
            */

            let arteAutomatica = null;


            if (
                typeof CharacterModule !==
                "undefined" &&
                typeof CharacterModule
                    .obterArteAutomatica ===
                    "function"
            ) {

                arteAutomatica =
                    CharacterModule
                        .obterArteAutomatica();

            }


            if (
                arteAutomatica &&
                character.imageURL ===
                    arteAutomatica
            ) {

                character.imageAuto = true;

            }

            else {

                character.imageAuto = false;

            }

        }

        else {

            character.imageURL = "";

            character.imageAuto = true;

        }


        /* =================================================
           COMBATE

           Caso futuramente existam colunas
           JSONB "combat" e "inventory",
           elas serão restauradas automaticamente.

           Se não existirem, nada acontece.
        ================================================= */

        if (
            dados.combat &&
            typeof dados.combat ===
                "object"
        ) {

            character.combat =
                mesclarObjeto(
                    character.combat || {},
                    dados.combat
                );

        }


        /* =================================================
           INVENTÁRIO
        ================================================= */

        if (
            dados.inventory &&
            typeof dados.inventory ===
                "object"
        ) {

            character.inventory =
                mesclarObjeto(
                    character.inventory || {},
                    dados.inventory
                );

        }


        /*
           Garantias mínimas.
        */

        garantirEstruturas();

    }


    /* =====================================================
       MESCLAR OBJETOS
    ===================================================== */

    function mesclarObjeto(
        base,
        dados
    ) {

        if (
            !base ||
            typeof base !== "object"
        ) {

            base = {};

        }


        if (
            !dados ||
            typeof dados !== "object"
        ) {

            return base;

        }


        Object.keys(dados)
            .forEach(
                chave => {

                    const valor =
                        dados[chave];


                    if (
                        valor &&
                        typeof valor ===
                            "object" &&
                        !Array.isArray(
                            valor
                        )
                    ) {

                        base[chave] =
                            mesclarObjeto(
                                base[chave] || {},
                                valor
                            );

                    }

                    else {

                        base[chave] =
                            valor;

                    }

                }
            );


        return base;

    }


    /* =====================================================
       GARANTIR ESTRUTURAS
    ===================================================== */

    function garantirEstruturas() {

        /*
           Recursos
        */

        if (
            !character.resources
        ) {

            character.resources = {};

        }


        /*
           Combate
        */

        if (
            !character.combat
        ) {

            character.combat = {};

        }


        if (
            !Array.isArray(
                character.combat.abilities
            )
        ) {

            character.combat.abilities = [];

        }


        if (
            !character.combat.passive
        ) {

            character.combat.passive = {

                name: "",

                description: ""

            };

        }


        if (
            !Array.isArray(
                character.combat.log
            )
        ) {

            character.combat.log = [];

        }


        /*
           Inventário
        */

        if (
            !character.inventory
        ) {

            character.inventory = {};

        }


        if (
            !Array.isArray(
                character.inventory.items
            )
        ) {

            character.inventory.items = [];

        }


        if (
            !character.inventory.equipment
        ) {

            character.inventory.equipment = {

                weapon: "",

                armor: "",

                accessory: "",

                relic: ""

            };

        }

    }


    /* =====================================================
       ATUALIZAR MÓDULOS
    ===================================================== */

    function atualizarModulos() {

        /*
           Primeiro a estrutura base
           do personagem.
        */

        if (
            typeof CharacterModule !==
            "undefined"
        ) {

            if (
                typeof CharacterModule
                    .aplicarArteAutomatica ===
                    "function"
            ) {

                /*
                   A arte automática é determinada
                   pela raça + classe.
                */

                CharacterModule
                    .aplicarArteAutomatica();

            }

            else if (
                typeof CharacterModule
                    .atualizarImagem ===
                    "function"
            ) {

                CharacterModule
                    .atualizarImagem();

            }

        }


        /*
           Combate
        */

        if (
            typeof CombatModule !==
                "undefined" &&
            typeof CombatModule
                .atualizar ===
                "function"
        ) {

            CombatModule
                .atualizar();

        }


        /*
           Inventário
        */

        if (
            typeof InventoryModule !==
                "undefined" &&
            typeof InventoryModule
                .atualizar ===
                "function"
        ) {

            InventoryModule
                .atualizar();

        }


        /*
           Interface geral.

           Não é obrigatório existir.
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
            window.MesaRPG &&
            typeof
                window.MesaRPG
                    .sincronizarCampanha ===
                "function"
        ) {

            window.MesaRPG
                .sincronizarCampanha(
                    campanha
                );

        }


        /*
           Se a mesa possuir uma API de
           jogador atual, usamos somente
           se ela existir.
        */

        if (
            window.MesaRPG &&
            typeof
                window.MesaRPG
                    .atualizarJogadorAtual ===
                "function"
        ) {

            window.MesaRPG
                .atualizarJogadorAtual(
                    personagem.id ||
                    personagem.supabaseId ||
                    null
                );

        }

    }


    /* =====================================================
       EVENTO DE CONCLUSÃO
    ===================================================== */

    function dispararEventoCarregamento(
        personagem,
        campanha
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "rpg:carregamentoConcluido",
                {

                    detail: {

                        character:
                            personagem,

                        campaign:
                            campanha

                    }

                }
            )
        );

    }


    /* =====================================================
       RECARREGAR MANUALMENTE
    ===================================================== */

    async function recarregar() {

        carregado = false;

        ultimoPersonagemId = null;

        ultimaCampanhaId = null;


        return tentarCarregar();

    }


    /* =====================================================
       ESTADO
    ===================================================== */

    function estaCarregado() {

        return carregado;

    }


    function estaCarregando() {

        return carregando;

    }


    /* =====================================================
       API
    ===================================================== */

    return {

        iniciar,

        tentarCarregar,

        recarregar,

        estaCarregado,

        estaCarregando

    };

})();


/* =========================================================
   API GLOBAL
========================================================= */

window.CarregamentoRPG =
    CarregamentoRPG;


/* =========================================================
   INICIAR
========================================================= */

CarregamentoRPG.iniciar();
