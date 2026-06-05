const fs = require('fs');

const content = fs.readFileSync('aulas.csv', 'utf8');
const lines = content.split(/\r?\n/);
let sql = '-- Script de inserção de Aulas\n\n';
sql += 'INSERT INTO aulas (titulo, descricao, data_hora, link_transmissao, status, professor_id, observacoes) VALUES\n';

const values = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  let row = [];
  let inQuotes = false;
  let currentStr = '';
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentStr);
      currentStr = '';
    } else {
      currentStr += char;
    }
  }
  row.push(currentStr);
  
  let dataStr = row[0] ? row[0].trim() : '';
  let horaStr = row[2] ? row[2].trim().toLowerCase() : '';
  let curso = row[3] ? row[3].trim() : '';
  let disciplina = row[4] ? row[4].trim() : '';
  let professorNome = row[5] ? row[5].trim() : '';
  let statusStr = row[6] ? row[6].trim().toUpperCase() : '';
  let link = row[7] ? row[7].trim() : '';
  let monitor = row[8] ? row[8].trim() : '';
  
  if (!dataStr) continue;

  // Tratamento de Data
  const parts = dataStr.split('/');
  if (parts.length !== 3) continue;
  const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  
  // Tratamento de Hora Robusto
  let finalTime = '00:00:00';
  if (horaStr && horaStr !== 'a definir') {
    // Procura o primeiro padrão de hora: 1 a 2 digitos, opcionalmente seguidos de h ou :, opcionalmente seguidos de 2 digitos
    const m = horaStr.match(/(\d{1,2})[h:]?(\d{2})?/);
    if (m) {
      const h = m[1].padStart(2, '0');
      const min = m[2] ? m[2] : '00';
      finalTime = `${h}:${min}:00`;
    }
  }
  
  const dataHora = `${isoDate} ${finalTime}-03`; // Horário de Brasília

  // Tratamento de Título
  let titulo = `${curso} - ${disciplina}`;
  titulo = titulo.replace(/'/g, "''");
  
  // Tratamento Descricao
  let descricao = monitor ? `Monitor(a): ${monitor}` : '';
  descricao = descricao.replace(/'/g, "''");

  // Tratamento Status
  let status = 'agendada';
  if (statusStr.includes('CANCELADA')) {
    status = 'cancelada';
  } else if (statusStr.includes('REALIZADA') || statusStr.includes('POSTADA') || statusStr.includes('ENVIADO')) {
    status = 'realizada';
  }

  // Tratamento de String p/ SQL
  link = link.replace(/'/g, "''");
  professorNome = professorNome.replace(/'/g, "''");

  const valDesc = descricao ? `'${descricao}'` : 'NULL';
  const valLink = link ? `'${link}'` : 'NULL';
  
  // Subquery para pegar o ID do professor pelo nome, se houver
  // Usa o ILIKE com wildcard para pegar nomes incompletos ex: 'SOARES' -> encontra 'Soares (comercial)' ou algo parecido.
  // Vamos usar apenas o primeiro nome ou a string exata com wildcards.
  let profQuery = 'NULL';
  if (professorNome) {
    // Escapar o texto do professor para a subquery
    // O ILIKE procura partes do nome (como no CSV vem "SOARES", na tabela tá "Soares (comercial)")
    const searchName = professorNome.replace(/\\s+/g, '%');
    profQuery = `(SELECT id FROM professores WHERE nome ILIKE '%${searchName}%' LIMIT 1)`;
  }
  
  // Se char estranho:
  const charMap = { 'ǭ': 'á', 'ǜ': 'çã', 'Ǹ': 'é', 'Ǧ': 'ê', 'ǧ': 'ú', 'ǟ': 'Ã' };
  for (const [k, v] of Object.entries(charMap)) {
    titulo = titulo.split(k).join(v);
    if(profQuery !== 'NULL') profQuery = profQuery.split(k).join(v);
  }
  // Remove apenas pontos de interrogação estranhos, não remove aspas simples
  titulo = titulo.replace(/\?/g, '');
  if(profQuery !== 'NULL') {
    // Aqui não tocamos na string inteira, apenas escapamos o nome se precisar,
    // mas não removeremos aspas simples já adicionadas pela variável profQuery.
    profQuery = profQuery.replace(/\?/g, '');
  }
  
  values.push(`  ('${titulo}', ${valDesc}, '${dataHora}', ${valLink}, '${status}', ${profQuery}, NULL)`);
}

sql += values.join(',\n') + ';\n';
fs.writeFileSync('import_aulas.sql', sql, 'utf8');
console.log('Arquivo import_aulas.sql gerado com sucesso.');
