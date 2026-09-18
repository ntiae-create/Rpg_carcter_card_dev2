/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: INVENTÁRIO
========================================================= */

const InventoryModule = (() => {

    /* =====================================================
       CONFIGURAÇÕES
    ===================================================== */

    const BASE_SLOTS = 50;

    const EXTRA_SLOTS_PER_LEVEL_BLOCK = 50;

    const LEVEL_BLOCK = 10;


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        garantirInventario();

        configurarInterface();

        configurarEquipamentos();

        atualizar();

    }


    /* =====================================================
       GARANTIR ESTRUTURA
    ===================================================== */

    function garantirInventario() {

        if (!character.inventory) {

            character.inventory = {

                items: [],

                equipment: {

                    weapon: "",

                    armor: "",

                    accessory: "",

                    relic: ""

                }

            };

        }


        if (
            !Array.isArray(
                character.inventory.items
            )
        ) {

            character.inventory.items = [];

        }


        if (
            !character.inventory.equipment
        ) {

            character.inventory.equipment = {

                weapon: "",

                armor: "",

                accessory: "",

                relic: ""

            };

        }

    }


    /* =====================================================
       CAPACIDADE
    ===================================================== */

    function obterCapacidade() {

        const level =
            Number(character.level) || 1;


        const blocos =
            Math.floor(
                level / LEVEL_BLOCK
            );


        return (
            BASE_SLOTS +
            (
                blocos *
                EXTRA_SLOTS_PER_LEVEL_BLOCK
            )
        );

    }


    /* =====================================================
       CONFIGURAR INTERFACE
    ===================================================== */

    function configurarInterface() {

        configurarBotaoAdicionar();

        configurarFormulario();

    }


    /* =====================================================
       BOTÃO ADICIONAR
    ===================================================== */

    function configurarBotaoAdicionar() {

        const button =
            get("inventory-add-button");


        if (!button) {

            return;

        }


        if (
            button.dataset
                .inventoryConfigured ===
            "true"
        ) {

            return;

        }


        button.dataset
            .inventoryConfigured =
            "true";


        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                const capacidade =
                    obterCapacidade();


                if (
                    character.inventory.items
                        .length >= capacidade
                ) {

                    return;

                }


                abrirFormulario();

            }
        );

    }


    /* =====================================================
       FORMULÁRIO
    ===================================================== */

    function configurarFormulario() {

        const form =
            get("inventory-form");


        if (!form) {

            return;

        }


        if (
            form.dataset
                .inventoryConfigured ===
            "true"
        ) {

            return;

        }


        form.dataset
            .inventoryConfigured =
            "true";


        const cancel =
            get(
                "inventory-cancel-button"
            );


        const nameInput =
            get(
                "inventory-item-name"
            );


        const quantityInput =
            get(
                "inventory-item-quantity"
            );


        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                event.stopPropagation();


                const sucesso =
                    adicionarItem(

                        nameInput
                            ? nameInput.value
                            : "",

                        quantityInput
                            ? quantityInput.value
                            : 1

                    );


                if (sucesso) {

                    fecharFormulario();

                }

            }
        );


        if (cancel) {

            cancel.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    fecharFormulario();

                }
            );

        }

    }


    /* =====================================================
       ABRIR FORMULÁRIO
    ===================================================== */

    function abrirFormulario() {

        const form =
            get("inventory-form");


        if (!form) {

            return;

        }


        form.classList.add(
            "active"
        );


        const nameInput =
            get(
                "inventory-item-name"
            );


        const quantityInput =
            get(
                "inventory-item-quantity"
            );


        if (nameInput) {

            nameInput.value = "";

        }


        if (quantityInput) {

            quantityInput.value = 1;

        }


        if (nameInput) {

            setTimeout(
                () => {

                    nameInput.focus();

                },
                50
            );

        }

    }


    /* =====================================================
       FECHAR FORMULÁRIO
    ===================================================== */

    function fecharFormulario() {

        const form =
            get("inventory-form");


        if (!form) {

            return;

        }


        form.classList.remove(
            "active"
        );

    }


    /* =====================================================
       EQUIPAMENTOS
    ===================================================== */

    function configurarEquipamentos() {

        const fields = {

            weapon:
                get("equipment-weapon"),

            armor:
                get("equipment-armor"),

            accessory:
                get("equipment-accessory"),

            relic:
                get("equipment-relic")

        };


        Object.entries(fields)
            .forEach(
                ([type, field]) => {

                    if (!field) {

                        return;

                    }


                    if (
                        field.dataset
                            .inventoryConfigured ===
                        "true"
                    ) {

                        return;

                    }


                    field.dataset
                        .inventoryConfigured =
                        "true";


                    field.value =
                        character.inventory
                            .equipment[type] ||
                        "";


                    field.addEventListener(
                        "input",
                        () => {

                            character.inventory
                                .equipment[type] =
                                field.value;


                            salvarPersonagem();

                        }
                    );

                }
            );

    }


    /* =====================================================
       ADICIONAR ITEM
    ===================================================== */

    function adicionarItem(
        nome,
        quantidade = 1
    ) {

        garantirInventario();


        nome =
            String(nome || "")
                .trim();


        quantidade =
            Number(quantidade);


        if (
            !nome ||
            !Number.isFinite(
                quantidade
            ) ||
            quantidade <= 0
        ) {

            return false;

        }


        quantidade =
            Math.floor(
                quantidade
            );


        if (
            quantidade < 1
        ) {

            return false;

        }


        const capacidade =
            obterCapacidade();


        if (
            character.inventory.items
                .length >= capacidade
        ) {

            return false;

        }


        /*
           Se o item já existe,
           apenas aumenta sua quantidade.
        */

        const itemExistente =
            character.inventory.items
                .find(
                    item =>
                        String(
                            item.name
                        ).toLowerCase() ===
                        nome.toLowerCase()
                );


        if (itemExistente) {

            itemExistente.quantity =
                (
                    Number(
                        itemExistente.quantity
                    ) || 0
                ) + quantidade;

        }

        else {

            character.inventory.items
                .push({

                    name: nome,

                    quantity: quantidade

                });

        }


        atualizar();

        salvarPersonagem();


        return true;

    }


    /* =====================================================
       REMOVER ITEM
    ===================================================== */

    function removerItem(index) {

        garantirInventario();


        index =
            Number(index);


        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >=
            character.inventory.items
                .length
        ) {

            return false;

        }


        character.inventory.items
            .splice(index, 1);


        atualizar();

        salvarPersonagem();


        return true;

    }


    /* =====================================================
       ALTERAR QUANTIDADE
    ===================================================== */

    function alterarQuantidade(
        index,
        quantidade
    ) {

        garantirInventario();


        index =
            Number(index);


        const item =
            character.inventory.items[
                index
            ];


        if (!item) {

            return false;

        }


        quantidade =
            Number(quantidade);


        if (
            !Number.isFinite(
                quantidade
            )
        ) {

            return false;

        }


        quantidade =
            Math.floor(
                quantidade
            );


        if (
            quantidade <= 0
        ) {

            removerItem(index);

            return true;

        }


        item.quantity =
            quantidade;


        atualizar();

        salvarPersonagem();


        return true;

    }


    /* =====================================================
       AUMENTAR QUANTIDADE
    ===================================================== */

    function aumentarQuantidade(
        index
    ) {

        garantirInventario();


        const item =
            character.inventory.items[
                index
            ];


        if (!item) {

            return;

        }


        alterarQuantidade(
            index,
            (
                Number(
                    item.quantity
                ) || 0
            ) + 1
        );

    }


    /* =====================================================
       DIMINUIR QUANTIDADE
    ===================================================== */

    function diminuirQuantidade(
        index
    ) {

        garantirInventario();


        const item =
            character.inventory.items[
                index
            ];


        if (!item) {

            return;

        }


        alterarQuantidade(
            index,
            (
                Number(
                    item.quantity
                ) || 0
            ) - 1
        );

    }


    /* =====================================================
       ATUALIZAR INTERFACE
    ===================================================== */

    function atualizar() {

        if (!character) {

            return;

        }


        garantirInventario();


        const capacidade =
            obterCapacidade();


        definirTexto(
            "inventory-capacity",
            capacidade
        );


        definirTexto(
            "inventory-slots",
            `${character.inventory.items.length}/${capacidade}`
        );


        atualizarBotaoAdicionar();

        atualizarLista();

        sincronizarEquipamentos();

    }


    /* =====================================================
       ESTADO DO BOTÃO ADICIONAR
    ===================================================== */

    function atualizarBotaoAdicionar() {

        const button =
            get("inventory-add-button");


        if (!button) {

            return;

        }


        const capacidade =
            obterCapacidade();


        const cheio =
            character.inventory.items
                .length >= capacidade;


        button.disabled =
            cheio;


        if (cheio) {

            button.textContent =
                "INVENTÁRIO CHEIO";

        }

        else {

            button.textContent =
                "+ ADICIONAR ITEM";

        }

    }


    /* =====================================================
       LISTA DE ITENS
    ===================================================== */

    function atualizarLista() {

        const list =
            get("inventory-list");


        if (!list) {

            return;

        }


        list.innerHTML = "";


        if (
            !character.inventory.items
                .length
        ) {

            list.innerHTML = `

                <div class="inventory-empty">

                    <span>🎒</span>

                    <p>
                        Inventário vazio.
                    </p>

                </div>

            `;


            return;

        }


        character.inventory.items
            .forEach(
                (item, index) => {

                    const element =
                        document.createElement(
                            "div"
                        );


                    element.className =
                        "inventory-item";


                    element.innerHTML = `

                        <div class="inventory-item-info">

                            <strong>
                                ${escaparHTML(
                                    item.name
                                )}
                            </strong>

                            <small>
                                Quantidade:
                                <span class="inventory-quantity">
                                    ${item.quantity}
                                </span>
                            </small>

                        </div>


                        <div class="inventory-item-actions">

                            <button
                                type="button"
                                class="inventory-quantity-button"
                                data-action="decrease"
                            >
                                −
                            </button>


                            <button
                                type="button"
                                class="inventory-quantity-button"
                                data-action="increase"
                            >
                                +
                            </button>


                            <button
                                type="button"
                                class="inventory-remove-button"
                            >
                                🗑
                            </button>

                        </div>

                    `;


                    const decrease =
                        element.querySelector(
                            '[data-action="decrease"]'
                        );


                    const increase =
                        element.querySelector(
                            '[data-action="increase"]'
                        );


                    const remove =
                        element.querySelector(
                            ".inventory-remove-button"
                        );


                    if (decrease) {

                        decrease.addEventListener(
                            "click",
                            event => {

                                event.stopPropagation();


                                diminuirQuantidade(
                                    index
                                );

                            }
                        );

                    }


                    if (increase) {

                        increase.addEventListener(
                            "click",
                            event => {

                                event.stopPropagation();


                                aumentarQuantidade(
                                    index
                                );

                            }
                        );

                    }


                    if (remove) {

                        remove.addEventListener(
                            "click",
                            event => {

                                event.stopPropagation();


                                removerItem(
                                    index
                                );

                            }
                        );

                    }


                    list.appendChild(
                        element
                    );

                }
            );

    }


    /* =====================================================
       SINCRONIZAR EQUIPAMENTOS
    ===================================================== */

    function sincronizarEquipamentos() {

        const equipment =
            character.inventory
                .equipment;


        const fields = {

            weapon:
                get(
                    "equipment-weapon"
                ),

            armor:
                get(
                    "equipment-armor"
                ),

            accessory:
                get(
                    "equipment-accessory"
                ),

            relic:
                get(
                    "equipment-relic"
                )

        };


        Object.entries(fields)
            .forEach(
                ([type, field]) => {

                    if (
                        field &&
                        document.activeElement !==
                        field
                    ) {

                        field.value =
                            equipment[type] ||
                            "";

                    }

                }
            );

    }


    /* =====================================================
       UTILIDADES
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

        obterCapacidade,

        adicionarItem,

        removerItem,

        alterarQuantidade,

        aumentarQuantidade,

        diminuirQuantidade,

        abrirFormulario,

        fecharFormulario

    };

})();
