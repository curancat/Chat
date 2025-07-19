// --- Configuração do Firebase ---
// Importa as funções específicas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js"; // Added from new config
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app); // Initialized analytics
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
const postVideo = document.getElementById("postVideo");
const postAudio = document.getElementById("postAudio");
const postMessage = document.getElementById("postMessage");

const chatSendMessageBtn = document.getElementById("chatSendMessageBtn");
const chatMessageInput = document.getElementById("chatMessageInput");
const chatMediaInput = document.getElementById("chatMediaInput");
const chatMessageDiv = document.getElementById("chatMessage");
const chatMessagesDisplay = document.getElementById("chatMessagesDisplay"); // New
const chatRecipientSelect = document.getElementById("chatRecipientSelect"); // New

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
const feedSection = document.getElementById("feedSection"); // New
const postsContainer = document.getElementById("postsContainer"); // New


// --- Utilitários ---
function showMessage(element, msg, type = 'success') {
    element.textContent = msg;
    element.style.color = type === 'success' ? 'green' : 'red';
    if (!element.classList.contains('active')) { // Ensure message is visible if not part of active form
        element.style.display = 'block';
    }
    setTimeout(() => {
        element.textContent = '';
        element.style.display = 'none'; // Hide message after some time
    }, 4000);
}

// Função para esconder todos os formulários/seções
function hideAllForms() {
    loginFormContainer.classList.remove('active');
    registerFormContainer.classList.remove('active');
    createPostSection.classList.remove('active');
    chatSection.classList.remove('active');
    feedSection.classList.remove('active');
}

// Função para atualizar a visibilidade dos botões de navegação
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

// Event Listeners para botões de navegação
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
    loadChatUsers(); // Load users when chat is opened
});

viewFeedBtn.addEventListener('click', () => {
    hideAllForms();
    feedSection.classList.add('active');
    loadPosts(); // Load posts when feed is opened
});

// --- Autenticação ---
loginSubmit.addEventListener("click", () => {
    const email = loginEmail.value;
    const password = loginPassword.value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            showMessage(loginMessage, "Login bem-sucedido!");
            hideAllForms();
            feedSection.classList.add('active'); // Show feed after login
        })
        .catch(error => showMessage(loginMessage, error.message, 'error'));
});

registerSubmit.addEventListener("click", () => {
    const email = registerEmail.value;
    const password = registerPassword.value;
    const username = registerUsername.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(cred => {
            // Store user data including username in 'users' collection
            return setDoc(doc(db, "users", cred.user.uid), { username, email });
        })
        .then(() => {
            showMessage(registerMessage, "Cadastro realizado com sucesso!");
            hideAllForms();
            loginFormContainer.classList.add('active'); // Go to login after registration
        })
        .catch(error => showMessage(registerMessage, error.message, 'error'));
});

// Logout
logoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            showMessage(loginMessage, "Logout bem-sucedido!");
            hideAllForms();
            loginFormContainer.classList.add('active'); // Show login again
        })
        .catch(error => {
            showMessage(loginMessage, error.message, 'error');
        });
});

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
    updateNavButtons(!!user); // Update button visibility based on login status
    if (user) {
        console.log("Usuário logado:", user.email, user.uid);
        // If logged in, automatically show the feed (or another default page)
        // This prevents the login form from flashing if they were already logged in
        if (!loginFormContainer.classList.contains('active') && !registerFormContainer.classList.contains('active') &&
            !createPostSection.classList.contains('active') && !chatSection.classList.contains('active') &&
            !feedSection.classList.contains('active')) {
                hideAllForms();
                feedSection.classList.add('active');
                loadPosts(); // Load posts for the feed when logged in
        }
    } else {
        console.log("Nenhum usuário logado.");
        hideAllForms();
        loginFormContainer.classList.add('active'); // Default to login if not logged in
    }
});


// --- Publicar Post ---
publishPostBtn.addEventListener("click", async () => {
    const content = postContent.value;
    const user = auth.currentUser;

    if (!user || !content) {
        showMessage(postMessage, "Preencha o conteúdo e esteja logado.", 'error');
        return;
    }

    const postDocRef = doc(collection(db, "posts")); // Get a new document reference with an auto ID
    const uploads = [];

    const uploadFile = async (input, type) => {
        const file = input.files[0];
        if (!file) return null;
        const storageRef = ref(storage, `posts/${postDocRef.id}/${type}-${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    uploads.push(uploadFile(postImage, 'imagem'));
    uploads.push(uploadFile(postVideo, 'video'));
    uploads.push(uploadFile(postAudio, 'audio'));

    try {
        const [imageURL, videoURL, audioURL] = await Promise.all(uploads);

        // Get the username for the post
        const userDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let username = user.email; // Default to email if username not found
        userDocSnapshot.forEach((doc) => {
            username = doc.data().username || user.email;
        });

        await setDoc(postDocRef, {
            content,
            userId: user.uid,
            username: username, // Store username with the post
            timestamp: serverTimestamp(),
            imageURL: imageURL || null,
            videoURL: videoURL || null,
            audioURL: audioURL || null
        });

        postContent.value = '';
        postImage.value = '';
        postVideo.value = '';
        postAudio.value = '';
        showMessage(postMessage, "Post publicado com sucesso!");
    } catch (error) {
        showMessage(postMessage, "Erro ao publicar post.", 'error');
        console.error("Erro ao publicar post:", error);
    }
});

// --- Carregar Posts (Feed) ---
function loadPosts() {
    postsContainer.innerHTML = ''; // Clear previous posts
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        postsContainer.innerHTML = ''; // Clear again to prevent duplicates on updates
        snapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = document.createElement('div');
            postElement.classList.add('post-card'); // Use .post-card for styling
            postElement.innerHTML = `
                <h3>${post.username || post.userId}</h3>
                <p>${post.content}</p>
                ${post.imageURL ? `<img src="${post.imageURL}" alt="Post Image">` : ''}
                ${post.videoURL ? `<video controls src="${post.videoURL}"></video>` : ''}
                ${post.audioURL ? `<audio controls src="${post.audioURL}"></audio>` : ''}
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
let currentChatRecipientId = null; // Track the current recipient for private chat

// Load users for the recipient dropdown
async function loadChatUsers() {
    chatRecipientSelect.innerHTML = '<option value="">Selecione um usuário</option>'; // Default option
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("username")); // Order users by username
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== currentUser.uid) { // Don't allow chatting with self
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = userData.username || userData.email;
            chatRecipientSelect.appendChild(option);
        }
    });

    // Set up listener for recipient selection if not already set
    if (!chatRecipientSelect.dataset.listenerAdded) {
        chatRecipientSelect.addEventListener('change', (event) => {
            currentChatRecipientId = event.target.value;
            chatMessagesDisplay.innerHTML = ''; // Clear previous messages
            if (currentChatRecipientId) {
                listenForChatMessages(currentUser.uid, currentChatRecipientId);
            }
        });
        chatRecipientSelect.dataset.listenerAdded = true; // Mark as added
    }
}

