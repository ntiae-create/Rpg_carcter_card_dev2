/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: COMBATE
========================================================= */

const CombatModule = (() => {

    /* =====================================================
       PASSIVAS DE CLASSE
    ===================================================== */

    const PASSIVAS_DE_CLASSE = {

        Assassino: {
            name: "Ponto Cego",
            description:
                "Ataques realizados pelas costas causam dano adicional equivalente a 10% do HP máximo do próprio Assassino."
        },

        Berserk: {
            name: "Fúria Crescente",
            description:
                "A cada 10% de HP perdido, o Berserk recebe +5% de Dano e +20% de Resistência a efeitos negativos, acumulando até +45% de Dano e +180% de Resistência."
        },

        Guerreiro: {
            name: "Postura de Combate",
            description:
                "Ao causar ou receber dano, o Guerreiro ganha 1 Stack de Postura. Cada Stack concede +2% de Defesa e +1% de Dano. Máximo de 10 Stacks: +20% Defesa e +10% Dano."
        },

        Tank: {
            name: "Guarda Compartilhada",
            description:
                "50% do dano recebido por aliados próximos é transferido para o Tank. A cada 10% de HP perdido, o Tank recebe redução adicional de dano, acumulando até 75% de redução."
        },

        Feiticeiro: {
            name: "Sobrecarga Arcana",
            description:
                "Cada habilidade mágica utilizada consecutivamente concede 1 Stack, aumentando em +3% o Dano Mágico por Stack. Máximo de 10 Stacks. Ao atingir o máximo, a próxima magia recebe +50% de Dano. A Sobrecarga possui uma chance de desencadear uma explosão em área, atingindo inimigos e aliados e causando dano equivalente a 50% do HP máximo do próprio Feiticeiro."
        },

        Mago: {
            name: "Sete Grimórios",
            description:
                "O Mago possui 7 Grimórios. Cada Grimório utilizado concede +2% de ATK Mágico. Máximo de 7 Grimórios = +14% de ATK Mágico. Ao utilizar os sete, causa Confusão em todos os inimigos por 2 turnos."
        },

        Bufão: {
            name: "Carta do Louco",
            description:
                "Ao entrar em batalha, o Bufão recebe 1 Joker. Depois, recebe mais 1 Joker a cada dois rounds, no 3º e 5º turno. Cada Joker concede +5% de AGI. Máximo de 3 Jokers = +15% de AGI. Ao conseguir os 3 Jokers, consome os 3 e converte toda a AGI acumulada pelo Bufão em ATK. O ataque possui acerto garantido e recebe +5% de Chance de Crítico."
        },

        Bufao: {
            name: "Carta do Louco",
            description:
                "Ao entrar em batalha, o Bufão recebe 1 Joker. Depois, recebe mais 1 Joker a cada dois rounds, no 3º e 5º turno. Cada Joker concede +5% de AGI. Máximo de 3 Jokers = +15% de AGI. Ao conseguir os 3 Jokers, consome os 3 e converte toda a AGI acumulada pelo Bufão em ATK. O ataque possui acerto garantido e recebe +5% de Chance de Crítico."
        },

        Alquimista: {
            name: "Reação em Cadeia",
            description:
                "Ao acertar o mesmo inimigo 2 vezes, desencadeia uma reação que causa Stun por 1 turno. Após o término do Stun, o inimigo começa a sofrer -1 HP por turno. Cada tipo diferente de efeito negativo aplicado concede 1 Stack, aumentando em +3% a potência dos efeitos negativos por Stack. Máximo de 10 Stacks = +30%."
        },

        Artifice: {
            name: "Engenharia de Combate",
            description:
                "Cada tipo diferente de engenhoca utilizada concede 1 Stack de Engenharia. Repetir a mesma engenhoca não gera Stack. Cada Stack concede +2% de Dano das engenhocas e +1% de Defesa. Máximo de 10 Stacks. Ao atingir o máximo, a próxima engenhoca utilizada recebe +50% de potência e consome os Stacks acumulados."
        },

        Arqueiro: {
            name: "Olho de Águia / Precisão",
            description:
                "Ataques realizados corretamente durante Click Time Events (CTEs) acumulam Stacks de Precisão. Ao atingir o máximo, o próximo ataque realizado via CTE recebe Crítico garantido de 2× + D20, podendo alcançar um multiplicador de até 3×, dependendo do resultado do D20."
        },

        Lanceiro: {
            name: "Domínio da Distância",
            description:
                "Quanto maior a distância entre o Lanceiro e o inimigo, maior o dano causado por seus ataques. Curta distância: +0%. Média distância: +10%. Distância ideal: +20%. Distância máxima: +30%."
        },

        Cacador: {
            name: "Marca da Presa",
            description:
                "Ao atingir um inimigo, aplica 1 Stack de Marca da Presa. Cada Stack concede +2% de Dano contra aquele inimigo. Máximo de 10 Stacks. Quando a presa marcada morre, a marca é transferida automaticamente para outro alvo, priorizando o inimigo mais próximo ou, entre vários alvos em alcance, o mais ferido."
        },

        Clerigo: {
            name: "Graça Divina",
            description:
                "Sempre que o Clérigo cura um aliado com menos de 50% de HP, recebe 1 Stack de Graça. Cada Stack concede +2% de Poder de Cura. Máximo de 10 Stacks = +20% de Cura. Ao atingir 10, a próxima cura realizada pelo Clérigo tem seu efeito triplicado e pode atingir todos os aliados dentro do alcance."
        },

        Necromante: {
            name: "Almas dos Mortos",
            description:
                "Ao passar por um cadáver no campo de batalha, o Necromante absorve sua alma e recebe +1 Stack de Alma. Com 20 Almas, pode ressuscitar um aliado com 5 HP, consumindo 100% do MP. Também pode utilizar Almas para reanimar um cadáver como servo temporário. 1 Alma = 1 turno de duração da reanimação."
        },

        Ceifador: {
            name: "Colheita das Almas",
            description:
                "Ao derrotar um inimigo, o Ceifador absorve sua alma, ganhando 1 Stack. Cada Stack concede +2% de Dano e +1% de Roubo de Vida. Máximo de 10 Stacks. Ao desferir o golpe final em um inimigo, pode distribuir entre aliados escolhidos os HP restantes do inimigo antes do golpe, divididos entre os alvos escolhidos. O Ceifador não pode receber essa cura."
        },

        Monge: {
            name: "Fluxo Interior",
            description:
                "Cada ataque consecutivo contra o mesmo alvo concede 1 Stack, aumentando em 2% a Velocidade de Ataque e 1% a Esquiva por Stack. Máximo de 10 Stacks. Ao permanecer 2 turnos sem realizar ações ofensivas, o Monge entra em concentração. Seu próximo ataque recebe +20% de Dano, +5% de Chance de Crítico e causa 3× o dano normal."
        },

        Bardo: {
            name: "Harmonia Crescente",
            description:
                "Sempre que o Bardo aplica um efeito positivo diferente em um aliado, recebe 1 Stack de Harmonia. Cada Stack aumenta em 2% a duração dos efeitos positivos aplicados pelo Bardo. Máximo de 10 Stacks = +20% de duração. Aliados afetados pelo efeito Dança recebem +50% de Resistência enquanto o efeito durar. Ao atingir 10, o próximo efeito positivo aplicado pelo Bardo é transformado em uma Sinfonia, sendo aplicado simultaneamente a todos os aliados dentro do alcance e recebendo +50% de potência."
        },

        Invocador: {
            name: "Vínculo de Invocação",
            description:
                "Cada invocação que permanecer em campo durante 1 turno completo concede 1 Stack de Vínculo. Cada Stack concede +2% de ATK às invocações. Máximo de 10 Stacks = +20% de ATK. No nível 20, desbloqueia o Pacto Supremo: durante 2 turnos, pode manter até 3 seres invocados simultaneamente, cada um com uma afinidade diferente. As invocações recebem 3× ATK durante o Pacto Supremo."
        },

        Oraculo: {
            name: "Visão do Destino",
            description:
                "Sempre que um aliado sofrer dano ou receber um efeito negativo, o Oráculo recebe 1 Stack de Presságio. Cada Stack concede +1% de Esquiva e +1% de Resistência a efeitos negativos. Máximo de 10 Stacks. Ao atingir 10, durante 1 turno todos os aliados recebem +50% de Esquiva e +50% de Resistência a efeitos negativos. Antes de qualquer batalha, o Oráculo prevê o confronto 1 turno antes, aplicando Preparação a si mesmo e aos aliados. Durante o primeiro turno da batalha, os aliados sob Preparação recebem +20% de Resistência a efeitos negativos e +10% de Esquiva."
        },

        Druida: {
            name: "Ciclo Natural",
            description:
                "Cada vez que o Druida utiliza uma habilidade de uma afinidade diferente da anterior, recebe 1 Stack de Natureza. Ao atingir o máximo, o Druida pode transferir seu próprio MP para aliados, funcionando como uma fonte de suporte de MP."
        },

        Duelista: {
            name: "Ritmo do Duelo",
            description:
                "O Duelista mantém seu ritmo de combate através da sequência de ataques e confrontos individuais. A mecânica detalhada do Ritmo do Duelo será aplicada pelo sistema de combate."
        },

        /* -------------------------------------------------
           ALIAS / FUNÇÃO DE BUFFER-HEALER
        ------------------------------------------------- */

        "Buffer/Healer": {
            name: "Lago da Vida",
            description:
                "Concede +5% de ATK a todos os aliados por 3 turnos. Se o buff Lago da Vida for removido antes de terminar, todos os aliados são curados em 10% do HP máximo. Após curar 10% do HP de cada aliado, o Buffer/Healer impõe o efeito Cura Milagrosa a todos os aliados por 2 turnos. Enquanto o efeito estiver ativo, se o HP de um aliado estiver abaixo de 50%, ele é curado completamente."
        }

    };


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        configurarBotoes();

        configurarEditor();

        atualizar();

    }


    /* =====================================================
       BOTÕES DE COMBATE
    ===================================================== */

    function configurarBotoes() {

        const buttons =
            document.querySelectorAll(
                ".combat-use-button"
            );


        buttons.forEach(button => {

            if (
                button.dataset.combatModuleConfigured ===
                "true"
            ) {

                return;

            }


            button.dataset.combatModuleConfigured =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    const action =
                        button.dataset.action;


                    if (
                        action ===
                        "basic-attack"
                    ) {

                        usarAtaqueBasico();

                    }


                    else if (
                        action ===
                        "counterattack"
                    ) {

                        usarContraAtaque();

                    }


                    else if (
                        action ===
                        "ability"
                    ) {

                        const index =
                            Number(
                                button.dataset
                                    .abilityIndex
                            );


                        usarHabilidade(index);

                    }

                }
            );

        });

    }


    /* =====================================================
       ATAQUE BÁSICO
    ===================================================== */

    function usarAtaqueBasico() {

        const custo = 1;


        if (
            character.resources.est <
            custo
        ) {

            registrar(
                "EST insuficiente para o ataque básico."
            );


            return;

        }


        character.resources.est -=
            custo;


        const name =
            character.combat
                .basicAttackName ||
            "Ataque básico";


        registrar(
            `${name} usado. −1 EST.`
        );


        atualizar();

        salvarPersonagem();


        if (typeof window.SistemaDano !== "undefined") {
            window.SistemaDano.registrarDano("fisico", name);
        }

        aplicarEfeitoAtaque();

    }


    /* =====================================================
       CONTRA-ATAQUE
    ===================================================== */

    function usarContraAtaque() {

        const custo = 3;


        if (
            character.resources.est <
            custo
        ) {

            registrar(
                "EST insuficiente para o contra-ataque."
            );


            return;

        }


        character.resources.est -=
            custo;


        registrar(
            "Contra-ataque realizado. −3 EST."
        );


        atualizar();

        salvarPersonagem();


        if (typeof window.SistemaDano !== "undefined") {
            window.SistemaDano.registrarDano("fisico", "Contra-ataque");
        }

        aplicarEfeitoContraAtaque();

    }


    /* =====================================================
       HABILIDADES
    ===================================================== */

    function usarHabilidade(index) {

        const abilities =
            character.combat &&
            Array.isArray(
                character.combat.abilities
            )
                ? character.combat.abilities
                : [];


        const ability =
            abilities[index];


        if (!ability) {

            return;

        }


        const name =
            String(
                ability.name || ""
            ).trim();


        if (!name) {

            registrar(
                `Habilidade ${index + 1} ainda não foi configurada.`
            );


            return;

        }


        const cost =
            limitarNumero(
                ability.cost,
                0
            );


        const type =
            ability.costType === "est"
                ? "est"
                : "mp";


        if (
            type === "mp"
        ) {

            if (
                character.resources.mp <
                cost
            ) {

                registrar(
                    `${name}: MP insuficiente.`
                );


                return;

            }


            character.resources.mp -=
                cost;


            registrar(
                `${name} usada. −${cost} MP.`
            );

        }


        else {

            if (
                character.resources.est <
                cost
            ) {

                registrar(
                    `${name}: EST insuficiente.`
                );


                return;

            }


            character.resources.est -=
                cost;


            registrar(
                `${name} usada. −${cost} EST.`
            );

        }


        atualizar();

        salvarPersonagem();


        if (typeof window.SistemaDano !== "undefined") {
            window.SistemaDano.registrarDano("magico", name);
        }

        aplicarEfeitoHabilidade();

    }


    /* =====================================================
       EDITOR DE COMBATE
    ===================================================== */

    function configurarEditor() {

        configurarAtaqueBasico();

        configurarHabilidades();

        configurarPassiva();

    }


    /* =====================================================
       ATAQUE BÁSICO — EDITOR
    ===================================================== */

    function configurarAtaqueBasico() {

        const input =
            get(
                "basic-attack-name"
            );


        if (!input) {

            return;

        }


        if (
            input.dataset.combatEditorConfigured ===
            "true"
        ) {

            return;

        }


        input.dataset.combatEditorConfigured =
            "true";


        input.value =
            character.combat
                .basicAttackName ||
            "Ataque básico";


        input.addEventListener(
            "input",
            () => {

                character.combat
                    .basicAttackName =
                    input.value;


                salvarPersonagem();


                atualizar();

            }
        );

    }


    /* =====================================================
       HABILIDADES — EDITOR
    ===================================================== */

    function configurarHabilidades() {

        const cards =
            document.querySelectorAll(
                ".ability-card"
            );


        cards.forEach(card => {

            const index =
                Number(
                    card.dataset.abilityIndex
                );


            const ability =
                character.combat
                    .abilities[index];


            if (!ability) {

                return;

            }


            const nameInput =
                card.querySelector(
                    ".ability-name-input"
                );


            const costType =
                card.querySelector(
                    ".ability-cost-type"
                );


            const costInput =
                card.querySelector(
                    ".ability-cost-input"
                );


            const descriptionInput =
                card.querySelector(
                    ".ability-description-input"
                );


            /* ---------------------------------------------
               NOME
            --------------------------------------------- */

            if (nameInput) {

                if (
                    nameInput.dataset.combatEditorConfigured !==
                    "true"
                ) {

                    nameInput.dataset.combatEditorConfigured =
                        "true";


                    nameInput.value =
                        ability.name;


                    nameInput.addEventListener(
                        "input",
                        () => {

                            ability.name =
                                nameInput.value;


                            salvarPersonagem();

                        }
                    );

                }

            }


            /* ---------------------------------------------
               TIPO DE CUSTO
            --------------------------------------------- */

            if (costType) {

                if (
                    costType.dataset.combatEditorConfigured !==
                    "true"
                ) {

                    costType.dataset.combatEditorConfigured =
                        "true";


                    costType.value =
                        ability.costType;


                    costType.addEventListener(
                        "change",
                        () => {

                            ability.costType =
                                costType.value;


                            salvarPersonagem();

                        }
                    );

                }

            }


            /* ---------------------------------------------
               CUSTO
            --------------------------------------------- */

            if (costInput) {

                if (
                    costInput.dataset.combatEditorConfigured !==
                    "true"
                ) {

                    costInput.dataset.combatEditorConfigured =
                        "true";


                    costInput.value =
                        ability.cost;


                    costInput.addEventListener(
                        "input",
                        () => {

                            ability.cost =
                                limitarNumero(
                                    costInput.value,
                                    0
                                );


                            salvarPersonagem();

                        }
                    );

                }

            }


            /* ---------------------------------------------
               DESCRIÇÃO
            --------------------------------------------- */

            if (descriptionInput) {

                if (
                    descriptionInput.dataset.combatEditorConfigured !==
                    "true"
                ) {

                    descriptionInput.dataset.combatEditorConfigured =
                        "true";


                    descriptionInput.value =
                        ability.description;


                    descriptionInput.addEventListener(
                        "input",
                        () => {

                            ability.description =
                                descriptionInput.value;


                            salvarPersonagem();

                        }
                    );

                }

            }

        });

    }


    /* =====================================================
       PASSIVA — EDITOR
    ===================================================== */

    function configurarPassiva() {

        const nameInput =
            get("passive-name");


        const descriptionInput =
            get(
                "passive-description"
            );


        if (nameInput) {

            if (
                nameInput.dataset.combatEditorConfigured !==
                "true"
            ) {

                nameInput.dataset.combatEditorConfigured =
                    "true";


                nameInput.value =
                    character.combat
                        .passive.name;


                nameInput.addEventListener(
                    "input",
                    () => {

                        character.combat
                            .passive.name =
                            nameInput.value;


                        salvarPersonagem();

                    }
                );

            }

        }


        if (descriptionInput) {

            if (
                descriptionInput.dataset.combatEditorConfigured !==
                "true"
            ) {

                descriptionInput.dataset.combatEditorConfigured =
                    "true";


                descriptionInput.value =
                    character.combat
                        .passive.description;


                descriptionInput.addEventListener(
                    "input",
                    () => {

                        character.combat
                            .passive.description =
                            descriptionInput.value;


                        salvarPersonagem();

                    }
                );

            }

        }

    }


    /* =====================================================
       PASSIVA DE CLASSE
    ===================================================== */

    function obterClasseAtual() {

        let classe = "";


        const select =
            get(
                "character-class-select"
            );


        if (select) {

            classe =
                String(
                    select.value || ""
                ).trim();

        }


        if (
            !classe &&
            character &&
            character.class
        ) {

            classe =
                String(
                    character.class
                ).trim();

        }


        return classe;

    }


    function normalizarClasse(
        classe
    ) {

        return String(
            classe || ""
        )
            .trim()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );

    }


    function obterPassivaDeClasse() {

        const classe =
            obterClasseAtual();


        if (!classe) {

            return {

                name:
                    "Passiva de Classe",

                description:
                    "Selecione uma classe para visualizar a Passiva de Classe."

            };

        }


        const classeNormalizada =
            normalizarClasse(
                classe
            );


        const chave =
            Object.keys(
                PASSIVAS_DE_CLASSE
            )
                .find(
                    nome =>
                        normalizarClasse(
                            nome
                        ) ===
                        classeNormalizada
                );


        if (!chave) {

            return {

                name:
                    "Passiva de Classe",

                description:
                    "A Passiva de Classe desta classe ainda não foi cadastrada."

            };

        }


        return {
            name:
                PASSIVAS_DE_CLASSE[chave]
                    .name,

            description:
                PASSIVAS_DE_CLASSE[chave]
                    .description,

            className:
                classe

        };

    }


    function atualizarPassivaDeClasse() {

        const passive =
            obterPassivaDeClasse();


        definirTexto(
            "class-passive-name",
            passive.name
        );


        definirTexto(
            "class-passive-description",
            passive.description
        );


        definirTexto(
            "class-passive-class",
            passive.className ||
            obterClasseAtual()
        );


        return passive;

    }


    /* =====================================================
       LOG
    ===================================================== */

    function registrar(message) {

        if (
            !character.combat.log
        ) {

            character.combat.log = [];

        }


        character.combat.log.unshift(
            message
        );


        character.combat.log =
            character.combat.log.slice(
                0,
                20
            );


        atualizarLog();


        salvarPersonagem();

    }


    function atualizarLog() {

        const log =
            get("combat-log");


        if (!log) {

            return;

        }


        if (
            !character.combat.log ||
            !character.combat.log.length
        ) {

            log.innerHTML =
                "<p>Nenhuma ação realizada.</p>";


            return;

        }


        log.innerHTML =
            character.combat.log
                .map(
                    entry =>
                        `<p>${escaparHTML(entry)}</p>`
                )
                .join("");

    }


    /* =====================================================
       ATUALIZAR
    ===================================================== */

    function atualizar() {

        if (!character) {

            return;

        }


        definirTexto(
            "combat-mp",
            character.resources.mp
        );


        definirTexto(
            "combat-est",
            character.resources.est
        );


        atualizarLog();

        sincronizarEditor();

        atualizarPassivaDeClasse();

    }


    /* =====================================================
       SINCRONIZAR EDITOR
    ===================================================== */

    function sincronizarEditor() {

        const basic =
            get("basic-attack-name");


        if (
            basic &&
            document.activeElement !==
            basic
        ) {

            basic.value =
                character.combat
                    .basicAttackName ||
                "Ataque básico";

        }


        const cards =
            document.querySelectorAll(
                ".ability-card"
            );


        cards.forEach(card => {

            const index =
                Number(
                    card.dataset.abilityIndex
                );


            const ability =
                character.combat
                    .abilities[index];


            if (!ability) {

                return;

            }


            const name =
                card.querySelector(
                    ".ability-name-input"
                );


            const type =
                card.querySelector(
                    ".ability-cost-type"
                );


            const cost =
                card.querySelector(
                    ".ability-cost-input"
                );


            const description =
                card.querySelector(
                    ".ability-description-input"
                );


            if (
                name &&
                document.activeElement !==
                name
            ) {

                name.value =
                    ability.name;

            }


            if (type) {

                type.value =
                    ability.costType;

            }


            if (
                cost &&
                document.activeElement !==
                cost
            ) {

                cost.value =
                    ability.cost;

            }


            if (
                description &&
                document.activeElement !==
                description
            ) {

                description.value =
                    ability.description;

            }

        });


        const passiveName =
            get("passive-name");


        const passiveDescription =
            get(
                "passive-description"
            );


        if (
            passiveName &&
            document.activeElement !==
            passiveName
        ) {

            passiveName.value =
                character.combat
                    .passive.name;

        }


        if (
            passiveDescription &&
            document.activeElement !==
            passiveDescription
        ) {

            passiveDescription.value =
                character.combat
                    .passive.description;

        }

    }


    /* =====================================================
       EFEITOS VISUAIS
    ===================================================== */

    function aplicarEfeitoAtaque() {

        const card =
            document.querySelector(
                ".character-card"
            );


        if (!card) {

            return;

        }


        card.classList.remove(
            "combat-attack-effect"
        );


        void card.offsetWidth;


        card.classList.add(
            "combat-attack-effect"
        );

    }


    function aplicarEfeitoContraAtaque() {

        const card =
            document.querySelector(
                ".character-card"
            );


        if (!card) {

            return;

        }


        card.classList.remove(
            "combat-counter-effect"
        );


        void card.offsetWidth;


        card.classList.add(
            "combat-counter-effect"
        );

    }


    function aplicarEfeitoHabilidade() {

        const card =
            document.querySelector(
                ".character-card"
            );


        if (!card) {

            return;

        }


        card.classList.remove(
            "combat-ability-effect"
        );


        void card.offsetWidth;


        card.classList.add(
            "combat-ability-effect"
        );

    }


    /* =====================================================
       UTILIDADES INTERNAS
    ===================================================== */

    function get(id) {

        return document.getElementById(id);

    }


    function definirTexto(
        id,
        value
    ) {

        const element =
            get(id);


        if (element) {

            element.textContent =
                value;

        }

    }


    function limitarNumero(
        valor,
        minimo = 0
    ) {

        const numero =
            Number(valor);


        if (
            Number.isNaN(numero)
        ) {

            return minimo;

        }


        return Math.max(
            minimo,
            numero
        );

    }


    function escaparHTML(
        text
    ) {

        return String(text)
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


    /* =====================================================
       API
    ===================================================== */

    return {

        iniciar,

        atualizar,

        usarAtaqueBasico,

        usarContraAtaque,

        usarHabilidade,

        registrar,

        atualizarLog,

        obterClasseAtual,

        obterPassivaDeClasse,

        atualizarPassivaDeClasse

    };

})();
