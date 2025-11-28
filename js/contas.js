
import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const formConta = document.getElementById('formConta');
const listaContas = document.getElementById('listaContas');
const btnNovaConta = document.getElementById('btnNovaConta');
const modalConta = document.getElementById('modalConta');
const fecharModal = document.getElementById('fecharModal');
const cancelarModal = document.getElementById('cancelarModal');

const tiposConta = {
    corrente: "Conta Corrente",
    poupanca: "Poupança", 
    investimento: "Conta Investimento",
    carteira: "Carteira",
    salario: "Conta Salário"
};

btnNovaConta.onclick = () => {
    modalConta.style.display = 'flex';
    formConta.reset();
};

fecharModal.onclick = () => modalConta.style.display = 'none';
cancelarModal.onclick = () => modalConta.style.display = 'none';

formConta.onsubmit = async function(e) {
    e.preventDefault();
    if (!auth.currentUser) return alert('Faça login primeiro');
    
    const nome = document.getElementById('inputNomeConta').value;
    const tipo = document.getElementById('selectTipoConta').value;
    const banco = document.getElementById('inputBanco').value;
    const agencia = document.getElementById('inputAgencia').value;
    const numeroConta = document.getElementById('inputNumeroConta').value;
    const saldoInicial = parseFloat(document.getElementById('inputSaldoInicial').value) || 0;
    
    if (!nome.trim()) return alert('Nome da conta é obrigatório');
    if (!tipo) return alert('Tipo de conta é obrigatório');
    if (isNaN(saldoInicial)) return alert('Saldo deve ser um número');
    
    try {
        await addDoc(collection(db, 'contas'), {
            userId: auth.currentUser.uid,
            nome: nome.trim(),
            tipo,
            banco: banco.trim() || 'Não informado',
            agencia: agencia.trim() || 'Não informado',
            numeroConta: numeroConta.trim() || 'Não informado',
            saldo: saldoInicial,
            criadoEm: new Date()
        });
        
        alert('Conta criada!');
        modalConta.style.display = 'none';
        carregarContas();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};

async function carregarContas() {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, 'contas'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        listaContas.innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 40px;">
                <p>Nenhuma conta cadastrada</p>
                <small>Clique em "Nova Conta" para começar</small>
            </div>
        `;
        atualizarResumo(0, 0, 0);
        return;
    }
    
    let saldoTotal = 0;
    let receitasMes = 0;
    let despesasMes = 0;
    
    listaContas.innerHTML = snapshot.docs.map(doc => {
        const conta = doc.data();
        saldoTotal += conta.saldo;
        
        return `
            <div class="card-item" data-id="${doc.id}">
                <div class="info-card">
                    <div class="icone-card tipo-${conta.tipo}">
                        ${tiposConta[conta.tipo]?.charAt(0) || 'C'}
                    </div>
                    <div class="detalhes-card">
                        <h3>${conta.nome}</h3>
                        <p>${conta.banco}</p>
                        <div class="tag-tipo">${tiposConta[conta.tipo]}</div>
                    </div>
                </div>
                <div class="saldo-card">
                    <span class="texto-saldo ${conta.saldo >= 0 ? 'positivo' : 'negativo'}">
                        R$ ${conta.saldo.toFixed(2)}
                    </span>
                    <span class="texto-variacao">
                        ${conta.agencia && conta.numeroConta ? `${conta.agencia} / ${conta.numeroConta}` : 'Conta não informada'}
                    </span>
                </div>
                <div class="acoes-card">
                    <button class="btn btn-editar" onclick="editarSaldo('${doc.id}', ${conta.saldo})">Editar Saldo</button>
                    <button class="btn btn-excluir" onclick="excluirConta('${doc.id}')">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
    
    await calcularTransacoesMes(receitasMes, despesasMes);
    atualizarResumo(saldoTotal, receitasMes, despesasMes);
}

async function calcularTransacoesMes(receitasMes, despesasMes) {
    try {
        const q = query(
            collection(db, 'transacoes'), 
            where('userId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        snapshot.docs.forEach(doc => {
            const transacao = doc.data();
            const dataTransacao = transacao.criadoEm.toDate();
            
            if (dataTransacao.getMonth() === mesAtual && dataTransacao.getFullYear() === anoAtual) {
                if (transacao.tipo === 'receita') {
                    receitasMes += transacao.valor;
                } else {
                    despesasMes += transacao.valor;
                }
            }
        });
    } catch (error) {
        console.log('Erro ao calcular transações:', error);
    }
}

function atualizarResumo(saldoTotal, receitasMes, despesasMes) {
    document.getElementById('saldoTotal').textContent = `R$ ${saldoTotal.toFixed(2)}`;
    document.getElementById('receitasMes').textContent = `R$ ${receitasMes.toFixed(2)}`;
    document.getElementById('despesasMes').textContent = `R$ ${despesasMes.toFixed(2)}`;
    document.getElementById('saldoTotal').className = `valor-destaque ${saldoTotal >= 0 ? 'positivo' : 'negativo'}`;
}

window.editarSaldo = async function(id, saldoAtual) {
    const novoSaldo = parseFloat(prompt('Novo saldo da conta:', saldoAtual));
    
    if (novoSaldo === null) return;
    if (isNaN(novoSaldo)) return alert('Saldo deve ser um número');
    
    try {
        await updateDoc(doc(db, 'contas', id), {
            saldo: novoSaldo
        });
        carregarContas();
    } catch (error) {
        alert('Erro ao atualizar saldo');
    }
};

window.excluirConta = async function(id) {
    if (!confirm('Excluir esta conta?')) return;
    try {
        await deleteDoc(doc(db, 'contas', id));
        carregarContas();
    } catch (error) {
        alert('Erro ao excluir conta');
    }
};

document.addEventListener('DOMContentLoaded', carregarContas);