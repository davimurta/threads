import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  Cenario,
  Direcao,
  OpcoesSimulacao,
  ParametrosLabirinto,
  Quadro,
} from "./tipos";

const EVENTO_QUADRO = "simulacao:quadro";

export const backend = {
  obterCenario: () => invoke<Cenario>("obter_cenario"),

  gerarLabirinto: (parametros: ParametrosLabirinto) =>
    invoke<Cenario>("gerar_labirinto", { parametros }),

  sortearRatos: (quantidade: number) =>
    invoke<Cenario>("sortear_ratos", { quantidade }),

  alternarParede: (x: number, y: number, direcao: Direcao) =>
    invoke<Cenario>("alternar_parede", { x, y, direcao }),

  iniciarSimulacao: (id: number, opcoes: OpcoesSimulacao) =>
    invoke<void>("iniciar_simulacao", { opcoes: { id, ...opcoes } }),

  pausarSimulacao: () => invoke<void>("pausar_simulacao"),

  continuarSimulacao: () => invoke<void>("continuar_simulacao"),

  pararSimulacao: () => invoke<void>("parar_simulacao"),

  definirVelocidade: (intervaloMs: number) =>
    invoke<void>("definir_velocidade", { intervaloMs }),

  ouvirQuadros: (aoReceber: (quadro: Quadro) => void): Promise<UnlistenFn> =>
    listen<Quadro>(EVENTO_QUADRO, (evento) => aoReceber(evento.payload)),
};
