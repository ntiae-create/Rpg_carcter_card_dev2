"use strict";

/*
==============================================================
 MESA RPG ONLINE
 CORE / ORQUESTRADOR
==============================================================

 RESPONSABILIDADES:

 - Inicializar a mesa
 - Identificar campanha ativa
 - Identificar Mestre / Jogador
 - Controlar o modo atual
 - Controlar a área central
 - Encaminhar ações de aventura
 - Controlar CTE
 - Manter os 8 lugares
 - Sincronizar campanha
 - SINCRONIZAR JOGADORES EM TEMPO REAL
 - Processar interações
 - Conversar com mesa-jogadores.js
 - Conversar com mesa-aventura.js

==============================================================
*/


/* ============================================================
   CONFIGURAÇÃO
============================================================ */

const MESA_CONFIG = {

    maxJogadores: 8,

    modos: {

        NORMAL: "normal",

        AVENTURA: "aventura",

        BATALHA: "batalha"

    },

    cte: {

        disponivel: true,

        /*
         TEMPO PADRÃO DO CTE

         1000 = 1 segundo
         500  = 0,5 segundo
         2000 = 2 segundos
         5000 = 5 segundos

         Esse valor pode ser alterado pelo Mestre
         ao iniciar um CTE.
        */

        tempoPadrao: 1000,

        quantidadePadrao: 1

    }

};


/* ============================================================
   ESTADO CENTRAL
============================================================ */

const mesaState = {

    inicializado: false,

    modoAtual:
        MESA_CONFIG.modos.NORMAL,


    campanha: {

        id: null,

        nome: "Campanha",

        codigoMesa: null,

        masterId: null

    },


    usuario: {

        id: null,

        nome: null,

        email: null,

        isMaster: false,

        isPlayer: false

    },


    jogadorAtual: {

        characterId: null,

        slot: null

    },


    jogadores:

        Array.from(

            {
                length:
                    MESA_CONFIG.maxJogadores
            },

            (_, index) => ({

                slot:
                    index + 1,

                ocupado:
                    false,

                characterId:
                    null,

                userId:
                    null

            })

        ),


    aventura: {

        aberta:
            false,

        tipo:
            null,

        dados:
            null

    },


    batalha: {

        ativa:
            false,

        rodada:
            0,

        turno:
            null,

        participantes:
            []

    },


    /*
     ESTADO DO CTE

     O CTE agora funciona por clique.

     inicio:
         momento exato em que a janela começou.

     tempo:
         duração da janela de clique.

     cliques:
         quantidade de cliques realizados.

     quantidade:
         quantidade necessária de cliques.

     resultado:
         resultado final do CTE.
    */

    cte: {

        ativo:
            false,

        tempo:
            MESA_CONFIG.cte.tempoPadrao,

        quantidade:
            MESA_CONFIG.cte.quantidadePadrao,

        cliques:
            0,

        resultados:
            [],

        inicio:
            null

    }

};


/* ============================================================
   REALTIME
============================================================ */

/*
    Canal Realtime responsável pelos personagens
    da campanha atualmente aberta.

    IMPORTANTE:

    O Realtime não substitui a tabela characters.

    Ele apenas avisa a mesa quando alguma coisa
    mudou no banco.

    Quando recebe uma alteração, fazemos uma nova
    leitura dos personagens da campanha para garantir
    que o estado local fique completamente atualizado.
*/

let mesaRealtimeChannel = null;

let mesaRealtimeCampaignId = null;


/* ============================================================
   OBTER CLIENTE SUPABASE
============================================================ */

function obterSupabaseMesa() {

    return (

        window.supabaseClient ||

        window.supabase ||

        null

    );

}


/* ============================================================
   CARREGAR JOGADORES DA CAMPANHA
============================================================ */

async function carregarJogadoresDaCampanha() {

    const campanhaId =
        mesaState.campanha.id;


    if (!campanhaId) {

        console.warn(
            "[Mesa Realtime] Nenhuma campanha ativa para carregar jogadores."
        );

        return [];

    }


    const supabase =
        obterSupabaseMesa();


    if (!supabase) {

        console.warn(
            "[Mesa Realtime] Cliente Supabase não encontrado."
        );

        return [];

    }


    try {

        const {

            data: personagens,

            error

        } = await supabase

            .from("characters")

            .select("*")

            .eq(
                "campaign_id",
                campanhaId
            )

            .order(
                "slot",
                {
                    ascending:
                        true,

                    nullsFirst:
                        false
                }
            );


        if (error) {

            console.error(
                "[Mesa Realtime] Erro ao carregar personagens:",
                error
            );

            return [];

        }


        const lista =

            Array.isArray(personagens)

                ? personagens

                : [];


        /*
         ------------------------------------------------------
         ATUALIZAR CACHE GLOBAL
         ------------------------------------------------------
        */

        if (window.rpgAuth) {

            window.rpgAuth.campaignCharacters =
                lista;

        }


        /*
         ------------------------------------------------------
         ATUALIZAR OS 8 ASSENTOS
         ------------------------------------------------------
        */

        sincronizarJogadoresRealtime(
            lista
        );


        /*
         ------------------------------------------------------
         AVISAR OS OUTROS MÓDULOS
         ------------------------------------------------------
        */

        document.dispatchEvent(

            new CustomEvent(
                "rpg:campanhaAtualizada",
                {

                    detail: {

                        campanha:
                            mesaState.campanha,

                        personagens:
                            lista

                    }

                }

            )

        );


        document.dispatchEvent(

            new CustomEvent(
                "mesa:jogadoresAtualizados",
                {

                    detail: {

                        personagens:
                            lista

                    }

                }

            )

        );


        return lista;

    } catch (erro) {

        console.error(
            "[Mesa Realtime] Falha ao sincronizar jogadores:",
            erro
        );

        return [];

    }

}


/* ============================================================
   SINCRONIZAR ASSENTOS PELO REALTIME
============================================================ */

