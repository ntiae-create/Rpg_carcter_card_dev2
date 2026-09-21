"use strict";

/*
==============================================================
 MESA RPG ONLINE - CORE (versão corrigida)
==============================================================
*/

const MESA_CONFIG = {
    maxJogadores: 8,
    modos: {
        NORMAL: "normal",
        AVENTURA: "aventura",
        BATALHA: "batalha"
    },
    cte: {
        disponivel: true,
        tempoPadrao: 1000,
        quantidadePadrao: 1
    }
};

const mesaState = {
    inicializado: false,
    modoAtual: MESA_CONFIG.modos.NORMAL,
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
    jogadores: Array.from({ length: MESA_CONFIG.maxJogadores }, (_, i) => ({
        slot: i + 1,
        ocupado: false,
        characterId: null,
        userId: null
    })),
    aventura: {
        aberta: false,
        tipo: null,
        dados: null
    },
    batalha: {
        ativa: false,
        rodada: 0,
        turno: null,
        participantes: []
    },
    cte: {
        ativo: false,
        tempo: MESA_CONFIG.cte.tempoPadrao,
        quantidade: MESA_CONFIG.cte.quantidadePadrao,
        cliques: 0,
        resultados: [],
        inicio: null
    }
};

let mesaRealtimeChannel = null;
let mesaRealtimeCampaignId = null;

const MesaUI = {
    container: null,
    layout: null,
    jogadores: null,
    screen: null,
    screenContent: null,
    nomeCampanha: null
};

/* ============================================================
   OBTER CLIENTE SUPABASE
============================================================ */
function obterSupabaseMesa() {
    if (window.SupabaseMesa && typeof window.SupabaseMesa.obterCliente === "function") {
        const cliente = window.SupabaseMesa.obterCliente();
        if (cliente && typeof cliente.from === "function") {
            return cliente;
        }
    }
    console.warn("[Mesa] SupabaseMesa não disponível.");
    return null;
}

/* ============================================================
   LOCALSTORAGE
============================================================ */
function obterMesaSalva() {
    try {
        const salvo = localStorage.getItem("rpg_mesa_ativa");
        if (!salvo) return null;
        const dados = JSON.parse(salvo);
        return dados?.campaignId ? dados : null;
    } catch (e) {
        console.warn("[Mesa] Erro ao ler localStorage:", e);
        return null;
    }
}

/* ============================================================
   INICIALIZAÇÃO PRINCIPAL
============================================================ */
function inicializarMesa() {
    if (mesaState.inicializado) return;

    MesaUI.container = document.getElementById("online-table-panel");
    MesaUI.layout = document.querySelector(".mesa-layout");
    MesaUI.jogadores = document.getElementById("jogadores");
    MesaUI.screen = document.getElementById("mesa-screen");
    MesaUI.screenContent = document.getElementById("mesa-screen-content");
    MesaUI.nomeCampanha = document.getElementById("nome-campanha");

    if (!MesaUI.container) {
        console.warn("[Mesa] #online-table-panel não encontrado.");
        return;
    }

    carregarContextoUsuario();
    registrarEventosGlobais();     // ← usa delegação de eventos
    atualizarCampanhaVisual();
    atualizarModoVisual();
    atualizarAssentos();

    mesaState.inicializado = true;

    // Aguarda um pouco para garantir que os outros módulos carregaram
    setTimeout(() => {
        sincronizarRealtimeCampanha();
        document.dispatchEvent(new CustomEvent("mesa:inicializada", {
            detail: mesaState
        }));
    }, 150);

    console.log("[Mesa] Inicializada com sucesso.");
}

/* ============================================================
   CONTEXTO DO USUÁRIO
============================================================ */
function carregarContextoUsuario() {
    const auth = window.rpgAuth || {};
    const salvo = obterMesaSalva();
    const campanha = obterCampanhaAtiva();

    mesaState.usuario.id = auth.user?.id || salvo?.userId || null;
    mesaState.usuario.nome = auth.user?.user_metadata?.name || auth.user?.email || salvo?.userName || "Jogador";
    mesaState.usuario.email = auth.user?.email || salvo?.userEmail || null;

    if (campanha) {
        mesaState.campanha.id = campanha.id || null;
        mesaState.campanha.nome = campanha.name || campanha.nome || "Campanha";
        mesaState.campanha.codigoMesa = campanha.codigo_mesa || campanha.codigoMesa || null;
        mesaState.campanha.masterId = campanha.master_id || campanha.masterId || null;
    }

    atualizarPermissaoUsuario();
    descobrirJogadorAtual();
}

