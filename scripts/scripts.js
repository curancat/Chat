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
  measurementId: "G-G9K64F8H0M"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Elementos do DOM ---
const loginFormContainer = document.getElementById("loginFormContainer");
const registerFormContainer = document.getElementById("registerFormContainer");
const createPostSection = document.getElementById("createPostSection");
const feedSection = document.getElementById("feedSection");
const chatSection = document.getElementById("chatSection");
const notificationsSection = document.getElementById("notificationsSection");
const profileSection = document.getElementById("profileSection");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginSubmit = document.getElementById("loginSubmit");
const loginMessage = document.getElementById("loginMessage");

const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerSubmit = document.getElementById("registerSubmit");
const registerMessage = document.getElementById("registerMessage");

const postContent = document.getElementById("postContent");
const postImageUrl = document.getElementById("postImageUrl");
const postVideoUrl = document.getElementById("postVideoUrl");
const publishPostBtn = document.getElementById("publishPostBtn");
const postMessage = document.getElementById("postMessage");
const postsContainer = document.getElementById("postsContainer");

const chatRecipientSelect = document.getElementById("chatRecipientSelect");
const chatMessagesDisplay = document.getElementById("chatMessagesDisplay");
const chatMessageInput = document.getElementById("chatMessageInput");
const chatSendMessageBtn = document.getElementById("chatSendMessageBtn");
const chatMessage = document.getElementById("chatMessage");

const notificationsList = document.getElementById("notificationsList");
const notificationCount = document.getElementById("notificationCount");

const profileEmailDisplay = document.getElementById("profileEmailDisplay");
const profileUsernameInput = document.getElementById("profileUsernameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileMessage = document.getElementById("profileMessage");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const viewFeedBtn = document.getElementById("viewFeedBtn");
const createPostBtn = document.getElementById("createPostBtn");
const openChatBtn = document.getElementById("openChatBtn");
const openNotificationsBtn = document.getElementById("openNotificationsBtn");
const openProfileBtn = document.getElementById("openProfileBtn");

let currentUserUsername = null;
const postElementMap = new Map(); // Para rastrear elementos de postagens e evitar duplicação/re-criação desnecessária

// --- Funções Auxiliares ---
function showMessage(element, msg, type) {
    element.textContent = msg;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
        element.textContent = '';
    }, 5000);
}

function hideAllForms() {
    loginFormContainer.classList.remove("active");
    registerFormContainer.classList.remove("active");
    createPostSection.classList.remove("active");
    feedSection.classList.remove("active");
    chatSection.classList.remove("active");
    notificationsSection.classList.remove("active");
    profileSection.classList.remove("active");
}

function showSection(sectionElement) {
    hideAllForms();
    sectionElement.classList.add("active");
}

// --- Funções Auxiliares para Vídeos ---
function extractYouTubeVideoId(url) {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return (match && match[1] && match[1].length === 11) ? match[1] : null;
}

function extractVimeoVideoId(url) {
    const regExp = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?))/;
    const match = url.match(regExp);
    return (match && match[3]) ? match[3] : null;
}


// --- Lógica de Autenticação ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Usuário logado
        loginBtn.style.display = "none";
        registerBtn.style.display = "none";
        logoutBtn.style.display = "block";
        viewFeedBtn.style.display = "block";
        createPostBtn.style.display = "block";
        openChatBtn.style.display = "block";
        openNotificationsBtn.style.display = "block";
        openProfileBtn.style.display = "block";

        // Obter nome de usuário do Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            currentUserUsername = userDocSnap.data().username;
            profileUsernameInput.value = currentUserUsername;
        } else {
            currentUserUsername = user.email.split('@')[0];
            await setDoc(userDocRef, {
                email: user.email,
                username: currentUserUsername
            });
        }
        profileEmailDisplay.textContent = user.email;

        loadPosts();
        loadUsersForChat();
        loadNotifications();
        showSection(feedSection);
    } else {
        // Usuário deslogado
        loginBtn.style.display = "block";
        registerBtn.style.display = "block";
        logoutBtn.style.display = "none";
        viewFeedBtn.style.display = "none";
        createPostBtn.style.display = "none";
        openChatBtn.style.display = "none";
        openNotificationsBtn.style.display = "none";
        openProfileBtn.style.display = "none";
        currentUserUsername = null;
        postsContainer.innerHTML = '';
        chatMessagesDisplay.innerHTML = '';
        chatRecipientSelect.innerHTML = '<option value="">Selecione um usuário</option>';
        notificationsList.innerHTML = '';
        notificationCount.textContent = '0';

        showSection(loginFormContainer);
    }
});