function sincronizarJogadoresRealtime(
    personagens = []
) {

    const lista =

        Array.isArray(personagens)

            ? personagens

            : [];


    /*
     Criamos uma representação dos jogadores
     usando o slot existente em characters.
    */

    const jogadores =

        lista

            .filter(
                personagem => {

                    const slot =
                        Number(
                            personagem?.slot
                        );

                    return (

                        Number.isInteger(slot) &&

                        slot >= 1 &&

                        slot <=
                            MESA_CONFIG.maxJogadores

                    );

                }
            )

            .map(
                personagem => ({

                    slot:
                        Number(
                            personagem.slot
                        ),

                    ocupado:
                        true,

                    characterId:
                        personagem.id ||
                        null,

                    userId:
                        personagem.user_id ||
                        null

                })

            );


    /*
     A própria função já sabe como montar
     os oito lugares.
    */

    definirAssentos(
        jogadores
    );


    /*
     ----------------------------------------------------------
     ATUALIZAR O JOGADOR ATUAL
     ----------------------------------------------------------
    */

    const usuarioId =
        mesaState.usuario.id;


    if (usuarioId) {

        const meuPersonagem =

            lista.find(

                personagem =>

                    String(
                        personagem?.user_id
                    ) ===
                    String(
                        usuarioId
                    )

            );


        if (meuPersonagem) {

            mesaState.jogadorAtual.characterId =

                meuPersonagem.id ||

                null;


            mesaState.jogadorAtual.slot =

                Number(
                    meuPersonagem.slot
                ) ||

                null;

        }

    }


    /*
     ----------------------------------------------------------
     LOG
     ----------------------------------------------------------
    */

    console.log(
        "[Mesa Realtime] Jogadores sincronizados:",
        lista
    );

}


/* ============================================================
   INICIAR REALTIME DA CAMPANHA
============================================================ */

async function iniciarRealtimeMesa() {

    const campanhaId =
        mesaState.campanha.id;


    if (!campanhaId) {

        console.warn(
            "[Mesa Realtime] Não foi possível iniciar: campanha sem ID."
        );

        return;

    }


    const supabase =
        obterSupabaseMesa();


    if (!supabase) {

        console.warn(
            "[Mesa Realtime] Não foi possível iniciar: Supabase não encontrado."
        );

        return;

    }


    /*
     ----------------------------------------------------------
     SE JÁ EXISTE UM CANAL PARA ESSA CAMPANHA,
     NÃO CRIAMOS OUTRO.
     ----------------------------------------------------------
    */

    if (

        mesaRealtimeChannel &&

        mesaRealtimeCampaignId ===
            String(campanhaId)

    ) {

        return;

    }


    /*
     Se existe canal de outra campanha,
     removemos antes.
    */

    await pararRealtimeMesa();


    mesaRealtimeCampaignId =
        String(campanhaId);


    const nomeCanal =

        `mesa-campanha-${campanhaId}`;


    console.log(
        "[Mesa Realtime] Iniciando canal:",
        nomeCanal
    );


    mesaRealtimeChannel =

        supabase

            .channel(
                nomeCanal
            )

            .on(

                "postgres_changes",

                {

                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "characters",

                    filter:
                        `campaign_id=eq.${campanhaId}`

                },

                payload => {

                    console.log(
                        "[Mesa Realtime] Alteração recebida:",
                        payload
                    );


                    /*
                     Não tentamos montar manualmente
                     o estado usando apenas payload.

                     Recarregamos a lista completa para
                     manter os 8 slots consistentes.
                    */

                    carregarJogadoresDaCampanha();

                }

            )

            .subscribe(

                status => {

                    console.log(
                        "[Mesa Realtime] Status:",
                        status
                    );


                    if (
                        status ===
                        "SUBSCRIBED"
                    ) {

                        console.log(
                            "[Mesa Realtime] Conectado à campanha:",
                            campanhaId
                        );

                    }

                }

            );

}


/* ============================================================
   PARAR REALTIME
============================================================ */

async function pararRealtimeMesa() {

    if (!mesaRealtimeChannel) {

        mesaRealtimeCampaignId =
            null;

        return;

    }


    const supabase =
        obterSupabaseMesa();


    try {

        if (supabase) {

            await supabase.removeChannel(
                mesaRealtimeChannel
            );

        }

    } catch (erro) {

        console.warn(
            "[Mesa Realtime] Erro ao remover canal:",
            erro
        );

    }


    mesaRealtimeChannel =
        null;


    mesaRealtimeCampaignId =
        null;


    console.log(
        "[Mesa Realtime] Canal encerrado."
    );

}


/* ============================================================
   SINCRONIZAR REALTIME COM A CAMPANHA ATUAL
============================================================ */

async function sincronizarRealtimeCampanha() {

    if (!mesaState.campanha.id) {

        await pararRealtimeMesa();

        return;

    }


    await carregarJogadoresDaCampanha();

    await iniciarRealtimeMesa();

}


/* ============================================================
   REFERÊNCIAS DA INTERFACE
============================================================ */

const MesaUI = {

    container:
        null,

    layout:
        null,

    jogadores:
        null,

    stage:
        null,

    screen:
        null,

    screenContent:
        null,

    nomeCampanha:
        null

};


/* ============================================================
   LER MESA SALVA
============================================================ */

function obterMesaSalva() {

    try {

        const salvo =
            localStorage.getItem(
                "rpg_mesa_ativa"
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
            "[Mesa] Erro ao ler rpg_mesa_ativa:",
            erro
        );

        return null;

    }

}


/* ============================================================
   INICIALIZAÇÃO
============================================================ */

