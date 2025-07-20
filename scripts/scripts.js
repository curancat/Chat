// --- Configuração do Firebase ---
// Importa as funções específicas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js"; // Adicionado updateEmail, updatePassword
import { getFirestore, collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where, updateDoc, arrayUnion, arrayRemove, increment, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDd4ZIyPIoJJCHCPeeUIChaEsNSBMLpVgA",
  authDomain: "vlog-8a75f.firebaseapp.com",
  projectId: "vlog-8a75f",
  storageBucket: "vlog-8a75f.firebasestorage.app",
  messagingSenderId: "1063952650353",
  appId: "1:1063952650353:web:25f37c51b49daeaf81cbd0",
  measurementId: "G-GRM2E926W3"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Note: analytics might require additional setup/consent for full functionality
const auth = getAuth(app);
const db = getFirestore(app);

// --- Elementos DOM ---
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginSubmit = document.getElementById("loginSubmit");
const loginMessage = document.getElementById("loginMessage");

const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerSubmit = document.getElementById("registerSubmit");
const registerMessage = document.getElementById("registerMessage");

const publishPostBtn = document.getElementById("publishPostBtn");
const postContent = document.getElementById("postContent");
const postMessage = document.getElementById("postMessage");

const chatSendMessageBtn = document.getElementById("chatSendMessageBtn");
const chatMessageInput = document.getElementById("chatMessageInput");
const chatMessageDiv = document.getElementById("chatMessage"); // Este é um p de mensagem, não o display de chat
const chatMessagesDisplay = document.getElementById("chatMessagesDisplay");
const chatRecipientSelect = document.getElementById("chatRecipientSelect");

const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const viewFeedBtn = document.getElementById("viewFeedBtn");
const createPostBtn = document.getElementById("createPostBtn");
const openChatBtn = document.getElementById("openChatBtn");
const openNotificationsBtn = document.getElementById("openNotificationsBtn");
const notificationCountSpan = document.getElementById("notificationCount");

const loginFormContainer = document.getElementById("loginFormContainer");
const registerFormContainer = document.getElementById("registerFormContainer");
const createPostSection = document.getElementById("createPostSection");
const chatSection = document.getElementById("chatSection");
const feedSection = document.getElementById("feedSection");
const notificationsSection = document.getElementById("notificationsSection");
const postsContainer = document.getElementById("postsContainer");
const notificationsList = document.getElementById("notificationsList");

// NOVO: Elementos DOM do Perfil
const openProfileBtn = document.getElementById("openProfileBtn");
const profileSection = document.getElementById("profileSection");
const profileEmailDisplay = document.getElementById("profileEmailDisplay");
const profileUsernameInput = document.getElementById("profileUsernameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileMessage = document.getElementById("profileMessage");


// --- Utilitários ---

// Todas as seções que podem ser ativadas/desativadas
const allSections = [
    loginFormContainer,
    registerFormContainer,
    createPostSection,
    chatSection,
    feedSection,
    notificationsSection,
    profileSection // Adicionado a nova seção de perfil
];

// Função para esconder todas as seções
function hideAllForms() {
    allSections.forEach(section => {
        section.classList.remove('active');
        // Adiciona um pequeno atraso para display:none após remover a classe active
        // para permitir transições CSS se você as tiver.
        // Se não tiver transições, remover essa linha não faz diferença.
        // section.style.display = 'none'; // Isso é gerenciado pelo CSS .active
    });
}

// Função para mostrar uma seção específica
function showSection(sectionElement) {
    hideAllForms(); // Esconde tudo primeiro
    sectionElement.classList.add('active'); // Depois mostra o que foi pedido
    // console.log(`Mostrando seção: ${sectionElement.id}`); // Debugging
}

function showMessage(element, msg, type = 'success') {
    element.textContent = msg;
    element.classList.remove('success', 'error'); // Limpa classes anteriores
    element.classList.add(type); // Adiciona a nova classe de tipo
    element.style.display = 'block'; // Garante que a mensagem é visível
    setTimeout(() => {
        element.textContent = '';
        element.style.display = 'none';
        element.classList.remove('success', 'error'); // Remove as classes ao esconder
    }, 4000);
}

function updateNavButtons(isLoggedIn) {
    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        viewFeedBtn.style.display = 'block';
        createPostBtn.style.display = 'block';
        openChatBtn.style.display = 'block';
        openNotificationsBtn.style.display = 'block';
        openProfileBtn.style.display = 'block'; // NOVO: Mostra o botão de perfil
        setupNotificationListener(auth.currentUser.uid); // Garante que o listener de notificação é ativado
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        viewFeedBtn.style.display = 'none';
        createPostBtn.style.display = 'none';
        openChatBtn.style.display = 'none';
        openNotificationsBtn.style.display = 'none';
        openProfileBtn.style.display = 'none'; // NOVO: Esconde o botão de perfil
        notificationCountSpan.textContent = '0';
        if (unsubscribeNotifications) { // Desativa o listener de notificações ao deslogar
            unsubscribeNotifications();
            unsubscribeNotifications = null;
        }
    }
}

// --- Event Listeners dos Botões de Navegação ---
loginBtn.addEventListener('click', () => {
    hideAllForms(); // Garante que tudo esteja escondido antes de mostrar o login
    showSection(loginFormContainer);
    loginMessage.textContent = ''; // Limpa mensagens anteriores
    loginMessage.style.display = 'none';
});

registerBtn.addEventListener('click', () => {
    hideAllForms(); // Garante que tudo esteja escondido antes de mostrar o cadastro
    showSection(registerFormContainer);
    registerMessage.textContent = ''; // Limpa mensagens anteriores
    registerMessage.style.display = 'none';
});

createPostBtn.addEventListener('click', () => {
    showSection(createPostSection);
    postContent.value = ''; // Limpa o campo de texto
    postMessage.textContent = ''; // Limpa mensagens anteriores
    postMessage.style.display = 'none';
});

openChatBtn.addEventListener('click', () => {
    showSection(chatSection);
    loadChatUsers();
    chatMessageInput.value = ''; // Limpa o campo de mensagem
    chatMessageDiv.textContent = ''; // Limpa mensagens anteriores do chat
    chatMessageDiv.style.display = 'none';
});

viewFeedBtn.addEventListener('click', () => {
    showSection(feedSection);
    loadPosts(); // Garante que os posts são recarregados/atualizados
});

openNotificationsBtn.addEventListener('click', () => {
    showSection(notificationsSection);
    loadNotifications(); // Garante que as notificações são carregadas/atualizadas
});

// NOVO: Listener para abrir o perfil
openProfileBtn.addEventListener('click', () => {
    showSection(profileSection);
    loadUserProfile(); // Carrega os dados do perfil ao abrir
    profileMessage.textContent = ''; // Limpa mensagens anteriores
    profileMessage.style.display = 'none';
});

// --- Autenticação ---
loginSubmit.addEventListener("click", async () => { // Adicionado async
    const email = loginEmail.value.trim(); // Trim para remover espaços
    const password = loginPassword.value.trim(); // Trim para remover espaços

    if (!email || !password) {
        showMessage(loginMessage, "Por favor, insira email e senha.", 'error');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage(loginMessage, "Login bem-sucedido!");
        // A lógica de showSection e loadPosts já está no onAuthStateChanged,
        // que será disparado após o sucesso do login.
        // showSection(feedSection);
        // loadPosts();
    } catch (error) {
        let errorMessage = "Erro de login.";
        if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Usuário desativado.';
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Email ou senha incorretos.';
        } else {
            errorMessage = error.message;
        }
        showMessage(loginMessage, errorMessage, 'error');
        console.error("Erro de login:", error);
    }
});

