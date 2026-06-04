/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getStoredData, saveStoredData, ClassSession, STORAGE_KEYS, ClassStatus } from './db';
import { ProfessorService } from './ProfessorService';

export const AulaService = {
  getClasses(): ClassSession[] {
    return getStoredData<ClassSession>(STORAGE_KEYS.CLASSES);
  },

  createClass(data: Omit<ClassSession, 'id'>): ClassSession {
    if (!data.title.trim()) {
      throw new Error('O título da aula é obrigatório.');
    }
    if (!data.professorId) {
      throw new Error('É necessário vincular um professor à aula.');
    }
    if (!data.dateTime) {
      throw new Error('A data e hora são obrigatórias.');
    }
    if (data.durationMinutes <= 0) {
      throw new Error('A duração da aula deve ser maior que zero minutos.');
    }

    // Check if professor is active before linking (RN-01)
    const professors = ProfessorService.getProfessors();
    const prof = professors.find(p => p.id === data.professorId);
    if (!prof) {
      throw new Error('Professor não encontrado.');
    }
    if (!prof.isActive) {
      throw new Error('Regra de Negócio (RN-01): Não é possível vincular um professor desativado a novas aulas.');
    }

    const classes = getStoredData<ClassSession>(STORAGE_KEYS.CLASSES);
    const newClass: ClassSession = {
      ...data,
      id: `cls-${Date.now()}`
    };

    classes.push(newClass);
    saveStoredData(STORAGE_KEYS.CLASSES, classes);
    return newClass;
  },

  updateClass(id: string, data: Partial<Omit<ClassSession, 'id'>>): ClassSession {
    const classes = getStoredData<ClassSession>(STORAGE_KEYS.CLASSES);
    const index = classes.findIndex(c => c.id === id);

    if (index === -1) {
      throw new Error('Aula não encontrada.');
    }

    if (data.title !== undefined && !data.title.trim()) {
      throw new Error('O título da aula não pode ser vazio.');
    }

    if (data.professorId) {
      const professors = ProfessorService.getProfessors();
      const prof = professors.find(p => p.id === data.professorId);
      if (!prof) {
        throw new Error('Professor não encontrado.');
      }
      // If we are changing the professor, check that the new one is active!
      if (prof.id !== classes[index].professorId && !prof.isActive) {
        throw new Error('Regra de Negócio (RN-01): Não é possível vincular um professor desativado a aulas.');
      }
    }

    // Clean up recording URL if status shifts away from 'realizada'
    let updatedRecordingUrl = data.recordingUrl;
    const nextStatus = data.status || classes[index].status;
    if (nextStatus !== 'realizada') {
      updatedRecordingUrl = undefined;
    }

    const updated = {
      ...classes[index],
      ...data,
      recordingUrl: updatedRecordingUrl
    };

    classes[index] = updated;
    saveStoredData(STORAGE_KEYS.CLASSES, classes);
    return updated;
  },

  updateClassStatus(id: string, status: ClassStatus): ClassSession {
    return this.updateClass(id, { status });
  }
};
