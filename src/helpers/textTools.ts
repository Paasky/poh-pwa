import { removeAccents } from "@urbanzoo/remove-accents";
import indefinite from "indefinite";
import pluralize from "pluralize";
import { TypeObject } from "@/types/typeObjects";

export function includes(text: string, term: string): boolean {
  const safeTerm = removeAccents(term.trim()).toLowerCase();
  return safeTerm ? removeAccents(text).toLowerCase().includes(safeTerm) : false; // prevent empty search returning everything
}

export function theWord(word: string, count = 1): string {
  if (count === 1) return `the ${word}`;
  return `the ${count} ${pluralize(word)}`;
}

export function aWord(word: string, count = 1): string {
  if (count === 1) indefinite(word);
  return `${count} ${pluralize(word)}`;
}

export function typeObjWithArticle(typeObj: TypeObject, count = 1): string {
  return typeObj.class === "nationalWonderType" || typeObj.class === "worldWonderType"
    ? theWord(typeObj.name, count)
    : aWord(typeObj.name, count);
}
export function capitalize(text: string) {
  return text[0].toUpperCase() + text.slice(1);
}
