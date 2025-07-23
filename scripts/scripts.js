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
    const videoUrl = postVideoUrl.value.trim();

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
    } else if (videoUrl) {
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
            postData.linkPreview = { url: videoUrl, title: "Link de Vídeo", description: "Clique para assistir." };
            postType = 'link';
        }
    } else if (content.startsWith('http://') || content.startsWith('https://')) {
        postData.linkPreview = { url: content, title: "Link Compartilhado", description: "Clique para abrir." };
        postType = 'link';
    }

    postData.postType = postType;

    try {
        await addDoc(collection(db, "posts"), postData);
        showMessage(postMessage, "Post publicado com sucesso!", 'success');
        postContent.value = "";
        postImageUrl.value = "";
        postVideoUrl.value = "";
    } catch (error) {
        console.error("Erro ao publicar post:", error);
        showMessage(postMessage, "Erro ao publicar post: " + error.message, 'error');
    }
});

// Função para atualizar o display de likes (cor do botão e contagem)
function updateLikeDisplay(likeButtonElement, likedByArray, likesCount) {
    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
    const isLiked = likedByArray && currentUserId && likedByArray.includes(currentUserId);

    if (isLiked) {
        likeButtonElement.classList.add('liked'); // Adiciona classe para estilo visual (roxo)
    } else {
        likeButtonElement.classList.remove('liked'); // Remove classe
    }
    likeButtonElement.querySelector('.likes-count').textContent = likesCount;
}

// Função para configurar listeners de ações do post
function setupPostActions(postElement, postId, post) {
    const likeButton = postElement.querySelector('.like-button');
    const commentButton = postElement.querySelector('.comment-button');

    // Configurar display inicial do like
    updateLikeDisplay(likeButton, post.likedBy || [], post.likesCount || 0);

    // Listener de Like
    likeButton.addEventListener('click', async () => {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
            showMessage(postMessage, "Faça login para curtir posts.", 'error');
            return;
        }

        const postRef = doc(db, "posts", postId);
        const currentLikedBy = post.likedBy || [];
        const isLiked = currentLikedBy.includes(userId);

        try {
            if (isLiked) {
                // Descurtir
                await updateDoc(postRef, {
                    likedBy: arrayRemove(userId),
                    likesCount: increment(-1)
                });
            } else {
                // Curtir
                await updateDoc(postRef, {
                    likedBy: arrayUnion(userId),
                    likesCount: increment(1)
                });
                // Enviar notificação para o autor do post
                if (userId !== post.userId) { // Não notifica se curtir o próprio post
                    sendNotification(post.userId, `${currentUserUsername || auth.currentUser.email} curtiu seu post.`);
                }
            }
        } catch (error) {
            console.error("Erro ao curtir/descurtir:", error);
            showMessage(postMessage, "Erro ao interagir com o post.", 'error');
        }
    });

    // Listener de Comentário (apenas um placeholder por enquanto)
    commentButton.addEventListener('click', () => {
        // Implementar lógica de modal/campo de comentário aqui
        showMessage(postMessage, "Funcionalidade de comentário em desenvolvimento!", 'info');
    });
}


