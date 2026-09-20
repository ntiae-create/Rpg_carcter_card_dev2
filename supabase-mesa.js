"use strict";

/* =========================================================
SUPABASE MESA
CAMADA DE ACESSO DO SISTEMA DA MESA

IMPORTANTE:

- NÃO cria outro cliente Supabase
- Usa exclusivamente window.supabaseClient
- O cliente é criado pelo supabase.js
  ========================================================= */

(function () {

console.log("[Supabase Mesa] Carregando módulo...");


/* =====================================================
   ESTADO
===================================================== */

const estado = {

    inicializado: false,

    cliente: null,

    usuario: null,

    contextoRecebido: false,

    contexto: null

};


/* =====================================================
   OBTER CLIENTE DO SUPABASE.JS
===================================================== */

function obterCliente() {

    /*
     * Depois de inicializado, sempre reutiliza
     * exatamente o mesmo cliente.
     */

    if (
        estado.cliente &&
        typeof estado.cliente.from === "function"
    ) {

        return estado.cliente;

    }


    /*
     * Primeira obtenção:
     * pega exclusivamente o cliente criado
     * pelo supabase.js.
     */

    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {

        return window.supabaseClient;

    }


    return null;
}


/* =====================================================
   INICIALIZAR
===================================================== */

function inicializar() {

    console.log(
        "[Supabase Mesa] Inicializando..."
    );


    const cliente =
        obterCliente();


    if (!cliente) {

        console.error(
            "[Supabase Mesa] Cliente do supabase.js não encontrado."
        );

        estado.inicializado = false;
        estado.cliente = null;

        return null;
    }


    estado.cliente =
        cliente;

    estado.inicializado =
        true;


    console.log(
        "[Supabase Mesa] Cliente do supabase.js conectado."
    );


    window.dispatchEvent(
        new CustomEvent(
            "supabase:mesaPronto",
            {
                detail: {
                    cliente:
                        estado.cliente
                }
            }
        )
    );


    return estado.cliente;
}


/* =====================================================
   VERIFICAR DISPONIBILIDADE
===================================================== */

function estaDisponivel() {

    return (
        estado.inicializado &&
        !!estado.cliente
    );
}


/* =====================================================
   OBTER USUÁRIO AUTENTICADO DIRETAMENTE DO SUPABASE
===================================================== */

async function obterUsuarioAtual() {

    const cliente =
        obterCliente();


    if (!cliente) {

        console.error(
            "[Supabase Mesa] Cliente Supabase indisponível."
        );

        return null;
    }


    try {

        const resultado =
            await cliente.auth.getUser();


        if (resultado.error) {

            console.error(
                "[Supabase Mesa] Erro ao obter usuário:",
                resultado.error
            );

            estado.usuario =
                null;

            return null;
        }


        const usuario =
            resultado.data?.user || null;


        if (!usuario) {

            console.warn(
                "[Supabase Mesa] Nenhum usuário autenticado encontrado."
            );

            estado.usuario =
                null;

            return null;
        }


        estado.usuario =
            usuario;


        console.log(
            "[Supabase Mesa] Usuário autenticado:",
            usuario.id
        );


        window.dispatchEvent(
            new CustomEvent(
                "supabase:usuarioIdentificado",
                {
                    detail: {
                        usuario
                    }
                }
            )
        );


        return usuario;

    } catch (erro) {

        console.error(
            "[Supabase Mesa] Falha ao obter usuário:",
            erro
        );

        estado.usuario =
            null;

        return null;
    }
}


/* =====================================================
   RECEBER CONTEXTO DA MESA
===================================================== */

function receberContexto(contexto) {

    if (!contexto) {

        console.warn(
            "[Supabase Mesa] Nenhum contexto recebido."
        );

        return false;
    }


    estado.contexto = {

        campanha:
            contexto.campanha || null,

        usuario:
            contexto.usuario || null,

        personagem:
            contexto.personagem || null

    };


    estado.contextoRecebido =
        true;


    console.log(
        "[Supabase Mesa] Contexto recebido:",
        estado.contexto
    );


    window.dispatchEvent(
        new CustomEvent(
            "supabase:mesaContextoRecebido",
            {
                detail: {
                    contexto:
                        estado.contexto
                }
            }
        )
    );


    return true;
}


/* =====================================================
   OBTER CONTEXTO
===================================================== */

function obterContexto() {

    return estado.contexto;
}


/* =====================================================
   EXECUTAR CONSULTA
   -----------------------------------------------------
   Permite que o mesa.js use a camada SupabaseMesa
   sem precisar acessar o cliente diretamente.
===================================================== */

function tabela(nome) {

    const cliente =
        obterCliente();


    if (!cliente) {

        console.error(
            "[Supabase Mesa] Cliente Supabase indisponível."
        );

        return null;
    }


    if (!nome) {

        console.error(
            "[Supabase Mesa] Nome da tabela não informado."
        );

        return null;
    }


    return cliente.from(nome);
}


/* =====================================================
   AUTH
===================================================== */

function auth() {

    const cliente =
        obterCliente();


    if (!cliente) {

        console.error(
            "[Supabase Mesa] Cliente Supabase indisponível."
        );

        return null;
    }


    return cliente.auth;
}


/* =====================================================
   REALTIME
===================================================== */

function canal(nome) {

    const cliente =
        obterCliente();


    if (!cliente) {

        console.error(
            "[Supabase Mesa] Cliente Supabase indisponível."
        );

        return null;
    }


    return cliente.channel(nome);
}


function removerCanal(canalSupabase) {

    const cliente =
        obterCliente();


    if (
        !cliente ||
        !canalSupabase
    ) {

        return null;
    }


    return cliente.removeChannel(
        canalSupabase
    );
}


/* =====================================================
   DIAGNÓSTICO
===================================================== */

function diagnostico() {

    const cliente =
        obterCliente();


    return {

        modulo:
            true,

        inicializado:
            estado.inicializado,

        cliente:
            !!cliente,

        clienteValido:
            !!(
                cliente &&
                typeof cliente.from === "function"
            ),

        origem:
            "supabase.js",

        usuarioIdentificado:
            !!estado.usuario,

        usuarioId:
            estado.usuario?.id || null,

        contextoRecebido:
            estado.contextoRecebido,

        campanha:
            !!estado.contexto?.campanha,

        usuario:
            !!estado.contexto?.usuario,

        personagem:
            !!estado.contexto?.personagem

    };
}


/* =====================================================
   API PÚBLICA
===================================================== */

window.SupabaseMesa = {

    inicializar,

    obterCliente,

    estaDisponivel,

    obterUsuarioAtual,

    receberContexto,

    obterContexto,

    tabela,

    auth,

    canal,

    removerCanal,

    diagnostico

};


console.log(
    "[Supabase Mesa] Módulo disponível."
);


/* =====================================================
   INICIALIZAÇÃO AUTOMÁTICA
===================================================== */

function iniciarAutomaticamente() {

    inicializar();

}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarAutomaticamente,
        {
            once: true
        }
    );

} else {

    iniciarAutomaticamente();

}

})();
