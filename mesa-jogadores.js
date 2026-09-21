/* ============================================================
   MESA RPG ONLINE
   mesa-jogadores.js
   SISTEMA DE JOGADORES
   INTEGRAÇÃO COM PERSONAGENS DA CAMPANHA + REALTIME
============================================================ */

"use strict";


/* ============================================================
   REFERÊNCIA AO ESTADO PRINCIPAL
============================================================ */

function obterEstadoMesa() {

    if (
        typeof window.MesaRPG ===
        "undefined"
    ) {

        console.warn(
            "MesaRPG ainda não foi inicializado."
        );

        return null;

    }

    return window.MesaRPG.estado();

}


/* ============================================================
   REFERÊNCIAS DA INTERFACE
============================================================ */

const MesaJogadoresUI = {

    jogadores: null,

    cards: [],

    ficha: null

};


/* ============================================================
   CACHE REALTIME DOS PERSONAGENS
============================================================ */

/*
    IMPORTANTE:

    Este cache recebe diretamente os personagens
    carregados pelo mesa.js através do Supabase.

    Enquanto o Realtime ainda não respondeu,
    usamos os dados do auth.js.

    Depois que o Realtime respondeu uma vez,
    ele passa a ser a fonte principal.
*/

let personagensMesaRealtime = [];

let personagensMesaRealtimeAtivo = false;


/* ============================================================
   RECEBER PERSONAGENS DO REALTIME
============================================================ */

function sincronizarDadosRealtime(
    personagens = [],
    emitirEvento = true
) {

    personagensMesaRealtime =
        Array.isArray(personagens)
            ? personagens
            : [];


    /*
        A partir deste momento sabemos que
        o carregamento oficial do Supabase
        já aconteceu.

        Inclusive se o resultado for [].

        Isso é importante para que um jogador
        que sair da mesa não permaneça preso
        no cache antigo.
    */

    personagensMesaRealtimeAtivo =
        true;


    /*
        Atualiza também o auth para manter
        compatibilidade com outros sistemas.
    */

    if (
        window.rpgAuth
    ) {

        window.rpgAuth.campaignCharacters =
            personagensMesaRealtime;

    }


    /*
        Sincroniza os 8 slots.
    */

    sincronizarPersonagensCampanha();


    /*
        Atualiza os cards imediatamente.
    */

    atualizarTodosOsCards();


    /*
        Notifica outros sistemas da Mesa.

        IMPORTANTE:

        Quando esta função for chamada pelo próprio
        evento "mesa:jogadoresAtualizados", não
        emitimos o evento novamente.

        Isso evita um loop infinito.
    */

    if (
        emitirEvento
    ) {

        document.dispatchEvent(
            new CustomEvent(
                "mesa:jogadoresAtualizados",
                {
                    detail: {

                        personagens:
                            personagensMesaRealtime

                    }

                }
            )
        );

    }

}


/* ============================================================
   INICIALIZAÇÃO
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarMesaJogadores();

    }
);


async function inicializarMesaJogadores() {

    MesaJogadoresUI.jogadores =
        document.getElementById(
            "jogadores"
        );


    MesaJogadoresUI.cards =
        Array.from(
            document.querySelectorAll(
                ".player-card"
            )
        );


    registrarEventosJogadores();


    /*
        Primeiro tentamos sincronizar
        usando o que já estiver disponível
        localmente.
    */

    sincronizarPersonagensCampanha();


    atualizarTodosOsCards();


    /* ========================================================
       REALTIME — PERSONAGENS ATUALIZADOS
    ======================================================== */

    /*
        ESTE É O EVENTO OFICIAL ENVIADO PELO MESA.JS.

        O mesa.js já consultou o Supabase e está
        entregando a lista pronta.

        Portanto:

        - recebemos os personagens;
        - atualizamos o cache;
        - NÃO emitimos o mesmo evento novamente.

        Isso elimina o loop:
        mesa.js → mesa-jogadores → mesa.js → ...
    */

    document.addEventListener(
        "mesa:jogadoresAtualizados",
        evento => {

            const personagens =
                evento.detail?.personagens;


            if (
                Array.isArray(
                    personagens
                )
            ) {

                sincronizarDadosRealtime(
                    personagens,
                    false
                );

            }

        }
    );


    /* ========================================================
       EVENTO ESPECÍFICO DE REALTIME
    ======================================================== */

    document.addEventListener(
        "mesa:jogadores:realtime",
        evento => {

            const personagens =
                evento.detail?.personagens;


            if (
                Array.isArray(
                    personagens
                )
            ) {

                sincronizarDadosRealtime(
                    personagens
                );

            }

        }
    );


    /* ========================================================
       EVENTOS EXISTENTES DA MESA
    ======================================================== */

    document.addEventListener(
        "mesa:jogadorAtualizado",
        evento => {

            const playerId =
                evento.detail?.playerId;


            if (playerId) {

                atualizarCardJogadorCompleto(
                    playerId
                );

            }

        }
    );


    document.addEventListener(
        "mesa:estadoJogadoresAtualizado",
        () => {

            atualizarTodosOsCards();

        }
    );


    /*
        Caso o auth termine de carregar
        a campanha depois da Mesa.
    */

    document.addEventListener(
        "rpg:campanhaAtualizada",
        () => {

            sincronizarPersonagensCampanha();

            atualizarTodosOsCards();


            /*
                Se o mesa.js já estiver disponível,
                solicitamos uma leitura oficial
                do Supabase.
            */

            solicitarCargaRealtime();

        }
    );


    /* ========================================================
       PRIMEIRA CARGA OFICIAL
    ======================================================== */

    /*
        Damos um pequeno intervalo para garantir
        que mesa.js já tenha criado MesaRPG.
    */

    setTimeout(
        () => {

            solicitarCargaRealtime();

        },
        150
    );


    /* ========================================================
       TENTATIVAS DE SEGURANÇA
    ======================================================== */

    let tentativas = 0;

    const intervalo =
        setInterval(
            () => {

                tentativas++;


                /*
                    Se o Realtime já respondeu,
                    não precisamos mais fazer
                    tentativas.
                */

                if (
                    personagensMesaRealtimeAtivo
                ) {

                    clearInterval(
                        intervalo
                    );

                    return;

                }


                const personagens =
                    obterPersonagensCampanha();


                if (
                    personagens.length > 0
                ) {

                    sincronizarPersonagensCampanha();

                    atualizarTodosOsCards();

                }


                /*
                    Tentamos novamente solicitar
                    os dados oficiais.
                */

                solicitarCargaRealtime();


                if (
                    tentativas >= 40
                ) {

                    clearInterval(
                        intervalo
                    );

                }

            },
            250
        );


    console.log(
        "👥 Sistema de jogadores inicializado."
    );

}


