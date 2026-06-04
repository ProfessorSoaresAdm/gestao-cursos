/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getStoredData, saveStoredData, Staff, STORAGE_KEYS, StaffStatus } from './db';

export const PessoalService = {
  getStaff(userRole: string): Staff[] {
    if (userRole !== 'admin') {
      throw new Error('Acesso não autorizado: Módulo oculto e restrito a administradores.');
    }
    return getStoredData<Staff>(STORAGE_KEYS.STAFF);
  },

  createStaff(userRole: string, data: Omit<Staff, 'id'>): Staff {
    if (userRole !== 'admin') {
      throw new Error('Acesso não autorizado.');
    }
    if (!data.name.trim()) {
      throw new Error('O nome do funcionário é obrigatório.');
    }
    if (data.salary < 0) {
      throw new Error('O salário não pode ser de valor negativo.');
    }

    const staffList = getStoredData<Staff>(STORAGE_KEYS.STAFF);
    const newStaff: Staff = {
      ...data,
      id: `stf-${Date.now()}`
    };

    staffList.push(newStaff);
    saveStoredData(STORAGE_KEYS.STAFF, staffList);
    return newStaff;
  },

  updateStaff(userRole: string, id: string, data: Partial<Omit<Staff, 'id'>>): Staff {
    if (userRole !== 'admin') {
      throw new Error('Acesso não autorizado.');
    }

    const staffList = getStoredData<Staff>(STORAGE_KEYS.STAFF);
    const index = staffList.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error('Funcionário não encontrado.');
    }

    if (data.name !== undefined && !data.name.trim()) {
      throw new Error('O nome do funcionário é obrigatório.');
    }

    // Set termination date if status inativo is selected
    let updatedTerminationDate = data.terminationDate;
    const nextStatus = data.status || staffList[index].status;
    if (nextStatus === 'inativo' && !staffList[index].terminationDate && !updatedTerminationDate) {
      updatedTerminationDate = new Date().toISOString().split('T')[0];
    } else if (nextStatus !== 'inativo') {
      updatedTerminationDate = undefined;
    }

    const updated = {
      ...staffList[index],
      ...data,
      terminationDate: updatedTerminationDate
    };

    staffList[index] = updated;
    saveStoredData(STORAGE_KEYS.STAFF, staffList);
    return updated;
  },

  deactivateStaff(userRole: string, id: string): Staff {
    // Soft delete: set status to inativo (RN-06)
    return this.updateStaff(userRole, id, { status: 'inativo' });
  }
};
