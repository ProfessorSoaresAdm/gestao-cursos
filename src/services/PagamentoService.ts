/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getStoredData, saveStoredData, Payment, STORAGE_KEYS, PaymentStatus, PaymentMethod } from './db';
import { ProfessorService } from './ProfessorService';

export const PagamentoService = {
  getPayments(): Payment[] {
    return getStoredData<Payment>(STORAGE_KEYS.PAYMENTS);
  },

  calculateStatus(payment: Payment): PaymentStatus | 'atrasado' {
    if (payment.status === 'pago') return 'pago';
    if (payment.status === 'cancelado') return 'cancelado';
    
    // Status is 'pendente'. Check if overdue.
    // Normalized current time (or base it on user's system time)
    const todayStr = new Date().toISOString().split('T')[0];
    if (payment.dueDate < todayStr) {
      return 'atrasado';
    }
    return 'pendente';
  },

  createPayment(data: Omit<Payment, 'id'>): Payment {
    if (!data.description.trim()) {
      throw new Error('A descrição do pagamento é obrigatória.');
    }
    if (!data.professorId) {
      throw new Error('É necessário vincular um professor.');
    }
    if (data.amount <= 0) {
      throw new Error('O valor do pagamento deve ser maior que R$ 0,00.');
    }
    if (!data.dueDate) {
      throw new Error('A data de vencimento é obrigatória.');
    }

    // Check if professor is active before linking (RN-01)
    const professors = ProfessorService.getProfessors();
    const prof = professors.find(p => p.id === data.professorId);
    if (!prof) {
      throw new Error('Professor não encontrado.');
    }
    if (!prof.isActive) {
      throw new Error('Regra de Negócio (RN-01): Não é possível vincular um professor desativado a novos pagamentos.');
    }

    const payments = getStoredData<Payment>(STORAGE_KEYS.PAYMENTS);
    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}`
    };

    payments.push(newPayment);
    saveStoredData(STORAGE_KEYS.PAYMENTS, payments);
    return newPayment;
  },

  updatePayment(id: string, data: Partial<Omit<Payment, 'id'>>): Payment {
    const payments = getStoredData<Payment>(STORAGE_KEYS.PAYMENTS);
    const index = payments.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error('Pagamento não encontrado.');
    }

    if (data.description !== undefined && !data.description.trim()) {
      throw new Error('A descrição não pode ser vazia.');
    }

    if (data.professorId) {
      const professors = ProfessorService.getProfessors();
      const prof = professors.find(p => p.id === data.professorId);
      if (!prof) {
        throw new Error('Professor não encontrado.');
      }
      if (prof.id !== payments[index].professorId && !prof.isActive) {
        throw new Error('Regra de Negócio (RN-01): Não é possível candidatar um professor desativado a pagamentos.');
      }
    }

    const updated = {
      ...payments[index],
      ...data
    };

    payments[index] = updated;
    saveStoredData(STORAGE_KEYS.PAYMENTS, payments);
    return updated;
  },

  markAsPaid(id: string, paymentDate: string, paymentMethod: PaymentMethod | string): Payment {
    if (!paymentDate) {
      throw new Error('A data de pagamento é obrigatória.');
    }
    if (!paymentMethod) {
      throw new Error('O método de pagamento é obrigatório.');
    }

    return this.updatePayment(id, {
      status: 'pago',
      paymentDate,
      paymentMethod
    });
  },

  cancelPayment(id: string): Payment {
    // Pagamentos não devem ser deletados — apenas cancelados (status = "cancelado") (RF-04.11 / RN-06)
    return this.updatePayment(id, { status: 'cancelado' });
  }
};
