import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    A4F_API_KEY: z.string().min(1, "A4F_API_KEY é obrigatória"),
    A4F_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
    A4F_MODEL: z.string().default("gpt-4o"),
    LOG_LEVEL: z.enum(['info', 'debug', 'error']).default('info'),
    ENGINE_TIMEOUT: z.coerce.number().default(60000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Erro nas variáveis de ambiente:", parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;