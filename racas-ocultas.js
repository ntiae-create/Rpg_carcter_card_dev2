/* =========================================================
   RPG — RAÇAS OCULTAS / EVOLUÇÃO SECRETA
   10 raças bloqueadas. Desbloqueio por requisitos ocultos
   (nível + afinidade + atributos) + rolagem aleatória.
   O jogador NÃO sabe os requisitos — recebe apenas dicas
   misteriosas quando elegível. Apenas 1 evolução por personagem.
   Depende de: character.js (character global), script.js
========================================================= */
"use strict";
(function () {
    /* =====================================================
       BASE DAS 5 RAÇAS INICIAIS (para cálculo de delta)
    ===================================================== */
    const BASE_RACES = {
        "Humano":     { atk: 4,  atkMgc: 4,  def: 8, res: 8, agi: 8,  int: 15 },
        "Meio-elfo":  { atk: 3,  atkMgc: 7,  def: 6, res: 9, agi: 10, int: 15 },
        "Elfo":       { atk: 3,  atkMgc: 8,  def: 5, res: 9, agi: 12, int: 16 },
        "Semi-besta": { atk: 9,  atkMgc: 3,  def: 7, res: 6, agi: 10, int: 10 },
        "Besta":      { atk: 11, atkMgc: 2,  def: 6, res: 5, agi: 9,  int: 6  }
    };

    /* =====================================================
       10 RAÇAS OCULTAS + stats + requisitos secretos + chance
    ===================================================== */
    const RACES_OCULTAS = {
        Vampiro: {
            hp: 38, mp: 22, est: 32, sanidade: 70,
            atk: 11, atkMgc: 9, def: 7, res: 9, agi: 11, int: 13,
            req: { nivel: 8, afinidade: "trevas" },
            chance: 0.12,
            dica: "Uma sede de sangue desperta em você..."
        },
        Lizard: {
            hp: 36, mp: 12, est: 38, sanidade: 85,
            atk: 10, atkMgc: 4, def: 10, res: 7, agi: 7, int: 8,
            req: { nivel: 8, afinidade: "terra" },
            chance: 0.12,
            dica: "Escamas começam a surgir em sua pele..."
        },
        Dragonoide: {
            hp: 42, mp: 18, est: 40, sanidade: 85,
            atk: 13, atkMgc: 10, def: 9, res: 8, agi: 8, int: 11,
            req: { nivel: 10, afinidade: "fogo" },
            chance: 0.08,
            dica: "Uma chama ancestral arde em seu peito..."
        },
        Aqua: {
            hp: 30, mp: 30, est: 28, sanidade: 95,
            atk: 7, atkMgc: 12, def: 6, res: 11, agi: 11, int: 14,
            req: { nivel: 8, afinidade: "agua" },
            chance: 0.12,
            dica: "Sua respiração funde-se à água..."
        },
        "Morto-vivo": {
            hp: 45, mp: 15, est: 30, sanidade: 50,
            atk: 10, atkMgc: 8, def: 8, res: 10, agi: 6, int: 10,
            req: { nivel: 8, sanidadeMax: 60 },
            chance: 0.10,
            dica: "A morte toca você, mas não o leva..."
        },
        Demônio: {
            hp: 40, mp: 25, est: 35, sanidade: 60,
            atk: 12, atkMgc: 12, def: 8, res: 9, agi: 10, int: 12,
            req: { nivel: 10, afinidade: "trevas" },
            chance: 0.08,
            dica: "Uma voz sussurra poder vindo das trevas..."
        },
        Divino: {
            hp: 35, mp: 35, est: 30, sanidade: 120,
            atk: 9, atkMgc: 14, def: 8, res: 12, agi: 9, int: 15,
            req: { nivel: 10, afinidade: "luz", sanidadeMin: 110 },
            chance: 0.08,
            dica: "Uma luz divina banha o seu ser..."
        },
        Dríade: {
            hp: 32, mp: 32, est: 28, sanidade: 100,
            atk: 8, atkMgc: 13, def: 7, res: 10, agi: 10, int: 14,
            req: { nivel: 8, racaBase: "Elfo" },
            chance: 0.12,
            dica: "A natureza clama pelo seu nome..."
        },
        Lupino: {
            hp: 40, mp: 10, est: 42, sanidade: 75,
            atk: 13, atkMgc: 3, def: 8, res: 6, agi: 13, int: 8,
            req: { nivel: 8, racaBase: "Semi-besta" },
            chance: 0.12,
            dica: "Um uivo ancestral ecoa em seu sangue..."
        },
        Doppelganger: {
            hp: 30, mp: 28, est: 28, sanidade: 80,
            atk: 9, atkMgc: 11, def: 7, res: 9, agi: 12, int: 16,
            req: { nivel: 10, intMin: 18 },
            chance: 0.08,
            dica: "Você sente que poderia ser qualquer pessoa..."
        }
    };

    function garantirFlags() {
        if (!Array.isArray(character.racasDesbloqueadas)) {
            character.racasDesbloqueadas = [];
        }
    }

    function jaEvoluiu() {
        garantirFlags();
        return character.racasDesbloqueadas.length > 0;
    }

    function preencheRequisitos(req) {
        if (req.nivel && character.level < req.nivel) return false;
        if (req.afinidade && character.affinity !== req.afinidade) return false;
        if (req.racaBase && character.race !== req.racaBase) return false;
        if (req.sanidadeMin && character.resources.sanidade < req.sanidadeMin) return false;
        if (req.sanidadeMax && character.resources.sanidade > req.sanidadeMax) return false;
        if (req.intMin && character.attributes.int < req.intMin) return false;
        return true;
    }

    function evoluir(nomeOculto) {
        const dados = RACES_OCULTAS[nomeOculto];
        if (!dados) return;
        const baseAnterior = BASE_RACES[character.race] || null;

        // Atributos: aplica o delta sobre a base inicial,
        // preservando pontos gastos pelo jogador.
        ["atk", "atkMgc", "def", "res", "agi", "int"].forEach(function (a) {
            const antes = baseAnterior ? Number(baseAnterior[a]) : 0;
            const delta = Number(dados[a]) - antes;
            character.attributes[a] = Math.max(
                0,
                Number(character.attributes[a]) + delta
            );
        });

        // Recursos: novo máximo + recarga total
        character.resources.hp = dados.hp;
        character.resources.mp = dados.mp;
        character.resources.est = dados.est;
        character.resources.sanidade = Math.max(
            character.resources.sanidade,
            dados.sanidade
        );

        character.race = nomeOculto;
        garantirFlags();
        if (character.racasDesbloqueadas.indexOf(nomeOculto) === -1) {
            character.racasDesbloqueadas.push(nomeOculto);
        }

        if (typeof salvarPersonagem === "function") salvarPersonagem();
        if (typeof atualizarInterface === "function") atualizarInterface();
        if (
            typeof CombatModule !== "undefined" &&
            CombatModule.registrar
        ) {
            CombatModule.registrar(
                "✨ EVOLUÇÃO RACIAL: " + nomeOculto +
                "! Seus atributos e recursos mudaram."
            );
        }
    }

    /* =====================================================
       VERIFICAÇÃO (chamada ao subir de nível)
       forcar=true ignora a rolagem aleatória (uso do mestre)
    ===================================================== */
    function verificar(forcar) {
        if (typeof character === "undefined") return null;
        if (character.confirmed !== true) return null;
        if (jaEvoluiu()) return null;

        const nomes = Object.keys(RACES_OCULTAS);
        for (let i = 0; i < nomes.length; i++) {
            const nome = nomes[i];
            const dados = RACES_OCULTAS[nome];
            if (!preencheRequisitos(dados.req)) continue;

            if (forcar || Math.random() < dados.chance) {
                evoluir(nome);
                return nome;
            }
            // Elegível mas falhou na rolagem: dica misteriosa (50% de chance)
            if (
                Math.random() < 0.5 &&
                typeof CombatModule !== "undefined" &&
                CombatModule.registrar
            ) {
                CombatModule.registrar("❓ " + dados.dica);
            }
        }
        return null;
    }

    window.RacasOcultas = {
        verificar: verificar,
        evoluir: evoluir,
        listar: function () { return Object.keys(RACES_OCULTAS); }
    };
    console.log("[RacasOcultas] Carregado.");
})();
