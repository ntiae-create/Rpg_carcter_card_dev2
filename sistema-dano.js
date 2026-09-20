/* =========================================================
   RPG — SISTEMA DE DANO REAL
   Calcula dano automático com % de bônus das passivas (stacks)
   e acumula stacks a cada ação ofensiva.
   Depende de: passivas-dados.js, passivas-stacks.js, combat.js
========================================================= */
"use strict";
(function () {
    const JOGADOR_ID = "ficha_local";

    /* =====================================================
       LISTAR PASSIVAS DE STACK DA CLASSE ATUAL
    ===================================================== */
    function listarPassivasStackDaClasse() {
        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.listar !== "function"
        ) {
            return [];
        }
        const classe =
            (typeof character !== "undefined" && character.class) ||
            "";
        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.listarPorClasse !== "function"
        ) {
            return [];
        }

        return window.PassivasDados
            .listarPorClasse(classe)
            .filter(function (p) {
                return (
                    p &&
                    (p.tipo === "stack" || p.tipo === "stack_alvo")
                );
            });
    }

    /* =====================================================
       BÔNUS % DAS PASSIVAS ATIVAS (stacks)
    ===================================================== */
    function bonusPassivas(tipoDano) {
        let total = 0;
        const detalhes = [];
        if (!window.PassivasStacks) {
            return { total: total, detalhes: detalhes };
        }
        listarPassivasStackDaClasse().forEach(function (p) {
            const stack = window.PassivasStacks.obter(
                JOGADOR_ID,
                p.id
            );
            if (!stack || stack.valor <= 0) {
                return;
            }
            const e = p.efeitoPorStack || {};
            let pct = Number(e.dano || 0);
            if (tipoDano === "magico") {
                pct += Number(e.danoMagico || 0);
                pct += Number(e.ataqueMagico || 0);
            }
            if (pct <= 0) {
                return;
            }
            const valor = pct * stack.valor;
            total += valor;
            detalhes.push(
                "+" + valor + "% " + p.nome + " (" + stack.valor + "x)"
            );
        });
        return { total: total, detalhes: detalhes };
    }

    /* =====================================================
       BÔNUS DE AFINIDADE ELEMENTAL (+15% se coincidir)
    ===================================================== */
    function bonusAfinidade(elemento) {
        if (
            typeof character === "undefined" ||
            !character.affinity ||
            !elemento
        ) {
            return 0;
        }
        return character.affinity === elemento ? 15 : 0;
    }

    /* =====================================================
       CÁLCULO PRINCIPAL DE DANO
    ===================================================== */
    function calcular(tipoDano, opcoes) {
        opcoes = opcoes || {};
        const atkBase =
            tipoDano === "magico"
                ? Number(character.attributes.atkMgc)
                : Number(character.attributes.atk);
        const base = Math.max(1, atkBase);

        const bonus = bonusPassivas(tipoDano);
        let pctTotal = bonus.total;

        const afiPct = bonusAfinidade(opcoes.elemento);
        if (afiPct > 0) {
            pctTotal += afiPct;
            bonus.detalhes.push("+" + afiPct + "% Afinidade");
        }

        const multHabilidade = Number(opcoes.multiplicador) || 1;

        // Crítico: chance = 3% + AGI × 0,5%, máx 25%; multiplicador 1,5×
        const chanceCrit = Math.min(
            25,
            3 + Number(character.attributes.agi) * 0.5
        );
        const critico = Math.random() * 100 < chanceCrit;
        const multCrit = critico ? 1.5 : 1;

        // Variância aleatória ±10%
        const variacao = 0.9 + Math.random() * 0.2;

        let dano =
            base *
            multHabilidade *
            (1 + pctTotal / 100) *
            multCrit *
            variacao;
        dano = Math.max(1, Math.round(dano));

        return {
            dano: dano,
            base: base,
            pctTotal: pctTotal,
            detalhes: bonus.detalhes,
            critico: critico,
            chanceCrit: chanceCrit,
            variacao: variacao
        };
    }

    /* =====================================================
       ACUMULAR STACKS APÓS AÇÃO OFENSIVA
    ===================================================== */
    function acumularStacks() {
        if (!window.PassivasStacks) {
            return;
        }
        listarPassivasStackDaClasse().forEach(function (p) {
            window.PassivasStacks.adicionar(JOGADOR_ID, p.id, 1);
        });
    }

    /* =====================================================
       REGISTRAR DANO NO LOG DE COMBATE COM DETALHAMENTO %
    ===================================================== */
    function registrarDano(tipoDano, nomeAcao, opcoes) {
        if (typeof character === "undefined") {
            return null;
        }
        const r = calcular(tipoDano, opcoes);
        const tipoTxt = tipoDano === "magico" ? "mágico" : "físico";
        let msg =
            nomeAcao + " → " + r.dano + " de dano " + tipoTxt;
        if (r.critico) {
            msg += " (CRÍTICO!)";
        }
        if (r.detalhes.length) {
            msg += " [" + r.detalhes.join(", ") + "]";
        }
        if (
            typeof CombatModule !== "undefined" &&
            CombatModule.registrar
        ) {
            CombatModule.registrar(msg);
        } else {
            console.log("[Dano]", msg);
        }
        acumularStacks();
        return r;
    }

    window.SistemaDano = {
        JOGADOR_ID: JOGADOR_ID,
        calcular: calcular,
        registrarDano: registrarDano,
        acumularStacks: acumularStacks,
        listarPassivasStackDaClasse: listarPassivasStackDaClasse
    };
    console.log("[SistemaDano] Carregado.");
})();

