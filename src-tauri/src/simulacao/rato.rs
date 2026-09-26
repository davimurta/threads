use super::controle::Controle;
use super::quadro::{EntradaLog, StatusRato, VisaoRato};
use crate::modelo::{Aleatorio, Direcao, Labirinto, Posicao};
use std::sync::mpsc::Sender;
use std::sync::{Arc, Barrier, Mutex};

#[derive(Clone, Copy, PartialEq, Eq)]
enum Marca {
    Livre,
    NoCaminho,
    Morta,
}

pub struct Rato {
    id: usize,
    labirinto: Arc<Labirinto>,
    queijo: Posicao,
    aleatorio: Aleatorio,
    visao: Arc<Mutex<VisaoRato>>,
    controle: Arc<Controle>,
    largada: Arc<Barrier>,
    log: Sender<EntradaLog>,
    marcas: Vec<Marca>,
    pilha: Vec<Posicao>,
    retrocedendo: bool,
}

impl Rato {
    #[allow(clippy::too_many_arguments)]
    pub fn novo(
        id: usize,
        inicio: Posicao,
        labirinto: Arc<Labirinto>,
        queijo: Posicao,
        aleatorio: Aleatorio,
        visao: Arc<Mutex<VisaoRato>>,
        controle: Arc<Controle>,
        largada: Arc<Barrier>,
        log: Sender<EntradaLog>,
    ) -> Self {
        let mut marcas = vec![Marca::Livre; labirinto.total_celulas()];
        marcas[labirinto.indice(inicio)] = Marca::NoCaminho;
        Self {
            id,
            labirinto,
            queijo,
            aleatorio,
            visao,
            controle,
            largada,
            log,
            marcas,
            pilha: vec![inicio],
            retrocedendo: false,
        }
    }

    pub fn executar(mut self) {
        self.largada.wait();
        self.registrar(format!("largou de {}", self.pilha[0]));
        self.atualizar(|v| v.status = StatusRato::Explorando);

        loop {
            if !self.controle.aguardar_passo() {
                let motivo = match self.controle.vencedor() {
                    Some(vencedor) => format!("parou: o rato {vencedor} já encontrou o queijo"),
                    None => "foi interrompido".to_string(),
                };
                self.registrar(motivo);
                self.atualizar(|v| v.status = StatusRato::Interrompido);
                return;
            }

            let atual = *self.pilha.last().expect("a pilha nunca está vazia aqui");
            match self.proximo_passo(atual) {
                Some(proxima) => self.avancar(proxima),
                None => self.retroceder(atual),
            }

            if self.pilha.last() == Some(&self.queijo) {
                let ordem = self.controle.registrar_chegada(self.id);
                let passos = self.visao.lock().unwrap().passos;
                self.registrar(format!(
                    "chegou ao queijo em {ordem}º lugar ({passos} passos)"
                ));
                self.atualizar(|v| {
                    v.status = StatusRato::Chegou;
                    v.ordem_chegada = Some(ordem);
                });
                return;
            }

            if self.pilha.is_empty() {
                self.registrar("ficou preso: não há caminho até o queijo".to_string());
                self.atualizar(|v| v.status = StatusRato::Preso);
                return;
            }
        }
    }

    fn proximo_passo(&mut self, atual: Posicao) -> Option<Posicao> {
        let mut direcoes = Direcao::TODAS;
        self.aleatorio.embaralhar(&mut direcoes);
        direcoes
            .iter()
            .filter_map(|&d| self.labirinto.mover(atual, d))
            .find(|&p| self.marcas[self.labirinto.indice(p)] == Marca::Livre)
    }

    fn avancar(&mut self, proxima: Posicao) {
        let i = self.labirinto.indice(proxima);
        self.marcas[i] = Marca::NoCaminho;
        self.pilha.push(proxima);
        self.retrocedendo = false;
        self.atualizar(|v| {
            v.posicao = proxima;
            v.caminho.push(proxima);
            v.passos += 1;
            v.status = StatusRato::Explorando;
        });
    }

    fn retroceder(&mut self, atual: Posicao) {
        if !self.retrocedendo {
            self.registrar(format!("encontrou beco sem saída em {atual}"));
            self.retrocedendo = true;
        }
        let i = self.labirinto.indice(atual);
        self.marcas[i] = Marca::Morta;
        self.pilha.pop();
        let topo = self.pilha.last().copied();
        self.atualizar(|v| {
            v.caminho.pop();
            v.mortas.push(atual);
            v.retrocessos += 1;
            v.status = StatusRato::Retrocedendo;
            if let Some(anterior) = topo {
                v.posicao = anterior;
            }
        });
    }

    fn atualizar(&self, alterar: impl FnOnce(&mut VisaoRato)) {
        let mut visao = self.visao.lock().unwrap();
        alterar(&mut visao);
    }

    fn registrar(&self, mensagem: String) {
        let _ = self.log.send(EntradaLog {
            tempo_ms: self.controle.tempo_ms(),
            rato: Some(self.id),
            mensagem,
        });
    }
}
