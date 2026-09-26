export type Direcao = "cima" | "direita" | "baixo" | "esquerda";

export interface Posicao {
  x: number;
  y: number;
}

export const BIT_PAREDE: Record<Direcao, number> = {
  cima: 1,
  direita: 2,
  baixo: 4,
  esquerda: 8,
};

export interface Cenario {
  largura: number;
  altura: number;
  paredes: number[];
  queijo: Posicao;
  ratos: Posicao[];
  alcancavel: boolean[];
  semente: number;
}

export type StatusRato =
  | "aguardandoLargada"
  | "explorando"
  | "retrocedendo"
  | "chegou"
  | "preso"
  | "interrompido";

export interface VisaoRato {
  id: number;
  posicao: Posicao;
  caminho: Posicao[];
  mortas: Posicao[];
  passos: number;
  retrocessos: number;
  status: StatusRato;
  ordemChegada: number | null;
}

export interface EntradaLog {
  tempoMs: number;
  rato: number | null;
  mensagem: string;
}

export type FaseSimulacao = "rodando" | "pausada" | "finalizada";

export interface Quadro {
  id: number;
  fase: FaseSimulacao;
  tempoMs: number;
  ratos: VisaoRato[];
  log: EntradaLog[];
  vencedor: number | null;
}

export interface ParametrosLabirinto {
  largura: number;
  altura: number;
  quantidadeRatos: number;
  ciclos: number;
  semente: number | null;
}

export interface OpcoesSimulacao {
  intervaloMs: number;
  pararNoPrimeiro: boolean;
}
