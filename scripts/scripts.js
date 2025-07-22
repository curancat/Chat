// --- Configuração do Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where, updateDoc, arrayUnion, arrayRemove, increment, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDd4ZIyPIoJJCHCPeeUIChaEsNSBMLpVgA",
  authDomain: "vlog-8a75f.firebaseapp.com",
  projectId: "vlog-8a75f",
  storageBucket: "vlog-8a75f.firebasestorage.app",
  messagingSenderId: "1063952650353",
  appId: "1:1063952650353:web:25f37c51b49daeaf81cbd0",
  measurementId: "G-GRM2E926W3"
};

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
const postImageUrl = document.getElementById("postImageUrl"); // Moved up for clarity
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

const openProfileBtn = document.getElementById("openProfileBtn");
const profileSection = document.getElementById("profileSection");
const profileEmailDisplay = document.getElementById("profileEmailDisplay");
const profileUsernameInput = document.getElementById("profileUsernameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileMessage = document.getElementById("profileMessage");

// --- Utilitários ---

const allSections = [
    loginFormContainer,
    registerFormContainer,
    createPostSection,
    chatSection,
    feedSection,
    notificationsSection,
    profileSection
];

function hideAllForms() {
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none'; // Ensure it's hidden
    });
}

function showSection(sectionElement) {
    hideAllForms();
    sectionElement.classList.add('active');
    sectionElement.style.display = ''; // Let CSS control display for 'active'
    // Special handling for feedSection to use flex if needed
    if (sectionElement.id === 'feedSection') {
        sectionElement.style.display = 'flex';
    }
}

function showMessage(element, msg, type = 'success') {
    element.textContent = msg;
    element.classList.remove('success', 'error');
    element.classList.add(type);
    element.style.display = 'block';
    setTimeout(() => {
        element.textContent = '';
        element.style.display = 'none';
        element.classList.remove('success', 'error');
    }, 4000);
}

function updateNavButtons(isLoggedIn) {
    loginBtn.style.display = isLoggedIn ? 'none' : 'block';
    registerBtn.style.display = isLoggedIn ? 'none' : 'block';
    logoutBtn.style.display = isLoggedIn ? 'block' : 'none';
    viewFeedBtn.style.display = isLoggedIn ? 'block' : 'none';
    createPostBtn.style.display = isLoggedIn ? 'block' : 'none';
    openChatBtn.style.display = isLoggedIn ? 'block' : 'none';
    openNotificationsBtn.style.display = isLoggedIn ? 'block' : 'none';
    openProfileBtn.style.display = isLoggedIn ? 'block' : 'none';

    if (isLoggedIn) {
        setupNotificationListener(auth.currentUser.uid);
    } else {
        notificationCountSpan.textContent = '0';
        if (unsubscribeNotifications) {
            unsubscribeNotifications();
            unsubscribeNotifications = null;
        }
        // If no user is logged in, ensure only login/register are visible.
        // This is handled by onAuthStateChanged redirecting to loginFormContainer.
    }
}

// --- Event Listeners dos Botões de Navegação ---
loginBtn.addEventListener('click', () => {
    showSection(loginFormContainer);
    loginMessage.textContent = '';
    loginMessage.style.display = 'none';
});

registerBtn.addEventListener('click', () => {
    showSection(registerFormContainer);
    registerMessage.textContent = '';
    registerMessage.style.display = 'none';
});

createPostBtn.addEventListener('click', () => {
    showSection(createPostSection);
    postContent.value = '';
    postImageUrl.value = ''; // Clear image URL field
    postMessage.textContent = '';
    postMessage.style.display = 'none';
});

openChatBtn.addEventListener('click', () => {
    showSection(chatSection);
    loadChatUsers();
    chatMessageInput.value = '';
    chatMessageDiv.textContent = '';
    chatMessageDiv.style.display = 'none';
});

viewFeedBtn.addEventListener('click', () => {
    showSection(feedSection);
    // loadPosts() is already real-time via onSnapshot,
    // so just showing the section is enough.
});

openNotificationsBtn.addEventListener('click', () => {
    showSection(notificationsSection);
    loadNotifications();
});

openProfileBtn.addEventListener('click', () => {
    showSection(profileSection);
    loadUserProfile();
    profileMessage.textContent = '';
    profileMessage.style.display = 'none';
});

