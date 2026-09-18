/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: SISTEMA PRINCIPAL / ORQUESTRADOR
========================================================= */


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const STORAGE_KEY = "rpg_character_card";


/* =========================================================
   ELEMENTOS
========================================================= */

const ELEMENTS = {

    agua: {
        name: "Água",
        symbol: "💧"
    },

    luz: {
        name: "Luz",
        symbol: "☀️"
    },

    terra: {
        name: "Terra",
        symbol: "🪨"
    },

    trevas: {
        name: "Trevas",
        symbol: "🌑"
    },

    vento: {
        name: "Vento",
        symbol: "🌪️"
    },

    fogo: {
        name: "Fogo",
        symbol: "🔥"
    },

    fisico: {
        name: "Físico",
        symbol: "💪"
    },

    magico: {
        name: "Mágico",
        symbol: "✨"
    }

};


/* =========================================================
   BRASÕES
========================================================= */

const CRESTS = {

    agua: {
        symbol: "🐺",
        guardian: "Guardião do Lobo"
    },

    luz: {
        symbol: "🐯",
        guardian: "Guardião do Tigre"
    },

    terra: {
        symbol: "🐻",
        guardian: "Guardião do Urso"
    },

    trevas: {
        symbol: "🦊",
        guardian: "Guardião da Raposa"
    },

    vento: {
        symbol: "🦅",
        guardian: "Guardião da Águia"
    },

    fogo: {
        symbol: "🐉",
        guardian: "Guardião do Dragão"
    },

    fisico: {
        symbol: "🦣",
        guardian: "Guardião do Mamute"
    },

    magico: {
        symbol: "🦉",
        guardian: "Guardião da Coruja"
    }

};


/* =========================================================
   ESTÁGIOS DO BRASÃO
========================================================= */

const CREST_STAGES = [

    {
        xp: 0,
        name: "SEM NENHUM"
    },

    {
        xp: 3000,
        name: "INICIAL"
    },

    {
        xp: 6000,
        name: "LEVE"
    },

    {
        xp: 9000,
        name: "PEQUENO"
    },

    {
        xp: 12000,
        name: "MÉDIO"
    },

    {
        xp: 15000,
        name: "GRANDE"
    },

    {
        xp: 20000,
        name: "PESADO"
    },

    {
        xp: 25000,
        name: "ARCANO"
    },

    {
        xp: 50000,
        name: "EXTRA"
    }

];


/* =========================================================
   ESTADO PADRÃO
========================================================= */

function criarEstadoInicial() {

    const race =
        CharacterModule.RACES["Humano"];


    return {

        confirmed: false,

        name: "Personagem",

        race: "Humano",

        class: "Guerreiro",

        affinity: null,

        level: 1,

        xp: 0,

        crestXP: 0,

        crestMilestones: 0,

        imageURL: "",


        /* =================================================
           NECESSIDADES
        ================================================= */

        needs: {

            hunger: 100,

            thirst: 100

        },


        /* =================================================
           RECURSOS
        ================================================= */

        resources: {

            hp: race.hp,

            mp: race.mp,

            est: race.est,

            sanidade: race.sanidade

        },


        /* =================================================
           ATRIBUTOS
        ================================================= */

        attributes: {

            atk: race.atk,

            atkMgc: race.atkMgc,

            def: race.def,

            res: race.res,

            agi: race.agi,

            int: race.int

        },


        attributePoints: 3,


        /* =================================================
           COMBATE
        ================================================= */

        combat: {

            basicAttackName: "Ataque básico",

            abilities: [

                {
                    name: "",
                    costType: "mp",
                    cost: 0,
                    description: ""
                },

                {
                    name: "",
                    costType: "mp",
                    cost: 0,
                    description: ""
                },

                {
                    name: "",
                    costType: "mp",
                    cost: 0,
                    description: ""
                }

            ],

            passive: {

                name: "",

                description: ""

            },

            log: []

        },


        /* =================================================
           INVENTÁRIO
        ================================================= */

        inventory: {

            items: [],

            equipment: {

                weapon: "",

                armor: "",

                accessory: "",

                relic: ""

            }

        }

    };

}


/* =========================================================
   CARREGAR ESTADO
========================================================= */

let character =
    carregarPersonagem();


