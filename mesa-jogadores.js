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
        return null;
    }

    if (
        typeof window.MesaRPG.estado !==
        "function"
    ) {
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

    ficha: null,

    inicializado: false

};


/* ============================================================
   CACHE DOS PERSONAGENS DA CAMPANHA
============================================================ */

/*
    IMPORTANTE:

    Este array representa TODOS os personagens da campanha.

    NÃO representa apenas o personagem do usuário atual.

    Isso é fundamental porque o Mestre pode não possuir
    personagem próprio e, mesmo assim, precisa enxergar
    todos os jogadores da campanha.
*/

let personagensMesaRealtime = [];

let personagensMesaRealtimeAtivo = false;


/*
    Controle para impedir chamadas simultâneas
    desnecessárias ao carregamento do MesaRPG.
*/

let carregamentoRealtimeEmAndamento = false;


/* ============================================================
   SINCRONIZAR DADOS RECEBIDOS
============================================================ */

function sincronizarDadosRealtime(
    personagens = [],
    emitirEvento = false
) {

    const lista =
        Array.isArray(personagens)
            ? personagens.filter(Boolean)
            : [];


    personagensMesaRealtime =
        lista;


    /*
        A partir daqui a fonte oficial da campanha
        já foi carregada.

        IMPORTANTE:

        Mesmo que a lista seja vazia, isso significa
        que o Supabase respondeu oficialmente.
    */

    personagensMesaRealtimeAtivo =
        true;


    /*
        Mantém compatibilidade com auth.js.
    */

    if (
        window.rpgAuth
    ) {

        window.rpgAuth.campaignCharacters =
            personagensMesaRealtime;

    }


    /*
        Atualiza os 8 slots.
    */

    sincronizarPersonagensCampanha();


    /*
        Atualiza visualmente os cards.
    */

    atualizarTodosOsCards();


    /*
        Por padrão NÃO emitimos
        "mesa:jogadoresAtualizados".

        O mesa.js já é o responsável por consultar
        o Supabase e emitir esse evento.

        Caso outro sistema chame explicitamente
        esta função com emitirEvento=true,
        podemos avisar os demais sistemas.
    */

    if (
        emitirEvento
    ) {

        document.dispatchEvent(
            new CustomEvent(
                "mesa:jogadores:realtime",
                {
                    detail: {
                        personagens:
                            personagensMesaRealtime
                    }
                }
            )
        );

    }


    return personagensMesaRealtime;

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


function inicializarMesaJogadores() {

    if (
        MesaJogadoresUI.inicializado
    ) {
        return;
    }


    MesaJogadoresUI.inicializado =
        true;


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
        Primeiro usamos qualquer informação
        que já tenha chegado do auth ou do Mesa.
    */

    sincronizarPersonagensCampanha();

    atualizarTodosOsCards();


    /* ========================================================
       EVENTO OFICIAL DO MESA.JS
    ======================================================== */

    document.addEventListener(
        "mesa:jogadoresAtualizados",
        receberPersonagensMesa
    );


    /* ========================================================
       EVENTO ESPECÍFICO DE REALTIME
    ======================================================== */

    document.addEventListener(
        "mesa:jogadores:realtime",
        receberPersonagensRealtime
    );


    /* ========================================================
       EVENTOS DE JOGADORES
    ======================================================== */

    document.addEventListener(
        "mesa:jogadorAtualizado",
        evento => {

            const playerId =
                evento.detail?.playerId;


            if (
                playerId !== undefined &&
                playerId !== null
            ) {

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


    /* ========================================================
       CAMPANHA ATUALIZADA
    ======================================================== */

    document.addEventListener(
        "rpg:campanhaAtualizada",
        evento => {

            const personagens =
                evento.detail?.personagens;


            /*
                Se o evento já trouxe os personagens,
                usamos diretamente.

                Isso evita uma consulta desnecessária.
            */

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


            /*
                Depois solicitamos a fonte oficial
                somente se o MesaRPG estiver disponível.
            */

            solicitarCargaRealtime();

        }
    );


    /* ========================================================
       AUTENTICAÇÃO / CAMPANHA SINCRONIZADA
    ======================================================== */

    document.addEventListener(
        "rpgAuth:campanhaSincronizada",
        () => {

            const personagens =
                window.rpgAuth &&
                Array.isArray(
                    window.rpgAuth.campaignCharacters
                )
                    ? window.rpgAuth.campaignCharacters
                    : [];


            if (
                personagens.length > 0
            ) {

                sincronizarDadosRealtime(
                    personagens,
                    false
                );

            }


            solicitarCargaRealtime();

        }
    );


    /* ========================================================
       MUDANÇA DE CAMPANHA
    ======================================================== */

    window.addEventListener(
        "mesa:campanhaAlterada",
        () => {

            /*
                Uma nova campanha significa
                que o cache anterior não pode ser
                considerado fonte oficial.

                Zeramos somente o cache de campanha.
            */

            personagensMesaRealtime =
                [];

            personagensMesaRealtimeAtivo =
                false;


            sincronizarPersonagensCampanha();


            atualizarTodosOsCards();


            solicitarCargaRealtime();

        }
    );


    /*
        Primeira solicitação oficial.
    */

    setTimeout(
        () => {

            solicitarCargaRealtime();

        },
        150
    );


    /*
        Tentativas de segurança.

        Isso é apenas para o caso de mesa.js
        ainda não ter criado MesaRPG quando
        este arquivo foi inicializado.
    */

    let tentativas =
        0;


    const intervalo =
        setInterval(
            () => {

                tentativas++;


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

}


/* ============================================================
   RECEBER EVENTO DO MESA.JS
============================================================ */

function receberPersonagensMesa(
    evento
) {

    const personagens =
        evento?.detail?.personagens;


    if (
        !Array.isArray(
            personagens
        )
    ) {
        return;
    }


    /*
        IMPORTANTE:

        Aqui NÃO emitimos
        "mesa:jogadoresAtualizados".

        Apenas recebemos os dados.

        Isso quebra o ciclo:

        mesa.js
            ↓
        mesa-jogadores.js
            ↓
        mesa.js
            ↓
        ...
    */

    sincronizarDadosRealtime(
        personagens,
        false
    );

}


/* ============================================================
   RECEBER EVENTO ESPECÍFICO DE REALTIME
============================================================ */

function receberPersonagensRealtime(
    evento
) {

    const personagens =
        evento?.detail?.personagens;


    if (
        !Array.isArray(
            personagens
        )
    ) {
        return;
    }


    sincronizarDadosRealtime(
        personagens,
        false
    );

}


/* ============================================================
   SOLICITAR CARGA REALTIME
============================================================ */

function solicitarCargaRealtime() {

    if (
        carregamentoRealtimeEmAndamento
    ) {

        return false;

    }


    if (
        !window.MesaRPG
    ) {

        return false;

    }


    if (
        typeof window.MesaRPG
            .carregarJogadoresDaCampanha !==
        "function"
    ) {

        return false;

    }


    carregamentoRealtimeEmAndamento =
        true;


    try {

        const resultado =
            window.MesaRPG
                .carregarJogadoresDaCampanha();


        if (
            resultado &&
            typeof resultado.then ===
            "function"
        ) {

            resultado
                .catch(
                    () => {}
                )
                .finally(
                    () => {

                        carregamentoRealtimeEmAndamento =
                            false;

                    }
                );

        }

        else {

            carregamentoRealtimeEmAndamento =
                false;

        }


        return true;

    }

    catch (
        erro
    ) {

        carregamentoRealtimeEmAndamento =
            false;

        return false;

    }

}


/* ============================================================
   EVENTOS DOS CARDS
============================================================ */

function registrarEventosJogadores() {

    MesaJogadoresUI.cards.forEach(
        card => {

            card.addEventListener(
                "contextmenu",
                evento => {

                    evento.preventDefault();


                    const playerId =
                        Number(
                            card.dataset.player
                        );


                    if (
                        !Number.isInteger(
                            playerId
                        )
                    ) {
                        return;
                    }


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
        PRIORIDADE 1:
        carregamento oficial do Mesa/Reatime.
    */

    if (
        personagensMesaRealtimeAtivo
    ) {

        return Array.isArray(
            personagensMesaRealtime
        )
            ? personagensMesaRealtime
            : [];

    }


    /*
        PRIORIDADE 2:
        personagens carregados pelo auth.js.

        IMPORTANTE:

        campaignCharacters representa
        a campanha inteira.

        NÃO filtramos pelo auth.uid().
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
        PRIORIDADE 3:
        compatibilidade com sistemas antigos.
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


            if (
                Array.isArray(
                    personagens
                )
            ) {

                return personagens;

            }

        }

        catch (
            erro
        ) {}

    }


    return [];

}


/* ============================================================
   PERSONAGEM DO USUÁRIO ATUAL
============================================================ */

/*
    Esta função é propositalmente separada
    de obterPersonagensCampanha().

    Ela procura somente o personagem do usuário
    atual.

    Isso permite:

    Mestre sem personagem
        +
    personagens dos jogadores
        =
    Mesa funcionando normalmente.
*/

function obterPersonagemDoUsuarioAtual() {

    const personagens =
        obterPersonagensCampanha();


    const userId =
        window.rpgAuth?.user?.id ||
        window.rpgAuth?.session?.user?.id ||
        null;


    if (
        !userId
    ) {

        return null;

    }


    return (
        personagens.find(
            personagem =>
                String(
                    personagem?.user_id
                ) ===
                String(
                    userId
                )
        ) ||
        null
    );

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
        ) ||
        numeroSlot < 1 ||
        numeroSlot > 8
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
   CONVERTER PERSONAGEM → JOGADOR
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


    const hp =
        Number(
            personagem.hp
        );


    const mp =
        Number(
            personagem.mp
        );


    const hpMaximo =
        Number(
            jogadorBase?.hp?.maximo
        ) > 0
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
        Number(
            jogadorBase?.mana?.maximo
        ) > 0
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
   RECURSO BÁSICO
============================================================ */

function obterRecursoBasico(
    personagem,
    recursos,
    nomes,
    recursoAnterior
) {

    let valor =
        null;


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


    if (
        valor === null &&
        recursoAnterior !== undefined &&
        recursoAnterior !== null
    ) {

        valor =
            recursoAnterior;

    }


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


    const numero =
        Number(
            valor
        );


    if (
        Number.isFinite(
            numero
        )
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
        Antes da primeira resposta oficial:

        não apagamos os jogadores.

        Isso evita que a Mesa apareça vazia durante
        a inicialização.
    */

    if (
        !personagensMesaRealtimeAtivo &&
        personagens.length === 0
    ) {

        return false;

    }


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
        IMPORTANTE:

        Os slots são definidos pelo banco.

        Não usamos a posição do array.

        Exemplo:

        slot 1 → card 1
        slot 2 → card 2
        slot 5 → card 5
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
                Slot realmente livre.
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
   OBTER JOGADOR LOCAL
============================================================ */

function obterJogadorLocal(
    playerId
) {

    const estado =
        obterEstadoMesa();


    if (!estado) {

        return null;

    }


    if (
        !Array.isArray(
            estado.jogadores
        )
    ) {

        return null;

    }


    return estado.jogadores.find(
        jogador =>
            Number(
                jogador.id
            ) ===
            Number(playerId)
    ) || null;

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


    if (
        !Array.isArray(
            estado.jogadores
        )
    ) {

        return;

    }


    estado.jogadores.forEach(
        jogador => {

            if (
                jogador &&
                jogador.id !== undefined
            ) {

                atualizarCardJogadorCompleto(
                    jogador.id
                );

            }

        }
    );

}


/* ============================================================
   ATUALIZAR CARD
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


    /* ========================================================
       IDENTIDADE
    ======================================================== */

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

            avatar.innerHTML = "";

            avatar.textContent =
                "👤";

        }

    }

    else {

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


    /* ========================================================
       HP
    ======================================================== */

    atualizarRecursoCard(
        card,
        ".hp-value",
        ".hp-bar span",
        jogador.hp
    );


    /* ========================================================
       MANA
    ======================================================== */

    atualizarRecursoCard(
        card,
        ".mana-value",
        ".mana-bar span",
        jogador.mana
    );


    renderizarAtributosBasicosCard(
        card,
        jogador
    );


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
   ATRIBUTOS BÁSICOS
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


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.className =
            "player-basic-attributes";


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
   NORMALIZAR RECURSO
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
   FORMATAR RECURSO
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
   ATUALIZAR RECURSO CARD
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

        barra.style.width =
            `${calcularPorcentagemJogador(
                atual,
                maximo
            )}%`;

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
        !Number.isFinite(atual) ||
        !Number.isFinite(maximo) ||
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
        !Number.isFinite(valor)
    ) {

        return false;

    }


    jogador.hp.atual =
        limitarRecurso(
            jogador.hp.atual + valor,
            jogador.hp.maximo
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "hpAlterado",
        {
            playerId: jogador.id,
            hpAtual: jogador.hp.atual,
            hpMaximo: jogador.hp.maximo,
            alteracao: valor
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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
        !Number.isFinite(novoValor)
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
            playerId: jogador.id,
            hpAtual: jogador.hp.atual,
            hpMaximo: jogador.hp.maximo
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
        !Number.isFinite(valor)
    ) {

        return false;

    }


    jogador.mana.atual =
        limitarRecurso(
            jogador.mana.atual + valor,
            jogador.mana.maximo
        );


    atualizarCardJogadorCompleto(
        playerId
    );


    emitirEventoJogadores(
        "manaAlterada",
        {
            playerId: jogador.id,
            manaAtual: jogador.mana.atual,
            manaMaximo: jogador.mana.maximo,
            alteracao: valor
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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
        !Number.isFinite(novoValor)
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
            playerId: jogador.id,
            manaAtual: jogador.mana.atual,
            manaMaximo: jogador.mana.maximo
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   MÁXIMOS
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
        !Number.isFinite(valor) ||
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
        !Number.isFinite(valor) ||
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


    if (
        !jogador ||
        !status
    ) {

        return false;

    }


    if (
        !Array.isArray(
            jogador.status
        )
    ) {

        jogador.status = [];

    }


    const novoStatus =
        typeof status === "string"
            ? { nome: status }
            : { ...status };


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
            playerId: jogador.id,
            status: novoStatus
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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


    if (
        !Array.isArray(
            jogador.status
        )
    ) {

        jogador.status = [];

    }


    const tamanhoAnterior =
        jogador.status.length;


    jogador.status =
        jogador.status.filter(
            status => {

                const nome =
                    typeof status === "string"
                        ? status
                        : status?.nome;

                return nome !==
                    nomeStatus;

            }
        );


    const removido =
        jogador.status.length !==
        tamanhoAnterior;


    if (
        removido
    ) {

        emitirEventoJogadores(
            "statusRemovido",
            {
                playerId: jogador.id,
                status: nomeStatus
            }
        );


        emitirAtualizacaoJogador(
            jogador.id
        );

    }


    return removido;

}


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
            playerId: jogador.id
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   FOME / SEDE
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
        !Number.isFinite(valor)
    ) {

        return false;

    }


    jogador.fome =
        limitarRecurso(
            jogador.fome + valor,
            100
        );


    emitirEventoJogadores(
        "fomeAlterada",
        {
            playerId: jogador.id,
            fome: jogador.fome,
            alteracao: valor
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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
        !Number.isFinite(valor)
    ) {

        return false;

    }


    jogador.sede =
        limitarRecurso(
            jogador.sede + valor,
            100
        );


    emitirEventoJogadores(
        "sedeAlterada",
        {
            playerId: jogador.id,
            sede: jogador.sede,
            alteracao: valor
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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
        !Number.isFinite(novoValor)
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
            playerId: jogador.id,
            fome: jogador.fome
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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
        !Number.isFinite(novoValor)
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
            playerId: jogador.id,
            sede: jogador.sede
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


    if (
        !jogador ||
        !Array.isArray(habilidades)
    ) {

        return false;

    }


    jogador.habilidades = [
        habilidades[0] ?? null,
        habilidades[1] ?? null,
        habilidades[2] ?? null
    ];


    emitirEventoJogadores(
        "habilidadesAlteradas",
        {
            playerId: jogador.id,
            habilidades: jogador.habilidades
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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
        !Number.isInteger(indice) ||
        indice < 0 ||
        indice > 2
    ) {

        return false;

    }


    if (
        !Array.isArray(
            jogador.habilidades
        )
    ) {

        jogador.habilidades = [];

    }


    while (
        jogador.habilidades.length < 3
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
            playerId: jogador.id,
            slot: indice,
            habilidade
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


/* ============================================================
   PASSIVAS
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
            playerId: jogador.id,
            passiva
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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
            playerId: jogador.id,
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


    if (
        !jogador ||
        !item
    ) {

        return false;

    }


    if (
        !Array.isArray(
            jogador.inventario
        )
    ) {

        jogador.inventario = [];

    }


    jogador.inventario.push(
        item
    );


    emitirEventoJogadores(
        "itemAdicionado",
        {
            playerId: jogador.id,
            item
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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
            playerId: jogador.id,
            item: itemRemovido
        }
    );


    emitirAtualizacaoJogador(
        jogador.id
    );


    return true;

}


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


    if (
        !Array.isArray(origem.inventario)
    ) {

        origem.inventario = [];

    }


    if (
        !Array.isArray(destino.inventario)
    ) {

        destino.inventario = [];

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
            origem: origem.id,
            destino: destino.id,
            item: itemEntregue
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


function encontrarItem(
    inventario,
    identificador
) {

    if (
        !Array.isArray(inventario)
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
                typeof item === "string"
            ) {

                return (
                    item ===
                    identificador
                );

            }


            if (
                typeof item === "object" &&
                item !== null
            ) {

                return (
                    item.id === identificador ||
                    item.nome === identificador
                );

            }


            return false;

        }
    );

}


/* ============================================================
   TROCAS
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


    if (
        !Array.isArray(a.inventario)
    ) {

        a.inventario = [];

    }


    if (
        !Array.isArray(b.inventario)
    ) {

        b.inventario = [];

    }


    const indiceA =
        encontrarItem(
            a.inventario,
            itemA
        );


    if (
        indiceA === -1
    ) {

        return false;

    }


    if (
        itemB === null ||
        itemB === undefined
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

        const indiceB =
            encontrarItem(
                b.inventario,
                itemB
            );


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
            jogadorA: a.id,
            jogadorB: b.id,
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
            playerId: jogador.id,
            conectado: jogador.conectado
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
        typeof dados.nome === "string" &&
        dados.nome.trim()
    ) {

        jogador.nome =
            dados.nome.trim();

    }


    if (
        typeof dados.raca === "string"
    ) {

        jogador.raca =
            dados.raca;

    }


    if (
        typeof dados.classe === "string"
    ) {

        jogador.classe =
            dados.classe;

    }


    if (
        dados.avatar !== undefined
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
            playerId: jogador.id,
            dados: {
                nome: jogador.nome,
                raca: jogador.raca,
                classe: jogador.classe,
                avatar: jogador.avatar
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
            playerId: jogador.id,
            participando: jogador.emBatalha
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


    if (
        jogador.hp
    ) {

        jogador.hp.atual =
            jogador.hp.maximo;

    }


    if (
        jogador.mana
    ) {

        jogador.mana.atual =
            jogador.mana.maximo;

    }


    if (
        jogador.estamina &&
        typeof jogador.estamina === "object"
    ) {

        jogador.estamina.atual =
            jogador.estamina.maximo;

    }


    if (
        jogador.sanidade &&
        typeof jogador.sanidade === "object"
    ) {

        jogador.sanidade.atual =
            jogador.sanidade.maximo;

    }


    if (
        jogador.recursos?.estamina &&
        typeof jogador.recursos.estamina === "object"
    ) {

        jogador.recursos.estamina.atual =
            jogador.recursos.estamina.maximo;

    }


    if (
        jogador.recursos?.sanidade &&
        typeof jogador.recursos.sanidade === "object"
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
            playerId: jogador.id
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


        return estado &&
            Array.isArray(
                estado.jogadores
            )
                ? estado.jogadores
                : [];

    },


    atualizarCards() {

        return sincronizarPersonagensCampanha();

    },


    sincronizar() {

        return sincronizarPersonagensCampanha();

    },


    sincronizarRealtime(
        personagens
    ) {

        return sincronizarDadosRealtime(
            personagens,
            false
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


    personagemUsuarioAtual() {

        return obterPersonagemDoUsuarioAtual();

    },


    solicitarCargaRealtime() {

        return solicitarCargaRealtime();

    },


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


/*
    Função adicional para sistemas que realmente
    precisam do personagem pertencente ao usuário atual.

    NÃO deve ser usada para montar os cards da Mesa.
*/

window.obterPersonagemUsuarioAtualMesa =
    obterPersonagemDoUsuarioAtual;


/* ============================================================
   FIM DO MESA-JOGADORES.JS
============================================================ */
