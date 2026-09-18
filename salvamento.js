/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: SALVAMENTO / SUPABASE
========================================================= */


/* =========================================================
   CONTROLE
========================================================= */

let salvamentoSupabaseEmAndamento = false;

let salvamentoSupabasePendente = false;

let salvarSupabaseTimer = null;


/* =========================================================
   SALVAR PERSONAGEM NO SUPABASE
========================================================= */

async function salvarPersonagemSupabase() {

    try {

        const supabase =
            window.supabaseClient;

        const user =
            window.rpgAuth?.user;


        /* =================================================
           VERIFICA SUPABASE
        ================================================= */

        if (!supabase) {

            console.warn(
                "⚠️ Supabase ainda não está disponível."
            );

            return {
                sucesso: false,
                ignorado: true,
                erro: "Supabase ainda não está disponível."
            };

        }


        /* =================================================
           VERIFICA USUÁRIO
        ================================================= */

        if (!user) {

            console.warn(
                "⚠️ Usuário não autenticado."
            );

            return {
                sucesso: false,
                ignorado: true,
                erro: "Usuário não autenticado."
            };

        }


        /* =================================================
           DADOS DO PERSONAGEM
        ================================================= */

        const dadosPersonagem = {

            user_id:
                user.id,

            campaign_id:
                character.campaign_id ||
                null,

            slot:
                character.slot ??
                null,

            name:
                character.name,

            race:
                character.race,

            class:
                character.class,

            affinity:
                character.affinity,

            level:
                Number(character.level) || 1,

            xp:
                Number(character.xp) || 0,

            crest_xp:
                Number(character.crestXP) || 0,

            attribute_points:
                Number(character.attributePoints) || 0,

            sanity:
                Number(
                    character.resources?.sanidade
                ) || 0,

            hp:
                Number(
                    character.resources?.hp
                ) || 0,

            mp:
                Number(
                    character.resources?.mp
                ) || 0,

            est:
                Number(
                    character.resources?.est
                ) || 0

        };


        /* =================================================
           ATUALIZAR PELO ID LOCAL
        ================================================= */

        if (
            character.supabaseId
        ) {

            console.log(
                "🔄 Atualizando personagem existente no Supabase:",
                character.supabaseId
            );


            const {
                data,
                error
            } =
                await supabase
                    .from("characters")
                    .update(
                        dadosPersonagem
                    )
                    .eq(
                        "id",
                        character.supabaseId
                    )
                    .eq(
                        "user_id",
                        user.id
                    )
                    .select("id")
                    .maybeSingle();


            if (error) {

                console.error(
                    "❌ Erro ao atualizar personagem no Supabase:",
                    error
                );

                return {
                    sucesso: false,
                    erro: error.message
                };

            }


            if (data) {

                character.supabaseId =
                    data.id;


                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(character)
                );


                console.log(
                    "✅ Personagem atualizado no Supabase:",
                    data
                );


                return {
                    sucesso: true,
                    data
                };

            }


            /*
               O ID local não encontrou o registro.
               Limpamos para procurar outro registro
               independente ou criar um novo.
            */

            console.warn(
                "⚠️ ID local não encontrou personagem no Supabase."
            );


            character.supabaseId =
                null;


            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(character)
            );

        }


        /* =================================================
           PROCURAR PERSONAGEM INDEPENDENTE
        ================================================= */

        console.log(
            "🔎 Procurando personagem independente existente..."
        );


        const {
            data: personagensExistentes,
            error: erroBusca
        } =
            await supabase
                .from("characters")
                .select("id")
                .eq(
                    "user_id",
                    user.id
                )
                .is(
                    "campaign_id",
                    null
                )
                .limit(1);


        if (erroBusca) {

            console.error(
                "❌ Erro ao procurar personagem existente:",
                erroBusca
            );

            return {
                sucesso: false,
                erro: erroBusca.message
            };

        }


        const personagemExistente =
            personagensExistentes &&
            personagensExistentes.length
                ? personagensExistentes[0]
                : null;


        /* =================================================
           PERSONAGEM JÁ EXISTE
        ================================================= */

        if (
            personagemExistente &&
            personagemExistente.id
        ) {

            console.log(
                "♻️ Personagem independente encontrado. Atualizando:",
                personagemExistente.id
            );


            character.supabaseId =
                personagemExistente.id;


            const {
                data,
                error
            } =
                await supabase
                    .from("characters")
                    .update(
                        dadosPersonagem
                    )
                    .eq(
                        "id",
                        personagemExistente.id
                    )
                    .eq(
                        "user_id",
                        user.id
                    )
                    .select("id")
                    .maybeSingle();


            if (error) {

                console.error(
                    "❌ Erro ao sincronizar personagem existente:",
                    error
                );

                return {
                    sucesso: false,
                    erro: error.message
                };

            }


            if (data) {

                character.supabaseId =
                    data.id;

            }


            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(character)
            );


            console.log(
                "✅ Personagem existente sincronizado:",
                data
            );


            return {
                sucesso: true,
                data
            };

        }


        /* =================================================
           CRIAR NOVO PERSONAGEM
        ================================================= */

        console.log(
            "🆕 Nenhum personagem independente encontrado. Criando registro..."
        );


        const {
            data,
            error
        } =
            await supabase
                .from("characters")
                .insert(
                    dadosPersonagem
                )
                .select("id")
                .single();


        if (error) {

            console.error(
                "❌ Erro ao criar personagem no Supabase:",
                error
            );

            return {
                sucesso: false,
                erro: error.message
            };

        }


        /* =================================================
           GUARDA ID
        ================================================= */

        character.supabaseId =
            data.id;


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(character)
        );


        console.log(
            "✅ PERSONAGEM CRIADO NO SUPABASE:",
            data
        );


        return {
            sucesso: true,
            data
        };

    }

    catch (error) {

        console.error(
            "❌ Falha inesperada ao salvar personagem no Supabase:",
            error
        );


        return {
            sucesso: false,
            erro:
                error?.message ||
                "Erro desconhecido ao salvar personagem."
        };

    }

}