function loadPosts() {
    const q = query(collection(db, "posts"), orderBy("timestamp", "asc"));

    const postIdsInDom = new Set(); // Mantém controle dos posts no DOM

    onSnapshot(q, (snapshot) => {
        // Remove posts que foram deletados do Firestore
        const postIdsFromFirebase = new Set(snapshot.docs.map(doc => doc.id));
        postsContainer.childNodes.forEach(node => {
            if (node.nodeType === 1 && node.dataset.postId && !postIdsFromFirebase.has(node.dataset.postId)) {
                node.remove();
                postIdsInDom.delete(node.dataset.postId);
            }
        });

        snapshot.docChanges().forEach((change) => {
            const post = change.doc.data();
            const postId = change.doc.id;
            let postElement = document.querySelector(`[data-post-id="${postId}"]`);

            if (change.type === "added") {
                if (!postIdsInDom.has(postId)) { // Adiciona apenas se não estiver no DOM
                    postElement = document.createElement("div");
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
                                        src="https://www.youtube.com/embed/${post.videoId}"
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
                    postIdsInDom.add(postId);
                    setupPostActions(postElement, postId, post); // Configura listeners para o novo post
                }
            } else if (change.type === "modified") {
                if (postElement) { // Verifica se o elemento já exte no DOM
                    let mediaHtml = '';
                    let linkPreviewHtml = '';
    
                    if (post.postType === 'image' && post.imageUrl) {
                        mediaHtml = `<img src="${post.imageUrl}" alt="Post Image" class="post-image-preview">`;
                    } else if (post.postType === 'video' && post.videoId) {
                        if (post.videoType === 'youtube') {
                            mediaHtml = `
                                <div class="video-container">
                                    <iframe
                                        src="https://www.youtube.com/embed/${post.videoId}"
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
    
                    // Atualiza o conteúdo HTML, mantendo os botões de ação
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
                    setupPostActions(postElement, postId, post); // Re-configura listeners para o post modificado
                }
            } else if (change.type === "removed") {
                if (postElement) {
                    postElement.remove();
                    postIdsInDom.delete(removedPostId);
                }
            }
        });
    });
}


// --- Lógica de Chat ---
let currentChatRecipientId = null;
let unsubscribeChatMessages = null;

// Nova função para gerar um ID de sala de chat consistente entre dois usuários
function getChatRoomId(userId1, userId2) {
    // Garante que o ID da sala seja sempre o mesmo, independente da ordem dos usuários
    return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
}

chatRecipientSelect.addEventListener('change', (event) => {
    const selectedUserId = event.target.value;
    if (selectedUserId) {
        currentChatRecipientId = selectedUserId;
        loadChatMessages(auth.currentUser.uid, selectedUserId);
    } else {
        currentChatRecipientId = null;
        chatMessagesDisplay.innerHTML = '';
        if (unsubscribeChatMessages) {
            unsubscribeChatMessages();
            unsubscribeChatMessages = null;
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
    const chatRoomId = getChatRoomId(senderId, recipientId);

    try {
        // Adiciona a mensagem à subcoleção 'messages' da sala de chat
        await addDoc(collection(db, "privateChats", chatRoomId, "messages"), {
            senderId: senderId,
            recipientId: recipientId,
            content: messageContent,
            timestamp: serverTimestamp(),
            read: false
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

function loadChatMessages(currentUserUid, selectedRecipientId) {
    if (unsubscribeChatMessages) {
        unsubscribeChatMessages();
    }

    const chatRoomId = getChatRoomId(currentUserUid, selectedRecipientId);
    const messagesRef = collection(db, "privateChats", chatRoomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    unsubscribeChatMessages = onSnapshot(q, (snapshot) => {
        chatMessagesDisplay.innerHTML = '';
        snapshot.forEach((doc) => {
            const msg = doc.data();
            const messageElement = document.createElement("div");
            messageElement.classList.add("chat-message");
            if (msg.senderId === currentUserUid) {
                messageElement.classList.add("sent");
            } else {
                messageElement.classList.add("received");
            }
            // Inclui o nome do remetente
            messageElement.textContent = `${(msg.senderId === currentUserUid ? currentUserUsername : (chatRecipientSelect.options[chatRecipientSelect.selectedIndex].text)) || msg.senderId}: ${msg.content} (${new Date(msg.timestamp.toDate()).toLocaleString()})`;
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
        currentUserUsername = newUsername;
        showMessage(profileMessage, "Nome de usuário atualizado com sucesso!", 'success');
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        showMessage(profileMessage, "Erro ao atualizar perfil: " + error.message, 'error');
    }
});


// Inicialização: Ao carregar a página, se não houver um usuário logado, mostra o formulário de login.
document.addEventListener('DOMContentLoaded', () => {
    hideAllForms();
    console.log("DOM totalmente carregado.");
});