function atualizarPermissaoUsuario() {
    const usuarioId = mesaState.usuario.id;
    const masterId = mesaState.campanha.masterId;

    const mestrePorCampanha = Boolean(
        usuarioId && masterId &&
        String(usuarioId).toLowerCase() === String(masterId).toLowerCase()
    );

    const mestrePorAuth = Boolean(window.rpgAuth?.isMaster === true);

    mesaState.usuario.isMaster = mestrePorCampanha || mestrePorAuth;
    mesaState.usuario.isPlayer = Boolean(usuarioId) && !mesaState.usuario.isMaster;

    if (window.rpgAuth) {
        window.rpgAuth.isMaster = mesaState.usuario.isMaster;
    }
}

function obterCampanhaAtiva() {
    if (window.rpgCampaign?.obterCampanhaAtiva) {
        try {
            return window.rpgCampaign.obterCampanhaAtiva();
        } catch (e) {}
    }
    if (window.rpgAuth?.campaign) return window.rpgAuth.campaign;

    const salvo = obterMesaSalva();
    if (salvo?.campaignId) {
        return {
            id: salvo.campaignId,
            name: salvo.campaignName || "Campanha",
            codigo_mesa: salvo.campaignCode || null,
            master_id: salvo.masterId || null
        };
    }
    return null;
}

function descobrirJogadorAtual() {
    const salvo = obterMesaSalva();
    if (salvo) {
        mesaState.jogadorAtual.characterId = salvo.characterId || null;
        mesaState.jogadorAtual.slot = Number(salvo.slot) || null;
    }

    if (!mesaState.jogadorAtual.characterId && window.rpgAuth) {
        const personagem = window.rpgAuth.currentCharacter || window.rpgAuth.campaignCharacter;
        if (personagem) {
            mesaState.jogadorAtual.characterId = personagem.id || null;
            mesaState.jogadorAtual.slot = Number(personagem.slot) || null;
        }
    }
}

/* ============================================================
   EVENTOS GLOBAIS (DELEGAÇÃO - NÃO PERDE OS CLIQUES)
============================================================ */
function registrarEventosGlobais() {
    // Clique nos cards de jogador (delegação)
    document.addEventListener("click", (e) => {
        const card = e.target.closest(".jogador-card, .player-card");
        if (card) {
            const slot = Number(card.dataset.player || card.dataset.seat);
            if (slot) selecionarJogador(slot);
            return;
        }

        // Botão de diagnóstico
        if (e.target.closest("#btn-diagnostico")) {
            document.dispatchEvent(new CustomEvent("mesa:abrirDiagnostico"));
            return;
        }

        // Botão de configurações
        if (e.target.closest("#btn-configuracoes")) {
            document.dispatchEvent(new CustomEvent("mesa:abrirConfiguracoes"));
            return;
        }

        // Clique do CTE
        if (e.target.closest("#cte-click-button, [data-cte-action='clique']")) {
            executarCliqueCTE();
            return;
        }
    });

    // Eventos customizados
    document.addEventListener("mesa:jogadoresAtualizados", () => {
        atualizarAssentos();
    });

    window.addEventListener("mesa:campanhaAlterada", (event) => {
        const campanha = event.detail?.campanha || event.detail?.campaign || event.detail;
        if (campanha) sincronizarCampanha(campanha);
    });
}

/* ============================================================
   REALTIME
============================================================ */
async function carregarJogadoresDaCampanha() {
    const campanhaId = mesaState.campanha.id;
    if (!campanhaId) return [];

    const supabase = obterSupabaseMesa();
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from("characters")
            .select("*")
            .eq("campaign_id", campanhaId)
            .order("slot", { ascending: true });

        if (error) {
            console.error("[Mesa Realtime] Erro:", error);
            return [];
        }

        const lista = Array.isArray(data) ? data : [];
        sincronizarJogadoresRealtime(lista);

        document.dispatchEvent(new CustomEvent("mesa:jogadoresAtualizados", {
            detail: { personagens: lista }
        }));

        return lista;
    } catch (erro) {
        console.error("[Mesa Realtime] Falha:", erro);
        return [];
    }
}

