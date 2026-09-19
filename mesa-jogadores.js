/* ============================================================
   MESA RPG ONLINE
   mesa-jogadores.js
   SISTEMA DE JOGADORES
   INTEGRAÇÃO COM PERSONAGENS DA CAMPANHA
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
        Primeiro carregamos os personagens
        reais da campanha.

        O auth.js já colocou esses dados em:

        window.rpgAuth.campaignCharacters
    */

    sincronizarPersonagensCampanha();


    atualizarTodosOsCards();


    /*
        Escutamos alterações feitas
        por outros sistemas da Mesa.
    */

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
        a campanha depois da Mesa ter
        sido inicializada.
    */

    document.addEventListener(
        "rpg:campanhaAtualizada",
        () => {

            sincronizarPersonagensCampanha();

            atualizarTodosOsCards();

        }
    );


    /*
        Também fazemos algumas tentativas
        durante o carregamento inicial.

        Isso é útil porque auth.js e
        mesa-jogadores.js são sistemas
        independentes.
    */

    let tentativas = 0;

    const intervalo =
        setInterval(
            () => {

                tentativas++;


                const personagens =
                    obterPersonagensCampanha();


                if (
                    personagens.length > 0
                ) {

                    sincronizarPersonagensCampanha();

                    atualizarTodosOsCards();

                    clearInterval(
                        intervalo
                    );

                }


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

/*
    O auth.js já carrega:

    window.rpgAuth.campaignCharacters

    Portanto não precisamos consultar
    o Supabase novamente aqui.
*/

function obterPersonagensCampanha() {

    if (
        typeof window.obterPersonagensCampanha ===
        "function"
    ) {

        const personagens =
            window.obterPersonagensCampanha();


        return Array.isArray(
            personagens
        )
            ? personagens
            : [];

    }


    if (
        window.rpgAuth &&
        Array.isArray(
            window.rpgAuth.campaignCharacters
        )
    ) {

        return window.rpgAuth.campaignCharacters;

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
            personagem =>
                Number(
                    personagem.slot
                ) ===
                numeroSlot
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


    /*
        Criamos uma cópia para preservar
        todas as estruturas que o mesa.js
        já possa ter criado.
    */

    return {

        ...(jogadorBase || {}),


        id:
            Number(
                personagem.slot
            ),


        characterId:
            personagem.id || null,


        userId:
            personagem.user_id || null,


        slot:
            Number(
                personagem.slot
            ),


        nome:
            personagem.name ||
            jogadorBase?.nome ||
            `Player ${personagem.slot}`,


        raca:
            personagem.race ||
            jogadorBase?.raca ||
            "Raça",


        classe:
            personagem.class ||
            jogadorBase?.classe ||
            "Classe",


        afinidade:
            personagem.affinity ||
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
                atk: personagem.atk,
                atkMgc: personagem.atk_mgc || personagem.atkMgc,
                def: personagem.def,
                res: personagem.res,
                agi: personagem.agi,
                int: personagem.int
            },
        recursos:
            personagem.recursos ||
            personagem.resources ||
            {
                est: personagem.est,
                sanidade: personagem.sanidade
            },
        inventario:
            Array.isArray(personagem.inventario)
                ? personagem.inventario
                : (
                    personagem.inventory &&
                    Array.isArray(personagem.inventory.items)
                        ? personagem.inventory.items
                        : []
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


        /*
            Os campos abaixo pertencem ao
            estado da Mesa.

            Se já existirem, preservamos.
            Se não existirem, inicializamos.
        */

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


        inventario:
            Array.isArray(
                jogadorBase?.inventario
            )
                ? jogadorBase.inventario
                : [],


        conectado:
            jogadorBase?.conectado !== false,


        emBatalha:
            Boolean(
                jogadorBase?.emBatalha
            )

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
        Os 8 jogadores continuam existindo
        no estado da Mesa.

        Nós apenas substituímos os dados
        dos slots ocupados pelos personagens
        reais.
    */

    for (
        let slot = 1;
        slot <= 8;
        slot++
    ) {

        const indice =
            slot - 1;


        const jogadorBase =
            estado.jogadores[indice];


        const personagem =
            obterPersonagemPorSlot(
                slot
            );


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

                Mantemos o jogador base,
                mas marcamos como vazio.
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


    /*
        Atualiza a interface imediatamente.
    */

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
            jogador.id ===
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
            Avatar:

            Se houver uma URL de imagem,
            usamos a imagem.

            Caso contrário mantemos o
            emoji 👤 já existente.
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


    /*
        Futuramente o CSS poderá usar:

        [data-ocupado="false"]
        [data-conectado="false"]
        [data-em-batalha="true"]
    */

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


/* ============================================================
   FIM DO MESA-JOGADORES.JS
============================================================ */
