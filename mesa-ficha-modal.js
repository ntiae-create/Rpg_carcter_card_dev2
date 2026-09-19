/* ============================================================
   MESA RPG — MODAL DE FICHA DO JOGADOR
   Clica em "👁️ Ver ficha" no slot → abre modal com 4 abas
   (Personagem / Afinidade / Status / Inventário), somente leitura.
   Auto-contido (estilos inline), não depende dos CSS da ficha.
============================================================ */
"use strict";
(function () {
    let abaAtual = "personagem";
    let dadosAtuais = null;

    const ELEMENTOS = {
        agua: ["Água", "💧"],
        luz: ["Luz", "☀️"],
        terra: ["Terra", "🪨"],
        trevas: ["Trevas", "🌑"],
        vento: ["Vento", "🌪️"],
        fogo: ["Fogo", "🔥"],
        fisico: ["Físico", "💪"],
        magico: ["Mágico", "✨"]
    };

    const ESTILO_ABA_BASE =
        "padding:8px 4px;border:1px solid rgba(168,85,247,.3);border-radius:9px;" +
        "background:rgba(10,10,25,.85);color:#776b83;font-size:9px;font-weight:bold;" +
        "cursor:pointer;letter-spacing:.5px;transition:.15s;";
    const ESTILO_ABA_ATIVA =
        "padding:8px 4px;border:1px solid rgba(168,85,247,.7);border-radius:9px;" +
        "background:linear-gradient(145deg,rgba(124,58,237,.3),rgba(88,28,135,.15));" +
        "color:#f2e7ff;font-size:9px;font-weight:bold;cursor:pointer;letter-spacing:.5px;";

    /* ======================================================
       CONSTRUIR MODAL (uma única vez)
    ====================================================== */
    function construirModal() {
        if (document.getElementById("ficha-modal-root")) return;
        const root = document.createElement("div");
        root.id = "ficha-modal-root";
        root.innerHTML =
            '<div id="ficha-overlay" style="display:none;position:fixed;inset:0;' +
            'background:rgba(0,0,0,.7);z-index:9998;backdrop-filter:blur(3px);"></div>' +
            '<div id="ficha-modal" style="display:none;position:fixed;top:50%;left:50%;' +
            'transform:translate(-50%,-50%);z-index:9999;width:92%;max-width:480px;' +
            'max-height:88vh;overflow-y:auto;border-radius:20px;border:1px solid #713bb0;' +
            'background:linear-gradient(145deg,#19111f,#0d0813 55%,#08050c);color:#f5f0ff;' +
            'box-shadow:0 25px 70px rgba(0,0,0,.6),0 0 35px rgba(124,58,237,.15);">' +
            '<div style="position:sticky;top:0;display:flex;align-items:center;' +
            'justify-content:space-between;padding:12px 16px;' +
            'background:rgba(10,10,25,.95);border-bottom:1px solid rgba(168,85,247,.25);z-index:2;">' +
            '<strong id="ficha-modal-nome" style="font-size:14px;letter-spacing:1px;">Personagem</strong>' +
            '<button id="ficha-modal-fechar" style="background:none;border:1px solid #68408a;' +
            'border-radius:8px;color:#d8c7e8;padding:6px 12px;cursor:pointer;font-size:11px;">✕ Fechar</button>' +
            "</div>" +
            '<div id="ficha-abas" style="display:grid;grid-template-columns:repeat(4,1fr);' +
            'gap:4px;padding:10px 12px 0;"></div>' +
            '<div id="ficha-conteudo" style="padding:14px 16px 22px;"></div>' +
            "</div>";
        document.body.appendChild(root);

        const overlay = document.getElementById("ficha-overlay");
        overlay.addEventListener("click", fecharModal);
        document.getElementById("ficha-modal-fechar")
            .addEventListener("click", fecharModal);

        const abas = [
            ["personagem", "Personagem"],
            ["afinidade", "Afinidade"],
            ["status", "Status"],
            ["inventario", "Inventário"]
        ];
        const containerAbas = document.getElementById("ficha-abas");
        abas.forEach(function (par) {
            const b = document.createElement("button");
            b.dataset.aba = par[0];
            b.textContent = par[1];
            b.addEventListener("click", function () {
                abaAtual = par[0];
                atualizarEstiloAbas();
                renderizarConteudo();
            });
            containerAbas.appendChild(b);
        });
    }

    function atualizarEstiloAbas() {
        document.querySelectorAll("#ficha-abas button").forEach(function (b) {
            b.style.cssText =
                b.dataset.aba === abaAtual ? ESTILO_ABA_ATIVA : ESTILO_ABA_BASE;
        });
    }

    function fecharModal() {
        const overlay = document.getElementById("ficha-overlay");
        const modal = document.getElementById("ficha-modal");
        if (overlay) overlay.style.display = "none";
        if (modal) modal.style.display = "none";
    }

    /* ======================================================
       ABRIR MODAL PARA UM JOGADOR
    ====================================================== */
    function abrirModal(playerId) {
        construirModal();
        const jogador =
            typeof obterJogadorLocal === "function"
                ? obterJogadorLocal(playerId)
                : null;
        const personagem =
            typeof obterPersonagemPorSlot === "function"
                ? obterPersonagemPorSlot(playerId)
                : null;
        if (!jogador) {
            fecharModal();
            return;
        }
        dadosAtuais = { jogador: jogador, personagem: personagem };
        document.getElementById("ficha-modal-nome").textContent =
            jogador.nome || "Player " + playerId;
        document.getElementById("ficha-overlay").style.display = "block";
        document.getElementById("ficha-modal").style.display = "block";
        abaAtual = "personagem";
        atualizarEstiloAbas();
        renderizarConteudo();
    }

    /* ======================================================
       RENDERIZAR CONTEÚDO DAS 4 ABAS
    ====================================================== */
    function barraRecurso(label, atual, maximo, cor) {
        atual = Number(atual) || 0;
        maximo = Number(maximo) || 0;
        const pct = maximo > 0 ? Math.min(100, (atual / maximo) * 100) : 0;
        return (
            '<div style="margin-bottom:9px;">' +
            '<div style="display:flex;justify-content:space-between;font-size:10px;' +
            'color:#b9a9c8;margin-bottom:3px;"><span>' + label + "</span><span>" +
            atual + "/" + maximo + "</span></div>" +
            '<div style="height:8px;border-radius:5px;background:#211a29;overflow:hidden;">' +
            '<div style="height:100%;width:' + pct + "%;background:" + cor + ';"></div>' +
            "</div></div>"
        );
    }

    function renderizarConteudo() {
        const c = document.getElementById("ficha-conteudo");
        if (!c || !dadosAtuais) return;
        const jogador = dadosAtuais.jogador;
        const personagem = dadosAtuais.personagem;
        const atributos =
            jogador.atributos ||
            (personagem && (personagem.atributos || personagem.attributes)) ||
            {};
        const recursos = jogador.recursos || {};
        const inventario =
            (Array.isArray(jogador.inventario) && jogador.inventario) ||
            (personagem && Array.isArray(personagem.inventario) && personagem.inventario) ||
            (personagem && personagem.inventory &&
                Array.isArray(personagem.inventory.items) &&
                personagem.inventory.items) ||
            [];

        let html = "";

        if (abaAtual === "personagem") {
            const foto = jogador.avatar || "";
            html += '<div style="text-align:center;">';
            if (foto) {
                html +=
                    '<img src="' + foto + '" alt="' + (jogador.nome || "") +
                    '" style="width:140px;height:140px;object-fit:cover;border-radius:50%;' +
                    'border:2px solid #a855f7;box-shadow:0 0 20px rgba(168,85,247,.4);">';
            } else {
                html +=
                    '<div style="width:140px;height:140px;margin:auto;border-radius:50%;' +
                    'border:2px solid #a855f7;display:flex;align-items:center;justify-content:center;' +
                    'font-size:50px;background:radial-gradient(circle,#422469,#120a1c 72%);">👤</div>';
            }
            html += "</div>";
            html +=
                '<h2 style="text-align:center;margin:12px 0 4px;font-size:22px;letter-spacing:.5px;">' +
                (jogador.nome || "—") + "</h2>";
            html +=
                '<div style="text-align:center;color:#91849d;font-size:11px;margin-bottom:14px;">' +
                "Nv. " + (jogador.nivel || 1) + " • " + (jogador.raca || "—") +
                " • " + (jogador.classe || "—") + "</div>";
            const hp = jogador.hp || { atual: 0, maximo: 100 };
            const mp = jogador.mana || { atual: 0, maximo: 100 };
            html += barraRecurso("❤️ HP", hp.atual, hp.maximo, "#ef4444");
            html += barraRecurso("💙 Mana", mp.atual, mp.maximo, "#3b82f6");
            const extras = [];
            if (recursos.est !== undefined && recursos.est !== null)
                extras.push("⚡ EST: " + recursos.est);
            if (recursos.sanidade !== undefined && recursos.sanidade !== null)
                extras.push("🧠 Sanidade: " + recursos.sanidade);
            if (extras.length) {
                html +=
                    '<div style="font-size:11px;color:#b9a9c8;margin-top:10px;text-align:center;">' +
                    extras.join("　") + "</div>";
            }
        } else if (abaAtual === "afinidade") {
            const af = ELEMENTOS[jogador.afinidade];
            html += '<div style="text-align:center;padding:34px 0;">';
            if (af) {
                html +=
                    '<div style="font-size:64px;">' + af[1] + "</div>" +
                    '<div style="font-size:20px;margin-top:12px;color:#c084fc;letter-spacing:2px;">' +
                    af[0] + "</div>";
            } else {
                html +=
                    '<div style="font-size:54px;">❓</div>' +
                    '<div style="margin-top:12px;color:#75687f;font-size:12px;">Nenhuma afinidade confirmada</div>';
            }
            html += "</div>";
        } else if (abaAtual === "status") {
            const lista = [
                ["ATK", atributos.atk],
                ["ATK Mágico", atributos.atkMgc],
                ["DEF", atributos.def],
                ["RES", atributos.res],
                ["AGI", atributos.agi],
                ["INT", atributos.int]
            ];
            html +=
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
            lista.forEach(function (par) {
                const valor = par[1] !== undefined && par[1] !== null ? par[1] : "—";
                html +=
                    '<div style="padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.07);' +
                    'background:rgba(255,255,255,.03);text-align:center;">' +
                    '<div style="font-size:18px;font-weight:bold;color:#eee5f5;">' + valor + "</div>" +
                    '<div style="font-size:9px;color:#75687f;letter-spacing:1px;margin-top:3px;">' +
                    par[0] + "</div></div>";
            });
            html += "</div>";
        } else if (abaAtual === "inventario") {
            if (!inventario.length) {
                html =
                    '<div style="text-align:center;padding:34px 0;color:#75687f;font-size:12px;">🎒 Inventário vazio.</div>';
            } else {
                html +=
                    '<div style="display:flex;flex-direction:column;gap:6px;">';
                inventario.forEach(function (it) {
                    const nome =
                        (it && (it.name || it.nome)) || String(it);
                    const qtd =
                        (it && (it.quantity || it.quantidade)) || 1;
                    html +=
                        '<div style="display:flex;justify-content:space-between;padding:10px 12px;' +
                        'border-radius:10px;border:1px solid rgba(255,255,255,.07);' +
                        'background:rgba(255,255,255,.03);font-size:12px;">' +
                        "<span>" + nome + '</span><span style="color:#c084fc;font-weight:bold;">×' +
                        qtd + "</span></div>";
                });
                html += "</div>";
            }
        }
        c.innerHTML = html;
    }

    /* ======================================================
       INJETAR BOTÃO "VER FICHA" NOS SLOTS OCUPADOS
    ====================================================== */
    function injetarBotoes() {
        document.querySelectorAll(".player-card").forEach(function (card) {
            if (card.querySelector(".ver-ficha-btn")) return;
            const btn = document.createElement("button");
            btn.className = "ver-ficha-btn";
            btn.type = "button";
            btn.textContent = "👁️ Ver ficha";
            btn.style.cssText =
                "width:100%;margin-top:6px;padding:6px;border:1px solid rgba(168,85,247,.4);" +
                "border-radius:8px;background:rgba(124,58,237,.15);color:#d8b4fe;" +
                "font-size:10px;cursor:pointer;letter-spacing:1px;transition:.15s;";
            btn.addEventListener("mouseenter", function () {
                btn.style.borderColor = "#a855f7";
            });
            btn.addEventListener("mouseleave", function () {
                btn.style.borderColor = "rgba(168,85,247,.4)";
            });
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                abrirModal(Number(card.dataset.player));
            });
            const content = card.querySelector(".player-card-content");
            (content || card).appendChild(btn);
        });
    }

    function init() {
        construirModal();
        injetarBotoes();
        document.addEventListener(
            "mesa:estadoJogadoresAtualizado",
            injetarBotoes
        );
        document.addEventListener(
            "rpg:campanhaAtualizada",
            injetarBotoes
        );
        // Garante que botões reapareçam após re-renderizações dos cards
        setInterval(injetarBotoes, 1500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.FichaModal = { abrir: abrirModal, fechar: fecharModal };
    console.log("[FichaModal] Carregado.");
})();
