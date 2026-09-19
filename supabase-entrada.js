"use strict";

/*
==============================================================
 SUPABASE — ENTRADA
 -------------------------------------------------------------
 Ponte entre a página da Mesa e o módulo supabase-mesa.js.

 Responsabilidade:
 - localizar o contexto salvo da Mesa
 - preparar os dados
 - entregar o contexto ao SupabaseMesa

 Não executa consultas ao banco.
==============================================================
*/

(function () {

    console.log(
        "[Supabase Entrada] Carregando..."
    );


    /*
    ==========================================================
     ESTADO
    ==========================================================
    */

    const estado = {

        ativo: true,

        contexto: null,

        pronto: false

    };


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


            if (!dados || typeof dados !== "object") {

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
     ENVIA PARA O SUPABASE-MESA
    ==========================================================
    */

    function enviarContexto() {

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
                "[Supabase Entrada] Contexto enviado ao SupabaseMesa."
            );

        }


        return recebido;
    }


    /*
    ==========================================================
     INICIALIZAÇÃO
    ==========================================================
    */

    function iniciar() {

        console.log(
            "[Supabase Entrada] Iniciando ponte..."
        );


        /*
        ------------------------------------------------------
        Verifica o módulo
        ------------------------------------------------------
        */

        if (!window.SupabaseMesa) {

            console.warn(
                "[Supabase Entrada] SupabaseMesa não encontrado."
            );

            return;
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
        Entrega o contexto
        ------------------------------------------------------
        */

        enviarContexto();


        /*
        ------------------------------------------------------
        Evento
        ------------------------------------------------------
        */

        window.dispatchEvent(
            new CustomEvent(
                "supabase:entradaPronta",
                {
                    detail: {

                        contexto:
                            estado.contexto,

                        pronto:
                            estado.pronto

                    }
                }
            )
        );

    }


    /*
    ==========================================================
     API PÚBLICA
    ==========================================================
    */

    window.SupabaseEntrada = {

        iniciar,

        obterContextoMesa,

        prepararContexto,

        enviarContexto,

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

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
            { once: true }
        );

    } else {

        iniciar();

    }

})();