function inicializarMesa() {

    if (
        mesaState.inicializado
    ) {

        return;

    }


    MesaUI.container =
        document.getElementById(
            "online-table-panel"
        );


    MesaUI.layout =
        document.querySelector(
            ".mesa-layout"
        );


    MesaUI.jogadores =
        document.getElementById(
            "jogadores"
        );


    MesaUI.stage =
        document.getElementById(
            "mesa-stage"
        );


    MesaUI.screen =
        document.getElementById(
            "mesa-screen"
        );


    MesaUI.screenContent =
        document.getElementById(
            "mesa-screen-content"
        );


    MesaUI.nomeCampanha =
        document.getElementById(
            "nome-campanha"
        );


    if (!MesaUI.container) {

        console.warn(
            "[Mesa] #online-table-panel não encontrado."
        );

        return;

    }


    carregarContextoUsuario();


    mesaState.inicializado =
        true;


    registrarEventos();

    atualizarCampanhaVisual();

    atualizarModoVisual();

    atualizarAssentos();

    inicializarSubmodulos();


    /*
     ----------------------------------------------------------
     INICIAR SINCRONIZAÇÃO REALTIME
     ----------------------------------------------------------

     Usamos setTimeout para permitir que os outros
     módulos da mesa terminem a inicialização primeiro.
    */

    setTimeout(

        () => {

            sincronizarRealtimeCampanha();

        },

        0

    );


    document.dispatchEvent(

        new CustomEvent(
            "mesa:inicializada",
            {
                detail:
                    mesaState
            }
        )

    );


    console.log(
        "[Mesa] Mesa RPG inicializada.",
        {
            usuario:
                mesaState.usuario,

            campanha:
                mesaState.campanha,

            mestre:
                mesaState.usuario.isMaster
        }
    );

}


/* ============================================================
   CONTEXTO DO USUÁRIO
============================================================ */

function carregarContextoUsuario() {

    const auth =
        window.rpgAuth || null;


    const salvo =
        obterMesaSalva();


    const campanha =
        obterCampanhaAtiva();


    let usuarioId =
        null;

    let usuarioNome =
        null;

    let usuarioEmail =
        null;


    if (
        auth?.user
    ) {

        usuarioId =
            auth.user.id ||
            null;


        usuarioNome =

            auth.user.user_metadata?.name ||

            auth.user.user_metadata?.full_name ||

            auth.user.email ||

            null;


        usuarioEmail =
            auth.user.email ||
            null;

    }


    if (
        !usuarioId &&
        salvo?.userId
    ) {

        usuarioId =
            salvo.userId;

    }


    if (
        !usuarioNome &&
        salvo?.userName
    ) {

        usuarioNome =
            salvo.userName;

    }


    if (
        !usuarioEmail &&
        salvo?.userEmail
    ) {

        usuarioEmail =
            salvo.userEmail;

    }


    mesaState.usuario.id =
        usuarioId;


    mesaState.usuario.nome =
        usuarioNome ||
        "Jogador";


    mesaState.usuario.email =
        usuarioEmail ||
        null;


    if (campanha) {

        mesaState.campanha.id =
            campanha.id ||
            null;


        mesaState.campanha.nome =

            campanha.name ||

            campanha.nome ||

            "Campanha";


        mesaState.campanha.codigoMesa =

            campanha.codigo_mesa ||

            campanha.codigoMesa ||

            null;


        mesaState.campanha.masterId =

            campanha.master_id ||

            campanha.masterId ||

            null;

    }


    if (
        !mesaState.campanha.masterId &&
        salvo?.masterId
    ) {

        mesaState.campanha.masterId =
            salvo.masterId;

    }


    atualizarPermissaoUsuario();

    descobrirJogadorAtual();

}


/* ============================================================
   ATUALIZAR PERMISSÃO
============================================================ */

function atualizarPermissaoUsuario() {

    const usuarioId =
        mesaState.usuario.id;


    const masterId =
        mesaState.campanha.masterId;


    const mestrePorCampanha =
        Boolean(

            usuarioId &&

            masterId &&

            String(usuarioId).trim().toLowerCase() ===

            String(masterId).trim().toLowerCase()

        );


    const mestrePorAuth =
        Boolean(
            window.rpgAuth?.isMaster === true
        );


    let mestrePorInterface =
        false;


    if (
        typeof window.usuarioEhMestreInterface ===
        "function"
    ) {

        try {

            mestrePorInterface =
                window.usuarioEhMestreInterface() ===
                true;

        } catch (erro) {

            console.warn(
                "[Mesa] Falha ao verificar mestre pela interface:",
                erro
            );

        }

    }


    mesaState.usuario.isMaster =

        mestrePorCampanha ||

        mestrePorAuth ||

        mestrePorInterface;


    mesaState.usuario.isPlayer =

        Boolean(
            usuarioId
        ) &&

        !mesaState.usuario.isMaster;


    if (
        window.rpgAuth
    ) {

        window.rpgAuth.isMaster =
            mesaState.usuario.isMaster;

    }


    console.log(
        "[Mesa] Permissão determinada:",
        {

            usuarioId,

            masterId,

            mestrePorCampanha,

            mestrePorAuth,

            mestrePorInterface,

            isMaster:
                mesaState.usuario.isMaster,

            isPlayer:
                mesaState.usuario.isPlayer

        }
    );

}


/* ============================================================
   CAMPANHA ATIVA
============================================================ */

function obterCampanhaAtiva() {

    if (

        window.rpgCampaign &&

        typeof window.rpgCampaign.obterCampanhaAtiva ===
        "function"

    ) {

        try {

            const campanha =
                window.rpgCampaign
                    .obterCampanhaAtiva();


            if (campanha) {

                return campanha;

            }

        } catch (erro) {

            console.warn(
                "[Mesa] Erro ao obter campanha pelo campaign.js:",
                erro
            );

        }

    }


    if (
        window.rpgAuth?.campaign
    ) {

        return window.rpgAuth.campaign;

    }


    const salvo =
        obterMesaSalva();


    if (
        salvo?.campaignId
    ) {

        return {

            id:
                salvo.campaignId,

            name:
                salvo.campaignName ||

                salvo.name ||

                "Campanha",

            codigo_mesa:

                salvo.campaignCode ||

                salvo.codigoMesa ||

                null,

            master_id:

                salvo.masterId ||

                salvo.master_id ||

                null

        };

    }


    return null;

}


