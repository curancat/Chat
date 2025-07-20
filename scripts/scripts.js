// --- Configuração do Firebase ---
// Importa as funções específicas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
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
const analytics = getAnalytics(app);
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
const chatMessageDiv = document.getElementById("chatMessage");
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

// --- Utilitários ---

// Todas as seções que podem ser ativadas/desativadas
const allSections = [
    loginFormContainer,
    registerFormContainer,
    createPostSection,
    chatSection,
    feedSection,
    notificationsSection
];

// Função para esconder todas as seções
function hideAllForms() {
    allSections.forEach(section => {
        section.classList.remove('active');
    });
}

// Função para mostrar uma seção específica
function showSection(sectionElement) {
    hideAllForms(); // Esconde tudo primeiro
    sectionElement.classList.add('active'); // Depois mostra o que foi pedido
}

function showMessage(element, msg, type = 'success') {
    element.textContent = msg;
    element.style.color = type === 'success' ? 'green' : 'red';
    element.style.display = 'block'; // Garante que a mensagem é visível
    setTimeout(() => {
        element.textContent = '';
        element.style.display = 'none';
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
        setupNotificationListener(auth.currentUser.uid);
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        viewFeedBtn.style.display = 'none';
        createPostBtn.style.display = 'none';
        openChatBtn.style.display = 'none';
        openNotificationsBtn.style.display = 'none';
        notificationCountSpan.textContent = '0';
    }
}

// --- Event Listeners dos Botões de Navegação ---
loginBtn.addEventListener('click', () => {
    showSection(loginFormContainer);
});

registerBtn.addEventListener('click', () => {
    showSection(registerFormContainer);
});

createPostBtn.addEventListener('click', () => {
    showSection(createPostSection);
});

openChatBtn.addEventListener('click', () => {
    showSection(chatSection);
    loadChatUsers();
});

viewFeedBtn.addEventListener('click', () => {
    showSection(feedSection);
    loadPosts();
});

openNotificationsBtn.addEventListener('click', () => {
    showSection(notificationsSection);
    loadNotifications();
});


// --- Autenticação ---
loginSubmit.addEventListener("click", () => {
    const email = loginEmail.value;
    const password = loginPassword.value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            showMessage(loginMessage, "Login bem-sucedido!");
            showSection(feedSection); // Mostra o feed após o login
            loadPosts(); // Carrega posts no feed
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
            showSection(loginFormContainer); // Volta para o login após o cadastro
        })
        .catch(error => showMessage(registerMessage, error.message, 'error'));
});

// Logout
logoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            showMessage(loginMessage, "Logout bem-sucedido!");
            showSection(loginFormContainer); // Volta para o login após o logout
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
        const currentActiveSection = allSections.find(section => section.classList.contains('active'));
        if (!currentActiveSection || currentActiveSection === loginFormContainer || currentActiveSection === registerFormContainer) {
            showSection(feedSection);
            loadPosts();
        }
    } else {
        console.log("Nenhum usuário logado.");
        const currentActiveSection = allSections.find(section => section.classList.contains('active'));
        if (!currentActiveSection || (currentActiveSection !== registerFormContainer && currentActiveSection !== loginFormContainer)) {
             showSection(loginFormContainer);
        }
    }
});


