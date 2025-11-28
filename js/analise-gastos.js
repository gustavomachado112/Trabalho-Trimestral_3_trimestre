
import { auth, db } from "./firebase-config.js";
import { collection, getDocs, query, where, addDoc} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const listaCategorias = document.getElementById('listaCategorias');
const listaInsights = document.getElementById('listaInsights');

async function carregarAnaliseGastos() {
    if (!auth.currentUser) return;
    
    try {
        const q = query(collection(db, 'transacoes'), where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        
        const transacoes = snapshot.docs.map(doc => doc.data());
        gerarAnaliseCategorias(transacoes);
        gerarInsights(transacoes);
        
    } catch (error) {
        console.error('Erro ao carregar análise:', error);
    }
}
function gerarAnaliseCategorias(transacoes) {
    const gastosPorCategoria = {};
    let totalGasto = 0;
    transacoes
        .filter(t => t.tipo === 'despesa')
        .forEach(t => {
            gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + t.valor;
            totalGasto += t.valor;
        });
    
    document.getElementById('totalGasto').textContent = `R$ ${totalGasto.toFixed(2)}`;
    
    let maiorCategoria = '';
    let maiorValor = 0;
    
    Object.entries(gastosPorCategoria).forEach(([categoria, valor]) => {
        if (valor > maiorValor) {
            maiorValor = valor;
            maiorCategoria = categoria;
        }
    });
    
    document.getElementById('maiorCategoria').textContent = maiorCategoria || '-';
    
    const economiaPotencial = totalGasto * 0.15;
    document.getElementById('economiaPotencial').textContent = `R$ ${economiaPotencial.toFixed(2)}`;
    
    if (Object.keys(gastosPorCategoria).length === 0) {
        listaCategorias.innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 20px;">
                <p>Nenhum gasto registrado</p>
            </div>
        `;
        return;
    }
    
    const categoriasOrdenadas = Object.entries(gastosPorCategoria)
        .sort(([,a], [,b]) => b - a);
    
    listaCategorias.innerHTML = categoriasOrdenadas.map(([categoria, valor]) => {
        const percentual = totalGasto > 0 ? (valor / totalGasto) * 100 : 0;
        return `
            <div class="linha-categoria">
                <span class="nome-categoria">${categoria}</span>
                <div class="barra-categoria">
                    <div class="preenchimento-categoria" style="width: ${percentual}%"></div>
                </div>
                <span class="valor-categoria">R$ ${valor.toFixed(2)}</span>
            </div>
        `;
    }).join('');
}

function gerarInsights(transacoes) {
    const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
    const saldo = receitas - despesas;
    
    const insights = [];
    
    if (saldo > 0) {
        insights.push({
            titulo: "Bom trabalho!",
            descricao: `Seu saldo está positivo em R$ ${saldo.toFixed(2)}`,
            status: "positivo"
        });
    } else {
        insights.push({
            titulo: "Atenção ao orçamento",
            descricao: `Seu saldo está negativo em R$ ${Math.abs(saldo).toFixed(2)}`,
            status: "alerta"
        });
    }
    
    if (despesas > receitas * 0.8) {
        insights.push({
            titulo: "Gastos elevados",
            descricao: "Suas despesas estão próximas da sua receita total",
            status: "alerta"
        });
    }
    
    const economiaPotencial = receitas * 0.2;
    insights.push({
        titulo: "Meta de economia",
        descricao: `Você poderia economizar R$ ${economiaPotencial.toFixed(2)} por mês`,
        status: "positivo"
    });
    
    listaInsights.innerHTML = insights.map(insight => {
        const statusClass = insight.status === 'positivo' ? 'status-positivo' : 'status-alerta';
        
        return `
            <div class="item-metrica ${statusClass}">
                <div class="info-item">
                    <strong>${insight.titulo}</strong>
                    <small>${insight.descricao}</small>
                </div>
            </div>
        `;
    }).join('');
    
    if (insights.length === 0) {
        listaInsights.innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 20px;">
                <p>Adicione mais transações para gerar insights</p>
            </div>
        `;
    }
}

async function salvarAnalisePersonalizada() {
    if (!auth.currentUser) return alert('Faça login primeiro');
    
    const nomeAnalise = prompt('Nome para esta análise:');
    if (!nomeAnalise || !nomeAnalise.trim()) return;
    if (nomeAnalise.length < 3) return alert('Nome deve ter pelo menos 3 caracteres');
    
    try {
        await addDoc(collection(db, 'analises'), {
            userId: auth.currentUser.uid,
            nome: nomeAnalise.trim(),
            tipo: 'gastos',
            criadoEm: new Date()
        });
        alert('Análise salva!');
    } catch (error) {
        alert('Erro ao salvar análise');
    }
}

function adicionarBotaoSalvar() {
    const analiseArea = document.querySelector('.analise-area');
    if (analiseArea) {
        const botao = document.createElement('button');
        botao.className = 'btn btn-primario';
        botao.textContent = 'Salvar Análise';
        botao.style.margin = '20px auto';
        botao.style.display = 'block';
        botao.onclick = salvarAnalisePersonalizada;
        
        analiseArea.parentNode.insertBefore(botao, analiseArea.nextSibling);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarAnaliseGastos();
    adicionarBotaoSalvar();
});