/* ============================================================
   DESCOBRIR JOGADOR ATUAL
============================================================ */

function descobrirJogadorAtual() {

    const salvo =
        obterMesaSalva();


    if (salvo) {

        mesaState.jogadorAtual.characterId =

            salvo.characterId ||

            null;


        mesaState.jogadorAtual.slot =

            Number(salvo.slot) ||

            null;

    }


    if (

        !mesaState.jogadorAtual.characterId &&

        window.rpgAuth

    ) {

        const personagem =

            window.rpgAuth.currentCharacter ||

            window.rpgAuth.campaignCharacter ||

            null;


        if (personagem) {

            mesaState.jogadorAtual.characterId =

                personagem.id ||

                null;


            mesaState.jogadorAtual.slot =

                Number(
                    personagem.slot
                ) ||

                null;

        }

    }


    if (

        !mesaState.jogadorAtual.characterId &&

        Array.isArray(
            window.rpgAuth?.campaignCharacters
        )

    ) {

        const usuarioId =
            mesaState.usuario.id;


        const personagem =

            window.rpgAuth
                .campaignCharacters
                .find(

                    character =>

                        String(
                            character.user_id
                        ) ===

                        String(
                            usuarioId
                        )

                );


        if (personagem) {

            mesaState.jogadorAtual.characterId =

                personagem.id ||

                null;


            mesaState.jogadorAtual.slot =

                Number(
                    personagem.slot
                ) ||

                null;

        }

    }

}


/* ============================================================
   EVENTOS
============================================================ */

function registrarEventos() {

    document.addEventListener(

        "mesa:jogadorAtualizado",

        event => {

            if (
                event.detail?.slot
            ) {

                atualizarAssento(

                    event.detail.slot,

                    event.detail

                );

            }

        }

    );


    document.addEventListener(

        "mesa:jogadoresAtualizados",

        () => {

            atualizarAssentos();

        }

    );


    document.addEventListener(

        "mesa:campanhaAlterada",

        event => {

            const detalhe =
                event.detail || null;


            const campanha =

                detalhe?.campanha ||

                detalhe?.campaign ||

                detalhe;


            if (campanha) {

                sincronizarCampanha(
                    campanha
                );

            }

        }

    );

}


/* ============================================================
   SINCRONIZAR CAMPANHA
============================================================ */

function sincronizarCampanha(
    campanha
) {

    if (!campanha) {

        return;

    }


    const campanhaAnterior =
        mesaState.campanha.id;


    mesaState.campanha.id =

        campanha.id ||

        mesaState.campanha.id;


    mesaState.campanha.nome =

        campanha.name ||

        campanha.nome ||

        mesaState.campanha.nome;


    mesaState.campanha.codigoMesa =

        campanha.codigo_mesa ||

        campanha.codigoMesa ||

        mesaState.campanha.codigoMesa;


    mesaState.campanha.masterId =

        campanha.master_id ||

        campanha.masterId ||

        mesaState.campanha.masterId;


    atualizarPermissaoUsuario();

    atualizarCampanhaVisual();


    /*
     Se a campanha mudou, trocamos o canal Realtime.
    */

    if (
        campanhaAnterior !==
        mesaState.campanha.id
    ) {

        sincronizarRealtimeCampanha();

    } else {

        /*
         Mesmo sendo a mesma campanha, garantimos
         que o canal esteja ativo.
        */

        sincronizarRealtimeCampanha();

    }

}


/* ============================================================
   SELECIONAR JOGADOR
============================================================ */

function selecionarJogador(
    slot
) {

    const numeroSlot =
        Number(slot);


    if (

        !numeroSlot ||

        numeroSlot < 1 ||

        numeroSlot >
            MESA_CONFIG.maxJogadores

    ) {

        return;

    }


    const jogador =
        mesaState.jogadores[
            numeroSlot - 1
        ];


    if (!jogador) {

        return;

    }


    const slotAtual =
        Number(
            mesaState.jogadorAtual.slot
        );


    const ehProprioJogador =
        slotAtual ===
        numeroSlot;


    document.dispatchEvent(

        new CustomEvent(
            "mesa:jogadorSelecionado",
            {

                detail: {

                    slot:
                        numeroSlot,

                    jogador,

                    ehProprioJogador

                }

            }

        )

    );


    if (ehProprioJogador) {

        if (

            typeof window.abrirFichaJogador ===
            "function"

        ) {

            window.abrirFichaJogador(
                numeroSlot
            );

        }

        return;

    }


    document.dispatchEvent(

        new CustomEvent(
            "mesa:interacaoJogador",
            {

                detail: {

                    origem:
                        slotAtual,

                    alvo:
                        numeroSlot

                }

            }

        )

    );

}


/* ============================================================
   MODO
============================================================ */

function mudarModo(
    modo
) {

    if (

        !Object.values(
            MESA_CONFIG.modos
        ).includes(modo)

    ) {

        console.warn(
            "[Mesa] Modo inválido:",
            modo
        );

        return;

    }


    mesaState.modoAtual =
        modo;


    atualizarModoVisual();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:modoAlterado",
            {

                detail: {

                    modo,

                    estado:
                        mesaState

                }

            }

        )

    );

}


/* ============================================================
   VISUAL DO MODO
============================================================ */

function atualizarModoVisual() {

    if (!MesaUI.container) {

        return;

    }


    MesaUI.container.dataset.modo =
        mesaState.modoAtual;


    MesaUI.container.classList.remove(

        "modo-normal",

        "modo-aventura",

        "modo-batalha"

    );


    MesaUI.container.classList.add(

        `modo-${mesaState.modoAtual}`

    );

}


/* ============================================================
   MESA NORMAL
============================================================ */

function voltarParaMesaNormal() {

    /*
     Se houver CTE ativo, ele é encerrado.
    */

    if (
        mesaState.cte.ativo
    ) {

        limparCTE();

    }


    mesaState.modoAtual =
        MESA_CONFIG.modos.NORMAL;


    mesaState.aventura.aberta =
        false;


    mesaState.aventura.tipo =
        null;


    atualizarModoVisual();

    mostrarTelaPrincipal();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:modoNormal",
            {

                detail:
                    mesaState

            }

        )

    );

}


