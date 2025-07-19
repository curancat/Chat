// --- Configuração do Firebase ---
// Importa as funções específicas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where, updateDoc, arrayUnion, arrayRemove, increment, addDoc, getDoc, limit } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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
// Garante que os elementos existem antes de tentar selecioná-los
const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Elemento com ID '${id}' não encontrado no DOM.`);
    }
    return element;
};

const loginEmail = getElement("loginEmail");
const loginPassword = getElement("loginPassword");
const loginSubmit = getElement("loginSubmit");
const loginMessage = getElement("loginMessage");

const registerUsername = getElement("registerUsername");
const registerEmail = getElement("registerEmail");
const registerPassword = getElement("registerPassword");
const registerSubmit = getElement("registerSubmit");
const registerMessage = getElement("registerMessage");

const publishPostBtn = getElement("publishPostBtn");
const postContent = getElement("postContent");
const postMessage = getElement("postMessage");

const chatSendMessageBtn = getElement("chatSendMessageBtn");
const chatMessageInput = getElement("chatMessageInput");
const chatMessageDiv = getElement("chatMessage"); // General message div for chat
const chatMessagesDisplay = getElement("chatMessagesDisplay");
const chatRecipientSelect = getElement("chatRecipientSelect");

const logoutBtn = getElement("logoutBtn");
const loginBtn = getElement("loginBtn");
const registerBtn = getElement("registerBtn");
const viewFeedBtn = getElement("viewFeedBtn");
const createPostBtn = getElement("createPostBtn");
const openChatBtn = getElement("openChatBtn");
const openNotificationsBtn = getElement("openNotificationsBtn");
const notificationCountSpan = getElement("notificationCount");

const loginFormContainer = getElement("loginFormContainer");
const registerFormContainer = getElement("registerFormContainer");
const createPostSection = getElement("createPostSection");
const chatSection = getElement("chatSection");
const feedSection = getElement("feedSection");
const notificationsSection = getElement("notificationsSection");
const postsContainer = getElement("postsContainer");
const notificationsList = getElement("notificationsList");


// --- Utilitários ---
function showMessage(element, msg, type = 'success') {
    if (!element) return; // Garante que o elemento existe
    element.textContent = msg;
    element.style.color = type === 'success' ? 'green' : 'red';
    element.style.display = 'block'; // Garante que a mensagem é visível
    setTimeout(() => {
        if (element) { // Verifica novamente antes de limpar
            element.textContent = '';
            element.style.display = 'none';
        }
    }, 4000);
}

function hideAllForms() {
    [loginFormContainer, registerFormContainer, createPostSection, chatSection, feedSection, notificationsSection].forEach(el => {
        if (el) el.classList.remove('active');
    });
}

function updateNavButtons(isLoggedIn) {
    if (isLoggedIn) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (viewFeedBtn) viewFeedBtn.style.display = 'block';
        if (createPostBtn) createPostBtn.style.display = 'block';
        if (openChatBtn) openChatBtn.style.display = 'block';
        if (openNotificationsBtn) openNotificationsBtn.style.display = 'block';
        // Removido setupNewActivityListener aqui
        if (notificationCountSpan) {
            notificationCountSpan.textContent = '0'; // Zera o contador
            notificationCountSpan.style.display = 'none'; // Esconde o contador
        }
        if (openNotificationsBtn) openNotificationsBtn.classList.remove('new-activity-alert'); // Remove o alerta visual
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (viewFeedBtn) viewFeedBtn.style.display = 'none';
        if (createPostBtn) createPostBtn.style.display = 'none';
        if (openChatBtn) openChatBtn.style.display = 'none';
        if (openNotificationsBtn) openNotificationsBtn.style.display = 'none';
        if (notificationCountSpan) {
            notificationCountSpan.textContent = '0';
            notificationCountSpan.style.display = 'none';
        }
    }
}

if (loginBtn) loginBtn.addEventListener('click', () => {
    hideAllForms();
    if (loginFormContainer) loginFormContainer.classList.add('active');
});

if (registerBtn) registerBtn.addEventListener('click', () => {
    hideAllForms();
    if (registerFormContainer) registerFormContainer.classList.add('active');
});

if (createPostBtn) createPostBtn.addEventListener('click', () => {
    hideAllForms();
    if (createPostSection) createPostSection.classList.add('active');
});

if (openChatBtn) openChatBtn.addEventListener('click', () => {
    hideAllForms();
    if (chatSection) chatSection.classList.add('active');
    loadChatUsers();
});

if (viewFeedBtn) viewFeedBtn.addEventListener('click', () => {
    hideAllForms();
    if (feedSection) feedSection.classList.add('active');
    loadPosts();
});

// Listener simplificado para o botão de Notificações
if (openNotificationsBtn) openNotificationsBtn.addEventListener('click', () => {
    hideAllForms();
    if (notificationsSection) notificationsSection.classList.add('active');
    if (notificationsList) {
        notificationsList.innerHTML = '<p>As notificações estão temporariamente desativadas.</p>';
    }
    if (notificationCountSpan) notificationCountSpan.textContent = '0'; // Zera o contador ao abrir
    if (openNotificationsBtn) openNotificationsBtn.classList.remove('new-activity-alert'); // Remove o alerta visual
});


// --- Autenticação ---
if (loginSubmit) loginSubmit.addEventListener("click", () => {
    const email = loginEmail ? loginEmail.value : '';
    const password = loginPassword ? loginPassword.value : '';

    if (!loginMessage) return;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            showMessage(loginMessage, "Login bem-sucedido!");
            hideAllForms();
            if (feedSection) feedSection.classList.add('active');
        })
        .catch(error => showMessage(loginMessage, error.message, 'error'));
});

if (registerSubmit) registerSubmit.addEventListener("click", () => {
    const email = registerEmail ? registerEmail.value : '';
    const password = registerPassword ? registerPassword.value : '';
    const username = registerUsername ? registerUsername.value : '';

    if (!registerMessage) return;

    createUserWithEmailAndPassword(auth, email, password)
        .then(cred => {
            return setDoc(doc(db, "users", cred.user.uid), {
                username,
                email,
                // Removido lastViewedActivities para simplificar
            }, { merge: true });
        })
        .then(() => {
            showMessage(registerMessage, "Cadastro realizado com sucesso!");
            hideAllForms();
            if (loginFormContainer) loginFormContainer.classList.add('active');
        })
        .catch(error => showMessage(registerMessage, error.message, 'error'));
});

// Logout
if (logoutBtn) logoutBtn.addEventListener("click", () => {
    if (!loginMessage) return;
    signOut(auth)
        .then(() => {
            showMessage(loginMessage, "Logout bem-sucedido!");
            hideAllForms();
            if (loginFormContainer) loginFormContainer.classList.add('active');
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
        const anyFormActive = [loginFormContainer, registerFormContainer, createPostSection, chatSection, feedSection, notificationsSection].some(el => el && el.classList.contains('active'));
        if (!anyFormActive) {
            hideAllForms();
            if (feedSection) {
                feedSection.classList.add('active');
                loadPosts();
            }
        }
    } else {
        console.log("Nenhum usuário logado.");
        hideAllForms();
        if (loginFormContainer) loginFormContainer.classList.add('active');
    }
});


// --- Publicar Post (SOMENTE TEXTO) ---
if (publishPostBtn) publishPostBtn.addEventListener("click", async () => {
    const content = postContent ? postContent.value : '';
    const user = auth.currentUser;

    if (!user || !content.trim()) {
        if (postMessage) showMessage(postMessage, "Preencha o conteúdo do post e esteja logado.", 'error');
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

        if (postContent) postContent.value = '';
        if (postMessage) showMessage(postMessage, "Post publicado com sucesso!");
    } catch (error) {
        if (postMessage) showMessage(postMessage, "Erro ao publicar post.", 'error');
        console.error("Erro ao publicar post:", error);
    }
});

// --- Função para Curtir/Descurtir um Post ---
async function toggleLike(postId, currentLikesCount, likedByUserIds) {
    const user = auth.currentUser;
    if (!user) {
        if (postMessage) showMessage(postMessage, "Você precisa estar logado para curtir posts.", 'error');
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
            if (postMessage) showMessage(postMessage, "Você descurtiu o post.");
        } else {
            await updateDoc(postRef, {
                likesCount: increment(1),
                likedBy: arrayUnion(userId)
            });
            if (postMessage) showMessage(postMessage, "Você curtiu o post!");
        }
    } catch (error) {
        console.error("Erro ao curtir/descurtir o post:", error);
        if (postMessage) showMessage(postMessage, "Erro ao processar sua curtida.", 'error');
    }
}

// --- Funções de Comentário ---

// Função para adicionar um comentário
async function addComment(postId, commentText) {
    const user = auth.currentUser;
    if (!user || !commentText.trim()) {
        if (postMessage) showMessage(postMessage, "Você precisa estar logado e digitar um comentário.", 'error');
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
        if (postMessage) showMessage(postMessage, "Comentário adicionado com sucesso!");
    } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
        if (postMessage) showMessage(postMessage, "Erro ao adicionar comentário.", 'error');
    }
}

// Função para carregar e exibir comentários
function loadComments(postId, commentsListElement) {
    if (!commentsListElement) return;

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
    });
}


// --- Carregar Posts (Feed) ---
function loadPosts() {
    if (!postsContainer) return;
    postsContainer.innerHTML = '';

    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        if (!postsContainer) return;
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
                    toggleLike(postId, currentLikes, likedBy);
                });
            }

            const commentToggleButton = postElement.querySelector(`.comment-toggle-button[data-post-id="${postId}"]`);
            const postCommentsSection = postElement.querySelector(`.post-comments[data-post-id="${postId}"]`);
            const commentsListElement = postCommentsSection ? postCommentsSection.querySelector('.comments-list') : null;

            if (commentToggleButton && postCommentsSection) {
                commentToggleButton.addEventListener('click', () => {
                    if (postCommentsSection.style.display === 'none') {
                        postCommentsSection.style.display = 'block';
                        if (commentsListElement) loadComments(postId, commentsListElement);
                    } else {
                        postCommentsSection.style.display = 'none';
                    }
                });
            }

            const submitCommentButton = postCommentsSection ? postCommentsSection.querySelector('.submit-comment-button') : null;
            const commentInput = postCommentsSection ? postCommentsSection.querySelector('.comment-input') : null;

            if (submitCommentButton && commentInput) {
                submitCommentButton.addEventListener('click', async () => {
                    const commentText = commentInput.value.trim();
                    if (commentText) {
                        await addComment(postId, commentText);
                        commentInput.value = '';
                    } else {
                        if (postMessage) showMessage(postMessage, "Por favor, digite um comentário.", 'warning');
                    }
                });
            }
        });
    }, (error) => {
        console.error("Error fetching posts:", error);
        if (postsContainer) showMessage(postsContainer, "Erro ao carregar posts.", 'error');
    });
}


// --- Chat Privado ---
let currentChatRecipientId = null;
let unsubscribeChatMessages = null;

async function loadChatUsers() {
    if (!chatRecipientSelect) return;
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
            if (chatMessagesDisplay) chatMessagesDisplay.innerHTML = '';
            if (currentChatRecipientId) {
                if (unsubscribeChatMessages) {
                    unsubscribeChatMessages();
                }
                unsubscribeChatMessages = listenForChatMessages(currentUser.uid, currentChatRecipientId);
            }
        });
        chatRecipientSelect.dataset.listenerAdded = true;
    }
}

function listenForChatMessages(user1Id, user2Id) {
    if (!chatMessagesDisplay) {
        console.error("chatMessagesDisplay não encontrado, não é possível configurar o listener de chat.");
        return null;
    }

    const chatCollectionRef = collection(db, "privateChats");

    const q1 = query(chatCollectionRef,
        where("senderId", "==", user1),
        where("recipientId", "==", user2Id),
        orderBy("timestamp", "asc")
    );
    const q2 = query(chatCollectionRef,
        where("senderId", "==", user2Id),
        where("recipientId", "==", user1Id),
        orderBy("timestamp", "asc")
    );

    // Usa Promise.all para combinar os snapshots de ambos os queries
    const combinedUnsubscribe = onSnapshot(query(collection(db, "privateChats")), async (overallSnapshot) => {
        const allMessages = [];
        const messagesFromQ1 = overallSnapshot.docs.filter(doc => {
            const data = doc.data();
            return (data.senderId === user1Id && data.recipientId === user2Id);
        });
        const messagesFromQ2 = overallSnapshot.docs.filter(doc => {
            const data = doc.data();
            return (data.senderId === user2Id && data.recipientId === user1Id);
        });

        messagesFromQ1.forEach(doc => allMessages.push(doc.data()));
        messagesFromQ2.forEach(doc => allMessages.push(doc.data()));

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
    }, (error) => {
        console.error("Erro ao ouvir por mensagens de chat:", error);
        if (chatMessagesDisplay) chatMessagesDisplay.innerHTML = '<p style="color:red;">Erro ao carregar mensagens do chat.</p>';
    });

    return combinedUnsubscribe;
}


function displayChatMessage(message) {
    if (!chatMessagesDisplay) return;

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
if (chatSendMessageBtn) chatSendMessageBtn.addEventListener("click", async () => {
    const text = chatMessageInput ? chatMessageInput.value.trim() : '';
    const user = auth.currentUser;
    const recipientId = chatRecipientSelect ? chatRecipientSelect.value : '';

    if (!user) {
        if (chatMessageDiv) showMessage(chatMessageDiv, "Você precisa estar logado para enviar mensagens.", 'error');
        return;
    }
    if (!recipientId) {
        if (chatMessageDiv) showMessage(chatMessageDiv, "Selecione um destinatário para o chat.", 'error');
        return;
    }
    if (!text) {
        if (chatMessageDiv) showMessage(chatMessageDiv, "Digite uma mensagem.", 'error');
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

        if (chatMessageDiv) showMessage(chatMessageDiv, "Mensagem enviada!");
        if (chatMessageInput) chatMessageInput.value = '';
    } catch (error) {
        if (chatMessageDiv) showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
        console.error("Erro ao enviar mensagem de chat:", error);
    }
});

// REMOVIDAS FUNÇÕES DE FEED DE NOVIDADES E MARCAÇÃO DE ATIVIDADE.
// A seção de notificações agora é um placeholder simples.

// Initial state on load
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChanged will handle the initial display logic and notification listener setup
});