// --- Login e Cadastro ---
loginSubmit.addEventListener("click", async () => {
    const email = loginEmail.value;
    const password = loginPassword.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage(loginMessage, "Login bem-sucedido!", 'success');
    } catch (error) {
        console.error("Erro no login:", error);
        showMessage(loginMessage, "Erro no login: " + error.message, 'error');
    }
});

registerSubmit.addEventListener("click", async () => {
    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();

    if (!username || !email || !password) {
        showMessage(registerMessage, "Preencha todos os campos.", 'error');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            username: username
        });

        showMessage(registerMessage, "Cadastro bem-sucedido! Faça login.", 'success');
        registerUsername.value = "";
        registerEmail.value = "";
        registerPassword.value = "";
        showSection(loginFormContainer);
    } catch (error) {
        console.error("Erro no cadastro:", error);
        showMessage(registerMessage, "Erro no cadastro: " + error.message, 'error');
    }
});

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        showMessage(loginMessage, "Logout bem-sucedido!", 'success');
        showSection(loginFormContainer);
    } catch (error) {
        console.error("Erro no logout:", error);
        showMessage(loginMessage, "Erro no logout: " + error.message, 'error');
    }
});

// --- Navegação ---
viewFeedBtn.addEventListener("click", () => showSection(feedSection));
createPostBtn.addEventListener("click", () => showSection(createPostSection));
openChatBtn.addEventListener("click", () => showSection(chatSection));
openNotificationsBtn.addEventListener("click", () => showSection(notificationsSection));
openProfileBtn.addEventListener("click", () => showSection(profileSection));
loginBtn.addEventListener("click", () => showSection(loginFormContainer));
registerBtn.addEventListener("click", () => showSection(registerFormContainer));

// --- Lógica de Posts ---
publishPostBtn.addEventListener("click", async () => {
    const content = postContent.value.trim();
    const imageUrl = postImageUrl.value.trim();
    const videoUrl = postVideoUrl.value.trim(); // Campo de URL de vídeo

    if (!content && !imageUrl && !videoUrl) {
        showMessage(postMessage, "O post não pode ser vazio.", 'error');
        return;
    }

    if (!auth.currentUser) {
        showMessage(postMessage, "Você precisa estar logado para publicar posts.", 'error');
        return;
    }

    let postData = {
        content: content,
        timestamp: serverTimestamp(),
        userId: auth.currentUser.uid,
        username: currentUserUsername || auth.currentUser.email,
        likedBy: [], // Inicializa array de usuários que curtiram
        likesCount: 0, // Inicializa contador de likes
        commentsCount: 0 // Inicializa contador de comentários
    };

    let postType = 'text';
    if (imageUrl) {
        postData.imageUrl = imageUrl;
        postType = 'image';
    } else if (videoUrl) { // Se houver URL de vídeo
        const youtubeId = extractYouTubeVideoId(videoUrl);
        const vimeoId = extractVimeoVideoId(videoUrl);

        if (youtubeId) {
            postData.videoType = 'youtube';
            postData.videoId = youtubeId;
            postType = 'video';
        } else if (vimeoId) {
            postData.videoType = 'vimeo';
            postData.videoId = vimeoId;
            postType = 'video';
        } else {
            // Se não for YouTube nem Vimeo, trata como link normal
            postData.linkPreview = { url: videoUrl, title: "Link de Vídeo", description: "Clique para assistir." };
            postType = 'link';
        }
    } else if (content.startsWith('http://') || content.startsWith('https://')) {
        // Se o conteúdo for um link (e não for imagem/vídeo)
        postData.linkPreview = { url: content, title: "Link Compartilhado", description: "Clique para abrir." };
        postType = 'link';
    }

    postData.postType = postType;

    try {
        await addDoc(collection(db, "posts"), postData);
        showMessage(postMessage, "Post publicado com sucesso!", 'success');
        postContent.value = "";
        postImageUrl.value = "";
        postVideoUrl.value = ""; // Limpa o campo de vídeo
    } catch (error) {
        console.error("Erro ao publicar post:", error);
        showMessage(postMessage, "Erro ao publicar post: " + error.message, 'error');
    }
});