/* ============================================================
   AVENTURA
============================================================ */

function abrirAventura(
    tipo,
    dados = {}
) {

    mesaState.aventura.aberta =
        true;


    mesaState.aventura.tipo =
        tipo;


    mesaState.aventura.dados =
        dados;


    mudarModo(
        MESA_CONFIG.modos.AVENTURA
    );


    mostrarTela(
        "🎲 Preparando aventura..."
    );


    document.dispatchEvent(

        new CustomEvent(
            "mesa:aventuraAberta",
            {

                detail: {

                    tipo,

                    dados,

                    estado:
                        mesaState

                }

            }

        )

    );


    if (

        window.MesaAventura &&

        typeof window.MesaAventura.abrir ===
        "function"

    ) {

        window.MesaAventura.abrir(

            tipo,

            dados

        );

    }

}


/* ============================================================
   BATALHA
============================================================ */

function iniciarBatalha(
    participantes = null
) {

    mesaState.batalha.ativa =
        true;


    mesaState.batalha.rodada =
        1;


    mesaState.batalha.turno =
        null;


    if (
        Array.isArray(
            participantes
        )
    ) {

        mesaState.batalha.participantes =
            participantes;

    } else {

        mesaState.batalha.participantes =

            mesaState.jogadores

                .filter(
                    jogador =>
                        jogador.ocupado
                )

                .map(
                    jogador =>
                        jogador.slot
                );

    }


    mudarModo(
        MESA_CONFIG.modos.BATALHA
    );


    mostrarTela(
        "⚔️ Preparando combate..."
    );


    document.dispatchEvent(

        new CustomEvent(
            "mesa:batalhaIniciada",
            {

                detail: {

                    participantes:

                        mesaState.batalha
                            .participantes,

                    estado:
                        mesaState

                }

            }

        )

    );


    if (

        typeof window.inicializarMesaBatalha ===
        "function"

    ) {

        window.inicializarMesaBatalha(
            mesaState
        );

    }


    return mesaState.batalha;

}


/* ============================================================
   FINALIZAR BATALHA
============================================================ */

function finalizarBatalha(
    resultado = null
) {

    mesaState.batalha.ativa =
        false;


    mesaState.batalha.turno =
        null;


    mesaState.batalha.rodada =
        0;


    document.dispatchEvent(

        new CustomEvent(
            "mesa:batalhaFinalizada",
            {

                detail: {

                    resultado,

                    estado:
                        mesaState

                }

            }

        )

    );


    if (

        typeof window.restaurarMesaBatalha ===
        "function"

    ) {

        window.restaurarMesaBatalha();

    }


    voltarParaMesaNormal();

}


/* ============================================================
   BOSS
============================================================ */

function iniciarBoss(
    dados = {}
) {

    mesaState.aventura.aberta =
        true;


    mesaState.aventura.tipo =
        "boss";


    mesaState.aventura.dados =
        dados;


    mudarModo(
        MESA_CONFIG.modos.AVENTURA
    );


    mostrarTela(
        "👹 Um Boss está se aproximando..."
    );


    document.dispatchEvent(

        new CustomEvent(
            "mesa:bossIniciado",
            {

                detail: {

                    dados,

                    estado:
                        mesaState

                }

            }

        )

    );


    if (

        window.MesaAventura &&

        typeof window.MesaAventura.boss ===
        "function"

    ) {

        window.MesaAventura.boss(
            dados
        );

    }

}


/* ============================================================
   CTE
============================================================ */

/*
==============================================================
 INICIAR CTE

 O CTE agora é:

     1. Mestre inicia
     2. Área central entra em modo CTE
     3. Botão aparece
     4. Começa a janela de tempo
     5. Jogador clica
     6. O CORE verifica o tempo exato
     7. Sucesso ou falha

 O tempo NÃO é o evento.

 O clique é o evento.
==============================================================
*/

function iniciarCTE(
    opcoes = {}
) {

    if (
        !MESA_CONFIG.cte.disponivel
    ) {

        console.warn(
            "[Mesa] CTE está desativado."
        );

        return;

    }


    if (
        mesaState.cte.ativo
    ) {

        return;

    }


    /*
     ----------------------------------------------------------
     TEMPO
     ----------------------------------------------------------

     Aceitamos:

         tempo: 1000
         duracao: 1000

     para manter compatibilidade com chamadas antigas.
    */

    let tempo =

        Number(
            opcoes.tempo
        );


    if (
        !Number.isFinite(tempo) ||
        tempo <= 0
    ) {

        tempo =
            Number(
                opcoes.duracao
            );

    }


    if (
        !Number.isFinite(tempo) ||
        tempo <= 0
    ) {

        tempo =
            MESA_CONFIG.cte.tempoPadrao;

    }


    /*
     ----------------------------------------------------------
     QUANTIDADE DE CLIQUES
     ----------------------------------------------------------
    */

    let quantidade =

        Number(
            opcoes.quantidade
        );


    if (
        !Number.isFinite(quantidade) ||
        quantidade < 1
    ) {

        quantidade =
            MESA_CONFIG.cte.quantidadePadrao;

    }


    quantidade =
        Math.floor(
            quantidade
        );


    /*
     ----------------------------------------------------------
     ESTADO
     ----------------------------------------------------------
    */

    mesaState.cte.ativo =
        true;


    mesaState.cte.tempo =
        tempo;


    mesaState.cte.quantidade =
        quantidade;


    mesaState.cte.cliques =
        0;


    mesaState.cte.resultados =
        [];


    mesaState.cte.inicio =
        performance.now();


    /*
     ----------------------------------------------------------
     MOSTRAR CTE
     ----------------------------------------------------------
    */

    criarTelaCTE();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:cteIniciado",
            {

                detail: {

                    tempo,

                    quantidade,

                    inicio:
                        mesaState.cte.inicio,

                    estado:
                        mesaState

                }

            }

        )

    );


    /*
     ----------------------------------------------------------
     COMEÇAR A JANELA DE TEMPO
     ----------------------------------------------------------
    */

    executarContagemCTE();

}


