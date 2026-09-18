/* ==========================================
   MESA ONLINE — RPG
   SISTEMA DE AVENTURA
   MAPA • DUNGEON • COMBATE • BOSS • EVENTOS • CTE
========================================== */

(() => {
    "use strict";


    /* ==========================================
       CONFIGURAÇÃO
    ========================================== */

    const AVENTURA_CONFIG = {

        maxJogadores: 8,

        tipos: {

            MAPA: "mapa",

            DUNGEON: "dungeon",

            COMBATE: "combate",

            BOSS: "boss",

            EVENTO: "evento"

        },

        batalha: {

            turnosPorPadrao: 1,

            vidaBossPadrao: 1000,

            vidaInimigoPadrao: 100

        }

    };


    /* ==========================================
       REFERÊNCIAS
    ========================================== */

    let MesaUI = {

        screen: null,

        screenContent: null

    };


    /* ==========================================
       INICIALIZAÇÃO
    ========================================== */

    function inicializar() {

        atualizarReferencias();


        document.addEventListener(
            "mesa:aventuraAberta",
            receberAventura
        );


        document.addEventListener(
            "mesa:batalhaIniciada",
            receberBatalha
        );


        document.addEventListener(
            "mesa:batalhaFinalizada",
            receberBatalhaFinalizada
        );


        document.addEventListener(
            "mesa:modoAlterado",
            receberMudancaModo
        );


        /*
         =====================================================
         CTE
         =====================================================
        */

        document.addEventListener(
            "mesa:cteIniciado",
            receberCTEIniciado
        );


        document.addEventListener(
            "mesa:cteFalhaGlobal",
            receberCTEFalhaGlobal
        );


        document.addEventListener(
            "mesa:cteResultadoJogador",
            receberCTEResultadoJogador
        );


        document.addEventListener(
            "mesa:cteTodosResultados",
            receberCTETodosResultados
        );


        document.addEventListener(
            "mesa:cteFinalizado",
            receberCTEFinalizado
        );


        window.addEventListener(
            "resize",
            atualizarReferencias
        );


        console.log(
            "🗺️ MesaAventura inicializada."
        );

    }


    function atualizarReferencias() {

        MesaUI.screen =
            document.getElementById(
                "mesa-screen"
            );


        MesaUI.screenContent =
            document.getElementById(
                "mesa-screen-content"
            );

    }


    /* ==========================================
       ESTADO DA MESA
    ========================================== */

    function obterEstado() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.estado ===
            "function"

        ) {

            return window.MesaRPG.estado();

        }

        return null;

    }


    /* ==========================================
       EVENTOS DA MESA
    ========================================== */

    function emitirEvento(
        nome,
        detalhes = {}
    ) {

        document.dispatchEvent(

            new CustomEvent(
                nome,
                {
                    detail: detalhes
                }
            )

        );

    }


    /* ==========================================
       AVENTURA
    ========================================== */

    function receberAventura(evento) {

        const dados =
            evento?.detail || {};

        const tipo =
            dados.tipo;

        if (!tipo) return;


        switch (tipo) {

            case AVENTURA_CONFIG.tipos.MAPA:

                renderizarMapa(
                    dados.dados || {}
                );

                break;


            case AVENTURA_CONFIG.tipos.DUNGEON:

                renderizarDungeon(
                    dados.dados || {}
                );

                break;


            case AVENTURA_CONFIG.tipos.BOSS:

                renderizarBoss(
                    obterEstado()
                );

                break;


            default:

                renderizarEvento(
                    dados
                );

                break;

        }

    }


    /* ==========================================
       MAPA
    ========================================== */

    function abrirMapa(
        dados = {}
    ) {

        const estado =
            obterEstado();


        if (estado) {

            estado.aventura =
                estado.aventura || {};

            estado.aventura.tipo =
                "mapa";

            estado.aventura.dados =
                dados;

        }


        renderizarMapa(
            dados
        );


        emitirEvento(
            "mesa:aventura:mapaAberto",
            {
                dados
            }
        );

    }


    function renderizarMapa(
        dados = {}
    ) {

        atualizarReferencias();


        if (
            !MesaUI.screen ||
            !MesaUI.screenContent
        ) {

            return;

        }


        const nome =
            dados.nome ||
            "Mapa da Aventura";


        const descricao =
            dados.descricao ||
            "O mapa da campanha será exibido aqui.";


        MesaUI.screen.classList.add(
            "aventura-ativa"
        );


        MesaUI.screenContent.innerHTML = `

            <section class="aventura-view mapa-view">

                <header class="aventura-header">

                    <div>

                        <span class="aventura-kicker">
                            🗺️ EXPLORAÇÃO
                        </span>

                        <h2>
                            ${escaparHTML(nome)}
                        </h2>

                        <p>
                            ${escaparHTML(descricao)}
                        </p>

                    </div>

                    <span class="aventura-status">
                        EXPLORAÇÃO
                    </span>

                </header>


                <div class="mapa-area">

                    <div class="mapa-placeholder">

                        <div class="mapa-compass">
                            🧭
                        </div>

                        <div class="mapa-title">
                            MAPA
                        </div>

                        <div class="mapa-subtitle">
                            Área de exploração
                        </div>


                        <div class="mapa-pontos">

                            <button
                                type="button"
                                class="mapa-ponto"
                                data-map-point="inicio"
                            >

                                <span>
                                    ●
                                </span>

                                <small>
                                    Início
                                </small>

                            </button>


                            <button
                                type="button"
                                class="mapa-ponto"
                                data-map-point="exploracao"
                            >

                                <span>
                                    ●
                                </span>

                                <small>
                                    Exploração
                                </small>

                            </button>


                            <button
                                type="button"
                                class="mapa-ponto"
                                data-map-point="objetivo"
                            >

                                <span>
                                    ●
                                </span>

                                <small>
                                    Objetivo
                                </small>

                            </button>

                        </div>

                    </div>

                </div>


                <footer class="aventura-footer">

                    <span>
                        👥 ${contarJogadoresAtivos()}
                        jogadores
                    </span>

                    <span>
                        Toque em um ponto do mapa para interagir.
                    </span>

                </footer>

            </section>

        `;


        configurarPontosMapa();

    }


    function configurarPontosMapa() {

        const pontos =
            document.querySelectorAll(
                "[data-map-point]"
            );


        pontos.forEach(
            ponto => {

                ponto.addEventListener(
                    "click",
                    () => {

                        const local =
                            ponto.dataset.mapPoint;

                        selecionarPontoMapa(
                            local
                        );

                    }
                );

            }
        );

    }


    function selecionarPontoMapa(
        local
    ) {

        const nomes = {

            inicio:
                "Ponto inicial",

            exploracao:
                "Área de exploração",

            objetivo:
                "Objetivo da aventura"

        };


        const nome =
            nomes[local] ||
            "Local desconhecido";


        mostrarNotificacaoAventura(
            `📍 ${nome}`
        );


        emitirEvento(
            "mesa:aventura:pontoSelecionado",
            {

                local,

                nome

            }
        );

    }


    /* ==========================================
       DUNGEON
    ========================================== */

    function abrirDungeon(
        dados = {}
    ) {

        const estado =
            obterEstado();


        if (estado) {

            estado.aventura =
                estado.aventura || {};

            estado.aventura.tipo =
                "dungeon";

            estado.aventura.dados =
                dados;

        }


        renderizarDungeon(
            dados
        );


        emitirEvento(
            "mesa:aventura:dungeonAberta",
            {
                dados
            }
        );

    }


    function renderizarDungeon(
        dados = {}
    ) {

        atualizarReferencias();


        if (
            !MesaUI.screen ||
            !MesaUI.screenContent
        ) {

            return;

        }


        const nome =
            dados.nome ||
            "Dungeon";


        const sala =
            dados.sala ||
            1;


        const descricao =
            dados.descricao ||
            "Uma nova área da dungeon aguarda os jogadores.";


        MesaUI.screen.classList.add(
            "aventura-ativa"
        );


        MesaUI.screenContent.innerHTML = `

            <section class="aventura-view dungeon-view">

                <header class="aventura-header">

                    <div>

                        <span class="aventura-kicker">
                            🏰 DUNGEON
                        </span>

                        <h2>
                            ${escaparHTML(nome)}
                        </h2>

                        <p>
                            ${escaparHTML(descricao)}
                        </p>

                    </div>

                    <span class="aventura-status">
                        SALA ${sala}
                    </span>

                </header>


                <div class="dungeon-area">

                    <div class="dungeon-room">

                        <div class="dungeon-door door-north">
                            ▲
                        </div>

                        <div class="dungeon-door door-west">
                            ◀
                        </div>


                        <div class="dungeon-center">

                            <span class="room-icon">
                                🏰
                            </span>

                            <strong>
                                Sala ${sala}
                            </strong>

                            <small>
                                Área desconhecida
                            </small>

                        </div>


                        <div class="dungeon-door door-east">
                            ▶
                        </div>

                        <div class="dungeon-door door-south">
                            ▼
                        </div>

                    </div>

                </div>


                <div class="dungeon-actions">

                    <button
                        type="button"
                        data-dungeon-action="explorar"
                    >
                        🔎 Explorar
                    </button>


                    <button
                        type="button"
                        data-dungeon-action="avancar"
                    >
                        🚪 Avançar
                    </button>


                    <button
                        type="button"
                        data-dungeon-action="voltar"
                    >
                        ↩️ Voltar
                    </button>

                </div>

            </section>

        `;


        configurarAcoesDungeon();

    }


    function configurarAcoesDungeon() {

        const botoes =
            document.querySelectorAll(
                "[data-dungeon-action]"
            );


        botoes.forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        executarAcaoDungeon(
                            botao.dataset.dungeonAction
                        );

                    }
                );

            }
        );

    }


    function executarAcaoDungeon(
        acao
    ) {

        const estado =
            obterEstado();


        if (!estado) return;


        switch (acao) {

            case "explorar":

                emitirEvento(
                    "mesa:aventura:dungeonExplorada",
                    {

                        sala:
                            estado.aventura?.dados?.sala ||
                            1

                    }
                );


                mostrarNotificacaoAventura(
                    "🔎 Os jogadores estão explorando a sala..."
                );

                break;


            case "avancar":

                avancarSalaDungeon();

                break;


            case "voltar":

                voltarSalaDungeon();

                break;

        }

    }


    function avancarSalaDungeon() {

        const estado =
            obterEstado();


        if (!estado) return;


        estado.aventura =
            estado.aventura || {};


        estado.aventura.dados =
            estado.aventura.dados || {};


        const salaAtual =
            Number(
                estado.aventura.dados.sala ||
                1
            );


        estado.aventura.dados.sala =
            salaAtual + 1;


        renderizarDungeon(
            estado.aventura.dados
        );


        emitirEvento(
            "mesa:aventura:dungeonAvancou",
            {

                sala:
                    estado.aventura.dados.sala

            }
        );

    }


    function voltarSalaDungeon() {

        const estado =
            obterEstado();


        if (!estado) return;


        estado.aventura =
            estado.aventura || {};


        estado.aventura.dados =
            estado.aventura.dados || {};


        const salaAtual =
            Number(
                estado.aventura.dados.sala ||
                1
            );


        estado.aventura.dados.sala =
            Math.max(
                1,
                salaAtual - 1
            );


        renderizarDungeon(
            estado.aventura.dados
        );


        emitirEvento(
            "mesa:aventura:dungeonVoltou",
            {

                sala:
                    estado.aventura.dados.sala

            }
        );

    }


    /* ==========================================
       COMBATE
    ========================================== */

    function receberBatalha(
        evento
    ) {

        const estado =
            evento?.detail?.estado ||
            obterEstado();


        if (!estado) return;


        inicializarBatalha(
            estado
        );

    }


    function inicializarBatalha(
        estado
    ) {

        atualizarReferencias();


        if (!MesaUI.screen) return;


        const batalha =
            estado.batalha || {};


        const dados =
            batalha.dados || {};


        const tipo =
            dados.tipo ||
            "normal";


        if (tipo === "boss") {

            renderizarBoss(
                estado
            );

            return;

        }


        renderizarCombate(
            estado
        );


        emitirEvento(
            "mesa:aventura:combatePronto",
            {

                batalha

            }
        );

    }


    function renderizarCombate(
        estado
    ) {

        atualizarReferencias();


        if (
            !MesaUI.screen ||
            !MesaUI.screenContent
        ) {

            return;

        }


        const batalha =
            estado.batalha || {};


        const dados =
            batalha.dados || {};


        const inimigo =
            dados.inimigo ||
            "Inimigo";


        const vida =
            Number(
                dados.vida ??
                AVENTURA_CONFIG.batalha.vidaInimigoPadrao
            );


        const vidaMax =
            Number(
                dados.vidaMax ??
                vida
            );


        const turno =
            batalha.turno ||
            1;


        MesaUI.screen.classList.add(
            "aventura-ativa",
            "combate-ativo"
        );


        MesaUI.screenContent.innerHTML = `

            <section class="aventura-view combate-view">

                <header class="aventura-header">

                    <div>

                        <span class="aventura-kicker">
                            ⚔️ COMBATE
                        </span>

                        <h2>
                            Batalha em andamento
                        </h2>

                        <p>
                            Turno ${turno}
                        </p>

                    </div>


                    <span class="aventura-status">
                        ${
                            batalha.ativa
                                ? "ATIVO"
                                : "ENCERRADO"
                        }
                    </span>

                </header>


                <div class="combate-arena">

                    <div class="combate-lado grupo">

                        <span class="combate-icone">
                            👥
                        </span>

                        <strong>
                            Grupo
                        </strong>

                        <small>
                            ${contarJogadoresAtivos()}
                            jogadores
                        </small>

                    </div>


                    <div class="combate-versus">
                        VS
                    </div>


                    <div class="combate-lado inimigo">

                        <span class="combate-icone">
                            👹
                        </span>

                        <strong>
                            ${escaparHTML(inimigo)}
                        </strong>


                        <div class="inimigo-hp">

                            <div class="hp-texto">
                                ❤️ ${vida}/${vidaMax}
                            </div>


                            <div class="hp-track">

                                <span
                                    style="width:${calcularPorcentagem(
                                        vida,
                                        vidaMax
                                    )}%"
                                ></span>

                            </div>

                        </div>

                    </div>

                </div>


                <div class="combate-info">

                    <div>
                        <span>⚔️</span>
                        Combate ativo
                    </div>

                    <div>
                        <span>🎲</span>
                        Aguardando ação dos jogadores
                    </div>

                </div>

            </section>

        `;

    }


    function restaurarBatalha(
        estado
    ) {

        atualizarReferencias();


        if (!MesaUI.screen) return;


        MesaUI.screen.classList.remove(
            "combate-ativo",
            "boss-ativo"
        );


        if (

            estado &&

            (
                estado.modoAtual === "aventura" ||
                estado.modo === "aventura" ||
                estado.modo === "AVENTURA"
            )

        ) {

            renderizarTelaAventuraAtual(
                estado
            );

            return;

        }


        renderizarTelaNormal();

    }


    function receberBatalhaFinalizada(
        evento
    ) {

        const estado =
            evento?.detail?.estado ||
            obterEstado();


        if (!estado) return;


        mostrarResultadoCombate(
            estado,
            evento?.detail || {}
        );

    }


    function mostrarResultadoCombate(
        estado,
        resultado = {}
    ) {

        atualizarReferencias();


        if (
            !MesaUI.screen ||
            !MesaUI.screenContent
        ) {

            return;

        }


        const venceu =
            resultado.vitoria ??
            resultado.sucesso ??
            true;


        MesaUI.screenContent.innerHTML = `

            <section class="aventura-view resultado-view">

                <div class="resultado-icon">
                    ${venceu ? "🏆" : "💀"}
                </div>


                <span class="aventura-kicker">
                    COMBATE FINALIZADO
                </span>


                <h2>
                    ${
                        venceu
                            ? "Vitória!"
                            : "Derrota"
                    }
                </h2>


                <p>
                    ${
                        venceu
                            ? "O grupo superou o desafio."
                            : "O grupo não conseguiu superar o desafio."
                    }
                </p>


                <button
                    type="button"
                    id="btn-continuar-aventura"
                >
                    ▶️ Continuar
                </button>

            </section>

        `;


        const botao =
            document.getElementById(
                "btn-continuar-aventura"
            );


        if (botao) {

            botao.addEventListener(
                "click",
                () => {

                    renderizarTelaAventuraAtual(
                        estado
                    );

                }
            );

        }

    }


    /* ==========================================
       BOSS
    ========================================== */

    function abrirBoss(
        dados = {}
    ) {

        const estado =
            obterEstado();


        if (!estado) return;


        estado.batalha =
            estado.batalha || {};


        estado.batalha.dados = {

            tipo:
                "boss",

            ...dados

        };


        estado.batalha.ativa =
            true;


        estado.batalha.turno =
            1;


        estado.aventura =
            estado.aventura || {};


        estado.aventura.tipo =
            "boss";


        estado.aventura.dados =
            dados;


        renderizarBoss(
            estado
        );


        emitirEvento(
            "mesa:aventura:bossAberto",
            {
                dados
            }
        );

    }


    function renderizarBoss(
        estado
    ) {

        atualizarReferencias();


        if (
            !MesaUI.screen ||
            !MesaUI.screenContent
        ) {

            return;

        }


        if (!estado) {

            estado =
                obterEstado();

        }


        if (!estado) return;


        const batalha =
            estado.batalha || {};


        const dados =
            batalha.dados || {};


        const nome =
            dados.nome ||
            dados.boss ||
            "Boss";


        const vida =
            Number(
                dados.vida ??
                AVENTURA_CONFIG.batalha.vidaBossPadrao
            );


        const vidaMax =
            Number(
                dados.vidaMax ??
                AVENTURA_CONFIG.batalha.vidaBossPadrao
            );


        const turno =
            batalha.turno ||
            1;


        MesaUI.screen.classList.add(
            "aventura-ativa",
            "combate-ativo",
            "boss-ativo"
        );


        MesaUI.screenContent.innerHTML = `

            <section class="aventura-view boss-view">

                <header class="aventura-header boss-header">

                    <div>

                        <span class="aventura-kicker">
                            👹 BOSS
                        </span>


                        <h2>
                            ${escaparHTML(nome)}
                        </h2>


                        <p>
                            ⚔️ Turno ${turno}
                        </p>

                    </div>


                    <span class="aventura-status boss-status">

                        ${
                            batalha.ativa
                                ? "ATIVO"
                                : "DERROTADO"
                        }

                    </span>

                </header>


                <div class="boss-arena">

                    <div class="boss-symbol">
                        👹
                    </div>


                    <h3>
                        ${escaparHTML(nome)}
                    </h3>


                    <div class="boss-hp">

                        <div class="boss-hp-values">

                            <span>
                                ❤️ Vida
                            </span>

                            <strong>
                                ${vida}/${vidaMax}
                            </strong>

                        </div>


                        <div class="boss-hp-track">

                            <span
                                style="width:${calcularPorcentagem(
                                    vida,
                                    vidaMax
                                )}%"
                            ></span>

                        </div>

                    </div>

                </div>


                <div class="boss-party">

                    <div class="boss-party-title">
                        👥 Grupo
                    </div>


                    <div class="boss-players">

                        ${renderizarMiniJogadores(
                            estado
                        )}

                    </div>

                </div>


                <div class="boss-turno">
                    🎲 Aguardando ação do grupo...
                </div>

            </section>

        `;

    }


    function renderizarMiniJogadores(
        estado
    ) {

        const jogadores =
            estado.jogadores || [];


        return jogadores

            .slice(
                0,
                AVENTURA_CONFIG.maxJogadores
            )

            .map(
                (jogador, indice) => {

                    if (!jogador) {

                        return "";

                    }


                    const nome =
                        jogador.nome ||
                        `Player ${indice + 1}`;


                    const hp =
                        Number(
                            jogador.hp ??
                            jogador.vida ??
                            0
                        );


                    const hpMax =
                        Number(
                            jogador.hpMax ??
                            jogador.vidaMax ??
                            100
                        );


                    return `

                        <div
                            class="boss-player-mini"
                            data-player="${indice + 1}"
                        >

                            <span class="mini-avatar">
                                👤
                            </span>


                            <span class="mini-name">
                                ${escaparHTML(nome)}
                            </span>


                            <span class="mini-hp">
                                ❤️ ${hp}/${hpMax}
                            </span>

                        </div>

                    `;

                }
            )

            .join("");

    }


    /* ==========================================
       EVENTOS DA AVENTURA
    ========================================== */

    function abrirEvento(
        dados = {}
    ) {

        const estado =
            obterEstado();


        if (estado) {

            estado.aventura =
                estado.aventura || {};


            estado.aventura.tipo =
                "evento";


            estado.aventura.dados =
                dados;

        }


        renderizarEvento(
            dados
        );


        emitirEvento(
            "mesa:aventura:eventoAberto",
            {
                dados
            }
        );

    }


    function renderizarEvento(
        dados = {}
    ) {

        atualizarReferencias();


        if (
            !MesaUI.screen ||
            !MesaUI.screenContent
        ) {

            return;

        }


        const titulo =
            dados.titulo ||
            "Evento";


        const descricao =
            dados.descricao ||
            "Algo acontece durante a aventura.";


        const icone =
            dados.icone ||
            "✨";


        MesaUI.screenContent.innerHTML = `

            <section class="aventura-view evento-view">

                <div class="evento-icon">
                    ${icone}
                </div>


                <span class="aventura-kicker">
                    EVENTO DA AVENTURA
                </span>


                <h2>
                    ${escaparHTML(titulo)}
                </h2>


                <p class="evento-descricao">
                    ${escaparHTML(descricao)}
                </p>


                <div class="evento-acoes">

                    ${
                        dados.acao

                            ? `

                                <button
                                    type="button"
                                    id="btn-evento-acao"
                                >

                                    ${escaparHTML(
                                        dados.acao
                                    )}

                                </button>

                              `

                            : ""
                    }


                    <button
                        type="button"
                        id="btn-evento-continuar"
                    >
                        ▶️ Continuar
                    </button>

                </div>

            </section>

        `;


        const acao =
            document.getElementById(
                "btn-evento-acao"
            );


        if (acao) {

            acao.addEventListener(
                "click",
                () => {

                    emitirEvento(
                        "mesa:aventura:eventoAcao",
                        {
                            dados
                        }
                    );


                    mostrarNotificacaoAventura(
                        "✨ Ação do evento executada."
                    );

                }
            );

        }


        const continuar =
            document.getElementById(
                "btn-evento-continuar"
            );


        if (continuar) {

            continuar.addEventListener(
                "click",
                () => {

                    const estado =
                        obterEstado();


                    if (estado) {

                        renderizarTelaAventuraAtual(
                            estado
                        );

                    }

                }
            );

        }

    }


    /* =========================================================
       CTE
    =========================================================

       O CTE é um desafio INDIVIDUAL por jogador.

       O mesa.js determina:

       - todos
       - um jogador
       - vários jogadores
       - dificuldade
       - duração
       - quantidade
       - falhaGlobal

       Este arquivo cuida da apresentação na tela.

       REGRA:

       Se o slot atual estiver em "alvos":
       → recebe o CTE.

       Se não estiver:
       → não recebe o CTE.

       Se houver falhaGlobal:
       → uma falha pode ser anunciada para todos.
    */


    /* ==========================================
       RECEBER CTE INICIADO
    ========================================== */

    function receberCTEIniciado(
        evento
    ) {

        const dados =
            evento?.detail || {};


        const estado =
            dados.estado ||
            obterEstado();


        /*
         O evento pode chegar antes do estado
         local estar completamente disponível.
        */

        if (!dados.id) {

            return;

        }


        /*
         Se não houver alvo local,
         não mostra o desafio.
        */

        if (
            !jogadorAtualEhAlvoCTE(
                dados.alvos,
                estado
            )
        ) {

            /*
             Mestre pode acompanhar o início,
             mas não recebe o desafio como jogador.
            */

            if (
                !ehMestreLocal()
            ) {

                return;

            }


            /*
             O Mestre recebe apenas uma
             notificação discreta.
            */

            mostrarNotificacaoAventura(
                `⚡ CTE iniciado para ${contarAlvosCTE(
                    dados.alvos
                )} jogador(es).`
            );

            return;

        }


        /*
         Cria o desafio somente
         na tela do jogador-alvo.
        */

        criarOverlayCTE(
            dados
        );

    }


    /* ==========================================
       VERIFICAR SE JOGADOR É ALVO
    ========================================== */

    function jogadorAtualEhAlvoCTE(
        alvos,
        estado = null
    ) {

        if (!Array.isArray(alvos)) {

            return false;

        }


        if (!estado) {

            estado =
                obterEstado();

        }


        if (!estado) {

            return false;

        }


        const jogadorAtual =
            estado.jogadorAtual || {};


        const slot =
            Number(
                jogadorAtual.slot
            );


        if (
            !Number.isInteger(slot) ||
            slot < 1 ||
            slot > AVENTURA_CONFIG.maxJogadores
        ) {

            return false;

        }


        return alvos
            .map(
                item => Number(item)
            )
            .includes(slot);

    }


    /* ==========================================
       IDENTIFICAR MESTRE
    ========================================== */

    function ehMestreLocal() {

        const estado =
            obterEstado();


        if (!estado) {

            return false;

        }


        return estado.usuario?.isMaster === true;

    }


    /* ==========================================
       CONTAR ALVOS
    ========================================== */

    function contarAlvosCTE(
        alvos
    ) {

        if (!Array.isArray(alvos)) {

            return 0;

        }


        return alvos.length;

    }


    /* ==========================================
       CRIAR OVERLAY CTE
    ========================================== */

    function criarOverlayCTE(
        dados = {}
    ) {

        atualizarReferencias();


        if (!MesaUI.screen) {

            return;

        }


        /*
         Remove somente o overlay
         anterior.
        */

        const anterior =
            document.getElementById(
                "cte-overlay"
            );


        if (anterior) {

            anterior.remove();

        }


        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "cte-overlay";


        overlay.className =
            "cte-overlay";


        overlay.dataset.cteId =
            dados.id ||
            obterIdCTEAtual();


        overlay.innerHTML = `

            <div class="cte-panel">

                <div class="cte-header">

                    <span class="cte-icon">
                        ⚡
                    </span>

                    <h2>
                        CTE
                    </h2>

                </div>


                <p class="cte-instruction">
                    ${
                        dados.dificuldade
                            ? `Dificuldade: ${escaparHTML(
                                dados.dificuldade
                            )}`
                            : "Prepare-se..."
                    }
                </p>


                <div class="cte-timer">

                    <span id="cte-timer-value">
                        0
                    </span>

                </div>


                <div class="cte-progress">

                    <div
                        id="cte-progress-bar"
                        class="cte-progress-bar"
                    ></div>

                </div>


                <div
                    class="cte-status"
                    id="cte-player-status"
                >
                    ⚡ Desafio em andamento
                </div>

            </div>

        `;


        /*
         O overlay fica dentro da tela
         sem destruir o conteúdo da aventura.
        */

        MesaUI.screen.appendChild(
            overlay
        );


        executarContagemCTE(
            overlay,
            dados
        );

    }


    /* ==========================================
       OBTER ID DO CTE ATUAL
    ========================================== */

    function obterIdCTEAtual() {

        const estado =
            obterEstado();


        return estado?.cte?.id ||
            `cte-local-${Date.now()}`;

    }


    /* ==========================================
       CONTAGEM DO CTE
    ========================================== */

    function executarContagemCTE(
        overlay,
        dados = {}
    ) {

        if (!overlay) {

            return;

        }


        const timer =
            overlay.querySelector(
                "#cte-timer-value"
            );


        const progress =
            overlay.querySelector(
                "#cte-progress-bar"
            );


        const status =
            overlay.querySelector(
                "#cte-player-status"
            );


        const estado =
            obterEstado();


        const duracao =
            Number(
                dados.duracao ??
                estado?.cte?.duracao ??
                2000
            );


        const inicio =
            Date.now();


        let frameId =
            null;


        function atualizar() {

            /*
             O overlay pode ter sido removido
             manualmente.
            */

            if (!document.body.contains(overlay)) {

                if (frameId !== null) {

                    cancelAnimationFrame(
                        frameId
                    );

                }

                return;

            }


            const decorrido =
                Date.now() -
                inicio;


            const restante =
                Math.max(
                    0,
                    duracao -
                    decorrido
                );


            const percentual =
                Math.min(
                    100,
                    (
                        decorrido /
                        duracao
                    ) * 100
                );


            if (timer) {

                timer.textContent =
                    (
                        restante /
                        1000
                    ).toFixed(1);

            }


            if (progress) {

                progress.style.width =
                    `${percentual}%`;

            }


            if (
                restante <= 0
            ) {

                finalizarTempoCTEVisual(
                    overlay,
                    status
                );

                return;

            }


            frameId =
                requestAnimationFrame(
                    atualizar
                );

        }


        atualizar();

    }


    /* ==========================================
       FINALIZAR TEMPO VISUAL
    ========================================== */

    function finalizarTempoCTEVisual(
        overlay,
        status
    ) {

        if (!overlay) {

            return;

        }


        if (status) {

            status.textContent =
                "🎯 Tempo encerrado. Aguarde o resultado.";

        }


        /*
         IMPORTANTE:

         O tempo terminar NÃO inventa
         sucesso nem falha.

         O resultado precisa ser registrado
         pelo sistema do CTE.
        */

        overlay.classList.add(
            "cte-finalizado"
        );


        emitirEvento(
            "mesa:aventura:cteTempoEncerrado",
            {

                id:
                    overlay.dataset.cteId

            }
        );

    }


    /* ==========================================
       REGISTRAR RESULTADO DO JOGADOR
    ========================================== */

    function registrarResultadoCTE(
        sucesso,
        opcoes = {}
    ) {

        const estado =
            obterEstado();


        if (!estado) {

            return false;

        }


        const slot =
            Number(
                opcoes.slot ??
                estado.jogadorAtual?.slot
            );


        if (
            !Number.isInteger(slot) ||
            slot < 1 ||
            slot > AVENTURA_CONFIG.maxJogadores
        ) {

            console.warn(
                "[MesaAventura] Slot inválido para resultado do CTE:",
                slot
            );

            return false;

        }


        const resultado =
            encontrarResultadoCTE(
                estado,
                slot
            );


        if (!resultado) {

            console.warn(
                "[MesaAventura] Nenhum resultado de CTE encontrado para o jogador:",
                slot
            );

            return false;

        }


        /*
         Evita registrar duas vezes.
        */

        if (resultado.concluido) {

            return false;

        }


        const valorSucesso =
            Boolean(
                sucesso
            );


        resultado.concluido =
            true;


        resultado.sucesso =
            valorSucesso;


        resultado.falhou =
            !valorSucesso;


        if (
            opcoes.acertos !== undefined
        ) {

            resultado.acertos =
                Number(
                    opcoes.acertos
                ) || 0;

        }


        /*
         Atualiza visual local.
        */

        atualizarResultadoVisualCTE(
            slot,
            valorSucesso
        );


        /*
         Evento individual.
        */

        emitirEvento(
            "mesa:aventura:cteResultadoRegistrado",
            {

                slot,

                sucesso:
                    valorSucesso,

                resultado,

                estado

            }
        );


        /*
         Também utiliza o mecanismo
         central do mesa.js, se disponível.
        */

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.registrarResultadoCTE ===
            "function"

        ) {

            window.MesaRPG.registrarResultadoCTE(
                slot,
                valorSucesso
            );

        }


        return true;

    }


    /* ==========================================
       ENCONTRAR RESULTADO CTE
    ========================================== */

    function encontrarResultadoCTE(
        estado,
        slot
    ) {

        const resultados =
            estado?.cte?.resultados;


        if (
            !Array.isArray(resultados)
        ) {

            return null;

        }


        return resultados.find(
            resultado =>
                Number(resultado.slot) ===
                Number(slot)
        ) || null;

    }


    /* ==========================================
       ATUALIZAR RESULTADO VISUAL
    ========================================== */

    function atualizarResultadoVisualCTE(
        slot,
        sucesso
    ) {

        const overlay =
            document.getElementById(
                "cte-overlay"
            );


        if (!overlay) {

            return;

        }


        const status =
            overlay.querySelector(
                "#cte-player-status"
            );


        if (status) {

            status.textContent =
                sucesso
                    ? "✅ CTE concluído com sucesso!"
                    : "❌ CTE falhou.";

        }


        overlay.classList.remove(
            "cte-sucesso",
            "cte-falha"
        );


        overlay.classList.add(
            sucesso
                ? "cte-sucesso"
                : "cte-falha"
        );


        /*
         Após mostrar o resultado,
         retiramos o overlay depois de um
         pequeno intervalo.
        */

        setTimeout(
            () => {

                if (
                    overlay &&
                    overlay.parentNode
                ) {

                    overlay.remove();

                }

            },
            1400
        );


        emitirEvento(
            "mesa:aventura:cteVisualFinalizado",
            {

                slot,

                sucesso

            }
        );

    }


    /* ==========================================
       RECEBER FALHA GLOBAL
    ========================================== */

    function receberCTEFalhaGlobal(
        evento
    ) {

        const dados =
            evento?.detail || {};


        const slot =
            Number(
                dados.slot
            );


        /*
         A falha é global.

         Portanto TODOS recebem
         a notificação.
        */

        const nome =
            obterNomeJogadorPorSlot(
                slot
            );


        mostrarNotificacaoCTEGlobal(
            `🚨 ${nome} falhou no CTE!`
        );


        emitirEvento(
            "mesa:aventura:cteFalhaExibida",
            {

                slot,

                nome

            }
        );

    }


    /* ==========================================
       RECEBER RESULTADO INDIVIDUAL
    ========================================== */

    function receberCTEResultadoJogador(
        evento
    ) {

        const dados =
            evento?.detail || {};


        const slot =
            Number(
                dados.slot
            );


        if (!slot) {

            return;

        }


        /*
         Somente o próprio jogador
         recebe o resultado visual individual.

         A falha global é tratada
         separadamente.
        */

        const estado =
            obterEstado();


        if (
            !jogadorAtualEhSlot(
                slot,
                estado
            )
        ) {

            return;

        }


        if (
            dados.sucesso === true
        ) {

            atualizarResultadoVisualCTE(
                slot,
                true
            );

        }

    }


    /* ==========================================
       RECEBER TODOS OS RESULTADOS
    ========================================== */

    function receberCTETodosResultados(
        evento
    ) {

        const dados =
            evento?.detail || {};


        /*
         O resultado global pode ser
         apenas informativo.

         A falha individual já foi
         anunciada pelo evento específico.
        */

        if (dados.houveFalha) {

            mostrarNotificacaoAventura(
                "⚠️ O CTE foi concluído com uma ou mais falhas."
            );

        } else {

            mostrarNotificacaoAventura(
                "✨ Todos os resultados do CTE foram concluídos."
            );

        }

    }


    /* ==========================================
       RECEBER FINALIZAÇÃO
    ========================================== */

    function receberCTEFinalizado() {

        const overlay =
            document.getElementById(
                "cte-overlay"
            );


        if (overlay) {

            overlay.remove();

        }

    }


    /* ==========================================
       VERIFICAR SLOT
    ========================================== */

    function jogadorAtualEhSlot(
        slot,
        estado = null
    ) {

        if (!estado) {

            estado =
                obterEstado();

        }


        if (!estado) {

            return false;

        }


        return Number(
            estado.jogadorAtual?.slot
        ) ===
        Number(slot);

    }


    /* ==========================================
       NOME DO JOGADOR
    ========================================== */

    function obterNomeJogadorPorSlot(
        slot
    ) {

        const estado =
            obterEstado();


        const jogador =
            estado?.jogadores?.[
                Number(slot) - 1
            ];


        if (
            jogador &&
            jogador.nome
        ) {

            return jogador.nome;

        }


        return `Player ${slot}`;

    }


    /* ==========================================
       NOTIFICAÇÃO GLOBAL DO CTE
    ========================================== */

    function mostrarNotificacaoCTEGlobal(
        mensagem
    ) {

        let notificacao =
            document.getElementById(
                "mesa-cte-global-notificacao"
            );


        if (!notificacao) {

            notificacao =
                document.createElement(
                    "div"
                );


            notificacao.id =
                "mesa-cte-global-notificacao";


            notificacao.className =
                "mesa-aventura-notificacao mesa-cte-global-notificacao";


            document.body.appendChild(
                notificacao
            );

        }


        notificacao.textContent =
            mensagem;


        notificacao.classList.add(
            "visivel"
        );


        clearTimeout(
            notificacao._timer
        );


        notificacao._timer =
            setTimeout(
                () => {

                    notificacao.classList.remove(
                        "visivel"
                    );

                },
                4000
            );

    }


    /* ==========================================
       TELA ATUAL DA AVENTURA
    ========================================== */

    function renderizarTelaAventuraAtual(
        estado
    ) {

        if (!estado) return;


        const aventura =
            estado.aventura || {};


        switch (
            aventura.tipo
        ) {

            case "mapa":

                renderizarMapa(
                    aventura.dados || {}
                );

                break;


            case "dungeon":

                renderizarDungeon(
                    aventura.dados || {}
                );

                break;


            case "boss":

                renderizarBoss(
                    estado
                );

                break;


            case "evento":

                renderizarEvento(
                    aventura.dados || {}
                );

                break;


            default:

                renderizarTelaNormal();

                break;

        }

    }


    function renderizarTelaNormal() {

        atualizarReferencias();


        if (
            !MesaUI.screenContent
        ) {

            return;

        }


        MesaUI.screenContent.innerHTML = `

            <h2>
                🎲 Mesa de RPG
            </h2>

            <p>
                Aguardando o início da aventura...
            </p>

        `;


        if (MesaUI.screen) {

            MesaUI.screen.classList.remove(
                "aventura-ativa",
                "combate-ativo",
                "boss-ativo"
            );

        }

    }


    /* ==========================================
       MUDANÇA DE MODO
    ========================================== */

    function receberMudancaModo(
        evento
    ) {

        const modo =
            evento?.detail?.modo;


        if (!modo) return;


        const estado =
            obterEstado();


        if (!estado) return;


        /*
         mesa.js usa:

         "normal"
         "aventura"
         "batalha"

         Mantemos compatibilidade com
         versões antigas em maiúsculo.
        */

        if (
            modo === "aventura" ||
            modo === "AVENTURA"
        ) {

            renderizarTelaAventuraAtual(
                estado
            );

        }

    }


    /* ==========================================
       NOTIFICAÇÃO
    ========================================== */

    function mostrarNotificacaoAventura(
        mensagem
    ) {

        let notificacao =
            document.getElementById(
                "mesa-aventura-notificacao"
            );


        if (!notificacao) {

            notificacao =
                document.createElement(
                    "div"
                );


            notificacao.id =
                "mesa-aventura-notificacao";


            notificacao.className =
                "mesa-aventura-notificacao";


            document.body.appendChild(
                notificacao
            );

        }


        notificacao.textContent =
            mensagem;


        notificacao.classList.add(
            "visivel"
        );


        clearTimeout(
            notificacao._timer
        );


        notificacao._timer =
            setTimeout(
                () => {

                    notificacao.classList.remove(
                        "visivel"
                    );

                },
                2200
            );

    }


    /* ==========================================
       JOGADORES
    ========================================== */

    function contarJogadoresAtivos() {

        const estado =
            obterEstado();


        if (!estado) return 0;


        const jogadores =
            estado.jogadores || [];


        return jogadores.filter(
            jogador =>
                jogador &&
                (
                    jogador.conectado !== false ||
                    jogador.nome
                )
        ).length;

    }


    /* ==========================================
       UTILITÁRIOS
    ========================================== */

    function calcularPorcentagem(
        atual,
        maximo
    ) {

        const valorAtual =
            Number(atual) || 0;


        const valorMaximo =
            Number(maximo) || 1;


        return Math.min(

            100,

            Math.max(

                0,

                (
                    valorAtual /
                    valorMaximo
                ) * 100

            )

        );

    }


    function escaparHTML(
        valor
    ) {

        return String(
            valor ?? ""
        )

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* ==========================================
       API PÚBLICA
    ========================================== */

    window.MesaAventura = {

        /* ======================================
           MAPA
        ====================================== */

        mapa: {

            abrir:
                abrirMapa,

            renderizar:
                renderizarMapa,

            selecionarPonto:
                selecionarPontoMapa

        },


        /* ======================================
           DUNGEON
        ====================================== */

        dungeon: {

            abrir:
                abrirDungeon,

            renderizar:
                renderizarDungeon,

            explorar:
                () =>
                    executarAcaoDungeon(
                        "explorar"
                    ),

            avancar:
                avancarSalaDungeon,

            voltar:
                voltarSalaDungeon

        },


        /* ======================================
           COMBATE
        ====================================== */

        combate: {

            iniciar:
                inicializarBatalha,

            renderizar:
                renderizarCombate,

            restaurar:
                restaurarBatalha,

            resultado:
                mostrarResultadoCombate

        },


        /* ======================================
           BOSS
        ====================================== */

        boss: {

            abrir:
                abrirBoss,

            renderizar:
                renderizarBoss

        },


        /* ======================================
           EVENTOS
        ====================================== */

        eventos: {

            abrir:
                abrirEvento,

            renderizar:
                renderizarEvento

        },


        /* ======================================
           CTE
        ====================================== */

        cte: {

            registrarResultado:
                registrarResultadoCTE,

            mostrar:
                criarOverlayCTE,

            remover:
                () => {

                    const overlay =
                        document.getElementById(
                            "cte-overlay"
                        );

                    if (overlay) {

                        overlay.remove();

                    }

                }

        },


        /* ======================================
           GERAL
        ====================================== */

        atualizar:
            renderizarTelaAventuraAtual,

        notificacao:
            mostrarNotificacaoAventura

    };


    /* ==========================================
       COMPATIBILIDADE COM MESA.JS
    ========================================== */

    window.inicializarMesaBatalha =
        inicializarBatalha;


    window.restaurarMesaBatalha =
        restaurarBatalha;


    window.restaurarMesaAventura =
        renderizarTelaAventuraAtual;


    /*
     =====================================================
     CTE — COMPATIBILIDADE
     =====================================================
    */

    window.registrarResultadoMesaCTE =
        registrarResultadoCTE;


    /* ==========================================
       START
    ========================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar,
            {
                once: true
            }
        );

    } else {

        inicializar();

    }

})();
