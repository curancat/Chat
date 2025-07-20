// --- Configuração do Firebase ---
// Importa as funções específicas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where, updateDoc, arrayUnion, arrayRemove, increment, addDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
// REMOVIDO: import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDd4ZIyPIoJJCHCPeeUIChaEsNSBMLpVgA",
  authDomain: "vlog-8a75f.firebaseapp.com",
  projectId: "vlog-8a75f",
  storageBucket: "vlog-8a75f.firebasestorage.app", // Pode manter, mas não será usado para conteúdo do usuário
  messagingSenderId: "1063952650353",
  appId: "1:1063952650353:web:25f37c51b49daeaf81cbd0",
  measurementId: "G-GRM2E926W3"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
// REMOVIDO: const storage = getStorage(app); // Storage não será mais inicializado para upload de conteúdo do usuário

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
const chatMessageDiv = document.getElementById("chatMessage");
const chatMessagesDisplay = document.getElementById("chatMessagesDisplay");
const chatRecipientSelect = document.getElementById("chatRecipientSelect");

const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const viewFeedBtn = document.getElementById("viewFeedBtn");
const createPostBtn = document.getElementById("createPostBtn");
const openChatBtn = document.getElementById("openChatBtn");
const openNotificationsBtn = document.getElementById("openNotificationsBtn"); // NOVO: Botão Notificações
const notificationCountSpan = document.getElementById("notificationCount"); // NOVO: Contador Notificações

const loginFormContainer = document.getElementById("loginFormContainer");
const registerFormContainer = document.getElementById("registerFormContainer");
const createPostSection = document.getElementById("createPostSection");
const chatSection = document.getElementById("chatSection");
const feedSection = document.getElementById("feedSection");
const notificationsSection = document.getElementById("notificationsSection"); // NOVO: Seção Notificações
const postsContainer = document.getElementById("postsContainer");
const notificationsList = document.getElementById("notificationsList"); // NOVO: Lista Notificações


// --- Utilitários ---
function showMessage(element, msg, type = 'success') {
    element.textContent = msg;
    element.style.color = type === 'success' ? 'green' : 'red';
    if (!element.classList.contains('active')) {
        element.style.display = 'block';
    }
    setTimeout(() => {
        element.textContent = '';
        element.style.display = 'none';
    }, 4000);
}

function hideAllForms() {
    loginFormContainer.classList.remove('active');
    registerFormContainer.classList.remove('active');
    createPostSection.classList.remove('active');
    chatSection.classList.remove('active');
    feedSection.classList.remove('active');
    notificationsSection.classList.remove('active'); // NOVO: Esconde notificações
}

function updateNavButtons(isLoggedIn) {
    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        viewFeedBtn.style.display = 'block';
        createPostBtn.style.display = 'block';
        openChatBtn.style.display = 'block';
        openNotificationsBtn.style.display = 'block'; // NOVO: Mostra botão de notificação
        setupNotificationListener(auth.currentUser.uid); // NOVO: Inicia o listener de notificações
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        viewFeedBtn.style.display = 'none';
        createPostBtn.style.display = 'none';
        openChatBtn.style.display = 'none';
        openNotificationsBtn.style.display = 'none'; // NOVO: Esconde botão de notificação
        notificationCountSpan.textContent = '0'; // NOVO: Zera o contador
    }
}

loginBtn.addEventListener('click', () => {
    hideAllForms();
    loginFormContainer.classList.add('active');
});

registerBtn.addEventListener('click', () => {
    hideAllForms();
    registerFormContainer.classList.add('active');
});

createPostBtn.addEventListener('click', () => {
    hideAllForms();
    createPostSection.classList.add('active');
});

openChatBtn.addEventListener('click', () => {
    hideAllForms();
    chatSection.classList.add('active');
    loadChatUsers();
});

viewFeedBtn.addEventListener('click', () => {
    hideAllForms();
    feedSection.classList.add('active');
    loadPosts(); // Garante que posts sejam carregados ao ir para o feed
});

// NOVO: Event Listener para o botão de Notificações
openNotificationsBtn.addEventListener('click', () => {
    hideAllForms();
    notificationsSection.classList.add('active');
    loadNotifications(); // Carrega a lista completa de notificações
});