registerSubmit.addEventListener("click", async () => { // Adicionado async
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const username = registerUsername.value.trim();

    if (!username || !email || !password) {
        showMessage(registerMessage, "Por favor, preencha todos os campos.", 'error');
        return;
    }
    if (password.length < 6) {
        showMessage(registerMessage, "A senha deve ter pelo menos 6 caracteres.", 'error');
        return;
    }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Garante que o username é salvo no documento do usuário
        await setDoc(doc(db, "users", cred.user.uid), {
            username: username,
            email: email,
            createdAt: serverTimestamp() // Adiciona um timestamp de criação
        });
        showMessage(registerMessage, "Cadastro realizado com sucesso!");
        registerUsername.value = '';
        registerEmail.value = '';
        registerPassword.value = '';
        showSection(loginFormContainer); // Volta para o login após o cadastro
    } catch (error) {
        let errorMessage = "Erro no cadastro.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email já está em uso.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Senha muito fraca.';
        } else {
            errorMessage = error.message;
        }
        showMessage(registerMessage, errorMessage, 'error');
        console.error("Erro de cadastro:", error);
    }
});

// Logout
logoutBtn.addEventListener("click", async () => { // Adicionado async
    try {
        await signOut(auth);
        showMessage(loginMessage, "Logout bem-sucedido!");
        showSection(loginFormContainer); // Volta para o login após o logout
        // Limpar dados ou estado do usuário, se necessário
    } catch (error) {
        showMessage(loginMessage, error.message, 'error');
        console.error("Erro de logout:", error);
    }
});

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
    updateNavButtons(!!user); // Atualiza os botões de navegação
    if (user) {
        console.log("Usuário logado:", user.email, user.uid);
        // Se o usuário está logado, e a seção atual é login/registro, ou nenhuma,
        // redireciona para o feed.
        const currentActiveSection = allSections.find(section => section.classList.contains('active'));
        if (!currentActiveSection || currentActiveSection === loginFormContainer || currentActiveSection === registerFormContainer) {
            showSection(feedSection);
            loadPosts();
        }
        // Ativa o listener de notificação apenas uma vez após o login
        setupNotificationListener(user.uid);
    } else {
        console.log("Nenhum usuário logado.");
        // Se não há usuário logado, garante que a seção de login esteja visível.
        // Apenas redireciona se a seção atual NÃO for login ou registro.
        const currentActiveSection = allSections.find(section => section.classList.contains('active'));
        if (!currentActiveSection || (currentActiveSection !== registerFormContainer && currentActiveSection !== loginFormContainer)) {
             showSection(loginFormContainer);
        }
    }
});


