
import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const formEconomia = document.getElementById('formEconomia');
const listaEconomias = document.getElementById('listaEconomias');
const btnNovaEconomia = document.getElementById('btnNovaEconomia');
const modalEconomia = document.getElementById('modalEconomia');
const fecharModal = document.getElementById('fecharModal');
const cancelarModal = document.getElementById('cancelarModal');


const tiposEconomia = {
    mensal: "Economia Mensal",
    emergencia: "Fundo de Emergência", 
    meta: "Economia para Meta"
};

btnNovaEconomia.onclick = () => {
    modalEconomia.style.display = 'flex';
    formEconomia.reset();
};

fecharModal.onclick = () => modalEconomia.style.display = 'none';
cancelarModal.onclick = () => modalEconomia.style.display = 'none';

formEconomia.onsubmit = async function(e) {
    e.preventDefault();
    if (!auth.currentUser) return alert('Faça login primeiro');
    
    const descricao = document.getElementById('inputDescricao').value;
    const tipo = document.getElementById('selectTipo').value;
    const meta = parseFloat(document.getElementById('inputMeta').value);
    const atual = parseFloat(document.getElementById('inputAtual').value) || 0;
    
    if (!descricao.trim()) return alert('Descrição é obrigatória');
    if (!tipo) return alert('Tipo é obrigatório');
    if (!meta || meta <= 0) return alert('Meta deve ser um valor positivo');
    if (atual < 0) return alert('Valor atual não pode ser negativo');
    if (atual > meta) return alert('Valor atual não pode ser maior que a meta');
    
    try {
        await addDoc(collection(db, 'economias'), {
            userId: auth.currentUser.uid,
            descricao: descricao.trim(),
            tipo,
            meta,
            atual,
            criadoEm: new Date()
        });
        
        alert('Economia registrada!');
        modalEconomia.style.display = 'none';
        carregarEconomias();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};

async function carregarEconomias() {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, 'economias'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        listaEconomias.innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 40px;">
                <p>Nenhuma economia registrada</p>
                <small>Clique em "Registrar Economia" para começar</small>
            </div>
        `;
        atualizarResumo(0, 0, 0);
        return;
    }
    
    let totalEconomizado = 0;
    let economiaMes = 0;
    let metaMensal = 0;
    
    listaEconomias.innerHTML = snapshot.docs.map(doc => {
        const economia = doc.data();
        totalEconomizado += economia.atual;
        metaMensal += economia.meta;
        
        const criadoEm = economia.criadoEm.toDate();
        const dias = (new Date() - criadoEm) / (1000 * 60 * 60 * 24);
        if (dias <= 30) {
            economiaMes += economia.atual;
        }
        
        const progresso = (economia.atual / economia.meta) * 100;
        const estaConcluido = economia.atual >= economia.meta;
        
        return `
            <div class="card-item ${estaConcluido ? 'status-concluido' : ''}" data-id="${doc.id}">
                <div class="info-card">
                    <div class="icone-card tipo-${economia.tipo}">
                        ${tiposEconomia[economia.tipo]?.charAt(0) || 'E'}
                    </div>
                    <div class="detalhes-card">
                        <h3>${economia.descricao}</h3>
                        <p>${tiposEconomia[economia.tipo]}</p>
                        <div class="info-progresso">
                            <div class="barra-progresso">
                                <div class="progresso" style="width: ${Math.min(progresso, 100)}%"></div>
                            </div>
                            <div class="texto-progresso">
                                <span>${progresso.toFixed(0)}%</span>
                                <span class="texto-status">${estaConcluido ? 'Concluído' : 'Em andamento'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="valores-card">
                    <div class="linha-valor">
                        <span class="texto-rotulo">Atual:</span>
                        <span class="texto-valor positivo">R$ ${economia.atual.toFixed(2)}</span>
                    </div>
                    <div class="linha-valor">
                        <span class="texto-rotulo">Meta:</span>
                        <span class="texto-valor">R$ ${economia.meta.toFixed(2)}</span>
                    </div>
                    <div class="linha-valor">
                        <span class="texto-rotulo">Faltam:</span>
                        <span class="texto-valor">R$ ${(economia.meta - economia.atual).toFixed(2)}</span>
                    </div>
                </div>
                <div class="acoes-card">
                    <button class="btn btn-editar" onclick="editarValorAtual('${doc.id}', ${economia.atual}, ${economia.meta})">Atualizar</button>
                    <button class="btn btn-excluir" onclick="excluirEconomia('${doc.id}')">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
    
    atualizarResumo(totalEconomizado, economiaMes, metaMensal);
}

function atualizarResumo(totalEconomizado, economiaMes, metaMensal) {
    document.getElementById('totalEconomizado').textContent = `R$ ${totalEconomizado.toFixed(2)}`;
    document.getElementById('economiaMes').textContent = `R$ ${economiaMes.toFixed(2)}`;
    document.getElementById('metaMensal').textContent = `R$ ${metaMensal.toFixed(2)}`;
}

window.editarValorAtual = async function(id, valorAtual, valorMaximo) {
    const novoValor = parseFloat(prompt('Novo valor economizado:', valorAtual));
    
    if (novoValor === null) return;
    if (novoValor < 0) return alert('Valor não pode ser negativo');
    if (novoValor > valorMaximo) return alert('Valor não pode ser maior que a meta');
    
    try {
        await updateDoc(doc(db, 'economias', id), {
            atual: novoValor
        });
        carregarEconomias();
    } catch (error) {
        alert('Erro ao atualizar');
    }
};

window.excluirEconomia = async function(id) {
    if (!confirm('Excluir esta economia?')) return;
    try {
        await deleteDoc(doc(db, 'economias', id));
        carregarEconomias();
    } catch (error) {
        alert('Erro ao excluir');
    }
};

document.addEventListener('DOMContentLoaded', carregarEconomias);