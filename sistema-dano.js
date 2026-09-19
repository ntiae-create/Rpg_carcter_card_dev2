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
        return window.PassivasDados
            .listar()
            .filter(function (p) {
                return (
                    p &&
                    p.classe === classe &&
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