// --- Publicar Post (SOMENTE TEXTO) ---
publishPostBtn.addEventListener("click", async () => {
    const content = postContent.value;
    const user = auth.currentUser;

    if (!user || !content.trim()) {
        showMessage(postMessage, "Preencha o conteúdo do post e esteja logado.", 'error');
        return;
    }

    const postDocRef = doc(collection(db, "posts"));

    try {
        const userDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let username = user.email;
        userDocSnapshot.forEach((doc) => {
            username = doc.data().username || user.email;
        });

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
        if (likedByUserIds.includes(userId)) {
            await updateDoc(postRef, {
                likesCount: increment(-1),
                likedBy: arrayRemove(userId)
            });
            showMessage(postMessage, "Você descurtiu o post.");
            if (likeButtonElement) {
                likeButtonElement.classList.remove('liked');
                likeButtonElement.innerHTML = `❤️ ${currentLikesCount - 1}`;
                likeButtonElement.dataset.likesCount = currentLikesCount - 1;
            }
        } else {
            await updateDoc(postRef, {
                likesCount: increment(1),
                likedBy: arrayUnion(userId)
            });
            showMessage(postMessage, "Você curtiu o post!");
            if (likeButtonElement) {
                likeButtonElement.classList.add('liked');
                likeButtonElement.innerHTML = `❤️ ${currentLikesCount + 1}`;
                likeButtonElement.dataset.likesCount = currentLikesCount + 1;
            }

            // CORREÇÃO: Obtenção correta do post para notificação
            const postDocSnapshot = await getDoc(doc(db, "posts", postId));
            if (postDocSnapshot.exists()) {
                const postData = postDocSnapshot.data();
                const postOwnerId = postData.userId;
                // Obter o username do remetente da notificação (o usuário que curtiu)
                const currentUserDoc = await getDoc(doc(db, "users", user.uid));
                let currentUserUsername = user.email;
                if (currentUserDoc.exists()) {
                     currentUserUsername = currentUserDoc.data().username || user.email;
                }

                if (postOwnerId !== user.uid) {
                    addNotification(postOwnerId, user.uid, currentUserUsername, 'like', `curtiu seu post: "${postData.content.substring(0, 30)}..."`, postId);
                }
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
    if (!user || !commentText.trim()) {
        showMessage(postMessage, "Você precisa estar logado e digitar um comentário.", 'error');
        return;
    }

    try {
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

        // CORREÇÃO: Obtenção correta do post para notificação de comentário
        const postDocSnapshot = await getDoc(doc(db, "posts", postId));
        if (postDocSnapshot.exists()) {
            const postData = postDocSnapshot.data();
            const postOwnerId = postData.userId;
            if (postOwnerId !== user.uid) {
                addNotification(postOwnerId, user.uid, username, 'comment', `comentou em seu post: "${commentText.substring(0, 30)}..."`, postId);
            }
        }

    } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
        showMessage(postMessage, "Erro ao adicionar comentário.", 'error');
    }
}

function loadComments(postId, commentsListElement) {
    const commentsCollectionRef = collection(db, "posts", postId, "comments");
    const q = query(commentsCollectionRef, orderBy("timestamp", "asc"));

    onSnapshot(q, (snapshot) => {
        commentsListElement.innerHTML = '';
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
            const postId = doc.id;
            const currentUser = auth.currentUser;
            const likedBy = post.likedBy || [];
            const isLiked = currentUser ? likedBy.includes(currentUser.uid) : false;

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

            const likeButton = postElement.querySelector(`.like-button[data-post-id="${postId}"]`);
            if (likeButton) {
                likeButton.addEventListener('click', () => {
                    const currentLikes = parseInt(likeButton.dataset.likesCount);
                    toggleLike(postId, currentLikes, likedBy, likeButton);
                });
            }

            const commentToggleButton = postElement.querySelector(`.comment-toggle-button[data-post-id="${postId}"]`);
            const postCommentsSection = postElement.querySelector(`.post-comments[data-post-id="${postId}"]`);
            const commentsListElement = postCommentsSection.querySelector('.comments-list');

            if (commentToggleButton && postCommentsSection) {
                commentToggleButton.addEventListener('click', () => {
                    if (postCommentsSection.style.display === 'none') {
                        postCommentsSection.style.display = 'block';
                        loadComments(postId, commentsListElement);
                    } else {
                        postCommentsSection.style.display = 'none';
                    }
                });
            }

            const submitCommentButton = postCommentsSection.querySelector('.submit-comment-button');
            const commentInput = postCommentsSection.querySelector('.comment-input');

            if (submitCommentButton && commentInput) {
                submitCommentButton.addEventListener('click', async () => {
                    const commentText = commentInput.value.trim();
                    if (commentText) {
                        await addComment(postId, commentText);
                        commentInput.value = '';
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
    if (!text) {
        showMessage(chatMessageDiv, "Digite uma mensagem.", 'error');
        return;
    }

    try {
        const senderDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let senderUsername = user.email;
        senderDocSnapshot.forEach((doc) => {
            senderUsername = doc.data().username || user.email;
        });

        await setDoc(doc(collection(db, "privateChats"), Date.now().toString() + "_" + user.uid), {
            senderId: user.uid,
            senderUsername: senderUsername,
            recipientId: recipientId,
            message: text,
            type: 'text',
            timestamp: serverTimestamp()
        });

        showMessage(chatMessageDiv, "Mensagem enviada!");
        chatMessageInput.value = '';

        // CORREÇÃO: Obtenção correta do destinatário para notificação de chat
        const recipientUserDoc = await getDoc(doc(db, "users", recipientId));
        let recipientUsername = recipientId;
        if (recipientUserDoc.exists()) {
            recipientUsername = recipientUserDoc.data().username || recipientId;
        }
        addNotification(recipientId, user.uid, senderUsername, 'chat_message', `enviou uma mensagem: "${text.substring(0, 30)}..."`);


    } catch (error) {
        showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
        console.error("Erro ao enviar mensagem de chat:", error);
    }
});

// --- NOVO: Funções de Notificação ---

async function addNotification(recipientId, senderId, senderUsername, type, message, relatedPostId = null) {
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

let unsubscribeNotifications = null;

function setupNotificationListener(userId) {
    if (unsubscribeNotifications) {
        unsubscribeNotifications();
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
    }, (error) => {
        console.error("Erro ao ouvir notificações:", error);
    });
}

async function loadNotifications() {
    const user = auth.currentUser;
    if (!user) {
        showMessage(notificationsSection, "Você precisa estar logado para ver as notificações.", 'error');
        return;
    }

    notificationsList.innerHTML = '';

    const q = query(collection(db, "notifications"),
        where("recipientId", "==", user.uid),
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, async (snapshot) => {
        notificationsList.innerHTML = '';
        const unreadNotificationIds = [];

        snapshot.forEach((doc) => {
            const notification = doc.data();
            const notificationId = doc.id;

            const notificationElement = document.createElement('div');
            notificationElement.classList.add('notification-item');
            if (!notification.read) {
                notificationElement.classList.add('unread');
                unreadNotificationIds.push(notificationId);
            }

            let displayMessage = `${notification.senderUsername} ${notification.message}`;
            if (notification.type === 'like' || notification.type === 'comment') {
                displayMessage += ` (Post ID: ${notification.relatedPostId ? notification.relatedPostId.substring(0, 5) + '...' : 'N/A'})`;
            }

            notificationElement.innerHTML = `
                <p>${displayMessage}</p>
                <small>${notification.timestamp ? new Date(notification.timestamp.toDate()).toLocaleString() : 'Carregando...'}</small>
            `;
            notificationsList.appendChild(notificationElement);

            notificationElement.addEventListener('click', async () => {
                if (!notification.read) {
                    await markNotificationAsRead(notificationId);
                }
            });
        });

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

// Inicialização: Ao carregar a página, se não houver um usuário logado, mostra o formulário de login.
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.currentUser) {
        showSection(loginFormContainer);
    }
});
