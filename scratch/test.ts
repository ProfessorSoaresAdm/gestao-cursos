import * as z from 'zod';

const schema = z.object({
  instagram_handle: z.string().regex(/^[a-zA-Z0-9_.]{1,30}$/, 'Handle inválido').or(z.literal('')).optional().transform(v => v === '' ? null : v),
  pix_tipo: z.enum(['cpf','cnpj','email','telefone','aleatoria']).or(z.literal('')).optional().transform(v => v === '' ? null : v),
});

console.log('Testing ""');
console.log(schema.safeParse({ instagram_handle: '', pix_tipo: '' }));

console.log('Testing null');
console.log(schema.safeParse({ instagram_handle: null, pix_tipo: null }));

console.log('Testing undefined');
console.log(schema.safeParse({}));
