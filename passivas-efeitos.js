/* ==========================================
   RPG — EFEITOS VISUAIS DAS PASSIVAS
========================================== */

"use strict";

(function () {

    /*
     * Este arquivo controla APENAS a representação
     * visual das passivas.
     *
     * Ele NÃO executa as regras das passivas.
     * Ele NÃO causa dano, cura, buff ou debuff.
     *
     * As regras ficam no sistema principal.
     */


    const efeitosAtivos = {};


    /* ======================================================
       CONFIGURAÇÃO VISUAL
    ====================================================== */

    const EFEITO_PADRAO = {

        classeBase: "passiva-visual",

        icone: "✦",

        mostrarStacks: true,

        mostrarAura: true,

        mostrarParticulas: true

    };


    /* ======================================================
       UTILITÁRIOS
    ====================================================== */

    function normalizarId(id) {

        if (
            id === null ||
            id === undefined
        ) {
            return null;
        }

        return String(id);

    }


    function obterPassiva(passivaId) {

        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.obter !== "function"
        ) {
            return null;
        }

        return window.PassivasDados.obter(
            passivaId
        );

    }


    function passivaPossuiStacks(passiva) {

        if (!passiva) {
            return false;
        }

        return (
            passiva.tipo === "stack" ||
            passiva.tipo === "stack_alvo"
        );

    }


    /* ======================================================
       LOCALIZAR ASSENTO DO JOGADOR
    ====================================================== */

    function obterAssento(jogadorId) {

        jogadorId =
            normalizarId(jogadorId);

        if (!jogadorId) {
            return null;
        }


        /*
         * Tentativa 1:
         * ID do usuário
         */

        let assento =
            document.querySelector(
                '[data-user-id="' +
                jogadorId +
                '"]'
            );

        if (assento) {
            return assento;
        }


        /*
         * Tentativa 2:
         * ID do personagem
         */

        assento =
            document.querySelector(
                '[data-character-id="' +
                jogadorId +
                '"]'
            );

        if (assento) {
            return assento;
        }


        /*
         * Tentativa 3:
         * data-player
         */

        for (let i = 1; i <= 8; i++) {

            assento =
                document.querySelector(
                    '[data-player="' +
                    i +
                    '"]'
                );

            if (
                assento &&
                (
                    assento.dataset.userId === jogadorId ||
                    assento.dataset.characterId === jogadorId
                )
            ) {

                return assento;

            }

        }


        /*
         * Tentativa 4:
         * Caso o card tenha o ID diretamente.
         */

        assento =
            document.getElementById(
                "player-" + jogadorId
            );

        if (assento) {
            return assento;
        }


        return null;

    }


    /* ======================================================
       OBTER CONTAINER DE PASSIVAS
    ====================================================== */

    function obterContainer(
        assento,
        passiva
    ) {

        if (!assento || !passiva) {
            return null;
        }


        let container =
            assento.querySelector(
                '[data-passiva-id="' +
                passiva.id +
                '"]'
            );


        if (container) {
            return container;
        }


        /*
         * Container principal
         */

        container =
            document.createElement(
                "div"
            );

        container.className =
            EFEITO_PADRAO.classeBase;

        container.dataset.passivaId =
            passiva.id;


        /*
         * HEADER
         */

        const header =
            document.createElement(
                "div"
            );

        header.className =
            "passiva-visual-header";


        const icone =
            document.createElement(
                "span"
            );

        icone.className =
            "passiva-visual-icone";

        icone.textContent =
            obterIcone(passiva);


        const nome =
            document.createElement(
                "span"
            );

        nome.className =
            "passiva-visual-nome";

        nome.textContent =
            passiva.nome;


        header.appendChild(
            icone
        );

        header.appendChild(
            nome
        );


        /*
         * ÁREA DE STACKS
         */

        const stacks =
            document.createElement(
                "div"
            );

        stacks.className =
            "passiva-visual-stacks";


        /*
         * ÁREA DE AURA
         */

        const aura =
            document.createElement(
                "div"
            );

        aura.className =
            "passiva-visual-aura";


        /*
         * PARTÍCULAS
         */

        const particulas =
            document.createElement(
                "div"
            );

        particulas.className =
            "passiva-visual-particulas";


        container.appendChild(
            header
        );

        container.appendChild(
            stacks
        );

        container.appendChild(
            aura
        );

        container.appendChild(
            particulas
        );


        /*
         * Guardamos referência.
         */

        if (!efeitosAtivos[assento]) {

            efeitosAtivos[assento] = {};

        }

        efeitosAtivos[assento][passiva.id] =
            container;


        /*
         * Adicionamos ao card.
         */

        let areaPassivas =
            assento.querySelector(
                ".passivas-area"
            );


        if (!areaPassivas) {

            areaPassivas =
                document.createElement(
                    "div"
                );

            areaPassivas.className =
                "passivas-area";


            assento.appendChild(
                areaPassivas
            );

        }


        areaPassivas.appendChild(
            container
        );


        return container;

    }


    /* ======================================================
       ÍCONES
    ====================================================== */

    function obterIcone(passiva) {

        if (!passiva) {
            return "✦";
        }


        const icones = {

            ponto_cego: "🗡️",

            furia_crescente: "🔥",

            postura_de_combate: "⚔️",

            guarda_compartilhada: "🛡️",

            dominio_da_distancia: "🗡️",

            fluxo_interior: "🥋",

            controle_monstruoso: "🧘",

            colheita_das_almas: "☠️",

            ultima_ceifa: "⚰️",

            precisao: "🏹",

            tiro_certeiro: "🎯",

            marca_da_presa: "🐺",

            rastreio_de_sangue: "🩸",

            carta_do_louco: "🃏",

            extremista: "🃏",

            reacao_em_cadeia: "⚗️",

            poison: "☠️",

            stacks_de_reacao: "🧪",

            engenharia_de_combate: "⚙️",

            overload: "💥",

            sobrecarga_arcana: "🔥",

            sobrecarga: "💥",

            instabilidade_magica: "⚡",

            sete_grimorios: "📖",

            grimorio_da_perdicao: "💀",

            almas_dos_mortos: "💀",

            ressurreicao: "✨",

            reanimacao: "👻",

            vinculo_de_invocacao: "👻",

            pacto_supremo: "👑",

            ciclo_natural: "🌿",

            equilibrio_natural: "🌱",

            graca_divina: "✨",

            milagre: "🌟",

            harmonia_crescente: "🎵",

            danca: "💃",

            sinfonia_suprema: "🎶",

            visao_do_destino: "🔮",

            profecia: "👁️",

            preparacao: "🕯️",

            lago_da_vida: "💫",

            cura_milagrosa: "✨",

            dominio_do_duelo: "🗡️"

        };


        return (
            icones[passiva.id] ||
            "✦"
        );

    }


    /* ======================================================
       DESENHAR STACKS
    ====================================================== */

    function desenharStacks(
        container,
        passiva,
        estado
    ) {

        const area =
            container.querySelector(
                ".passiva-visual-stacks"
            );

        if (!area) {
            return;
        }


        area.innerHTML = "";


        /*
         * Se não for uma passiva de Stack,
         * não mostramos contador.
         */

        if (
            !passivaPossuiStacks(passiva)
        ) {

            area.style.display =
                "none";

            return;

        }


        area.style.display =
            "";


        const valor =
            estado &&
            Number.isFinite(
                estado.valor
            )
                ? estado.valor
                : 0;


        const maximo =
            estado
                ? estado.maximo
                : (
                    passiva.stacks
                        ? passiva.stacks.maximo
                        : null
                );


        /*
         * Caso exista máximo definido,
         * desenhamos cada Stack.
         */

        if (
            maximo !== null &&
            maximo !== undefined &&
            Number.isFinite(Number(maximo))
        ) {

            const quantidade =
                Number(maximo);


            for (
                let i = 1;
                i <= quantidade;
                i++
            ) {

                const stack =
                    document.createElement(
                        "span"
                    );

                stack.className =
                    i <= valor
                        ? "passiva-stack-ativo"
                        : "passiva-stack-inativo";

                stack.dataset.stack =
                    i;

                stack.textContent =
                    i <= valor
                        ? "◆"
                        : "◇";


                area.appendChild(
                    stack
                );

            }

        }


        /*
         * Contador textual.
         */

        const contador =
            document.createElement(
                "span"
            );

        contador.className =
            "passiva-stack-contador";


        if (
            maximo !== null &&
            maximo !== undefined
        ) {

            contador.textContent =
                valor +
                "/" +
                maximo;

        } else {

            contador.textContent =
                String(valor);

        }


        area.appendChild(
            contador
        );

    }


    /* ======================================================
       APLICAR NÍVEL VISUAL
    ====================================================== */

    function aplicarNivelVisual(
        container,
        passiva,
        estado
    ) {

        /*
         * Remove níveis antigos.
         */

        for (let i = 0; i <= 10; i++) {

            container.classList.remove(
                "stack-" + i
            );

        }


        container.classList.remove(
            "passiva-inativa"
        );

        container.classList.remove(
            "passiva-ativa"
        );

        container.classList.remove(
            "passiva-maxima"
        );


        if (
            !passivaPossuiStacks(passiva)
        ) {

            container.classList.add(
                "passiva-ativa"
            );

            return;

        }


        const valor =
            estado &&
            Number.isFinite(
                estado.valor
            )
                ? estado.valor
                : 0;


        container.classList.add(
            "stack-" +
            Math.min(
                valor,
                10
            )
        );


        if (valor <= 0) {

            container.classList.add(
                "passiva-inativa"
            );

        } else {

            container.classList.add(
                "passiva-ativa"
            );

        }


        if (
            estado &&
            estado.maximo !== null &&
            estado.maximo !== undefined &&
            valor >= estado.maximo
        ) {

            container.classList.add(
                "passiva-maxima"
            );

        }

    }


    /* ======================================================
       ATUALIZAR NOME
    ====================================================== */

    function atualizarNome(
        container,
        passiva
    ) {

        const nome =
            container.querySelector(
                ".passiva-visual-nome"
            );

        if (!nome) {
            return;
        }

        nome.textContent =
            passiva.nome;

    }


    /* ======================================================
       ATUALIZAR DESCRIÇÃO
    ====================================================== */

    function atualizarDescricao(
        container,
        passiva
    ) {

        let descricao =
            container.querySelector(
                ".passiva-visual-descricao"
            );


        if (!descricao) {

            descricao =
                document.createElement(
                    "div"
                );

            descricao.className =
                "passiva-visual-descricao";

            container.appendChild(
                descricao
            );

        }


        descricao.textContent =
            passiva.descricao || "";

    }


    /* ======================================================
       ATUALIZAR VISUAL
    ====================================================== */

    function atualizar(
        jogadorId,
        passivaId,
        estado
    ) {

        const passiva =
            obterPassiva(
                passivaId
            );

        if (!passiva) {
            return null;
        }


        const assento =
            obterAssento(
                jogadorId
            );

        if (!assento) {

            /*
             * O jogador pode ainda não ter
             * sido renderizado na Mesa.
             */

            return null;

        }


        const container =
            obterContainer(
                assento,
                passiva
            );

        if (!container) {
            return null;
        }


        /*
         * Se for Stack e nenhum estado tiver
         * sido fornecido, tentamos obter o estado.
         */

        if (
            passivaPossuiStacks(passiva) &&
            !estado &&
            window.PassivasStacks &&
            typeof window.PassivasStacks.obter ===
                "function"
        ) {

            estado =
                window.PassivasStacks.obter(
                    jogadorId,
                    passivaId
                );

        }


        desenharStacks(
            container,
            passiva,
            estado
        );


        aplicarNivelVisual(
            container,
            passiva,
            estado
        );


        atualizarNome(
            container,
            passiva
        );


        atualizarDescricao(
            container,
            passiva
        );


        /*
         * Informações auxiliares.
         */

        if (estado) {

            container.dataset.stacks =
                estado.valor;

            if (
                estado.maximo !== null &&
                estado.maximo !== undefined
            ) {

                container.dataset.maxStacks =
                    estado.maximo;

            }

        }


        /*
         * Evento visual.
         */

        window.dispatchEvent(
            new CustomEvent(
                "passiva:efeitoVisualAtualizado",
                {
                    detail: {

                        jogadorId:
                            normalizarId(jogadorId),

                        passivaId:
                            passivaId,

                        estado:
                            estado || null,

                        elemento:
                            container

                    }
                }
            )
        );


        return container;

    }


    /* ======================================================
       LIMPAR PASSIVA
    ====================================================== */

    function limpar(
        jogadorId,
        passivaId
    ) {

        const assento =
            obterAssento(
                jogadorId
            );

        if (!assento) {
            return;
        }


        const container =
            assento.querySelector(
                '[data-passiva-id="' +
                passivaId +
                '"]'
            );


        if (container) {
            container.remove();
        }


        const id =
            normalizarId(
                jogadorId
            );


        if (
            efeitosAtivos[id] &&
            efeitosAtivos[id][passivaId]
        ) {

            delete efeitosAtivos[id][passivaId];

        }

    }


    /* ======================================================
       LIMPAR TODAS AS PASSIVAS DO JOGADOR
    ====================================================== */

    function limparJogador(
        jogadorId
    ) {

        const assento =
            obterAssento(
                jogadorId
            );

        if (!assento) {
            return;
        }


        const elementos =
            assento.querySelectorAll(
                "[data-passiva-id]"
            );


        elementos.forEach(
            function (elemento) {

                elemento.remove();

            }
        );


        const id =
            normalizarId(
                jogadorId
            );


        if (efeitosAtivos[id]) {

            delete efeitosAtivos[id];

        }

    }


    /* ======================================================
       REAPLICAR TODAS
    ====================================================== */

    function reaplicarTodos() {

        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.listar !==
                "function"
        ) {
            return;
        }


        /*
         * Não tentamos criar passivas para todos
         * os jogadores cegamente.
         *
         * O sistema de jogadores informa quais
         * personagens estão presentes.
         */

        if (
            window.PassivasStacks &&
            typeof window.PassivasStacks.obterTodas ===
                "function"
        ) {

            /*
             * Procuramos cards da Mesa.
             */

            const jogadores =
                document.querySelectorAll(
                    "[data-user-id], [data-character-id]"
                );


            jogadores.forEach(
                function (assento) {

                    const jogadorId =
                        assento.dataset.userId ||
                        assento.dataset.characterId;


                    if (!jogadorId) {
                        return;
                    }


                    const estados =
                        window.PassivasStacks.obterTodas(
                            jogadorId
                        );


                    Object.keys(
                        estados
                    ).forEach(
                        function (passivaId) {

                            atualizar(
                                jogadorId,
                                passivaId,
                                estados[passivaId]
                            );

                        }
                    );

                }
            );

        }

    }


    /* ======================================================
       EVENTO — STACK ALTERADA
    ====================================================== */

    window.addEventListener(
        "passiva:stacksAlterada",
        function (evento) {

            const dados =
                evento.detail;

            if (!dados) {
                return;
            }


            atualizar(
                dados.jogadorId,
                dados.passivaId,
                dados
            );

        }
    );


    /* ======================================================
       EVENTO — JOGADORES ATUALIZADOS
    ====================================================== */

    window.addEventListener(
        "mesa:jogadoresAtualizados",
        function () {

            setTimeout(
                function () {

                    reaplicarTodos();

                },
                0
            );

        }
    );


    /* ======================================================
       EVENTO — JOGADOR ATUALIZADO
    ====================================================== */

    window.addEventListener(
        "mesa:jogadorAtualizado",
        function (evento) {

            const dados =
                evento.detail;

            if (!dados) {
                return;
            }


            const jogadorId =
                dados.jogadorId ||
                dados.userId ||
                dados.characterId ||
                dados.id;


            if (!jogadorId) {
                return;
            }


            if (
                window.PassivasStacks &&
                typeof window.PassivasStacks.obterTodas ===
                    "function"
            ) {

                const estados =
                    window.PassivasStacks.obterTodas(
                        jogadorId
                    );


                Object.keys(
                    estados
                ).forEach(
                    function (passivaId) {

                        atualizar(
                            jogadorId,
                            passivaId,
                            estados[passivaId]
                        );

                    }
                );

            }

        }
    );


    /* ======================================================
       API PÚBLICA
    ====================================================== */

    window.PassivasEfeitos = {

        atualizar: atualizar,

        limpar: limpar,

        limparJogador: limparJogador,

        reaplicarTodos: reaplicarTodos,

        obterAssento: obterAssento

    };


    /* ======================================================
       INICIALIZAÇÃO
    ====================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            function () {

                setTimeout(
                    reaplicarTodos,
                    0
                );

            }
        );

    } else {

        setTimeout(
            reaplicarTodos,
            0
        );

    }


    console.log(
        "[Passivas] Efeitos visuais carregados."
    );

})();
