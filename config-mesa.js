/* ==========================================
   MESA ONLINE — RPG
   CONFIGURAÇÕES DA MESA
========================================== */

"use strict";

(function () {

    let settingsButton = null;
    let masterMenu = null;
    let masterButtons = [];
    let jogadorMenu = null;


    /* ========================================================
       INICIALIZAÇÃO
    ======================================================== */

    function inicializarConfigMesa() {

        settingsButton =
            document.getElementById(
                "btn-configuracoes"
            );

        masterMenu =
            document.getElementById(
                "master-menu"
            );

        masterButtons =
            Array.from(
                document.querySelectorAll(
                    "[data-master-action]"
                )
            );


        if (!settingsButton) {

            console.warn(
                "[Config Mesa] Botão #btn-configuracoes não encontrado."
            );

            return;
        }


        if (!masterMenu) {

            console.warn(
                "[Config Mesa] Menu #master-menu não encontrado."
            );

            return;
        }


        registrarEventos();


        settingsButton.hidden = false;


        atualizarMenuPorUsuario();


        console.log(
            "[Config Mesa] Sistema de configurações inicializado."
        );

    }



    /* ========================================================
       IDENTIFICAÇÃO DO USUÁRIO
    ======================================================== */

    function usuarioEhMestre() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.usuarioEhMestre ===
            "function"

        ) {

            return !!window.MesaRPG.usuarioEhMestre();

        }


        return false;

    }


    function usuarioEhJogador() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.usuarioEhJogador ===
            "function"

        ) {

            return !!window.MesaRPG.usuarioEhJogador();

        }


        return false;

    }



    /* ========================================================
       EVENTOS
    ======================================================== */

    function registrarEventos() {


        /* ----------------------------------------------
           BOTÃO DE CONFIGURAÇÕES
        ---------------------------------------------- */

        settingsButton.addEventListener(

            "click",

            function (event) {

                event.preventDefault();

                event.stopPropagation();


                alternarMenuConfiguracoes();

            }

        );



        /* ----------------------------------------------
           AÇÕES DO MESTRE
        ---------------------------------------------- */

        masterButtons.forEach(

            function (button) {

                button.addEventListener(

                    "click",

                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const acao =
                            button.dataset.masterAction;


                        executarAcaoMestre(
                            acao
                        );

                    }

                );

            }

        );



        /* ----------------------------------------------
           CLIQUE FORA DO MENU
        ---------------------------------------------- */

        document.addEventListener(

            "click",

            function (event) {

                fecharSeClicouFora(
                    event
                );

            }

        );



        /* ----------------------------------------------
           TOQUE / POINTER FORA DO MENU
        ---------------------------------------------- */

        document.addEventListener(

            "pointerdown",

            function (event) {

                fecharSeClicouFora(
                    event
                );

            },

            true

        );



        /* ----------------------------------------------
           ESC
        ---------------------------------------------- */

        document.addEventListener(

            "keydown",

            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    fecharMenuConfiguracoes();

                }

            }

        );



        /* ----------------------------------------------
           MESA INICIALIZADA
        ---------------------------------------------- */

        document.addEventListener(

            "mesa:inicializada",

            function () {

                settingsButton.hidden = false;

                atualizarMenuPorUsuario();

            }

        );



        /* ----------------------------------------------
           CAMPANHA ALTERADA
        ---------------------------------------------- */

        document.addEventListener(

            "mesa:campanhaAlterada",

            function () {

                settingsButton.hidden = false;

                atualizarMenuPorUsuario();

            }

        );



        /* ----------------------------------------------
           JOGADORES ATUALIZADOS
        ---------------------------------------------- */

        document.addEventListener(

            "mesa:jogadoresAtualizados",

            function () {

                atualizarMenuPorUsuario();

            }

        );

    }



    /* ========================================================
       DETECTAR CLIQUE / TOQUE FORA DO CONTEÚDO DO MENU
    ======================================================== */

    function fecharSeClicouFora(
        event
    ) {

        if (

            !masterMenu ||

            masterMenu.hidden

        ) {

            return;

        }


        const alvo =
            event.target;


        /*
         IMPORTANTE:

         #master-menu pode ser o overlay inteiro
         que cobre a tela.

         Por isso não usamos:

             masterMenu.contains(alvo)

         pois isso faria qualquer toque no overlay
         ser considerado "dentro do menu".

         O conteúdo real do menu é:
             .master-menu-content
        */

        const menuContent =
            masterMenu.querySelector(
                ".master-menu-content"
            );


        const clicouNoConteudo =
            menuContent &&
            menuContent.contains(
                alvo
            );


        const clicouNoBotao =
            settingsButton &&
            settingsButton.contains(
                alvo
            );


        /*
         Se tocou no conteúdo do menu:
         mantém aberto.

         Se tocou no botão:
         mantém o comportamento do botão.

         Qualquer outra área:
         fecha.
        */

        if (

            !clicouNoConteudo &&

            !clicouNoBotao

        ) {

            fecharMenuConfiguracoes();

        }

    }



    /* ========================================================
       MENU DE CONFIGURAÇÕES
    ======================================================== */

    function abrirMenuConfiguracoes() {

        if (!masterMenu) {
            return;
        }


        atualizarMenuPorUsuario();


        masterMenu.hidden = false;

    }


    function fecharMenuConfiguracoes() {

        if (!masterMenu) {
            return;
        }


        masterMenu.hidden = true;

    }


    function alternarMenuConfiguracoes() {

        if (!masterMenu) {
            return;
        }


        if (masterMenu.hidden) {

            abrirMenuConfiguracoes();

        } else {

            fecharMenuConfiguracoes();

        }

    }



    /* ========================================================
       COMPATIBILIDADE — MENU DO MESTRE
    ======================================================== */

    function abrirMenuMestre() {

        if (!usuarioEhMestre()) {
            return;
        }


        abrirMenuConfiguracoes();

    }


    function fecharMenuMestre() {

        fecharMenuConfiguracoes();

    }


    function alternarMenuMestre() {

        if (!usuarioEhMestre()) {
            return;
        }


        alternarMenuConfiguracoes();

    }



    /* ========================================================
       ATUALIZAR MENU POR USUÁRIO
    ======================================================== */

    function atualizarMenuPorUsuario() {

        if (!masterMenu) {
            return;
        }


        const ehMestre =
            usuarioEhMestre();


        const ehJogador =
            usuarioEhJogador();


        /* ----------------------------------------------
           BOTÕES DO MESTRE
        ---------------------------------------------- */

        masterButtons.forEach(

            function (button) {

                button.hidden =
                    !ehMestre;

            }

        );



        /* ----------------------------------------------
           MENU DO JOGADOR
        ---------------------------------------------- */

        if (!jogadorMenu) {

            jogadorMenu =
                document.getElementById(
                    "config-jogador"
                );

        }


        if (!jogadorMenu) {

            jogadorMenu =
                criarMenuJogador();

        }


        if (ehMestre) {

            jogadorMenu.hidden = true;

        } else {

            jogadorMenu.hidden = false;

        }



        /* ----------------------------------------------
           TÍTULO
        ---------------------------------------------- */

        const titulo =
            masterMenu.querySelector(
                "h2"
            );


        if (titulo) {

            if (ehMestre) {

                titulo.textContent =
                    "⚙️ Configurações do Mestre";

            } else if (ehJogador) {

                titulo.textContent =
                    "⚙️ Configurações do Jogador";

            } else {

                titulo.textContent =
                    "⚙️ Configurações";

            }

        }

    }



    /* ========================================================
       CRIAR MENU DO JOGADOR
    ======================================================== */

    function criarMenuJogador() {

        const menuContent =
            masterMenu.querySelector(
                ".master-menu-content"
            );


        const novoMenu =
            document.createElement(
                "div"
            );


        novoMenu.id =
            "config-jogador";


        novoMenu.className =
            "config-jogador";


        novoMenu.innerHTML = `

            <div class="config-jogador-title">
                👤 Jogador
            </div>

            <div class="config-jogador-actions">

                <button
                    type="button"
                    data-player-config-action="ficha"
                >
                    📜 Meu personagem
                </button>

                <button
                    type="button"
                    data-player-config-action="atualizar"
                >
                    🔄 Atualizar mesa
                </button>

                <button
                    type="button"
                    data-player-config-action="fechar"
                >
                    ✕ Fechar
                </button>

            </div>

        `;


        if (menuContent) {

            menuContent.appendChild(
                novoMenu
            );

        } else {

            masterMenu.appendChild(
                novoMenu
            );

        }


        const buttons =
            novoMenu.querySelectorAll(
                "[data-player-config-action]"
            );


        buttons.forEach(

            function (button) {

                button.addEventListener(

                    "click",

                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const acao =
                            button.dataset.playerConfigAction;


                        executarAcaoJogador(
                            acao
                        );

                    }

                );

            }

        );


        return novoMenu;

    }



    /* ========================================================
       AÇÕES DO JOGADOR
    ======================================================== */

    function executarAcaoJogador(
        acao
    ) {

        switch (acao) {

            case "ficha":

                abrirFichaJogador();

                break;


            case "atualizar":

                atualizarMesa();

                break;


            case "fechar":

                fecharMenuConfiguracoes();

                break;


            default:

                console.warn(
                    "[Config Mesa] Ação de jogador desconhecida:",
                    acao
                );

        }

    }



    /* ========================================================
       ABRIR FICHA DO JOGADOR
    ======================================================== */

    function abrirFichaJogador() {

        fecharMenuConfiguracoes();


        if (

            typeof window.abrirFichaJogador ===
            "function"

        ) {

            const slot =

                window.MesaRPG &&

                typeof window.MesaRPG.obterSlotAtual ===
                "function"

                    ?

                window.MesaRPG.obterSlotAtual()

                    :

                null;


            window.abrirFichaJogador(
                slot
            );

            return;

        }


        console.warn(
            "[Config Mesa] Função abrirFichaJogador() não está disponível."
        );

    }



    /* ========================================================
       ATUALIZAR MESA
    ======================================================== */

    function atualizarMesa() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.atualizarAssentos ===
            "function"

        ) {

            window.MesaRPG.atualizarAssentos();

        }


        document.dispatchEvent(

            new CustomEvent(
                "mesa:atualizarSolicitado"
            )

        );


        fecharMenuConfiguracoes();

    }



    /* ========================================================
       AÇÕES DO MESTRE
    ======================================================== */

    function executarAcaoMestre(
        acao
    ) {

        if (!usuarioEhMestre()) {

            console.warn(
                "[Config Mesa] Ação bloqueada: usuário não é Mestre."
            );

            return;

        }


        fecharMenuConfiguracoes();


        switch (acao) {

            case "mapa":

                abrirMapa();

                break;


            case "dungeon":

                abrirDungeon();

                break;


            case "combate":

                iniciarCombate();

                break;


            case "boss":

                iniciarBoss();

                break;


            case "cte":

                iniciarCTE();

                break;


            default:

                console.warn(
                    "[Config Mesa] Ação do Mestre desconhecida:",
                    acao
                );

                break;

        }

    }



    /* ========================================================
       MAPA
    ======================================================== */

    function abrirMapa() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.abrirAventura ===
            "function"

        ) {

            window.MesaRPG.abrirAventura(
                "mapa"
            );

            return;

        }


        console.warn(
            "[Config Mesa] MesaRPG.abrirAventura() não está disponível."
        );

    }



    /* ========================================================
       DUNGEON
    ======================================================== */

    function abrirDungeon() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.abrirAventura ===
            "function"

        ) {

            window.MesaRPG.abrirAventura(
                "dungeon"
            );

            return;

        }


        console.warn(
            "[Config Mesa] MesaRPG.abrirAventura() não está disponível."
        );

    }



    /* ========================================================
       COMBATE
    ======================================================== */

    function iniciarCombate() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.iniciarBatalha ===
            "function"

        ) {

            window.MesaRPG.iniciarBatalha();

            return;

        }


        console.warn(
            "[Config Mesa] MesaRPG.iniciarBatalha() não está disponível."
        );

    }



    /* ========================================================
       BOSS
    ======================================================== */

    function iniciarBoss() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.iniciarBoss ===
            "function"

        ) {

            window.MesaRPG.iniciarBoss();

            return;

        }


        console.warn(
            "[Config Mesa] MesaRPG.iniciarBoss() não está disponível."
        );

    }



    /* ========================================================
       CTE
    ======================================================== */

    function iniciarCTE() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.iniciarCTE ===
            "function"

        ) {

            window.MesaRPG.iniciarCTE();

            return;

        }


        console.warn(
            "[Config Mesa] MesaRPG.iniciarCTE() não está disponível."
        );

    }



    /* ========================================================
       ATUALIZAÇÃO DA PERMISSÃO
    ======================================================== */

    function atualizarPermissaoMestre() {

        if (!settingsButton) {
            return;
        }


        settingsButton.hidden = false;


        atualizarMenuPorUsuario();

    }



    /* ========================================================
       API PÚBLICA
    ======================================================== */

    window.ConfigMesa = {

        abrirMenuConfiguracoes,

        fecharMenuConfiguracoes,

        alternarMenuConfiguracoes,

        abrirMenuMestre,

        fecharMenuMestre,

        alternarMenuMestre,

        atualizarPermissaoMestre,

        executarAcaoMestre,

        executarAcaoJogador

    };



    /* ========================================================
       DOM READY
    ======================================================== */

    if (

        document.readyState ===
        "loading"

    ) {

        document.addEventListener(

            "DOMContentLoaded",

            inicializarConfigMesa

        );

    } else {

        inicializarConfigMesa();

    }

})();