/* =========================================================
   CURA AUTOMÁTICA + PAINEL VISUAL DE STACKS
========================================================= */
(function () {
    function bonusCuraPercentual() {
        let total = 0;
        const detalhes = [];
        if (!window.PassivasStacks || !window.PassivasDados) {
            return { total: total, detalhes: detalhes };
        }
        const classe =
            (typeof character !== "undefined" && character.class) || "";
        window.PassivasDados.listar().forEach(function (p) {
            if (
                !p ||
                p.classe !== classe ||
                (p.tipo !== "stack" && p.tipo !== "stack_alvo")
            ) {
                return;
            }
            const st = window.PassivasStacks.obter(
                window.SistemaDano.JOGADOR_ID,
                p.id
            );
            if (!st || st.valor <= 0) return;
            const e = p.efeitoPorStack || {};
            const pct = Number(e.poderCura || e.cura || 0);
            if (pct <= 0) return;
            const valor = pct * st.valor;
            total += valor;
            detalhes.push("+" + valor + "% " + p.nome + " (" + st.valor + "x)");
        });
        return { total: total, detalhes: detalhes };
    }

    function curar() {
        if (typeof character === "undefined") return;
        const base = Math.max(
            1,
            Number(character.attributes.atkMgc) +
            Math.floor(Number(character.attributes.int) / 2)
        );
        const bonus = bonusCuraPercentual();
        const variacao = 0.9 + Math.random() * 0.2;
        let valor = Math.round(base * (1 + bonus.total / 100) * variacao);
        valor = Math.max(1, valor);
        let msg = "💚 Cura → +" + valor + " HP (base " + base + ")";
        if (bonus.detalhes.length) {
            msg += " [" + bonus.detalhes.join(", ") + "]";
        }
        if (
            typeof CombatModule !== "undefined" &&
            CombatModule.registrar
        ) {
            CombatModule.registrar(msg);
        }
        renderizarPainelStacks();
    }

    function renderizarPainelStacks() {
        const painel = document.getElementById("stacks-panel");
        if (!painel) return;
        if (!window.PassivasStacks || !window.PassivasDados) {
            painel.innerHTML = "";
            return;
        }
        const stacks = window.PassivasStacks.obterTodas(
            window.SistemaDano.JOGADOR_ID
        );
        const ids = Object.keys(stacks).filter(function (id) {
            return stacks[id] && stacks[id].valor > 0;
        });
        if (!ids.length) {
            painel.innerHTML =
                '<div style="color:#75687f;font-size:10px;letter-spacing:1px;text-align:center;padding:6px;">NENHUMA STACK ATIVA</div>';
            return;
        }
        let html =
            '<div style="color:#c084fc;font-size:10px;letter-spacing:2px;margin-bottom:8px;text-align:center;">⚡ STACKS ATIVAS</div>';
        ids.forEach(function (id) {
            const st = stacks[id];
            const def = window.PassivasDados.obter(id);
            const nome = def ? def.nome : id;
            const temMax =
                st.maximo !== null && st.maximo !== undefined;
            const pct = temMax ? Math.min(100, (st.valor / st.maximo) * 100) : 100;
            const maxTxt = temMax ? "/" + st.maximo : "";
            html +=
                '<div style="margin-bottom:7px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:9px;color:#b9a9c8;margin-bottom:3px;">' +
                "<span>" + nome + "</span><span>" + st.valor + maxTxt + "</span></div>" +
                '<div style="height:5px;border-radius:5px;background:#211a29;overflow:hidden;">' +
                '<div style="height:100%;width:' + pct +
                '%;background:linear-gradient(90deg,#6d28d9,#c084fc);transition:width .3s;"></div>' +
                "</div></div>";
        });
        painel.innerHTML = html;
    }

    function inicializar() {
        const btn = document.getElementById("auto-heal-button");
        if (btn && !btn.dataset.healConfigured) {
            btn.dataset.healConfigured = "true";
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                curar();
            });
        }
        renderizarPainelStacks();
        window.addEventListener(
            "passiva:stacksAlterada",
            renderizarPainelStacks
        );
    }

    if (window.SistemaDano) {
        window.SistemaDano.curar = curar;
        window.SistemaDano.bonusCuraPercentual = bonusCuraPercentual;
        window.SistemaDano.renderizarPainelStacks = renderizarPainelStacks;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializar);
    } else {
        inicializar();
    }
    setTimeout(renderizarPainelStacks, 600);
})();