function carregarPersonagem() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {

        return criarEstadoInicial();

    }


    try {

        const data =
            JSON.parse(saved);


        const base =
            criarEstadoInicial();


        const personagem =
            mesclarObjetos(
                base,
                data
            );


        /*
           Compatibilidade com personagens
           criados antes do sistema de Fome/Sede.
        */

        if (
            !personagem.needs ||
            typeof personagem.needs !== "object"
        ) {

            personagem.needs = {

                hunger: 100,

                thirst: 100

            };

        }


        if (
            typeof personagem.needs.hunger !==
            "number"
        ) {

            personagem.needs.hunger =
                100;

        }


        if (
            typeof personagem.needs.thirst !==
            "number"
        ) {

            personagem.needs.thirst =
                100;

        }


        personagem.needs.hunger =
            Math.max(
                0,
                Math.min(
                    100,
                    personagem.needs.hunger
                )
            );


        personagem.needs.thirst =
            Math.max(
                0,
                Math.min(
                    100,
                    personagem.needs.thirst
                )
            );


        return personagem;

    }

    catch (error) {

        console.error(
            "Erro ao carregar personagem:",
            error
        );


        return criarEstadoInicial();

    }

}


/* =========================================================
   MERGE
========================================================= */

function mesclarObjetos(
    base,
    extra
) {

    for (
        const key in extra
    ) {

        if (
            extra[key] &&
            typeof extra[key] === "object" &&
            !Array.isArray(extra[key])
        ) {

            base[key] =
                mesclarObjetos(
                    base[key] || {},
                    extra[key]
                );

        }

        else {

            base[key] =
                extra[key];

        }

    }


    return base;

}


/* =========================================================
   SALVAR
========================================================= */

function salvarPersonagem() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(character)
    );


}
/* =========================================================
   UTILIDADES
========================================================= */

function get(id) {

    return document.getElementById(id);

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


/* =========================================================
   NECESSIDADES — FOME E SEDE
========================================================= */

function obterFome() {

    if (
        !character.needs
    ) {

        character.needs = {

            hunger: 100,

            thirst: 100

        };

    }


    return character.needs.hunger;

}


function obterSede() {

    if (
        !character.needs
    ) {

        character.needs = {

            hunger: 100,

            thirst: 100

        };

    }


    return character.needs.thirst;

}


/* =========================================================
   ALTERAR FOME
========================================================= */

function definirFome(valor) {

    if (
        !character.needs
    ) {

        character.needs = {

            hunger: 100,

            thirst: 100

        };

    }


    character.needs.hunger =
        Math.max(
            0,
            Math.min(
                100,
                Number(valor) || 0
            )
        );


    salvarPersonagem();

}


/* =========================================================
   ALTERAR SEDE
========================================================= */

function definirSede(valor) {

    if (
        !character.needs
    ) {

        character.needs = {

            hunger: 100,

            thirst: 100

        };

    }


    character.needs.thirst =
        Math.max(
            0,
            Math.min(
                100,
                Number(valor) || 0
            )
        );


    salvarPersonagem();

}


/* =========================================================
   MODIFICAR FOME
========================================================= */

function alterarFome(valor) {

    definirFome(
        obterFome() +
        Number(valor || 0)
    );

}


/* =========================================================
   MODIFICAR SEDE
========================================================= */

function alterarSede(valor) {

    definirSede(
        obterSede() +
        Number(valor || 0)
    );

}


/* =========================================================
   ESTADO DA NECESSIDADE
========================================================= */

function obterEstadoNecessidade(
    valor
) {

    if (
        valor <= 0
    ) {

        return "CRÍTICO";

    }


    if (
        valor <= 20
    ) {

        return "MUITO BAIXO";

    }


    if (
        valor <= 40
    ) {

        return "BAIXO";

    }


    if (
        valor <= 60
    ) {

        return "MODERADO";

    }


    if (
        valor <= 80
    ) {

        return "BOM";

    }


    return "EXCELENTE";

}


/* =========================================================
   CONFIRMAÇÃO DO PERSONAGEM
========================================================= */

function configurarConfirmacaoPersonagem() {

    const existente =
        get("character-confirmation-panel");


    if (existente) {

        atualizarInterfaceConfirmacao();

        return;

    }


    const editor =
        document.querySelector(
            ".character-editor"
        );


    if (!editor) {

        setTimeout(
            configurarConfirmacaoPersonagem,
            500
        );

        return;

    }


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "character-confirmation-panel";


    Object.assign(
        panel.style,
        {
            marginTop: "18px",
            padding: "15px",
            borderRadius: "14px",
            border: "1px solid #6f3aa8",
            background: "rgba(124, 58, 237, 0.07)",
            textAlign: "center"
        }
    );


    editor.insertAdjacentElement(
        "afterend",
        panel
    );


    atualizarInterfaceConfirmacao();

}


/* =========================================================
   ATUALIZAR CONFIRMAÇÃO
========================================================= */

function atualizarInterfaceConfirmacao() {

    const panel =
        get(
            "character-confirmation-panel"
        );


    if (!panel) {

        return;

    }


    if (
        character.confirmed === true
    ) {

        panel.innerHTML = `

            <div
                style="
                    color:#86efac;
                    font-weight:bold;
                    font-size:14px;
                    letter-spacing:1px;
                "
            >
                ✓ PERSONAGEM CONFIRMADO
            </div>

            <div
                style="
                    margin-top:7px;
                    color:#8f839d;
                    font-size:10px;
                    line-height:1.5;
                "
            >
                Nome, raça, classe e afinidade estão bloqueados.
            </div>

            <button
                id="continue-campaign-button"
                type="button"
                style="
                    width:100%;
                    margin-top:15px;
                    padding:13px;
                    border:1px solid #8b5cf6;
                    border-radius:11px;
                    background:
                        linear-gradient(
                            135deg,
                            #241633,
                            #171020
                        );
                    color:#e9d5ff;
                    font-weight:bold;
                    cursor:pointer;
                    font-size:12px;
                    letter-spacing:1px;
                    box-shadow:
                        0 0 15px rgba(139,92,246,0.18);
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease,
                        border-color 0.2s ease;
                "
            >
                🎲 CONTINUAR CAMPANHA
            </button>

        `;


        const continueButton =
            get(
                "continue-campaign-button"
            );


        if (continueButton) {

            continueButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();


                    continueButton.style.transform =
                        "scale(0.98)";


                    setTimeout(
                        function () {

                            continueButton.style.transform =
                                "";

                            irParaMesa();

                        },
                        100
                    );

                }
            );


            continueButton.addEventListener(
                "mouseenter",
                function () {

                    continueButton.style.borderColor =
                        "#a855f7";

                    continueButton.style.boxShadow =
                        "0 0 22px rgba(168,85,247,0.3)";

                }
            );


            continueButton.addEventListener(
                "mouseleave",
                function () {

                    continueButton.style.borderColor =
                        "#8b5cf6";

                    continueButton.style.boxShadow =
                        "0 0 15px rgba(139,92,246,0.18)";

                }
            );

        }


        return;

    }


    panel.innerHTML = `

        <div
            style="
                color:#c084fc;
                font-weight:bold;
                font-size:12px;
                letter-spacing:1px;
                margin-bottom:7px;
            "
        >
            PERSONAGEM AINDA NÃO CONFIRMADO
        </div>

        <div
            style="
                color:#8f839d;
                font-size:10px;
                line-height:1.5;
                margin-bottom:12px;
            "
        >
            Confira nome, raça, classe e afinidade
            antes de confirmar.
        </div>

        <button
            id="confirm-character-button"
            type="button"
            style="
                width:100%;
                padding:12px;
                border:1px solid #8b5cf6;
                border-radius:11px;
                background:#1b1424;
                color:#e9d5ff;
                font-weight:bold;
                cursor:pointer;
                font-size:12px;
                letter-spacing:1px;
            "
        >
            ✓ CONFIRMAR PERSONAGEM
        </button>

    `;


    const button =
        get(
            "confirm-character-button"
        );


    if (button) {

        button.addEventListener(
            "click",
            confirmarPersonagem
        );

    }

}