/* ============================================================
   SOLICITAR CARGA REALTIME
============================================================ */

function solicitarCargaRealtime() {

    /*
        O mesa.js possui a função oficial
        que consulta characters no Supabase.
    */

    if (
        window.MesaRPG &&
        typeof window.MesaRPG
            .carregarJogadoresDaCampanha ===
            "function"
    ) {

        try {

            const resultado =
                window.MesaRPG
                    .carregarJogadoresDaCampanha();


            /*
                Não precisamos aguardar o resultado
                para não bloquear a interface.

                O próprio mesa.js disparará
                os eventos quando terminar.
            */

            if (
                resultado &&
                typeof resultado.then ===
                "function"
            ) {

                resultado.catch(
                    erro => {

                        console.warn(
                            "⚠️ Falha ao carregar jogadores da campanha:",
                            erro
                        );

                    }
                );

            }

            return true;

        } catch (erro) {

            console.warn(
                "⚠️ Erro solicitando jogadores ao MesaRPG:",
                erro
            );

        }

    }


    return false;

}


/* ============================================================
   EVENTOS
============================================================ */

function registrarEventosJogadores() {

    MesaJogadoresUI.cards.forEach(
        card => {

            /*
                O mesa.js já possui o evento
                principal de seleção do jogador.

                Aqui não adicionamos outro clique
                para evitar conflito.
            */

            card.addEventListener(
                "contextmenu",
                evento => {

                    evento.preventDefault();


                    const playerId =
                        Number(
                            card.dataset.player
                        );


                    emitirEventoJogadores(
                        "jogadorMenu",
                        {
                            playerId
                        }
                    );

                }
            );

        }
    );

}


/* ============================================================
   PERSONAGENS DA CAMPANHA
============================================================ */

function obterPersonagensCampanha() {

    /*
        PRIMEIRA PRIORIDADE:
        dados oficiais recebidos pelo Realtime.
    */

    if (
        personagensMesaRealtimeAtivo
    ) {

        return personagensMesaRealtime;

    }


    /*
        SEGUNDA PRIORIDADE:
        dados carregados pelo auth.js.
    */

    if (
        window.rpgAuth &&
        Array.isArray(
            window.rpgAuth.campaignCharacters
        )
    ) {

        return window.rpgAuth.campaignCharacters;

    }


    /*
        TERCEIRA PRIORIDADE:
        função global antiga,
        caso outro arquivo ainda a forneça.
    */

    if (
        typeof window.obterPersonagensCampanha ===
        "function" &&
        window.obterPersonagensCampanha !==
        obterPersonagensCampanha
    ) {

        try {

            const personagens =
                window.obterPersonagensCampanha();


            return Array.isArray(
                personagens
            )
                ? personagens
                : [];

        } catch (erro) {

            console.warn(
                "⚠️ Erro obtendo personagens da campanha:",
                erro
            );

        }

    }


    return [];

}


/* ============================================================
   OBTER PERSONAGEM PELO SLOT
============================================================ */

function obterPersonagemPorSlot(
    slot
) {

    const personagens =
        obterPersonagensCampanha();


    const numeroSlot =
        Number(slot);


    if (
        !Number.isInteger(
            numeroSlot
        )
    ) {

        return null;

    }


    return (
        personagens.find(
            personagem => {

                const slotPersonagem =
                    Number(
                        personagem?.slot
                    );


                return (
                    Number.isInteger(
                        slotPersonagem
                    ) &&
                    slotPersonagem ===
                    numeroSlot
                );

            }
        ) ||
        null
    );

}


/* ============================================================
   CONVERTER PERSONAGEM → JOGADOR DA MESA
============================================================ */

