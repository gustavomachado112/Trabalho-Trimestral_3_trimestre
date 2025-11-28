import { auth, db } from './firebase-config.js';

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const formCategoria = document.getElementById('formCategoria');
const listaCategorias = document.getElementById('listaCategorias');
const btnNovaCategoria = document.getElementById('btnNovaCategoria');
const modalCategoria = document.getElementById('modalCategoria');
const fecharModal = document.getElementById('fecharModal');
const cancelarModal = document.getElementById('cancelarModal');

let estado = {
    editandoId: null
};

btnNovaCategoria.onclick = () => {
    modalCategoria.style.display = 'flex';
    formCategoria.reset();
    document.getElementById('inputCor').value = '#667eea';
    estado.editandoId = null;
};

fecharModal.onclick = () => modalCategoria.style.display = 'none';
cancelarModal.onclick = () => modalCategoria.style.display = 'none';
formCategoria.onsubmit = async function(e) {
    e.preventDefault();
    if (!auth.currentUser) return alert('Faça login primeiro');
    
    const nome = document.getElementById('inputNome').value;
    const tipo = document.getElementById('selectTipo').value;
    const cor = document.getElementById('inputCor').value;
    
    if (!nome.trim()) return alert('Nome da categoria é obrigatório');
    if (!tipo) return alert('Tipo é obrigatório');
    if (!cor) return alert('Cor é obrigatória');

    const categoriasExistentes = await getCategoriasUsuario();
    const nomeExiste = categoriasExistentes.some(cat => 
        cat.nome.toLowerCase() === nome.toLowerCase().trim() && 
        cat.id !== estado.editandoId
    );
    
    if (nomeExiste) return alert('Já existe uma categoria com este nome');
    
    try {
        if (estado.editandoId) {
            await updateDoc(doc(db, 'categorias', estado.editandoId), {
                nome: nome.trim(),
                tipo,
                cor,
                atualizadoEm: new Date()
            });
            alert('Categoria atualizada!');
        } else {
            await addDoc(collection(db, 'categorias'), {
                userId: auth.currentUser.uid,
                nome: nome.trim(),
                tipo,
                cor,
                criadoEm: new Date()
            });
            alert('Categoria criada!');
        }
        
        modalCategoria.style.display = 'none';
        carregarCategorias();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};

async function getCategoriasUsuario() {
    if (!auth.currentUser) return [];
    
    const q = query(collection(db, 'categorias'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function carregarCategorias() {
    const categorias = await getCategoriasUsuario();
    
    if (categorias.length === 0) {
        listaCategorias.innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 40px;">
                <p>Nenhuma categoria cadastrada</p>
                <small>Clique em "Nova Categoria" para começar</small>
            </div>
        `;
        return;
    }

    const categoriasDespesa = categorias.filter(cat => cat.tipo === 'despesa');
    const categoriasReceita = categorias.filter(cat => cat.tipo === 'receita');
    let html = '';
    if (categoriasDespesa.length > 0) {
        html += `<h3 style="color: #374151; margin: 20px 0 10px 0; font-size: 16px;">Despesas</h3>`;
        html += categoriasDespesa.map(categoria => criarCardCategoria(categoria)).join('');
    }
    if (categoriasReceita.length > 0) {
        html += `<h3 style="color: #374151; margin: 20px 0 10px 0; font-size: 16px;">Receitas</h3>`;
        html += categoriasReceita.map(categoria => criarCardCategoria(categoria)).join('');
    }
    
    listaCategorias.innerHTML = html;
}
function criarCardCategoria(categoria) {
    const tipoTexto = categoria.tipo === 'despesa' ? 'Despesa' : 'Receita';
    
    return `
        <div class="card-item" data-id="${categoria.id}">
            <div class="info-card">
                <div class="icone-card" style="background: ${categoria.cor}">
                    ${categoria.nome.charAt(0).toUpperCase()}
                </div>
                <div class="detalhes-card">
                    <h3>${categoria.nome}</h3>
                    <p>${tipoTexto}</p>
                </div>
            </div>
            <div class="acoes-card">
                <button class="btn btn-editar" onclick="editarCategoria('${categoria.id}')">Editar</button>
                <button class="btn btn-excluir" onclick="excluirCategoria('${categoria.id}')">Excluir</button>
            </div>
        </div>
    `;
}
window.editarCategoria = async function(id) {
    const categorias = await getCategoriasUsuario();
    const categoria = categorias.find(cat => cat.id === id);
    
    if (!categoria) return;
    
    document.getElementById('inputNome').value = categoria.nome;
    document.getElementById('selectTipo').value = categoria.tipo;
    document.getElementById('inputCor').value = categoria.cor;
    
    estado.editandoId = id;
    modalCategoria.style.display = 'flex';
};

window.excluirCategoria = async function(id) {
    if (!confirm('Excluir esta categoria?')) return;
    const q = query(collection(db, 'transacoes'), 
        where('userId', '==', auth.currentUser.uid),
        where('categoria', '==', id)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        return alert('Esta categoria está sendo usada em transações. Não pode ser excluída.');
    }
    
    try {
        await deleteDoc(doc(db, 'categorias', id));
        carregarCategorias();
    } catch (error) {
        alert('Erro ao excluir categoria');
    }
};
document.addEventListener('DOMContentLoaded', carregarCategorias);