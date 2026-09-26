# Manual rápido: Labirinto dos Ratos

Simulador visual em que vários ratos, cada um rodando em uma **thread independente**,
procuram o queijo dentro de um labirinto.

---

## 1. Como executar

### Opção A: aplicativo pronto (macOS)
Abra `Labirinto dos Ratos.app` (gerado em `src-tauri/target/release/bundle/macos/`).
Se o macOS bloquear na primeira vez: clique com o botão direito → **Abrir**.

### Opção B: a partir do código-fonte
Pré-requisitos: **Rust** (1.77+), **Node.js** (18+) e, no macOS, as *Xcode Command Line Tools*.

```bash
npm install            # instala as dependências da interface (só na primeira vez)
npm run tauri dev      # abre o app em modo desenvolvimento
npm run tauri build    # gera o aplicativo (.app e .dmg) em src-tauri/target/release/bundle/
```

Para rodar os testes automáticos do backend:

```bash
cd src-tauri && cargo test
```

---

## 2. A tela

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Labirinto dos Ratos                     Threads ativas  Tempo   ● Rodando │
├──────────────┬─────────────────────────────────────┬──────────────────────┤
│ LABIRINTO    │                                     │ RATOS                │
│  Colunas     │                                     │  rato-1  Explorando  │
│  Linhas      │            (labirinto)              │  rato-2  Chegou      │
│  Caminhos    │                                     │  ...                 │
│  Semente     │                                     ├──────────────────────┤
│ RATOS        │                                     │ EVENTOS DAS THREADS  │
│ SIMULAÇÃO    │  legenda                            │  0:01.2 rato-3 ...   │
└──────────────┴─────────────────────────────────────┴──────────────────────┘
```

| Área | O que mostra |
|---|---|
| **Cabeçalho** | Estado da simulação, cronômetro (não conta o tempo pausado), quantas threads de rato ainda estão ativas e o vencedor. |
| **Painel esquerdo** | Todos os controles (detalhados abaixo). |
| **Centro** | O labirinto. 🧀 = queijo em [0, 0]; cada rato tem uma cor (a mesma do placar e dos eventos), olha para onde anda e desliza entre as células; linha colorida = caminho atual de cada rato; células escurecidas = células de onde algum rato já retrocedeu. |
| **Placar** | Estado de cada thread, passos para a frente e passos de volta. |
| **Eventos** | Mensagens enviadas pelas threads: largada, becos sem saída, chegada, interrupção e `join`. |

---

## 3. Passo a passo

1. **Gerar o labirinto**: ajuste *Colunas*, *Linhas* e *Caminhos extras* e clique em **Gerar labirinto**.
   - *Caminhos extras* abre paredes a mais, criando rotas alternativas.
   - *Semente*: deixe vazio para um labirinto aleatório. Anote a semente mostrada para
     repetir exatamente o mesmo labirinto depois.
2. **Posicionar os ratos**: escolha a *Quantidade* (1 a 12). As posições são sorteadas
   automaticamente; use **Sortear posições** para trocar.
3. **Editar paredes (opcional)**: ligue **Editar paredes** e clique perto de uma parede interna
   para abrir ou fechar. A parede sob o cursor fica destacada. Células **avermelhadas** não têm
   caminho até o queijo. Se nenhum rato tiver caminho, o programa não deixa iniciar.
4. **Configurar a simulação**:
   - *Intervalo por passo*: tempo que cada rato espera entre dois movimentos (menor = mais rápido).
     Pode ser alterado durante a simulação.
   - *Parar no primeiro*: ligado, todas as threads encerram quando o primeiro rato chega.
     Desligado, cada rato continua até chegar (recebe uma colocação) ou ficar preso.
5. **Iniciar**. Durante a execução: **Pausar** / **Continuar** e **Parar**.
6. Ao final: **Rodar de novo** (mesmo labirinto e mesmas posições) ou **Limpar**.

---

## 4. Como os ratos andam (algoritmo de navegação)

Cada rato usa **busca em profundidade (DFS) com uma pilha** e tem **memória própria**, sem
compartilhar informação com os outros. Para ele, cada célula está em um de três estados:

| Estado | Significado |
|---|---|
| Livre | ainda não visitada |
| No caminho | faz parte do caminho atual (está na pilha) |
| **Morta** | o rato já retrocedeu dela e **nunca mais pode entrar** |

A cada passo:

1. O rato embaralha as direções (↑ → ↓ ←) e procura um vizinho **sem parede** e **livre**.
2. Se encontra, **avança**: marca a célula e empilha.
3. Se não encontra, **retrocede**: marca a célula atual como **morta** e desempilha.
4. Chegou em [0, 0]: venceu. Pilha vazia: ficou **preso** (não havia caminho).

Isso cumpre a regra do trabalho: *o rato pode avançar ou retroceder, mas não pode avançar
por caminhos de onde já retrocedeu.*

### Geração do labirinto
Algoritmo **DFS aleatório (recursive backtracker)**: parte de todas as paredes levantadas e
cava corredores até visitar todas as células. O resultado é conectado, então **todo rato tem
caminho até o queijo**. Depois, *Caminhos extras* remove algumas paredes para criar laços.
Após edições manuais, uma **busca em largura (BFS)** a partir do queijo verifica quais células
ainda o alcançam.

---

## 5. Threads e sincronização (conceitos de Sistemas Operacionais)

Todo o código concorrente está em `src-tauri/src/simulacao/` e usa apenas a biblioteca padrão
do Rust.

| Conceito | Onde / como |
|---|---|
| **Uma thread por rato** | `thread::Builder::new().name("rato-N").spawn(...)` em `simulacao/mod.rs`. São threads reais do sistema operacional. |
| **Largada simultânea** | `Barrier`: nenhum rato se move antes de todas as threads estarem prontas. |
| **Dados compartilhados** | O labirinto é somente leitura e é compartilhado com `Arc` (sem trava). A visão de cada rato (posição, caminho, contadores) fica em um `Mutex` próprio: o rato escreve e a thread transmissora lê. |
| **Pausar / continuar** | `Mutex` + `Condvar` em `simulacao/controle.rs`. O rato pausado fica bloqueado em `wait()` (estado de espera, sem gastar CPU) até `notify_all()`. |
| **Parar** | `AtomicBool` lida a cada passo. A espera entre passos usa `wait_timeout` no `Condvar`, então os ratos acordam na hora ao pausar ou parar. |
| **Vencedor único** | `AtomicUsize::fetch_add`: operação atômica que dá uma colocação diferente para cada rato, mesmo que dois cheguem no mesmo instante (evita condição de corrida). |
| **Troca de mensagens** | Canal `mpsc`: os ratos enviam eventos para a thread transmissora (produtor/consumidor). |
| **Fim das threads** | Quando todos os ratos terminam, o canal fecha e a thread transmissora faz `join()` em todas elas. |
| **Interface separada** | A thread **transmissora** tira uma "foto" do estado a cada ~33 ms e envia para a interface. As threads dos ratos nunca tocam na interface. |

O compilador do Rust **não compila** código que acessa dado compartilhado sem proteção
(`Mutex`, atômicos ou somente leitura via `Arc`). Por isso não existe condição de corrida
sobre os dados da simulação.

```
 rato-1 ─┐  escreve VisaoRato (Mutex)      ┌─> transmissora ── evento ──> interface (React)
 rato-2 ─┼─ envia eventos (canal mpsc) ────┤    (lê tudo a cada ~33 ms)
 rato-N ─┘                                 └─ join() em todos os ratos no final
```

---

## 6. Estrutura do projeto

```
src-tauri/src/            Backend em Rust (lógica e threads)
  modelo/                   labirinto, posições, gerador, números aleatórios
  simulacao/                rato (thread), controle (pausa/parada), quadro (dados p/ tela)
  comandos.rs               funções chamadas pela interface
  estado_app.rs             estado global do aplicativo
src/                      Interface em React + TypeScript (apenas visualização)
  api/                      tipos e chamadas ao backend
  hooks/useSimulacao.ts     estado da tela
  componentes/              Cabecalho, PainelControle, Labirinto (canvas), Placar, RegistroEventos
```

Dependências externas: apenas o **Tauri** (janela do aplicativo) e o **serde** (conversão dos
dados para a interface) no Rust; **React** na interface. A geração de números aleatórios, os
algoritmos e toda a concorrência foram implementados com a biblioteca padrão.
