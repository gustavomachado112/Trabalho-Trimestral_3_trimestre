import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

document.getElementById('formCadastro').onsubmit = async function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('inputNome').value;
    const email = document.getElementById('inputEmailCadastro').value;
    const senha = document.getElementById('inputSenhaCadastro').value;
    const confirmar = document.getElementById('inputConfirmarSenha').value;

    if (!email.includes('@')) return alert('Email precisa ter @');
    if (senha.length < 6) return alert('Senha precisa de 6 caracteres');
    if (senha !== confirmar) return alert('Senhas não coincidem');
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;
        await setDoc(doc(db, 'usuarios', user.uid), {
            nome: nome,
            email: email,
            criadoEm: new Date()
        });
        
        alert('Cadastro realizado!');
        window.location.href = 'paginainicial.html';
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};
