# Backend: o que cada arquivo faz

Todo o backend fica em `src-tauri/` e é escrito em Rust. Ele cuida da lógica, das threads e da
sincronização. A interface (React) só desenha o que o backend manda.

```
src-tauri/
├── Cargo.toml
├── build.rs
├── tauri.conf.json
├── capabilities/default.json
├── icons/
└── src/
    ├── main.rs
    ├── lib.rs
    ├── comandos.rs
    ├── estado_app.rs
    ├── modelo/
    │   ├── mod.rs
    │   ├── posicao.rs
    │   ├── labirinto.rs
    │   ├── gerador.rs
    │   └── aleatorio.rs
    └── simulacao/
        ├── mod.rs
        ├── rato.rs
        ├── controle.rs
        └── quadro.rs
```

---

## Configuração

| Arquivo | O que faz |
|---|---|
| `Cargo.toml` | Declara o projeto Rust e as dependências: só `tauri` (janela do app) e `serde` (converte os dados para JSON e envia à interface). |
| `build.rs` | Script de build exigido pelo Tauri. Prepara ícones e configurações antes de compilar. |
| `tauri.conf.json` | Configuração do aplicativo: nome, tamanho da janela, ícones, comandos que compilam a interface e formato do pacote (`.app` / `.dmg`). |
| `capabilities/default.json` | Permissões da janela. Libera só o básico do Tauri (chamar comandos e ouvir eventos). |
| `icons/` | Ícones do aplicativo em vários tamanhos, gerados a partir de `assets/icone.svg`. |

---

## Entrada do programa

### `src/main.rs`
Ponto de entrada. Só chama `run()` do `lib.rs`. A linha `#![cfg_attr(...)]` evita abrir um
terminal extra no Windows.

### `src/lib.rs`
Monta o aplicativo Tauri:
- declara os módulos (`modelo`, `simulacao`, `comandos`, `estado_app`);
- registra o `EstadoApp` como estado global;
- registra os comandos que a interface pode chamar (`gerar_labirinto`, `iniciar_simulacao`,
  `pausar_simulacao` etc.);
- abre a janela.

---

## Ponte com a interface

### `src/estado_app.rs`
Guarda o estado global do aplicativo:
- **`Cenario`**: o que está montado antes de iniciar (labirinto, posições iniciais dos ratos,
  semente e gerador aleatório). Tem funções para gerar um cenário novo e sortear os ratos de novo.
- **`EstadoApp`**: o cenário e a simulação em andamento, cada um protegido por um `Mutex`.
  `encerrar_simulacao()` para a simulação atual e espera suas threads terminarem.

### `src/comandos.rs`
As funções que a interface chama com `invoke(...)`:

| Comando | O que faz |
|---|---|
| `obter_cenario` | Devolve o cenário atual (usado ao abrir o app). |
| `gerar_labirinto` | Gera um labirinto novo com tamanho, ratos, % de caminhos extras e semente. Os valores ficam presos a limites seguros. |
| `sortear_ratos` | Sorteia novas posições para os ratos. |
| `alternar_parede` | Abre ou fecha uma parede (modo edição). Recusa as paredes da borda. |
| `iniciar_simulacao` | Usa uma BFS para conferir se ao menos um rato alcança o queijo. Se sim, cria a simulação, que envia o evento `simulacao:quadro` para a interface. |
| `pausar_simulacao` / `continuar_simulacao` | Pausa e retoma todas as threads. |
| `parar_simulacao` | Para a simulação e espera as threads terminarem (`join`). |
| `definir_velocidade` | Muda o intervalo entre passos com a simulação rodando. |

Também define `CenarioDto`, o formato em que o cenário é enviado para a tela. Ele inclui, para
cada célula, se existe caminho dela até o queijo. Os comandos são `async` para não travar a
janela enquanto esperam as threads.

---

## `modelo/`: dados do labirinto (sem threads)

### `modelo/mod.rs`
Junta os arquivos do módulo e define a constante `QUEIJO = [0, 0]`.

### `modelo/posicao.rs`
- **`Posicao`**: coordenada `x` (coluna) e `y` (linha) de uma célula.
- **`Direcao`**: cima, direita, baixo e esquerda. Para cada direção sabe o bit da parede, a
  direção oposta e o deslocamento `(dx, dy)`.

### `modelo/labirinto.rs`
- **`Labirinto`**: grade de células, e cada célula guarda suas 4 paredes em 4 bits.
- Funções principais:
  - `mover`: diz para onde se chega andando numa direção, respeitando as paredes;
  - `definir_parede` / `alternar_parede`: mudam a parede dos dois lados ao mesmo tempo;
  - `alcancaveis_a_partir`: busca em largura (BFS) que marca as células ligadas ao queijo.
- Testes: a parede é atualizada dos dois lados, e a borda não pode ser alterada.

