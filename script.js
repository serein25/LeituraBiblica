const url_sb = 'https://zidubzbjzgkcquwblejj.supabase.co';
const key_sb = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppZHViemJqemdrY3F1d2JsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTMxNDEsImV4cCI6MjA5MDQ4OTE0MX0.wW3JTIGj3JxbID8FZYfKIEl0L1hZGGkanPuvYOvsOGU';

const supabaseClient = window.supabase.createClient(url_sb, key_sb);

console.log("Sistema iniciado com sucesso!");

const TRADUCAO_LIVROS = {
    "Gênesis": "Genesis", "Êxodo": "Exodus", "Levítico": "Leviticus", "Números": "Numbers", "Deuteronômio": "Deuteronomy",
    "Josué": "Joshua", "Juízes": "Judges", "Rute": "Ruth", "1 Samuel": "1 Samuel", "2 Samuel": "2 Samuel",
    "1 Reis": "1 Kings", "2 Reis": "2 Kings", "1 Crônicas": "1 Chronicles", "2 Crônicas": "2 Chronicles",
    "Esdras": "Ezra", "Neemias": "Nehemiah", "Ester": "Esther", "Jó": "Job", "Salmos": "Psalms", "Provérbios": "Proverbs",
    "Eclesiastes": "Ecclesiastes", "Cantares": "Song of Solomon", "Isaías": "Isaiah", "Jeremias": "Jeremiah",
    "Lamentações": "Lamentations", "Ezequiel": "Ezekiel", "Daniel": "Daniel", "Oseias": "Hosea", "Joel": "Joel",
    "Amós": "Amos", "Obadias": "Obadiah", "Jonas": "Jonah", "Miqueias": "Micah", "Naum": "Nahum", "Habacuque": "Habakkuk",
    "Sofonias": "Zephaniah", "Ageu": "Haggai", "Zacarias": "Zechariah", "Malaquias": "Malachi", "Mateus": "Matthew",
    "Marcos": "Mark", "Lucas": "Luke", "João": "John", "Atos": "Acts", "Romanos": "Romans", "1 Coríntios": "1 Corinthians",
    "2 Coríntios": "2 Corinthians", "Gálatas": "Galatians", "Efésios": "Ephesians", "Filipenses": "Philippians",
    "Colossenses": "Colossians", "1 Tessalonicenses": "1 Thessalonians", "2 Tessalonicenses": "2 Thessalonians",
    "1 Timóteo": "1 Timothy", "2 Timóteo": "2 Timothy", "Tito": "Tito", "Filemon": "Philemon", "Hebreus": "Hebrews",
    "Tiago": "James", "1 Pedro": "1 Peter", "2 Pedro": "2 Peter", "1 João": "1 John", "2 João": "2 John",
    "3 João": "3 John", "Judas": "Jude", "Apocalipse": "Revelation"
};

let leituraSessao = {
    planoId: null,
    livro: "",
    capInicialDaSessao: 0,
    capAtualSessao: 0,
    metaCapitulos: 0
};

let jaComemorouHoje = false;

// Agora é uma lista (Array) de e-mails autorizados
const EMAILS_ADMINS = [
    "gustavo.prati.silva.gps@gmail.com",
    "guiguimatheus156@gmail.com",
];

let sessaoUsuario = null;
let livroSelecionado = "";

// Helpers para controlar qual tela aparece
function mostrarLoading() {
    document.getElementById('loading-container').style.display = 'flex';
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'none';
}

function mostrarLogin() {
    document.getElementById('loading-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function mostrarApp() {
    document.getElementById('loading-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
}

// 2. FUNÇÕES DE AUTH
async function inicializar() {
    mostrarLoading();
    console.log("Iniciando verificação de sessão...");
    
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (session) {
            sessaoUsuario = session;
            
            // 1. Busca o nome no metadata ou usa o e-mail como fallback
            const nomeUsuario = session.user.user_metadata.display_name || session.user.email;
            document.getElementById('user-email').innerText = nomeUsuario;
            
            // 2. VERIFICAÇÃO DE ADMIN: Agora verifica se o e-mail está na LISTA de admins
            const ehAdmin = EMAILS_ADMINS.includes(session.user.email);

            if (ehAdmin) {
                console.log("Acesso Administrativo concedido!");
                document.getElementById('admin-panel').style.display = 'block';
                carregarLeiturasAdmin(); 
            } else {
                // Se não for admin, garante que o painel fique escondido
                document.getElementById('admin-panel').style.display = 'none';
            }
            
            mostrarApp();
            carregarLeituras();
        } else {
            mostrarLogin();
        }
    } catch (e) {
        console.error("Erro ao inicializar:", e);
        mostrarLogin();
    }
}

function alternarAuth(tela) {
    if (tela === 'cadastro') {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('signup-section').style.display = 'block';
    } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('signup-section').style.display = 'none';
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) alert("Erro no Login: " + error.message);
    else location.reload();
}