/* ============================================================
   TELA CENTRAL DO CTE
============================================================ */

function criarTelaCTE() {

    if (!MesaUI.screenContent) {

        console.warn(
            "[Mesa] #mesa-screen-content não encontrado."
        );

        return;

    }


    /*
     IMPORTANTE:

     Não criamos mais um overlay.

     O CTE vive diretamente dentro da
     área central de informações.
    */

    MesaUI.screenContent.innerHTML = `

        <div
            class="mesa-cte"
            id="mesa-cte">

            <div class="mesa-cte-header">

                <span class="mesa-cte-icon">
                    ⚡
                </span>

                <div>

                    <span class="mesa-cte-label">
                        CLICK TIME EVENT
                    </span>

                    <h2>
                        Prepare-se
                    </h2>

                </div>

            </div>


            <p
                class="mesa-cte-instruction"
                id="cte-instruction">

                Clique quando estiver pronto!

            </p>


            <div class="mesa-cte-timer">

                <span
                    id="cte-timer-value">
                    1.000
                </span>

                <small>
                    segundos
                </small>

            </div>


            <div class="mesa-cte-progress">

                <div
                    id="cte-progress-bar"
                    class="mesa-cte-progress-bar">
                </div>

            </div>


            <button
                type="button"
                class="mesa-cte-click"
                id="cte-click-button"
                data-mesa-action="cte"
                data-cte-action="clique">

                <span class="mesa-cte-click-icon">
                    ⚡
                </span>

                <span>
                    CLIQUE!
                </span>

            </button>


            <div
                class="mesa-cte-counter"
                id="cte-click-counter">

                0 / ${mesaState.cte.quantidade}

            </div>

        </div>

    `;

}


/* ============================================================
   CONTAGEM / JANELA DE TEMPO DO CTE
============================================================ */

function executarContagemCTE() {

    if (
        !mesaState.cte.ativo
    ) {

        return;

    }


    const inicio =
        mesaState.cte.inicio;


    const tempo =
        mesaState.cte.tempo;


    function atualizar() {

        if (
            !mesaState.cte.ativo
        ) {

            return;

        }


        const agora =
            performance.now();


        const decorrido =
            agora -
            inicio;


        const restante =
            Math.max(

                0,

                tempo -
                decorrido

            );


        const percentual =

            Math.min(

                100,

                (
                    decorrido /
                    tempo
                ) * 100

            );


        const timer =
            document.getElementById(
                "cte-timer-value"
            );


        const progress =
            document.getElementById(
                "cte-progress-bar"
            );


        /*
         ------------------------------------------------------
         MOSTRAR TEMPO
         ------------------------------------------------------
        */

        if (timer) {

            timer.textContent =

                (
                    restante /
                    1000

                ).toFixed(3);

        }


        /*
         ------------------------------------------------------
         BARRA
         ------------------------------------------------------
        */

        if (progress) {

            progress.style.width =
                `${percentual}%`;

        }


        /*
         ------------------------------------------------------
         TEMPO ESGOTADO
         ------------------------------------------------------

         IMPORTANTE:

         O tempo acabar NÃO significa sucesso.

         Significa que a janela de clique fechou.
        */

        if (
            restante <= 0
        ) {

            finalizarCTEPorTempo();

            return;

        }


        requestAnimationFrame(
            atualizar
        );

    }


    atualizar();

}


/* ============================================================
   CLIQUE REAL DO CTE
============================================================ */

function executarCliqueCTE(
    elemento = null,
    evento = null
) {

    if (
        !mesaState.cte.ativo
    ) {

        return;

    }


    const agora =
        performance.now();


    const decorrido =
        agora -
        mesaState.cte.inicio;


    /*
     ----------------------------------------------------------
     O CLIQUE PRECISA ESTAR DENTRO DA JANELA
     ----------------------------------------------------------
    */

    if (
        decorrido >
        mesaState.cte.tempo
    ) {

        finalizarCTEPorTempo();

        return;

    }


    /*
     ----------------------------------------------------------
     REGISTRAR CLIQUE
     ----------------------------------------------------------
    */

    mesaState.cte.cliques++;


    const cliqueAtual =
        mesaState.cte.cliques;


    const quantidade =
        mesaState.cte.quantidade;


    /*
     ----------------------------------------------------------
     EVENTO DE CLIQUE
     ----------------------------------------------------------
    */

    document.dispatchEvent(

        new CustomEvent(
            "mesa:cteClique",
            {

                detail: {

                    clique:
                        cliqueAtual,

                    quantidade,

                    tempoDecorrido:
                        decorrido,

                    tempoRestante:

                        Math.max(

                            0,

                            mesaState.cte.tempo -
                            decorrido

                        ),

                    elemento,

                    evento,

                    estado:
                        mesaState

                }

            }

        )

    );


    /*
     ----------------------------------------------------------
     ATUALIZAR CONTADOR
     ----------------------------------------------------------
    */

    const contador =
        document.getElementById(
            "cte-click-counter"
        );


    if (contador) {

        contador.textContent =

            `${cliqueAtual} / ${quantidade}`;

    }


    /*
     ----------------------------------------------------------
     QUANTIDADE ATINGIDA
     ----------------------------------------------------------
    */

    if (
        cliqueAtual >=
        quantidade
    ) {

        finalizarCTESucesso(
            decorrido
        );

        return;

    }


    /*
     Ainda precisa de mais cliques.
    */

    const instrucao =
        document.getElementById(
            "cte-instruction"
        );


    if (instrucao) {

        instrucao.textContent =

            `Clique novamente! ${cliqueAtual} / ${quantidade}`;

    }

}


/* ============================================================
   CTE — SUCESSO
============================================================ */

