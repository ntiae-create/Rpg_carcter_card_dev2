/* =========================================================
   MESA RPG — SISTEMA DE DIAGNÓSTICO
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       ESTADO
    ===================================================== */

    const Diagnostico = {

        aberto: false,

        logs: [],

        maxLogs: 100,

        ultimoRealtime: null,

        ultimaQuantidadePersonagens: null,

        inicializado: false

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function obterEstadoMesa() {

        try {

            if (
                window.MesaRPG &&
                typeof window.MesaRPG.estado === "function"
            ) {

                return window.MesaRPG.estado();

            }

        } catch (erro) {

            registrar(
                "erro",
                "Erro ao obter estado da Mesa: " +
                erro.message
            );

        }

        return null;

    }


    function obterSupabase() {

        return (
            window.supabaseClient ||
            window.supabase ||
            null
        );

    }


    function obterAuth() {

        return window.rpgAuth || null;

    }


    function obterPersonagens() {

        const auth = obterAuth();

        if (
            auth &&
            Array.isArray(auth.campaignCharacters)
        ) {

            return auth.campaignCharacters;

        }

        const estado = obterEstadoMesa();

        if (
            estado &&
            Array.isArray(estado.personagens)
        ) {

            return estado.personagens;

        }

        return [];

    }


    function obterCampanha() {

        const estado = obterEstadoMesa();

        if (estado && estado.campanha) {

            return estado.campanha;

        }

        const auth = obterAuth();

        if (auth && auth.campaign) {

            return auth.campaign;

        }

        return null;

    }


    /* =====================================================
       LOG
    ===================================================== */

    function registrar(tipo, mensagem) {

        const agora = new Date();

        const hora =
            agora.toLocaleTimeString(
                "pt-BR",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );


        Diagnostico.logs.push({

            tipo,

            mensagem,

            hora

        });


        if (
            Diagnostico.logs.length >
            Diagnostico.maxLogs
        ) {

            Diagnostico.logs.shift();

        }


        atualizarLog();

    }


    function atualizarLog() {

        const elemento =
            document.getElementById(
                "diagnostico-log"
            );

        if (!elemento) return;


        if (!Diagnostico.logs.length) {

            elemento.innerHTML = `
                <div class="diagnostico-log-vazio">
                    Aguardando eventos...
                </div>
            `;

            return;

        }


        elemento.innerHTML =
            Diagnostico.logs
                .slice()
                .reverse()
                .map(item => {

                    let classe =
                        "diagnostico-log-info";


                    if (item.tipo === "sucesso") {

                        classe =
                            "diagnostico-log-sucesso";

                    }


                    if (item.tipo === "aviso") {

                        classe =
                            "diagnostico-log-aviso";

                    }


                    if (item.tipo === "erro") {

                        classe =
                            "diagnostico-log-erro";

                    }


                    return `
                        <div class="diagnostico-log-item">

                            <span class="diagnostico-log-hora">
                                [${item.hora}]
                            </span>

                            <span class="${classe}">
                                ${escaparHTML(item.mensagem)}
                            </span>

                        </div>
                    `;

                })
                .join("");

    }


    function escaparHTML(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       STATUS
    ===================================================== */

    function definirStatus(chave, texto) {

        const elemento =
            document.querySelector(
                `[data-diagnostico="${chave}"]`
            );

        if (!elemento) return;

        elemento.textContent = texto;

    }


    function atualizarStatusSupabase() {

        const supabase =
            obterSupabase();


        if (supabase) {

            definirStatus(
                "supabase",
                "🟢 Conectado"
            );

            return true;

        }


        definirStatus(
            "supabase",
            "🔴 Ausente"
        );

        return false;

    }


    function atualizarStatusCampanha() {

        const campanha =
            obterCampanha();


        if (!campanha) {

            definirStatus(
                "campanha",
                "🔴 Nenhuma"
            );

            return;

        }


        definirStatus(
            "campanha",
            "🟢 OK"
        );

    }


    async function atualizarStatusUsuario() {

        const auth =
            obterAuth();


        if (
            auth &&
            auth.user
        ) {

            const id =
                auth.user.id ||
                auth.user.user_id ||
                auth.user.uid;


            definirStatus(
                "usuario",
                id
                    ? "🟢 " + id.slice(0, 8) + "..."
                    : "🟢 OK"
            );

            return;

        }


        const supabase =
            obterSupabase();


        if (
            supabase &&
            supabase.auth &&
            typeof supabase.auth.getUser === "function"
        ) {

            try {

                const resposta =
                    await supabase.auth.getUser();


                const usuario =
                    resposta?.data?.user;


                if (usuario) {

                    definirStatus(
                        "usuario",
                        "🟢 " +
                        usuario.id.slice(0, 8) +
                        "..."
                    );

                    return;

                }

            } catch (erro) {

                registrar(
                    "aviso",
                    "Não foi possível verificar o usuário."
                );

            }

        }


        definirStatus(
            "usuario",
            "🟡 Desconhecido"
        );

    }


    function atualizarStatusRealtime() {

        const estado =
            obterEstadoMesa();

        const campanha =
            obterCampanha();


        let status =
            "🟡 Aguardando";


        if (
            window.MesaRPG &&
            typeof window.MesaRPG.iniciarRealtimeMesa ===
            "function"
        ) {

            if (campanha) {

                status =
                    "🟢 Ativo";

            }

        }


        if (
            estado &&
            estado.campanha
        ) {

            status =
                "🟢 Ativo";

        }


        definirStatus(
            "realtime",
            status
        );

    }


    /* =====================================================
       CAMPANHA
    ===================================================== */

    function atualizarDadosCampanha() {

        const campanha =
            obterCampanha();


        const id =
            document.getElementById(
                "diagnostico-campanha-id"
            );


        const nome =
            document.getElementById(
                "diagnostico-campanha-nome"
            );


        const master =
            document.getElementById(
                "diagnostico-master-id"
            );


        if (!campanha) {

            if (id) id.textContent = "—";

            if (nome) nome.textContent = "—";

            if (master) master.textContent = "—";

            return;

        }


        if (id) {

            id.textContent =
                campanha.id || "—";

        }


        if (nome) {

            nome.textContent =
                campanha.name ||
                campanha.nome ||
                "Sem nome";

        }


        if (master) {

            master.textContent =
                campanha.master_id ||
                campanha.masterId ||
                "—";

        }

    }


    /* =====================================================
       PERSONAGENS / SLOTS
    ===================================================== */

    function atualizarPersonagens() {

        const personagens =
            obterPersonagens();


        const validos =
            Array.isArray(personagens)
                ? personagens
                : [];


        const ocupados =
            validos.filter(
                personagem =>
                    personagem &&
                    personagem.slot != null
            );


        definirStatus(
            "personagens",
            String(validos.length)
        );


        definirStatus(
            "slots",
            `${ocupados.length}/8`
        );


        atualizarSlots(
            validos
        );


        if (
            Diagnostico.ultimaQuantidadePersonagens !==
            validos.length
        ) {

            if (
                Diagnostico.ultimaQuantidadePersonagens !==
                null
            ) {

                registrar(
                    "info",
                    `Personagens sincronizados: ${validos.length}`
                );

            }


            Diagnostico.ultimaQuantidadePersonagens =
                validos.length;

        }

    }


    function atualizarSlots(personagens) {

        const container =
            document.getElementById(
                "diagnostico-slots"
            );


        if (!container) return;


        const mapa =
            new Map();


        personagens.forEach(personagem => {

            const slot =
                Number(personagem?.slot);


            if (
                Number.isInteger(slot) &&
                slot >= 1 &&
                slot <= 8
            ) {

                mapa.set(
                    slot,
                    personagem
                );

            }

        });


        let html = "";


        for (
            let slot = 1;
            slot <= 8;
            slot++
        ) {

            const personagem =
                mapa.get(slot);


            if (personagem) {

                const nome =
                    personagem.name ||
                    personagem.nome ||
                    "Sem nome";


                const characterId =
                    personagem.id ||
                    personagem.characterId ||
                    "—";


                const userId =
                    personagem.user_id ||
                    personagem.userId ||
                    "—";


                html += `

                    <div class="diagnostico-slot ocupado">

                        <div class="diagnostico-slot-topo">

                            <span class="diagnostico-slot-numero">
                                Slot ${slot}
                            </span>

                            <span class="diagnostico-slot-status">
                                🟢 OCUPADO
                            </span>

                        </div>

                        <div class="diagnostico-slot-nome">
                            ${escaparHTML(nome)}
                        </div>

                        <div class="diagnostico-slot-id">
                            Character: ${escaparHTML(characterId)}
                        </div>

                        <div class="diagnostico-slot-id">
                            User: ${escaparHTML(userId)}
                        </div>

                    </div>

                `;

            } else {

                html += `

                    <div class="diagnostico-slot vazio">

                        <div class="diagnostico-slot-topo">

                            <span class="diagnostico-slot-numero">
                                Slot ${slot}
                            </span>

                            <span class="diagnostico-slot-status">
                                ⚪ VAZIO
                            </span>

                        </div>

                        <div class="diagnostico-slot-nome">
                            Nenhum personagem
                        </div>

                    </div>

                `;

            }

        }


        container.innerHTML =
            html;

    }


    /* =====================================================
       ATUALIZAÇÃO COMPLETA
    ===================================================== */

    async function atualizarDiagnostico() {

        atualizarStatusSupabase();

        atualizarStatusCampanha();

        atualizarStatusRealtime();

        atualizarDadosCampanha();

        atualizarPersonagens();

        await atualizarStatusUsuario();

    }


    /* =====================================================
       SINCRONIZAÇÃO MANUAL
    ===================================================== */

    async function sincronizarAgora() {

        registrar(
            "info",
            "Solicitando sincronização manual..."
        );


        try {

            if (
                window.MesaRPG &&
                typeof window.MesaRPG.carregarJogadoresDaCampanha ===
                "function"
            ) {

                await window.MesaRPG.carregarJogadoresDaCampanha();


                registrar(
                    "sucesso",
                    "Sincronização concluída."
                );


                await atualizarDiagnostico();

                return;

            }


            if (
                typeof window.sincronizarPersonagensMesa ===
                "function"
            ) {

                window.sincronizarPersonagensMesa();


                registrar(
                    "sucesso",
                    "Sincronização local executada."
                );


                await atualizarDiagnostico();

                return;

            }


            registrar(
                "erro",
                "Nenhuma função de sincronização foi encontrada."
            );

        } catch (erro) {

            registrar(
                "erro",
                "Erro na sincronização: " +
                erro.message
            );

        }

    }


    /* =====================================================
       EVENTOS DA MESA
    ===================================================== */

    function registrarEventos() {

        document.addEventListener(
            "mesa:jogadoresAtualizados",
            evento => {

                const personagens =
                    evento?.detail?.personagens;


                const quantidade =
                    Array.isArray(personagens)
                        ? personagens.length
                        : 0;


                registrar(
                    "sucesso",
                    `Realtime atualizou personagens: ${quantidade}`
                );


                atualizarDiagnostico();

            }
        );


        document.addEventListener(
            "mesa:estadoJogadoresAtualizado",
            () => {

                registrar(
                    "info",
                    "Estado dos jogadores atualizado."
                );


                atualizarDiagnostico();

            }
        );


        document.addEventListener(
            "mesa:jogadorAtualizado",
            evento => {

                const detalhe =
                    evento?.detail;


                const id =
                    detalhe?.jogadorId ??
                    detalhe?.id ??
                    "desconhecido";


                registrar(
                    "info",
                    `Jogador atualizado: ${id}`
                );


                atualizarDiagnostico();

            }
        );


        document.addEventListener(
            "rpg:campanhaAtualizada",
            () => {

                registrar(
                    "info",
                    "Campanha atualizada."
                );


                atualizarDiagnostico();

            }
        );


        document.addEventListener(
            "mesa:jogadores:personagensSincronizados",
            evento => {

                const quantidade =
                    evento?.detail?.personagens?.length ??
                    evento?.detail?.length ??
                    0;


                registrar(
                    "info",
                    `Cards sincronizados: ${quantidade} personagens.`
                );


                atualizarDiagnostico();

            }
        );


        window.addEventListener(
            "error",
            evento => {

                registrar(
                    "erro",
                    evento?.message ||
                    "Erro JavaScript detectado."
                );

            }
        );


        window.addEventListener(
            "unhandledrejection",
            evento => {

                const erro =
                    evento?.reason;


                registrar(
                    "erro",
                    "Promise rejeitada: " +
                    (
                        erro?.message ||
                        String(erro)
                    )
                );

            }
        );

    }


    /* =====================================================
       INTERFACE
    ===================================================== */

    function abrir() {

        const painel =
            document.getElementById(
                "mesa-diagnostico"
            );


        if (!painel) {

            console.error(
                "[MesaDiagnostico] Painel #mesa-diagnostico não encontrado."
            );

            return;

        }


        painel.hidden = false;

        Diagnostico.aberto = true;


        atualizarDiagnostico();


        registrar(
            "sucesso",
            "Painel de diagnóstico aberto."
        );

    }


    function fechar() {

        const painel =
            document.getElementById(
                "mesa-diagnostico"
            );


        if (!painel) return;


        painel.hidden = true;

        Diagnostico.aberto = false;

    }


    function limparLogs() {

        Diagnostico.logs = [];

        atualizarLog();


        registrar(
            "info",
            "Registros limpos."
        );

    }


    /* =====================================================
       CLIQUE DO BOTÃO DE DIAGNÓSTICO
       Delegação de evento para garantir funcionamento
       mesmo que a estrutura da mesa seja recriada.
    ===================================================== */

    function registrarCliqueDiagnostico() {

        document.addEventListener(
            "click",
            evento => {

                const botao =
                    evento.target.closest(
                        "#btn-diagnostico"
                    );


                if (!botao) return;


                evento.preventDefault();

                evento.stopPropagation();


                abrir();

            },
            true
        );

    }


    /* =====================================================
       CLIQUES INTERNOS DO PAINEL
    ===================================================== */

    function registrarCliquesPainel() {

        document.addEventListener(
            "click",
            evento => {

                const fecharBotao =
                    evento.target.closest(
                        "#btn-fechar-diagnostico"
                    );


                if (fecharBotao) {

                    evento.preventDefault();

                    evento.stopPropagation();

                    fechar();

                    return;

                }


                const limparBotao =
                    evento.target.closest(
                        "#btn-limpar-diagnostico"
                    );


                if (limparBotao) {

                    evento.preventDefault();

                    evento.stopPropagation();

                    limparLogs();

                    return;

                }


                const sincronizarBotao =
                    evento.target.closest(
                        "#btn-sincronizar-diagnostico"
                    );


                if (sincronizarBotao) {

                    evento.preventDefault();

                    evento.stopPropagation();

                    sincronizarAgora();

                    return;

                }


                const atualizarBotao =
                    evento.target.closest(
                        "#btn-atualizar-diagnostico"
                    );


                if (atualizarBotao) {

                    evento.preventDefault();

                    evento.stopPropagation();

                    atualizarDiagnostico();

                }

            },
            true
        );

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function inicializar() {

        if (Diagnostico.inicializado) {

            return;

        }


        Diagnostico.inicializado = true;


        /*
         * Os cliques principais usam delegação.
         * Isso evita problemas caso outro script
         * recrie ou altere o cabeçalho.
         */

        registrarCliqueDiagnostico();

        registrarCliquesPainel();


        registrarEventos();


        registrar(
            "sucesso",
            "Sistema de diagnóstico iniciado."
        );


        /*
         * Primeira leitura.
         */

        setTimeout(
            () => {

                atualizarDiagnostico();

            },
            300
        );


        /*
         * Atualização periódica enquanto
         * o painel estiver aberto.
         */

        setInterval(
            () => {

                if (Diagnostico.aberto) {

                    atualizarDiagnostico();

                }

            },
            2000
        );

    }


    /* =====================================================
       API GLOBAL
    ===================================================== */

    window.MesaDiagnostico = {

        abrir,

        fechar,

        registrar,

        atualizar: atualizarDiagnostico,

        sincronizar: sincronizarAgora

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