/* =========================================================
   APLICAR BLOQUEIO DAS DEFINIÇÕES
========================================================= */

function aplicarBloqueioDefinicoes() {

    if (
        typeof CharacterModule ===
        "undefined"
    ) {

        return;

    }


    if (
        typeof CharacterModule.atualizarBloqueioDefinicoes ===
        "function"
    ) {

        CharacterModule.atualizarBloqueioDefinicoes();

    }

}


/* =========================================================
   TELA DE TRANSIÇÃO PARA A MESA
========================================================= */

function criarTransicaoMesa() {

    let tela =
        get("rpg-table-transition");


    if (tela) {

        return tela;

    }


    tela =
        document.createElement(
            "div"
        );


    tela.id =
        "rpg-table-transition";


    Object.assign(
        tela.style,
        {
            position: "fixed",
            inset: "0",
            zIndex: "99999",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "25px",
            background:
                "radial-gradient(circle at center, #241044 0%, #0a0712 45%, #030208 100%)",
            color: "#f5f0ff",
            fontFamily: "Arial, sans-serif",
            textAlign: "center",
            opacity: "0",
            transition: "opacity 0.45s ease"
        }
    );


    tela.innerHTML = `

        <div
            style="
                width:min(90vw,420px);
            "
        >

            <div
                style="
                    font-size:52px;
                    margin-bottom:20px;
                    animation:rpgTablePulse 1.5s ease-in-out infinite;
                "
            >
                🎲
            </div>

            <div
                style="
                    font-size:19px;
                    font-weight:bold;
                    letter-spacing:2px;
                    color:#c084fc;
                "
            >
                PERSONAGEM CONFIRMADO
            </div>

            <div
                style="
                    margin-top:12px;
                    font-size:13px;
                    color:#b9a9c8;
                "
            >
                Preparando a mesa...
            </div>

            <div
                style="
                    margin-top:22px;
                    width:100%;
                    height:4px;
                    overflow:hidden;
                    border-radius:10px;
                    background:rgba(255,255,255,0.08);
                "
            >

                <div
                    style="
                        width:35%;
                        height:100%;
                        border-radius:10px;
                        background:linear-gradient(
                            90deg,
                            transparent,
                            #a855f7,
                            #e9d5ff,
                            #a855f7,
                            transparent
                        );
                        animation:rpgTableLoading 1.4s linear infinite;
                    "
                ></div>

            </div>

            <div
                style="
                    margin-top:18px;
                    font-size:9px;
                    letter-spacing:2px;
                    color:#75687f;
                "
            >
                CONECTANDO À MESA ONLINE
            </div>

        </div>

    `;


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "rpg-table-transition-style";


    style.textContent = `

        @keyframes rpgTablePulse {

            0%,
            100% {
                transform:scale(1);
                opacity:0.75;
            }

            50% {
                transform:scale(1.12);
                opacity:1;
            }

        }


        @keyframes rpgTableLoading {

            from {
                transform:translateX(-180%);
            }

            to {
                transform:translateX(380%);
            }

        }


        @keyframes rpgTableScreenIn {

            from {
                opacity:0;
                transform:scale(1.015);
            }

            to {
                opacity:1;
                transform:scale(1);
            }

        }

    `;


    document.head.appendChild(
        style
    );


    document.body.appendChild(
        tela
    );


    requestAnimationFrame(
        function () {

            tela.style.opacity =
                "1";

        }
    );


    return tela;

}