function converterPersonagemParaJogador(
    personagem,
    jogadorBase
) {

    if (
        !personagem
    ) {

        return jogadorBase;

    }


    /* ========================================================
       HP / MP
    ======================================================== */

    const hp =
        Number(
            personagem.hp
        );


    const mp =
        Number(
            personagem.mp
        );


    /*
        Mantemos os valores máximos
        já existentes no estado da Mesa
        quando disponíveis.

        Caso contrário usamos os valores
        atuais do personagem como máximo.
    */

    const hpMaximo =
        jogadorBase?.hp?.maximo > 0
            ? Number(
                jogadorBase.hp.maximo
            )
            : (
                Number.isFinite(hp) &&
                hp > 0
                    ? hp
                    : 100
            );


    const manaMaximo =
        jogadorBase?.mana?.maximo > 0
            ? Number(
                jogadorBase.mana.maximo
            )
            : (
                Number.isFinite(mp) &&
                mp > 0
                    ? mp
                    : 100
            );


    const hpAtual =
        Number.isFinite(hp)
            ? Math.max(
                0,
                Math.min(
                    hpMaximo,
                    hp
                )
            )
            : hpMaximo;


    const manaAtual =
        Number.isFinite(mp)
            ? Math.max(
                0,
                Math.min(
                    manaMaximo,
                    mp
                )
            )
            : manaMaximo;


    /* ========================================================
       RECURSOS BÁSICOS
    ======================================================== */

    const recursos =
        personagem.recursos ||
        personagem.resources ||
        {};


    const estamina =
        obterRecursoBasico(
            personagem,
            recursos,
            [
                "estamina",
                "stamina",
                "est"
            ],
            jogadorBase?.estamina
        );


    const sanidade =
        obterRecursoBasico(
            personagem,
            recursos,
            [
                "sanidade",
                "sanity",
                "san"
            ],
            jogadorBase?.sanidade
        );


    return {

        ...(jogadorBase || {}),


        id:
            Number(
                personagem.slot
            ),


        characterId:
            personagem.id ||
            null,


        userId:
            personagem.user_id ||
            null,


        slot:
            Number(
                personagem.slot
            ),


        nome:
            personagem.name ||
            personagem.nome ||
            jogadorBase?.nome ||
            `Player ${personagem.slot}`,


        raca:
            personagem.race ||
            personagem.raca ||
            jogadorBase?.raca ||
            "Raça",


        classe:
            personagem.class ||
            personagem.classe ||
            jogadorBase?.classe ||
            "Classe",


        afinidade:
            personagem.affinity ||
            personagem.afinidade ||
            jogadorBase?.afinidade ||
            null,


        nivel:
            Number(
                personagem.level
            ) ||
            jogadorBase?.nivel ||
            1,


        xp:
            Number(
                personagem.xp
            ) ||
            jogadorBase?.xp ||
            0,


        avatar:
            personagem.image_url ||
            personagem.avatar ||
            jogadorBase?.avatar ||
            null,


        atributos:
            personagem.atributos ||
            personagem.attributes ||
            {
                atk:
                    personagem.atk,

                atkMgc:
                    personagem.atk_mgc ||
                    personagem.atkMgc,

                def:
                    personagem.def,

                res:
                    personagem.res,

                agi:
                    personagem.agi,

                int:
                    personagem.int
            },


        /*
            Recursos básicos utilizados
            diretamente pelo card.

            Mantemos os três nomes para
            compatibilidade com sistemas existentes.
        */

        recursos: {

            est:
                estamina,

            estamina:
                estamina,

            sanidade:
                sanidade

        },


        estamina:
            estamina,


        sanidade:
            sanidade,


        /*
            Mantemos o inventário do personagem
            se ele existir no banco.

            Caso não exista, preservamos
            o inventário já existente na Mesa.
        */

        inventario:
            Array.isArray(
                personagem.inventario
            )
                ? personagem.inventario
                : (
                    Array.isArray(
                        personagem.inventory
                    )
                        ? personagem.inventory
                        : (
                            personagem.inventory &&
                            Array.isArray(
                                personagem.inventory.items
                            )
                                ? personagem.inventory.items
                                : (
                                    Array.isArray(
                                        jogadorBase?.inventario
                                    )
                                        ? jogadorBase.inventario
                                        : []
                                )
                        )
                ),


        hp: {

            atual:
                hpAtual,

            maximo:
                hpMaximo

        },


        mana: {

            atual:
                manaAtual,

            maximo:
                manaMaximo

        },


        status:
            Array.isArray(
                jogadorBase?.status
            )
                ? jogadorBase.status
                : [],


        fome:
            Number.isFinite(
                Number(
                    jogadorBase?.fome
                )
            )
                ? Number(
                    jogadorBase.fome
                )
                : 100,


        sede:
            Number.isFinite(
                Number(
                    jogadorBase?.sede
                )
            )
                ? Number(
                    jogadorBase.sede
                )
                : 100,


        habilidades:
            Array.isArray(
                jogadorBase?.habilidades
            )
                ? [
                    jogadorBase.habilidades[0] ?? null,
                    jogadorBase.habilidades[1] ?? null,
                    jogadorBase.habilidades[2] ?? null
                ]
                : [
                    null,
                    null,
                    null
                ],


        passiva:
            jogadorBase?.passiva ||
            null,


        passivaClasse:
            jogadorBase?.passivaClasse ||
            null,


        conectado:
            jogadorBase?.conectado !== false,


        emBatalha:
            Boolean(
                jogadorBase?.emBatalha
            )

    };

}


/* ============================================================
   OBTER RECURSO BÁSICO
============================================================ */

function obterRecursoBasico(
    personagem,
    recursos,
    nomes,
    recursoAnterior
) {

    let valor = null;


    /*
        Procura primeiro dentro de "recursos".
    */

    for (
        const nome of nomes
    ) {

        if (
            recursos &&
            recursos[nome] !== undefined &&
            recursos[nome] !== null
        ) {

            valor =
                recursos[nome];

            break;

        }

    }


    /*
        Se não encontrou, procura diretamente
        no personagem.
    */

    if (
        valor === null
    ) {

        for (
            const nome of nomes
        ) {

            if (
                personagem &&
                personagem[nome] !== undefined &&
                personagem[nome] !== null
            ) {

                valor =
                    personagem[nome];

                break;

            }

        }

    }


    /*
        Se ainda não encontrou, mantém
        o valor anterior da Mesa.
    */

    if (
        valor === null &&
        recursoAnterior !== undefined &&
        recursoAnterior !== null
    ) {

        valor =
            recursoAnterior;

    }


    /*
        Recurso no formato:

        {
            atual: 80,
            maximo: 100
        }
    */

    if (
        valor &&
        typeof valor === "object"
    ) {

        const atual =
            Number(
                valor.atual ??
                valor.current ??
                valor.valor ??
                100
            );


        const maximo =
            Number(
                valor.maximo ??
                valor.max ??
                valor.maximum ??
                100
            );


        return {

            atual:
                Number.isFinite(atual)
                    ? Math.max(
                        0,
                        atual
                    )
                    : 100,

            maximo:
                Number.isFinite(maximo) &&
                maximo > 0
                    ? maximo
                    : 100

        };

    }


    /*
        Recurso armazenado simplesmente
        como número.
    */

    const numero =
        Number(
            valor
        );


    if (
        Number.isFinite(numero)
    ) {

        return {

            atual:
                Math.max(
                    0,
                    numero
                ),

            maximo:
                100

        };

    }


    /*
        Valor padrão para personagens
        que ainda não possuem o recurso.
    */

    return {

        atual:
            100,

        maximo:
            100

    };

}


/* ============================================================
   SINCRONIZAR PERSONAGENS COM OS 8 SLOTS
============================================================ */

