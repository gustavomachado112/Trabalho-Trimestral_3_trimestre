import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

document.getElementById('formLogin').addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("inputEmail").value;
    const senha = document.getElementById("inputSenha").value;

    if (!email.includes("@")) return alert("Digite um email válido.");
    if (senha.length < 6) return alert("A senha precisa ter pelo menos 6 caracteres.");

    try {
        await signInWithEmailAndPassword(auth, email, senha);
        alert("Login realizado com sucesso!");
        window.location.href = "paginainicial.html";
    } catch (error) {
        alert("Erro no login: " + error.message);
    }
});
