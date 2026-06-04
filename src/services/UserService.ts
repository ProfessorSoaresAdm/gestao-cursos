/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getStoredData, saveStoredData, STORAGE_KEYS, User, UserRole, getActiveSession, setActiveSession } from './db';

export const UserService = {
  // Authentication
  login(email: string): User | null {
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    
    if (found) {
      if (!found.isActive) {
        throw new Error('Este usuário está desativado e não pode realizar login.');
      }
      setActiveSession({ user: found });
      return found;
    }
    return null;
  },

  logout() {
    setActiveSession(null);
  },

  getCurrentUser(): User | null {
    const session = getActiveSession();
    return session ? session.user : null;
  },

  // CRUD
  getAllUsers(): User[] {
    return getStoredData<User>(STORAGE_KEYS.USERS);
  },

  updateUserRole(userId: string, targetRole: UserRole, editorEmail: string): User {
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }

    const targetUser = users[userIndex];
    if (targetUser.email.toLowerCase() === editorEmail.toLowerCase()) {
      throw new Error('Regra de Negócio (RN-09): Você não pode alterar sua própria função (role) para evitar auto-bloqueio.');
    }

    targetUser.role = targetRole;
    users[userIndex] = targetUser;
    
    saveStoredData(STORAGE_KEYS.USERS, users);
    return targetUser;
  },

  toggleUserStatus(userId: string, editorEmail: string): User {
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }

    const targetUser = users[userIndex];
    if (targetUser.email.toLowerCase() === editorEmail.toLowerCase()) {
      throw new Error('Regra de Negócio (RN-09): Você não pode desativar seu próprio usuário para evitar auto-bloqueio.');
    }

    targetUser.isActive = !targetUser.isActive;
    users[userIndex] = targetUser;
    
    saveStoredData(STORAGE_KEYS.USERS, users);
    return targetUser;
  },

  createUser(name: string, email: string, role: UserRole): User {
    const users = getStoredData<User>(STORAGE_KEYS.USERS);
    
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      throw new Error('Já existe um usuário com este e-mail.');
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      isActive: true,
    };

    users.push(newUser);
    saveStoredData(STORAGE_KEYS.USERS, users);
    return newUser;
  }
};
