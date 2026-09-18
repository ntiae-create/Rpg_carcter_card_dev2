/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: STATUS
========================================================= */

const StatusModule = (() => {

    /* =====================================================
       CONFIGURAÇÃO DOS ELEMENTOS
    ===================================================== */

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


    /* =====================================================
       ELEMENTO TEMPORARIAMENTE SELECIONADO
    ===================================================== */

    let elementoSelecionado = null;


    /* =====================================================
       INICIALIZAR SELEÇÃO
    ===================================================== */

    function inicializarSelecao() {

        elementoSelecionado =
            character.affinity || null;

    }


    /* =====================================================
       ATRIBUTOS
    ===================================================== */

    function configurarAtributos() {

        const buttons =
            document.querySelectorAll(
                ".attribute-plus"
            );


        buttons.forEach(button => {

            /*
               Evita registrar o mesmo evento
               mais de uma vez.
            */

            if (
                button.dataset.statusConfigured ===
                "true"
            ) {

                return;

            }


            button.dataset.statusConfigured =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    const attribute =
                        button.dataset.attribute;


                    if (
                        character.attributePoints <= 0
                    ) {

                        return;

                    }


                    if (
                        character.attributes[
                            attribute
                        ] === undefined
                    ) {

                        return;

                    }


                    character.attributes[
                        attribute
                    ]++;


                    character.attributePoints--;


                    atualizarInterface();

                    salvarPersonagem();

                }
            );

        });

    }


    /* =====================================================
       CONFIGURAR ELEMENTOS
    ===================================================== */

    function configurarElementos() {

        const options =
            document.querySelectorAll(
                ".element-option"
            );


        const confirm =
            get("confirm-element");


        options.forEach(option => {

            /*
               Evita duplicar eventos.
            */

            if (
                option.dataset.statusConfigured ===
                "true"
            ) {

                return;

            }


            option.dataset.statusConfigured =
                "true";


            option.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    /*
                       A afinidade é permanente.
                    */

                    if (character.affinity) {

                        return;

                    }


                    elementoSelecionado =
                        option.dataset.element;


                    options.forEach(item => {

                        item.classList.remove(
                            "selected"
                        );

                    });


                    option.classList.add(
                        "selected"
                    );


                    if (confirm) {

                        confirm.disabled =
                            false;

                    }

                }
            );

        });


        if (
            confirm &&
            confirm.dataset.statusConfigured !==
            "true"
        ) {

            confirm.dataset.statusConfigured =
                "true";


            confirm.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    if (
                        !elementoSelecionado
                    ) {

                        return;

                    }


                    /*
                       Não permite trocar
                       uma afinidade já confirmada.
                    */

                    if (character.affinity) {

                        return;

                    }


                    character.affinity =
                        elementoSelecionado;


                    salvarPersonagem();

                    atualizarInterface();

                    aplicarEfeitoElemental();


                    confirm.textContent =
                        "AFINIDADE CONFIRMADA";

                    confirm.disabled =
                        true;

                }
            );

        }

    }


    /* =====================================================
       EFEITO ELEMENTAL
    ===================================================== */

    function aplicarEfeitoElemental() {

        /*
           =================================================
           CARD PRINCIPAL
           =================================================
        */

        const card =
            document.querySelector(
                ".character-card"
            );


        /*
           =================================================
           REMOVE EFEITOS ANTIGOS DO CARD PRINCIPAL
           =================================================
        */

        if (card) {

            Object.keys(ELEMENTS).forEach(
                element => {

                    card.classList.remove(
                        `element-${element}`
                    );

                }
            );

        }


        /*
           =================================================
           REMOVE AFINIDADES ANTIGAS DOS 4 CARDS
           =================================================
        */

        const dimensions =
            document.querySelectorAll(
                ".dimension"
            );


        dimensions.forEach(dimension => {

            Object.keys(ELEMENTS).forEach(
                element => {

                    dimension.classList.remove(
                        `affinity-${element}`
                    );

                }

            );

        });


        /*
           =================================================
           SEM AFINIDADE
           =================================================
        */

        if (!character.affinity) {

            return;

        }


        /*
           =================================================
           AFINIDADE VÁLIDA
           =================================================
        */

        if (
            !ELEMENTS[
                character.affinity
            ]
        ) {

            return;

        }


        /*
           =================================================
           EFEITO ORIGINAL
           =================================================
        */

        if (card) {

            card.classList.add(
                `element-${character.affinity}`
            );

        }


        /*
           =================================================
           NOVO SISTEMA:
           AFINIDADE DOS 4 CARDS
           =================================================
        */

        dimensions.forEach(dimension => {

            dimension.classList.add(
                `affinity-${character.affinity}`
            );

        });

    }


    /* =====================================================
       ESTADO VISUAL DOS ELEMENTOS
    ===================================================== */

    function configurarEstadoElementos() {

        const options =
            document.querySelectorAll(
                ".element-option"
            );


        const confirm =
            get("confirm-element");


        options.forEach(option => {

            option.classList.remove(
                "selected"
            );


            if (
                character.affinity &&
                option.dataset.element ===
                character.affinity
            ) {

                option.classList.add(
                    "selected"
                );

            }

        });


        /*
           Mantém a seleção temporária
           visualmente marcada.
        */

        if (
            !character.affinity &&
            elementoSelecionado
        ) {

            options.forEach(option => {

                if (
                    option.dataset.element ===
                    elementoSelecionado
                ) {

                    option.classList.add(
                        "selected"
                    );

                }

            });

        }


        if (confirm) {

            if (character.affinity) {

                confirm.disabled =
                    true;

                confirm.textContent =
                    "AFINIDADE CONFIRMADA";

            } else {

                confirm.disabled =
                    !elementoSelecionado;

                confirm.textContent =
                    "CONFIRMAR AFINIDADE";

            }

        }

    }


    /* =====================================================
       ATUALIZAR STATUS
    ===================================================== */

    function atualizarStatus() {

        if (!character) {

            return;

        }


        /*
           Recursos
        */

        definirTexto(
            "stat-hp",
            character.resources.hp
        );

        definirTexto(
            "stat-mp",
            character.resources.mp
        );

        definirTexto(
            "stat-est",
            character.resources.est
        );

        definirTexto(
            "stat-sanidade",
            character.resources.sanidade
        );


        /*
           Atributos
        */

        definirTexto(
            "stat-atk",
            character.attributes.atk
        );

        definirTexto(
            "stat-atkMgc",
            character.attributes.atkMgc
        );

        definirTexto(
            "stat-def",
            character.attributes.def
        );

        definirTexto(
            "stat-res",
            character.attributes.res
        );

        definirTexto(
            "stat-agi",
            character.attributes.agi
        );

        definirTexto(
            "stat-int",
            character.attributes.int
        );


        /*
           Pontos disponíveis
        */

        definirTexto(
            "attribute-points",
            character.attributePoints
        );


        /*
           Afinidade mostrada no Card 1.
        */

        const affinity =
            get("character-affinity");

        const affinitySymbol =
            get(
                "character-affinity-symbol"
            );


        if (
            character.affinity &&
            ELEMENTS[
                character.affinity
            ]
        ) {

            const element =
                ELEMENTS[
                    character.affinity
                ];


            if (affinity) {

                affinity.textContent =
                    element.name;

            }


            if (affinitySymbol) {

                affinitySymbol.textContent =
                    element.symbol;

            }

        } else {

            if (affinity) {

                affinity.textContent =
                    "Nenhuma";

            }


            if (affinitySymbol) {

                affinitySymbol.textContent =
                    "?";

            }

        }

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        inicializarSelecao();

        configurarAtributos();

        configurarElementos();

        configurarEstadoElementos();

        atualizarStatus();

        aplicarEfeitoElemental();

    }


    /* =====================================================
       API
    ===================================================== */

    return {

        ELEMENTS,

        iniciar,

        configurarAtributos,

        configurarElementos,

        configurarEstadoElementos,

        atualizarStatus,

        aplicarEfeitoElemental,

        getElementoSelecionado: () => {

            return elementoSelecionado;

        }

    };

})();
