/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Professor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  document: string; // CPF
  address: string;
  observations: string;
  isActive: boolean;
}

export type ClassStatus = 'agendada' | 'realizada' | 'cancelada';

export interface ClassSession {
  id: string;
  title: string;
  professorId: string;
  dateTime: string; // ISO String or YYYY-MM-DDTHH:mm
  durationMinutes: number;
  status: ClassStatus;
  transmissionLink: string;
  recordingUrl?: string;
  observations: string;
}

export type PaymentStatus = 'pendente' | 'pago' | 'cancelado';
export type PaymentMethod = 'Pix' | 'Dinheiro' | 'Transferência Bancária' | 'Boleto' | 'Cartão';

export interface Payment {
  id: string;
  description: string;
  professorId: string;
  classSessionId?: string;
  amount: number; // raw number
  dueDate: string; // YYYY-MM-DD
  status: PaymentStatus;
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod | string;
  observations: string;
}

export type StaffStatus = 'ativo' | 'inativo' | 'férias' | 'afastado';

export interface Staff {
  id: string;
  name: string;
  role: string; // Cargo
  email: string;
  phone: string;
  admissionDate: string; // YYYY-MM-DD
  status: StaffStatus;
  salary: number; // Sensível, não deve aparecer na listagem ou exportação CSV
  terminationDate?: string;
  observations: string;
}

// Simulated active session
export interface AuthSession {
  user: User;
}

const STORAGE_KEYS = {
  USERS: 'escolar_users',
  PROFESSORS: 'escolar_professors',
  CLASSES: 'escolar_classes',
  PAYMENTS: 'escolar_payments',
  STAFF: 'escolar_staff',
  SESSION: 'escolar_session',
};

// Seed initial data
const INITIAL_USERS: User[] = [
  { id: 'usr-1', name: 'Carlos Silva (Diretor)', email: 'admin@empresa.com', role: 'admin', isActive: true },
  { id: 'usr-2', name: 'Mariana Souza (Coordenadora)', email: 'editor@empresa.com', role: 'editor', isActive: true },
  { id: 'usr-3', name: 'Ronaldo Santos (Secretário)', email: 'viewer@empresa.com', role: 'viewer', isActive: true },
];

const INITIAL_PROFESSORS: Professor[] = [
  {
    id: 'prof-1',
    name: 'Sofia Oliveira',
    email: 'sofia.oliveira@escola.com',
    phone: '(11) 98765-4321',
    specialty: 'Matemática',
    document: '123.456.789-00',
    address: 'Av. Paulista, 1000 - São Paulo/SP',
    observations: 'Professora titular do Ensino Médio. Especialista em Álgebra.',
    isActive: true
  },
  {
    id: 'prof-2',
    name: 'André Costa',
    email: 'andre.costa@escola.com',
    phone: '(11) 97654-3210',
    specialty: 'História',
    document: '987.654.321-11',
    address: 'Rua das Flores, 45 - Campinas/SP',
    observations: 'Foco em história do Brasil e revoluções industriais.',
    isActive: true
  },
  {
    id: 'prof-3',
    name: 'Beatriz Almeida',
    email: 'beatriz.almeida@escola.com',
    phone: '(11) 96543-2109',
    specialty: 'Física',
    document: '456.789.123-22',
    address: 'Av. Brasil, 300 - Jundiaí/SP',
    observations: 'Professora do cursinho pré-vestibular.',
    isActive: true
  },
  {
    id: 'prof-4',
    name: 'Ricardo Pereira',
    email: 'ricardo.pereira@escola.com',
    phone: '(11) 95432-1098',
    specialty: 'Geografia',
    document: '789.123.456-33',
    address: 'Rua Bela Vista, 12 - São Paulo/SP',
    observations: 'Afastado por motivos de estudos internacionais.',
    isActive: false
  }
];

