// ==========================================
// PERMISSÕES — RPG CHARACTER CARD
// ==========================================
//
// Separa a interface do MESTRE e dos JOGADORES.
//
// MESTRE:
// - Pode ver o Modo Mestre
// - Pode abrir os controles do Mestre
// - Pode ver a Mesa
//
// JOGADOR:
// - Não vê o Modo Mestre
// - Vê a Mesa
//
// ==========================================

(function () {

    "use strict";


    // ==========================================
    // ESTADO
    // ==========================================

    window.rpgPermissoes = {

        initialized: false,

        roleKnown: false,

        isMaster: false,

        isPlayer: false

    };


    // ==========================================
    // OBTER PAPEL DO USUÁRIO
    // ==========================================

    function descobrirPapel() {

        if (
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {

            return false;

        }


        const userId =
            window.rpgAuth.user.id;


        /*
            Primeira fonte:

            rpgAuth.isMaster

            Segunda fonte:

            campaign.master_id === user.id

            A segunda verificação é importante
            porque é a própria campanha que define
            quem é o Mestre.
        */

        const campanha =
            window.rpgAuth.campaign;


        const ehMestrePelaCampanha =
            campanha &&
            campanha.master_id &&
            campanha.master_id === userId;


        const ehMestrePeloAuth =
            window.rpgAuth.isMaster === true;


        const ehMestre =
            ehMestrePelaCampanha ||
            ehMestrePeloAuth;


        /*
            Só consideramos o papel conhecido
            quando temos uma campanha ou quando
            o auth já informou explicitamente que
            o usuário é mestre.

            Isso evita esconder/apresentar coisas
            durante o carregamento inicial.
        */

        if (
            campanha ||
            ehMestrePeloAuth
        ) {

            window.rpgPermissoes.isMaster =
                ehMestre;

            window.rpgPermissoes.isPlayer =
                !ehMestre;

            window.rpgPermissoes.roleKnown =
                true;

            return true;

        }


        return false;

    }


    // ==========================================
    // MODO MESTRE — ELEMENTOS
    // ==========================================

    function obterElementosModoMestre() {

        const elementos = [];


        const botao =
            document.getElementById(
                "master-button"
            );


        const controles =
            document.getElementById(
                "master-controls"
            );


        if (botao) {

            elementos.push(
                botao
            );

        }


        if (controles) {

            elementos.push(
                controles
            );

        }


        return elementos;

    }


    // ==========================================
    // ESCONDER MODO MESTRE
    // ==========================================

    function esconderModoMestre() {

        const elementos =
            obterElementosModoMestre();


        elementos.forEach(

            function (elemento) {

                elemento.style.display =
                    "none";

            }

        );

    }


    // ==========================================
    // MOSTRAR MODO MESTRE
    // ==========================================

    function mostrarModoMestre() {

        const botao =
            document.getElementById(
                "master-button"
            );


        const controles =
            document.getElementById(
                "master-controls"
            );


        /*
            O botão deve voltar ao display
            normal definido pelo CSS.
        */

        if (botao) {

            botao.style.display =
                "";

        }


        /*
            IMPORTANTE:

            Não usamos display:block nos
            controles.

            O CSS original controla:

            .master-controls
            .master-controls.active

            Portanto apenas removemos qualquer
            display inline que possa ter sido
            aplicado anteriormente.
        */

        if (controles) {

            controles.style.display =
                "";

        }

    }


    // ==========================================
    // APLICAR PERMISSÕES
    // ==========================================

    function aplicarPermissoes() {

        const papelConhecido =
            descobrirPapel();


        /*
            Se ainda não sabemos se é Mestre
            ou Jogador, mantemos o Modo Mestre
            escondido.

            Assim um jogador não vê os controles
            durante o carregamento.
        */

        if (
            !papelConhecido ||
            !window.rpgPermissoes.roleKnown
        ) {

            mostrarModoMestre();

            return false;

        }


        if (
            window.rpgPermissoes.isMaster
        ) {

            /*
                ==============================
                MESTRE
                ==============================
            */

            mostrarModoMestre();

        }

        else {

            /*
                ==============================
                JOGADOR
                ==============================
            */

            esconderModoMestre();

        }


        /*
            A Mesa NÃO é escondida.

            Mestre e jogadores devem enxergar
            a mesa.
        */


        window.rpgPermissoes.initialized =
            true;


        return true;

    }


    // ==========================================
    // ESPERAR AUTENTICAÇÃO
    // ==========================================

    function esperarAutenticacao() {

        let tentativas = 0;

        const limite = 40;


        const intervalo =
            setInterval(

                function () {

                    tentativas++;


                    if (
                        !window.rpgAuth ||
                        !window.rpgAuth.user
                    ) {

                        if (
                            tentativas >= limite
                        ) {

                            clearInterval(
                                intervalo
                            );

                        }

                        return;

                    }


                    /*
                        Tentamos descobrir o papel.

                        Pode ser que a autenticação já
                        tenha carregado a campanha ou
                        ainda esteja carregando.
                    */

                    aplicarPermissoes();


                    if (
                        window.rpgPermissoes.roleKnown
                    ) {

                        clearInterval(
                            intervalo
                        );

                    }


                    if (
                        tentativas >= limite
                    ) {

                        clearInterval(
                            intervalo
                        );

                    }

                },

                250

            );

    }


    // ==========================================
    // MONITORAR AUTENTICAÇÃO
    // ==========================================

    function monitorarAutenticacao() {

        let ultimoUsuario =
            null;

        let ultimoMestre =
            null;

        let ultimaCampanha =
            null;


        setInterval(

            function () {

                if (
                    !window.rpgAuth
                ) {

                    return;

                }


                const usuarioAtual =
                    window.rpgAuth.user?.id ||
                    null;


                const mestreAtual =
                    window.rpgAuth.isMaster === true;


                const campanhaAtual =
                    window.rpgAuth.campaign?.id ||
                    null;


                if (
                    usuarioAtual !==
                        ultimoUsuario ||
                    mestreAtual !==
                        ultimoMestre ||
                    campanhaAtual !==
                        ultimaCampanha
                ) {

                    ultimoUsuario =
                        usuarioAtual;

                    ultimoMestre =
                        mestreAtual;

                    ultimaCampanha =
                        campanhaAtual;


                    /*
                        Recalcula tudo.
                    */

                    aplicarPermissoes();

                }

            },

            500

        );

    }


    // ==========================================
    // MONITORAR ELEMENTOS CRIADOS
    // ==========================================

    function monitorarInterface() {

        const observador =
            new MutationObserver(

                function () {

                    if (
                        !window.rpgPermissoes.initialized
                    ) {

                        return;

                    }


                    if (
                        window.rpgPermissoes.isPlayer
                    ) {

                        esconderModoMestre();

                    }

                    else if (
                        window.rpgPermissoes.isMaster
                    ) {

                        mostrarModoMestre();

                    }

                }

            );


        observador.observe(

            document.body,

            {

                childList: true,

                subtree: true

            }

        );

    }


    // ==========================================
    // FUNÇÕES PÚBLICAS
    // ==========================================

    window.aplicarPermissoesRPG =
        aplicarPermissoes;


    window.usuarioEhMestreInterface =
        function () {

            return (
                window.rpgPermissoes &&
                window.rpgPermissoes.isMaster === true
            );

        };


    window.usuarioEhJogadorInterface =
        function () {

            return (
                window.rpgPermissoes &&
                window.rpgPermissoes.isPlayer === true
            );

        };


    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    document.addEventListener(

        "DOMContentLoaded",

        function () {

            /*
                Primeiro escondemos o Modo Mestre
                enquanto descobrimos quem está
                conectado.
            */

            mostrarModoMestre();


            esperarAutenticacao();

            monitorarAutenticacao();

            monitorarInterface();

        }

    );


})();
