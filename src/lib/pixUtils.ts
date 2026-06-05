export type PixTipo = 'cpf'|'cnpj'|'email'|'telefone'|'aleatoria';

export interface PixPayloadParams {
  chave: string;
  tipo: PixTipo;
  nomeRecebedor: string;
  cidadeRecebedor: string;
  valor?: number;
  txid?: string;
}

// Auxiliar para formatar TLV (Tag, Length, Value)
function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

export function gerarPixPayload(params: PixPayloadParams): string {
  // Limpar dados
  let chave = params.chave;
  if (params.tipo === 'telefone') {
    chave = chave.replace(/\D/g, '');
    if (!chave.startsWith('+55')) {
      chave = `+55${chave}`;
    }
  } else if (params.tipo === 'cpf' || params.tipo === 'cnpj') {
    chave = chave.replace(/\D/g, '');
  }

  const gui = tlv('00', 'br.gov.bcb.pix');
  const chavePix = tlv('01', chave);
  const merchantAccountInfo = tlv('26', gui + chavePix);

  const txid = params.txid ? params.txid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) : '***';
  const additionalData = tlv('62', tlv('05', txid));

  const nome = params.nomeRecebedor.substring(0, 25).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cidade = params.cidadeRecebedor.substring(0, 15).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let payload = '';
  payload += tlv('00', '01'); // Payload Format Indicator
  payload += merchantAccountInfo;
  payload += tlv('52', '0000'); // Merchant Category Code
  payload += tlv('53', '986');  // Transaction Currency
  
  if (params.valor !== undefined && params.valor > 0) {
    payload += tlv('54', params.valor.toFixed(2));
  }
  
  payload += tlv('58', 'BR'); // Country Code
  payload += tlv('59', nome); // Merchant Name
  payload += tlv('60', cidade); // Merchant City
  payload += additionalData;
  payload += '6304'; // CRC prefix

  const crc = crc16(payload);
  return payload + crc;
}

function crc16(str: string): string {
  let polinomio = 0x1021;
  let resultado = 0xFFFF;

  for (let i = 0; i < str.length; i++) {
    resultado ^= str.charCodeAt(i) << 8;
    for (let bitwise = 0; bitwise < 8; bitwise++) {
      if ((resultado <<= 1) & 0x10000) {
        resultado ^= polinomio;
      }
      resultado &= 0xFFFF;
    }
  }

  return resultado.toString(16).toUpperCase().padStart(4, '0');
}

export function formatarChavePix(chave: string, tipo: PixTipo): string {
  if (!chave) return '';
  const limpa = chave.replace(/[^\w\s@.-]/g, '');
  
  if (tipo === 'cpf') {
    const n = limpa.replace(/\D/g, '');
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (tipo === 'cnpj') {
    const n = limpa.replace(/\D/g, '');
    return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  if (tipo === 'telefone') {
    const n = limpa.replace(/\D/g, '');
    if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (n.length === 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return n;
  }
  return limpa;
}

export function validarChavePix(chave: string, tipo: PixTipo): boolean {
  if (!chave) return false;
  if (tipo === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave);
  if (tipo === 'cpf') return chave.replace(/\D/g, '').length === 11;
  if (tipo === 'cnpj') return chave.replace(/\D/g, '').length === 14;
  if (tipo === 'telefone') return chave.replace(/\D/g, '').length >= 10;
  if (tipo === 'aleatoria') return chave.length > 10;
  return true;
}
