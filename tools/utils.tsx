export function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)).toString().replace('.', ',') + ' ' + sizes[i];
}

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}