// --- Autenticação ---
loginSubmit.addEventListener("click", () => {
    const email = loginEmail.value;
    const password = loginPassword.value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            showMessage(loginMessage, "Login bem-sucedido!");
            hideAllForms();
            feedSection.classList.add('active');
        })
        .catch(error => showMessage(loginMessage, error.message, 'error'));
});

registerSubmit.addEventListener("click", () => {
    const email = registerEmail.value;
    const password = registerPassword.value;
    const username = registerUsername.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(cred => {
            return setDoc(doc(db, "users", cred.user.uid), { username, email });
        })
        .then(() => {
            showMessage(registerMessage, "Cadastro realizado com sucesso!");
            hideAllForms();
            loginFormContainer.classList.add('active');
        })
        .catch(error => showMessage(registerMessage, error.message, 'error'));
});

// Logout
logoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            showMessage(loginMessage, "Logout bem-sucedido!");
            hideAllForms();
            loginFormContainer.classList.add('active');
        })
        .catch(error => {
            showMessage(loginMessage, error.message, 'error');
        });
});

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
    updateNavButtons(!!user);
    if (user) {
        console.log("Usuário logado:", user.email, user.uid);
        if (!loginFormContainer.classList.contains('active') && !registerFormContainer.classList.contains('active') &&
            !createPostSection.classList.contains('active') && !chatSection.classList.contains('active') &&
            !feedSection.classList.contains('active') && !notificationsSection.classList.contains('active')) { // NOVO: Notificações
                hideAllForms();
                feedSection.classList.add('active');
                loadPosts();
        }
    } else {
        console.log("Nenhum usuário logado.");
        hideAllForms();
        loginFormContainer.classList.add('active');
    }
});


// --- Publicar Post (SOMENTE TEXTO) ---
publishPostBtn.addEventListener("click", async () => {
    const content = postContent.value;
    const user = auth.currentUser;

    if (!user || !content.trim()) { // .trim() para garantir que não é apenas espaços em branco
        showMessage(postMessage, "Preencha o conteúdo do post e esteja logado.", 'error');
        return;
    }

    const postDocRef = doc(collection(db, "posts"));

    try {
        // Obter o nome de usuário para o post
        const userDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let username = user.email;
        userDocSnapshot.forEach((doc) => {
            username = doc.data().username || user.email;
        });

        // Salvar o post no Firestore com campos de curtidas vazios/iniciados
        await setDoc(postDocRef, {
            content: content,
            userId: user.uid,
            username: username,
            timestamp: serverTimestamp(),
            likesCount: 0, // Contador de curtidas
            likedBy: []    // Array para armazenar IDs dos usuários que curtiram
        });

        postContent.value = '';
        showMessage(postMessage, "Post publicado com sucesso!");
    } catch (error) {
        showMessage(postMessage, "Erro ao publicar post.", 'error');
        console.error("Erro ao publicar post:", error);
    }
});

// --- Função para Curtir/Descurtir um Post ---
async function toggleLike(postId, currentLikesCount, likedByUserIds) {
    const user = auth.currentUser;
    if (!user) {
        showMessage(postMessage, "Você precisa estar logado para curtir posts.", 'error');
        return;
    }

    const postRef = doc(db, "posts", postId);
    const userId = user.uid;

    try {
        if (likedByUserIds.includes(userId)) {
            // Usuário já curtiu, então descurtir
            await updateDoc(postRef, {
                likesCount: increment(-1), // Decrementa o contador
                likedBy: arrayRemove(userId) // Remove o ID do usuário do array
            });
            showMessage(postMessage, "Você descurtiu o post.");
        } else {
            // Usuário não curtiu, então curtir
            await updateDoc(postRef, {
                likesCount: increment(1), // Incrementa o contador
                likedBy: arrayUnion(userId) // Adiciona o ID do usuário ao array
            });
            showMessage(postMessage, "Você curtiu o post!");

            // NOVO: Adicionar notificação de curtida
             const postDoc = await getDoc(doc(db, "posts", postId)); // Obtém o post para saber o userId do dono// Obtém o post para saber o userId do dono
            if (postDoc.exists()) {
              const postData = postDoc.data();
              const postOwnerId = postData.userId;
              const postOwnerUsername = postData.username;
              if (postOwnerId !== user.uid) { // Não notifica se o próprio usuário curtiu o próprio post
                addNotification(postOwnerId, user.uid, user.displayName || user.email, 'like', `curtiu seu post: "${postData.content.substring(0, 30)}..."`, postId);
               }
            }
        }
    } catch (error) {
        console.error("Erro ao curtir/descurtir o post:", error);
        showMessage(postMessage, "Erro ao processar sua curtida.", 'error');
    }
}

