// configuracoes.js
import { auth, db } from './firebase-config.js';
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } 
    from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, updateDoc, getDoc } 
    from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const btnSalvarDados = document.getElementById('btnSalvarDados');
const btnAlterarSenha = document.getElementById('btnAlterarSenha');
async function carregarDadosUsuario() {
    if (!auth.currentUser) return;
    
    try {
        const userDoc = await getDoc(doc(db, 'usuarios', auth.currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('inputNome').value = userData.nome || '';
        }
        document.getElementById('inputEmail').value = auth.currentUser.email || '';
        
    } catch (error) {
        console.log('Erro ao carregar dados:', error);
    }
}
btnSalvarDados.onclick = async function() {
    if (!auth.currentUser) return alert('Faça login primeiro');
    const nome = document.getElementById('inputNome').value;
    const email = document.getElementById('inputEmail').value;
    if (!nome.trim()) return alert('Nome é obrigatório');
    if (!email.includes('@')) return alert('Email deve conter @');
    
    try {
        if (email !== auth.currentUser.email) {
            await updateEmail(auth.currentUser, email);
        }
        await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), {
            nome: nome.trim(),
            email: email,
            atualizadoEm: new Date()
        });
        
        alert('Dados atualizados com sucesso!');
        
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            alert('Para alterar o email, faça login novamente');
        } else {
            alert('Erro: ' + error.message);
        }
    }
};

btnAlterarSenha.onclick = async function() {
    if (!auth.currentUser) return alert('Faça login primeiro');
    const senhaAtual = document.getElementById('inputSenhaAtual').value;
    const novaSenha = document.getElementById('inputNovaSenha').value;
    const confirmarSenha = document.getElementById('inputConfirmarSenha').value;
    if (!senhaAtual) return alert('Senha atual é obrigatória');
    if (!novaSenha) return alert('Nova senha é obrigatória');
    if (novaSenha.length < 6) return alert('Nova senha deve ter pelo menos 6 caracteres');
    if (novaSenha !== confirmarSenha) return alert('As senhas não coincidem');
    
    try {
        const credential = EmailAuthProvider.credential(
            auth.currentUser.email, 
            senhaAtual
        );
        
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, novaSenha);
        document.getElementById('inputSenhaAtual').value = '';
        document.getElementById('inputNovaSenha').value = '';
        document.getElementById('inputConfirmarSenha').value = '';
        
        alert('Senha alterada com sucesso!');
        
    } catch (error) {
        if (error.code === 'auth/wrong-password') {
            alert('Senha atual incorreta');
        } else {
            alert('Erro: ' + error.message);
        }
    }
};

document.getElementById('inputEmail').addEventListener('blur', function() {
    if (this.value && !this.value.includes('@')) {
        this.style.borderColor = '#ef4444';
    } else {
        this.style.borderColor = '#d1d5db';
    }
});

document.getElementById('inputNovaSenha').addEventListener('blur', function() {
    if (this.value && this.value.length < 6) {
        this.style.borderColor = '#ef4444';
    } else {
        this.style.borderColor = '#d1d5db';
    }
});

document.getElementById('inputConfirmarSenha').addEventListener('input', function() {
    const novaSenha = document.getElementById('inputNovaSenha').value;
    const confirmar = this.value;
    
    if (confirmar && novaSenha !== confirmar) {
        this.style.borderColor = '#ef4444';
    } else {
        this.style.borderColor = '#d1d5db';
    }
});

document.addEventListener('DOMContentLoaded', carregarDadosUsuario);