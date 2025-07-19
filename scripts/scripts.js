// --- Configuração do Firebase ---
// Importa as funções específicas do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCN717SOcHkdqhuAZq7ZoEM-2gGb1sFjEY",
  authDomain: "vlog-a698a.firebaseapp.com",
  databaseURL: "https://vlog-a698a-default-rtdb.firebaseio.com",
  projectId: "vlog-a698a",
  storageBucket: "vlog-a698a.firebasestorage.app",
  messagingSenderId: "24061559591",
  appId: "1:24061559591:web:f7be730a33d0c0b856df02",
  measurementId: "G-ZGV3LDM3QD"
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
const postVideo = document.getElementById("postVideo");
const postAudio = document.getElementById("postAudio");
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
            loadPosts(); // Load posts immediately after login
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

    // Push promises for file uploads
    if (postImage.files[0]) uploads.push(uploadFile(postImage, 'imagem'));
    if (postVideo.files[0]) uploads.push(uploadFile(postVideo, 'video'));
    if (postAudio.files[0]) uploads.push(uploadFile(postAudio, 'audio'));

    try {
        const results = await Promise.all(uploads);
        let imageURL = null;
        let videoURL = null;
        let audioURL = null;

        // Assign results based on the order they were pushed, or based on a more robust way
        // For simplicity, assuming the order of uploads array matches the order of results
        let uploadIndex = 0;
        if (postImage.files[0]) imageURL = results[uploadIndex++];
        if (postVideo.files[0]) videoURL = results[uploadIndex++];
        if (postAudio.files[0]) audioURL = results[uploadIndex++];


        // Get the username for the post
        // Using getDocs with query and where to find the user's username
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
            imageURL: imageURL, // Use directly assigned URLs
            videoURL: videoURL,
            audioURL: audioURL
        });

        postContent.value = '';
        postImage.value = '';
        postVideo.value = '';
        postAudio.value = '';
        showMessage(postMessage, "Post publicado com sucesso!");
        loadPosts(); // Refresh feed after publishing a post
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
                <small>${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Just now'}</small>
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
let unsubscribeChatListener = null; // To store the unsubscribe function for the chat listener

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
            if (unsubscribeChatListener) {
                unsubscribeChatListener(); // Unsubscribe from previous chat listener
            }
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

    // The order of user IDs in the combined ID should be consistent (e.g., alphabetical)
    // to ensure a single chat document/collection for any given pair.
    const chatIds = [user1Id, user2Id].sort();
    const chatDocId = chatIds.join('_'); // e.g., "uid1_uid2"

    // Query for messages within a specific chat document's subcollection.
    // Assuming messages are stored in `privateChats/chatDocId/messages`
    const messagesRef = collection(db, `privateChats/${chatDocId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    unsubscribeChatListener = onSnapshot(q, (snapshot) => {
        chatMessagesDisplay.innerHTML = ''; // Clear display
        snapshot.forEach(doc => {
            const message = doc.data();
            displayChatMessage(message);
        });
        chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight; // Scroll to bottom
    }, (error) => {
        console.error("Error fetching chat messages:", error);
        showMessage(chatMessagesDisplay, "Erro ao carregar mensagens do chat.", 'error');
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
        <small>${message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : 'Just now'}</small>
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
            mediaType = mediaFile.type.split("/")[0]; // 'image', 'video', 'audio'
        }

        // Get sender username for display
        const senderDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        let senderUsername = user.email;
        if (!senderDoc.empty) {
            senderUsername = senderDoc.docs[0].data().username || user.email;
        }

        // Determine the chat document ID (alphabetical order for consistency)
        const chatIds = [user.uid, recipientId].sort();
        const chatDocId = chatIds.join('_');

        // Add message to a subcollection within the chat document
        await setDoc(doc(collection(db, `privateChats/${chatDocId}/messages`)), { // Use auto-generated ID for messages
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