// --- Funções de Comentário ---

// Função para adicionar um comentário
async function addComment(postId, commentText) {
    const user = auth.currentUser;
    if (!user || !commentText.trim()) {
        showMessage(postMessage, "Você precisa estar logado e digitar um comentário.", 'error');
        return;
    }

    try {
        // Obter o nome de usuário para o comentário
        const userDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let username = user.email;
        userDocSnapshot.forEach((doc) => {
            username = doc.data().username || user.email;
        });

        const commentsCollectionRef = collection(db, "posts", postId, "comments");
        await addDoc(commentsCollectionRef, {
            userId: user.uid,
            username: username,
            text: commentText,
            timestamp: serverTimestamp()
        });
        showMessage(postMessage, "Comentário adicionado com sucesso!");

        // NOVO: Adicionar notificação de comentário
        const postDoc = await getDocs(query(collection(db, "posts"), where("__name__", "==", postId))); // Obtém o post para saber o userId do dono
        if (!postDoc.empty) {
            const postOwnerId = postDoc.docs[0].data().userId;
            const postOwnerUsername = postDoc.docs[0].data().username;
            if (postOwnerId !== user.uid) { // Não notifica se o próprio usuário comentou no próprio post
                addNotification(postOwnerId, user.uid, username, 'comment', `comentou em seu post: "${commentText.substring(0, 30)}..."`, postId);
            }
        }

    } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
        showMessage(postMessage, "Erro ao adicionar comentário.", 'error');
    }
}

// Função para carregar e exibir comentários
function loadComments(postId, commentsListElement) {
    const commentsCollectionRef = collection(db, "posts", postId, "comments");
    const q = query(commentsCollectionRef, orderBy("timestamp", "asc"));

    // Usar onSnapshot para atualizações em tempo real
    onSnapshot(q, (snapshot) => {
        commentsListElement.innerHTML = ''; // Limpa os comentários existentes
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
    }, (error) => {
        console.error("Erro ao carregar comentários:", error);
        showMessage(commentsListElement, "Erro ao carregar comentários.", 'error');
    });
}


// --- Carregar Posts (Feed) ---
function loadPosts() {
    postsContainer.innerHTML = '';
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        postsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id; // Obtenha o ID do post
            const currentUser = auth.currentUser;
            const likedBy = post.likedBy || []; // Garante que likedBy seja um array
            const isLiked = currentUser ? likedBy.includes(currentUser.uid) : false; // Verifica se o usuário logado curtiu

            const postElement = document.createElement('div');
            postElement.classList.add('post-card');
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
            postsContainer.appendChild(postElement);

            // Adiciona Event Listener para o botão de curtir
            const likeButton = postElement.querySelector(`.like-button[data-post-id="${postId}"]`);
            if (likeButton) {
                likeButton.addEventListener('click', () => {
                    const currentLikes = parseInt(likeButton.dataset.likesCount); // Pega o valor atual do atributo
                    toggleLike(postId, currentLikes, likedBy); // Passa o array `likedBy` completo
                });
            }

            // Adiciona Event Listener para o botão de COMENTAR (toggle)
            const commentToggleButton = postElement.querySelector(`.comment-toggle-button[data-post-id="${postId}"]`);
            const postCommentsSection = postElement.querySelector(`.post-comments[data-post-id="${postId}"]`);
            const commentsListElement = postCommentsSection.querySelector('.comments-list');

            if (commentToggleButton && postCommentsSection) {
                commentToggleButton.addEventListener('click', () => {
                    if (postCommentsSection.style.display === 'none') {
                        postCommentsSection.style.display = 'block'; // Mostra a seção de comentários
                        loadComments(postId, commentsListElement); // Carrega os comentários quando a seção é aberta
                    } else {
                        postCommentsSection.style.display = 'none'; // Esconde a seção de comentários
                    }
                });
            }

            // Adiciona Event Listener para o botão de ENVIAR COMENTÁRIO
            const submitCommentButton = postCommentsSection.querySelector('.submit-comment-button');
            const commentInput = postCommentsSection.querySelector('.comment-input');

            if (submitCommentButton && commentInput) {
                submitCommentButton.addEventListener('click', async () => {
                    const commentText = commentInput.value.trim();
                    if (commentText) {
                        await addComment(postId, commentText);
                        commentInput.value = ''; // Limpa o input após enviar
                    } else {
                        showMessage(postMessage, "Por favor, digite um comentário.", 'warning');
                    }
                });
            }
        });
    }, (error) => {
        console.error("Error fetching posts:", error);
        showMessage(postsContainer, "Erro ao carregar posts.", 'error');
    });
}


