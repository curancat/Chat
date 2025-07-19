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
        if (auth.currentUser) setupNewActivityListener(auth.currentUser.uid);
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

if (openNotificationsBtn) openNotificationsBtn.addEventListener('click', () => {
    hideAllForms();
    if (notificationsSection) notificationsSection.classList.add('active');
    loadNewActivityFeed();
    markLastViewedAsCurrent();
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
                lastViewedActivities: serverTimestamp()
            }, { merge: true }); // Use merge para não sobrescrever se o doc já existir
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
        // Garante que uma seção é mostrada se o usuário já estiver logado
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
    postsContainer.innerHTML = ''; // Limpa antes de carregar

    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        if (!postsContainer) return; // Verifica novamente caso o elemento tenha sido removido
        postsContainer.innerHTML = ''; // Limpa novamente para atualizações em tempo real
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
    if (!chatMessagesDisplay) return null; // Retorna null se o elemento não existir

    const chatCollectionRef = collection(db, "privateChats");

    const q1 = query(chatCollectionRef,
        where("senderId", "==", user1Id),
        where("recipientId", "==", user2Id),
        orderBy("timestamp", "asc")
    );
    const q2 = query(chatCollectionRef,
        where("senderId", "==", user2Id),
        where("recipientId", "==", user1Id),
        orderBy("timestamp", "asc")
    );

    const unsubscribe1 = onSnapshot(q1, (snapshot1) => {
        const unsubscribe2 = onSnapshot(q2, (snapshot2) => {
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
        return unsubscribe2;
    });
    return unsubscribe1;
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

// --- Funções de Feed de Novidades ---

let unsubscribeNewActivity = null;

async function setupNewActivityListener(userId) {
    if (unsubscribeNewActivity) {
        unsubscribeNewActivity();
    }
    if (!notificationCountSpan || !openNotificationsBtn) return;

    const userRef = doc(db, "users", userId);
    let lastViewedActivities = new Date(0); // Padrão para pegar tudo se não encontrar

    try {
        const userDocSnap = await getDoc(userRef);
        if (userDocSnap.exists() && userDocSnap.data().lastViewedActivities) {
            lastViewedActivities = userDocSnap.data().lastViewedActivities.toDate();
        } else {
            // Se o documento do usuário não tiver lastViewedActivities, defina um inicial
            await setDoc(userRef, { lastViewedActivities: serverTimestamp() }, { merge: true });
            lastViewedActivities = new Date(); // Para o cálculo imediato
        }
    } catch (error) {
        console.error("Erro ao obter lastViewedActivities do usuário:", error);
        // Continua com lastViewedActivities como new Date(0)
    }

    const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const messagesQuery = query(collection(db, "privateChats"),
        where("recipientId", "==", userId),
        orderBy("timestamp", "desc")
    );

    const unsubscribePosts = onSnapshot(postsQuery, (postsSnapshot) => {
        const unsubscribeMessages = onSnapshot(messagesQuery, (messagesSnapshot) => {
            let newPostsCount = 0;
            postsSnapshot.forEach((postDoc) => {
                const postTimestamp = postDoc.data().timestamp ? postDoc.data().timestamp.toDate() : new Date();
                if (postTimestamp > lastViewedActivities) {
                    newPostsCount++;
                }
            });

            let newMessagesCount = 0;
            messagesSnapshot.forEach((msgDoc) => {
                const msgTimestamp = msgDoc.data().timestamp ? msgDoc.data().timestamp.toDate() : new Date();
                if (msgTimestamp > lastViewedActivities) {
                    newMessagesCount++;
                }
            });

            const totalNewActivityCount = newPostsCount + newMessagesCount;

            notificationCountSpan.textContent = totalNewActivityCount;
            if (totalNewActivityCount > 0) {
                notificationCountSpan.style.display = 'inline-block';
                openNotificationsBtn.classList.add('new-activity-alert');
            } else {
                notificationCountSpan.style.display = 'none';
                openNotificationsBtn.classList.remove('new-activity-alert');
            }
        }, (error) => {
            console.error("Erro ao ouvir por novas mensagens de chat para o contador:", error);
        });
        unsubscribeNewActivity = () => { // Função combinada para desinscrição
            unsubscribePosts();
            unsubscribeMessages();
        };
    }, (error) => {
        console.error("Erro ao ouvir por novos posts para o contador:", error);
    });
}

// Carrega o feed de novidades (posts e mensagens recentes)
async function loadNewActivityFeed() {
    if (!notificationsList) return;
    notificationsList.innerHTML = '';
    const currentUser = auth.currentUser;
    if (!currentUser) {
        notificationsList.innerHTML = '<p style="color:red;">Faça login para ver suas novidades.</p>';
        return;
    }

    const allActivityItems = [];

    try {
        // 1. Buscar posts recentes
        const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(10));
        const postsSnapshot = await getDocs(postsQuery);
        postsSnapshot.forEach(doc => {
            const post = doc.data();
            allActivityItems.push({
                type: 'post',
                id: doc.id,
                timestamp: post.timestamp,
                content: post.content,
                username: post.username || post.userId
            });
        });

        // 2. Buscar mensagens de chat recentes envolvendo o usuário
        const chatQuery1 = query(collection(db, "privateChats"),
            where("senderId", "==", currentUser.uid),
            orderBy("timestamp", "desc"),
            limit(10)
        );
        const chatQuery2 = query(collection(db, "privateChats"),
            where("recipientId", "==", currentUser.uid),
            orderBy("timestamp", "desc"),
            limit(10)
        );

        const [chatSnapshot1, chatSnapshot2] = await Promise.all([getDocs(chatQuery1), getDocs(chatQuery2)]);

        chatSnapshot1.forEach(doc => {
            const msg = doc.data();
            allActivityItems.push({
                type: 'sent_message',
                id: doc.id,
                timestamp: msg.timestamp,
                message: msg.message,
                recipientId: msg.recipientId,
                senderUsername: msg.senderUsername,
                recipientUsername: "" // Será preenchido
            });
        });

        chatSnapshot2.forEach(doc => {
            const msg = doc.data();
            allActivityItems.push({
                type: 'received_message',
                id: doc.id,
                timestamp: msg.timestamp,
                message: msg.message,
                senderId: msg.senderId,
                senderUsername: msg.senderUsername,
                recipientUsername: "" // Será preenchido
            });
        });

        // 3. Obter nomes de usuário para mensagens
        const userPromises = [];
        const usersMap = new Map();

        allActivityItems.filter(item => item.type === 'sent_message' || item.type === 'received_message')
                         .forEach(item => {
            const otherUserId = item.type === 'sent_message' ? item.recipientId : item.senderId;
            if (otherUserId && !usersMap.has(otherUserId)) {
                userPromises.push(getDoc(doc(db, "users", otherUserId)).then(userDoc => {
                    if (userDoc.exists()) {
                        usersMap.set(otherUserId, userDoc.data().username || userDoc.data().email);
                    } else {
                        usersMap.set(otherUserId, "Usuário Desconhecido");
                    }
                }));
            }
        });

        await Promise.all(userPromises);

        // Atribuir nomes de usuário
        allActivityItems.forEach(item => {
            if (item.type === 'sent_message') {
                item.recipientUsername = usersMap.get(item.recipientId) || "Usuário Desconhecido";
            } else if (item.type === 'received_message') {
                item.senderUsername = usersMap.get(item.senderId) || "Usuário Desconhecido";
            }
        });


        // 4. Ordenar todos os itens por timestamp (mais recentes primeiro)
        allActivityItems.sort((a, b) => {
            const tsA = a.timestamp?.toDate() || new Date(0);
            const tsB = b.timestamp?.toDate() || new Date(0);
            return tsB.getTime() - tsA.getTime();
        });

        // 5. Exibir no feed
        if (allActivityItems.length === 0) {
            const noActivityMessage = document.createElement('p');
            noActivityMessage.textContent = "Nenhuma novidade ainda.";
            notificationsList.appendChild(noActivityMessage);
            return;
        }

        allActivityItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('activity-item');
            itemElement.style.marginBottom = '10px';
            itemElement.style.padding = '10px';
            itemElement.style.border = '1px solid #eee';
            itemElement.style.borderRadius = '5px';

            const timestampStr = item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : 'Carregando...';

            if (item.type === 'post') {
                itemElement.innerHTML = `
                    <h4>Novo Post de ${item.username}:</h4>
                    <p>${item.content}</p>
                    <small>${timestampStr}</small>
                `;
            } else if (item.type === 'sent_message') {
                itemElement.innerHTML = `
                    <h4>Mensagem Enviada para ${item.recipientUsername}:</h4>
                    <p>"${item.message}"</p>
                    <small>${timestampStr}</small>
                `;
            } else if (item.type === 'received_message') {
                itemElement.innerHTML = `
                    <h4>Mensagem Recebida de ${item.senderUsername}:</h4>
                    <p>"${item.message}"</p>
                    <small>${timestampStr}</small>
                `;
            }
            notificationsList.appendChild(itemElement);
        });
    } catch (error) {
        console.error("Erro ao carregar feed de novidades:", error);
        const errorMessage = document.createElement('p');
        errorMessage.style.color = 'red';
        errorMessage.textContent = "Erro ao carregar feed de novidades.";
        notificationsList.appendChild(errorMessage);
    }
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
        } catch (error) {
            console.error("Erro ao marcar atividades como vistas:", error);
        }
    }
}


// Initial state on load
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChanged will handle the initial display logic and notification listener setup
});
