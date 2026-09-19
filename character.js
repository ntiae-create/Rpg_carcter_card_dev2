/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: CHARACTER
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const CharacterModule = (() => {

    const MAX_LEVEL = 30;


    /* =====================================================
       ARTES AUTOMÁTICAS DOS PERSONAGENS
       
       A combinação RAÇA + CLASSE determina a arte padrão.

       As artes automáticas não impedem o jogador de usar
       uma imagem própria através de URL ou dispositivo.
    ===================================================== */

    const CHARACTER_ART = {

        "Humano": {

            "Bufão":
                "https://bjkbfxcmyihdruqrwsdf.supabase.co/storage/v1/object/public/character-art/classes/bufao/bufao_humano.png"

        }

    };


    /* =====================================================
       RAÇAS
    ===================================================== */

    const RACES = {

        "Humano": {
            hp: 25,
            mp: 15,
            est: 30,
            sanidade: 100,
            atk: 4,
            atkMgc: 4,
            def: 8,
            res: 8,
            agi: 8,
            int: 15
        },

        "Meio-elfo": {
            hp: 23,
            mp: 22,
            est: 25,
            sanidade: 100,
            atk: 3,
            atkMgc: 7,
            def: 6,
            res: 9,
            agi: 10,
            int: 15
        },

        "Elfo": {
            hp: 22,
            mp: 25,
            est: 25,
            sanidade: 100,
            atk: 3,
            atkMgc: 8,
            def: 5,
            res: 9,
            agi: 12,
            int: 16
        },

        "Semi-besta": {
            hp: 30,
            mp: 10,
            est: 35,
            sanidade: 90,
            atk: 9,
            atkMgc: 3,
            def: 7,
            res: 6,
            agi: 10,
            int: 10
        },

        "Besta": {
            hp: 35,
            mp: 8,
            est: 40,
            sanidade: 80,
            atk: 11,
            atkMgc: 2,
            def: 6,
            res: 5,
            agi: 9,
            int: 6
        }

    };


    /* =====================================================
       XP POR NÍVEL
    ===================================================== */

    const XP_LEVELS = {

        1: 100,
        2: 150,
        3: 225,
        4: 325,
        5: 450,
        6: 600,
        7: 775,
        8: 975,
        9: 1200,
        10: 1200,
        11: 1350,
        12: 1500,
        13: 1650,
        14: 1800,
        15: 1950

    };


    /* =====================================================
       XP NECESSÁRIO
    ===================================================== */

    function obterXPNecessario(level) {

        if (level < 10) {

            return XP_LEVELS[level] || 100;

        }


        return 1200 + (
            Math.max(0, level - 10) * 150
        );

    }


    /* =====================================================
       ADICIONAR XP
    ===================================================== */

    function adicionarXP(valor) {

        valor =
            Number(valor);


        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {

            return;

        }


        const nivelAntes =
            character.level;


        character.xp += valor;


        while (
            character.level < MAX_LEVEL &&
            character.xp >=
            obterXPNecessario(
                character.level
            )
        ) {

            character.xp -=
                obterXPNecessario(
                    character.level
                );


            character.level++;


            /*
               Cada nível:
               +3 pontos de atributo
               +1 Sanidade
            */

            character.attributePoints += 3;

            character.resources.sanidade++;


            /*
               A cada 3 níveis:
               +5 HP
               +5 MP
               +5 EST
            */

            if (
                character.level % 3 === 0
            ) {

                character.resources.hp += 5;

                character.resources.mp += 5;

                character.resources.est += 5;

            }

        }


        if (
            character.level >= MAX_LEVEL
        ) {

            character.level = MAX_LEVEL;

            character.xp = 0;

        }


        /*
           O sistema de brasão continua no
           script principal.
        */

        if (
            typeof atualizarMarcosBrasao ===
            "function"
        ) {

            atualizarMarcosBrasao(
                nivelAntes,
                character.level
            );

        }


        atualizarInterface();

        salvarPersonagem();

        if (typeof window.RacasOcultas !== "undefined") {
            window.RacasOcultas.verificar();
        }

    }


    /* =====================================================
       REMOVER XP
    ===================================================== */

    function removerXP(valor) {

        valor =
            Number(valor);


        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {

            return;

        }


        character.xp -= valor;


        while (
            character.xp < 0 &&
            character.level > 1
        ) {

            character.level--;


            character.xp +=
                obterXPNecessario(
                    character.level
                );


            character.attributePoints =
                Math.max(
                    0,
                    character.attributePoints - 3
                );


            character.resources.sanidade =
                Math.max(
                    0,
                    character.resources.sanidade - 1
                );

        }


        if (
            character.level <= 1
        ) {

            character.level = 1;

            character.xp =
                Math.max(
                    0,
                    character.xp
                );

        }


        atualizarInterface();

        salvarPersonagem();

    }


    /* =====================================================
       VERIFICAR SE PERSONAGEM ESTÁ CONFIRMADO
    ===================================================== */

    function personagemConfirmado() {

        return (
            typeof character !== "undefined" &&
            character.confirmed === true
        );

    }


    /* =====================================================
       OBTER ARTE AUTOMÁTICA
       
       Procura a arte através da combinação:
       RAÇA + CLASSE
    ===================================================== */

    function obterArteAutomatica() {

        if (
            typeof character === "undefined"
        ) {

            return "";

        }


        const raca =
            character.race;

        const classe =
            character.class;


        if (
            !raca ||
            !classe
        ) {

            return "";

        }


        if (
            !CHARACTER_ART[raca]
        ) {

            return "";

        }


        return (
            CHARACTER_ART[raca][classe] ||
            ""
        );

    }


    /* =====================================================
       APLICAR ARTE AUTOMÁTICA
       
       Só altera a imagem quando:
       - não existe imagem manual
       OU
       - a imagem atual é marcada como automática.

       Imagens colocadas manualmente pelo jogador
       permanecem protegidas.
    ===================================================== */

    function aplicarArteAutomatica() {

        const arte =
            obterArteAutomatica();


        if (!arte) {

            return false;

        }


        /*
           Se o jogador colocou uma imagem manual,
           não substituímos.
        */

        if (
            character.imageURL &&
            character.imageAuto === false
        ) {

            return false;

        }


        character.imageURL =
            arte;


        character.imageAuto =
            true;


        atualizarImagem();


        return true;

    }


    /* =====================================================
       ALTERAR RAÇA
    ===================================================== */

    function alterarRaca(raceName) {

        /*
           Depois da confirmação a raça não pode
           mais ser alterada.
        */

        if (
            personagemConfirmado()
        ) {

            sincronizarEditor();

            return;

        }


        const race =
            RACES[raceName];


        if (!race) {

            return;

        }


        character.race =
            raceName;


        character.resources.hp =
            race.hp;

        character.resources.mp =
            race.mp;

        character.resources.est =
            race.est;

        character.resources.sanidade =
            race.sanidade;


        character.attributes.atk =
            race.atk;

        character.attributes.atkMgc =
            race.atkMgc;

        character.attributes.def =
            race.def;

        character.attributes.res =
            race.res;

        character.attributes.agi =
            race.agi;

        character.attributes.int =
            race.int;


        /*
           Se o personagem estiver usando
           uma arte automática, atualiza a arte
           conforme a nova combinação.
        */

        if (
            character.imageAuto !== false
        ) {

            aplicarArteAutomatica();

        }


        atualizarInterface();

        salvarPersonagem();

    }


    /* =====================================================
       OBTER CLASSE ATUAL
       
       Busca a classe escolhida no módulo classe.js.
    ===================================================== */

    function obterClasseAtual() {

        /*
           Verifica se o módulo de classes
           foi carregado.
        */

        if (
            typeof RPGClasses ===
            "undefined"
        ) {

            return null;

        }


        /*
           Verifica se existe um personagem
           carregado.
        */

        if (
            typeof character ===
            "undefined"
        ) {

            return null;

        }


        /*
           Sem classe selecionada.
        */

        if (
            !character.class
        ) {

            return null;

        }


        /*
           Procura a classe no RPGClasses.
        */

        return (
            RPGClasses[
                character.class
            ] || null
        );

    }


    /* =====================================================
       BLOQUEAR DEFINIÇÕES DO PERSONAGEM
       
       Nome / Raça / Classe / Afinidade
    ===================================================== */

    function atualizarBloqueioDefinicoes() {

        const bloqueado =
            personagemConfirmado();


        const nameInput =
            get("character-name-input");

        const raceSelect =
            get("character-race-select");

        const classSelect =
            get("character-class-select");

        /*
           O ID esperado da afinidade é
           character-affinity-select.

           Se existir no HTML, será bloqueado.
        */

        const affinitySelect =
            get("character-affinity-select");


        if (nameInput) {

            nameInput.disabled =
                bloqueado;

            nameInput.setAttribute(
                "aria-disabled",
                String(bloqueado)
            );

        }


        if (raceSelect) {

            raceSelect.disabled =
                bloqueado;

            raceSelect.setAttribute(
                "aria-disabled",
                String(bloqueado)
            );

        }


        if (classSelect) {

            classSelect.disabled =
                bloqueado;

            classSelect.setAttribute(
                "aria-disabled",
                String(bloqueado)
            );

        }


        if (affinitySelect) {

            affinitySelect.disabled =
                bloqueado;

            affinitySelect.setAttribute(
                "aria-disabled",
                String(bloqueado)
            );

        }


        /*
           Classe visual no editor.
        */

        const editor =
            document.querySelector(
                ".character-editor"
            );


        if (editor) {

            editor.classList.toggle(
                "character-locked",
                bloqueado
            );

        }

    }


    /* =====================================================
       EDITOR DO PERSONAGEM
    ===================================================== */

    function configurarEditor() {

        const nameInput =
            get("character-name-input");

        const raceSelect =
            get("character-race-select");

        const classSelect =
            get("character-class-select");


        /*
           Migração: classes antigas no estilo Fate
           (Saber, Archer, etc.) não existem mais.
           Se a classe salva não for reconhecida pelo
           módulo classe.js, volta para Guerreiro.
        */

        if (
            typeof RPGClasses !== "undefined" &&
            RPGClasses &&
            character.class &&
            !RPGClasses[character.class]
        ) {

            character.class =
                "Guerreiro";

            salvarPersonagem();

        }


        const affinitySelect =
            get("character-affinity-select");


        /* -------------------------------------------------
           NOME
        ------------------------------------------------- */

        if (nameInput) {

            nameInput.value =
                character.name;


            nameInput.addEventListener(
                "input",
                () => {

                    /*
                       Segurança adicional:
                       mesmo que o evento seja disparado,
                       não permite alteração após confirmação.
                    */

                    if (
                        personagemConfirmado()
                    ) {

                        nameInput.value =
                            character.name;

                        return;

                    }


                    character.name =
                        nameInput.value ||
                        "Personagem";


                    atualizarInterface();

                    salvarPersonagem();

                }
            );

        }


        /* -------------------------------------------------
           RAÇA
        ------------------------------------------------- */

        if (raceSelect) {

            raceSelect.value =
                character.race;


            raceSelect.addEventListener(
                "change",
                () => {

                    alterarRaca(
                        raceSelect.value
                    );

                }
            );

        }


        /* -------------------------------------------------
           CLASSE
        ------------------------------------------------- */

        if (classSelect) {

            classSelect.value =
                character.class;


            classSelect.addEventListener(
                "change",
                () => {

                    /*
                       Não permite alteração após
                       confirmação.
                    */

                    if (
                        personagemConfirmado()
                    ) {

                        classSelect.value =
                            character.class;

                        return;

                    }


                    character.class =
                        classSelect.value;


                    /*
                       Agora a classe escolhida
                       passa a ser reconhecida pelo
                       módulo classe.js.
                    */

                    const classe =
                        obterClasseAtual();


                    console.log(
                        "Classe atual:",
                        classe
                    );


                    /*
                       Atualiza a arte automática
                       para a nova combinação,
                       desde que o jogador não esteja
                       usando uma imagem manual.
                    */

                    if (
                        character.imageAuto !== false
                    ) {

                        aplicarArteAutomatica();

                    }


                    atualizarInterface();

                    salvarPersonagem();

                }
            );

        }


        /* -------------------------------------------------
           AFINIDADE
        ------------------------------------------------- */

        if (affinitySelect) {

            affinitySelect.value =
                character.affinity || "";


            affinitySelect.addEventListener(
                "change",
                () => {

                    /*
                       Não permite alteração após
                       confirmação.
                    */

                    if (
                        personagemConfirmado()
                    ) {

                        affinitySelect.value =
                            character.affinity || "";

                        return;

                    }


                    character.affinity =
                        affinitySelect.value ||
                        null;


                    atualizarInterface();

                    salvarPersonagem();

                }
            );

        }


        /* -------------------------------------------------
           URL DA IMAGEM
        ------------------------------------------------- */

        const imageURLInput =
            get("character-image-url");


        if (imageURLInput) {

            imageURLInput.value =
                character.imageAuto === true
                    ? ""
                    : (
                        character.imageURL || ""
                    );

        }


        const applyImage =
            get("apply-image-url");


        if (applyImage && imageURLInput) {

            applyImage.addEventListener(
                "click",
                () => {

                    const url =
                        imageURLInput.value.trim();


                    if (!url) {

                        alert(
                            "Digite uma URL de imagem."
                        );

                        return;

                    }


                    /*
                       Verificação básica da URL.
                    */

                    let urlValida = false;

                    try {

                        const urlObj =
                            new URL(url);

                        urlValida =
                            urlObj.protocol === "http:" ||
                            urlObj.protocol === "https:";

                    } catch (erro) {

                        urlValida = false;

                    }


                    if (!urlValida) {

                        alert(
                            "A URL informada não é válida."
                        );

                        return;

                    }


                    /*
                       Primeiro testa a imagem.
                       Só salva se ela realmente
                       conseguir carregar.
                    */

                    testarImagemURL(
                        url,
                        function (sucesso) {

                            if (!sucesso) {

                                alert(
                                    "⚠️ Não foi possível carregar essa imagem. " +
                                    "Verifique se a URL é pública e aponta diretamente para uma imagem."
                                );

                                return;

                            }


                            character.imageURL =
                                url;


                            character.imageAuto =
                                false;


                            atualizarImagem();

                            salvarPersonagem();


                            alert(
                                "✅ Imagem aplicada com sucesso!"
                            );

                        }
                    );

                }
            );

        }


        /* -------------------------------------------------
           REMOVER IMAGEM
        ------------------------------------------------- */

        const removeImage =
            get("remove-image-button");


        if (removeImage) {

            removeImage.addEventListener(
                "click",
                () => {

                    /*
                       Remove a imagem manual e volta
                       para a arte automática da
                       combinação raça + classe.
                    */

                    character.imageURL =
                        "";

                    character.imageAuto =
                        true;


                    if (imageURLInput) {

                        imageURLInput.value =
                            "";

                    }


                    aplicarArteAutomatica();

                    atualizarImagem();

                    salvarPersonagem();

                }
            );

        }


        /* -------------------------------------------------
           UPLOAD DE IMAGEM DO DISPOSITIVO
        ------------------------------------------------- */

        const uploadButton =
            get("upload-image-device");

        const fileInput =
            get("image-file-input");


        if (uploadButton && fileInput) {

            uploadButton.addEventListener(
                "click",
                () => {

                    fileInput.click();

                }
            );


            fileInput.addEventListener(
                "change",
                (evento) => {

                    const arquivo =
                        evento.target.files[0];


                    if (!arquivo) {

                        return;

                    }


                    /*
                       Verifica se realmente é imagem.
                    */

                    if (
                        !arquivo.type ||
                        !arquivo.type.startsWith("image/")
                    ) {

                        alert(
                            "Por favor, selecione um arquivo de imagem."
                        );


                        fileInput.value = "";

                        return;

                    }


                    /*
                       Redimensiona a imagem para
                       evitar problemas de armazenamento.
                    */

                    redimensionarImagem(
                        arquivo,
                        function (dataURL) {

                            if (!dataURL) {

                                alert(
                                    "Não foi possível processar a imagem."
                                );

                                return;

                            }


                            character.imageURL =
                                dataURL;


                            character.imageAuto =
                                false;


                            atualizarImagem();


                            /*
                               Atualiza o campo de URL.
                               Como é uma imagem local,
                               não colocamos o dataURL no
                               campo visível para não deixar
                               a interface enorme.
                            */

                            if (imageURLInput) {

                                imageURLInput.value =
                                    "";

                            }


                            try {

                                salvarPersonagem();


                                alert(
                                    "✅ Imagem enviada com sucesso!"
                                );

                            } catch (erro) {

                                console.error(
                                    "Erro ao salvar imagem:",
                                    erro
                                );


                                alert(
                                    "⚠️ A imagem foi carregada, " +
                                    "mas não foi possível salvá-la. " +
                                    "Tente uma imagem menor."
                                );

                            }


                            console.log(
                                "📷 Imagem carregada do dispositivo:",
                                arquivo.name
                            );

                        }
                    );


                    /*
                       Limpa o input para permitir
                       selecionar o mesmo arquivo novamente.
                    */

                    fileInput.value = "";

                }
            );

        }


        /*
           Se ainda não existe uma imagem manual,
           tenta aplicar automaticamente a arte
           correspondente à raça + classe.
        */

        if (
            !character.imageURL ||
            character.imageAuto === true
        ) {

            aplicarArteAutomatica();

        }


        /*
           Aplica o estado inicial do bloqueio.
        */

        atualizarBloqueioDefinicoes();

    }


    /* =====================================================
       TESTAR URL DE IMAGEM
       
       Confirma que uma URL realmente consegue
       carregar uma imagem antes de salvá-la.
    ===================================================== */

    function testarImagemURL(url, callback) {

        const imagem =
            new Image();


        let finalizado =
            false;


        function finalizar(resultado) {

            if (finalizado) {

                return;

            }


            finalizado = true;

            callback(resultado);

        }


        imagem.onload =
            function () {

                finalizar(true);

            };


        imagem.onerror =
            function () {

                finalizar(false);

            };


        /*
           Evita que uma URL problemática
           fique travando o processo.
        */

        setTimeout(
            function () {

                finalizar(false);

            },
            10000
        );


        imagem.src =
            url;

    }


    /* =====================================================
       ATUALIZAR IMAGEM
    ===================================================== */

    /* =====================================================
       REDIMENSIONAR IMAGEM
       
       Evita estourar a cota do localStorage.
    ===================================================== */

    function redimensionarImagem(
        arquivo,
        callback
    ) {

        const TAMANHO_MAX =
            600;


        const leitor =
            new FileReader();


        leitor.onload =
            function (e) {

                const img =
                    new Image();


                const dataURLOriginal =
                    e.target.result;


                let chamado =
                    false;


                const finalizar =
                    function (url) {

                        if (chamado) {

                            return;

                        }


                        chamado =
                            true;


                        callback(url);

                    };


                img.onload =
                    function () {

                        try {

                            let largura =
                                img.width;


                            let altura =
                                img.height;


                            /*
                               Mantém proporção.
                            */

                            if (
                                largura > altura &&
                                largura > TAMANHO_MAX
                            ) {

                                altura =
                                    Math.round(
                                        (
                                            altura *
                                            TAMANHO_MAX
                                        ) /
                                        largura
                                    );


                                largura =
                                    TAMANHO_MAX;

                            } else if (
                                altura > TAMANHO_MAX
                            ) {

                                largura =
                                    Math.round(
                                        (
                                            largura *
                                            TAMANHO_MAX
                                        ) /
                                        altura
                                    );


                                altura =
                                    TAMANHO_MAX;

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                largura;


                            canvas.height =
                                altura;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            if (!ctx) {

                                finalizar(
                                    dataURLOriginal
                                );

                                return;

                            }


                            /*
                               Desenha a imagem.
                            */

                            ctx.drawImage(
                                img,
                                0,
                                0,
                                largura,
                                altura
                            );


                            /*
                               PNG/WebP continuam
                               com transparência.
                            */

                            const temTransparencia =
                                arquivo.type === "image/png" ||
                                arquivo.type === "image/webp";


                            const dataURL =
                                temTransparencia

                                    ? canvas.toDataURL(
                                        "image/png"
                                    )

                                    : canvas.toDataURL(
                                        "image/jpeg",
                                        0.75
                                    );


                            finalizar(
                                dataURL
                            );

                        } catch (erro) {

                            console.warn(
                                "[Imagem] Redimensionamento falhou, usando original:",
                                erro
                            );


                            finalizar(
                                dataURLOriginal
                            );

                        }

                    };


                img.onerror =
                    function () {

                        finalizar(
                            dataURLOriginal
                        );

                    };


                img.src =
                    dataURLOriginal;


                /*
                   Timeout de segurança para
                   dispositivos móveis.
                */

                setTimeout(
                    function () {

                        finalizar(
                            dataURLOriginal
                        );

                    },
                    8000
                );

            };


        leitor.onerror =
            function () {

                alert(
                    "Erro ao carregar a imagem. Tente novamente."
                );

            };


        leitor.readAsDataURL(
            arquivo
        );

    }


    /* =====================================================
       ESCAPAR HTML
    ===================================================== */

    function escaparHTML(texto) {

        return String(texto)

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
       ATUALIZAR IMAGEM
    ===================================================== */

    function atualizarImagem() {

        const container =
            get(
                "character-art-container"
            );


        if (!container) {

            return;

        }


        /*
           Se não houver imagem, tenta encontrar
           a arte automática.
        */

        if (
            !character.imageURL
        ) {

            const arte =
                obterArteAutomatica();


            if (arte) {

                character.imageURL =
                    arte;


                character.imageAuto =
                    true;

            }

        }


        if (
            character.imageURL
        ) {

            container.classList.add(
                "has-image"
            );


            container.innerHTML = `

                <img
                    src="${escaparHTML(character.imageURL)}"
                    alt="Imagem do personagem"
                    class="character-image-display"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        display:block;
                        position:relative;
                        z-index:3;
                    "
                    onerror="
                        this.parentElement.innerHTML=
                        '<div style=&quot;padding:40px 20px;text-align:center;color:#f87171;font-size:12px;&quot;>⚠️ Não foi possível carregar a imagem.</div>';
                    "
                >

            `;

        } else {

            container.classList.remove(
                "has-image"
            );


            container.innerHTML = `

                <div class="image-placeholder">

                    <span>
                        IMAGEM DO PERSONAGEM
                    </span>

                    <span>
                        Adicione uma imagem no editor
                    </span>

                </div>

            `;

        }

    }


    /* =====================================================
       SINCRONIZAR EDITOR
    ===================================================== */

    function sincronizarEditor() {

        const name =
            get("character-name-input");


        if (
            name &&
            document.activeElement !== name
        ) {

            name.value =
                character.name;

        }


        const race =
            get("character-race-select");


        if (race) {

            race.value =
                character.race;

        }


        const classSelect =
            get("character-class-select");


        if (classSelect) {

            classSelect.value =
                character.class;

        }


        const affinity =
            get("character-affinity-select");


        if (affinity) {

            affinity.value =
                character.affinity || "";

        }


        const imageURL =
            get("character-image-url");


        if (
            imageURL &&
            document.activeElement !== imageURL
        ) {

            /*
               Não coloca o link automático
               no campo de URL.
            */

            imageURL.value =
                character.imageAuto === true
                    ? ""
                    : (
                        character.imageURL || ""
                    );

        }


        /*
           Garante que o estado visual dos campos
           acompanhe o estado confirmado.
        */

        atualizarBloqueioDefinicoes();

    }


    /* =====================================================
       PREPARAR DADOS PARA O SUPABASE
       
       Esta função apenas organiza os dados.
       Ela NÃO envia nada automaticamente.
    ===================================================== */

    function obterDadosSupabase() {

        return {

            name:
                character.name,

            race:
                character.race,

            class:
                character.class,

            affinity:
                character.affinity || null,

            level:
                character.level,

            xp:
                character.xp,

            crest_xp:
                character.crestXP || 0,

            attribute_points:
                character.attributePoints,

            sanity:
                character.resources.sanidade,

            hp:
                character.resources.hp,

            mp:
                character.resources.mp,

            est:
                character.resources.est

        };

    }


    /* =====================================================
       CARREGAR DADOS DO SUPABASE
       
       Também não é executado automaticamente.
       Será usado na próxima etapa da integração.
    ===================================================== */

    async function carregarDoSupabase() {

        if (!window.supabaseClient) {

            console.error(
                "Supabase Client não encontrado."
            );

            return null;

        }


        if (
            !window.rpgAuth ||
            !window.rpgAuth.user ||
            !window.rpgAuth.campaign
        ) {

            console.warn(
                "Usuário ou campanha ainda não disponíveis."
            );

            return null;

        }


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("characters")
                    .select("*")
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
                    "Erro ao carregar personagem do Supabase:",
                    error
                );

                return null;

            }


            if (!data) {

                console.log(
                    "Nenhum personagem encontrado no Supabase."
                );

                return null;

            }


            return data;

        } catch (error) {

            console.error(
                "Falha ao carregar personagem:",
                error
            );

            return null;

        }

    }


    /* =====================================================
       INFORMAÇÕES
    ===================================================== */

    function getInfo() {

        return {

            name:
                character.name,

            race:
                character.race,

            class:
                character.class,

            level:
                character.level,

            xp:
                character.xp,

            imageURL:
                character.imageURL

        };

    }


    /* =====================================================
       API DO MÓDULO
    ===================================================== */

    return {

        RACES,

        XP_LEVELS,

        MAX_LEVEL,

        CHARACTER_ART,

        obterXPNecessario,

        adicionarXP,

        removerXP,

        alterarRaca,

        obterClasseAtual,

        obterArteAutomatica,

        aplicarArteAutomatica,

        configurarEditor,

        atualizarImagem,

        sincronizarEditor,

        atualizarBloqueioDefinicoes,

        personagemConfirmado,

        obterDadosSupabase,

        carregarDoSupabase,

        getInfo

    };

})();