function loadPosts() {
    const q = query(collection(db, "posts"), orderBy("timestamp", "asc"));

    onSnapshot(q, (snapshot) => {
        // Limpa o container e renderiza tudo de novo para garantir a ordem e evitar duplicação
        // Isso é menos eficiente para grandes feeds, mas mais simples para manter a ordem
        postsContainer.innerHTML = ''; 

        snapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;
            const postElement = document.createElement("div");
            postElement.classList.add("post-card");
            postElement.dataset.postId = postId; // Armazena o ID no elemento DOM
            
            let mediaHtml = '';
            let linkPreviewHtml = '';
            
            if (post.postType === 'image' && post.imageUrl) {
                mediaHtml = `<img src="${post.imageUrl}" alt="Post Image" class="post-image-preview">`;
            } else if (post.postType === 'video' && post.videoId) {
                if (post.videoType === 'youtube') {
                    mediaHtml = `
                        <div class="video-container">
                            <iframe
                                src="https://www.youtube.com/embed/$${post.videoId}"
                                frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                                class="video-player">
                            </iframe>
                        </div>
                    `;
                } else if (post.videoType === 'vimeo') {
                    mediaHtml = `
                        <div class="video-container">
                            <iframe
                                src="https://player.vimeo.com/video/${post.videoId}"
                                frameborder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowfullscreen
                                class="video-player">
                            </iframe>
                        </div>
                    `;
                }
            } else if (post.postType === 'link' && post.linkPreview && post.linkPreview.url) {
                linkPreviewHtml = `
                    <div class="link-preview-box">
                        ${post.linkPreview.image ? `<img src="${post.linkPreview.image}" class="link-preview-img">` : ''}
                        <div class="link-preview-texts">
                            <strong>${post.linkPreview.title || 'Link'}</strong>
                            <p>${post.linkPreview.description || ''}</p>
                            <a href="${post.linkPreview.url}" target="_blank" style="color:#6A0DAD;">${post.linkPreview.url}</a>
                        </div>
                    </div>
                `;
            }

            // ATENÇÃO: Os botões de like/comentário nesta versão são apenas HTML estático
            // A funcionalidade de clique ainda não está completamente integrada aqui
            postElement.innerHTML = `
                <h3>${post.username || post.userId}</h3>
                <p>${post.content}</p>
                ${mediaHtml}
                ${linkPreviewHtml}
                <small>${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Carregando...'}</small>
                <div class="post-actions">
                    <button class="like-button">
                        <span class="heart-icon">❤️</span> <span class="likes-count">${post.likesCount || 0}</span> Curtir
                    </button>
                    <button class="comment-button">
                        <span class="comment-icon">💬</span> <span class="comments-count">${post.commentsCount || 0}</span> Comentar
                    </button>
                </div>
            `;

            postsContainer.prepend(postElement); // Adiciona o post no topo (mais recente)
        });
    });
}


// --- Lógica de Chat ---
let currentChatRecipientId = null;
let unsubscribeChat = null; // Para desinscrever listeners de chat

chatRecipientSelect.addEventListener('change', (event) => {
    const selectedUserId = event.target.value;
    if (selectedUserId) {
        currentChatRecipientId = selectedUserId;
        loadChatMessages(auth.currentUser.uid, selectedUserId);
    } else {
        currentChatRecipientId = null;
        chatMessagesDisplay.innerHTML = '';
        if (unsubscribeChat) {
            unsubscribeChat();
            unsubscribeChat = null;
        }
    }
});

chatSendMessageBtn.addEventListener('click', async () => {
    const messageContent = chatMessageInput.value.trim();
    if (!messageContent || !currentChatRecipientId || !auth.currentUser) {
        showMessage(chatMessage, "Selecione um destinatário e digite uma mensagem.", 'error');
        return;
    }

    const senderId = auth.currentUser.uid;
    const recipientId = currentChatRecipientId;
    const senderUsername = currentUserUsername || auth.currentUser.email;

    try {
        // Envia mensagem para a subcoleção do remetente
        await addDoc(collection(db, "chats", senderId, "messages"), {
            from: senderId,
            to: recipientId,
            content: messageContent,
            timestamp: serverTimestamp(),
            read: false,
            senderUsername: senderUsername // Adiciona o nome de usuário do remetente
        });

        // Envia a mesma mensagem para a subcoleção do destinatário
        await addDoc(collection(db, "chats", recipientId, "messages"), {
            from: senderId,
            to: recipientId,
            content: messageContent,
            timestamp: serverTimestamp(),
            read: false,
            senderUsername: senderUsername
        });

        chatMessageInput.value = "";
        showMessage(chatMessage, "Mensagem enviada!", 'success');
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        showMessage(chatMessage, "Erro ao enviar mensagem: " + error.message, 'error');
    }
});