function sincronizarJogadoresRealtime(personagens = []) {
    const lista = Array.isArray(personagens) ? personagens : [];

    // Limpa os assentos
    mesaState.jogadores.forEach(j => {
        j.ocupado = false;
        j.characterId = null;
        j.userId = null;
    });

    lista.forEach(p => {
        const slot = Number(p.slot);
        if (slot >= 1 && slot <= MESA_CONFIG.maxJogadores) {
            const jogador = mesaState.jogadores[slot - 1];
            jogador.ocupado = true;
            jogador.characterId = p.id || null;
            jogador.userId = p.user_id || null;
        }
    });

    // Atualiza jogador atual
    if (mesaState.usuario.id) {
        const meu = lista.find(p => String(p.user_id) === String(mesaState.usuario.id));
        if (meu) {
            mesaState.jogadorAtual.characterId = meu.id || null;
            mesaState.jogadorAtual.slot = Number(meu.slot) || null;
        }
    }
}

async function iniciarRealtimeMesa() {
    const campanhaId = mesaState.campanha.id;
    if (!campanhaId) return;

    const supabase = obterSupabaseMesa();
    if (!supabase) return;

    if (mesaRealtimeChannel && mesaRealtimeCampaignId === String(campanhaId)) return;

    await pararRealtimeMesa();

    mesaRealtimeCampaignId = String(campanhaId);
    const nomeCanal = `mesa-campanha-${campanhaId}`;

    mesaRealtimeChannel = supabase
        .channel(nomeCanal)
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "characters",
            filter: `campaign_id=eq.${campanhaId}`
        }, () => {
            carregarJogadoresDaCampanha();
        })
        .subscribe((status) => {
            console.log("[Mesa Realtime] Status:", status);
        });
}

async function pararRealtimeMesa() {
    if (!mesaRealtimeChannel) return;

    const supabase = obterSupabaseMesa();
    try {
        if (supabase) await supabase.removeChannel(mesaRealtimeChannel);
    } catch (e) {}

    mesaRealtimeChannel = null;
    mesaRealtimeCampaignId = null;
}

async function sincronizarRealtimeCampanha() {
    if (!mesaState.campanha.id) {
        await pararRealtimeMesa();
        return;
    }
    await carregarJogadoresDaCampanha();
    await iniciarRealtimeMesa();
}

/* ============================================================
   FUNÇÕES DE INTERFACE BÁSICAS
============================================================ */
function atualizarCampanhaVisual() {
    if (MesaUI.nomeCampanha) {
        MesaUI.nomeCampanha.textContent = mesaState.campanha.nome || "Campanha";
    }
}

function atualizarModoVisual() {
    if (!MesaUI.container) return;
    MesaUI.container.dataset.modo = mesaState.modoAtual;
    MesaUI.container.classList.remove("modo-normal", "modo-aventura", "modo-batalha");
    MesaUI.container.classList.add(`modo-${mesaState.modoAtual}`);
}

function atualizarAssentos() {
    // Esta função será chamada pelos outros módulos (mesa-jogadores.js)
    // Por enquanto só dispara o evento
    document.dispatchEvent(new CustomEvent("mesa:assentosAtualizados", {
        detail: { jogadores: mesaState.jogadores }
    }));
}

function selecionarJogador(slot) {
    const numero = Number(slot);
    if (!numero || numero < 1 || numero > MESA_CONFIG.maxJogadores) return;

    const ehProprio = Number(mesaState.jogadorAtual.slot) === numero;

    document.dispatchEvent(new CustomEvent("mesa:jogadorSelecionado", {
        detail: {
            slot: numero,
            jogador: mesaState.jogadores[numero - 1],
            ehProprioJogador: ehProprio
        }
    }));
}

/* ============================================================
   CTE (Click Time Event) - versão estável
============================================================ */
function iniciarCTE(opcoes = {}) {
    if (!MESA_CONFIG.cte.disponivel || mesaState.cte.ativo) return;

    mesaState.cte.ativo = true;
    mesaState.cte.tempo = Number(opcoes.tempo) || MESA_CONFIG.cte.tempoPadrao;
    mesaState.cte.quantidade = Math.max(1, Number(opcoes.quantidade) || 1);
    mesaState.cte.cliques = 0;
    mesaState.cte.resultados = [];
    mesaState.cte.inicio = performance.now();

    criarTelaCTE();
    executarContagemCTE();

    document.dispatchEvent(new CustomEvent("mesa:cteIniciado", {
        detail: {
            tempo: mesaState.cte.tempo,
            quantidade: mesaState.cte.quantidade
        }
    }));
}

