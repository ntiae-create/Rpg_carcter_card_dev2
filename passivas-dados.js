/* ==========================================
   RPG — DADOS DAS PASSIVAS
   DEFINIÇÕES OFICIAIS DAS PASSIVAS
========================================== */

"use strict";

(function () {

    const PASSIVAS = {

        /* ==================================================
           ASSASSINO
        ================================================== */

        ponto_cego: {

            id: "ponto_cego",
            classe: "Assassino",
            nome: "Ponto Cego",

            descricao:
                "Ataques realizados pelas costas causam dano adicional equivalente a 10% do HP máximo do próprio Assassino.",

            tipo: "condicional",

            efeito: {
                condicao: "ataque_pelas_costas",
                danoAdicional: {
                    tipo: "hp_maximo_proprio",
                    percentual: 10
                }
            }

        },


        /* ==================================================
           BERSERK
        ================================================== */

        furia_crescente: {

            id: "furia_crescente",
            classe: "Berserk",
            nome: "Fúria Crescente",

            descricao:
                "A cada 10% de HP perdido, o Berserk recebe +5% de Dano e +20% de Resistência a efeitos negativos, acumulando até +45% de Dano e +180% de Resistência.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 9,
                inicial: 0
            },

            efeitoPorStack: {
                dano: 5,
                resistenciaNegativa: 20
            }

        },


        /* ==================================================
           GUERREIRO
        ================================================== */

        postura_de_combate: {

            id: "postura_de_combate",
            classe: "Guerreiro",
            nome: "Postura de Combate",

            descricao:
                "Ao causar ou receber dano, o Guerreiro ganha 1 Stack de Postura. Cada Stack concede +2% de Defesa e +1% de Dano.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            efeitoPorStack: {
                defesa: 2,
                dano: 1
            },

            maximoEfeito: {
                defesa: 20,
                dano: 10
            }

        },


        /* ==================================================
           TANK
        ================================================== */

        guarda_compartilhada: {

            id: "guarda_compartilhada",
            classe: "Tank",
            nome: "Guarda Compartilhada",

            descricao:
                "50% do dano recebido por aliados próximos é transferido para o Tank. A cada 10% de HP perdido, o Tank recebe redução adicional de dano, acumulando até 75% de redução.",

            tipo: "condicional",

            efeito: {

                transferenciaDano: 50,

                reducaoPorHpPerdido: {
                    intervaloHp: 10,
                    percentual: 75
                }

            }

        },


        /* ==================================================
           LANCEIRO
        ================================================== */

        dominio_da_distancia: {

            id: "dominio_da_distancia",
            classe: "Lanceiro",
            nome: "Domínio da Distância",

            descricao:
                "Quanto maior a distância entre o Lanceiro e o inimigo, maior o dano causado por seus ataques.",

            tipo: "distancia",

            niveis: {

                curta: {
                    nome: "Curta distância",
                    dano: 0
                },

                media: {
                    nome: "Média distância",
                    dano: 10
                },

                ideal: {
                    nome: "Distância ideal",
                    dano: 20
                },

                maxima: {
                    nome: "Distância máxima",
                    dano: 30
                }

            }

        },


        /* ==================================================
           MONGE
        ================================================== */

        fluxo_interior: {

            id: "fluxo_interior",
            classe: "Monge",
            nome: "Fluxo Interior",

            descricao:
                "Cada ataque consecutivo contra o mesmo alvo concede 1 Stack, aumentando em 2% a Velocidade de Ataque e 1% a Esquiva por Stack.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            efeitoPorStack: {
                velocidadeAtaque: 2,
                esquiva: 1
            }

        },

        controle_monstruoso: {

            id: "controle_monstruoso",
            classe: "Monge",
            nome: "Controle Monstruoso",

            descricao:
                "Ao permanecer 2 turnos sem realizar ações ofensivas, o Monge entra em concentração. Seu próximo ataque recebe +20% de Dano, +5% de Chance de Crítico e causa 3× o dano normal.",

            tipo: "condicional",

            efeito: {

                turnosSemAtaque: 2,

                proximoAtaque: {
                    dano: 20,
                    chanceCritico: 5,
                    multiplicador: 3
                }

            }

        },


        /* ==================================================
           CEIFADOR
        ================================================== */

        colheita_das_almas: {

            id: "colheita_das_almas",
            classe: "Ceifador",
            nome: "Colheita das Almas",

            descricao:
                "Ao derrotar um inimigo, o Ceifador absorve sua alma, ganhando 1 Stack. Cada Stack concede +2% de Dano e +1% de Roubo de Vida.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            efeitoPorStack: {
                dano: 2,
                rouboVida: 1
            }

        },

        ultima_ceifa: {

            id: "ultima_ceifa",
            classe: "Ceifador",
            nome: "Última Ceifa",

            descricao:
                "Ao desferir o golpe final em um inimigo, o Ceifador pode distribuir entre aliados escolhidos os HP restantes do inimigo antes do golpe, divididos entre os alvos escolhidos. O Ceifador não pode receber essa cura.",

            tipo: "condicional",

            efeito: {
                origem: "hp_restante_inimigo",
                distribuiEntreAliados: true,
                permiteCeifador: false
            }

        },


        /* ==================================================
           ARQUEIRO
        ================================================== */

        precisao: {

            id: "precisao",
            classe: "Arqueiro",
            nome: "Olho de Águia / Precisão",

            descricao:
                "Ataques realizados corretamente durante Click Time Events (CTEs) acumulam Stacks de Precisão.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: null,
                inicial: 0
            },

            evento: "cte_sucesso",

            aoAtingirMaximo: "tiro_certeiro"

        },

        tiro_certeiro: {

            id: "tiro_certeiro",
            classe: "Arqueiro",
            nome: "Tiro Certeiro",

            descricao:
                "O próximo ataque realizado via CTE recebe Crítico garantido de 2× + D20, podendo alcançar um multiplicador de até 3×, dependendo do resultado do D20.",

            tipo: "cte",

            efeito: {
                criticoGarantido: true,
                multiplicadorBase: 2,
                dado: "D20",
                multiplicadorMaximo: 3
            }

        },


        /* ==================================================
           CAÇADOR
        ================================================== */

        marca_da_presa: {

            id: "marca_da_presa",
            classe: "Caçador",
            nome: "Marca da Presa",

            descricao:
                "Ao atingir um inimigo, aplica 1 Stack de Marca da Presa. Cada Stack concede +2% de Dano contra aquele inimigo.",

            tipo: "stack_alvo",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            efeitoPorStack: {
                danoContraAlvo: 2
            }

        },

        rastreio_de_sangue: {

            id: "rastreio_de_sangue",
            classe: "Caçador",
            nome: "Rastreio de Sangue",

            descricao:
                "Quando a presa marcada morre, a marca é transferida automaticamente para outro alvo, priorizando o inimigo mais próximo ou, entre vários alvos em alcance, o mais ferido.",

            tipo: "condicional",

            efeito: {
                evento: "alvo_morre",
                transferenciaAutomatica: true,
                prioridade: [
                    "inimigo_mais_proximo",
                    "inimigo_mais_ferido"
                ]
            }

        },


        /* ==================================================
           BUFÃO
        ================================================== */

        carta_do_louco: {

            id: "carta_do_louco",
            classe: "Bufão",
            nome: "Carta do Louco",

            descricao:
                "Ao entrar em batalha, o Bufão recebe 1 Joker. Depois, recebe mais 1 Joker a cada dois rounds, no 3º e 5º turno. Cada Joker concede +5% de AGI.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 3,
                inicial: 0
            },

            efeitoPorStack: {
                agilidade: 5
            },

            maximoEfeito: {
                agilidade: 15
            },

            turnosJoker: [
                1,
                3,
                5
            ],

            aoAtingirMaximo: "extremista"

        },

        extremista: {

            id: "extremista",
            classe: "Bufão",
            nome: "Extremista",

            descricao:
                "Consome os 3 Jokers e converte toda a AGI acumulada pelo Bufão em ATK. O ataque possui acerto garantido e recebe +5% de Chance de Crítico.",

            tipo: "condicional",

            custo: {
                jokers: 3
            },

            efeito: {
                converterAgilidadeEmAtaque: true,
                acertoGarantido: true,
                chanceCritico: 5
            }

        },


        /* ==================================================
           ALQUIMISTA
        ================================================== */

        reacao_em_cadeia: {

            id: "reacao_em_cadeia",
            classe: "Alquimista",
            nome: "Reação em Cadeia",

            descricao:
                "Ao acertar o mesmo inimigo 2 vezes, desencadeia uma reação que causa Stun por 1 turno.",

            tipo: "condicional",

            efeito: {
                acertosNecessarios: 2,
                mesmoAlvo: true,
                stun: 1
            }

        },

        poison: {

            id: "poison",
            classe: "Alquimista",
            nome: "Poison",

            descricao:
                "Após o término do Stun, o inimigo começa a sofrer -1 HP por turno.",

            tipo: "efeito",

            efeito: {
                gatilho: "fim_stun",
                danoPorTurno: 1
            }

        },

        stacks_de_reacao: {

            id: "stacks_de_reacao",
            classe: "Alquimista",
            nome: "Stacks de Reação",

            descricao:
                "Cada tipo diferente de efeito negativo aplicado concede 1 Stack, aumentando em +3% a potência dos efeitos negativos por Stack.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            efeitoPorStack: {
                potenciaEfeitosNegativos: 3
            }

        },


        /* ==================================================
           ARTÍFICE
        ================================================== */

        engenharia_de_combate: {

            id: "engenharia_de_combate",
            classe: "Artífice",
            nome: "Engenharia de Combate",

            descricao:
                "Cada tipo diferente de engenhoca utilizada concede 1 Stack de Engenharia. Repetir a mesma engenhoca não gera Stack. Cada Stack concede +2% de Dano das engenhocas e +1% de Defesa.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            efeitoPorStack: {
                danoEngenhocas: 2,
                defesa: 1
            },

            repeticaoGeraStack: false,

            aoAtingirMaximo: "overload"

        },

        overload: {

            id: "overload",
            classe: "Artífice",
            nome: "Overload",

            descricao:
                "A próxima engenhoca utilizada recebe +50% de potência e consome os Stacks acumulados.",

            tipo: "condicional",

            efeito: {
                proximaEngenhoca: 50,
                consomeStacks: true
            }

        },


        /* ==================================================
           FEITICEIRO
        ================================================== */

        sobrecarga_arcana: {

            id: "sobrecarga_arcana",
            classe: "Feiticeiro",
            nome: "Sobrecarga Arcana",

            descricao:
                "Cada habilidade mágica utilizada consecutivamente concede 1 Stack, aumentando em +3% o Dano Mágico por Stack.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            efeitoPorStack: {
                danoMagico: 3
            },

            aoAtingirMaximo: "sobrecarga"

        },

        sobrecarga: {

            id: "sobrecarga",
            classe: "Feiticeiro",
            nome: "Sobrecarga",

            descricao:
                "A próxima magia recebe +50% de Dano.",

            tipo: "condicional",

            efeito: {
                proximaMagia: 50
            }

        },

        instabilidade_magica: {

            id: "instabilidade_magica",
            classe: "Feiticeiro",
            nome: "Instabilidade Mágica",

            descricao:
                "A Sobrecarga possui uma chance de desencadear uma explosão em área, atingindo inimigos e aliados e causando dano equivalente a 50% do HP máximo do próprio Feiticeiro.",

            tipo: "condicional",

            efeito: {
                vinculadoA: "sobrecarga",
                explosaoArea: true,
                danoHpMaximoProprio: 50,
                afetaAliados: true,
                afetaInimigos: true
            }

        },


        /* ==================================================
           MAGO
        ================================================== */

        sete_grimorios: {

            id: "sete_grimorios",
            classe: "Mago",
            nome: "Sete Grimórios",

            descricao:
                "O Mago possui 7 Grimórios. Cada Grimório utilizado concede +2% de ATK Mágico.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 7,
                inicial: 0
            },

            efeitoPorStack: {
                ataqueMagico: 2
            },

            maximoEfeito: {
                ataqueMagico: 14
            },

            aoAtingirMaximo: "grimorio_da_perdicao"

        },

        grimorio_da_perdicao: {

            id: "grimorio_da_perdicao",
            classe: "Mago",
            nome: "Grimório da Perdição",

            descricao:
                "Ao utilizar os sete Grimórios, causa Confusão em todos os inimigos por 2 turnos.",

            tipo: "condicional",

            efeito: {
                confusao: 2,
                alvo: "todos_inimigos"
            }

        },


        /* ==================================================
           NECROMANTE
        ================================================== */

        almas_dos_mortos: {

            id: "almas_dos_mortos",
            classe: "Necromante",
            nome: "Almas dos Mortos",

            descricao:
                "Ao passar por um cadáver no campo de batalha, o Necromante absorve sua alma e recebe +1 Stack de Alma.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: null,
                inicial: 0
            },

            evento: "passar_por_cadaver",

            efeitoPorStack: {
                almas: 1
            }

        },

        ressurreicao: {

            id: "ressurreicao",
            classe: "Necromante",
            nome: "Ressurreição",

            descricao:
                "Com 20 Almas, pode ressuscitar um aliado com 5 HP, consumindo 100% do MP.",

            tipo: "condicional",

            custo: {
                almas: 20,
                mp: 100
            },

            efeito: {
                hpAlvo: 5
            }

        },

        reanimacao: {

            id: "reanimacao",
            classe: "Necromante",
            nome: "Reanimação",

            descricao:
                "Pode utilizar Almas para reanimar um cadáver como servo temporário. 1 Alma = 1 turno de duração da reanimação.",

            tipo: "condicional",

            custoPorTurno: {
                almas: 1
            },

            efeito: {
                alvo: "cadaver",
                servoTemporario: true
            }

        },


        /* ==================================================
           INVOCADOR
        ================================================== */

        vinculo_de_invocacao: {

            id: "vinculo_de_invocacao",
            classe: "Invocador",
            nome: "Vínculo de Invocação",

            descricao:
                "Cada invocação que permanecer em campo durante 1 turno completo concede 1 Stack de Vínculo. Cada Stack concede +2% de ATK às invocações.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            efeitoPorStack: {
                ataqueInvocacoes: 2
            },

            maximoEfeito: {
                ataqueInvocacoes: 20
            },

            evento: "invocacao_turno_completo",

            aoNivel: {
                nivel: 20,
                desbloqueia: "pacto_supremo"
            }

        },

        pacto_supremo: {

            id: "pacto_supremo",
            classe: "Invocador",
            nome: "Pacto Supremo",

            descricao:
                "Ao alcançar o nível 20, o Invocador desbloqueia o Pacto Supremo. Durante 2 turnos, pode manter até 3 seres invocados simultaneamente, cada um com uma afinidade diferente. As invocações recebem 3× ATK durante o Pacto Supremo.",

            tipo: "nivel",

            requisito: {
                nivel: 20
            },

            duracao: 2,

            limiteInvocacoes: 3,

            afinidadesDiferentes: true,

            efeito: {
                multiplicadorAtk: 3
            }

        },


        /* ==================================================
           DRUIDA
        ================================================== */

        ciclo_natural: {

            id: "ciclo_natural",
            classe: "Druida",
            nome: "Ciclo Natural",

            descricao:
                "Cada vez que o Druida utiliza uma habilidade de uma afinidade diferente da anterior, recebe 1 Stack de Natureza.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: null,
                inicial: 0
            },

            evento: "afinidade_diferente",

            efeitoPorStack: {
                natureza: 1
            },

            aoAtingirMaximo: "equilibrio_natural"

        },

        equilibrio_natural: {

            id: "equilibrio_natural",
            classe: "Druida",
            nome: "Equilíbrio Natural",

            descricao:
                "Ao atingir o máximo, o Druida pode transferir seu próprio MP para aliados, funcionando como uma fonte de suporte de MP.",

            tipo: "condicional",

            efeito: {
                transferenciaMp: true,
                origem: "mp_proprio",
                alvo: "aliados"
            }

        },


        /* ==================================================
           CLÉRIGO
        ================================================== */

        graca_divina: {

            id: "graca_divina",
            classe: "Clérigo",
            nome: "Graça Divina",

            descricao:
                "Sempre que o Clérigo cura um aliado com menos de 50% de HP, recebe 1 Stack de Graça. Cada Stack concede +2% de Poder de Cura.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            condicao: {
                hpAlvoAbaixoDe: 50
            },

            efeitoPorStack: {
                poderCura: 2
            },

            maximoEfeito: {
                poderCura: 20
            },

            aoAtingirMaximo: "milagre"

        },

        milagre: {

            id: "milagre",
            classe: "Clérigo",
            nome: "Milagre",

            descricao:
                "A próxima cura realizada pelo Clérigo tem seu efeito triplicado e pode atingir todos os aliados dentro do alcance.",

            tipo: "condicional",

            efeito: {
                proximaCura: 3,
                podeAtingirTodos: true
            }

        },


        /* ==================================================
           BARDO
        ================================================== */

        harmonia_crescente: {

            id: "harmonia_crescente",
            classe: "Bardo",
            nome: "Harmonia Crescente",

            descricao:
                "Sempre que o Bardo aplica um efeito positivo diferente em um aliado, recebe 1 Stack de Harmonia. Cada Stack aumenta em 2% a duração dos efeitos positivos aplicados pelo Bardo.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            efeitoPorStack: {
                duracaoBuff: 2
            },

            maximoEfeito: {
                duracaoBuff: 20
            },

            evento: "efeito_positivo_diferente",

            aoAtingirMaximo: "sinfonia_suprema"

        },

        danca: {

            id: "danca",
            classe: "Bardo",
            nome: "Dança",

            descricao:
                "Aliados afetados pelo efeito Dança recebem +50% de Resistência enquanto o efeito durar.",

            tipo: "efeito",

            efeito: {
                resistencia: 50
            },

            duracao: "duracao_danca"

        },

        sinfonia_suprema: {

            id: "sinfonia_suprema",
            classe: "Bardo",
            nome: "Sinfonia Suprema",

            descricao:
                "O próximo efeito positivo aplicado pelo Bardo é transformado em uma Sinfonia, sendo aplicado simultaneamente a todos os aliados dentro do alcance e recebendo +50% de potência.",

            tipo: "condicional",

            efeito: {
                proximoBuff: true,
                alcance: "aliados_dentro_do_alcance",
                potencia: 50
            }

        },


        /* ==================================================
           ORÁCULO
        ================================================== */

        visao_do_destino: {

            id: "visao_do_destino",
            classe: "Oráculo",
            nome: "Visão do Destino",

            descricao:
                "Sempre que um aliado sofrer dano ou receber um efeito negativo, o Oráculo recebe 1 Stack de Presságio. Cada Stack concede +1% de Esquiva e +1% de Resistência a efeitos negativos.",

            tipo: "stack",

            stacks: {
                minimo: 0,
                maximo: 10,
                inicial: 0
            },

            evento: [
                "aliado_sofre_dano",
                "aliado_recebe_efeito_negativo"
            ],

            efeitoPorStack: {
                esquiva: 1,
                resistenciaNegativa: 1
            },

            aoAtingirMaximo: "profecia"

        },

        profecia: {

            id: "profecia",
            classe: "Oráculo",
            nome: "Profecia",

            descricao:
                "O Oráculo prevê o próximo acontecimento perigoso. Durante 1 turno, todos os aliados recebem +50% de Esquiva e +50% de Resistência a efeitos negativos.",

            tipo: "condicional",

            efeito: {
                duracao: 1,
                esquiva: 50,
                resistenciaNegativa: 50,
                alvo: "todos_aliados"
            }

        },

        preparacao: {

            id: "preparacao",
            classe: "Oráculo",
            nome: "Preparação",

            descricao:
                "Antes de qualquer batalha, o Oráculo prevê o confronto 1 turno antes, aplicando Preparação a si mesmo e aos aliados. Durante o primeiro turno da batalha, os aliados sob Preparação recebem +20% de Resistência a efeitos negativos e +10% de Esquiva. Preparação é consumida ao final do primeiro turno.",

            tipo: "pre_batalha",

            efeito: {
                resistenciaNegativa: 20,
                esquiva: 10,
                duracao: 1,
                consumo: "fim_primeiro_turno"
            }

        },


        /* ==================================================
           BUFFER / HEALER
        ================================================== */

        lago_da_vida: {

            id: "lago_da_vida",
            classe: "Buffer/Healer",
            nome: "Lago da Vida",

            descricao:
                "Concede +5% de ATK a todos os aliados por 3 turnos. Se o buff Lago da Vida for removido antes de terminar, todos os aliados são curados em 10% do HP máximo.",

            tipo: "buff",

            efeito: {
                ataque: 5,
                duracao: 3,
                alvo: "todos_aliados"
            },

            aoSerRemovidoAntesDoFim: {
                curaHpMaximo: 10,
                alvo: "todos_aliados"
            }

        },

        cura_milagrosa: {

            id: "cura_milagrosa",
            classe: "Buffer/Healer",
            nome: "Cura Milagrosa",

            descricao:
                "Após curar 10% do HP de cada aliado, o Buffer/Healer impõe o efeito Cura Milagrosa a todos os aliados por 2 turnos. Enquanto o efeito estiver ativo, se o HP de um aliado estiver abaixo de 50%, ele é curado completamente.",

            tipo: "efeito",

            gatilho: {
                curaDeCadaAliado: 10
            },

            efeito: {
                duracao: 2,
                condicaoHpAbaixoDe: 50,
                curaCompleta: true,
                alvo: "aliados"
            }

        },


        /* ==================================================
           DUELISTA
        ================================================== */
        dominio_do_duelo: {
            id: "dominio_do_duelo",
            classe: "Duelista",
            nome: "Domínio do Duelo",
            descricao:
                "A cada acerto, o Duelista recebe 1 Stack de Duelo. Ao alcançar 3 Stacks, ele leva o inimigo atingido para seu Domínio, onde o combate ocorre separadamente em um confronto individual. Dentro do Domínio, o Duelista pode criar 1 Clone com 50% de seus atributos. Ao derrotar o inimigo no Domínio, os Stacks são reiniciados.",
            tipo: "stack",
            stacks: {
                minimo: 0,
                maximo: 3,
                inicial: 0
            },
            efeitoPorStack: {
                duelo: 1
            },
            aoAtingirMaximo: "ativar_dominio"
        }
    };


    /* ======================================================
       API
    ====================================================== */

    window.PassivasDados = {

        obter: function (id) {

            return PASSIVAS[id] || null;

        },


        listar: function () {

            return Object.values(PASSIVAS);

        },


        listarPorClasse: function (classe) {

            return Object.values(PASSIVAS)
                .filter(function (passiva) {

                    return passiva.classe === classe;

                });

        },


        existe: function (id) {

            return Boolean(PASSIVAS[id]);

        }

    };


    console.log(
        "[Passivas] Dados oficiais carregados:",
        Object.keys(PASSIVAS).length
    );

})();
