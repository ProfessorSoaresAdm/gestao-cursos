import * as z from 'zod';

const schema = z.object({
  instagram_handle: z.string().regex(/^[a-zA-Z0-9_.]{1,30}$/, 'Handle inválido').or(z.literal('')).optional().transform(v => v === '' ? null : v),
  pix_tipo: z.enum(['cpf','cnpj','email','telefone','aleatoria']).or(z.literal('')).optional().transform(v => v === '' ? null : v),
  pix_chave: z.string().optional().nullable(),
});

console.log('Testing missing fields');
console.log(schema.safeParse({}));

console.log('Testing empty strings');
console.log(schema.safeParse({ instagram_handle: '', pix_tipo: '', pix_chave: '' }));