// Listen for chat messages between two users
function listenForChatMessages(user1Id, user2Id) {
    const chatCollectionRef = collection(db, "privateChats");

    // Query for messages where sender is user1 and recipient is user2
    const q1 = query(chatCollectionRef,
        where("senderId", "==", user1Id),
        where("recipientId", "==", user2Id)
    );
    // Query for messages where sender is user2 and recipient is user1
    const q2 = query(chatCollectionRef,
        where("senderId", "==", user2Id),
        where("recipientId", "==", user1Id)
    );

    // Combine results from both queries and sort by timestamp in JavaScript
    // This is a common pattern for bidirectional chat queries in Firestore
    // It's crucial to handle real-time updates for both queries.
    // Using a single onSnapshot that combines both would be more efficient for real-time.
    // However, to simplify the example without complex merge logic, we'll use two.
    onSnapshot(q1, (snapshot1) => {
        onSnapshot(q2, (snapshot2) => {
            const allMessages = [];
            snapshot1.forEach(doc => allMessages.push(doc.data()));
            snapshot2.forEach(doc => allMessages.push(doc.data()));

            // Sort all messages by timestamp
            allMessages.sort((a, b) => {
                const timestampA = a.timestamp?.toDate() || new Date(0); // Handle pending timestamps
                const timestampB = b.timestamp?.toDate() || new Date(0); // Handle pending timestamps
                return timestampA - timestampB;
            });

            chatMessagesDisplay.innerHTML = ''; // Clear display
            allMessages.forEach(message => {
                displayChatMessage(message);
            });
            chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight; // Scroll to bottom
        });
    });
}

// Display a single chat message
function displayChatMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-bubble'); // Use .message-bubble for styling
    const currentUser = auth.currentUser;

    let senderName = message.senderUsername || "Desconhecido";
    if (currentUser && message.senderId === currentUser.uid) {
        messageElement.classList.add('sent'); // My messages
        senderName = "Você";
    } else {
        messageElement.classList.add('received'); // Other user's messages
    }

    let contentHTML = '';
    if (message.type === 'text' && message.message) {
        contentHTML = `<p>${message.message}</p>`;
    } else if (message.type === 'image' && message.mediaURL) {
        contentHTML = `<img src="${message.mediaURL}" alt="Chat Image">`;
    } else if (message.type === 'video' && message.mediaURL) {
        contentHTML = `<video controls src="${message.mediaURL}"></video>`;
    } else if (message.type === 'audio' && message.mediaURL) {
        contentHTML = `<audio controls src="${message.mediaURL}"></audio>`;
    }

    messageElement.innerHTML = `
        <strong>${senderName}</strong>
        ${contentHTML}
        <small>${new Date(message.timestamp?.toDate()).toLocaleTimeString()}</small>
    `;
    chatMessagesDisplay.appendChild(messageElement);
}


// --- Enviar mensagem no chat (texto e mídia) ---
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
    if (!text && !mediaFile) {
        showMessage(chatMessageDiv, "Digite uma mensagem ou selecione uma mídia.", 'error');
        return;
    }

    try {
        let mediaURL = null;
        let mediaType = null;
        if (mediaFile) {
            const storageRef = ref(storage, `chat_media/${user.uid}/${recipientId}/${Date.now()}-${mediaFile.name}`);
            await uploadBytes(storageRef, mediaFile);
            mediaURL = await getDownloadURL(storageRef);
            mediaType = mediaFile.type.split("/")[0];
        }

        // Get sender username for display
        const senderDocSnapshot = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let senderUsername = user.email;
        senderDocSnapshot.forEach((doc) => {
            senderUsername = doc.data().username || user.email;
        });

        // Use a combined ID for private chat documents to easily query both sides
        await setDoc(doc(collection(db, "privateChats"), Date.now().toString() + "_" + user.uid), {
            senderId: user.uid,
            senderUsername: senderUsername,
            recipientId: recipientId,
            message: text || null,
            mediaURL: mediaURL || null,
            type: mediaType || (text ? 'text' : 'unknown'),
            timestamp: serverTimestamp()
        });

        showMessage(chatMessageDiv, "Mensagem enviada!");
        chatMessageInput.value = '';
        chatMediaInput.value = ''; // Clear file input
    } catch (error) {
        showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
        console.error("Erro ao enviar mensagem de chat:", error);
    }
});

// Initial state on load
document.addEventListener('DOMContentLoaded', () => {
    // onAuthStateChanged will handle the initial display logic
});
