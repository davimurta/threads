import { useEffect, useRef } from "react";
import type { EntradaLog } from "../../api/tipos";
import { corDoRato, formatarTempo } from "../../util/ratos";
import "./RegistroEventos.css";

interface Props {
  entradas: EntradaLog[];
}

export function RegistroEventos({ entradas }: Props) {
  const listaRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [entradas]);

  return (
    <section className="registro">
      <h2 className="titulo-secao">Eventos das threads</h2>
      {entradas.length === 0 ? (
        <p className="registro__vazio">Os eventos aparecem aqui quando a simulação começar.</p>
      ) : (
        <ol ref={listaRef} className="registro__lista">
          {entradas.map((entrada, i) => (
            <li key={i}>
              <span className="registro__tempo">{formatarTempo(entrada.tempoMs)}</span>
              {entrada.rato !== null ? (
                <span className="registro__origem" style={{ color: corDoRato(entrada.rato) }}>
                  rato-{entrada.rato}
                </span>
              ) : (
                <span className="registro__origem registro__origem--sistema">sistema</span>
              )}
              <span className="registro__mensagem">{entrada.mensagem}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
