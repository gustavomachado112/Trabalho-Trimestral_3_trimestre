import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } 
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const btnNovo = document.getElementById('btnNovoPlanejamento');
const listaReceitas = document.getElementById('listaReceitas');
const listaDespesas = document.getElementById('listaDespesas');
const saldoPrevistoEl = document.getElementById('saldoPrevisto');

btnNovo.onclick = async () => {
    if (!auth.currentUser) return alert('Faça login primeiro');
    
    const tipo = prompt('Tipo (receita/despesa):').toLowerCase();
    if (tipo !== 'receita' && tipo !== 'despesa') return alert('Tipo inválido');

    const descricao = prompt('Descrição:');
    if (!descricao) return alert('Descrição obrigatória');

    const valor = parseFloat(prompt('Valor:'));
    if (isNaN(valor) || valor <= 0) return alert('Valor inválido');

    try {
        await addDoc(collection(db, 'planejamentos'), {
            userId: auth.currentUser.uid,
            tipo,
            descricao,
            valor,
            criadoEm: new Date()
        });
        carregarPlanejamentos();
    } catch (e) {
        alert('Erro: ' + e.message);
    }
};

async function carregarPlanejamentos() {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'planejamentos'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);

    let receitas = 0;
    let despesas = 0;

    listaReceitas.innerHTML = '';
    listaDespesas.innerHTML = '';

    snapshot.docs.forEach(docSnap => {
        const item = docSnap.data();
        const html = `<div>
            ${item.descricao} - R$ ${item.valor.toFixed(2)} 
            <button onclick="excluirItem('${docSnap.id}')">×</button>
        </div>`;

        if (item.tipo === 'receita') {
            receitas += item.valor;
            listaReceitas.innerHTML += html;
        } else {
            despesas += item.valor;
            listaDespesas.innerHTML += html;
        }
    });

    const saldo = receitas - despesas;
    saldoPrevistoEl.textContent = `Saldo Previsto: R$ ${saldo.toFixed(2)}`;
}

window.excluirItem = async (id) => {
    if (!confirm('Deseja excluir?')) return;
    try {
        await deleteDoc(doc(db, 'planejamentos', id));
        carregarPlanejamentos();
    } catch (e) {
        alert('Erro ao excluir');
    }
};

document.addEventListener('DOMContentLoaded', carregarPlanejamentos);