function criarTelaCTE() {
    if (!MesaUI.screenContent) return;

    MesaUI.screenContent.innerHTML = `
        <div class="mesa-cte" id="mesa-cte">
            <div class="mesa-cte-header">
                <span class="mesa-cte-icon">⚡</span>
                <div>
                    <span class="mesa-cte-label">CLICK TIME EVENT</span>
                    <h2>Prepare-se</h2>
                </div>
            </div>
            <p class="mesa-cte-instruction" id="cte-instruction">Clique quando estiver pronto!</p>
            <div class="mesa-cte-timer">
                <span id="cte-timer-value">1.000</span>
                <small>segundos</small>
            </div>
            <div class="mesa-cte-progress">
                <div id="cte-progress-bar" class="mesa-cte-progress-bar"></div>
            </div>
            <button type="button" class="mesa-cte-click" id="cte-click-button" data-cte-action="clique">
                <span class="mesa-cte-click-icon">⚡</span>
                <span>CLIQUE!</span>
            </button>
            <div class="mesa-cte-counter" id="cte-click-counter">
                0 / ${mesaState.cte.quantidade}
            </div>
        </div>
    `;
}

function executarContagemCTE() {
    if (!mesaState.cte.ativo) return;

    const atualizar = () => {
        if (!mesaState.cte.ativo) return;

        const decorrido = performance.now() - mesaState.cte.inicio;
        const restante = Math.max(0, mesaState.cte.tempo - decorrido);
        const percentual = Math.min(100, (decorrido / mesaState.cte.tempo) * 100);

        const timer = document.getElementById("cte-timer-value");
        const progress = document.getElementById("cte-progress-bar");

        if (timer) timer.textContent = (restante / 1000).toFixed(3);
        if (progress) progress.style.width = `${percentual}%`;

        if (restante <= 0) {
            finalizarCTEPorTempo();
            return;
        }
        requestAnimationFrame(atualizar);
    };
    atualizar();
}

function executarCliqueCTE() {
    if (!mesaState.cte.ativo) return;

    const decorrido = performance.now() - mesaState.cte.inicio;
    if (decorrido > mesaState.cte.tempo) {
        finalizarCTEPorTempo();
        return;
    }

    mesaState.cte.cliques++;
    const counter = document.getElementById("cte-click-counter");
    if (counter) {
        counter.textContent = `${mesaState.cte.cliques} / ${mesaState.cte.quantidade}`;
    }

    document.dispatchEvent(new CustomEvent("mesa:cteClique", {
        detail: {
            clique: mesaState.cte.cliques,
            quantidade: mesaState.cte.quantidade,
            tempoDecorrido: decorrido
        }
    }));

    if (mesaState.cte.cliques >= mesaState.cte.quantidade) {
        finalizarCTESucesso();
    }
}

function finalizarCTEPorTempo() {
    mesaState.cte.ativo = false;
    document.dispatchEvent(new CustomEvent("mesa:cteFalhaGlobal"));
}

function finalizarCTESucesso() {
    mesaState.cte.ativo = false;
    document.dispatchEvent(new CustomEvent("mesa:cteFinalizado", {
        detail: { sucesso: true, cliques: mesaState.cte.cliques }
    }));
}

/* ============================================================
   API PÚBLICA
============================================================ */
window.MesaRPG = {
    estado: () => mesaState,
    inicializar: inicializarMesa,
    selecionarJogador,
    iniciarCTE,
    iniciarBatalha: function() { /* será expandido depois */ },
    mudarModo: function(modo) {
        if (Object.values(MESA_CONFIG.modos).includes(modo)) {
            mesaState.modoAtual = modo;
            atualizarModoVisual();
        }
    }
};

/* ============================================================
   AUTO-INICIALIZAÇÃO
============================================================ */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        // Espera um pouco mais para garantir que supabase e outros módulos carregaram
        setTimeout(inicializarMesa, 200);
    });
} else {
    setTimeout(inicializarMesa, 200);
}