/* =========================================================
   CRIAR TELA DA MESA
========================================================= */

function criarTelaMesa() {

    let tela =
        get("rpg-table-screen");


    if (tela) {

        return tela;

    }


    tela =
        document.createElement(
            "div"
        );


    tela.id =
        "rpg-table-screen";


    Object.assign(
        tela.style,
        {
            position: "fixed",
            inset: "0",
            zIndex: "99990",
            display: "none",
            overflow: "auto",
            background:
                "#030208",
            opacity: "0"
        }
    );


    document.body.appendChild(
        tela
    );


    return tela;

}


/* =========================================================
   MOSTRAR MESA COMO NOVA TELA
========================================================= */

function mostrarMesaComoTela() {

    const mesa =
        get(
            "online-table-panel"
        );


    if (!mesa) {

        return false;

    }


    const tela =
        criarTelaMesa();


    tela.appendChild(
        mesa
    );


    mesa.style.animation =
        "rpgTableScreenIn 0.45s ease";


    tela.style.display =
        "block";


    requestAnimationFrame(
        function () {

            tela.style.opacity =
                "1";

        }
    );


    document.body.style.overflow =
        "hidden";


    return true;

}


/* =========================================================
   IR PARA A MESA
========================================================= */

function irParaMesa() {

    const transicao =
        criarTransicaoMesa();


    let tentativas =
        0;


    const limite =
        40;


    const mesaExistente =
        get(
            "online-table-panel"
        );


    if (mesaExistente) {

        setTimeout(
            function () {

                const sucesso =
                    mostrarMesaComoTela();


                if (!sucesso) {

                    return;

                }


                transicao.style.opacity =
                    "0";


                setTimeout(
                    function () {

                        if (
                            transicao.parentNode
                        ) {

                            transicao.remove();

                        }

                    },
                    500
                );

            },
            500
        );


        return;

    }


    const procurarMesa =
        setInterval(
            function () {

                tentativas++;


                const mesa =
                    get(
                        "online-table-panel"
                    );


                if (mesa) {

                    clearInterval(
                        procurarMesa
                    );


                    setTimeout(
                        function () {

                            const sucesso =
                                mostrarMesaComoTela();


                            if (!sucesso) {

                                return;

                            }


                            transicao.style.opacity =
                                "0";


                            setTimeout(
                                function () {

                                    if (
                                        transicao.parentNode
                                    ) {

                                        transicao.remove();

                                    }

                                },
                                500
                            );

                        },
                        900
                    );


                    return;

                }


                if (
                    tentativas >= limite
                ) {

                    clearInterval(
                        procurarMesa
                    );


                    transicao.innerHTML = `

                        <div
                            style="
                                width:min(90vw,420px);
                            "
                        >

                            <div
                                style="
                                    font-size:42px;
                                    margin-bottom:15px;
                                "
                            >
                                ⚠️
                            </div>

                            <div
                                style="
                                    color:#fca5a5;
                                    font-weight:bold;
                                    font-size:15px;
                                "
                            >
                                A MESA AINDA NÃO ESTÁ PRONTA
                            </div>

                            <div
                                style="
                                    margin-top:10px;
                                    color:#8f839d;
                                    font-size:11px;
                                    line-height:1.6;
                                "
                            >
                                O personagem foi confirmado,
                                mas a Mesa não respondeu a tempo.
                            </div>

                            <button
                                id="retry-table-button"
                                type="button"
                                style="
                                    margin-top:20px;
                                    width:100%;
                                    padding:12px;
                                    border:1px solid #8b5cf6;
                                    border-radius:11px;
                                    background:#1b1424;
                                    color:#e9d5ff;
                                    font-weight:bold;
                                    cursor:pointer;
                                "
                            >
                                TENTAR NOVAMENTE
                            </button>

                        </div>

                    `;


                    const retry =
                        get(
                            "retry-table-button"
                        );


                    if (retry) {

                        retry.addEventListener(
                            "click",
                            function () {

                                transicao.remove();

                                irParaMesa();

                            }
                        );

                    }

                }

            },
            250
        );

}