function finalizarCTESucesso(
    tempoDecorrido
) {

    if (
        !mesaState.cte.ativo
    ) {

        return;

    }


    /*
     Desativa imediatamente.

     Isso impede que o requestAnimationFrame
     continue processando o CTE.
    */

    mesaState.cte.ativo =
        false;


    const resultado = {

        sucesso:
            true,

        cliques:
            mesaState.cte.cliques,

        quantidade:
            mesaState.cte.quantidade,

        tempo:
            mesaState.cte.tempo,

        tempoDecorrido,

        tempoRestante:

            Math.max(

                0,

                mesaState.cte.tempo -
                tempoDecorrido

            ),

        timestamp:
            Date.now()

    };


    mesaState.cte.resultados.push(
        resultado
    );


    mostrarResultadoCTE(
        resultado
    );


    document.dispatchEvent(

        new CustomEvent(
            "mesa:cteResultado",
            {

                detail: {

                    resultado,

                    estado:
                        mesaState

                }

            }

        )

    );

}


/* ============================================================
   CTE — FALHA POR TEMPO
============================================================ */

function finalizarCTEPorTempo() {

    if (
        !mesaState.cte.ativo
    ) {

        return;

    }


    mesaState.cte.ativo =
        false;


    const resultado = {

        sucesso:
            false,

        motivo:
            "tempo_esgotado",

        cliques:
            mesaState.cte.cliques,

        quantidade:
            mesaState.cte.quantidade,

        tempo:
            mesaState.cte.tempo,

        tempoDecorrido:
            mesaState.cte.tempo,

        tempoRestante:
            0,

        timestamp:
            Date.now()

    };


    mesaState.cte.resultados.push(
        resultado
    );


    mostrarResultadoCTE(
        resultado
    );


    document.dispatchEvent(

        new CustomEvent(
            "mesa:cteResultado",
            {

                detail: {

                    resultado,

                    estado:
                        mesaState

                }

            }

        )

    );

}


/* ============================================================
   MOSTRAR RESULTADO CTE
============================================================ */

function mostrarResultadoCTE(
    resultado
) {

    if (!MesaUI.screenContent) {

        return;

    }


    const sucesso =
        resultado?.sucesso === true;


    if (sucesso) {

        MesaUI.screenContent.innerHTML = `

            <div
                class="mesa-cte-result mesa-cte-success">

                <div class="mesa-cte-result-icon">
                    ✓
                </div>

                <span class="mesa-cte-label">
                    CLICK TIME EVENT
                </span>

                <h2>
                    CTE CONCLUÍDO
                </h2>

                <p>
                    Clique realizado no tempo certo.
                </p>

                <div class="mesa-cte-result-time">

                    ${(
                        resultado.tempoDecorrido /
                        1000
                    ).toFixed(3)}s

                </div>

            </div>

        `;

    } else {

        MesaUI.screenContent.innerHTML = `

            <div
                class="mesa-cte-result mesa-cte-fail">

                <div class="mesa-cte-result-icon">
                    ×
                </div>

                <span class="mesa-cte-label">
                    CLICK TIME EVENT
                </span>

                <h2>
                    CTE FALHOU
                </h2>

                <p>
                    O tempo acabou antes do clique necessário.
                </p>

            </div>

        `;

    }


    /*
     Depois do resultado, voltamos para
     a tela normal.
    */

    setTimeout(

        () => {

            mostrarTelaPrincipal();

            document.dispatchEvent(

                new CustomEvent(
                    "mesa:cteFinalizado",
                    {

                        detail: {

                            resultados:
                                mesaState.cte.resultados,

                            estado:
                                mesaState

                        }

                    }

                )

            );

        },

        1500

    );

}


/* ============================================================
   LIMPAR CTE
============================================================ */

function limparCTE() {

    mesaState.cte.ativo =
        false;


    mesaState.cte.inicio =
        null;


    /*
     Não procuramos mais #cte-overlay.

     O CTE está dentro da tela central.
    */

    mostrarTelaPrincipal();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:cteFinalizado",
            {

                detail: {

                    resultados:
                        mesaState.cte.resultados,

                    estado:
                        mesaState

                }

            }

        )

    );

}


/* ============================================================
   TELA PRINCIPAL
============================================================ */

function mostrarTelaPrincipal() {

    if (!MesaUI.screenContent) {

        return;

    }


    MesaUI.screenContent.innerHTML = `

        <div class="mesa-welcome">

            <div class="mesa-welcome-icon">
                🎲
            </div>

            <h2>
                Mesa de RPG
            </h2>

            <p>
                Aguardando o início da aventura...
            </p>

        </div>

    `;

}


/* ============================================================
   MOSTRAR TELA
============================================================ */

function mostrarTela(
    conteudo
) {

    if (!MesaUI.screenContent) {

        return;

    }


    if (
        typeof conteudo ===
        "string"
    ) {

        MesaUI.screenContent.innerHTML = `

            <div class="mesa-screen-message">

                ${conteudo}

            </div>

        `;

        return;

    }


    if (
        conteudo instanceof HTMLElement
    ) {

        MesaUI.screenContent.innerHTML =
            "";

        MesaUI.screenContent.appendChild(
            conteudo
        );

    }

}


/* ============================================================
   ASSENTOS
============================================================ */

function atualizarAssentos() {

    if (!MesaUI.jogadores) {

        return;

    }


    const cards =
        Array.from(

            MesaUI.jogadores
                .querySelectorAll(
                    "[data-player]"
                )

        );


    cards.forEach(

        card => {

            const slot =
                Number(
                    card.dataset.player
                );


            const assento =
                mesaState.jogadores[
                    slot - 1
                ];


            if (!assento) {

                return;

            }


            atualizarAssento(
                slot,
                assento
            );

        }

    );

}


/* ============================================================
   ATUALIZAR ASSENTO
============================================================ */

