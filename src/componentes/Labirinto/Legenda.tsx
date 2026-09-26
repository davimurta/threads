import { IconeRato } from "../comuns/IconeRato";
import "./Labirinto.css";

interface Props {
  mostrarInalcancaveis: boolean;
}

export function Legenda({ mostrarInalcancaveis }: Props) {
  return (
    <ul className="legenda">
      <li>
        <span className="legenda__icone">🧀</span> Queijo [0, 0]
      </li>
      <li>
        <IconeRato cor="#3e63dd" /> Rato (thread)
      </li>
      <li>
        <span className="legenda__amostra legenda__amostra--rastro" /> Caminho atual
      </li>
      <li>
        <span className="legenda__amostra legenda__amostra--morta" /> Retrocedeu (bloqueada)
      </li>
      {mostrarInalcancaveis && (
        <li>
          <span className="legenda__amostra legenda__amostra--inalcancavel" /> Sem caminho até o queijo
        </li>
      )}
    </ul>
  );
}
