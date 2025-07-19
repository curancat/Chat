// --- Configuração do Firebase ---
// Importa as funções específicas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where, updateDoc, arrayUnion, arrayRemove, increment, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
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
const openNotificationsBtn = document.getElementById("openNotificationsBtn");
const notificationCountSpan = document.getElementById("notificationCount");

const loginFormContainer = document.getElementById("loginFormContainer");
const registerFormContainer = document.getElementById("registerFormContainer");
const createPostSection = document.getElementById("createPostSection");
const chatSection = document.getElementById("chatSection");
const feedSection = document.getElementById("feedSection");
const notificationsSection = document.getElementById("notificationsSection");
const postsContainer = document.getElementById("postsContainer");
const notificationsList = document.getElementById("notificationsList"); // Esta agora será o "feed de novidades"


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
    notificationsSection.classList.remove('active');
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
        setupNewActivityListener(auth.currentUser.uid); // NOVO: Inicia o listener de novidades
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        viewFeedBtn.style.display = 'none';
        createPostBtn.style.display = 'none';
        openChatBtn.style.display = 'none';
        openNotificationsBtn.style.display = 'none';
        notificationCountSpan.textContent = '0';
        notificationCountSpan.style.display = 'none'; // Esconde o contador
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
    loadPosts();
});

// NOVO: Event Listener para o botão de Novidades
openNotificationsBtn.addEventListener('click', () => {
    hideAllForms();
    notificationsSection.classList.add('active');
    loadNewActivityFeed(); // Carrega o feed de novidades
    markLastViewedAsCurrent(); // Marca o momento atual como a última vez que o usuário viu as novidades
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
            // Cria o documento do usuário e adiciona o campo lastViewedActivities
            return setDoc(doc(db, "users", cred.user.uid), {
                username,
                email,
                lastViewedActivities: serverTimestamp() // Adiciona um timestamp inicial
            });
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
            !feedSection.classList.contains('active') && !notificationsSection.classList.contains('active')) {
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
            await updateDoc(postRef, {
                likesCount: increment(-1),
                likedBy: arrayRemove(userId)
            });
            showMessage(postMessage, "Você descurtiu o post.");
        } else {
            await updateDoc(postRef, {
                likesCount: increment(1),
                likedBy: arrayUnion(userId)
            });
            showMessage(postMessage, "Você curtiu o post!");
            // Notificação de curtida não é mais usada aqui, pois será um feed de novidades gerais
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
        // Notificação de comentário não é mais usada aqui
    } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
        showMessage(postMessage, "Erro ao adicionar comentário.", 'error');
    }
}

// Função para carregar e exibir comentários
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
        // showMessage(commentsListElement, "Erro ao carregar comentários.", 'error'); // Remover se não for necessário
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
                    toggleLike(postId, currentLikes, likedBy);
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
        // Notificação de chat não é mais usada aqui
    } catch (error) {
        showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
        console.error("Erro ao enviar mensagem de chat:", error);
    }
});

// --- NOVO: Funções de Feed de Novidades ---

let unsubscribeNewActivity = null; // Para guardar a função de desinscrição do feed de novidades

// Listener de novidades em tempo real para o contador
async function setupNewActivityListener(userId) {
    if (unsubscribeNewActivity) {
        unsubscribeNewActivity();
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    let lastViewedActivities = userDoc.exists() ? userDoc.data().lastViewedActivities : null;

    if (!lastViewedActivities) {
        // Se o usuário nunca viu as novidades, defina um timestamp inicial
        await updateDoc(userRef, { lastViewedActivities: serverTimestamp() });
        lastViewedActivities = new Date(); // Use a data atual localmente para o primeiro cálculo
    } else if (lastViewedActivities.toDate) {
        lastViewedActivities = lastViewedActivities.toDate(); // Converte Timestamp do Firestore para Date
    }

    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

    unsubscribeNewActivity = onSnapshot(q, (snapshot) => {
        let newPostsCount = 0;
        snapshot.forEach((postDoc) => {
            const postTimestamp = postDoc.data().timestamp ? postDoc.data().timestamp.toDate() : new Date();
            if (postTimestamp > lastViewedActivities) {
                newPostsCount++;
            }
        });

        notificationCountSpan.textContent = newPostsCount;
        if (newPostsCount > 0) {
            notificationCountSpan.style.display = 'inline-block';
        } else {
            notificationCountSpan.style.display = 'none';
        }
    }, (error) => {
        console.error("Erro ao ouvir por novas atividades:", error);
        notificationCountSpan.textContent = '0';
        notificationCountSpan.style.display = 'none';
    });
}

// Carrega o feed de novidades (posts mais recentes)
async function loadNewActivityFeed() {
    notificationsList.innerHTML = ''; // Limpa a lista existente
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(20)); // Limita a 20 posts mais recentes

    onSnapshot(q, (snapshot) => {
        notificationsList.innerHTML = ''; // Limpa novamente para evitar duplicatas em atualizações
        if (snapshot.empty) {
            const noActivityMessage = document.createElement('p');
            noActivityMessage.textContent = "Nenhuma novidade ainda.";
            notificationsList.appendChild(noActivityMessage);
            return;
        }

        snapshot.forEach((postDoc) => {
            const post = postDoc.data();
            const postElement = document.createElement('div');
            postElement.classList.add('post-card'); // Reutiliza o estilo de post-card
            postElement.innerHTML = `
                <h3>${post.username || post.userId}</h3>
                <p>${post.content}</p>
                <small>${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Carregando...'}</small>
                `;
            notificationsList.appendChild(postElement);
        });
    }, (error) => {
        console.error("Erro ao carregar feed de novidades:", error);
        const errorMessage = document.createElement('p');
        errorMessage.style.color = 'red';
        errorMessage.textContent = "Erro ao carregar feed de novidades.";
        notificationsList.appendChild(errorMessage);
    });
}

// Marca o momento atual como a última vez que o usuário visualizou as novidades
async function markLastViewedAsCurrent() {
    const user = auth.currentUser;
    if (user) {
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                lastViewedActivities: serverTimestamp()
            });
            // O listener de novidades (setupNewActivityListener) vai reagir a essa mudança e zerar o contador
        } catch (error) {
            console.error("Erro ao marcar atividades como vistas:", error);
        }
    }
}


// Initial state on load
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChanged will handle the initial display logic and notification listener setup
});
