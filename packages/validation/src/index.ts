export const validateName = (value: string) => value.trim().length > 1;
export const validatePhone = (value?: string) => !value || value.replace(/\D/g, '').length >= 9;
