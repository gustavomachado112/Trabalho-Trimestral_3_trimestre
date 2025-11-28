import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where } 
    from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const resumoMensal = document.getElementById('resumoMensal');
const listaCategorias = document.getElementById('listaCategorias');
const listaInsights = document.getElementById('listaInsights');

async function carregarRelatorio() {
    if (!auth.currentUser) return;

    try {
        const q = query(collection(db, 'transacoes'), where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        const transacoes = snapshot.docs.map(doc => doc.data());

        gerarResumoMensal(transacoes);
        gerarTopCategorias(transacoes);
        gerarInsights(transacoes);

    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
    }
}

function gerarResumoMensal(transacoes) {
    const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;

    document.getElementById('saldoTotal').textContent = `R$ ${saldo.toFixed(2)}`;
    document.getElementById('totalReceitas').textContent = `R$ ${receitas.toFixed(2)}`;
    document.getElementById('totalDespesas').textContent = `R$ ${despesas.toFixed(2)}`;

    document.getElementById('saldoTotal').className = `valor-destaque ${saldo >= 0 ? 'positivo' : 'negativo'}`;
    document.getElementById('variacaoSaldo').textContent = saldo >= 0 ? 'Saldo positivo' : 'Saldo negativo';
    document.getElementById('variacaoSaldo').className = `texto-variacao ${saldo >= 0 ? 'positivo' : 'negativo'}`;

    if (resumoMensal) {
        resumoMensal.innerHTML = `
            <div class="item-metrica">
                <div class="info-item">
                    <strong>Receitas Totais</strong>
                    <small>R$ ${receitas.toFixed(2)} este mês</small>
                </div>
            </div>
            <div class="item-metrica">
                <div class="info-item">
                    <strong>Despesas Totais</strong>
                    <small>R$ ${despesas.toFixed(2)} este mês</small>
                </div>
            </div>
            <div class="item-metrica ${saldo >= 0 ? 'status-positivo' : 'status-andamento'}">
                <div class="info-item">
                    <strong>Saldo Final</strong>
                    <small>R$ ${saldo.toFixed(2)}</small>
                </div>
            </div>
        `;
    }
}

function gerarTopCategorias(transacoes) {
    const gastosPorCategoria = {};
    transacoes.filter(t => t.tipo === 'despesa')
        .forEach(t => {
            gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + t.valor;
        });

    const categoriasOrdenadas = Object.entries(gastosPorCategoria)
        .sort(([,a],[,b]) => b-a)
        .slice(0,5);

    if (listaCategorias) {
        listaCategorias.innerHTML = categoriasOrdenadas.length > 0 
            ? categoriasOrdenadas.map(([categoria, valor]) => `
                <div class="linha-categoria">
                    <span class="nome-categoria">${categoria}</span>
                    <span class="valor-categoria">R$ ${valor.toFixed(2)}</span>
                </div>
            `).join('')
            : '<div style="text-align:center;color:#6b7280;">Nenhuma despesa registrada</div>';
    }
}

function gerarInsights(transacoes) {
    const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;

    const insights = [];
    if (saldo > 0) insights.push('Seu saldo está positivo! Continue assim.');
    else insights.push('Atenção: seu saldo está negativo. Reveja seus gastos.');

    if (despesas > receitas * 0.8) insights.push('Suas despesas estão muito próximas da receita.');
    insights.push(`Você poderia economizar R$ ${(receitas*0.2).toFixed(2)} por mês.`);

    if (listaInsights) {
        listaInsights.innerHTML = insights.map(insight => `
            <div class="item-metrica">
                <div class="info-item">
                    <strong>Insight</strong>
                    <small>${insight}</small>
                </div>
            </div>
        `).join('');
    }
}

async function salvarRelatorioPersonalizado() {
    if (!auth.currentUser) return alert('Faça login primeiro');
    const nomeRelatorio = prompt('Nome do relatório:');
    if (!nomeRelatorio) return;

    try {
        await addDoc(collection(db, 'relatorios'), {
            userId: auth.currentUser.uid,
            nome: nomeRelatorio,
            criadoEm: new Date()
        });
        alert('Relatório salvo!');
    } catch (error) {
        alert('Erro ao salvar relatório');
    }
}

async function carregarRelatoriosSalvos() {
    if (!auth.currentUser) return;
    try {
        const q = query(collection(db, 'relatorios'), where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        console.log('Relatórios salvos:', snapshot.docs.map(doc => doc.data()));
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
    }
}

function adicionarBotaoSalvar() {
    const container = document.querySelector('.acoes-pagina');
    if (!container) return;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primario';
    btn.textContent = 'Salvar Relatório';
    btn.addEventListener('click', salvarRelatorioPersonalizado);
    container.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', () => {
    carregarRelatorio();
    carregarRelatoriosSalvos();
    adicionarBotaoSalvar();
});