// --- Publicar Post (SOMENTE TEXTO) ---
publishPostBtn.addEventListener("click", async () => {
    const content = postContent.value.trim();
    const user = auth.currentUser;

    if (!user) {
        showMessage(postMessage, "Você precisa estar logado para publicar posts.", 'error');
        return;
    }
    if (!content) { // Verifica se o conteúdo não está vazio após trim
        showMessage(postMessage, "Preencha o conteúdo do post.", 'error');
        return;
    }

    // Gerar um ID único para o documento do post antes de criar
    const postDocRef = doc(collection(db, "posts")); // Firebase gera um ID automaticamente aqui

    try {
        // Obter o username do usuário logado do Firestore (usando UID diretamente para garantir)
        const userDoc = await getDoc(doc(db, "users", user.uid));
        let username = user.email; // Fallback para email se username não for encontrado
        if (userDoc.exists()) {
            username = userDoc.data().username || user.email;
        } else {
            console.warn("Documento do usuário não encontrado para UID:", user.uid);
            // Poderíamos criar um documento básico aqui se ele não existe por algum motivo
            await setDoc(doc(db, "users", user.uid), { username: user.email, email: user.email }, { merge: true });
        }


        await setDoc(postDocRef, {
            content: content,
            userId: user.uid,
            username: username,
            timestamp: serverTimestamp(),
            likesCount: 0,
            likedBy: []
        });

        postContent.value = '';
        showMessage(postMessage, "Post publicado com sucesso!");
        // O feed será atualizado automaticamente pelo onSnapshot em loadPosts
    } catch (error) {
        showMessage(postMessage, "Erro ao publicar post.", 'error');
        console.error("Erro ao publicar post:", error);
    }
});

// --- Função para Curtir/Descurtir um Post ---
async function toggleLike(postId, currentLikesCount, likedByUserIds, likeButtonElement) {
    const user = auth.currentUser;
    if (!user) {
        showMessage(postMessage, "Você precisa estar logado para curtir posts.", 'error');
        return;
    }

    const postRef = doc(db, "posts", postId);
    const userId = user.uid;

    try {
        // Recarrega o post para ter a versão mais recente dos likedBy
        const postDocSnap = await getDoc(postRef);
        if (!postDocSnap.exists()) {
            console.error("Post não encontrado para curtir/descurtir:", postId);
            showMessage(postMessage, "Post não encontrado.", 'error');
            return;
        }
        const postData = postDocSnap.data();
        const latestLikedBy = postData.likedBy || [];
        const isCurrentlyLiked = latestLikedBy.includes(userId);
        const currentLikes = postData.likesCount || 0; // Usa a contagem real do banco de dados

        if (isCurrentlyLiked) {
            await updateDoc(postRef, {
                likesCount: increment(-1),
                likedBy: arrayRemove(userId)
            });
            showMessage(postMessage, "Você descurtiu o post.");
            // Atualiza o botão imediatamente
            if (likeButtonElement) {
                likeButtonElement.classList.remove('liked');
                likeButtonElement.innerHTML = `❤️ ${currentLikes - 1}`;
                likeButtonElement.dataset.likesCount = currentLikes - 1;
            }
        } else {
            await updateDoc(postRef, {
                likesCount: increment(1),
                likedBy: arrayUnion(userId)
            });
            showMessage(postMessage, "Você curtiu o post!");
            // Atualiza o botão imediatamente
            if (likeButtonElement) {
                likeButtonElement.classList.add('liked');
                likeButtonElement.innerHTML = `❤️ ${currentLikes + 1}`;
                likeButtonElement.dataset.likesCount = currentLikes + 1;
            }

            // Obtenção correta do post para notificação (já presente, mas confirmada)
            const postOwnerId = postData.userId;
            const currentUserDoc = await getDoc(doc(db, "users", user.uid));
            let currentUserUsername = user.email;
            if (currentUserDoc.exists()) {
                 currentUserUsername = currentUserDoc.data().username || user.email;
            }

            if (postOwnerId !== user.uid) { // Não notificar se o usuário curtir o próprio post
                addNotification(postOwnerId, user.uid, currentUserUsername, 'like', `curtiu seu post: "${postData.content.substring(0, 30)}..."`, postId);
            }
        }
    } catch (error) {
        console.error("Erro ao curtir/descurtir o post:", error);
        showMessage(postMessage, "Erro ao processar sua curtida.", 'error');
    }
}