async function signup() {
    const nome = document.getElementById('signup-nome').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!nome) return alert("Por favor, digite seu nome!");

    // Enviamos o nome dentro de 'options.data'
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { display_name: nome }
        }
    });

    if (error) {
        alert("Erro: " + error.message);
    } else {
        alert("Conta criada com sucesso!");
        // Se o Supabase estiver configurado para NÃO exigir confirmação de email, 
        // ele já loga automático. Se exigir, precisa confirmar antes.
        location.reload(); 
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    location.reload();
}

// 3. LOGICA DE DADOS
async function carregarLeituras() {
    if (!sessaoUsuario) return;

    const { data, error } = await supabaseClient
        .from('leituras')
        .select('*')
        .eq('user_id', sessaoUsuario.user.id)
        .eq('concluido', false);
    
    if (!error) {
        renderizarLendoAgora(data);
        // AQUI ESTÁ O SEGREDO: Passamos os dados para a biblioteca saber o que apagar
        renderizarCategorias(data); 
    }
}

function renderizarLendoAgora(leituras) {
    const container = document.getElementById('lista-lendo-agora');
    container.innerHTML = "";
    const hoje = new Date().toLocaleDateString();

    if (!leituras || leituras.length === 0) {
        container.innerHTML = "<p style='color: #888; text-align:center;'>Nenhum plano ativo. Escolha um livro abaixo!</p>";
        return;
    }

    leituras.forEach(plano => {
        const jaLeuHoje = plano.ultimo_dia_lido === hoje;
        const totalCaps = getTotalCapitulos(plano.livro);
        
        // Cálculo da porcentagem (Capítulo Atual / Total)
        const progressoX = Math.round((plano.cap_atual / totalCaps) * 100);
        const progressoFinal = Math.min(progressoX, 100); // Garante que não passe de 100%

        const card = document.createElement('div');
        card.className = `card-ativo ${jaLeuHoje ? 'concluido-hoje' : ''}`;
        
        const planoJSON = JSON.stringify(plano).replace(/"/g, '&quot;');

        card.innerHTML = `
            <div class="info-leitura" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="margin:0">${plano.livro}</h4>
                    <span style="font-size: 0.8rem; color: #666;">Cap. ${plano.cap_atual} de ${totalCaps}</span>
                </div>
                
                <div style="width: 100%; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
                    <div style="width: ${progressoFinal}%; height: 100%; background: var(--accent); transition: width 0.5s ease;"></div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="trecho-texto" style="font-size: 0.85rem; color: ${jaLeuHoje ? '#999' : 'var(--primary)'};">
                        ${jaLeuHoje ? '✅ Meta batida!' : `Pendente: ${plano.meta} cap.`}
                    </span>
                    <button class="btn-check" style="background: ${jaLeuHoje ? '#f0f0f0' : 'var(--accent)'}; color: ${jaLeuHoje ? '#666' : 'white'}; padding: 8px 15px; font-size: 0.85rem;" 
                        onclick="lerCapitulo(${planoJSON})">
                        ${jaLeuHoje ? 'Continuar 📖' : 'Ler agora 📖'}
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 4. ESTRUTURA DA BÍBLIA
const BIBLIA_ESTRUTURA = {
    "Pentateuco": {
        "Gênesis": [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26],
        "Êxodo": [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38],
        "Levítico": [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34],
        "Números": [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13],
        "Deuteronômio": [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12]
    },
    "Históricos": {
        "Josué": [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33],
        "Juízes": [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25],
        "Rute": [22, 23, 18, 22],
        "1 Samuel": [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 28, 22, 44, 25, 12, 25, 11, 31, 13],
        "2 Samuel": [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25],
        "1 Reis": [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53],
        "2 Reis": [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 25, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30],
        "1 Crônicas": [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30],
        "2 Crônicas": [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23],
        "Esdras": [11, 70, 13, 24, 17, 22, 28, 36, 15, 44],
        "Neemias": [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31],
        "Ester": [22, 23, 15, 17, 14, 14, 10, 17, 32, 3]
    },
    "Poéticos": {
        "Jó": [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17],
        "Salmos": [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6],
        "Provérbios": [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31],
        "Eclesiastes": [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14],
        "Cânticos": [17, 17, 11, 16, 16, 13, 13, 14]
    },
    "Profetas Maiores": {
        "Isaías": [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24],
        "Jeremias": [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34],
        "Lamentações": [22, 22, 66, 22, 22],
        "Ezequiel": [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35],
        "Daniel": [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13]
    },
    "Profetas Menores": {
        "Oseias": [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9],
        "Joel": [20, 32, 21],
        "Amós": [15, 16, 15, 13, 27, 14, 17, 14, 15],
        "Obadias": [21],
        "Jonas": [17, 10, 10, 11],
        "Miqueias": [16, 13, 12, 13, 15, 16, 20],
        "Naum": [15, 13, 19],
        "Habacuque": [17, 20, 19],
        "Sofonias": [18, 15, 20],
        "Ageu": [15, 23],
        "Zacarias": [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21],
        "Malaquias": [14, 17, 18, 6]
    },
    "Evangelhos": {
        "Mateus": [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20],
        "Marcos": [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20],
        "Lucas": [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53],
        "João": [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25]
    },
    "Histórico NT": {
        "Atos": [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31]
    },
    "Epístolas de Paulo": {
        "Romanos": [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27],
        "1 Coríntios": [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24],
        "2 Coríntios": [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14],
        "Gálatas": [24, 21, 29, 31, 26, 18],
        "Efésios": [23, 22, 21, 32, 33, 24],
        "Filipenses": [30, 30, 21, 23],
        "Colossenses": [29, 23, 25, 18],
        "1 Tessalonicenses": [10, 20, 13, 18, 28],
        "2 Tessalonicenses": [12, 17, 18],
        "1 Timóteo": [20, 15, 16, 16, 25, 21],
        "2 Timóteo": [18, 26, 17, 22],
        "Tito": [16, 15, 15],
        "Filemom": [25]
    },
    "Epístolas Gerais": {
        "Hebreus": [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25],
        "Tiago": [27, 26, 18, 17, 20],
        "1 Pedro": [25, 25, 22, 19, 14],
        "2 Pedro": [21, 22, 18],
        "1 João": [10, 29, 24, 21, 21],
        "2 João": [13],
        "3 João": [15],
        "Judas": [25]
    },
    "Revelação": {
        "Apocalipse": [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21]
    }
};

// 5. FUNÇÕES DE SUPORTE
function getCapitulosLivro(nomeLivro) {
    for (let cat in BIBLIA_ESTRUTURA) {
        if (BIBLIA_ESTRUTURA[cat][nomeLivro]) return BIBLIA_ESTRUTURA[cat][nomeLivro];
    }
    return [];
}

function getTotalCapitulos(nomeLivro) {
    for (let cat in BIBLIA_ESTRUTURA) {
        if (BIBLIA_ESTRUTURA[cat][nomeLivro]) {
            return BIBLIA_ESTRUTURA[cat][nomeLivro].length;
        }
    }
    return 1; // Fallback para evitar divisão por zero
}

function calcularAlvo(livro, capIni, versIni, meta) {
    let versRestantes = meta;
    let caps = getCapitulosLivro(livro);
    let c = capIni - 1;
    let v = versIni;
    while (versRestantes > 0 && c < caps.length) {
        let dispNoCap = caps[c] - v;
        if (versRestantes <= dispNoCap) { v += versRestantes; versRestantes = 0; }
        else { versRestantes -= dispNoCap; c++; v = 0; }
    }
    if (c >= caps.length) return { cap: caps.length, vers: caps[caps.length - 1] };
    return { cap: c + 1, vers: v };
}

function renderizarCategorias(leiturasAtuais = []) {
    const container = document.getElementById('categorias-container');
    if (!container) return;
    container.innerHTML = "";

    // Criamos um Set (uma lista rápida) só com os nomes dos livros que o usuário já tem
    const livrosEmUso = new Set(leiturasAtuais.map(l => l.livro));

    for (let categoria in BIBLIA_ESTRUTURA) {
        let html = `
            <div class="categoria-section">
                <div class="categoria-titulo" onclick="toggleCategoria(this)">
                    ${categoria} <span>▼</span>
                </div>
                <div class="livros-grid" style="display: none;">
        `;

        for (let livro in BIBLIA_ESTRUTURA[categoria]) {
            // Verificamos se este livro está na lista de "em uso"
            const jaSelecionado = livrosEmUso.has(livro);
            const classeExtra = jaSelecionado ? "selecionado" : "";
            
            html += `<div class="card-livro ${classeExtra}" 
                          onclick="${jaSelecionado ? '' : `abrirConfiguracao('${livro}')`}">
                          ${livro} ${jaSelecionado ? '✅' : ''}
                     </div>`;
        }
        
        html += `</div></div>`;
        container.innerHTML += html;
    }
}

function toggleCategoria(el) {
    const grid = el.nextElementSibling;
    grid.style.display = grid.style.display === 'none' ? 'grid' : 'none';
}

function abrirConfiguracao(livro) {
    livroSelecionado = livro;
    document.getElementById('modal-titulo-livro').innerText = `Plano para ${livro}`;
    document.getElementById('modal-plano').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-plano').style.display = 'none';
}

async function salvarPlanoNoBanco() {
    if (!sessaoUsuario) return alert("Você precisa estar logado!");

    const meta = parseInt(document.getElementById('input-meta').value);
    const cap = parseInt(document.getElementById('input-cap-inicio').value);

    const nomeDoDono = sessaoUsuario.user.user_metadata.display_name || sessaoUsuario.user.email;

    const { error } = await supabaseClient.from('leituras').insert([{
        user_id: sessaoUsuario.user.id,
        nome_usuario: nomeDoDono,
        livro: livroSelecionado,
        meta: meta,
        cap_atual: cap,
        vers_atual: 0,
        concluido: false
    }]);

    if (error) {
        alert("Erro ao salvar: " + error.message);
    } else {
        console.log("Plano salvo com sucesso!");
        fecharModal();
        
        await carregarLeituras(); 
        
        // Verifica se quem salvou é admin para atualizar o painel laranja
        const ehAdmin = EMAILS_ADMINS.includes(sessaoUsuario.user.email);
        if (ehAdmin) {
            carregarLeiturasAdmin();
        }
    }
}

async function concluirDia(id, novoCap, novoVers) {
    const hoje = new Date().toLocaleDateString();
    
    const { error } = await supabaseClient.from('leituras').update({ 
        cap_atual: novoCap, 
        vers_atual: novoVers, 
        ultimo_dia_lido: hoje 
    }).eq('id', id);

    if (!error) {
        await carregarLeituras(); // Atualiza a lista do usuário
        
        // Se quem estiver logado for um dos Admins da lista, atualiza a tabela geral
        const ehAdmin = EMAILS_ADMINS.includes(sessaoUsuario.user.email);
        if (ehAdmin) {
            carregarLeiturasAdmin();
        }
    } else {
        alert("Erro ao atualizar: " + error.message);
    }
}

async function carregarLeiturasAdmin() {
    const container = document.getElementById('lista-admin-geral');
    const hoje = new Date().toLocaleDateString(); // Pega a data de hoje no formato local

    const { data, error } = await supabaseClient
        .from('leituras')
        .select('*'); 

    if (error) {
        container.innerHTML = "<p>Erro: " + error.message + "</p>";
        return;
    }

    if (data.length === 0) {
        container.innerHTML = "<p>Nenhuma leitura registrada.</p>";
        return;
    }

    let html = `
        <table style="width:100%; border-collapse: collapse; font-size: 0.85rem; background: white; border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: #ffe0b2; color: #e65100;">
                    <th style="padding:10px; border:1px solid #ddd;">Usuário</th>
                    <th style="padding:10px; border:1px solid #ddd;">Livro</th>
                    <th style="padding:10px; border:1px solid #ddd;">Progresso</th>
                    <th style="padding:10px; border:1px solid #ddd;">Status Hoje</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(item => {
        // Verifica se o usuário já clicou em 'Lido' hoje
        const statusHoje = item.ultimo_dia_lido === hoje 
            ? '<span style="color: #2e7d32; font-weight: bold;">✅ Lido</span>' 
            : '<span style="color: #d32f2f; font-weight: bold;">⏳ Pendente</span>';

        html += `
            <tr>
                <td style="padding:10px; border:1px solid #ddd;">${item.nome_usuario || 'Sem Nome'}</td>
                <td style="padding:10px; border:1px solid #ddd;">${item.livro}</td>
                <td style="padding:10px; border:1px solid #ddd;">Cap. ${item.cap_atual}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align: center;">${statusHoje}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

let leituraAtual = { livro: "", capitulo: 1 };

async function lerCapitulo(plano) {
    jaComemorouHoje = false; //reset
    leituraSessao = {
        planoId: plano.id,
        livro: plano.livro,
        capInicialDaSessao: plano.cap_atual,
        capAtualSessao: plano.cap_atual,
        metaCapitulos: plano.meta
    };

    document.getElementById('leitura-texto-container').style.display = 'flex';
    await carregarTextoBiblico(leituraSessao.livro, leituraSessao.capAtualSessao);
    atualizarBotoesNavegacao();
}

async function carregarTextoBiblico(livroPt, capitulo) {
    const textoDiv = document.getElementById('texto-biblico');
    const titulo = document.getElementById('titulo-leitura');
    const livroEn = TRADUCAO_LIVROS[livroPt] || livroPt;

    titulo.innerText = `${livroPt} ${capitulo}`;
    textoDiv.innerHTML = "Carregando...";

    try {
        const response = await fetch(`https://bible-api.com/${livroEn}+${capitulo}?translation=almeida`);
        const data = await response.json();
        if (data.verses) {
            textoDiv.innerHTML = data.verses.map(v => `<sup>${v.verse}</sup> ${v.text}`).join(' ');
            textoDiv.scrollTop = 0;
        }
    } catch (e) {
        textoDiv.innerHTML = "Erro ao carregar texto.";
    }
}

function fecharLeitura() {
    document.getElementById('leitura-texto-container').style.display = 'none';
    document.getElementById('controles-leitura').style.display = 'flex';
}

function atualizarBotoesNavegacao() {
    const btnProx = document.getElementById('btn-cap-prox');
    const btnAnt = document.getElementById('btn-cap-ant');
    
    btnAnt.style.visibility = leituraSessao.capAtualSessao <= 1 ? 'hidden' : 'visible';

    const capsLidosNessaSessao = leituraSessao.capAtualSessao - leituraSessao.capInicialDaSessao + 1;

    // Se ele atingiu a meta E ainda não comemorou...
    if (capsLidosNessaSessao >= leituraSessao.metaCapitulos && !jaComemorouHoje) {
        btnProx.innerText = "Concluir Meta ✅";
        btnProx.onclick = concluirMetaHoje;
        btnProx.style.background = "#2e7d32";
    } else {
        // Se ele está no "modo extra" ou ainda não chegou na meta
        const textoBotao = jaComemorouHoje ? `Próximo (${capsLidosNessaSessao}) ➡` : "Próximo Capítulo ➡";
        
        btnProx.innerText = textoBotao;
        btnProx.className = "btn-primary";
        btnProx.onclick = () => mudarCapitulo(1);
        btnProx.style.background = jaComemorouHoje ? "#1565c0" : ""; // Azulzinho se for extra
    }
}

async function mudarCapitulo(direcao) {
    const novoCap = leituraSessao.capAtualSessao + direcao;
    
    if (novoCap < 1) return; // Não volta antes do cap 1

    leituraSessao.capAtualSessao = novoCap;
    
    // ATUALIZAÇÃO NO BANCO (Salvamento Automático)
    // Atualizamos o cap_atual no Supabase toda vez que o usuário vira a página
    await supabaseClient.from('leituras')
        .update({ cap_atual: novoCap })
        .eq('id', leituraSessao.planoId);

    await carregarTextoBiblico(leituraSessao.livro, leituraSessao.capAtualSessao);
    atualizarBotoesNavegacao();
    
    // Atualiza a lista no fundo para o usuário ver o número mudando
    carregarLeituras(); 
}

async function concluirMetaHoje() {
    const hoje = new Date().toLocaleDateString();

    // Apenas marca que o dia de hoje foi lido
    const { error } = await supabaseClient.from('leituras')
        .update({ ultimo_dia_lido: hoje })
        .eq('id', leituraSessao.planoId);

    if (!error) {
        const textoDiv = document.getElementById('texto-biblico');
        const controles = document.getElementById('controles-leitura');

        textoDiv.innerHTML = `
            <div style="text-align: center; padding: 30px 10px;">
                <div style="font-size: 4rem; margin-bottom: 10px;">🎉</div>
                <h2 style="color: var(--primary); margin-bottom: 5px;">Meta Concluída!</h2>
                <p style="color: #666; margin-bottom: 25px;">Você brilhou na palavra hoje.</p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn-primary" style="width: 100%;" onclick="continuarLendoExtras()">🔥 Continuar Lendo</button>
                    <button class="btn-secundario" style="width: 100%;" onclick="fecharLeitura()">Sair por hoje</button>
                </div>
            </div>
        `;
        controles.style.display = 'none';
        carregarLeituras();
    }
}

async function continuarLendoExtras() {
    // Marcamos que ele já viu a tela de parabéns
    jaComemorouHoje = true; 

    document.getElementById('controles-leitura').style.display = 'flex';
    
    // IMPORTANTE: Não resetamos mais o capInicialDaSessao. 
    // Deixamos ele lá atrás para que a conta (atual - inicial) sempre seja MAIOR que a meta.
    
    await mudarCapitulo(1);
}