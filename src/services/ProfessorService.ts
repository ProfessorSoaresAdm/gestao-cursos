/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getStoredData, saveStoredData, Professor, STORAGE_KEYS } from './db';

export const ProfessorService = {
  getProfessors(): Professor[] {
    return getStoredData<Professor>(STORAGE_KEYS.PROFESSORS);
  },

  getActiveProfessors(): Professor[] {
    return getStoredData<Professor>(STORAGE_KEYS.PROFESSORS).filter(p => p.isActive);
  },

  createProfessor(data: Omit<Professor, 'id'>): Professor {
    if (!data.name.trim()) {
      throw new Error('O nome do professor é obrigatório.');
    }
    
    // Simple email verification if populated
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      throw new Error('E-mail em formato inválido.');
    }

    const professors = getStoredData<Professor>(STORAGE_KEYS.PROFESSORS);
    const newProfessor: Professor = {
      ...data,
      id: `prof-${Date.now()}`,
      isActive: true
    };

    professors.push(newProfessor);
    saveStoredData(STORAGE_KEYS.PROFESSORS, professors);
    return newProfessor;
  },

  updateProfessor(id: string, data: Partial<Omit<Professor, 'id'>>): Professor {
    const professors = getStoredData<Professor>(STORAGE_KEYS.PROFESSORS);
    const index = professors.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error('Professor não encontrado.');
    }

    if (data.name !== undefined && !data.name.trim()) {
      throw new Error('O nome do professor não pode ser vazio.');
    }

    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      throw new Error('E-mail em formato inválido.');
    }

    const updated = {
      ...professors[index],
      ...data
    };

    professors[index] = updated;
    saveStoredData(STORAGE_KEYS.PROFESSORS, professors);
    return updated;
  },

  deactivateProfessor(id: string): Professor {
    // Soft delete: set isActive to false
    return this.updateProfessor(id, { isActive: false });
  },

  activateProfessor(id: string): Professor {
    return this.updateProfessor(id, { isActive: true });
  }
};