// --- Chat Privado ---
let currentChatRecipientId = null;

async function loadChatUsers() {
    chatRecipientSelect.innerHTML = '<option value="">Selecione um usuário</option>';
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("username"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== currentUser.uid) {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = userData.username || userData.email;
            chatRecipientSelect.appendChild(option);
        }
    });

    if (!chatRecipientSelect.dataset.listenerAdded) {
        chatRecipientSelect.addEventListener('change', (event) => {
            currentChatRecipientId = event.target.value;
            chatMessagesDisplay.innerHTML = '';
            if (currentChatRecipientId) {
                listenForChatMessages(currentUser.uid, currentChatRecipientId);
            }
        });
        chatRecipientSelect.dataset.listenerAdded = true;
    }
}

function listenForChatMessages(user1Id, user2Id) {
    const chatCollectionRef = collection(db, "privateChats");

    const q1 = query(chatCollectionRef,
        where("senderId", "==", user1Id),
        where("recipientId", "==", user2Id)
    );
    const q2 = query(chatCollectionRef,
        where("senderId", "==", user2Id),
        where("recipientId", "==", user1Id)
    );

    onSnapshot(q1, (snapshot1) => {
        onSnapshot(q2, (snapshot2) => {
            const allMessages = [];
            snapshot1.forEach(doc => allMessages.push(doc.data()));
            snapshot2.forEach(doc => allMessages.push(doc.data()));

            allMessages.sort((a, b) => {
                const timestampA = a.timestamp?.toDate() || new Date(0);
                const timestampB = b.timestamp?.toDate() || new Date(0);
                return timestampA - timestampB;
            });

            chatMessagesDisplay.innerHTML = '';
            allMessages.forEach(message => {
                displayChatMessage(message);
            });
            chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight;
        });
    });
}