// --- Autenticação ---
loginSubmit.addEventListener("click", async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        showMessage(loginMessage, "Por favor, insira email e senha.", 'error');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage(loginMessage, "Login bem-sucedido!");
        // onAuthStateChanged will handle showing feed and loading posts
    } catch (error) {
        let errorMessage = "Erro de login.";
        if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Usuário desativado.';
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Email ou senha incorretos.';
        } else {
            errorMessage = error.message;
        }
        showMessage(loginMessage, errorMessage, 'error');
        console.error("Erro de login:", error);
    }
});

registerSubmit.addEventListener("click", async () => {
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const username = registerUsername.value.trim();

    if (!username || !email || !password) {
        showMessage(registerMessage, "Por favor, preencha todos os campos.", 'error');
        return;
    }
    if (password.length < 6) {
        showMessage(registerMessage, "A senha deve ter pelo menos 6 caracteres.", 'error');
        return;
    }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
            username: username,
            email: email,
            createdAt: serverTimestamp()
        });
        showMessage(registerMessage, "Cadastro realizado com sucesso!");
        registerUsername.value = '';
        registerEmail.value = '';
        registerPassword.value = '';
        showSection(loginFormContainer); // Redirect to login after successful registration
    } catch (error) {
        let errorMessage = "Erro no cadastro.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email já está em uso.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Senha muito fraca.';
        } else {
            errorMessage = error.message;
        }
        showMessage(registerMessage, errorMessage, 'error');
        console.error("Erro de cadastro:", error);
    }
});

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        showMessage(loginMessage, "Logout bem-sucedido!");
        // onAuthStateChanged will handle showing login and cleaning up
    } catch (error) {
        showMessage(loginMessage, error.message, 'error');
        console.error("Erro de logout:", error);
    }
});

// Monitorar estado de autenticação
onAuthStateChanged(auth, (user) => {
    updateNavButtons(!!user);
    if (user) {
        console.log("Usuário logado:", user.email, user.uid);
        // Only show feed if not already on feed, or if it's login/register section
        const currentActiveSection = allSections.find(section => section.classList.contains('active'));
        if (!currentActiveSection || currentActiveSection === loginFormContainer || currentActiveSection === registerFormContainer) {
            showSection(feedSection);
        }
        loadPosts(); // Always load posts when user is logged in
        setupNotificationListener(user.uid);
    } else {
        console.log("Nenhum usuário logado.");
        // If no user, show login form unless registration is already active.
        const currentActiveSection = allSections.find(section => section.classList.contains('active'));
        if (!currentActiveSection || (currentActiveSection !== registerFormContainer && currentActiveSection !== loginFormContainer)) {
             showSection(loginFormContainer);
        }
    }
});

// --- Publicar Post ---
publishPostBtn.addEventListener("click", async () => {
    const content = postContent.value.trim();
    const imageUrl = postImageUrl.value.trim();
    const user = auth.currentUser;

    if (!user) {
        showMessage(postMessage, "Você precisa estar logado para publicar posts.", 'error');
        return;
    }
    if (!content && !imageUrl) {
        showMessage(postMessage, "Preencha o conteúdo do post ou adicione uma imagem.", 'error');
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        let username = user.email;
        if (userDoc.exists()) {
            username = userDoc.data().username || user.email;
        } else {
            console.warn("Documento do usuário não encontrado para UID:", user.uid);
            await setDoc(doc(db, "users", user.uid), { username: user.email, email: user.email }, { merge: true });
        }

        await addDoc(collection(db, "posts"), { // Changed to addDoc for auto-ID
            content: content,
            imageUrl: imageUrl || null,
            userId: user.uid,
            username: username,
            timestamp: serverTimestamp(),
            likesCount: 0,
            likedBy: []
        });

        postContent.value = '';
        postImageUrl.value = '';
        showMessage(postMessage, "Post publicado com sucesso!");
        showSection(feedSection); // Go back to feed after publishing
    } catch (error) {
        showMessage(postMessage, "Erro ao publicar post.", 'error');
        console.error("Erro ao publicar post:", error);
    }
});

