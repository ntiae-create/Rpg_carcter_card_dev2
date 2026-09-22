(function () {
    "use strict";

    const isMesaPage = () => {
        const path = (window.location.pathname || "").toLowerCase();

        return (
            path.endsWith("/mesa.html") ||
            path.includes("mesa.html") ||
            path.includes("/mesa")
        );
    };

    const removerPainelAuthSeNecessario = () => {
        if (!isMesaPage()) {
            return;
        }

        const painel = document.getElementById("auth-login-panel");
        if (painel && painel.parentNode) {
            painel.remove();
        }

        const diagnostico = document.getElementById("auth-diagnostic");
        if (diagnostico && diagnostico.parentNode) {
            diagnostico.remove();
        }
    };

    if (isMesaPage()) {
        removerPainelAuthSeNecessario();
        return;
    }

    const observer = new MutationObserver(() => {
        removerPainelAuthSeNecessario();
    });

    const alvo = document.body || document.documentElement;
    if (alvo) {
        observer.observe(alvo, {
            childList: true,
            subtree: true
        });
    }

    window.addEventListener("load", removerPainelAuthSeNecessario, { once: true });
    setTimeout(removerPainelAuthSeNecessario, 150);
})();