### `modelo/gerador.rs`
- **`gerar_labirinto`**: algoritmo DFS aleatório (*recursive backtracker*). Parte de todas as
  paredes levantadas e cava corredores até visitar todas as células. Assim, todo rato tem
  caminho até o queijo. Depois, remove paredes extras conforme a % de "caminhos extras".
- **`sortear_posicoes`**: sorteia posições diferentes para os ratos, nunca em cima do queijo.
- Testes: o labirinto sai sempre conectado, a mesma semente gera o mesmo labirinto e as
  posições não se repetem.

### `modelo/aleatorio.rs`
Gerador de números aleatórios próprio (SplitMix64), para não depender de biblioteca externa. A
mesma semente sempre gera a mesma sequência. Tem funções para sortear um número, sortear com
probabilidade e embaralhar uma lista (Fisher–Yates).

---

## `simulacao/`: as threads

### `simulacao/mod.rs`
Cria e controla uma simulação:
- **`Simulacao::iniciar`**:
  - cria **uma thread por rato** (`rato-1`, `rato-2`, ...);
  - cria uma **barreira** de largada;
  - cria um **canal `mpsc`** para os eventos;
  - cria a **thread transmissora**.
- **Thread transmissora** (`transmitir`):
  - a cada ~33 ms, lê o estado de todos os ratos e as mensagens do canal;
  - monta um `Quadro` e envia para a interface;
  - quando todos os ratos terminam, o canal fecha, ela faz `join()` em todas as threads e envia
    o quadro final.
- `pausar`, `continuar`, `definir_intervalo` e `parar` repassam a ação ao `Controle`.
  `parar` também espera a transmissora terminar.
- Testes:
  - todos os ratos chegam num labirinto perfeito;
  - o primeiro a chegar encerra os outros;
  - um rato isolado fica preso e nunca entra de novo numa célula morta.

### `simulacao/rato.rs`
O rato, ou seja, o **código que cada thread executa**.
- Cada rato tem **memória própria**, e cada célula tem um de três estados: `Livre`,
  `NoCaminho` ou `Morta`.
- Algoritmo (DFS com pilha), repetido a cada passo:
  1. procura em ordem aleatória um vizinho sem parede e `Livre` e **avança** (empilha);
  2. se não encontra, marca a célula como `Morta` e **retrocede** (desempilha);
  3. se chegou ao queijo, registra a colocação; se a pilha esvaziou, fica **preso**.
- Antes de cada passo chama `controle.aguardar_passo()`, que respeita a pausa, a parada e a
  velocidade.
- Atualiza sua `VisaoRato` (protegida por `Mutex`) e envia mensagens pelo canal: largada, beco
  sem saída, chegada e interrupção.

### `simulacao/controle.rs`
Estado compartilhado por todas as threads de uma simulação:

| Recurso | Para que serve |
|---|---|
| `Mutex` + `Condvar` | **Pausa**. O rato pausado dorme em `wait()` sem gastar CPU até `notify_all()`. |
| `AtomicBool` | **Parada**. Todos os ratos leem a cada passo. |
| `AtomicU64` | **Velocidade** (intervalo entre passos), que pode mudar durante a simulação. |
| `AtomicUsize` (`fetch_add`) | **Ordem de chegada**. Garante uma colocação única mesmo se dois ratos chegarem juntos, sem condição de corrida. |
| `wait_timeout` | A espera entre passos acorda na hora se a simulação for pausada ou parada. |

Também calcula o tempo de simulação sem contar o tempo em pausa.

### `simulacao/quadro.rs`
Os tipos de dados enviados para a interface:
- **`StatusRato`**: aguardando largada, explorando, retrocedendo, chegou, preso, interrompido.
- **`VisaoRato`**: posição, caminho atual (pilha), células mortas, passos, retrocessos,
  status e colocação de um rato.
- **`EntradaLog`**: uma mensagem do log, com tempo e rato.
- **`Fase`**: rodando, pausada ou finalizada.
- **`Quadro`**: a "foto" completa enviada à tela, com o id da simulação, a fase, o tempo, todos
  os ratos, as mensagens novas e o vencedor.

---

## Fluxo resumido

```
Interface ── invoke("iniciar_simulacao") ──> comandos.rs
                                               │
                                               ▼
                                      Simulacao::iniciar (simulacao/mod.rs)
                                               │
              ┌────────────────────────────────┼─────────────────────────┐
              ▼                                ▼                         ▼
          rato-1 ... rato-N                Controle                transmissora
     (rato.rs, uma thread cada)   (pausa, parada, vencedor)    (lê tudo a cada ~33 ms)
              │  escreve VisaoRato (Mutex)                               │
              └── envia eventos (canal mpsc) ───────────────────────────►│
                                                                         ▼
                                          evento "simulacao:quadro" ──> Interface
```