// --- Funções de Comentário ---

async function addComment(postId, commentText) {
    const user = auth.currentUser;
    if (!user) {
        showMessage(postMessage, "Você precisa estar logado e digitar um comentário.", 'error');
        return;
    }
    if (!commentText.trim()) {
        showMessage(postMessage, "Por favor, digite um comentário válido.", 'error');
        return;
    }

    try {
        const userDocSnapshot = await getDoc(doc(db, "users", user.uid)); // Usar getDoc com UID
        let username = user.email;
        if (userDocSnapshot.exists()) {
            username = userDocSnapshot.data().username || user.email;
        } else {
             console.warn("Documento do usuário não encontrado para UID:", user.uid, "Usando email para comentário.");
        }

        const commentsCollectionRef = collection(db, "posts", postId, "comments");
        await addDoc(commentsCollectionRef, {
            userId: user.uid,
            username: username,
            text: commentText,
            timestamp: serverTimestamp()
        });
        showMessage(postMessage, "Comentário adicionado com sucesso!");

        // CORREÇÃO: Obtenção correta do post para notificação de comentário
        const postDocSnapshot = await getDoc(doc(db, "posts", postId));
        if (postDocSnapshot.exists()) {
            const postData = postDocSnapshot.data();
            const postOwnerId = postData.userId;
            if (postOwnerId !== user.uid) { // Não notificar se o usuário comentar no próprio post
                addNotification(postOwnerId, user.uid, username, 'comment', `comentou em seu post: "${commentText.substring(0, 30)}..."`, postId);
            }
        }
    } catch (error) {
        console.error("Erro ao adicionarcomentário:", error);
        showMessage(postMessage, "Erro ao adicionar comentário.", 'error');
    }
}

// Corrigido para ser uma função que retorna o listener, não o listener em si
function setupCommentsListener(postId, commentsListElement) {
    const commentsCollectionRef = collection(db, "posts", postId, "comments");
    const q = query(commentsCollectionRef, orderBy("timestamp", "asc"));
    
    // Retorna a função de unsubscribe para poder limpá-la se necessário
    return onSnapshot(q, (snapshot) => {
        commentsListElement.innerHTML = ''; // Limpa a lista antes de adicionar
        snapshot.forEach((doc) => {
            const comment = doc.data();
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment');
            commentElement.innerHTML = `
                <p><strong>${comment.username || comment.userId}:</strong> ${comment.text}</p>
                <small>${comment.timestamp ? new Date(comment.timestamp.toDate()).toLocaleString() : 'Enviando...'}</small>
            `;
            commentsListElement.appendChild(commentElement);
        });
        // Rola para o final para mostrar o comentário mais recente
        commentsListElement.scrollTop = commentsListElement.scrollHeight;
    }, (error) => {
        console.error("Erro ao carregar comentários:", error);
        showMessage(postMessage, "Erro ao carregar comentários.", 'error');
    });
}


// --- Carregar Posts (Feed) ---

const postElementsMap = new Map(); // mantém referência dos posts renderizados
const commentsUnsubscribeMap = new Map(); // Para gerenciar listeners de comentários

