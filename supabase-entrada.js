"use strict";

/*
==============================================================
 SUPABASE — ENTRADA
 -------------------------------------------------------------
 PORTA CENTRAL DE ENTRADA DO SUPABASE

 Responsabilidades:
 - identificar a página atual
 - organizar a rota de entrada
 - transportar o contexto da Mesa
 - encaminhar a Mesa para SupabaseMesa
 - preservar a conexão principal do index.html
 - permitir que ambas as páginas apontem para o MESMO
   projeto Supabase

 NÃO executa consultas ao banco.
 NÃO inicia Realtime.
 NÃO altera mesa.js.
==============================================================
*/

(function () {

    console.log(
        "[Supabase Entrada] Carregando porta central..."
    );


    /*
    ==========================================================
     ESTADO
    ==========================================================
    */

    const estado = {

        ativo: true,

        pagina: null,

        rota: null,

        contexto: null,

        pronto: false,

        supabasePrincipalDisponivel: false,

        supabaseMesaDisponivel: false

    };


    /*
    ==========================================================
     IDENTIFICA A PÁGINA ATUAL
    ==========================================================
    */

    function identificarPagina() {

        const caminho =
            window.location.pathname
                .toLowerCase();


        /*
        ------------------------------------------------------
        Mesa
        ------------------------------------------------------
        */

        if (
            caminho.endsWith("/mesa.html") ||
            caminho.includes("mesa.html")
        ) {

            estado.pagina = "mesa";
            estado.rota = "supabase-mesa";

            return "mesa";
        }


        /*
        ------------------------------------------------------
        Index
        ------------------------------------------------------
        */

        if (
            caminho.endsWith("/index.html") ||
            caminho === "/" ||
            caminho === ""
        ) {

            estado.pagina = "index";
            estado.rota = "supabase-principal";

            return "index";
        }


        /*
        ------------------------------------------------------
        Outra página
        ------------------------------------------------------
        */

        estado.pagina = "outra";
        estado.rota = "supabase-principal";

        return "outra";
    }


    /*
    ==========================================================
     VERIFICA O SUPABASE PRINCIPAL
    ==========================================================
    */

    function verificarSupabasePrincipal() {

        estado.supabasePrincipalDisponivel = !!(
            window.supabaseClient
        );


        return (
            estado.supabasePrincipalDisponivel
        );
    }


    /*
    ==========================================================
     VERIFICA O SUPABASE DA MESA
    ==========================================================
    */

    function verificarSupabaseMesa() {

        estado.supabaseMesaDisponivel = !!(
            window.SupabaseMesa
        );


        return (
            estado.supabaseMesaDisponivel
        );
    }


    /*
    ==========================================================
     LÊ O CONTEXTO DA MESA
    ==========================================================
    */

    function obterContextoMesa() {

        try {

            const salvo =
                localStorage.getItem(
                    "rpg_mesa_ativa"
                );


            if (!salvo) {

                console.warn(
                    "[Supabase Entrada] Nenhum contexto de Mesa encontrado."
                );

                return null;
            }


            const dados =
                JSON.parse(salvo);


            if (
                !dados ||
                typeof dados !== "object"
            ) {

                console.warn(
                    "[Supabase Entrada] Contexto inválido."
                );

                return null;
            }


            return dados;

        } catch (erro) {

            console.error(
                "[Supabase Entrada] Erro ao ler contexto:",
                erro
            );

            return null;
        }
    }


    /*
    ==========================================================
     MONTA O CONTEXTO
    ==========================================================
    */

    function prepararContexto() {

        const dados =
            obterContextoMesa();


        if (!dados) {

            return null;
        }


        const contexto = {

            campanha: {

                id:
                    dados.campaignId ||
                    dados.campanhaId ||
                    null,

                nome:
                    dados.campaignName ||
                    dados.campanhaNome ||
                    null,

                masterId:
                    dados.masterId ||
                    null

            },

            usuario: {

                id:
                    dados.userId ||
                    null,

                nome:
                    dados.userName ||
                    null,

                email:
                    dados.userEmail ||
                    null

            },

            personagem: {

                id:
                    dados.characterId ||
                    null,

                slot:
                    dados.slot ||
                    null

            }

        };


        estado.contexto =
            contexto;


        return contexto;
    }


    /*
    ==========================================================
     ENVIA O CONTEXTO PARA A MESA
    ==========================================================
    */

    function enviarContexto() {

        verificarSupabaseMesa();


        if (
            !window.SupabaseMesa ||
            typeof window.SupabaseMesa.receberContexto !==
                "function"
        ) {

            console.warn(
                "[Supabase Entrada] SupabaseMesa ainda não está disponível."
            );

            return false;
        }


        const contexto =
            prepararContexto();


        if (!contexto) {

            return false;
        }


        const recebido =
            window.SupabaseMesa.receberContexto(
                contexto
            );


        if (recebido) {

            estado.pronto = true;


            console.log(
                "[Supabase Entrada] Contexto enviado para SupabaseMesa."
            );

        }


        return recebido;
    }


    /*
    ==========================================================
     ROTA — INDEX
    ==========================================================
    */

    function iniciarIndex() {

        console.log(
            "[Supabase Entrada] Rota INDEX detectada."
        );


        verificarSupabasePrincipal();


        if (
            estado.supabasePrincipalDisponivel
        ) {

            console.log(
                "[Supabase Entrada] Supabase principal encontrado."
            );

        } else {

            console.log(
                "[Supabase Entrada] Supabase principal ainda não disponível."
            );

        }
    }


    /*
    ==========================================================
     ROTA — MESA
    ==========================================================
    */

    function iniciarMesa() {

        console.log(
            "[Supabase Entrada] Rota MESA detectada."
        );


        verificarSupabaseMesa();


        /*
        ------------------------------------------------------
        SupabaseMesa ainda não carregou
        ------------------------------------------------------
        */

        if (!window.SupabaseMesa) {

            console.warn(
                "[Supabase Entrada] SupabaseMesa não encontrado."
            );

            return false;
        }


        /*
        ------------------------------------------------------
        Inicializa o módulo
        ------------------------------------------------------
        */

        if (
            typeof window.SupabaseMesa.inicializar ===
            "function"
        ) {

            window.SupabaseMesa.inicializar();

        }


        /*
        ------------------------------------------------------
        Envia contexto
        ------------------------------------------------------
        */

        enviarContexto();


        return true;
    }


    /*
    ==========================================================
     INICIALIZAÇÃO PRINCIPAL
    ==========================================================
    */

    function iniciar() {

        console.log(
            "[Supabase Entrada] Iniciando porta central..."
        );


        const pagina =
            identificarPagina();


        console.log(
            "[Supabase Entrada] Página:",
            estado.pagina
        );


        console.log(
            "[Supabase Entrada] Rota:",
            estado.rota
        );


        /*
        ------------------------------------------------------
        INDEX
        ------------------------------------------------------
        */

        if (pagina === "index") {

            iniciarIndex();

        }


        /*
        ------------------------------------------------------
        MESA
        ------------------------------------------------------
        */

        else if (pagina === "mesa") {

            iniciarMesa();

        }


        /*
        ------------------------------------------------------
        OUTRAS PÁGINAS
        ------------------------------------------------------
        */

        else {

            console.log(
                "[Supabase Entrada] Página sem rota específica."
            );

            verificarSupabasePrincipal();

        }


        /*
        ------------------------------------------------------
        EVENTO
        ------------------------------------------------------
        */

        window.dispatchEvent(
            new CustomEvent(
                "supabase:entradaPronta",
                {
                    detail: {

                        pagina:
                            estado.pagina,

                        rota:
                            estado.rota,

                        contexto:
                            estado.contexto,

                        pronto:
                            estado.pronto

                    }
                }
            )
        );


        console.log(
            "[Supabase Entrada] Porta central pronta."
        );
    }


    /*
    ==========================================================
     API PÚBLICA
    ==========================================================
    */

    window.SupabaseEntrada = {

        iniciar,

        identificarPagina,

        obterContextoMesa,

        prepararContexto,

        enviarContexto,

        verificarSupabasePrincipal,

        verificarSupabaseMesa,

        estado

    };


    console.log(
        "[Supabase Entrada] Módulo disponível."
    );


    /*
    ==========================================================
     INICIALIZA APÓS O DOM
    ==========================================================
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
            { once: true }
        );

    } else {

        iniciar();

    }

})();
