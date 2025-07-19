// --- Configuração do Firebase ---
// Importa as funções específicas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
// getStorage, ref, uploadBytes, getDownloadURL removidos, pois não há mais mídia

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCN717SOcHkdqhuAZq7ZoEM-2gGb1sFjEY",
  authDomain: "vlog-a698a.firebaseapp.com",
  databaseURL: "https://vlog-a698a-default-rtdb.firebaseio.com",
  projectId: "vlog-a698a",
  storageBucket: "vlog-a698a.firebasestorage.app", // Pode ser removido se o Storage não for usado para mais nada
  messagingSenderId: "24061559591",
  appId: "1:24061559591:web:f7be730a33d0c0b856df02",
  measurementId: "G-ZGV3LDM3QD"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
// const storage = getStorage(app); // Storage não é mais necessário

// --- Elementos DOM ---
let loginEmail, loginPassword, loginSubmit, loginMessage;
let registerUsername, registerEmail, registerPassword, registerSubmit, registerMessage;
let publishPostBtn, postContent, postMessage; // postImage, postVideo, postAudio removidos
let chatSendMessageBtn, chatMessageInput, chatMessageDiv, chatMessagesDisplay, chatRecipientSelect; // chatMediaInput removido
let logoutBtn, loginBtn, registerBtn, viewFeedBtn, createPostBtn, openChatBtn;
let loginFormContainer, registerFormContainer, createPostSection, chatSection, feedSection, postsContainer;

// --- Utilitários ---
function showMessage(element, msg, type = 'success') {
    element.textContent = msg;
    element.style.color = type === 'success' ? 'green' : 'red';
    element.style.display = 'block';
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
}

function updateNavButtons(isLoggedIn) {
    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        viewFeedBtn.style.display = 'block';
        createPostBtn.style.display = 'block';
        openChatBtn.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        viewFeedBtn.style.display = 'none';
        createPostBtn.style.display = 'none';
        openChatBtn.style.display = 'none';
    }
}

// --- Funções de Carregamento de Dados ---
function loadPosts() {
    if (!postsContainer) {
        console.error("Elemento 'postsContainer' não encontrado.");
        return;
    }
    postsContainer.innerHTML = '';
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        postsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = document.createElement('div');
            postElement.classList.add('post-card');
            postElement.innerHTML = `
                <h3>${post.username || post.userId}</h3>
                <p>${post.content}</p>
                <small>${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Just now'}</small>
            `; // Conteúdo de mídia removido
            postsContainer.appendChild(postElement);
        });
    }, (error) => {
        console.error("Error fetching posts:", error);
        showMessage(postsContainer, "Erro ao carregar posts.", 'error');
    });
}

let currentChatRecipientId = null;
let unsubscribeChatListener = null;

async function loadChatUsers() {
    if (!chatRecipientSelect) {
        console.error("Elemento 'chatRecipientSelect' não encontrado.");
        return;
    }
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
            if (unsubscribeChatListener) {
                unsubscribeChatListener();
            }
            if (currentChatRecipientId) {
                listenForChatMessages(currentUser.uid, currentChatRecipientId);
            }
        });
        chatRecipientSelect.dataset.listenerAdded = true;
    }
}

