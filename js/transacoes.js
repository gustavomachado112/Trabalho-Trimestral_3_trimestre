import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } 
  from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const formTransacao = document.getElementById('formTransacao');
const listaTransacoes = document.getElementById('listaTransacoes');

const modalTransacao = document.getElementById('modalTransacao');
const btnNovaTransacao = document.getElementById('btnNovaTransacao');
const btnFecharModal = document.getElementById('fecharModal');
const btnCancelarModal = document.getElementById('cancelarModal');

btnNovaTransacao.addEventListener('click', () => {
    modalTransacao.style.display = 'flex';
});

btnFecharModal.addEventListener('click', () => {
    modalTransacao.style.display = 'none';
});
btnCancelarModal.addEventListener('click', () => {
    modalTransacao.style.display = 'none';
});

async function carregarTransacoes() {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, 'transacoes'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);

    const transacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    listaTransacoes.innerHTML = transacoes.map(t => `
        <div class="linha-item">
            <span>${t.data}</span>
            <span>${t.descricao}</span>
            <span>${t.categoria}</span>
            <span>R$ ${t.valor.toFixed(2)}</span>
            <button onclick="excluirTransacao('${t.id}')">Excluir</button>
        </div>
    `).join('');

    atualizarResumo(transacoes);
}

function atualizarResumo(transacoes) {
    const totalReceitas = transacoes
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);

    const totalDespesas = transacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);

    const saldoMes = totalReceitas - totalDespesas;

    document.getElementById('totalReceitas').textContent = `R$ ${totalReceitas.toFixed(2)}`;
    document.getElementById('totalDespesas').textContent = `R$ ${totalDespesas.toFixed(2)}`;
    document.getElementById('saldoMes').textContent = `R$ ${saldoMes.toFixed(2)}`;
}

formTransacao.onsubmit = async function(e) {
    e.preventDefault();
    if (!auth.currentUser) return alert('Faça login primeiro');

    const tipo = document.querySelector('input[name="tipoTransacao"]:checked').value;
    const descricao = document.getElementById('inputDescricao').value;
    const valor = parseFloat(document.getElementById('inputValor').value);
    const data = document.getElementById('inputData').value;
    const categoria = document.getElementById('selectCategoria').value;

    if (!descricao || !valor || !data || !categoria) return alert('Preencha todos os campos');
    if (valor <= 0) return alert('Valor deve ser positivo');

    try {
        await addDoc(collection(db, 'transacoes'), {
            userId: auth.currentUser.uid,
            tipo,
            descricao,
            valor,
            data,
            categoria,
            criadoEm: new Date()
        });

        alert('Transação salva!');
        formTransacao.reset();
        modalTransacao.style.display = 'none';
        carregarTransacoes();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};

window.excluirTransacao = async function(id) {
    if (!confirm('Excluir esta transação?')) return;
    try {
        await deleteDoc(doc(db, 'transacoes', id));
        carregarTransacoes();
    } catch (error) {
        alert('Erro ao excluir transação');
    }
};
document.addEventListener('DOMContentLoaded', carregarTransacoes);