function sincronizarPersonagensCampanha() {

    const estado =
        obterEstadoMesa();


    if (!estado) {

        return false;

    }


    if (
        !Array.isArray(
            estado.jogadores
        )
    ) {

        return false;

    }


    const personagens =
        obterPersonagensCampanha();


    /*
        IMPORTANTE:

        Se ainda não recebemos os dados oficiais
        do Supabase e não há personagens locais,
        NÃO destruímos os jogadores existentes.

        Isso evita que a primeira sincronização
        transforme os 8 slots em vazios antes
        do Realtime terminar.
    */

    if (
        !personagensMesaRealtimeAtivo &&
        personagens.length === 0
    ) {

        return false;

    }


    /*
        Criamos um mapa dos personagens por slot.
    */

    const personagensPorSlot =
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

                personagensPorSlot.set(
                    slot,
                    personagem
                );

            }

        }
    );


    /*
        Os 8 jogadores continuam existindo
        no estado da Mesa.

        Os slots ocupados recebem
        os personagens reais.

        Os slots sem personagem ficam
        realmente livres.
    */

    for (
        let slot = 1;
        slot <= 8;
        slot++
    ) {

        const indice =
            slot - 1;


        const jogadorBase =
            estado.jogadores[indice] ||
            {};


        const personagem =
            personagensPorSlot.get(
                slot
            ) ||
            null;


        if (
            personagem
        ) {

            estado.jogadores[indice] =
                converterPersonagemParaJogador(
                    personagem,
                    jogadorBase
                );

        }

        else {

            /*
                Slot vazio.

                Mantemos somente os dados estruturais
                necessários para o funcionamento do sistema.
            */

            estado.jogadores[indice] = {

                ...(jogadorBase || {}),

                id:
                    slot,

                characterId:
                    null,

                userId:
                    null,

                slot,

                nome:
                    `Player ${slot}`,

                raca:
                    "Raça",

                classe:
                    "Classe",

                afinidade:
                    null,

                conectado:
                    false,

                emBatalha:
                    false

            };

        }

    }


    atualizarTodosOsCards();


    emitirEventoJogadores(
        "personagensSincronizados",
        {

            quantidade:
                personagens.length

        }
    );


    return true;

}


/* ============================================================
   OBTER JOGADOR
============================================================ */

function obterJogadorLocal(
    playerId
) {

    const estado =
        obterEstadoMesa();


    if (!estado) {

        return null;

    }


    return estado.jogadores.find(
        jogador =>
            Number(
                jogador.id
            ) ===
            Number(playerId)
    );

}


/* ============================================================
   ATUALIZAR TODOS OS CARDS
============================================================ */

function atualizarTodosOsCards() {

    const estado =
        obterEstadoMesa();


    if (!estado) {

        return;

    }


    estado.jogadores.forEach(
        jogador => {

            atualizarCardJogadorCompleto(
                jogador.id
            );

        }
    );

}


/* ============================================================
   ATUALIZAR CARD COMPLETO
============================================================ */

function atualizarCardJogadorCompleto(
    playerId
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return;

    }


    const card =
        document.querySelector(
            `.player-card[data-player="${playerId}"]`
        );


    if (!card) {

        return;

    }


    const possuiPersonagem =
        Boolean(
            jogador.characterId
        );


    /*
        Identificamos visualmente se o slot
        está ocupado.
    */

    card.dataset.ocupado =
        possuiPersonagem
            ? "true"
            : "false";


    card.dataset.characterId =
        jogador.characterId ||
        "";


    card.dataset.userId =
        jogador.userId ||
        "";


    card.dataset.slot =
        jogador.slot ||
        playerId;


    /* -----------------------------------------
       IDENTIDADE
    ----------------------------------------- */

    const nome =
        card.querySelector(
            ".player-name"
        );


    const raca =
        card.querySelector(
            ".player-raca"
        );


    const classe =
        card.querySelector(
            ".player-classe"
        );


    const avatar =
        card.querySelector(
            ".player-avatar"
        );


    if (
        possuiPersonagem
    ) {

        if (nome) {

            nome.textContent =
                jogador.nome ||
                `Player ${playerId}`;

        }


        if (raca) {

            raca.textContent =
                jogador.raca ||
                "Raça";

        }


        if (classe) {

            classe.textContent =
                jogador.classe ||
                "Classe";

        }


        /*
            Avatar
        */

        if (
            avatar &&
            jogador.avatar
        ) {

            avatar.innerHTML = "";

            const imagem =
                document.createElement(
                    "img"
                );


            imagem.src =
                jogador.avatar;


            imagem.alt =
                jogador.nome ||
                "Personagem";


            imagem.loading =
                "lazy";


            avatar.appendChild(
                imagem
            );

        }

        else if (
            avatar
        ) {

            avatar.textContent =
                "👤";

        }

    }

    else {

        /*
            SLOT VAZIO
        */

        if (nome) {

            nome.textContent =
                "Aguardando jogador";

        }


        if (raca) {

            raca.textContent =
                `Slot ${playerId}`;

        }


        if (classe) {

            classe.textContent =
                "Livre";

        }


        if (avatar) {

            avatar.innerHTML = "";

            avatar.textContent =
                "👤";

        }

    }


    /* -----------------------------------------
       HP
    ----------------------------------------- */

    atualizarRecursoCard(
        card,
        ".hp-value",
        ".hp-bar span",
        jogador.hp
    );


    /* -----------------------------------------
       MANA
    ----------------------------------------- */

    atualizarRecursoCard(
        card,
        ".mana-value",
        ".mana-bar span",
        jogador.mana
    );


    /* -----------------------------------------
       ATRIBUTOS BÁSICOS
    ----------------------------------------- */

    renderizarAtributosBasicosCard(
        card,
        jogador
    );


    /* -----------------------------------------
       ESTADOS
    ----------------------------------------- */

    card.dataset.conectado =
        jogador.conectado
            ? "true"
            : "false";


    card.dataset.emBatalha =
        jogador.emBatalha
            ? "true"
            : "false";


    card.dataset.playerId =
        jogador.id;

}


/* ============================================================
   RENDERIZAR ATRIBUTOS BÁSICOS DO CARD
============================================================ */