function listenForChatMessages(user1Id, user2Id) {
    const chatCollectionRef = collection(db, "privateChats");

    const chatIds = [user1Id, user2Id].sort();
    const chatDocId = chatIds.join('_');

    const messagesRef = collection(db, `privateChats/${chatDocId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    unsubscribeChatListener = onSnapshot(q, (snapshot) => {
        chatMessagesDisplay.innerHTML = '';
        snapshot.forEach(doc => {
            const message = doc.data();
            displayChatMessage(message);
        });
        chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight;
    }, (error) => {
        console.error("Error fetching chat messages:", error);
        showMessage(chatMessagesDisplay, "Erro ao carregar mensagens do chat.", 'error');
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

    // Apenas mensagens de texto são exibidas
    let contentHTML = '';
    if (message.type === 'text' && message.message) {
        contentHTML = `<p>${message.message}</p>`;
    }

    messageElement.innerHTML = `
        <strong>${senderName}</strong>
        ${contentHTML}
        <small>${message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : 'Just now'}</small>
    `;
    chatMessagesDisplay.appendChild(messageElement);
}

// --- DOMContentLoaded para garantir que o DOM esteja carregado ---
document.addEventListener('DOMContentLoaded', () => {
    loginEmail = document.getElementById("loginEmail");
    loginPassword = document.getElementById("loginPassword");
    loginSubmit = document.getElementById("loginSubmit");
    loginMessage = document.getElementById("loginMessage");

    registerUsername = document.getElementById("registerUsername");
    registerEmail = document.getElementById("registerEmail");
    registerPassword = document.getElementById("registerPassword");
    registerSubmit = document.getElementById("registerSubmit");
    registerMessage = document.getElementById("registerMessage");

    publishPostBtn = document.getElementById("publishPostBtn");
    postContent = document.getElementById("postContent");
    // postImage = document.getElementById("postImage"); // Removido
    // postVideo = document.getElementById("postVideo"); // Removido
    // postAudio = document.getElementById("postAudio"); // Removido
    postMessage = document.getElementById("postMessage");

    chatSendMessageBtn = document.getElementById("chatSendMessageBtn");
    chatMessageInput = document.getElementById("chatMessageInput");
    // chatMediaInput = document.getElementById("chatMediaInput"); // Removido
    chatMessageDiv = document.getElementById("chatMessage");
    chatMessagesDisplay = document.getElementById("chatMessagesDisplay");
    chatRecipientSelect = document.getElementById("chatRecipientSelect");

    logoutBtn = document.getElementById("logoutBtn");
    loginBtn = document.getElementById("loginBtn");
    registerBtn = document.getElementById("registerBtn");
    viewFeedBtn = document.getElementById("viewFeedBtn");
    createPostBtn = document.getElementById("createPostBtn");
    openChatBtn = document.getElementById("openChatBtn");

    loginFormContainer = document.getElementById("loginFormContainer");
    registerFormContainer = document.getElementById("registerFormContainer");
    createPostSection = document.getElementById("createPostSection");
    chatSection = document.getElementById("chatSection");
    feedSection = document.getElementById("feedSection");
    postsContainer = document.getElementById("postsContainer");


    // --- Autenticação ---
    if (loginSubmit) {
        loginSubmit.addEventListener("click", () => {
            const email = loginEmail.value;
            const password = loginPassword.value;

            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    showMessage(loginMessage, "Login bem-sucedido!");
                    hideAllForms();
                    feedSection.classList.add('active');
                    loadPosts();
                })
                .catch(error => showMessage(loginMessage, error.message, 'error'));
        });
    } else {
        console.error("Elemento 'loginSubmit' não encontrado.");
    }

    if (registerSubmit) {
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
    } else {
        console.error("Elemento 'registerSubmit' não encontrado.");
    }

    // --- Logout ---
    if (logoutBtn) {
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
    } else {
        console.error("Elemento 'logoutBtn' não encontrado.");
    }

    // --- Monitorar estado de autenticação ---
    onAuthStateChanged(auth, (user) => {
        updateNavButtons(!!user);
        if (user) {
            console.log("Usuário logado:", user.email, user.uid);
            if (!loginFormContainer.classList.contains('active') && !registerFormContainer.classList.contains('active') &&
                !createPostSection.classList.contains('active') && !chatSection.classList.contains('active') &&
                !feedSection.classList.contains('active')) {
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

    // --- Event Listeners para botões de navegação ---
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            hideAllForms();
            loginFormContainer.classList.add('active');
        });
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            hideAllForms();
            registerFormContainer.classList.add('active');
        });
    }
    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            hideAllForms();
            createPostSection.classList.add('active');
        });
    }
    if (openChatBtn) {
        openChatBtn.addEventListener('click', () => {
            hideAllForms();
            chatSection.classList.add('active');
            loadChatUsers();
        });
    }
    if (viewFeedBtn) {
        viewFeedBtn.addEventListener('click', () => {
            hideAllForms();
            feedSection.classList.add('active');
            loadPosts();
        });
    }

    // --- Publicar Post (APENAS TEXTO) ---
    if (publishPostBtn) {
        publishPostBtn.addEventListener("click", async () => {
            const content = postContent.value;
            const user = auth.currentUser;

            if (!user || !content) {
                showMessage(postMessage, "Preencha o conteúdo e esteja logado.", 'error');
                return;
            }

            try {
                const userDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
                let username = user.email;
                if (!userDocSnapshot.empty) {
                    username = userDocSnapshot.docs[0].data().username || user.email;
                }

                await setDoc(doc(collection(db, "posts")), { // Firestore irá gerar um ID automático
                    content,
                    userId: user.uid,
                    username: username,
                    timestamp: serverTimestamp(),
                    // URLs de mídia removidas
                });

                postContent.value = '';
                showMessage(postMessage, "Post publicado com sucesso!");
                loadPosts();
            } catch (error) {
                showMessage(postMessage, "Erro ao publicar post.", 'error');
                console.error("Erro ao publicar post:", error);
            }
        });
    } else {
        console.error("Elemento 'publishPostBtn' não encontrado.");
    }

    // --- Enviar mensagem no chat (APENAS TEXTO) ---
    if (chatSendMessageBtn) {
        chatSendMessageBtn.addEventListener("click", async () => {
            const text = chatMessageInput.value.trim();
            // const mediaFile = chatMediaInput.files[0]; // Removido
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
            if (!text) { // Apenas verifica se há texto
                showMessage(chatMessageDiv, "Digite uma mensagem.", 'error');
                return;
            }

            try {
                // Lógica de upload de mídia removida

                const senderDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
                let senderUsername = user.email;
                if (!senderDoc.empty) {
                    senderUsername = senderDoc.docs[0].data().username || user.email;
                }

                const chatIds = [user.uid, recipientId].sort();
                const chatDocId = chatIds.join('_');

                await setDoc(doc(collection(db, `privateChats/${chatDocId}/messages`)), {
                    senderId: user.uid,
                    senderUsername: senderUsername,
                    recipientId: recipientId,
                    message: text || null,
                    // mediaURL: mediaURL || null, // Removido
                    type: 'text', // Tipo agora é sempre texto
                    timestamp: serverTimestamp()
                });

                showMessage(chatMessageDiv, "Mensagem enviada!");
                chatMessageInput.value = '';
                // chatMediaInput.value = ''; // Removido
            } catch (error) {
                showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
                console.error("Erro ao enviar mensagem de chat:", error);
            }
        });
    } else {
        console.error("Elemento 'chatSendMessageBtn' não encontrado.");
    }
});