/* =========================================================
   AGENDAR SALVAMENTO
========================================================= */

function agendarSalvamentoSupabase() {

    if (
        !window.supabaseClient ||
        !window.rpgAuth ||
        !window.rpgAuth.user
    ) {

        return;

    }


    if (
        salvarSupabaseTimer
    ) {

        clearTimeout(
            salvarSupabaseTimer
        );

    }


    salvarSupabaseTimer =
        setTimeout(
            function () {

                salvarSupabaseTimer =
                    null;

                executarSalvamentoSupabase();

            },
            400
        );

}


/* =========================================================
   EXECUTAR SALVAMENTO
========================================================= */

async function executarSalvamentoSupabase() {

    if (
        salvamentoSupabaseEmAndamento
    ) {

        salvamentoSupabasePendente =
            true;

        return;

    }


    salvamentoSupabaseEmAndamento =
        true;


    try {

        const resultado =
            await salvarPersonagemSupabase();


        if (
            resultado &&
            resultado.sucesso === true
        ) {

            console.log(
                "☁️ Sincronização automática concluída."
            );

        }

        else if (
            resultado &&
            !resultado.ignorado
        ) {

            console.warn(
                "⚠️ Sincronização automática não concluída:",
                resultado?.erro
            );

        }

    }

    catch (error) {

        console.error(
            "❌ Erro na sincronização automática:",
            error
        );

    }

    finally {

        salvamentoSupabaseEmAndamento =
            false;


        if (
            salvamentoSupabasePendente
        ) {

            salvamentoSupabasePendente =
                false;

            agendarSalvamentoSupabase();

        }

    }

}


/* =========================================================
   EXPORTAÇÃO
========================================================= */

window.RPGSalvamento = {

    salvar:
        salvarPersonagemSupabase,

    agendar:
        agendarSalvamentoSupabase,

    executar:
        executarSalvamentoSupabase

};


/* =========================================================
   INTEGRAÇÃO AUTOMÁTICA — INTERCEPTA SALVAMENTO
========================================================= */
/*
 * Este bloco faz com que o sistema de salvamento
 * se conecte AUTOMATICAMENTE ao script principal,
 * SEM precisar alterar o script.js.
 *
 * Ele "envolve" a função salvarPersonagem original:
 *   1. Executa o salvamento normal (localStorage)
 *   2. Agenda a sincronização com o Supabase
 */
(function integrarComSistemaPrincipal() {

    function tentarIntegrar() {

        const salvarOriginal = window.salvarPersonagem;

        if (typeof salvarOriginal !== "function") {
            return false;
        }

        /*
           Evita integrar duas vezes caso este script
           seja carregado mais de uma vez.
        */
        if (salvarOriginal._integracaoSupabase === true) {
            return true;
        }

        window.salvarPersonagem = function () {

            // 1. Executa o salvamento original (localStorage)
            const resultado = salvarOriginal.apply(this, arguments);

            // 2. Agenda sincronização com o Supabase
            agendarSalvamentoSupabase();

            return resultado;
        };

        window.salvarPersonagem._integracaoSupabase = true;

        console.log(
            "[Salvamento] Integrado automaticamente ao sistema principal."
        );

        return true;
    }

    /*
       Tenta integrar imediatamente.
       Se a função ainda não existir, tenta novamente em intervalos.
    */
    if (!tentarIntegrar()) {

        let tentativas = 0;
        const limite = 40;
        const intervalo = setInterval(
            function () {
                tentativas++;
                if (tentarIntegrar()) {
                    clearInterval(intervalo);
                    return;
                }
                if (tentativas >= limite) {
                    clearInterval(intervalo);
                    console.warn(
                        "[Salvamento] Não foi possível integrar automaticamente."
                    );
                }
            },
            250
        );
    }

})();