function renderizarAtributosBasicosCard(
    card,
    jogador
) {

    if (!card) {

        return;

    }


    let container =
        card.querySelector(
            ".player-basic-attributes"
        );


    /*
        Cria o container apenas uma vez.
    */

    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.className =
            "player-basic-attributes";


        /*
            Coloca os atributos no final
            do conteúdo do card.
        */

        const conteudo =
            card.querySelector(
                ".player-card-content"
            );


        if (conteudo) {

            conteudo.appendChild(
                container
            );

        }

        else {

            card.appendChild(
                container
            );

        }

    }


    const hpAtual =
        Number(
            jogador.hp?.atual
        );


    const hpMaximo =
        Number(
            jogador.hp?.maximo
        );


    const manaAtual =
        Number(
            jogador.mana?.atual
        );


    const manaMaximo =
        Number(
            jogador.mana?.maximo
        );


    const estamina =
        normalizarRecursoCard(
            jogador.estamina ||
            jogador.recursos?.estamina ||
            jogador.recursos?.est
        );


    const sanidade =
        normalizarRecursoCard(
            jogador.sanidade ||
            jogador.recursos?.sanidade
        );


    container.innerHTML = `

        <div class="basic-attribute basic-hp">

            <span class="basic-attribute-label">
                ❤️ HP
            </span>

            <span class="basic-attribute-value">
                ${formatarRecursoCard(
                    hpAtual,
                    hpMaximo
                )}
            </span>

        </div>


        <div class="basic-attribute basic-mp">

            <span class="basic-attribute-label">
                💧 MP
            </span>

            <span class="basic-attribute-value">
                ${formatarRecursoCard(
                    manaAtual,
                    manaMaximo
                )}
            </span>

        </div>


        <div class="basic-attribute basic-estamina">

            <span class="basic-attribute-label">
                ⚡ Estamina
            </span>

            <span class="basic-attribute-value">
                ${formatarRecursoCard(
                    estamina.atual,
                    estamina.maximo
                )}
            </span>

        </div>


        <div class="basic-attribute basic-sanidade">

            <span class="basic-attribute-label">
                🧠 Sanidade
            </span>

            <span class="basic-attribute-value">
                ${formatarRecursoCard(
                    sanidade.atual,
                    sanidade.maximo
                )}
            </span>

        </div>

    `;


    card.dataset.temAtributosBasicos =
        "true";

}


/* ============================================================
   NORMALIZAR RECURSO DO CARD
============================================================ */

function normalizarRecursoCard(
    recurso
) {

    if (
        recurso &&
        typeof recurso === "object"
    ) {

        const atual =
            Number(
                recurso.atual ??
                recurso.current ??
                recurso.valor ??
                100
            );


        const maximo =
            Number(
                recurso.maximo ??
                recurso.max ??
                recurso.maximum ??
                100
            );


        return {

            atual:
                Number.isFinite(atual)
                    ? atual
                    : 100,

            maximo:
                Number.isFinite(maximo) &&
                maximo > 0
                    ? maximo
                    : 100

        };

    }


    const valor =
        Number(
            recurso
        );


    if (
        Number.isFinite(valor)
    ) {

        return {

            atual:
                valor,

            maximo:
                100

        };

    }


    return {

        atual:
            100,

        maximo:
            100

    };

}


/* ============================================================
   FORMATAR RECURSO DO CARD
============================================================ */

function formatarRecursoCard(
    atual,
    maximo
) {

    const valorAtual =
        Number.isFinite(
            Number(atual)
        )
            ? Number(atual)
            : 0;


    const valorMaximo =
        Number.isFinite(
            Number(maximo)
        )
            ? Number(maximo)
            : 100;


    return (
        `${valorAtual}/${valorMaximo}`
    );

}


/* ============================================================
   ATUALIZAR RECURSO
============================================================ */

function atualizarRecursoCard(
    card,
    valorSelector,
    barraSelector,
    recurso
) {

    if (!recurso) {

        return;

    }


    const atual =
        Number(
            recurso.atual
        );


    const maximo =
        Number(
            recurso.maximo
        );


    const valor =
        card.querySelector(
            valorSelector
        );


    const barra =
        card.querySelector(
            barraSelector
        );


    if (valor) {

        valor.textContent =
            `${atual}/${maximo}`;

    }


    if (barra) {

        const porcentagem =
            calcularPorcentagemJogador(
                atual,
                maximo
            );


        barra.style.width =
            `${porcentagem}%`;

    }

}


/* ============================================================
   PORCENTAGEM
============================================================ */

function calcularPorcentagemJogador(
    atual,
    maximo
) {

    if (
        !Number.isFinite(
            atual
        ) ||
        !Number.isFinite(
            maximo
        ) ||
        maximo <= 0
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.min(
            100,
            (atual / maximo) * 100
        )
    );

}


/* ============================================================
   HP
============================================================ */