/* =========================================================
   CONFIRMAR PERSONAGEM
========================================================= */

function confirmarPersonagem() {

    if (
        character.confirmed === true
    ) {

        return;

    }


    const confirmar =
        window.confirm(
            "Deseja confirmar este personagem?\n\nDepois da confirmação, Nome, Raça, Classe e Afinidade não poderão mais ser alterados."
        );


    if (!confirmar) {

        return;

    }


    character.confirmed =
        true;


    salvarPersonagem();


    aplicarBloqueioDefinicoes();


    atualizarInterface();


    atualizarInterfaceConfirmacao();


    aplicarBloqueioDefinicoes();


    if (
        typeof mostrarResultadoSupabase ===
        "function"
    ) {

        mostrarResultadoSupabase(
            "✓ PERSONAGEM CONFIRMADO — PREPARANDO A MESA...",
            "sucesso"
        );

    }


    setTimeout(
        irParaMesa,
        250
    );

}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function configurarNavegacao() {

    const buttons =
        document.querySelectorAll(
            ".dimension-button"
        );


    const sections =
        document.querySelectorAll(
            "[data-dimension-content]"
        );


    buttons.forEach(button => {

        if (
            button.dataset.navigationConfigured ===
            "true"
        ) {

            return;

        }


        button.dataset.navigationConfigured =
            "true";


        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                const dimension =
                    button.dataset.dimension;


                buttons.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                sections.forEach(section => {

                    section.classList.remove(
                        "active"
                    );

                });


                button.classList.add(
                    "active"
                );


                const target =
                    document.querySelector(
                        `[data-dimension-content="${dimension}"]`
                    );


                if (target) {

                    target.classList.add(
                        "active"
                    );

                }

            }
        );

    });

}


/* =========================================================
   MODO MESTRE
========================================================= */

function configurarModoMestre() {

    const button =
        get("master-button");


    const controls =
        get("master-controls");


    if (
        !button ||
        !controls
    ) {

        return;

    }


    if (
        button.dataset.masterConfigured ===
        "true"
    ) {

        return;

    }


    button.dataset.masterConfigured =
        "true";


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            controls.classList.toggle(
                "active"
            );

        }
    );

}


/* =========================================================
   XP DO PERSONAGEM
========================================================= */

function adicionarXP(valor) {

    CharacterModule.adicionarXP(
        valor
    );

}


function removerXP(valor) {

    CharacterModule.removerXP(
        valor
    );

}


/* =========================================================
   CONTROLES DE XP DO MESTRE
========================================================= */

function configurarXP() {

    const amount =
        get("xp-amount");


    const add =
        get("add-xp");


    const remove =
        get("remove-xp");


    if (add) {

        if (
            add.dataset.xpConfigured !==
            "true"
        ) {

            add.dataset.xpConfigured =
                "true";


            add.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    adicionarXP(
                        amount
                            ? amount.value
                            : 0
                    );

                }
            );

        }

    }


    if (remove) {

        if (
            remove.dataset.xpConfigured !==
            "true"
        ) {

            remove.dataset.xpConfigured =
                "true";


            remove.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    removerXP(
                        amount
                            ? amount.value
                            : 0
                    );

                }
            );

        }

    }


    const crestAmount =
        get("crest-xp-amount");


    const addCrest =
        get("add-crest-xp");


    const removeCrest =
        get("remove-crest-xp");


    if (addCrest) {

        if (
            addCrest.dataset.crestXPConfigured !==
            "true"
        ) {

            addCrest.dataset.crestXPConfigured =
                "true";


            addCrest.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    adicionarXPDoBrasao(
                        crestAmount
                            ? crestAmount.value
                            : 0
                    );

                }
            );

        }

    }


    if (removeCrest) {

        if (
            removeCrest.dataset.crestXPConfigured !==
            "true"
        ) {

            removeCrest.dataset.crestXPConfigured =
                "true";


            removeCrest.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    removerXPDoBrasao(
                        crestAmount
                            ? crestAmount.value
                            : 0
                    );

                }
            );

        }

    }

}