function loadPosts() {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        const postIdsFromFirebase = new Set();

        snapshot.forEach((docSnap) => {
            const post = docSnap.data();
            const postId = docSnap.id;
            const currentUser = auth.currentUser;
            const likedBy = post.likedBy || [];
            const isLiked = currentUser ? likedBy.includes(currentUser.uid) : false;

            postIdsFromFirebase.add(postId);

            // Se já existe, atualiza os dados (sem recriar o elemento)
            if (postElementsMap.has(postId)) {
                const existing = postElementsMap.get(postId);
                // Atualiza apenas o conteúdo e timestamp se mudaram para evitar flicker
                if (existing.querySelector('p').textContent !== post.content) {
                    existing.querySelector('p').textContent = post.content;
                }
                const existingSmall = existing.querySelector('small');
                const newTimestampText = post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Carregando...';
                if (existingSmall.textContent !== newTimestampText) {
                    existingSmall.textContent = newTimestampText;
                }

                const likeBtn = existing.querySelector('.like-button');
                const newLikesCount = post.likesCount || 0;
                // Atualiza o botão de like apenas se a contagem ou o status mudou
                if (parseInt(likeBtn.dataset.likesCount) !== newLikesCount || likeBtn.classList.contains('liked') !== isLiked) {
                    likeBtn.innerHTML = `❤️ ${newLikesCount}`;
                    likeBtn.classList.toggle('liked', isLiked);
                    likeBtn.dataset.likesCount = newLikesCount;
                }
                return; // Post já existe e foi atualizado
            }

            // Criar novo post se não existir
            const postElement = document.createElement('div');
            postElement.classList.add('post-card');
            postElement.setAttribute('data-post-id', postId); // Adiciona data-attribute para fácil referência

            postElement.innerHTML = `
                <h3>${post.username || post.userId}</h3>
                <p>${post.content}</p>
                <small>${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Carregando...'}</small>
                <div class="post-actions">
                    <button class="like-button ${isLiked ? 'liked' : ''}" data-post-id="${postId}" data-likes-count="${post.likesCount || 0}">
                        ❤️ ${post.likesCount || 0}
                    </button>
                    <button class="comment-toggle-button" data-post-id="${postId}">💬 Comentar</button>
                </div>
                <div class="post-comments" data-post-id="${postId}" style="display: none;">
                    <h4>Comentários:</h4>
                    <div class="comments-list"></div>
                    <div class="comment-input-area">
                        <input type="text" placeholder="Adicionar comentário..." class="comment-input">
                        <button class="submit-comment-button">Enviar</button>
                    </div>
                </div>
            `;

            postsContainer.prepend(postElement); // Adiciona posts novos no topo
            postElementsMap.set(postId, postElement);

            // 🎯 BOTÃO DE LIKE FUNCIONAL (Refatorado para usar o elemento do post)
            const likeButton = postElement.querySelector('.like-button'); // Já tem o data-post-id
            if (likeButton) {
                likeButton.addEventListener('click', async () => {
                    const currentLikes = parseInt(likeButton.dataset.likesCount);
                    const postIdFromBtn = likeButton.dataset.postId;
                    const user = auth.currentUser;
                    if (!user) {
                        showMessage(postMessage, "Você precisa estar logado para curtir posts.", 'error');
                        return;
                    }

                    // Obter o estado mais recente de 'likedBy' diretamente do Firestore
                    try {
                        const postSnap = await getDoc(doc(db, "posts", postIdFromBtn));
                        if (postSnap.exists()) {
                            const postData = postSnap.data();
                            const updatedLikedBy = postData.likedBy || [];
                            toggleLike(postIdFromBtn, currentLikes, updatedLikedBy, likeButton);
                        }
                    } catch (error) {
                        console.error("Erro ao buscar post para curtir/descurtir:", error);
                        showMessage(postMessage, "Erro ao curtir/descurtir o post.", 'error');
                    }
                });
            }

            // BOTÕES DE COMENTÁRIO
            const commentToggleButton = postElement.querySelector('.comment-toggle-button');
            const postCommentsSection = postElement.querySelector('.post-comments');
            const commentsListElement = postCommentsSection.querySelector('.comments-list');
            const submitCommentButton = postCommentsSection.querySelector('.submit-comment-button');
            const commentInput = postCommentsSection.querySelector('.comment-input');

            if (commentToggleButton && postCommentsSection) {
                commentToggleButton.addEventListener('click', () => {
                    if (postCommentsSection.style.display === 'none') {
                        postCommentsSection.style.display = 'block';
                        // Adiciona o listener de comentários e guarda a função de unsubscribe
                        const unsubscribe = setupCommentsListener(postId, commentsListElement);
                        commentsUnsubscribeMap.set(postId, unsubscribe);
                    } else {
                        postCommentsSection.style.display = 'none';
                        // Remove o listener de comentários quando a seção é fechada
                        if (commentsUnsubscribeMap.has(postId)) {
                            commentsUnsubscribeMap.get(postId)(); // Chama a função de unsubscribe
                            commentsUnsubscribeMap.delete(postId);
                        }
                    }
                });
            }

            if (submitCommentButton && commentInput) {
                submitCommentButton.addEventListener('click', async () => {
                    const commentText = commentInput.value.trim();
                    if (commentText) {
                        await addComment(postId, commentText);
                        commentInput.value = ''; // Limpa o input após enviar
                    } else {
                        showMessage(postMessage, "Por favor, digite um comentário.", 'error'); // Mudado para 'error' para mais destaque
                    }
                });
            }
        });

        // Remove posts que não existem mais no Firebase
        for (const [postId, element] of postElementsMap.entries()) {
            if (!postIdsFromFirebase.has(postId)) {
                element.remove();
                postElementsMap.delete(postId);
                // Limpa o listener de comentários se o post for removido
                if (commentsUnsubscribeMap.has(postId)) {
                    commentsUnsubscribeMap.get(postId)();
                    commentsUnsubscribeMap.delete(postId);
                }
            }
        }
    }, (error) => {
        console.error("Erro ao carregar posts:", error);
        showMessage(postsContainer, "Erro ao carregar posts.", 'error');
    });
}


