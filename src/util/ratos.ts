import type { StatusRato } from "../api/tipos";

const CORES = [
  "#e5484d",
  "#3e63dd",
  "#30a46c",
  "#8e4ec6",
  "#f76b15",
  "#12a594",
  "#d6409f",
  "#978365",
  "#0090ff",
  "#6e56cf",
  "#a18072",
  "#46a758",
];

export function corDoRato(id: number): string {
  return CORES[(id - 1) % CORES.length];
}

export const ROTULO_STATUS: Record<StatusRato, string> = {
  aguardandoLargada: "Aguardando",
  explorando: "Explorando",
  retrocedendo: "Retrocedendo",
  chegou: "Chegou",
  preso: "Preso",
  interrompido: "Interrompido",
};

export function formatarTempo(ms: number): string {
  const totalDecimos = Math.floor(ms / 100);
  const minutos = Math.floor(totalDecimos / 600);
  const segundos = Math.floor((totalDecimos % 600) / 10);
  const decimos = totalDecimos % 10;
  return `${minutos}:${String(segundos).padStart(2, "0")}.${decimos}`;
}
