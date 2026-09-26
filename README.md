# Labirinto dos Ratos

Trabalho prático de Sistemas Operacionais (Opção 1): simulador visual de labirinto em que
múltiplos ratos, cada um em uma **thread independente**, buscam o queijo.

- Backend em **Rust** (threads, sincronização e algoritmos, só com a biblioteca padrão)
- Interface em **React + TypeScript**, empacotada como aplicativo com **Tauri**

## Rodando

```bash
npm install
npm run tauri dev      # modo desenvolvimento
npm run tauri build    # gera o .app / .dmg em src-tauri/target/release/bundle/
```

Testes do backend: `cd src-tauri && cargo test`

## Documentação

- **[MANUAL.md](MANUAL.md)**: uso da aplicação, algoritmo de navegação e explicação
  das threads e da sincronização.
- **[BACKEND.md](BACKEND.md)**: o que cada arquivo do backend faz.