// --- Chat Privado ---
let currentChatRecipientId = null; // Reinicializado para garantir que não persiste indevidamente
let unsubscribeChat = null; // Para gerenciar o listener do chat

async function loadChatUsers() {
    chatRecipientSelect.innerHTML = '<option value="">Selecione um usuário</option>';
    const currentUser = auth.currentUser;
    if (!currentUser) return; // Não carrega usuários se não estiver logado

    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("username")); // Ordena por username
    try {
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (doc.id !== currentUser.uid) { // Não lista o próprio usuário
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = userData.username || userData.email;
                chatRecipientSelect.appendChild(option);
            }
        });

        // Só adiciona o listener uma vez ao select de recipients
        if (!chatRecipientSelect.dataset.listenerAdded) {
            chatRecipientSelect.addEventListener('change', (event) => {
                const newRecipientId = event.target.value;
                if (newRecipientId && newRecipientId !== currentChatRecipientId) {
                    currentChatRecipientId = newRecipientId;
                    chatMessagesDisplay.innerHTML = ''; // Limpa mensagens antigas
                    if (unsubscribeChat) { // Limpa o listener anterior se houver
                        unsubscribeChat();
                    }
                    listenForChatMessages(currentUser.uid, currentChatRecipientId);
                } else if (!newRecipientId) {
                    currentChatRecipientId = null;
                    chatMessagesDisplay.innerHTML = '';
                    if (unsubscribeChat) {
                        unsubscribeChat();
                    }
                }
            });
            chatRecipientSelect.dataset.listenerAdded = true; // Marca que o listener foi adicionado
        }

        // Se já havia um recipient selecionado, recarrega o chat
        if (currentChatRecipientId && chatRecipientSelect.querySelector(`option[value="${currentChatRecipientId}"]`)) {
            chatRecipientSelect.value = currentChatRecipientId;
            // listenForChatMessages já é chamado no change event, mas pode ser redundante aqui.
            // O importante é garantir que, se um chat estava aberto, ele continue aberto.
        }

    } catch (error) {
        console.error("Erro ao carregar usuários do chat:", error);
        showMessage(chatMessageDiv, "Erro ao carregar usuários.", 'error');
    }
}

function listenForChatMessages(user1Id, user2Id) {
    if (unsubscribeChat) { // Limpa qualquer listener anterior
        unsubscribeChat();
    }

    const chatCollectionRef = collection(db, "privateChats");

    // Consulta para mensagens enviadas por user1 para user2
    const q1 = query(chatCollectionRef,
        where("senderId", "==", user1Id),
        where("recipientId", "==", user2Id)
    );
    // Consulta para mensagens enviadas por user2 para user1
    const q2 = query(chatCollectionRef,
        where("senderId", "==", user2Id),
        where("recipientId", "==", user1Id)
    );

    // Combina os listeners para ambos os lados da conversa
    unsubscribeChat = onSnapshot(q1, (snapshot1) => {
        onSnapshot(q2, (snapshot2) => {
            const allMessages = [];
            snapshot1.forEach(doc => allMessages.push(doc.data()));
            snapshot2.forEach(doc => allMessages.push(doc.data()));

            // Ordena todas as mensagens por timestamp
            allMessages.sort((a, b) => {
                const timestampA = a.timestamp?.toDate() || new Date(0);
                const timestampB = b.timestamp?.toDate() || new Date(0);
                return timestampA.getTime() - timestampB.getTime(); // Use getTime() para comparação numérica
            });

            chatMessagesDisplay.innerHTML = ''; // Limpa o display para recarregar
            allMessages.forEach(message => {
                displayChatMessage(message);
            });
            chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight; // Rola para o final
        }, (error) => {
            console.error("Erro ao ouvir mensagens do chat (q2):", error);
            showMessage(chatMessageDiv, "Erro ao carregar mensagens.", 'error');
        });
    }, (error) => {
        console.error("Erro ao ouvir mensagens do chat (q1):", error);
        showMessage(chatMessageDiv, "Erro ao carregar mensagens.", 'error');
    });
}

function displayChatMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-bubble');
    const currentUser = auth.currentUser;

    let senderName = message.senderUsername || "Desconhecido";
    if (currentUser && message.senderId === currentUser.uid) {
        messageElement.classList.add('sent');
        senderName = "Você"; // Para o usuário ver "Você" nas suas mensagens
    } else {
        messageElement.classList.add('received');
    }

    // Garante que o timestamp seja um Date object para formatação
    const messageTimestamp = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(); // Fallback

    messageElement.innerHTML = `
        <strong>${senderName}</strong>
        <p>${message.message || ''}</p>
        <small>${messageTimestamp.toLocaleTimeString()}</small>
    `;
    chatMessagesDisplay.appendChild(messageElement);
}


// --- Enviar mensagem no chat (SOMENTE TEXTO) ---
chatSendMessageBtn.addEventListener("click", async () => {
    const text = chatMessageInput.value.trim();
    const user = auth.currentUser;
    const recipientId = chatRecipientSelect.value;

    if (!user) {
        showMessage(chatMessageDiv, "Você precisa estar logado para enviar mensagens.", 'error');
        return;
    }
    if (!recipientId) {
        showMessage(chatMessageDiv, "Selecione um destinatário para o chat.", 'error');
        return;
    }
    if (!text) {
        showMessage(chatMessageDiv, "Digite uma mensagem.", 'error');
        return;
    }

    try {
        // Obter o username do remetente
        const senderDocSnapshot = await getDoc(doc(db, "users", user.uid));
        let senderUsername = user.email;
        if (senderDocSnapshot.exists()) {
            senderUsername = senderDocSnapshot.data().username || user.email;
        } else {
            console.warn("Documento do remetente não encontrado para UID:", user.uid, "Usando email.");
        }

        // Usar addDoc para privateChats, para Firebase gerar ID automaticamente.
        // setDoc com Date.now() pode levar a IDs duplicados se duas mensagens forem enviadas no mesmo ms.
        await addDoc(collection(db, "privateChats"), {
            senderId: user.uid,
            senderUsername: senderUsername,
            recipientId: recipientId,
            message: text,
            type: 'text',
            timestamp: serverTimestamp()
        });

        showMessage(chatMessageDiv, "Mensagem enviada!");
        chatMessageInput.value = ''; // Limpa o input após enviar

        // Obtenção correta do destinatário para notificação de chat
        const recipientUserDoc = await getDoc(doc(db, "users", recipientId));
        let recipientUsername = recipientId; // Fallback
        if (recipientUserDoc.exists()) {
            recipientUsername = recipientUserDoc.data().username || recipientId;
        }

        // Envia notificação apenas se o destinatário não for o próprio remetente
        if (recipientId !== user.uid) {
            addNotification(recipientId, user.uid, senderUsername, 'chat_message', `enviou uma mensagem: "${text.substring(0, 30)}..."`);
        }

    } catch (error) {
        showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
        console.error("Erro ao enviar mensagem de chat:", error);
    }
});

// --- NOVO: Funções de Notificação ---

async function addNotification(recipientId, senderId, senderUsername, type, message, relatedPostId = null) {
    // Não adicionar notificação se o remetente e o destinatário forem a mesma pessoa
    if (recipientId === senderId) {
        return;
    }
    try {
        await addDoc(collection(db, "notifications"), {
            recipientId: recipientId,
            senderId: senderId,
            senderUsername: senderUsername,
            type: type,
            message: message,
            relatedPostId: relatedPostId,
            timestamp: serverTimestamp(),
            read: false
        });
    } catch (error) {
        console.error("Erro ao adicionar notificação:", error);
    }
}

let unsubscribeNotifications = null; // Variável para armazenar a função de unsubscribe

function setupNotificationListener(userId) {
    if (!userId) { // Garante que há um userId para configurar o listener
        console.warn("setupNotificationListener chamado sem userId.");
        return;
    }
    if (unsubscribeNotifications) { // Limpa o listener anterior se já existir um
        unsubscribeNotifications();
        console.log("Listener de notificações anterior desativado.");
    }

    const q = query(collection(db, "notifications"),
        where("recipientId", "==", userId),
        where("read", "==", false)
    );

    unsubscribeNotifications = onSnapshot(q, (snapshot) => {
        notificationCountSpan.textContent = snapshot.size;
        if (snapshot.size > 0) {
            notificationCountSpan.style.display = 'inline-block';
        } else {
            notificationCountSpan.style.display = 'none';
        }
        console.log(`Você tem ${snapshot.size} notificações não lidas.`);
    }, (error) => {
        console.error("Erro ao ouvir notificações:", error);
    });
    console.log("Listener de notificações ativado para:", userId);
}