function alterarHP(
    playerId,
    quantidade
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const valor =
        Number(
            quantidade
        );


    if (
        !Number.isFinite(
            valor
        )
    ) {

        return false;

    }


    jogador.hp.atual =
        limitarRecurso(
            jogador.hp.atual +
            valor,
            jogador.hp.maximo
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "hpAlterado",
        {

            playerId:
                jogador.id,

            hpAtual:
                jogador.hp.atual,

            hpMaximo:
                jogador.hp.maximo,

            alteracao:
                valor

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   DEFINIR HP
============================================================ */

function definirHP(
    playerId,
    valor
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const novoValor =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            novoValor
        )
    ) {

        return false;

    }


    jogador.hp.atual =
        limitarRecurso(
            novoValor,
            jogador.hp.maximo
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "hpAlterado",
        {

            playerId:
                jogador.id,

            hpAtual:
                jogador.hp.atual,

            hpMaximo:
                jogador.hp.maximo

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   MANA
============================================================ */

function alterarMana(
    playerId,
    quantidade
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const valor =
        Number(
            quantidade
        );


    if (
        !Number.isFinite(
            valor
        )
    ) {

        return false;

    }


    jogador.mana.atual =
        limitarRecurso(
            jogador.mana.atual +
            valor,
            jogador.mana.maximo
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "manaAlterada",
        {

            playerId:
                jogador.id,

            manaAtual:
                jogador.mana.atual,

            manaMaximo:
                jogador.mana.maximo,

            alteracao:
                valor

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   DEFINIR MANA
============================================================ */

function definirMana(
    playerId,
    valor
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const novoValor =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            novoValor
        )
    ) {

        return false;

    }


    jogador.mana.atual =
        limitarRecurso(
            novoValor,
            jogador.mana.maximo
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "manaAlterada",
        {

            playerId:
                jogador.id,

            manaAtual:
                jogador.mana.atual,

            manaMaximo:
                jogador.mana.maximo

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   ALTERAR MÁXIMO DE HP
============================================================ */

function definirMaximoHP(
    playerId,
    novoMaximo
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const valor =
        Number(
            novoMaximo
        );


    if (
        !Number.isFinite(
            valor
        ) ||
        valor <= 0
    ) {

        return false;

    }


    jogador.hp.maximo =
        valor;


    jogador.hp.atual =
        Math.min(
            jogador.hp.atual,
            valor
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   ALTERAR MÁXIMO DE MANA
============================================================ */

function definirMaximoMana(
    playerId,
    novoMaximo
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const valor =
        Number(
            novoMaximo
        );


    if (
        !Number.isFinite(
            valor
        ) ||
        valor <= 0
    ) {

        return false;

    }


    jogador.mana.maximo =
        valor;


    jogador.mana.atual =
        Math.min(
            jogador.mana.atual,
            valor
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   RECURSOS
============================================================ */

function limitarRecurso(
    valor,
    maximo
) {

    return Math.max(
        0,
        Math.min(
            Number(maximo),
            Number(valor)
        )
    );

}


/* ============================================================
   STATUS
============================================================ */

function adicionarStatus(
    playerId,
    status
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    if (
        !status
    ) {

        return false;

    }


    const novoStatus =
        typeof status ===
        "string"

            ? {
                nome: status
            }

            : {
                ...status
            };


    if (
        !novoStatus.nome
    ) {

        return false;

    }


    jogador.status.push(
        novoStatus
    );


    emitirEventoJogadores(
        "statusAdicionado",
        {

            playerId:
                jogador.id,

            status:
                novoStatus

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   REMOVER STATUS
============================================================ */

function removerStatus(
    playerId,
    nomeStatus
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const tamanhoAnterior =
        jogador.status.length;


    jogador.status =
        jogador.status.filter(
            status => {

                const nome =
                    typeof status ===
                    "string"

                        ? status

                        : status.nome;

                return nome !==
                    nomeStatus;

            }
        );


    const removido =
        jogador.status.length !==
        tamanhoAnterior;


    if (removido) {

        emitirEventoJogadores(
            "statusRemovido",
            {

                playerId:
                    jogador.id,

                status:
                    nomeStatus

            }
        );


        emitirAtualizacaoJogador(
            jogador.id
        );

    }


    return removido;

}


/* ============================================================
   LIMPAR STATUS
============================================================ */

function limparStatus(
    playerId
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    jogador.status = [];


    emitirEventoJogadores(
        "statusLimpos",
        {

            playerId:
                jogador.id

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   FOME
============================================================ */

function alterarFome(
    playerId,
    quantidade
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const valor =
        Number(
            quantidade
        );


    if (
        !Number.isFinite(
            valor
        )
    ) {

        return false;

    }


    jogador.fome =
        limitarRecurso(
            jogador.fome +
            valor,
            100
        );


    emitirEventoJogadores(
        "fomeAlterada",
        {

            playerId:
                jogador.id,

            fome:
                jogador.fome,

            alteracao:
                valor

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   SEDE
============================================================ */

function alterarSede(
    playerId,
    quantidade
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const valor =
        Number(
            quantidade
        );


    if (
        !Number.isFinite(
            valor
        )
    ) {

        return false;

    }


    jogador.sede =
        limitarRecurso(
            jogador.sede +
            valor,
            100
        );


    emitirEventoJogadores(
        "sedeAlterada",
        {

            playerId:
                jogador.id,

            sede:
                jogador.sede,

            alteracao:
                valor

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   DEFINIR FOME
============================================================ */

function definirFome(
    playerId,
    valor
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const novoValor =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            novoValor
        )
    ) {

        return false;

    }


    jogador.fome =
        limitarRecurso(
            novoValor,
            100
        );


    emitirEventoJogadores(
        "fomeAlterada",
        {

            playerId:
                jogador.id,

            fome:
                jogador.fome

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   DEFINIR SEDE
============================================================ */

function definirSede(
    playerId,
    valor
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const novoValor =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            novoValor
        )
    ) {

        return false;

    }


    jogador.sede =
        limitarRecurso(
            novoValor,
            100
        );


    emitirEventoJogadores(
        "sedeAlterada",
        {

            playerId:
                jogador.id,

            sede:
                jogador.sede

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   HABILIDADES
============================================================ */

function definirHabilidades(
    playerId,
    habilidades
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    if (
        !Array.isArray(
            habilidades
        )
    ) {

        return false;

    }


    jogador.habilidades =
        [
            habilidades[0] ?? null,
            habilidades[1] ?? null,
            habilidades[2] ?? null
        ];


    emitirEventoJogadores(
        "habilidadesAlteradas",
        {

            playerId:
                jogador.id,

            habilidades:
                jogador.habilidades

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   ALTERAR UMA HABILIDADE
============================================================ */

function definirHabilidade(
    playerId,
    slot,
    habilidade
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const indice =
        Number(slot);


    if (
        !Number.isInteger(
            indice
        ) ||
        indice < 0 ||
        indice > 2
    ) {

        return false;

    }


    while (
        jogador.habilidades.length <
        3
    ) {

        jogador.habilidades.push(
            null
        );

    }


    jogador.habilidades[indice] =
        habilidade;


    emitirEventoJogadores(
        "habilidadeAlterada",
        {

            playerId:
                jogador.id,

            slot:
                indice,

            habilidade

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   PASSIVA
============================================================ */

function definirPassiva(
    playerId,
    passiva
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    jogador.passiva =
        passiva;


    emitirEventoJogadores(
        "passivaAlterada",
        {

            playerId:
                jogador.id,

            passiva

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   PASSIVA DE CLASSE
============================================================ */

function definirPassivaClasse(
    playerId,
    passiva
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    jogador.passivaClasse =
        passiva;


    emitirEventoJogadores(
        "passivaClasseAlterada",
        {

            playerId:
                jogador.id,

            passiva

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   INVENTÁRIO
============================================================ */

function adicionarItem(
    playerId,
    item
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    if (!item) {

        return false;

    }


    jogador.inventario.push(
        item
    );


    emitirEventoJogadores(
        "itemAdicionado",
        {

            playerId:
                jogador.id,

            item

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   REMOVER ITEM
============================================================ */

function removerItem(
    playerId,
    identificador
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    const indice =
        encontrarItem(
            jogador.inventario,
            identificador
        );


    if (
        indice === -1
    ) {

        return false;

    }


    const itemRemovido =
        jogador.inventario.splice(
            indice,
            1
        )[0];


    emitirEventoJogadores(
        "itemRemovido",
        {

            playerId:
                jogador.id,

            item:
                itemRemovido

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   ENTREGAR ITEM
============================================================ */

function entregarItem(
    jogadorOrigem,
    jogadorDestino,
    item
) {

    const origem =
        obterJogadorLocal(
            jogadorOrigem
        );


    const destino =
        obterJogadorLocal(
            jogadorDestino
        );


    if (
        !origem ||
        !destino
    ) {

        return false;

    }


    const indice =
        encontrarItem(
            origem.inventario,
            item
        );


    if (
        indice === -1
    ) {

        return false;

    }


    const itemEntregue =
        origem.inventario.splice(
            indice,
            1
        )[0];


    destino.inventario.push(
        itemEntregue
    );


    emitirEventoJogadores(
        "itemEntregue",
        {

            origem:
                origem.id,

            destino:
                destino.id,

            item:
                itemEntregue

        }
    );


    emitirAtualizacaoJogador(
        origem.id
    );


    emitirAtualizacaoJogador(
        destino.id
    );


    return true;

}


/* ============================================================
   ENCONTRAR ITEM
============================================================ */

function encontrarItem(
    inventario,
    identificador
) {

    if (
        !Array.isArray(
            inventario
        )
    ) {

        return -1;

    }


    return inventario.findIndex(
        item => {

            if (
                item ===
                identificador
            ) {

                return true;

            }


            if (
                typeof item ===
                "string"
            ) {

                return (
                    item ===
                    identificador
                );

            }


            if (
                typeof item ===
                "object" &&
                item !== null
            ) {

                return (
                    item.id ===
                    identificador ||
                    item.nome ===
                    identificador
                );

            }


            return false;

        }
    );

}


/* ============================================================
   TROCA ENTRE JOGADORES
============================================================ */

function trocarItens(
    jogadorA,
    jogadorB,
    itemA,
    itemB
) {

    const a =
        obterJogadorLocal(
            jogadorA
        );


    const b =
        obterJogadorLocal(
            jogadorB
        );


    if (
        !a ||
        !b
    ) {

        return false;

    }


    const indiceA =
        encontrarItem(
            a.inventario,
            itemA
        );


    const indiceB =
        encontrarItem(
            b.inventario,
            itemB
        );


    if (
        indiceA === -1
    ) {

        return false;

    }


    if (
        itemB === null ||
        typeof itemB ===
        "undefined"
    ) {

        const itemEntregue =
            a.inventario.splice(
                indiceA,
                1
            )[0];


        b.inventario.push(
            itemEntregue
        );

    }

    else {

        if (
            indiceB === -1
        ) {

            return false;

        }


        const itemDeA =
            a.inventario.splice(
                indiceA,
                1
            )[0];


        const itemDeB =
            b.inventario.splice(
                indiceB,
                1
            )[0];


        a.inventario.push(
            itemDeB
        );


        b.inventario.push(
            itemDeA
        );

    }


    emitirEventoJogadores(
        "trocaRealizada",
        {

            jogadorA:
                a.id,

            jogadorB:
                b.id,

            itemA,

            itemB

        }
    );


    emitirAtualizacaoJogador(
        a.id
    );


    emitirAtualizacaoJogador(
        b.id
    );


    return true;

}


/* ============================================================
   CONEXÃO
============================================================ */

function definirConexaoJogador(
    playerId,
    conectado
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    jogador.conectado =
        Boolean(
            conectado
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "conexaoAlterada",
        {

            playerId:
                jogador.id,

            conectado:
                jogador.conectado

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   IDENTIDADE
============================================================ */

function definirIdentidadeJogador(
    playerId,
    dados = {}
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    if (
        typeof dados.nome ===
        "string" &&
        dados.nome.trim()
    ) {

        jogador.nome =
            dados.nome.trim();

    }


    if (
        typeof dados.raca ===
        "string"
    ) {

        jogador.raca =
            dados.raca;

    }


    if (
        typeof dados.classe ===
        "string"
    ) {

        jogador.classe =
            dados.classe;

    }


    if (
        dados.avatar !==
        undefined
    ) {

        jogador.avatar =
            dados.avatar;

    }


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "identidadeAlterada",
        {

            playerId:
                jogador.id,

            dados:
                {

                    nome:
                        jogador.nome,

                    raca:
                        jogador.raca,

                    classe:
                        jogador.classe,

                    avatar:
                        jogador.avatar

                }

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   BATALHA
============================================================ */

function definirParticipacaoBatalha(
    playerId,
    participando
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    jogador.emBatalha =
        Boolean(
            participando
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "participacaoBatalhaAlterada",
        {

            playerId:
                jogador.id,

            participando:
                jogador.emBatalha

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   RESETAR JOGADOR
============================================================ */

function resetarJogador(
    playerId
) {

    const jogador =
        obterJogadorLocal(
            playerId
        );


    if (!jogador) {

        return false;

    }


    jogador.hp.atual =
        jogador.hp.maximo;


    jogador.mana.atual =
        jogador.mana.maximo;


    /*
        Se Estamina e Sanidade forem recursos
        estruturados, restauramos para o máximo.

        Isso não interfere em personagens que
        ainda não possuam esses recursos.
    */

    if (
        jogador.estamina &&
        typeof jogador.estamina ===
        "object"
    ) {

        jogador.estamina.atual =
            jogador.estamina.maximo;

    }


    if (
        jogador.sanidade &&
        typeof jogador.sanidade ===
        "object"
    ) {

        jogador.sanidade.atual =
            jogador.sanidade.maximo;

    }


    if (
        jogador.recursos?.estamina &&
        typeof jogador.recursos.estamina ===
        "object"
    ) {

        jogador.recursos.estamina.atual =
            jogador.recursos.estamina.maximo;

    }


    if (
        jogador.recursos?.sanidade &&
        typeof jogador.recursos.sanidade ===
        "object"
    ) {

        jogador.recursos.sanidade.atual =
            jogador.recursos.sanidade.maximo;

    }


    jogador.status =
        [];


    jogador.fome =
        100;


    jogador.sede =
        100;


    jogador.emBatalha =
        false;


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "jogadorResetado",
        {

            playerId:
                jogador.id

        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   EVENTOS
============================================================ */

function emitirEventoJogadores(
    nome,
    dados = {}
) {

    document.dispatchEvent(
        new CustomEvent(
            `mesa:jogadores:${nome}`,
            {
                detail:
                    dados
            }
        )
    );

}


/*
    Evento genérico para sincronização.

    Enviamos apenas o ID do jogador.
*/

function emitirAtualizacaoJogador(
    playerId
) {

    document.dispatchEvent(
        new CustomEvent(
            "mesa:jogadorAtualizado",
            {

                detail: {

                    playerId

                }

            }
        )
    );

}


/* ============================================================
   API PÚBLICA
============================================================ */

window.MesaJogadores = {

    /* -----------------------------------------
       JOGADORES
    ----------------------------------------- */

    obter(
        playerId
    ) {

        return obterJogadorLocal(
            playerId
        );

    },


    todos() {

        const estado =
            obterEstadoMesa();


        return estado
            ? estado.jogadores
            : [];

    },


    atualizarCards() {

        sincronizarPersonagensCampanha();

    },


    sincronizar() {

        return sincronizarPersonagensCampanha();

    },


    sincronizarRealtime(
        personagens
    ) {

        sincronizarDadosRealtime(
            personagens
        );

    },


    personagemPorSlot(
        slot
    ) {

        return obterPersonagemPorSlot(
            slot
        );

    },


    personagensCampanha() {

        return obterPersonagensCampanha();

    },


    /* -----------------------------------------
       IDENTIDADE
    ----------------------------------------- */

    identidade: {

        definir(
            playerId,
            dados
        ) {

            return definirIdentidadeJogador(
                playerId,
                dados
            );

        }

    },


    /* -----------------------------------------
       CONEXÃO
    ----------------------------------------- */

    conexao: {

        definir(
            playerId,
            conectado
        ) {

            return definirConexaoJogador(
                playerId,
                conectado
            );

        }

    },


    /* -----------------------------------------
       HP
    ----------------------------------------- */

    hp: {

        alterar(
            playerId,
            quantidade
        ) {

            return alterarHP(
                playerId,
                quantidade
            );

        },


        definir(
            playerId,
            valor
        ) {

            return definirHP(
                playerId,
                valor
            );

        },


        maximo(
            playerId,
            valor
        ) {

            return definirMaximoHP(
                playerId,
                valor
            );

        }

    },


    /* -----------------------------------------
       MANA
    ----------------------------------------- */

    mana: {

        alterar(
            playerId,
            quantidade
        ) {

            return alterarMana(
                playerId,
                quantidade
            );

        },


        definir(
            playerId,
            valor
        ) {

            return definirMana(
                playerId,
                valor
            );

        },


        maximo(
            playerId,
            valor
        ) {

            return definirMaximoMana(
                playerId,
                valor
            );

        }

    },


    /* -----------------------------------------
       STATUS
    ----------------------------------------- */

    status: {

        adicionar(
            playerId,
            status
        ) {

            return adicionarStatus(
                playerId,
                status
            );

        },


        remover(
            playerId,
            status
        ) {

            return removerStatus(
                playerId,
                status
            );

        },


        limpar(
            playerId
        ) {

            return limparStatus(
                playerId
            );

        }

    },


    /* -----------------------------------------
       FOME
    ----------------------------------------- */

    fome: {

        alterar(
            playerId,
            quantidade
        ) {

            return alterarFome(
                playerId,
                quantidade
            );

        },


        definir(
            playerId,
            valor
        ) {

            return definirFome(
                playerId,
                valor
            );

        }

    },


    /* -----------------------------------------
       SEDE
    ----------------------------------------- */

    sede: {

        alterar(
            playerId,
            quantidade
        ) {

            return alterarSede(
                playerId,
                quantidade
            );

        },


        definir(
            playerId,
            valor
        ) {

            return definirSede(
                playerId,
                valor
            );

        }

    },


    /* -----------------------------------------
       HABILIDADES
    ----------------------------------------- */

    habilidades: {

        definir(
            playerId,
            habilidades
        ) {

            return definirHabilidades(
                playerId,
                habilidades
            );

        },


        definirSlot(
            playerId,
            slot,
            habilidade
        ) {

            return definirHabilidade(
                playerId,
                slot,
                habilidade
            );

        }

    },


    /* -----------------------------------------
       PASSIVAS
    ----------------------------------------- */

    passivas: {

        definir(
            playerId,
            passiva
        ) {

            return definirPassiva(
                playerId,
                passiva
            );

        },


        definirClasse(
            playerId,
            passiva
        ) {

            return definirPassivaClasse(
                playerId,
                passiva
            );

        }

    },


    /* -----------------------------------------
       INVENTÁRIO
    ----------------------------------------- */

    inventario: {

        adicionar(
            playerId,
            item
        ) {

            return adicionarItem(
                playerId,
                item
            );

        },


        remover(
            playerId,
            item
        ) {

            return removerItem(
                playerId,
                item
            );

        },


        entregar(
            origem,
            destino,
            item
        ) {

            return entregarItem(
                origem,
                destino,
                item
            );

        }

    },


    /* -----------------------------------------
       TROCAS
    ----------------------------------------- */

    troca: {

        realizar(
            jogadorA,
            jogadorB,
            itemA,
            itemB = null
        ) {

            return trocarItens(
                jogadorA,
                jogadorB,
                itemA,
                itemB
            );

        }

    },


    /* -----------------------------------------
       BATALHA
    ----------------------------------------- */

    batalha: {

        participar(
            playerId,
            participando
        ) {

            return definirParticipacaoBatalha(
                playerId,
                participando
            );

        }

    },


    /* -----------------------------------------
       RESET
    ----------------------------------------- */

    resetar(
        playerId
    ) {

        return resetarJogador(
            playerId
        );

    }

};


/* ============================================================
   COMPATIBILIDADE GLOBAL
============================================================ */

window.obterJogador =
    obterJogadorLocal;


window.atualizarTodosOsCards =
    atualizarTodosOsCards;


window.atualizarCardJogadorCompleto =
    atualizarCardJogadorCompleto;


window.sincronizarPersonagensMesa =
    sincronizarPersonagensCampanha;


window.obterPersonagensCampanhaMesa =
    obterPersonagensCampanha;


window.sincronizarPersonagensRealtimeMesa =
    sincronizarDadosRealtime;


/* ============================================================
   FIM DO MESA-JOGADORES.JS
============================================================ */
