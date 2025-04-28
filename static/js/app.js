// User management functionality
let users = JSON.parse(localStorage.getItem('users')) || [];
let editingUserId = null;

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const loginForm = document.getElementById('loginForm');
const userForm = document.getElementById('userForm');
const userModal = document.getElementById('userModal');
const modalTitle = document.getElementById('modalTitle');
const usersTableBody = document.getElementById('usersTableBody');
const searchInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
userForm.addEventListener('submit', handleUserSubmit);
document.getElementById('addUserBtn').addEventListener('click', showAddUserModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('logoutBtn').addEventListener('click', handleLogout);
searchInput.addEventListener('input', filterUsers);
roleFilter.addEventListener('change', filterUsers);

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    loginPage.style.display = isLoggedIn ? 'none' : 'flex';
    dashboardPage.style.display = isLoggedIn ? 'block' : 'none';
    if (isLoggedIn) renderUsers();
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem('isLoggedIn', 'true');
            showToast('Login successful!', 'success');
            checkAuth();
        } else {
            showToast('Invalid credentials!', 'error');
        }
    } catch (error) {
        showToast('Login failed!', 'error');
    }
}

// Logout Handler
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    checkAuth();
    showToast('Logged out successfully!', 'success');
}

// Generate Random ID
function generateId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Show Add User Modal
function showAddUserModal() {
    editingUserId = null;
    modalTitle.textContent = 'Add New User';
    userForm.reset();
    userModal.classList.remove('hidden');
}

// Show Edit User Modal
function showEditUserModal(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    editingUserId = userId;
    modalTitle.textContent = 'Edit User';
    document.getElementById('userName').value = user.name;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userContact').value = user.contact;
    userModal.classList.remove('hidden');
}

// Close Modal
function closeModal() {
    userModal.classList.add('hidden');
    userForm.reset();
    editingUserId = null;
}

// Handle User Form Submit
async function handleUserSubmit(e) {
    e.preventDefault();

    const userData = {
        name: document.getElementById('userName').value,
        role: document.getElementById('userRole').value,
        email: document.getElementById('userEmail').value,
        contact: document.getElementById('userContact').value,
        id: editingUserId || generateId(),
        image: document.getElementById('userImage').files[0] ? 
            await getBase64(document.getElementById('userImage').files[0]) : 
            'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    };

    if (editingUserId) {
        const index = users.findIndex(u => u.id === editingUserId);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            showToast('User updated successfully!', 'success');
        }
    } else {
        users.push(userData);
        showToast('User added successfully!', 'success');
    }

    localStorage.setItem('users', JSON.stringify(users));
    closeModal();
    renderUsers();
}

// Delete User
function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(user => user.id !== userId);
        localStorage.setItem('users', JSON.stringify(users));
        renderUsers();
        showToast('User deleted successfully!', 'success');
    }
}

// Convert Image to Base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Filter Users
function filterUsers() {
    const searchTerm = searchInput.value.toLowerCase();
    const roleValue = roleFilter.value;

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm);
        const matchesRole = !roleValue || user.role === roleValue;
        return matchesSearch && matchesRole;
    });

    renderUsers(filteredUsers);
}

// Render Users Table
function renderUsers(filteredUsers = users) {
    usersTableBody.innerHTML = '';

    if (filteredUsers.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No users found. Click "Add User" to create one!
                </td>
            </tr>
        `;
        return;
    }

    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <img class="h-10 w-10 rounded-full" src="${user.image}" alt="">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${user.name}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.role}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.contact}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="showEditUserModal('${user.id}')" class="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;
        usersTableBody.appendChild(row);
    });
}

// Show Toast Message
function showToast(message, type = 'success') {
    Toastify({
        text: message,
        duration: 3000,
        gravity: 'top',
        position: 'right',
        backgroundColor: type === 'success' ? '#48bb78' : '#f56565',
    }).showToast();
}

// Initialize
checkAuth();