async function loadNotifications() {
    const user = auth.currentUser;
    if (!user) {
        showMessage(notificationsSection, "Você precisa estar logado para ver as notificações.", 'error');
        return;
    }

    notificationsList.innerHTML = ''; // Limpa a lista antes de carregar novas

    const q = query(collection(db, "notifications"),
        where("recipientId", "==", user.uid),
        orderBy("timestamp", "desc")
    );

    // Usa onSnapshot para atualizações em tempo real
    onSnapshot(q, async (snapshot) => {
        notificationsList.innerHTML = ''; // Limpa a lista a cada atualização
        const notificationsToMarkAsRead = [];

        snapshot.forEach((doc) => {
            const notification = doc.data();
            const notificationId = doc.id;

            const notificationElement = document.createElement('div');
            notificationElement.classList.add('notification-item');
            if (!notification.read) {
                notificationElement.classList.add('unread');
                notificationsToMarkAsRead.push(notificationId); // Adiciona para marcar como lida
            }

            let displayMessage = `${notification.senderUsername || 'Usuário Desconhecido'} ${notification.message}`;
            if (notification.type === 'like' || notification.type === 'comment') {
                displayMessage += ` (Post: ${notification.relatedPostId ? notification.relatedPostId.substring(0, 5) + '...' : 'N/A'})`;
            }

            notificationElement.innerHTML = `
                <p>${displayMessage}</p>
                <small>${notification.timestamp ? new Date(notification.timestamp.toDate()).toLocaleString() : 'Carregando...'}</small>
            `;
            notificationsList.appendChild(notificationElement);

            // Adiciona listener para marcar como lida ao clicar individualmente
            notificationElement.addEventListener('click', async () => {
                if (!notification.read) {
                    await markNotificationAsRead(notificationId);
                    // A UI será atualizada automaticamente pelo onSnapshot
                }
            });
        });

        // Marca todas as notificações não lidas como lidas após carregá-las
        // Isso pode ser ajustado se você preferir que o usuário as marque manualmente
        if (notificationsToMarkAsRead.length > 0) {
            for (const id of notificationsToMarkAsRead) {
                await markNotificationAsRead(id);
            }
        }
    }, (error) => {
        console.error("Erro ao carregar notificações:", error);
        showMessage(notificationsSection, "Erro ao carregar notificações.", 'error');
    });
}

async function markNotificationAsRead(notificationId) {
    try {
        const notificationRef = doc(db, "notifications", notificationId);
        await updateDoc(notificationRef, {
            read: true
        });
        console.log("Notificação marcada como lida:", notificationId);
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        showMessage(notificationsSection, "Erro ao marcar notificação como lida.", 'error');
    }
}


// --- NOVO: Funções de Perfil do Usuário ---

async function loadUserProfile() {
    const user = auth.currentUser;
    if (!user) {
        showMessage(profileMessage, "Você precisa estar logado para ver seu perfil.", 'error');
        return;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            profileEmailDisplay.textContent = userData.email || user.email;
            profileUsernameInput.value = userData.username || '';
        } else {
            profileEmailDisplay.textContent = user.email;
            profileUsernameInput.value = ''; // Campo vazio se não houver username no Firestore
            console.warn("Documento do usuário não encontrado no Firestore para perfil.");
            // Poderíamos criar um documento básico aqui se ele não existe
            await setDoc(doc(db, "users", user.uid), { email: user.email }, { merge: true });
        }
    } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        showMessage(profileMessage, "Erro ao carregar dados do perfil.", 'error');
    }
}

saveProfileBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        showMessage(profileMessage, "Você precisa estar logado para atualizar seu perfil.", 'error');
        return;
    }

    const newUsername = profileUsernameInput.value.trim();
    // Não alteramos o email ou senha aqui, apenas o username no Firestore.
    // Alterar email/senha via Firebase Auth exige re-autenticação.

    if (!newUsername) {
        showMessage(profileMessage, "O nome de usuário não pode ser vazio.", 'error');
        return;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            username: newUsername
        });
        showMessage(profileMessage, "Nome de usuário atualizado com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        showMessage(profileMessage, "Erro ao atualizar perfil: " + error.message, 'error');
    }
});


// Inicialização: Ao carregar a página, se não houver um usuário logado, mostra o formulário de login.
document.addEventListener('DOMContentLoaded', () => {
    // Garante que todos os formulários estejam escondidos no início
    hideAllForms();

    // O onAuthStateChanged já lida com qual seção mostrar inicialmente
    // dependendo do estado de autenticação.
    // Se você quiser garantir que o loginFormContainer seja o padrão absoluto ao iniciar sem usuário,
    // esta linha pode ser mantida, mas a lógica no onAuthStateChanged é mais robusta.
    // if (!auth.currentUser) {
    //     showSection(loginFormContainer);
    // }
    console.log("DOM totalmente carregado.");
});