// Display a single chat message
function displayChatMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-bubble');
    const currentUser = auth.currentUser;

    let senderName = message.senderUsername || "Desconhecido";
    if (currentUser && message.senderId === currentUser.uid) {
        messageElement.classList.add('sent');
        senderName = "Você";
    } else {
        messageElement.classList.add('received');
    }

    let contentHTML = '';
    // Apenas exibe o texto da mensagem
    if (message.message) {
        contentHTML = `<p>${message.message}</p>`;
    }

    messageElement.innerHTML = `
        <strong>${senderName}</strong>
        ${contentHTML}
        <small>${new Date(message.timestamp?.toDate()).toLocaleTimeString()}</small>
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
    if (!text) { // Agora exige apenas texto
        showMessage(chatMessageDiv, "Digite uma mensagem.", 'error');
        return;
    }

    try {
        // Obter nome de usuário do remetente
        const senderDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let senderUsername = user.email; // Valor padrão
        senderDocSnapshot.forEach((doc) => {
            senderUsername = doc.data().username || user.email;
        });

        await setDoc(doc(collection(db, "privateChats"), Date.now().toString() + "_" + user.uid), {
            senderId: user.uid,
            senderUsername: senderUsername,
            recipientId: recipientId,
            message: text, // Apenas o texto
            type: 'text', // O tipo é sempre texto agora
            timestamp: serverTimestamp()
        });

        showMessage(chatMessageDiv, "Mensagem enviada!");
        chatMessageInput.value = '';

        // NOVO: Adicionar notificação de chat para o destinatário
        // Precisamos obter o username do destinatário para a mensagem da notificação
        const recipientUserDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", recipientId)));
        let recipientUsername = recipientId; // Padrão caso não encontre
        if (!recipientUserDoc.empty) {
            recipientUsername = recipientUserDoc.docs[0].data().username || recipientId;
        }
        addNotification(recipientId, user.uid, senderUsername, 'chat_message', `enviou uma mensagem: "${text.substring(0, 30)}..."`);


    } catch (error) {
        showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
        console.error("Erro ao enviar mensagem de chat:", error);
    }
});

// --- NOVO: Funções de Notificação ---

// Função para adicionar uma notificação ao Firestore
async function addNotification(recipientId, senderId, senderUsername, type, message, relatedPostId = null) {
    try {
        await addDoc(collection(db, "notifications"), {
            recipientId: recipientId,
            senderId: senderId,
            senderUsername: senderUsername,
            type: type, // 'like', 'comment', 'chat_message'
            message: message, // Ex: "curtiu seu post", "comentou em seu post", "enviou uma mensagem"
            relatedPostId: relatedPostId, // ID do post, se aplicável
            timestamp: serverTimestamp(),
            read: false // Por padrão, a notificação é não lida
        });
    } catch (error) {
        console.error("Erro ao adicionar notificação:", error);
    }
}

// Listener de notificações em tempo real para o contador
let unsubscribeNotifications = null; // Para guardar a função de desinscrição

function setupNotificationListener(userId) {
    // Se já houver um listener ativo, desinscreve primeiro
    if (unsubscribeNotifications) {
        unsubscribeNotifications();
    }

    const q = query(collection(db, "notifications"),
        where("recipientId", "==", userId),
        where("read", "==", false)
    );

    unsubscribeNotifications = onSnapshot(q, (snapshot) => {
        notificationCountSpan.textContent = snapshot.size; // Atualiza o contador de não lidas
        if (snapshot.size > 0) {
            notificationCountSpan.style.display = 'inline-block'; // Mostra o contador
        } else {
            notificationCountSpan.style.display = 'none'; // Esconde se não houver notificações
        }
    }, (error) => {
        console.error("Erro ao ouvir notificações:", error);
    });
}

// Carregar e exibir todas as notificações (lidas e não lidas)
async function loadNotifications() {
    const user = auth.currentUser;
    if (!user) {
        showMessage(notificationsSection, "Você precisa estar logado para ver as notificações.", 'error');
        return;
    }

    notificationsList.innerHTML = ''; // Limpa a lista existente

    const q = query(collection(db, "notifications"),
        where("recipientId", "==", user.uid),
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, async (snapshot) => {
        notificationsList.innerHTML = ''; // Limpa novamente para evitar duplicatas em atualizações
        const unreadNotificationIds = []; // Coleta IDs de não lidas para marcar como lidas

        snapshot.forEach((doc) => {
            const notification = doc.data();
            const notificationId = doc.id;

            const notificationElement = document.createElement('div');
            notificationElement.classList.add('notification-item');
            if (!notification.read) {
                notificationElement.classList.add('unread');
                unreadNotificationIds.push(notificationId); // Adiciona para marcar como lida
            }

            let displayMessage = `${notification.senderUsername} ${notification.message}`;
            if (notification.type === 'like' || notification.type === 'comment') {
                displayMessage += ` (Post ID: ${notification.relatedPostId ? notification.relatedPostId.substring(0, 5) + '...' : 'N/A'})`; // Exibe parte do ID do post
            }

            notificationElement.innerHTML = `
                <p>${displayMessage}</p>
                <small>${notification.timestamp ? new Date(notification.timestamp.toDate()).toLocaleString() : 'Carregando...'}</small>
            `;
            notificationsList.appendChild(notificationElement);

            // Opcional: Marcar como lida ao clicar na notificação (ou em um botão específico)
            notificationElement.addEventListener('click', async () => {
                if (!notification.read) {
                    await markNotificationAsRead(notificationId);
                }
                // Poderíamos adicionar lógica para navegar para o post/chat relacionado aqui
            });
        });

        // Marca todas as notificações exibidas como lidas
        if (unreadNotificationIds.length > 0) {
            for (const id of unreadNotificationIds) {
                await markNotificationAsRead(id);
            }
        }
    }, (error) => {
        console.error("Erro ao carregar notificações:", error);
        showMessage(notificationsSection, "Erro ao carregar notificações.", 'error');
    });
}

// Função para marcar uma notificação como lida
async function markNotificationAsRead(notificationId) {
    try {
        const notificationRef = doc(db, "notifications", notificationId);
        await updateDoc(notificationRef, {
            read: true
        });
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
    }
}

// Initial state on load
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChanged will handle the initial display logic and notification listener setup
});
