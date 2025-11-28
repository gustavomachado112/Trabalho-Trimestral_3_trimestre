
import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const inputPesquisa = document.getElementById('inputPesquisa');
const categoriasLista = document.querySelectorAll('.categoria-item');
const listaDuvidas = document.querySelector('.lista-duvidas');

let estado = {
    categoriaAtiva: 'basico',
    termoPesquisa: '',
    duvidasExpandidas: new Set()
};

const duvidas = [
    {
        id: 1,
        categoria: 'basico',
        pergunta: 'Como adicionar minha primeira transação?',
        resposta: `<p>Para adicionar uma transação:</p>
                  <ol>
                      <li>Acesse a página "Transações"</li>
                      <li>Clique no botão "Nova Transação"</li>
                      <li>Preencha os dados: descrição, valor, data e categoria</li>
                      <li>Clique em "Salvar Transação"</li>
                  </ol>`
    },
    {
        id: 2,
        categoria: 'orcamento', 
        pergunta: 'Como criar um orçamento mensal?',
        resposta: `<p>Para criar um orçamento:</p>
                  <ul>
                      <li>Vá para "Orçamentos"</li>
                      <li>Clique em "Novo Orçamento"</li>
                      <li>Selecione a categoria e defina o valor limite</li>
                      <li>Escolha o mês de referência</li>
                      <li>Salve e acompanhe o progresso</li>
                  </ul>`
    },
    {
        id: 3,
        categoria: 'basico',
        pergunta: 'Posso alterar uma transação já registrada?',
        resposta: `<p>Sim! Para editar uma transação:</p>
                  <ul>
                      <li>Na página "Transações", localize a transação desejada</li>
                      <li>Clique no botão de editar ao lado da transação</li>
                      <li>Faça as alterações necessárias</li>
                      <li>Clique em "Salvar Alterações"</li>
                  </ul>`
    },
    {
        id: 4,
        categoria: 'metas',
        pergunta: 'Como definir metas financeiras?',
        resposta: `<p>Para criar metas:</p>
                  <ol>
                      <li>Acesse "Metas Financeiras"</li>
                      <li>Clique em "Nova Meta"</li>
                      <li>Defina: nome, valor objetivo e prazo</li>
                      <li>Acompanhe o progresso na barra de evolução</li>
                  </ol>`
    }
];

function filtrarDuvidas() {
    const duvidasFiltradas = duvidas.filter(duvida => {
        const categoriaMatch = estado.categoriaAtiva === 'todos' || duvida.categoria === estado.categoriaAtiva;
        const pesquisaMatch = !estado.termoPesquisa || 
            duvida.pergunta.toLowerCase().includes(estado.termoPesquisa.toLowerCase()) ||
            duvida.resposta.toLowerCase().includes(estado.termoPesquisa.toLowerCase());
        
        return categoriaMatch && pesquisaMatch;
    });
    
    renderizarDuvidas(duvidasFiltradas);
}
function renderizarDuvidas(duvidasFiltradas) {
    if (duvidasFiltradas.length === 0) {
        listaDuvidas.innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 40px;">
                <p>Nenhuma dúvida encontrada</p>
                <small>Tente outra categoria ou termo de pesquisa</small>
            </div>
        `;
        return;
    }
    
    listaDuvidas.innerHTML = duvidasFiltradas.map(duvida => {
        const isExpandida = estado.duvidasExpandidas.has(duvida.id);
        
        return `
            <div class="card-duvida" data-categoria="${duvida.categoria}">
                <div class="pergunta-duvida" onclick="toggleDuvida(${duvida.id})">
                    <h3>${duvida.pergunta}</h3>
                    <button class="btn-expandir">${isExpandida ? '−' : '+'}</button>
                </div>
                <div class="resposta-duvida" style="display: ${isExpandida ? 'block' : 'none'}">
                    ${duvida.resposta}
                </div>
            </div>
        `;
    }).join('');
}

window.toggleDuvida = function(id) {
    if (estado.duvidasExpandidas.has(id)) {
        estado.duvidasExpandidas.delete(id);
    } else {
        estado.duvidasExpandidas.add(id);
    }
    filtrarDuvidas();
};

categoriasLista.forEach(categoria => {
    categoria.addEventListener('click', function() {
        categoriasLista.forEach(cat => cat.classList.remove('ativa'));
        this.classList.add('ativa');
        estado.categoriaAtiva = this.dataset.categoria;
        filtrarDuvidas();
    });
});

inputPesquisa.addEventListener('input', function() {
    estado.termoPesquisa = this.value;
    filtrarDuvidas();
});

async function enviarNovaDuvida() {
    if (!auth.currentUser) return alert('Faça login para enviar dúvidas');
    
    const pergunta = prompt('Qual sua dúvida?');
    if (!pergunta || !pergunta.trim()) return;
    
    if (pergunta.length < 5) return alert('A dúvida deve ter pelo menos 5 caracteres');
    
    try {
        await addDoc(collection(db, 'duvidas'), {
            userId: auth.currentUser.uid,
            pergunta: pergunta.trim(),
            categoria: 'outros',
            status: 'pendente',
            criadoEm: new Date()
        });
        
        alert('Dúvida enviada! Entraremos em contato em breve.');
    } catch (error) {
        alert('Erro ao enviar dúvida');
    }
}

async function carregarMinhasDuvidas() {
    if (!auth.currentUser) return;
    
    try {
        const q = query(collection(db, 'duvidas'), where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        
        console.log('Minhas dúvidas:', snapshot.docs.map(doc => doc.data()));
    } catch (error) {
        console.log('Erro ao carregar dúvidas:', error);
    }
}

function adicionarBotaoNovaDuvida() {
    const secaoContato = document.querySelector('.secao-contato');
    if (secaoContato) {
        secaoContato.innerHTML += `
            <button class="btn btn-primario" onclick="enviarNovaDuvida()" style="margin-top: 15px;">
                Enviar Nova Dúvida
            </button>
        `;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    filtrarDuvidas(); 
    carregarMinhasDuvidas();
    adicionarBotaoNovaDuvida();
});