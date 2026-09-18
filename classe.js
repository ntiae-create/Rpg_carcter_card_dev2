/*
=========================================
 CLASSES DO RPG
=========================================

Este arquivo é responsável por:

- Definir as 20 classes disponíveis
- Guardar as características de cada classe
- Explicar como cada classe funciona
- Definir a passiva de cada classe
- Preencher automaticamente o seletor de classes

O character.js NÃO precisa conhecer os detalhes
das classes. Ele apenas informa qual classe foi escolhida.

*/

(function () {

    "use strict";


    /* =================================
       DEFINIÇÃO DAS CLASSES
    ================================= */

    const RPGClasses = {

        Assassino: {

            nome: "Assassino",

            tipo: "Dano",

            funcao: "Dano / Emboscada",

            dificuldade: "Alta",

            descricao:
                "Especialista em eliminar alvos rapidamente, aproveitando velocidade, furtividade e pontos vulneráveis.",

            comoFunciona:
                "O Assassino funciona melhor atacando no momento certo. Sua força está em surpreender o inimigo, explorar brechas e finalizar alvos antes que eles consigam reagir.",

            caracteristicas: [
                "Alta mobilidade",
                "Ataques rápidos",
                "Furtividade",
                "Especialista em pontos fracos"
            ],

            passiva: {
                nome: "Ponto Fraco",
                descricao:
                    "O Assassino é especializado em encontrar brechas na defesa dos inimigos, tornando ataques contra alvos vulneráveis mais eficientes."
            }

        },


        Berserk: {

            nome: "Berserk",

            tipo: "Dano",

            funcao: "Dano / Fúria",

            dificuldade: "Média",

            descricao:
                "Um combatente extremamente agressivo que transforma pressão e perigo em força ofensiva.",

            comoFunciona:
                "O Berserk entra em combate para pressionar o inimigo constantemente. Quanto maior o risco, maior sua capacidade de continuar lutando e causando dano.",

            caracteristicas: [
                "Força elevada",
                "Combate agressivo",
                "Resistência",
                "Foco em combate corpo a corpo"
            ],

            passiva: {
                nome: "Fúria Crescente",
                descricao:
                    "A pressão do combate alimenta a força do Berserk, permitindo que ele se torne cada vez mais perigoso durante uma batalha prolongada."
            }

        },


        Guerreiro: {

            nome: "Guerreiro",

            tipo: "Dano / Defesa",

            funcao: "Combatente versátil",

            dificuldade: "Baixa",

            descricao:
                "Combatente equilibrado capaz de lutar tanto ofensivamente quanto defensivamente.",

            comoFunciona:
                "O Guerreiro se adapta ao campo de batalha. Pode avançar contra inimigos, proteger aliados ou assumir uma postura defensiva quando necessário.",

            caracteristicas: [
                "Equilíbrio entre ataque e defesa",
                "Boa resistência",
                "Combate corpo a corpo",
                "Versatilidade"
            ],

            passiva: {
                nome: "Postura de Combate",
                descricao:
                    "O Guerreiro consegue adaptar seu estilo de luta de acordo com a situação, aproveitando melhor diferentes momentos do combate."
            }

        },


        Tank: {

            nome: "Tank",

            tipo: "Defesa",

            funcao: "Proteção / Resistência",

            dificuldade: "Baixa",

            descricao:
                "Especialista em absorver ataques e proteger seus aliados.",

            comoFunciona:
                "O Tank permanece na linha de frente e chama a atenção dos inimigos. Seu objetivo principal é impedir que os aliados mais frágeis sejam atingidos.",

            caracteristicas: [
                "Alta resistência",
                "Grande defesa",
                "Proteção de aliados",
                "Controle da linha de frente"
            ],

            passiva: {
                nome: "Muralha",
                descricao:
                    "O Tank é capaz de suportar grandes pressões e se posicionar entre seus aliados e as maiores ameaças."
            }

        },


        Feiticeiro: {

            nome: "Feiticeiro",

            tipo: "Magia",

            funcao: "Dano mágico / Versatilidade",

            dificuldade: "Alta",

            descricao:
                "Usuário de magia inata capaz de manipular poderes de maneira flexível.",

            comoFunciona:
                "O Feiticeiro utiliza seu próprio poder mágico como principal ferramenta. Sua força está na liberdade para adaptar suas magias às diferentes situações.",

            caracteristicas: [
                "Grande poder mágico",
                "Versatilidade",
                "Magias ofensivas",
                "Manipulação de energia"
            ],

            passiva: {
                nome: "Magia Inata",
                descricao:
                    "O poder mágico do Feiticeiro faz parte de sua própria natureza, permitindo que ele utilize sua energia de forma extremamente intuitiva."
            }

        },


        Mago: {

            nome: "Mago",

            tipo: "Magia",

            funcao: "Dano mágico / Controle",

            dificuldade: "Alta",

            descricao:
                "Especialista em conhecimento arcano e manipulação avançada de magia.",

            comoFunciona:
                "O Mago depende de conhecimento, preparação e escolha correta das magias. É capaz de controlar o campo de batalha e explorar diferentes elementos.",

            caracteristicas: [
                "Grande conhecimento arcano",
                "Controle de campo",
                "Grande variedade de magias",
                "Alta capacidade estratégica"
            ],

            passiva: {
                nome: "Conhecimento Arcano",
                descricao:
                    "O vasto conhecimento mágico do Mago permite que ele compreenda e utilize diferentes formas de magia com maior eficiência."
            }

        },


        Bufao: {

            nome: "Bufão",

            tipo: "Controle",

            funcao: "Controle / Suporte",

            dificuldade: "Alta",

            descricao:
                "Um combatente imprevisível que utiliza truques, distrações e caos para confundir seus inimigos.",

            comoFunciona:
                "O Bufão não segue um padrão previsível. Ele utiliza criatividade, distrações e situações inesperadas para alterar o ritmo do combate.",

            caracteristicas: [
                "Imprevisibilidade",
                "Distração",
                "Controle",
                "Truques especiais"
            ],

            passiva: {
                nome: "Caos Improvisado",
                descricao:
                    "A imprevisibilidade do Bufão faz com que suas ações possam mudar rapidamente o ritmo de uma situação."
            }

        },


        Alquimista: {

            nome: "Alquimista",

            tipo: "Suporte",

            funcao: "Suporte / Preparação",

            dificuldade: "Alta",

            descricao:
                "Especialista em alquimia, criação de poções e preparação de recursos especiais.",

            comoFunciona:
                "O Alquimista se prepara antes e durante as aventuras. Seus recursos podem ajudar aliados, prejudicar inimigos ou resolver situações específicas.",

            caracteristicas: [
                "Criação de poções",
                "Preparação",
                "Utilização de recursos",
                "Suporte estratégico"
            ],

            passiva: {
                nome: "Preparação Alquímica",
                descricao:
                    "O Alquimista consegue transformar recursos disponíveis em ferramentas úteis para diferentes situações."
            }

        },


        Arqueiro: {

            nome: "Arqueiro",

            tipo: "Dano à distância",

            funcao: "Dano / Precisão",

            dificuldade: "Média",

            descricao:
                "Especialista em ataques à distância utilizando precisão e posicionamento.",

            comoFunciona:
                "O Arqueiro prefere manter distância dos inimigos. Seu desempenho depende de posicionamento, precisão e escolha correta dos alvos.",

            caracteristicas: [
                "Ataques à distância",
                "Alta precisão",
                "Mobilidade",
                "Controle de distância"
            ],

            passiva: {
                nome: "Mira Precisa",
                descricao:
                    "O treinamento do Arqueiro permite que ele aproveite melhor oportunidades para realizar ataques precisos."
            }

        },


        Lanceiro: {

            nome: "Lanceiro",

            tipo: "Dano / Controle",

            funcao: "Combate / Alcance",

            dificuldade: "Média",

            descricao:
                "Combatente especializado no uso de lanças e no controle do espaço ao seu redor.",

            comoFunciona:
                "O Lanceiro utiliza o alcance de sua arma para manter inimigos afastados e controlar áreas importantes do campo de batalha.",

            caracteristicas: [
                "Grande alcance",
                "Controle de espaço",
                "Combate corpo a corpo",
                "Defesa equilibrada"
            ],

            passiva: {
                nome: "Zona de Alcance",
                descricao:
                    "O alcance superior de sua arma permite ao Lanceiro controlar melhor a área imediatamente ao seu redor."
            }

        },


        Cacador: {

            nome: "Caçador",

            tipo: "Dano / Rastreamento",

            funcao: "Dano / Rastreamento",

            dificuldade: "Média",

            descricao:
                "Especialista em rastrear criaturas, encontrar alvos e sobreviver em ambientes perigosos.",

            comoFunciona:
                "O Caçador utiliza conhecimento do ambiente para encontrar inimigos, identificar rastros e escolher o melhor momento para atacar.",

            caracteristicas: [
                "Rastreamento",
                "Sobrevivência",
                "Conhecimento de criaturas",
                "Ataques preparados"
            ],

            passiva: {
                nome: "Marca do Caçador",
                descricao:
                    "O Caçador consegue identificar e acompanhar melhor alvos que estejam sendo perseguidos ou rastreados."
            }

        },


        Clerigo: {

            nome: "Clérigo",

            tipo: "Suporte",

            funcao: "Buffer / Healer",

            dificuldade: "Média",

            descricao:
                "Usuário de poderes sagrados especializado em cura, proteção e fortalecimento de aliados.",

            comoFunciona:
                "O Clérigo atua principalmente mantendo o grupo de pé. Pode restaurar aliados, protegê-los e fornecer benefícios importantes durante o combate.",

            caracteristicas: [
                "Cura",
                "Proteção",
                "Fortalecimento de aliados",
                "Magia sagrada"
            ],

            passiva: {
                nome: "Benção Sagrada",
                descricao:
                    "A presença do Clérigo fortalece sua capacidade de proteger e auxiliar seus aliados."
            }

        },


        Necromante: {

            nome: "Necromante",

            tipo: "Magia",

            funcao: "Magia / Invocação",

            dificuldade: "Alta",

            descricao:
                "Manipulador de poderes relacionados à morte e às energias dos mortos.",

            comoFunciona:
                "O Necromante utiliza energia sombria para controlar forças relacionadas à morte e criar recursos para lutar ao seu lado.",

            caracteristicas: [
                "Magia sombria",
                "Manipulação da morte",
                "Invocações",
                "Controle"
            ],

            passiva: {
                nome: "Servos da Morte",
                descricao:
                    "O Necromante possui uma afinidade especial com entidades e energias relacionadas à morte."
            }

        },


        Ceifador: {

            nome: "Ceifador",

            tipo: "Dano",

            funcao: "Dano / Execução",

            dificuldade: "Alta",

            descricao:
                "Combatente sombrio especializado em finalizar inimigos e explorar momentos decisivos.",

            comoFunciona:
                "O Ceifador espera o momento certo para atacar. Seu estilo favorece inimigos enfraquecidos e situações onde uma ação decisiva pode mudar o combate.",

            caracteristicas: [
                "Grande poder ofensivo",
                "Execução",
                "Combate sombrio",
                "Pressão contra inimigos enfraquecidos"
            ],

            passiva: {
                nome: "Colheita Sombria",
                descricao:
                    "O Ceifador se torna especialmente perigoso quando encontra inimigos próximos de serem derrotados."
            }

        },


        Monge: {

            nome: "Monge",

            tipo: "Dano / Defesa",

            funcao: "Combate / Mobilidade",

            dificuldade: "Alta",

            descricao:
                "Combatente disciplinado que utiliza o próprio corpo como principal arma.",

            comoFunciona:
                "O Monge depende de técnica, velocidade e disciplina. Seu estilo de combate combina movimentação constante com ataques precisos.",

            caracteristicas: [
                "Alta mobilidade",
                "Combate desarmado",
                "Disciplina",
                "Reflexos"
            ],

            passiva: {
                nome: "Disciplina Corporal",
                descricao:
                    "O treinamento do Monge permite que ele utilize seu corpo de maneira extremamente eficiente em combate."
            }

        },


        Bardo: {

            nome: "Bardo",

            tipo: "Suporte",

            funcao: "Buffer / Controle",

            dificuldade: "Média",

            descricao:
                "Artista mágico capaz de utilizar música, histórias e presença para influenciar aliados e inimigos.",

            comoFunciona:
                "O Bardo utiliza sua arte para alterar o ritmo de uma situação. Pode fortalecer aliados, atrapalhar inimigos e controlar momentos importantes.",

            caracteristicas: [
                "Suporte",
                "Fortalecimento de aliados",
                "Controle",
                "Versatilidade"
            ],

            passiva: {
                nome: "Inspiração",
                descricao:
                    "A presença e as habilidades do Bardo ajudam a elevar o desempenho dos aliados ao seu redor."
            }

        },


        Invocador: {

            nome: "Invocador",

            tipo: "Invocação",

            funcao: "Invocação / Controle",

            dificuldade: "Alta",

            descricao:
                "Especialista em criar vínculos com criaturas e entidades para lutar ao seu lado.",

            comoFunciona:
                "O Invocador não depende apenas de suas próprias ações. Ele utiliza criaturas ou entidades vinculadas a ele para ampliar suas possibilidades.",

            caracteristicas: [
                "Invocações",
                "Controle de criaturas",
                "Versatilidade",
                "Vínculos mágicos"
            ],

            passiva: {
                nome: "Vínculo de Invocação",
                descricao:
                    "O Invocador possui uma conexão especial com suas criaturas ou entidades vinculadas."
            }

        },


        Oraculo: {

            nome: "Oráculo",

            tipo: "Suporte / Controle",

            funcao: "Previsão / Suporte",

            dificuldade: "Muito Alta",

            descricao:
                "Usuário de poderes relacionados a visões, presságios e percepção de acontecimentos futuros.",

            comoFunciona:
                "O Oráculo utiliza conhecimento sobrenatural para antecipar possibilidades e orientar decisões importantes.",

            caracteristicas: [
                "Visões",
                "Previsão",
                "Suporte estratégico",
                "Percepção sobrenatural"
            ],

            passiva: {
                nome: "Presságio",
                descricao:
                    "O Oráculo possui uma percepção especial sobre acontecimentos que podem estar prestes a acontecer."
            }

        },


        Druida: {

            nome: "Druida",

            tipo: "Magia / Suporte",

            funcao: "Natureza / Controle",

            dificuldade: "Alta",

            descricao:
                "Guardião da natureza capaz de manipular forças naturais e estabelecer conexão com criaturas e ambientes.",

            comoFunciona:
                "O Druida utiliza a natureza como extensão de seus próprios poderes, podendo adaptar suas ações conforme o ambiente.",

            caracteristicas: [
                "Magia natural",
                "Controle do ambiente",
                "Conexão com criaturas",
                "Suporte"
            ],

            passiva: {
                nome: "Comunhão Natural",
                descricao:
                    "O Druida possui uma ligação especial com a natureza, permitindo que o ambiente tenha maior importância para suas habilidades."
            }

        },


        Duelista: {

            nome: "Duelista",

            tipo: "Dano",

            funcao: "Combate / Precisão",

            dificuldade: "Alta",

            descricao:
                "Especialista em combates individuais, utilizando técnica, velocidade e precisão.",

            comoFunciona:
                "O Duelista procura enfrentar seus oponentes diretamente. Seu estilo recompensa leitura do adversário, movimentação e precisão.",

            caracteristicas: [
                "Alta precisão",
                "Velocidade",
                "Combate individual",
                "Técnica"
            ],

            passiva: {
    nome: "Domínio do Duelo",
    descricao:
        "A cada acerto, o Duelista recebe 1 Stack de Duelo. Ao alcançar 3 Stacks, ele leva o inimigo atingido para seu Domínio, onde o combate ocorre separadamente em um confronto individual. Dentro do Domínio, o Duelista pode criar 1 Clone com 50% de seus atributos, permitindo combates de 2x1, 2x2 ou 3x1. Se o Original ou o Clone for derrotado, o sobrevivente assume a condição de Original e recupera seus atributos normais. Ao derrotar o inimigo no Domínio, os Stacks são reiniciados e, no próximo acionamento, o Duelista pode levar até 2 personagens atingidos por seu golpe. Caso perca o duelo, sua EST é reduzida a 0 e ele fica fora de combate, tornando-se vulnerável aos demais inimigos. O Duelista não possui Ataque Mágico, e todas as suas habilidades utilizam EST, salvo ataques mágicos obtidos através de combos."
}
    };


    /* =================================
       FUNÇÕES PÚBLICAS
    ================================= */

    function obterClasses() {
        return RPGClasses;
    }


    function obterClasse(nomeClasse) {
        if (!nomeClasse) {
            return null;
        }

        return RPGClasses[nomeClasse] || null;
    }


    function obterNomesClasses() {
        return Object.keys(RPGClasses);
    }


    function classeExiste(nomeClasse) {
        return Object.prototype.hasOwnProperty.call(
            RPGClasses,
            nomeClasse
        );
    }


    /* =================================
       PREENCHER SELECT DE CLASSES
    ================================= */

    function carregarClassesNoSelect() {

        const select =
            document.getElementById("character-class-select");

        if (!select) {
            return;
        }


        const valorAtual = select.value;


        select.innerHTML = "";


        const placeholder =
            document.createElement("option");

        placeholder.value = "";
        placeholder.textContent = "Selecione uma classe";

        select.appendChild(placeholder);


        Object.keys(RPGClasses).forEach(function (chave) {

            const classe = RPGClasses[chave];

            const option =
                document.createElement("option");

            option.value = chave;
            option.textContent = classe.nome;

            select.appendChild(option);

        });


        if (classeExiste(valorAtual)) {
            select.value = valorAtual;
        }

    }


    /* =================================
       INICIALIZAÇÃO
    ================================= */

    function inicializarClasses() {

        carregarClassesNoSelect();

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            inicializarClasses
        );

    } else {

        inicializarClasses();

    }


    /* =================================
       EXPORTAÇÃO GLOBAL
    ================================= */

    window.RPGClasses = RPGClasses;

    window.obterClasses = obterClasses;

    window.obterClasse = obterClasse;

    window.obterNomesClasses = obterNomesClasses;

    window.classeExiste = classeExiste;

    window.carregarClassesNoSelect =
        carregarClassesNoSelect;


})();
