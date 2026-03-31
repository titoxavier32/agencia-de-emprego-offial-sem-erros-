import path from 'path';

export function isSafePath(projectPath: string, targetPath: string): boolean {
    const resolvedProject = path.resolve(projectPath);
    const resolvedTarget = path.resolve(targetPath);

    return resolvedTarget.startsWith(resolvedProject);
}

export function getRelativePath(projectPath: string, absolutePath: string): string {
    return path.relative(projectPath, absolutePath);
}