const INITIAL_CLASSES: ClassSession[] = [
  {
    id: 'cls-1',
    title: 'Álgebra Linear I - Vetores e Matrizes',
    professorId: 'prof-1',
    dateTime: '2026-06-03T14:00',
    durationMinutes: 90,
    status: 'realizada',
    transmissionLink: 'https://meet.google.com/abc-defg-hij',
    recordingUrl: 'https://drive.google.com/file/d/12345/view',
    observations: 'Primeira aula concluída com 100% de presença.'
  },
  {
    id: 'cls-2',
    title: 'Antiguidade Clássica e Filosofia Grega',
    professorId: 'prof-2',
    dateTime: '2026-06-05T09:00',
    durationMinutes: 60,
    status: 'agendada',
    transmissionLink: 'https://meet.google.com/xyz-uvwx-yzq',
    observations: 'Preparar material complementar de slide.'
  },
  {
    id: 'cls-3',
    title: 'Cinemática Vetorial e Leis de Newton',
    professorId: 'prof-3',
    dateTime: '2026-06-10T16:00',
    durationMinutes: 60,
    status: 'agendada',
    transmissionLink: 'https://meet.google.com/rst-uvwx-yza',
    observations: 'Aula teórica e resolução de exercícios comentados.'
  },
  {
    id: 'cls-4',
    title: 'Física Termodinâmica Experimental',
    professorId: 'prof-3',
    dateTime: '2026-05-20T10:00',
    durationMinutes: 120,
    status: 'cancelada',
    transmissionLink: 'https://meet.google.com/hjk-asdf-qew',
    observations: 'Falta de energia no laboratório.'
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    description: 'Honorário de Aulas - Sofia Oliveira (Ref Junho/2026)',
    professorId: 'prof-1',
    classSessionId: 'cls-1',
    amount: 3500.00,
    dueDate: '2026-06-10',
    status: 'pendente',
    observations: 'Pagamento referente às aulas realizadas no início do mês.'
  },
  {
    id: 'pay-2',
    description: 'Honorário Mensal - André Costa (Ref Junho/2026)',
    professorId: 'prof-2',
    amount: 2800.00,
    dueDate: '2026-06-15',
    status: 'pendente',
    observations: 'Acordo fixo mensal.'
  },
  {
    id: 'pay-3',
    description: 'Aula Extra Álgebra - Sofia Oliveira',
    professorId: 'prof-1',
    amount: 850.00,
    dueDate: '2026-05-28',
    status: 'pago',
    paymentDate: '2026-05-28',
    paymentMethod: 'Pix',
    observations: 'Comprovante anexado no arquivo físico.'
  },
  {
    id: 'pay-4',
    description: 'Honorário Atrasado Simulado de Maio - André Costa',
    professorId: 'prof-2',
    amount: 1200.00,
    dueDate: '2026-05-15', // Anterior ao dia do local time (2026-06-04), será "Atrasado"
    status: 'pendente',
    observations: 'Vencido. Entrar em contato para agilizar quitação.'
  }
];

const INITIAL_STAFF: Staff[] = [
  {
    id: 'stf-1',
    name: 'Marcos Dias',
    role: 'Secretário Geral',
    email: 'marcos.dias@escola.com',
    phone: '(11) 91111-2222',
    admissionDate: '2024-01-10',
    status: 'ativo',
    salary: 4500.00,
    observations: 'Responsável pela secretaria escolar e matrículas.'
  },
  {
    id: 'stf-2',
    name: 'Ana Júlia Pereira',
    role: 'Auxiliar Administrativo',
    email: 'ana.julia@escola.com',
    phone: '(11) 92222-3333',
    admissionDate: '2025-03-01',
    status: 'ativo',
    salary: 2500.00,
    observations: 'Atendimento telefônico e organização de arquivos de alunos.'
  },
  {
    id: 'stf-3',
    name: 'Jonas Mendes',
    role: 'Coordenador Operacional',
    email: 'jonas.mendes@escola.com',
    phone: '(11) 93333-4444',
    admissionDate: '2023-08-15',
    status: 'férias',
    salary: 6000.00,
    observations: 'Em férias regulamentares retornando em 15 dias.'
  }
];

// Database initializing mechanism
export function initializeDB() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFESSORS)) {
    localStorage.setItem(STORAGE_KEYS.PROFESSORS, JSON.stringify(INITIAL_PROFESSORS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
  }
}

// Low-level read/write operations with role checks simulated
export function getStoredData<T>(key: string): T[] {
  initializeDB();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export function saveStoredData<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Global active session
export function getActiveSession(): AuthSession | null {
  const sessionRaw = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!sessionRaw) return null;
  
  // Verify user still active
  const session = JSON.parse(sessionRaw) as AuthSession;
  const users = getStoredData<User>(STORAGE_KEYS.USERS);
  const found = users.find(u => u.id === session.user.id);
  if (!found || !found.isActive) {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    return null;
  }
  return session;
}

export function setActiveSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

export { STORAGE_KEYS };
