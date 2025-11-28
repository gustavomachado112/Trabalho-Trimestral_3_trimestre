import { auth, db } from "./firebase-config.js";
import { collection, getDocs, query, where, addDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let elementos = {};

function criarElementosDashboard() {
    const areaConteudo = document.querySelector(".area-conteudo");
    const cabecalho = document.querySelector(".cabecalho-boasvindas");

    const secaoResumo = document.createElement("div");
    secaoResumo.className = "grid-resumos";

    secaoResumo.innerHTML = `
        <div class="card-resumo">
            <h3>Saldo Atual</h3>
            <p class="valor-destaque" id="saldoAtual">R$ 0,00</p>
        </div>

        <div class="card-resumo">
            <h3>Receitas do Mês</h3>
            <p class="valor-destaque" id="receitasMes">R$ 0,00</p>
        </div>

        <div class="card-resumo">
            <h3>Despesas do Mês</h3>
            <p class="valor-destaque" id="despesasMes">R$ 0,00</p>
        </div>

        <div class="card-resumo">
            <h3>Economia do Mês</h3>
            <p class="valor-destaque" id="economiaMes">R$ 0,00</p>
        </div>
    `;

    cabecalho.insertAdjacentElement("afterend", secaoResumo);

    elementos = {
        saldoAtual: document.getElementById("saldoAtual"),
        receitasMes: document.getElementById("receitasMes"),
        despesasMes: document.getElementById("despesasMes"),
        economiaMes: document.getElementById("economiaMes")
    };
}

async function carregarDashboard() {
    if (!auth.currentUser) return;

    try {
        const q = query(
            collection(db, "transacoes"),
            where("userId", "==", auth.currentUser.uid)
        );

        const snapshot = await getDocs(q);
        const transacoes = snapshot.docs.map(doc => doc.data());

        const receitas = transacoes
            .filter(t => t.tipo === "receita")
            .reduce((sum, t) => sum + t.valor, 0);

        const despesas = transacoes
            .filter(t => t.tipo === "despesa")
            .reduce((sum, t) => sum + t.valor, 0);

        const saldo = receitas - despesas;

        elementos.saldoAtual.textContent = `R$ ${saldo.toFixed(2)}`;
        elementos.receitasMes.textContent = `R$ ${receitas.toFixed(2)}`;
        elementos.despesasMes.textContent = `R$ ${despesas.toFixed(2)}`;
        elementos.economiaMes.textContent = `R$ ${saldo.toFixed(2)}`;

        elementos.saldoAtual.className =
            `valor-destaque ${saldo >= 0 ? "positivo" : "negativo"}`;

        elementos.economiaMes.className =
            `valor-destaque ${saldo >= 0 ? "positivo" : "negativo"}`;

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

async function salvarConfiguracaoRapida() {
    if (!auth.currentUser) return alert("Faça login primeiro");

    const metaEconomia = prompt("Defina sua meta mensal:");

    if (!metaEconomia) return;

    const valor = parseFloat(metaEconomia);

    if (isNaN(valor) || valor < 0) return alert("Digite um valor válido");

    await addDoc(collection(db, "configuracoes"), {
        userId: auth.currentUser.uid,
        tipo: "meta_economia",
        valor,
        criadoEm: new Date()
    });

    alert("Meta salva!");
}

async function carregarConfiguracoes() {
    if (!auth.currentUser) return;

    const q = query(
        collection(db, "configuracoes"),
        where("userId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);

    console.log("Configurações:", snapshot.docs.map(d => d.data()));
}

function adicionarInteratividade() {
    elementos.saldoAtual.addEventListener("dblclick", () => {
        const novoSaldo = prompt(
            "Saldo atual:",
            elementos.saldoAtual.textContent.replace("R$ ", "")
        );

        if (novoSaldo) {
            elementos.saldoAtual.textContent =
                `R$ ${parseFloat(novoSaldo).toFixed(2)}`;
        }
    });

    const secaoRapida = document.querySelector(".secao-rapida .grid-botoes");

    const botao = document.createElement("button");
    botao.className = "botao-rapido";
    botao.textContent = "Definir Meta";
    botao.onclick = salvarConfiguracaoRapida;

    secaoRapida.appendChild(botao);
}

document.addEventListener("DOMContentLoaded", () => {
    criarElementosDashboard();
    carregarDashboard();
    carregarConfiguracoes();
    adicionarInteratividade();
});
