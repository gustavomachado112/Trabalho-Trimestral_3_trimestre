
import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const formOrcamento = document.getElementById('formOrcamento');
const listaOrcamentos = document.getElementById('listaOrcamentos');
const btnNovoOrcamento = document.getElementById('btnNovoOrcamento');
const modalOrcamento = document.getElementById('modalOrcamento');
const fecharModal = document.getElementById('fecharModal');
const cancelarModal = document.getElementById('cancelarModal');

// Categorias
const categorias = {
    alimentacao: "Alimentação",
    transporte: "Transporte",
    moradia: "Moradia",
    saude: "Saúde",
    lazer: "Lazer",
    educacao: "Educação",
    outros: "Outros"
};

// Popular selects
function popularSelects() {
    const selectCategoria = document.getElementById('selectCategoria');
    selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>';
    
    Object.entries(categorias).forEach(([value, label]) => {
        selectCategoria.innerHTML += `<option value="${value}">${label}</option>`;
    });

    // Popular meses (próximos 6 meses)
    const selectMes = document.getElementById('selectMes');
    selectMes.innerHTML = '<option value="">Selecione o mês</option>';
    
    const meses = [];
    const hoje = new Date();
    for (let i = 0; i < 6; i++) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
        const valor = data.toISOString().slice(0, 7);
        const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        meses.push({ value: valor, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    
    meses.forEach(mes => {
        selectMes.innerHTML += `<option value="${mes.value}">${mes.label}</option>`;
    });
}

// Carregar orçamentos
async function carregarOrcamentos() {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, 'orcamentos'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    
    listaOrcamentos.innerHTML = snapshot.docs.map(doc => {
        const orcamento = doc.data();
        const progresso = orcamento.gastoAtual / orcamento.valorLimite * 100;
        const restante = orcamento.valorLimite - orcamento.gastoAtual;
        
        return `
            <div class="card-item">
                <div class="info-card">
                    <div class="icone-card">${categorias[orcamento.categoria]?.charAt(0) || 'O'}</div>
                    <div class="detalhes-card">
                        <h3>${categorias[orcamento.categoria]}</h3>
                        <p>${orcamento.mesReferencia}</p>
                        <div class="barra-progresso">
                            <div class="progresso" style="width: ${Math.min(progresso, 100)}%"></div>
                        </div>
                        <div class="info-bar">
                            <span>${progresso.toFixed(0)}% utilizado</span>
                            <span class="texto-status">${progresso >= 100 ? 'Excedido' : 'Em andamento'}</span>
                        </div>
                    </div>
                </div>
                <div class="valores-card">
                    <span class="texto-valor">R$ ${orcamento.valorLimite.toFixed(2)}</span>
                    <span class="texto-gasto">Gasto: R$ ${orcamento.gastoAtual.toFixed(2)}</span>
                    <span class="texto-restante ${restante >= 0 ? 'positivo' : 'negativo'}">
                        ${restante >= 0 ? '+' : ''}R$ ${Math.abs(restante).toFixed(2)}
                    </span>
                </div>
                <div class="acoes-card">
                    <button class="btn btn-excluir" onclick="excluirOrcamento('${doc.id}')">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
    
    calcularTotais(snapshot.docs);
}

// Calcular totais
function calcularTotais(docs) {
    const totalOrcado = docs.reduce((sum, doc) => sum + doc.data().valorLimite, 0);
    const totalGasto = docs.reduce((sum, doc) => sum + doc.data().gastoAtual, 0);
    const totalRestante = totalOrcado - totalGasto;
    
    document.getElementById('totalOrcado').textContent = `R$ ${totalOrcado.toFixed(2)}`;
    document.getElementById('totalGasto').textContent = `R$ ${totalGasto.toFixed(2)}`;
    document.getElementById('totalRestante').textContent = `R$ ${totalRestante.toFixed(2)}`;
    document.getElementById('totalRestante').className = `valor-destaque ${totalRestante >= 0 ? 'positivo' : 'negativo'}`;
}

// Abrir modal
btnNovoOrcamento.onclick = () => {
    modalOrcamento.style.display = 'flex';
    formOrcamento.reset();
};

// Fechar modal
fecharModal.onclick = () => modalOrcamento.style.display = 'none';
cancelarModal.onclick = () => modalOrcamento.style.display = 'none';

// Salvar orçamento
formOrcamento.onsubmit = async function(e) {
    e.preventDefault();
    if (!auth.currentUser) return alert('Faça login primeiro');
    
    const categoria = document.getElementById('selectCategoria').value;
    const valorLimite = parseFloat(document.getElementById('inputValorLimite').value);
    const mesReferencia = document.getElementById('selectMes').value;
    
    // Validações
    if (!categoria) return alert('Selecione uma categoria');
    if (!valorLimite || valorLimite <= 0) return alert('Valor limite deve ser positivo');
    if (!mesReferencia) return alert('Selecione um mês');
    
    try {
        await addDoc(collection(db, 'orcamentos'), {
            userId: auth.currentUser.uid,
            categoria,
            valorLimite,
            mesReferencia,
            gastoAtual: 0,
            criadoEm: new Date()
        });
        
        alert('Orçamento criado!');
        modalOrcamento.style.display = 'none';
        carregarOrcamentos();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};

// Excluir orçamento
window.excluirOrcamento = async function(id) {
    if (!confirm('Excluir este orçamento?')) return;
    try {
        await deleteDoc(doc(db, 'orcamentos', id));
        carregarOrcamentos();
    } catch (error) {
        alert('Erro ao excluir');
    }
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    popularSelects();
    carregarOrcamentos();
});