
const btnSimular = document.getElementById('btnSimular');
const listaMetas = document.getElementById('listaMetas');

btnSimular.onclick = () => {
    const periodo = parseInt(document.getElementById('selectPeriodo').value);
    const crescimento = parseFloat(document.getElementById('inputCrescimento').value) || 0;
    const investimento = parseFloat(document.getElementById('inputInvestimento').value) || 0;

    if (crescimento < -100 || crescimento > 100) return alert('Crescimento deve ser entre -100% e 100%');
    if (investimento < 0) return alert('Investimento deve ser positivo');

    calcularProjecao(periodo, crescimento, investimento);
};

function calcularProjecao(periodo, crescimento, investimento) {
    const patrimonioAtual = 5000;
    const receitaMensal = 3000;
    const despesaMensal = 2000;

    let patrimonio = patrimonioAtual;
    let receita = receitaMensal;

    for (let i = 0; i < periodo; i++) {
        patrimonio += (receita - despesaMensal) + investimento;
        receita *= (1 + crescimento / 100);
    }

    const receitaAnual = receita * 12;
    const variacaoPatrimonio = ((patrimonio - patrimonioAtual) / patrimonioAtual) * 100;
    const variacaoReceita = ((receitaAnual - receitaMensal * 12) / (receitaMensal * 12)) * 100;

    document.getElementById('patrimonioProjetado').textContent = `R$ ${patrimonio.toFixed(2)}`;
    document.getElementById('receitaAnual').textContent = `R$ ${receitaAnual.toFixed(2)}`;
    document.getElementById('variacaoPatrimonio').textContent = `${variacaoPatrimonio >= 0 ? '+' : ''}${variacaoPatrimonio.toFixed(1)}%`;
    document.getElementById('variacaoReceita').textContent = `${variacaoReceita >= 0 ? '+' : ''}${variacaoReceita.toFixed(1)}%`;

    gerarMetas(patrimonio);
}

function gerarMetas(patrimonioProjetado) {
    const metas = [];
    if (patrimonioProjetado >= 15000) metas.push('Reserva de emergência completa (6 meses de despesas)');
    if (patrimonioProjetado >= 50000) metas.push('Entrada para imóvel alcançada');
    if (patrimonioProjetado >= 100000) metas.push('Independência financeira próxima');

    if (metas.length === 0) {
        listaMetas.innerHTML = '<div style="text-align:center; color:#6b7280;">Continue poupando para alcançar novas metas</div>';
        return;
    }

    listaMetas.innerHTML = metas.map(meta => `
        <div class="item-lista">
            <div class="info-item">
                <strong>Meta Alcançável</strong>
                <small>${meta}</small>
            </div>
            <span class="status-item positivo">✓</span>
        </div>
    `).join('');
}
