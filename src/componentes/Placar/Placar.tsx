import type { Cenario, Quadro, StatusRato } from "../../api/tipos";
import { corDoRato, ROTULO_STATUS } from "../../util/ratos";
import { IconeRato } from "../comuns/IconeRato";
import "./Placar.css";

interface Props {
  cenario: Cenario;
  quadro: Quadro | null;
}

interface Linha {
  id: number;
  status: StatusRato | "pronto" | "semCaminho";
  rotulo: string;
  passos: number;
  retrocessos: number;
  ordem: number | null;
}

export function Placar({ cenario, quadro }: Props) {
  const linhas: Linha[] = quadro
    ? quadro.ratos.map((r) => ({
        id: r.id,
        status: r.status,
        rotulo: r.status === "chegou" ? `${r.ordemChegada}º lugar` : ROTULO_STATUS[r.status],
        passos: r.passos,
        retrocessos: r.retrocessos,
        ordem: r.ordemChegada,
      }))
    : cenario.ratos.map((p, i) => {
        const alcanca = cenario.alcancavel[p.y * cenario.largura + p.x];
        return {
          id: i + 1,
          status: alcanca ? "pronto" : "semCaminho",
          rotulo: alcanca ? `Em [${p.x}, ${p.y}]` : "Sem caminho",
          passos: 0,
          retrocessos: 0,
          ordem: null,
        };
      });

  return (
    <section className="placar">
      <h2 className="titulo-secao">Ratos</h2>
      <table>
        <thead>
          <tr>
            <th>Thread</th>
            <th>Estado</th>
            <th className="numero" title="Movimentos para a frente">Passos</th>
            <th className="numero" title="Movimentos de volta">Volta</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.id} className={linha.ordem === 1 ? "placar__vencedor" : ""}>
              <td>
                <span className="placar__nome">
                  <IconeRato cor={corDoRato(linha.id)} />
                  rato-{linha.id}
                </span>
              </td>
              <td>
                <span className={`estado estado--${linha.status}`}>{linha.rotulo}</span>
              </td>
              <td className="numero">{linha.passos}</td>
              <td className="numero">{linha.retrocessos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