// --- Função para Curtir/Descurtir um Post ---
async function toggleLike(postId, likeButtonElement) {
    const user = auth.currentUser;
    if (!user) {
        showMessage(postMessage, "Você precisa estar logado para curtir posts.", 'error');
        return;
    }

    const postRef = doc(db, "posts", postId);
    const userId = user.uid;

    try {
        const postDocSnap = await getDoc(postRef);
        if (!postDocSnap.exists()) {
            console.error("Post não encontrado para curtir/descurtir:", postId);
            showMessage(postMessage, "Post não encontrado.", 'error');
            return;
        }
        const postData = postDocSnap.data();
        const latestLikedBy = postData.likedBy || [];
        const isCurrentlyLiked = latestLikedBy.includes(userId);
        const currentLikes = postData.likesCount || 0;

        if (isCurrentlyLiked) {
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

            const postOwnerId = postData.userId;
            const currentUserDoc = await getDoc(doc(db, "users", user.uid));
            let currentUserUsername = user.email;
            if (currentUserDoc.exists()) {
                 currentUserUsername = currentUserDoc.data().username || user.email;
            }

            if (postOwnerId !== user.uid) {
                addNotification(postOwnerId, user.uid, currentUserUsername, 'like', `curtiu seu post: "${postData.content.substring(0, 30)}..."`, postId);
            }
        }
        // The onSnapshot in loadPosts will automatically update the UI
    } catch (error) {
        console.error("Erro ao curtir/descurtir o post:", error);
        showMessage(postMessage, "Erro ao processar sua curtida.", 'error');
    }
}

// --- Funções de Comentário ---