/* =========================================================
   XP DO BRASÃO
========================================================= */

function adicionarXPDoBrasao(
    valor
) {

    valor =
        limitarNumero(
            valor,
            0
        );


    character.crestXP +=
        valor;


    atualizarInterface();

    salvarPersonagem();

}


function removerXPDoBrasao(
    valor
) {

    valor =
        limitarNumero(
            valor,
            0
        );


    character.crestXP =
        Math.max(
            0,
            character.crestXP - valor
        );


    atualizarInterface();

    salvarPersonagem();

}


/* =========================================================
   MARCOS DO BRASÃO
========================================================= */

function atualizarMarcosBrasao(
    nivelAntes,
    nivelDepois
) {

    const marcoAntes =
        Math.floor(
            nivelAntes / 5
        );


    const marcoDepois =
        Math.floor(
            nivelDepois / 5
        );


    if (
        marcoDepois >
        marcoAntes
    ) {

        const diferenca =
            marcoDepois -
            marcoAntes;


        character.crestXP +=
            diferenca * 500;

    }

}


/* =========================================================
   RESET
========================================================= */

function configurarReset() {

    const button =
        get("reset-character");


    if (!button) {

        return;

    }


    if (
        button.dataset.resetConfigured ===
        "true"
    ) {

        return;

    }


    button.dataset.resetConfigured =
        "true";


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            const confirmar =
                window.confirm(
                    "Deseja realmente resetar o personagem?"
                );


            if (!confirmar) {

                return;

            }


            character =
                criarEstadoInicial();


            salvarPersonagem();


            atualizarInterface();


            atualizarInterfaceConfirmacao();


            aplicarBloqueioDefinicoes();


            StatusModule.iniciar();

            CharacterModule.atualizarImagem();


            if (
                typeof CombatModule !==
                "undefined"
            ) {

                CombatModule.iniciar();

            }


            if (
                typeof InventoryModule !==
                "undefined"
            ) {

                InventoryModule.iniciar();

            }

        }
    );

}


/* =========================================================
   BRASÃO
========================================================= */

function obterEstagioBrasao() {

    let stage =
        CREST_STAGES[0];


    for (
        const current of CREST_STAGES
    ) {

        if (
            character.crestXP >=
            current.xp
        ) {

            stage = current;

        }

    }


    return stage;

}


/* =========================================================
   ATUALIZAR BRASÃO
========================================================= */

function atualizarBrasao() {

    const stage =
        obterEstagioBrasao();


    const stageElement =
        get("crest-stage");


    const crestXP =
        get("crest-xp");


    const progress =
        get("crest-xp-progress");


    const symbol =
        get("crest-symbol");


    if (stageElement) {

        stageElement.textContent =
            stage.name;

    }


    if (crestXP) {

        crestXP.textContent =
            `${character.crestXP} XP`;

    }


    let nextStage = null;


    for (
        const current of CREST_STAGES
    ) {

        if (
            current.xp >
            character.crestXP
        ) {

            nextStage =
                current;


            break;

        }

    }


    if (progress) {

        if (!nextStage) {

            progress.style.width =
                "100%";

        }

        else {

            const previousStage =
                stage.xp;


            const total =
                nextStage.xp -
                previousStage;


            const current =
                character.crestXP -
                previousStage;


            const percentage =
                Math.min(
                    100,
                    Math.max(
                        0,
                        (
                            current /
                            total
                        ) * 100
                    )
                );


            progress.style.width =
                `${percentage}%`;

        }

    }


    if (
        symbol &&
        character.affinity &&
        CRESTS[
            character.affinity
        ]
    ) {

        symbol.textContent =
            CRESTS[
                character.affinity
            ].symbol;

    }

}


/* =========================================================
   TESTE DE LEITURA DO SUPABASE
========================================================= */

