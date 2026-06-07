import * as z from 'zod';

const schema = z.object({
  email: z.union([z.string().email('E-mail inválido'), z.literal('')]).nullable().optional().transform(v => (!v || v === '') ? null : v),
  foto_url: z.union([z.string().url('URL inválida'), z.literal('')]).nullable().optional().transform(v => (!v || v === '') ? null : v),
  pix_tipo: z.union([z.enum(['cpf','cnpj','email','telefone','aleatoria']), z.literal('')]).nullable().optional().transform(v => (!v || v === '') ? null : v),
});

console.log(schema.safeParse({ email: '', foto_url: '', pix_tipo: '' }));
console.log(schema.safeParse({ email: null, foto_url: null, pix_tipo: null }));
console.log(schema.safeParse({ email: 'test@example.com', foto_url: 'http://example.com', pix_tipo: 'cpf' }));