async function loadUsersForChat() {
    chatRecipientSelect.innerHTML = '<option value="">Selecione um usuário</option>';
    const usersCollectionRef = collection(db, "users");
    try {
        const querySnapshot = await getDocs(usersCollectionRef);
        querySnapshot.forEach((doc) => {
            const user = doc.data();
            const userId = doc.id;
            if (userId !== auth.currentUser.uid) {
                const option = document.createElement("option");
                option.value = userId;
                option.textContent = user.username || user.email;
                chatRecipientSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Erro ao carregar usuários para chat:", error);
    }
}

function loadChatMessages(userId1, userId2) {
    if (unsubscribeChat) {
        unsubscribeChat(); // Desinscreve o listener anterior
    }

    // Consulta para mensagens onde userId1 é o remetente E userId2 é o destinatário
    const q1 = query(
        collection(db, "chats", userId1, "messages"),
        where("to", "==", userId2),
        orderBy("timestamp", "asc")
    );

    // Consulta para mensagens onde userId2 é o remetente E userId1 é o destinatário
    // (estas mensagens estarão na coleção de mensagens de userId2, não de userId1)
    // Para resolver isso, teríamos que ter um listener para cada usuário
const messagesRef = collection(db, "chats", userId1, "messages");
    const q = query(
        messagesRef,
        where("to", "==", userId2), // Isso fará com que você só veja as mensagens que enviou para userId2
        orderBy("timestamp", "asc")
    );

    unsubscribeChat = onSnapshot(q, (snapshot) => {
        chatMessagesDisplay.innerHTML = '';
        snapshot.forEach((doc) => {
            const msg = doc.data();
            const messageElement = document.createElement("div");
            messageElement.classList.add("chat-message");
            if (msg.from === userId1) { // Se você é o remetente
                messageElement.classList.add("sent");
            } else { // Se o outro usuário é o remetente
                messageElement.classList.add("received");
            }
            messageElement.textContent = `${msg.senderUsername || msg.from}: ${msg.content} (${new Date(msg.timestamp.toDate()).toLocaleString()})`;
            chatMessagesDisplay.appendChild(messageElement);
        });
        chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight;
    }, (error) => {
        console.error("Erro ao carregar mensagens do chat:", error);
        showMessage(chatMessage, "Erro ao carregar mensagens do chat: " + error.message, 'error');
    });
}


// --- Lógica de Notificações ---
function loadNotifications() {
    if (!auth.currentUser) return;

    const notificationsRef = collection(db, "users", auth.currentUser.uid, "notifications");
    const q = query(notificationsRef, orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        notificationsList.innerHTML = '';
        let unreadCount = 0;
        snapshot.forEach((doc) => {
            const notification = doc.data();
            if (!notification.read) {
                unreadCount++;
            }

            const notificationElement = document.createElement("div");
            notificationElement.classList.add("notification-item");
            if (!notification.read) {
                notificationElement.classList.add("unread");
            }
            notificationElement.textContent = notification.message + " (" + new Date(notification.timestamp.toDate()).toLocaleString() + ")";
            notificationsList.appendChild(notificationElement);

            // Marcar notificação como lida após exibição
            if (!notification.read) {
                updateDoc(doc.ref, { read: true }).catch(e => console.error("Erro ao marcar notificação como lida:", e));
            }
        });
        notificationCount.textContent = unreadCount.toString();
    }, (error) => {
        console.error("Erro ao carregar notificações:", error);
    });
}

async function sendNotification(recipientId, message) {
    try {
        await addDoc(collection(db, "users", recipientId, "notifications"), {
            message: message,
            timestamp: serverTimestamp(),
            read: false
        });
    } catch (error) {
        console.error("Erro ao enviar notificação:", error);
    }
}

// --- Lógica de Perfil ---
saveProfileBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        showMessage(profileMessage, "Você precisa estar logado para atualizar seu perfil.", 'error');
        return;
    }

    const newUsername = profileUsernameInput.value.trim();
    
    if (!newUsername) {
        showMessage(profileMessage, "O nome de usuário não pode ser vazio.", 'error');
        return;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            username: newUsername
        });
        currentUserUsername = newUsername; // Atualiza a variável global
        showMessage(profileMessage, "Nome de usuário atualizado com sucesso!", 'success');
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
