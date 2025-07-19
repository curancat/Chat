// --- Configuração do Firebase ---
// Importa as funções específicas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

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
const storage = getStorage(app);

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
const postImage = document.getElementById("postImage");
// REMOVIDO: const postVideo = document.getElementById("postVideo");
// REMOVIDO: const postAudio = document.getElementById("postAudio");
const postMessage = document.getElementById("postMessage");

const chatSendMessageBtn = document.getElementById("chatSendMessageBtn");
const chatMessageInput = document.getElementById("chatMessageInput");
const chatMediaInput = document.getElementById("chatMediaInput");
const chatMessageDiv = document.getElementById("chatMessage");
const chatMessagesDisplay = document.getElementById("chatMessagesDisplay");
const chatRecipientSelect = document.getElementById("chatRecipientSelect");

const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const viewFeedBtn = document.getElementById("viewFeedBtn");
const createPostBtn = document.getElementById("createPostBtn");
const openChatBtn = document.getElementById("openChatBtn");

const loginFormContainer = document.getElementById("loginFormContainer");
const registerFormContainer = document.getElementById("registerFormContainer");
const createPostSection = document.getElementById("createPostSection");
const chatSection = document.getElementById("chatSection");
const feedSection = document.getElementById("feedSection");
const postsContainer = document.getElementById("postsContainer");


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
    // Você também deve remover os inputs de video e audio do seu HTML
});

openChatBtn.addEventListener('click', () => {
    hideAllForms();
    chatSection.classList.add('active');
    loadChatUsers();
    // Você também deve remover o input de chat media do seu HTML se for apenas texto
});

viewFeedBtn.addEventListener('click', () => {
    hideAllForms();
    feedSection.classList.add('active');
    loadPosts();
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


// --- Publicar Post (SOMENTE TEXTO E IMAGEM) ---
publishPostBtn.addEventListener("click", async () => {
    const content = postContent.value;
    const user = auth.currentUser;

    if (!user || !content.trim()) { // .trim() para garantir que não é apenas espaços em branco
        showMessage(postMessage, "Preencha o conteúdo do post e esteja logado.", 'error');
        return;
    }

    const postDocRef = doc(collection(db, "posts"));
    let imageURL = null; // Inicializa imageURL como null

    const uploadFile = async (input, type) => {
        const file = input.files[0];
        if (!file) return null;

        // Verifica se é um arquivo de imagem
        if (!file.type.startsWith('image/')) {
            showMessage(postMessage, "Apenas imagens são permitidas para upload de mídia no post.", 'error');
            return null; // Retorna null se não for imagem
        }

        const storageRef = ref(storage, `posts/${postDocRef.id}/${type}-${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    // Tenta fazer upload apenas da imagem
    imageURL = await uploadFile(postImage, 'imagem');


    try {
        // Obter o nome de usuário para o post
        const userDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let username = user.email;
        userDocSnapshot.forEach((doc) => {
            username = doc.data().username || user.email;
        });

        // Salvar o post no Firestore
        await setDoc(postDocRef, {
            content: content,
            userId: user.uid,
            username: username,
            timestamp: serverTimestamp(),
            imageURL: imageURL // imageURL será null se não houver imagem ou se o upload falhar
            // REMOVIDO: videoURL, audioURL não serão mais salvos
        });

        postContent.value = '';
        postImage.value = '';
        // REMOVIDO: postVideo.value = '';
        // REMOVIDO: postAudio.value = '';
        showMessage(postMessage, "Post publicado com sucesso!");
    } catch (error) {
        showMessage(postMessage, "Erro ao publicar post.", 'error');
        console.error("Erro ao publicar post:", error);
    }
});

// --- Carregar Posts (Feed) ---
function loadPosts() {
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
                ${post.imageURL ? `<img src="${post.imageURL}" alt="Post Image">` : ''}
                <small>${new Date(post.timestamp?.toDate()).toLocaleString()}</small>
            `;
            postsContainer.appendChild(postElement);
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
    // Prioriza exibir o texto da mensagem
    if (message.message) {
        contentHTML = `<p>${message.message}</p>`;
    }

    // Se houver uma imagem, adiciona ao conteúdo HTML
    if (message.type === 'image' && message.mediaURL) {
        contentHTML += `<img src="${message.mediaURL}" alt="Chat Image">`;
    }
    // REMOVIDO: Lógica para exibir vídeo
    // else if (message.type === 'video' && message.mediaURL) {
    //     contentHTML = `<video controls src="${message.mediaURL}"></video>`;
    // }
    // REMOVIDO: Lógica para exibir áudio
    // else if (message.type === 'audio' && message.mediaURL) {
    //     contentHTML = `<audio controls src="${message.mediaURL}"></audio>`;
    // }

    messageElement.innerHTML = `
        <strong>${senderName}</strong>
        ${contentHTML}
        <small>${new Date(message.timestamp?.toDate()).toLocaleTimeString()}</small>
    `;
    chatMessagesDisplay.appendChild(messageElement);
}


// --- Enviar mensagem no chat (texto e imagens) ---
chatSendMessageBtn.addEventListener("click", async () => {
    const text = chatMessageInput.value.trim();
    const mediaFile = chatMediaInput.files[0];
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
    // Permite enviar só texto, só imagem, ou texto com imagem
    if (!text && !mediaFile) {
        showMessage(chatMessageDiv, "Digite uma mensagem ou selecione uma imagem.", 'error');
        return;
    }
    if (mediaFile && !mediaFile.type.startsWith('image/')) {
        showMessage(chatMessageDiv, "Apenas imagens são permitidas para upload no chat.", 'error');
        return;
    }


    try {
        let mediaURL = null;
        let mediaType = null;
        if (mediaFile) {
            const storageRef = ref(storage, `chat_media/${user.uid}/${recipientId}/${Date.now()}-${mediaFile.name}`);
            await uploadBytes(storageRef, mediaFile);
            mediaURL = await getDownloadURL(storageRef);
            mediaType = mediaFile.type.split("/")[0]; // Será 'image'
        }

        // Obter nome de usuário do remetente
        const senderDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let senderUsername = user.email;
        senderDocSnapshot.forEach((doc) => {
            senderUsername = doc.data().username || user.email;
        });

        await setDoc(doc(collection(db, "privateChats"), Date.now().toString() + "_" + user.uid), {
            senderId: user.uid,
            senderUsername: senderUsername,
            recipientId: recipientId,
            message: text || null, // Armazena null se o campo de texto estiver vazio
            mediaURL: mediaURL || null, // Armazena null se não houver mídia
            type: mediaType || (text ? 'text' : 'unknown'), // Define o tipo
            timestamp: serverTimestamp()
        });

        showMessage(chatMessageDiv, "Mensagem enviada!");
        chatMessageInput.value = '';
        chatMediaInput.value = ''; // Limpa input de arquivo
    } catch (error) {
        showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
        console.error("Erro ao enviar mensagem de chat:", error);
    }
});

// Initial state on load
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChanged will handle the initial display logic
});