function atualizarAssento(
    slot,
    dados = {}
) {

    const card =
        MesaUI.jogadores?.querySelector(

            `[data-player="${slot}"]`

        );


    const assento =
        mesaState.jogadores[
            Number(slot) - 1
        ];


    if (!assento) {

        return;

    }


    /*
     IMPORTANTE:

     Se o novo estado vier vazio, precisamos
     realmente limpar characterId e userId.
    */

    if (
        typeof dados.ocupado !==
        "undefined"
    ) {

        assento.ocupado =
            Boolean(
                dados.ocupado
            );

    }


    if (
        typeof dados.characterId !==
        "undefined"
    ) {

        assento.characterId =
            dados.characterId ||
            null;

    }


    if (
        typeof dados.userId !==
        "undefined"
    ) {

        assento.userId =
            dados.userId ||
            null;

    }


    if (!card) {

        return;

    }


    card.classList.toggle(
        "ocupado",
        assento.ocupado
    );


    card.classList.toggle(
        "vazio",
        !assento.ocupado
    );

}


/* ============================================================
   CAMPANHA VISUAL
============================================================ */

function atualizarCampanhaVisual() {

    if (!MesaUI.nomeCampanha) {

        return;

    }


    MesaUI.nomeCampanha.textContent =

        mesaState.campanha.nome ||

        "Campanha";

}


/* ============================================================
   DEFINIR ASSENTOS
============================================================ */

function definirAssentos(
    jogadores = []
) {

    mesaState.jogadores =

        Array.from(

            {
                length:
                    MESA_CONFIG.maxJogadores
            },

            (_, index) => {

                const jogador =

                    jogadores.find(

                        item =>

                            Number(
                                item.slot
                            ) ===
                            index + 1

                    );


                if (!jogador) {

                    return {

                        slot:
                            index + 1,

                        ocupado:
                            false,

                        characterId:
                            null,

                        userId:
                            null

                    };

                }


                return {

                    slot:
                        index + 1,

                    ocupado:
                        Boolean(
                            jogador.ocupado !==
                            false
                        ),

                    characterId:

                        jogador.characterId ||

                        jogador.id ||

                        null,

                    userId:

                        jogador.userId ||

                        jogador.user_id ||

                        null

                };

            }

        );


    atualizarAssentos();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:assentosAtualizados",
            {

                detail:
                    mesaState.jogadores

            }

        )

    );

}


/* ============================================================
   RESET VISUAL
============================================================ */

function resetarMesaVisual() {

    voltarParaMesaNormal();

    atualizarCampanhaVisual();

    atualizarAssentos();

}


/* ============================================================
   SUBMÓDULOS
============================================================ */

function inicializarSubmodulos() {

    /*
     Os submódulos possuem suas próprias
     inicializações quando disponíveis.

     Não forçamos nenhuma dependência.
    */

    if (

        window.MesaJogadores &&

        typeof window.MesaJogadores.inicializar ===
        "function"

    ) {

        try {

            window.MesaJogadores.inicializar();

        } catch (erro) {

            console.warn(
                "[Mesa] Erro ao inicializar MesaJogadores:",
                erro
            );

        }

    }


    if (

        window.MesaAventura &&

        typeof window.MesaAventura.inicializar ===
        "function"

    ) {

        try {

            window.MesaAventura.inicializar();

        } catch (erro) {

            console.warn(
                "[Mesa] Erro ao inicializar MesaAventura:",
                erro
            );

        }

    }

}


/* ============================================================
   API PÚBLICA
============================================================ */

window.MesaRPG = {

    estado:
        obterEstadoMesa,

    campanha:
        obterCampanhaMesa,

    sincronizarCampanha,

    usuarioEhMestre,

    usuarioEhJogador,

    obterSlotAtual,

    selecionarJogador,

    definirAssentos,

    atualizarAssentos,

    mudarModo,

    voltarParaMesaNormal,

    abrirAventura,

    iniciarBatalha,

    finalizarBatalha,

    iniciarBoss,

    iniciarCTE,

    executarCliqueCTE,

    limparCTE,

    mostrarTela,

    mostrarTelaPrincipal,

    resetarMesaVisual,

    /*
     API Realtime
    */

    carregarJogadoresDaCampanha,

    iniciarRealtimeMesa,

    pararRealtimeMesa,

    sincronizarRealtimeCampanha

};


/* ============================================================
   FUNÇÕES AUXILIARES
============================================================ */

function obterEstadoMesa() {

    return mesaState;

}


function usuarioEhMestre() {

    return (
        mesaState.usuario.isMaster ===
        true
    );

}


function usuarioEhJogador() {

    return (
        mesaState.usuario.isPlayer ===
        true
    );

}


function obterSlotAtual() {

    return (

        mesaState.jogadorAtual.slot ||

        null

    );

}


function obterCampanhaMesa() {

    return {

        ...mesaState.campanha

    };

}


/* ============================================================
   COMPATIBILIDADE GLOBAL
============================================================ */

window.inicializarMesa =
    inicializarMesa;


window.mudarModoMesa =
    mudarModo;


window.abrirMesaAventura =
    abrirAventura;


window.iniciarMesaBatalha =
    iniciarBatalha;


window.finalizarMesaBatalha =
    finalizarBatalha;


window.iniciarMesaBoss =
    iniciarBoss;


window.iniciarMesaCTE =
    iniciarCTE;


window.executarCliqueMesaCTE =
    executarCliqueCTE;


window.limparMesaCTE =
    limparCTE;


window.obterEstadoMesa =
    obterEstadoMesa;


window.usuarioEhMestreMesa =
    usuarioEhMestre;


window.usuarioEhJogadorMesa =
    usuarioEhJogador;


/*
 Funções Realtime também ficam disponíveis
 globalmente caso outro módulo precise delas.
*/

window.carregarJogadoresDaCampanha =
    carregarJogadoresDaCampanha;


window.iniciarRealtimeMesa =
    iniciarRealtimeMesa;


window.pararRealtimeMesa =
    pararRealtimeMesa;


/* ============================================================
   DOM READY
============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(

        "DOMContentLoaded",

        inicializarMesa

    );

} else {

    inicializarMesa();

}
