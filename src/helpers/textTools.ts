import { removeAccents } from "@urbanzoo/remove-accents";

export function includes(text: string, term: string): boolean {
  const safeTerm = removeAccents(term.trim()).toLowerCase();
  return safeTerm ? removeAccents(text).toLowerCase().includes(safeTerm) : false; // prevent empty search returning everything
}
