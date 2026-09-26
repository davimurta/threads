import type { Posicao } from "../../api/tipos";

const DURACAO_PASSO = 110;
const DURACAO_MOVIMENTO = 260;

interface Estado {
  deX: number;
  deY: number;
  paraX: number;
  paraY: number;
  inicio: number;
  angulo: number;
  anguloAlvo: number;
  ultimoPasso: number;
}

export interface PosicaoAnimada {
  x: number;
  y: number;
  angulo: number;
  movimento: number;
}

export class AnimadorRatos {
  private estados = new Map<number, Estado>();
  private ultimoTempo = 0;

  atualizarAlvos(ratos: { id: number; posicao: Posicao }[], queijo: Posicao, agora: number) {
    const ids = new Set(ratos.map((r) => r.id));
    for (const id of this.estados.keys()) if (!ids.has(id)) this.estados.delete(id);

    for (const { id, posicao } of ratos) {
      const estado = this.estados.get(id);
      if (!estado) {
        const angulo = Math.atan2(queijo.y - posicao.y, queijo.x - posicao.x);
        this.estados.set(id, {
          deX: posicao.x,
          deY: posicao.y,
          paraX: posicao.x,
          paraY: posicao.y,
          inicio: agora,
          angulo,
          anguloAlvo: angulo,
          ultimoPasso: -Infinity,
        });
        continue;
      }
      if (estado.paraX === posicao.x && estado.paraY === posicao.y) continue;

      const atual = this.posicaoInterpolada(estado, agora);
      const dx = posicao.x - estado.paraX;
      const dy = posicao.y - estado.paraY;
      const vizinha = Math.abs(dx) + Math.abs(dy) === 1;

      estado.deX = vizinha ? atual.x : posicao.x;
      estado.deY = vizinha ? atual.y : posicao.y;
      estado.paraX = posicao.x;
      estado.paraY = posicao.y;
      estado.inicio = agora;
      if (vizinha) {
        estado.anguloAlvo = Math.atan2(dy, dx);
        estado.ultimoPasso = agora;
      }
    }
  }

  quadro(agora: number): Map<number, PosicaoAnimada> {
    const dt = Math.min(100, Math.max(0, agora - this.ultimoTempo));
    this.ultimoTempo = agora;

    const resultado = new Map<number, PosicaoAnimada>();
    for (const [id, estado] of this.estados) {
      let diferenca = estado.anguloAlvo - estado.angulo;
      diferenca = Math.atan2(Math.sin(diferenca), Math.cos(diferenca));
      estado.angulo += diferenca * Math.min(1, dt * 0.02);

      const { x, y } = this.posicaoInterpolada(estado, agora);
      const desdePasso = agora - estado.ultimoPasso;
      resultado.set(id, {
        x,
        y,
        angulo: estado.angulo,
        movimento: Math.max(0, 1 - desdePasso / DURACAO_MOVIMENTO),
      });
    }
    return resultado;
  }

  private posicaoInterpolada(estado: Estado, agora: number) {
    const t = Math.min(1, Math.max(0, (agora - estado.inicio) / DURACAO_PASSO));
    const suave = 1 - (1 - t) * (1 - t);
    return {
      x: estado.deX + (estado.paraX - estado.deX) * suave,
      y: estado.deY + (estado.paraY - estado.deY) * suave,
    };
  }
}