async function addComment(postId, commentText) {
    const user = auth.currentUser;
    if (!user) {
        showMessage(postMessage, "Você precisa estar logado e digitar um comentário.", 'error');
        return;
    }
    if (!commentText.trim()) {
        showMessage(postMessage, "Por favor, digite um comentário válido.", 'error');
        return;
    }

    try {
        const userDocSnapshot = await getDoc(doc(db, "users", user.uid));
        let username = user.email;
        if (userDocSnapshot.exists()) {
            username = userDocSnapshot.data().username || user.email;
        } else {
             console.warn("Documento do usuário não encontrado para UID:", user.uid, "Usando email para comentário.");
        }

        const commentsCollectionRef = collection(db, "posts", postId, "comments");
        await addDoc(commentsCollectionRef, {
            userId: user.uid,
            username: username,
            text: commentText,
            timestamp: serverTimestamp()
        });
        // No need to show message here, as onSnapshot will update comments list
        // showMessage(postMessage, "Comentário adicionado com sucesso!");

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

function setupCommentsListener(postId, commentsListElement) {
    const commentsCollectionRef = collection(db, "posts", postId, "comments");
    const q = query(commentsCollectionRef, orderBy("timestamp", "asc"));

    return onSnapshot(q, (snapshot) => {
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
        commentsListElement.scrollTop = commentsListElement.scrollHeight;
    }, (error) => {
        console.error("Erro ao carregar comentários:", error);
        showMessage(postMessage, "Erro ao carregar comentários.", 'error');
    });
}

// --- Carregar Posts (Feed) ---
const postElementsMap = new Map();
const commentsUnsubscribeMap = new Map();

function loadPosts() {
    const q = query(collection(db, "posts"), orderBy("timestamp", "asc"));

    // Use onSnapshot here to get real-time updates and initial load
    onSnapshot(q, (snapshot) => {
        const postIdsFromFirebase = new Set();
        const currentUser = auth.currentUser; // Get current user once

        snapshot.forEach((docSnap) => {
            const post = docSnap.data();
            const postId = docSnap.id;
            postIdsFromFirebase.add(postId);

            const isLiked = currentUser ? (post.likedBy || []).includes(currentUser.uid) : false;

            // If post already exists in DOM, just update its dynamic parts
            if (postElementsMap.has(postId)) {
                const existingPostElement = postElementsMap.get(postId);
                const likeBtn = existingPostElement.querySelector('.like-button');
                const newLikesCount = post.likesCount || 0;

                // Update text content and image if they change
                const contentP = existingPostElement.querySelector('p');
                if (contentP && contentP.textContent !== post.content) {
                    contentP.textContent = post.content;
                }
                const imagePreview = existingPostElement.querySelector('.post-image-preview');
                if (post.imageUrl && (!imagePreview || imagePreview.src !== post.imageUrl)) {
                    if (imagePreview) {
                        imagePreview.src = post.imageUrl;
                    } else { // Create image if it's new
                         const imgElement = document.createElement('img');
                         imgElement.src = post.imageUrl;
                         imgElement.alt = "Post Image";
                         imgElement.classList.add('post-image-preview');
                         contentP.after(imgElement); // Insert after content
                    }
                } else if (!post.imageUrl && imagePreview) {
                    imagePreview.remove(); // Remove image if URL is cleared
                }


                if (parseInt(likeBtn.dataset.likesCount) !== newLikesCount || likeBtn.classList.contains('liked') !== isLiked) {
                    likeBtn.innerHTML = `❤️ ${newLikesCount}`;
                    likeBtn.classList.toggle('liked', isLiked);
                    likeBtn.dataset.likesCount = newLikesCount;
                }
                // Update timestamp
                const smallElement = existingPostElement.querySelector('small');
                if (smallElement) {
                    smallElement.textContent = post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Carregando...';
                }
                return; // Skip creating a new element
            }

            // Create new post element
            const postElement = document.createElement('div');
            postElement.classList.add('post-card');
            postElement.setAttribute('data-post-id', postId);

            let imageHtml = '';
            // FIX: Ensure imageHtml is correctly generated if imageUrl exists
            if (post.imageUrl) {
                imageHtml = `<img src="${post.imageUrl}" alt="Post Image" class="post-image-preview">`;
            }

            // Add link preview if available
            let linkPreviewHtml = '';
            if (post.linkPreview && post.linkPreview.url) {
                linkPreviewHtml = `
                    <div class="link-preview-box">
                        ${post.linkPreview.image ? `<img src="${post.linkPreview.image}" class="link-preview-img">` : ''}
                        <div class="link-preview-texts">
                            <strong>${post.linkPreview.title || 'Link'}</strong>
                            <p>${post.linkPreview.description || ''}</p>
                            <a href="${post.linkPreview.url}" target="_blank" style="color:#6A0DAD;">${post.linkPreview.url}</a>
                        </div>
                    </div>
                `;
            }

            postElement.innerHTML = `
                <h3>${post.username || post.userId}</h3>
                <p>${post.content}</p>
                ${imageHtml}
                ${linkPreviewHtml}
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

            postsContainer.prepend(postElement); // Add new posts to the top
            postElementsMap.set(postId, postElement);

            // Add event listeners for new elements
            const likeButton = postElement.querySelector('.like-button');
            if (likeButton) {
                likeButton.addEventListener('click', () => toggleLike(postId, likeButton));
            }

            const commentToggleButton = postElement.querySelector('.comment-toggle-button');
            const postCommentsSection = postElement.querySelector('.post-comments');
            const commentsListElement = postCommentsSection.querySelector('.comments-list');
            const submitCommentButton = postCommentsSection.querySelector('.submit-comment-button');
            const commentInput = postCommentsSection.querySelector('.comment-input');

            if (commentToggleButton && postCommentsSection) {
                commentToggleButton.addEventListener('click', () => {
                    if (postCommentsSection.style.display === 'none') {
                        postCommentsSection.style.display = 'block';
                        const unsubscribe = setupCommentsListener(postId, commentsListElement);
                        commentsUnsubscribeMap.set(postId, unsubscribe);
                    } else {
                        postCommentsSection.style.display = 'none';
                        if (commentsUnsubscribeMap.has(postId)) {
                            commentsUnsubscribeMap.get(postId)();
                            commentsUnsubscribeMap.delete(postId);
                        }
                    }
                });
            }

            if (submitCommentButton && commentInput) {
                submitCommentButton.addEventListener('click', async () => {
                    const commentText = commentInput.value.trim();
                    if (commentText) {
                        await addComment(postId, commentText);
                        commentInput.value = '';
                    } else {
                        showMessage(postMessage, "Por favor, digite um comentário.", 'error');
                    }
                });
            }
        });

        // Remove posts that no longer exist in Firebase
        for (const [postId, element] of postElementsMap.entries()) {
            if (!postIdsFromFirebase.has(postId)) {
                element.remove();
                postElementsMap.delete(postId);
                if (commentsUnsubscribeMap.has(postId)) {
                    commentsUnsubscribeMap.get(postId)();
                    commentsUnsubscribeMap.delete(postId);
                }
            }
        }
    }, (error) => {
        console.error("Erro ao carregar posts:", error);
        showMessage(postsContainer, "Erro ao carregar posts.", 'error');
    });
}


// --- Chat Privado ---
let currentChatRecipientId = null;
let unsubscribeChat = null;

async function loadChatUsers() {
    chatRecipientSelect.innerHTML = '<option value="">Selecione um usuário</option>';
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("username"));
    try {
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
                const newRecipientId = event.target.value;
                if (newRecipientId && newRecipientId !== currentChatRecipientId) {
                    currentChatRecipientId = newRecipientId;
                    chatMessagesDisplay.innerHTML = '';
                    if (unsubscribeChat) {
                        unsubscribeChat();
                    }
                    listenForChatMessages(currentUser.uid, currentChatRecipientId);
                } else if (!newRecipientId) {
                    currentChatRecipientId = null;
                    chatMessagesDisplay.innerHTML = '';
                    if (unsubscribeChat) {
                        unsubscribeChat();
                    }
                }
            });
            chatRecipientSelect.dataset.listenerAdded = true;
        }

        if (currentChatRecipientId && chatRecipientSelect.querySelector(`option[value="${currentChatRecipientId}"]`)) {
            chatRecipientSelect.value = currentChatRecipientId;
            // The change event listener should handle loading messages if recipient is already selected
            // No need to explicitly call listenForChatMessages here unless it's for initial load and recipient is pre-selected
        }

    } catch (error) {
        console.error("Erro ao carregar usuários do chat:", error);
        showMessage(chatMessageDiv, "Erro ao carregar usuários.", 'error');
    }
}

function listenForChatMessages(user1Id, user2Id) {
    if (unsubscribeChat) {
        unsubscribeChat();
    }

    const chatCollectionRef = collection(db, "privateChats");

    const q1 = query(chatCollectionRef,
        where("senderId", "==", user1Id),
        where("recipientId", "==", user2Id)
    );
    const q2 = query(chatCollectionRef,
        where("senderId", "==", user2Id),
        where("recipientId", "==", user1Id)
    );

    // Using Promise.all with two onSnapshot listeners to merge and sort messages
    let unsubscribe1 = null;
    let unsubscribe2 = null;

    // Use a flag to ensure messages are displayed only after both listeners have fired at least once initially
    let q1InitialLoad = false;
    let q2InitialLoad = false;

    function renderAllMessages() {
        if (!q1InitialLoad || !q2InitialLoad) return; // Wait for both initial loads

        const allMessages = [];
        const snapshot1Docs = unsubscribe1.snapshot?.docs || [];
        const snapshot2Docs = unsubscribe2.snapshot?.docs || [];

        snapshot1Docs.forEach(doc => allMessages.push(doc.data()));
        snapshot2Docs.forEach(doc => allMessages.push(doc.data()));

        allMessages.sort((a, b) => {
            const timestampA = a.timestamp?.toDate() || new Date(0);
            const timestampB = b.timestamp?.toDate() || new Date(0);
            return timestampA.getTime() - timestampB.getTime();
        });

        chatMessagesDisplay.innerHTML = '';
        allMessages.forEach(message => {
            displayChatMessage(message);
        });
        chatMessagesDisplay.scrollTop = chatMessagesDisplay.scrollHeight;
    }

    unsubscribe1 = onSnapshot(q1, (snapshot) => {
        unsubscribe1.snapshot = snapshot; // Store snapshot for combined rendering
        q1InitialLoad = true;
        renderAllMessages();
    }, (error) => {
        console.error("Erro ao ouvir mensagens do chat (q1):", error);
        showMessage(chatMessageDiv, "Erro ao carregar mensagens.", 'error');
    });

    unsubscribe2 = onSnapshot(q2, (snapshot) => {
        unsubscribe2.snapshot = snapshot; // Store snapshot for combined rendering
        q2InitialLoad = true;
        renderAllMessages();
    }, (error) => {
        console.error("Erro ao ouvir mensagens do chat (q2):", error);
        showMessage(chatMessageDiv, "Erro ao carregar mensagens.", 'error');
    });

    unsubscribeChat = () => { // Combined unsubscribe function
        if (unsubscribe1) unsubscribe1();
        if (unsubscribe2) unsubscribe2();
    };
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

    const messageTimestamp = message.timestamp?.toDate ? message.timestamp.toDate() : new Date();

    messageElement.innerHTML = `
        <strong>${senderName}</strong>
        <p>${message.message || ''}</p>
        <small>${messageTimestamp.toLocaleTimeString()}</small>
    `;
    chatMessagesDisplay.appendChild(messageElement);
}

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
        const senderDocSnapshot = await getDoc(doc(db, "users", user.uid));
        let senderUsername = user.email;
        if (senderDocSnapshot.exists()) {
            senderUsername = senderDocSnapshot.data().username || user.email;
        } else {
            console.warn("Documento do remetente não encontrado para UID:", user.uid, "Usando email.");
        }

        await addDoc(collection(db, "privateChats"), {
            senderId: user.uid,
            senderUsername: senderUsername,
            recipientId: recipientId,
            message: text,
            type: 'text',
            timestamp: serverTimestamp()
        });

        showMessage(chatMessageDiv, "Mensagem enviada!");
        chatMessageInput.value = '';

        const recipientUserDoc = await getDoc(doc(db, "users", recipientId));
        let recipientUsername = recipientId;
        if (recipientUserDoc.exists()) {
            recipientUsername = recipientUserDoc.data().username || recipientId;
        }

        if (recipientId !== user.uid) {
            addNotification(recipientId, user.uid, senderUsername, 'chat_message', `enviou uma mensagem: "${text.substring(0, 30)}..."`);
        }

    } catch (error) {
        showMessage(chatMessageDiv, "Erro ao enviar mensagem.", 'error');
        console.error("Erro ao enviar mensagem de chat:", error);
    }
});

// --- NOVO: Funções de Notificação ---
async function addNotification(recipientId, senderId, senderUsername, type, message, relatedPostId = null) {
    if (recipientId === senderId) {
        return;
    }
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
    if (!userId) {
        console.warn("setupNotificationListener chamado sem userId.");
        return;
    }
    if (unsubscribeNotifications) {
        unsubscribeNotifications();
        console.log("Listener de notificações anterior desativado.");
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
        console.log(`Você tem ${snapshot.size} notificações não lidas.`);
    }, (error) => {
        console.error("Erro ao ouvir notificações:", error);
    });
    console.log("Listener de notificações ativado para:", userId);
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
        const notificationsToMarkAsRead = [];

        snapshot.forEach((doc) => {
            const notification = doc.data();
            const notificationId = doc.id;

            const notificationElement = document.createElement('div');
            notificationElement.classList.add('notification-item');
            if (!notification.read) {
                notificationElement.classList.add('unread');
                // notificationsToMarkAsRead.push(notificationId); // Moved to click listener or a "Mark all read" button
            }

            let displayMessage = `${notification.senderUsername || 'Usuário Desconhecido'} ${notification.message}`;
            if (notification.type === 'like' || notification.type === 'comment') {
                displayMessage += ` (Post: ${notification.relatedPostId ? notification.relatedPostId.substring(0, 5) + '...' : 'N/A'})`;
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

        // Consider adding a "Mark All as Read" button instead of doing it automatically on load
        // if (notificationsToMarkAsRead.length > 0) {
        //     for (const id of notificationsToMarkAsRead) {
        //         await markNotificationAsRead(id);
        //     }
        // }
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
        console.log("Notificação marcada como lida:", notificationId);
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        showMessage(notificationsSection, "Erro ao marcar notificação como lida.", 'error');
    }
}

// --- NOVO: Funções de Perfil do Usuário ---
async function loadUserProfile() {
    const user = auth.currentUser;
    if (!user) {
        showMessage(profileMessage, "Você precisa estar logado para ver seu perfil.", 'error');
        return;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            profileEmailDisplay.textContent = userData.email || user.email;
            profileUsernameInput.value = userData.username || '';
        } else {
            profileEmailDisplay.textContent = user.email;
            profileUsernameInput.value = '';
            console.warn("Documento do usuário não encontrado no Firestore para perfil.");
            await setDoc(doc(db, "users", user.uid), { email: user.email }, { merge: true });
        }
    } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        showMessage(profileMessage, "Erro ao carregar dados do perfil.", 'error');
    }
}

saveProfileBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        showMessage(profileMessage, "Você precisa estar logado para atualizar seu perfil.", 'error');
        return;
    }

    const newUsername = profileUsernameInput.value.trim();

    if (!newUsername) {
        showMessage(profileMessage, "O nome de usuário não pode ser vazio.", 'error');
        return;
      }

    try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            username: newUsername
        });
        showMessage(profileMessage, "Nome de usuário atualizado com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        showMessage(profileMessage, "Erro ao atualizar perfil: " + error.message, 'error');
    }
});

// Initialization: Hide all forms and let onAuthStateChanged handle the initial display
document.addEventListener('DOMContentLoaded', () => {
    hideAllForms();
    console.log("DOM totalmente carregado.");
});
                         