async function testarLeituraPersonagemSupabase() {

    mostrarResultadoSupabase(
        "🔎 Testando conexão com o Supabase...",
        "info"
    );


    console.log(
        "========== TESTE SUPABASE =========="
    );


    if (
        !window.supabaseClient
    ) {

        console.error(
            "❌ window.supabaseClient não existe."
        );


        mostrarResultadoSupabase(
            "❌ Supabase não foi inicializado.",
            "erro"
        );


        return;

    }


    console.log(
        "✅ supabaseClient encontrado."
    );


    if (
        !window.rpgAuth
    ) {

        console.error(
            "❌ window.rpgAuth não existe."
        );


        mostrarResultadoSupabase(
            "❌ Sistema de autenticação ainda não foi carregado.",
            "erro"
        );


        return;

    }


    console.log(
        "rpgAuth:",
        window.rpgAuth
    );


    if (
        !window.rpgAuth.user
    ) {

        console.warn(
            "⚠️ rpgAuth existe, mas nenhum usuário foi encontrado."
        );


        mostrarResultadoSupabase(
            "⚠️ Usuário não encontrado na sessão do Supabase.",
            "aviso"
        );


        return;

    }


    console.log(
        "✅ Usuário encontrado:",
        window.rpgAuth.user.id
    );


    if (
        !window.rpgAuth.campaign
    ) {

        console.warn(
            "⚠️ Usuário encontrado, mas campanha não foi encontrada."
        );


        mostrarResultadoSupabase(
            "⚠️ Usuário autenticado, mas nenhuma campanha foi encontrada.",
            "aviso"
        );


        return;

    }


    console.log(
        "✅ Campanha encontrada:",
        window.rpgAuth.campaign
    );


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("characters")
                .select(
                    "id, name, race, class, affinity, level, xp, crest_xp, attribute_points, sanity, hp, mp, est"
                )
                .eq(
                    "campaign_id",
                    window.rpgAuth.campaign.id
                )
                .eq(
                    "user_id",
                    window.rpgAuth.user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "❌ Erro retornado pelo Supabase:",
                error
            );


            mostrarResultadoSupabase(
                `❌ Supabase respondeu com erro: ${error.message}`,
                "erro"
            );


            return;

        }


        if (!data) {

            console.warn(
                "⚠️ Consulta funcionou, mas nenhum personagem foi encontrado."
            );


            mostrarResultadoSupabase(
                "⚠️ Conexão funcionando, mas nenhum personagem foi encontrado para esta conta/campanha.",
                "aviso"
            );


            return;

        }


        console.log(
            "✅ PERSONAGEM ENCONTRADO:",
            data
        );


        mostrarResultadoSupabase(
            `✅ SUPABASE OK — ${data.name} | LV. ${data.level}`,
            "sucesso"
        );


    }

    catch (error) {

        console.error(
            "❌ Falha inesperada:",
            error
        );


        mostrarResultadoSupabase(
            "❌ Falha inesperada ao consultar o Supabase.",
            "erro"
        );

    }

}


/* =========================================================
   RESULTADO VISUAL DO TESTE
========================================================= */

function mostrarResultadoSupabase(
    texto,
    tipo = "info"
) {

    const existente =
        get("supabase-test-result");


    if (existente) {

        existente.textContent =
            texto;


        if (
            tipo === "sucesso"
        ) {

            existente.style.color =
                "#86efac";

        }

        else if (
            tipo === "erro"
        ) {

            existente.style.color =
                "#fca5a5";

        }

        else if (
            tipo === "aviso"
        ) {

            existente.style.color =
                "#fde68a";

        }

        else {

            existente.style.color =
                "#c4b5fd";

        }


        return;

    }


    const mensagem =
        document.createElement(
            "div"
        );


    mensagem.id =
        "supabase-test-result";


    mensagem.textContent =
        texto;


    Object.assign(
        mensagem.style,
        {
            position: "fixed",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "9998",
            width: "min(92vw, 500px)",
            padding: "12px 15px",
            borderRadius: "12px",
            background: "rgba(11, 9, 16, 0.97)",
            border: "1px solid #6f3aa8",
            boxShadow: "0 0 20px rgba(124, 58, 237, 0.25)",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            color: "#c4b5fd"
        }
    );


    document.body.appendChild(
        mensagem
    );

}


/* =========================================================
   INTERFACE PRINCIPAL
========================================================= */

