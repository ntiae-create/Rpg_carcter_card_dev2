// ==========================================
// SISTEMA DE DANO REAL — RPG DE MESA
// ==========================================

function calcularDano(atacante, alvo, tipo = "fisico", habilidade = null) {
    // Valores base
    const ehCritico = Math.random() < (0.03 + (atacante.agi || 0) * 0.005);
    const multiplicadorCritico = ehCritico ? 1.5 : 1;
    
    // Ataque base conforme tipo
    let ataqueBase = tipo === "magico" 
        ? (atacante.atkMgc || 10) 
        : (atacante.atk || 10);
    
    // Defesa do alvo
    const defesa = tipo === "magico" 
        ? (alvo.res || 5) 
        : (alvo.def || 5);
    
    // Multiplicador de habilidade
    const multHabilidade = habilidade?.danoMult || 1;
    
    // Bônus de afinidade
    const afinidadeAtacante = atacante.afinidade || "Neutro";
    const afinidadeAlvo = alvo.afinidade || "Neutro";
    const bonusAfinidade = calcularBonusAfinidade(afinidadeAtacante, afinidadeAlvo);
    
    // Bônus de stacks de passiva
    const passivasDoAtacante = window.PassivasDados 
        ? window.PassivasDados.listarPorClasse(atacante.classe) 
        : [];
    let bonusPassiva = 1;
    if (passivasDoAtacante.length > 0 && window.PassivasStacks) {
        const stacks = window.PassivasStacks.obter(atacante.id, passivasDoAtacante[0].id);
        const efeitoPorStack = passivasDoAtacante[0].efeitoPorStack || 0;
        bonusPassiva = 1 + (stacks * efeitoPorStack / 100);
    }
    
    // Cálculo final
    const danoBase = (ataqueBase * multHabilidade - defesa * 0.5) * bonusAfinidade * bonusPassiva;
    const variacao = 0.9 + Math.random() * 0.2; // ±10%
    let danoFinal = Math.max(1, Math.round(danoBase * multiplicadorCritico * variacao));
    
    return {
        dano: danoFinal,
        critico: ehCritico,
        detalhes: {
            ataqueBase,
            defesa,
            bonusAfinidade,
            bonusPassiva,
            multiplicadorCritico,
            variacao
        }
    };
}

function calcularBonusAfinidade(atacante, alvo) {
    const vantagens = {
        "Fogo": ["Terra", "Gelo"],
        "Água": ["Fogo", "Terra"],
        "Terra": ["Vento", "Raio"],
        "Vento": ["Terra", "Fogo"],
        "Raio": ["Água", "Gelo"],
        "Gelo": ["Água", "Vento"],
        "Luz": ["Trevas"],
        "Trevas": ["Luz"]
    };
    
    if (vantagens[atacante]?.includes(alvo)) return 1.3; // +30%
    if (vantagens[alvo]?.includes(atacante)) return 0.7; // -30%
    return 1;
}

function calcularCura(curandeiro, alvo, habilidade = null) {
    const curaBase = (curandeiro.atkMgc || 10) + Math.floor((curandeiro.int || 10) / 2);
    const multHabilidade = habilidade?.curaMult || 1;
    
    // Bônus de stacks de passiva
    const passivasDoCurandeiro = window.PassivasDados 
        ? window.PassivasDados.listarPorClasse(curandeiro.classe) 
        : [];
    let bonusPassiva = 1;
    if (passivasDoCurandeiro.length > 0 && window.PassivasStacks) {
        const stacks = window.PassivasStacks.obter(curandeiro.id, passivasDoCurandeiro[0].id);
        const efeitoPorStack = passivasDoCurandeiro[0].efeitoPorStack || 0;
        bonusPassiva = 1 + (stacks * efeitoPorStack / 100);
    }
    
    const variacao = 0.9 + Math.random() * 0.2;
    const curaFinal = Math.max(1, Math.round(curaBase * multHabilidade * bonusPassiva * variacao));
    
    return {
        cura: curaFinal,
        detalhes: { curaBase, bonusPassiva, variacao }
    };
}

window.SistemaDano = {
    calcularDano,
    calcularCura,
    calcularBonusAfinidade
};
