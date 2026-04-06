import { z } from 'zod';

export const PatchOperationSchema = z.enum(['create', 'replace', 'patch']);
export type PatchOperation = z.infer<typeof PatchOperationSchema>;

export interface FileChange {
    path: string;
    operation: PatchOperation;
    content?: string;
    diff?: string;
    explanation: string;
    isCritical: boolean;
}