function atualizarInterface() {

    const name =
        get("character-name");


    if (name) {

        name.textContent =
            character.name;

    }


    const race =
        get("character-race");


    if (race) {

        race.textContent =
            character.race;

    }


    const classElement =
        get("character-class");


    if (classElement) {

        classElement.textContent =
            character.class;

    }


    const level =
        get("character-level");


    if (level) {

        level.textContent =
            `LV. ${character.level}`;

    }


    const xpText =
        get("character-xp-text");


    const xpProgress =
        get("character-xp-progress");


    const xpNeeded =
        CharacterModule.obterXPNecessario(
            character.level
        );


    if (xpText) {

        if (
            character.level >= 30
        ) {

            xpText.textContent =
                "NÍVEL MÁXIMO";

        }

        else {

            xpText.textContent =
                `${character.xp} / ${xpNeeded}`;

        }

    }


    if (xpProgress) {

        const percentage =
            character.level >= 30
                ? 100
                : (
                    character.xp /
                    xpNeeded
                ) * 100;


        xpProgress.style.width =
            `${Math.min(
                100,
                percentage
            )}%`;

    }


    atualizarBrasao();


    StatusModule.atualizarStatus();


    if (
        typeof CombatModule !==
        "undefined"
    ) {

        CombatModule.atualizar();

    }


    if (
        typeof InventoryModule !==
        "undefined"
    ) {

        InventoryModule.atualizar();

    }


    CharacterModule.atualizarImagem();


    CharacterModule.sincronizarEditor();


    aplicarBloqueioDefinicoes();


    atualizarInterfaceConfirmacao();


    CharacterModule.atualizarImagem();

    StatusModule.aplicarEfeitoElemental();


    StatusModule.configurarEstadoElementos();

}


/* =========================================================
   TEXTO
========================================================= */

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


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function iniciar() {

    /* =================================================
       CONFIGURAÇÕES BÁSICAS — SEMPRE EXECUTAM
    ================================================= */
    try {
        configurarNavegacao();
    } catch (erro) {
        console.error("❌ Erro ao configurar navegação:", erro);
    }

    try {
        configurarModoMestre();
    } catch (erro) {
        console.error("❌ Erro ao configurar modo mestre:", erro);
    }


    /* =================================================
       DEMAIS CONFIGURAÇÕES — COM PROTEÇÃO
    ================================================= */
    try {

        CharacterModule.configurarEditor();


        configurarConfirmacaoPersonagem();


        StatusModule.iniciar();


        configurarXP();


        configurarReset();


        if (
            typeof CombatModule !==
            "undefined"
        ) {

            CombatModule.iniciar();

        }


        if (
            typeof InventoryModule !==
            "undefined"
        ) {

            InventoryModule.iniciar();

        }


        atualizarInterface();


    console.log(
        "🚀 Sistema iniciado. Aguardando autenticação..."
    );


    let tentativas =
        0;


    const verificarSupabase =
        setInterval(
            () => {

                tentativas++;


                console.log(
                    `🔎 Verificação Supabase ${tentativas}/60`,
                    {
                        supabase:
                            !!window.supabaseClient,

                        rpgAuth:
                            !!window.rpgAuth,

                        user:
                            !!(
                                window.rpgAuth &&
                                window.rpgAuth.user
                            ),

                        campaign:
                            !!(
                                window.rpgAuth &&
                                window.rpgAuth.campaign
                            )
                    }
                );


                if (
                    window.supabaseClient &&
                    window.rpgAuth &&
                    window.rpgAuth.user &&
                    window.rpgAuth.campaign
                ) {

                    clearInterval(
                        verificarSupabase
                    );


                    testarLeituraPersonagemSupabase();


                    return;

                }


                if (
                    tentativas === 10
                ) {

                    if (
                        !window.supabaseClient
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Supabase ainda não foi inicializado.",
                            "erro"
                        );

                    }

                    else if (
                        !window.rpgAuth
                    ) {

                        mostrarResultadoSupabase(
                            "⏳ Supabase carregado. Aguardando sistema de autenticação...",
                            "info"
                        );

                    }

                    else if (
                        !window.rpgAuth.user
                    ) {

                        mostrarResultadoSupabase(
                            "⏳ Aguardando usuário autenticado...",
                            "info"
                        );

                    }

                    else if (
                        !window.rpgAuth.campaign
                    ) {

                        mostrarResultadoSupabase(
                            "⏳ Usuário encontrado. Aguardando campanha...",
                            "info"
                        );

                    }

                }


                if (
                    tentativas >= 60
                ) {

                    clearInterval(
                        verificarSupabase
                    );


                    console.error(
                        "❌ Diagnóstico Supabase encerrado após 15 segundos."
                    );


                    if (
                        !window.supabaseClient
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Diagnóstico: Supabase não foi carregado.",
                            "erro"
                        );

                    }

                    else if (
                        !window.rpgAuth
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Diagnóstico: auth.js não criou window.rpgAuth.",
                            "erro"
                        );

                    }

                    else if (
                        !window.rpgAuth.user
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Diagnóstico: usuário não está disponível na sessão.",
                            "erro"
                        );

                    }

                    else if (
                        !window.rpgAuth.campaign
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Diagnóstico: usuário existe, mas a campanha não foi carregada.",
                            "erro"
                        );

                    }

                }

            },
            250
        );

    } catch (erro) {
        console.error("❌ Erro durante inicialização:", erro);
        alert("Houve um erro ao carregar o sistema. Verifique o console para detalhes.");
    }

}


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);
