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
        setupNewActivityListener(auth.currentUser.uid); // Inicia o listener de novidades
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        viewFeedBtn.style.display = 'none';
        createPostBtn.style.display = 'none';
        openChatBtn.style.display = 'none';
        openNotificationsBtn.style.display = 'none';
        notificationCountSpan.textContent = '0';
        notificationCountSpan.style.display = 'none';
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

// Event Listener para o botão de Novidades
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
            !feedSection.classList.add('active') && !notificationsSection.classList.contains('active')) {
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
let unsubscribeChatMessages = null; // Para desinscrição de listeners de chat

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
                if (unsubscribeChatMessages) {
                    unsubscribeChatMessages(); // Desinscreve o listener anterior
                }
                unsubscribeChatMessages = listenForChatMessages(currentUser.uid, currentChatRecipientId);
            }
        });
        chatRecipientSelect.dataset.listenerAdded = true;
    }
}

function listenForChatMessages(user1Id, user2Id) {
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
        return unsubscribe2; // Retorna a função para desinscrever o segundo listener
    });
    return unsubscribe1; // Retorna a função para desinscrever o primeiro listener
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
    } catch (error) {
        showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
        console.error("Erro ao enviar mensagem de chat:", error);
    }
});

// --- Funções de Feed de Novidades ---

let unsubscribeNewActivity = null; // Para guardar a função de desinscrição do feed de novidades

// Listener de novidades em tempo real para o contador
async function setupNewActivityListener(userId) {
    if (unsubscribeNewActivity) {
        unsubscribeNewActivity();
    }

    const userRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userRef);
    let lastViewedActivities = null;
    if (userDocSnap.exists()) {
        lastViewedActivities = userDocSnap.data().lastViewedActivities?.toDate() || new Date(0); // Use 0 para garantir que pegue tudo se for nulo
    } else {
        // Se o documento do usuário não existir ou não tiver lastViewedActivities, crie-o
        await setDoc(userRef, { lastViewedActivities: serverTimestamp() }, { merge: true });
        lastViewedActivities = new Date();
    }


    // Listener para novos posts
    const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribePosts = onSnapshot(postsQuery, (postsSnapshot) => {
        let newPostsCount = 0;
        postsSnapshot.forEach((postDoc) => {
            const postTimestamp = postDoc.data().timestamp ? postDoc.data().timestamp.toDate() : new Date();
            if (postTimestamp > lastViewedActivities) {
                newPostsCount++;
            }
        });

        // Listener para novas mensagens
        const messagesQuery = query(collection(db, "privateChats"),
            where("recipientId", "==", userId),
            orderBy("timestamp", "desc")
        );
        const unsubscribeMessages = onSnapshot(messagesQuery, (messagesSnapshot) => {
            let newMessagesCount = 0;
            messagesSnapshot.forEach((msgDoc) => {
                const msgTimestamp = msgDoc.data().timestamp ? msgDoc.data().timestamp.toDate() : new Date();
                if (msgTimestamp > lastViewedActivities) {
                    newMessagesCount++;
                }
            });

            const totalNewActivityCount = newPostsCount + newMessagesCount; // Soma posts e mensagens

            notificationCountSpan.textContent = totalNewActivityCount;
            if (totalNewActivityCount > 0) {
                notificationCountSpan.style.display = 'inline-block';
                openNotificationsBtn.classList.add('new-activity-alert');
            } else {
                notificationCountSpan.style.display = 'none';
                openNotificationsBtn.classList.remove('new-activity-alert');
            }
        }, (error) => {
            console.error("Erro ao ouvir por novas mensagens de chat:", error);
        });
        // Combine a desinscrição de ambos os listeners
        unsubscribeNewActivity = () => {
            unsubscribePosts();
            unsubscribeMessages();
        };
    }, (error) => {
        console.error("Erro ao ouvir por novos posts:", error);
    });
}

// Carrega o feed de novidades (posts e mensagens recentes)
async function loadNewActivityFeed() {
    notificationsList.innerHTML = ''; // Limpa a lista existente
    const currentUser = auth.currentUser;
    if (!currentUser) {
        notificationsList.innerHTML = '<p style="color:red;">Faça login para ver suas novidades.</p>';
        return;
    }

    const allActivityItems = [];

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
    const usersMap = new Map(); // Para evitar buscas duplicadas

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
        // Futuramente, pode adicionar tipos para comentários/curtidas se a lógica de dados for ajustada
        notificationsList.appendChild(itemElement);
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
            // O listener de novidades vai reagir a essa mudança e zerar o contador
        } catch (error) {
            console.error("Erro ao marcar atividades como vistas:", error);
        }
    }
}


// Initial state on load
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChanged will handle the initial display logic and notification listener setup
});
