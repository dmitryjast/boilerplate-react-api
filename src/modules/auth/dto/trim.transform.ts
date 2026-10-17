import { Transform } from 'class-transformer'

// Remove leading and trailing spaces from string values
export const Trim = () => Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
