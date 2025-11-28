
import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const formMeta = document.getElementById('formMeta');
const listaMetas = document.getElementById('listaMetas');
const btnNovaMeta = document.getElementById('btnNovaMeta');
const modalMeta = document.getElementById('modalMeta');
const fecharModal = document.getElementById('fecharModal');
const cancelarModal = document.getElementById('cancelarModal');

btnNovaMeta.onclick = () => {
    modalMeta.style.display = 'flex';
    document.getElementById('inputData').min = new Date().toISOString().split('T')[0];
    formMeta.reset();
};


fecharModal.onclick = () => modalMeta.style.display = 'none';
cancelarModal.onclick = () => modalMeta.style.display = 'none';

formMeta.onsubmit = async function(e) {
    e.preventDefault();
    if (!auth.currentUser) return alert('Faça login primeiro');
    
    const nome = document.getElementById('inputNome').value;
    const valor = parseFloat(document.getElementById('inputValor').value);
    const valorAtual = parseFloat(document.getElementById('inputValorAtual').value) || 0;
    const data = document.getElementById('inputData').value;
    const categoria = document.getElementById('selectCategoria').value;
    
    if (!nome.trim()) return alert('Nome da meta é obrigatório');
    if (!valor || valor <= 0) return alert('Valor da meta deve ser positivo');
    if (valorAtual < 0) return alert('Valor atual não pode ser negativo');
    if (valorAtual > valor) return alert('Valor atual não pode ser maior que a meta');
    if (!data) return alert('Data limite é obrigatória');
    
    try {
        await addDoc(collection(db, 'metas'), {
            userId: auth.currentUser.uid,
            nome: nome.trim(),
            valor,
            valorAtual,
            data,
            categoria,
            criadoEm: new Date()
        });
        
        alert('Meta criada!');
        modalMeta.style.display = 'none';
        carregarMetas();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};

async function carregarMetas() {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, 'metas'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        listaMetas.innerHTML = `
            <div class="card-vazio">
                <p>Nenhuma meta cadastrada</p>
                <small>Clique em "Nova Meta" para começar</small>
            </div>
        `;
        atualizarResumo([0, 0, 0]);
        return;
    }
    
    let concluidas = 0;
    let andamento = 0;
    let pendentes = 0;
    
    listaMetas.innerHTML = snapshot.docs.map(doc => {
        const meta = doc.data();
        const progresso = (meta.valorAtual / meta.valor) * 100;
        const estaConcluida = progresso >= 100;
        const status = estaConcluida ? 'concluido' : 'andamento';
        
        if (estaConcluida) concluidas++;
        else andamento++;
        
        return `
            <div class="card-item status-${status}" data-id="${doc.id}">
                <div class="info-card">
                    <div class="icone-card">${meta.categoria === 'pessoal' ? 'P' : 'T'}</div>
                    <div class="detalhes-card">
                        <h3>${meta.nome}</h3>
                        <p>${meta.categoria === 'pessoal' ? 'Meta Pessoal' : 'Meta Profissional'} • Até ${new Date(meta.data).toLocaleDateString('pt-BR')}</p>
                        <div class="barra-progresso">
                            <div class="progresso" style="width: ${Math.min(progresso, 100)}%"></div>
                        </div>
                        <div class="info-progresso">
                            <span>${progresso.toFixed(0)}% concluído</span>
                            <span>R$ ${meta.valorAtual.toFixed(2)} de R$ ${meta.valor.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div class="status-card">
                    <span class="texto-status ${status}">
                        ${estaConcluida ? 'Concluída' : 'Em andamento'}
                    </span>
                </div>
                <div class="acoes-card">
                    <button class="btn btn-editar" onclick="editarValorAtual('${doc.id}', ${meta.valorAtual}, ${meta.valor})">Atualizar</button>
                    <button class="btn btn-excluir" onclick="excluirMeta('${doc.id}')">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
    
    atualizarResumo([concluidas, andamento, pendentes]);
}

function atualizarResumo([concluidas, andamento, pendentes]) {
    document.getElementById('metasConcluidas').textContent = concluidas;
    document.getElementById('metasAndamento').textContent = andamento;
    document.getElementById('metasPendentes').textContent = pendentes;
}

window.editarValorAtual = async function(id, valorAtual, valorMaximo) {
    const novoValor = parseFloat(prompt('Novo valor economizado:', valorAtual));
    
    if (novoValor === null) return;
    if (novoValor < 0) return alert('Valor não pode ser negativo');
    if (novoValor > valorMaximo) return alert('Valor não pode ser maior que a meta');
    
    try {
        await updateDoc(doc(db, 'metas', id), {
            valorAtual: novoValor
        });
        carregarMetas();
    } catch (error) {
        alert('Erro ao atualizar');
    }
};

window.excluirMeta = async function(id) {
    if (!confirm('Excluir esta meta?')) return;
    try {
        await deleteDoc(doc(db, 'metas', id));
        carregarMetas();
    } catch (error) {
        alert('Erro ao excluir');
    }
};

document.addEventListener('DOMContentLoaded', carregarMetas);