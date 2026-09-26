mod controle;
mod quadro;
mod rato;

pub use quadro::Quadro;

use crate::modelo::{Aleatorio, Labirinto, Posicao};
use controle::Controle;
use quadro::{EntradaLog, Fase, VisaoRato};
use rato::Rato;
use std::sync::mpsc::{self, Receiver, TryRecvError};
use std::sync::{Arc, Barrier, Mutex};
use std::thread::{self, JoinHandle};
use std::time::Duration;

const INTERVALO_QUADRO: Duration = Duration::from_millis(33);

pub struct ConfigSimulacao {
    pub id: u64,
    pub intervalo_ms: u64,
    pub parar_no_primeiro: bool,
    pub semente: u64,
}

pub struct Simulacao {
    controle: Arc<Controle>,
    transmissora: Option<JoinHandle<()>>,
}

impl Simulacao {
    pub fn iniciar<F>(
        labirinto: Labirinto,
        queijo: Posicao,
        posicoes: &[Posicao],
        config: ConfigSimulacao,
        publicar: F,
    ) -> Self
    where
        F: Fn(Quadro) + Send + 'static,
    {
        let labirinto = Arc::new(labirinto);
        let controle = Arc::new(Controle::novo(
            config.intervalo_ms,
            config.parar_no_primeiro,
        ));
        let largada = Arc::new(Barrier::new(posicoes.len()));
        let (enviar_log, receber_log) = mpsc::channel();

        let mut visoes = Vec::with_capacity(posicoes.len());
        let mut ratos = Vec::with_capacity(posicoes.len());

        for (indice, &inicio) in posicoes.iter().enumerate() {
            let id = indice + 1;
            let visao = Arc::new(Mutex::new(VisaoRato::nova(id, inicio)));
            visoes.push(Arc::clone(&visao));

            let rato = Rato::novo(
                id,
                inicio,
                Arc::clone(&labirinto),
                queijo,
                Aleatorio::novo(config.semente.wrapping_add(id as u64 * 7919)),
                visao,
                Arc::clone(&controle),
                Arc::clone(&largada),
                enviar_log.clone(),
            );

            let handle = thread::Builder::new()
                .name(format!("rato-{id}"))
                .spawn(move || rato.executar())
                .expect("não foi possível criar a thread do rato");
            ratos.push(handle);
        }

        drop(enviar_log);

        let transmissora = thread::Builder::new()
            .name("transmissora".into())
            .spawn({
                let controle = Arc::clone(&controle);
                move || transmitir(config.id, controle, visoes, ratos, receber_log, publicar)
            })
            .expect("não foi possível criar a thread transmissora");

        Self {
            controle,
            transmissora: Some(transmissora),
        }
    }

    pub fn pausar(&self) {
        self.controle.pausar();
    }

    pub fn continuar(&self) {
        self.controle.continuar();
    }

    pub fn definir_intervalo(&self, intervalo_ms: u64) {
        self.controle.definir_intervalo(intervalo_ms);
    }

    pub fn parar(&mut self) {
        self.controle.solicitar_parada();
        if let Some(transmissora) = self.transmissora.take() {
            let _ = transmissora.join();
        }
    }
}

impl Drop for Simulacao {
    fn drop(&mut self) {
        self.parar();
    }
}

fn transmitir<F>(
    id: u64,
    controle: Arc<Controle>,
    visoes: Vec<Arc<Mutex<VisaoRato>>>,
    mut ratos: Vec<JoinHandle<()>>,
    receber_log: Receiver<EntradaLog>,
    publicar: F,
) where
    F: Fn(Quadro),
{
    let total = ratos.len();
    let mut log = vec![EntradaLog {
        tempo_ms: 0,
        rato: None,
        mensagem: format!("{total} threads criadas; aguardando a largada"),
    }];

    loop {
        thread::sleep(INTERVALO_QUADRO);

        let mut encerrou = false;
        loop {
            match receber_log.try_recv() {
                Ok(entrada) => log.push(entrada),
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Disconnected) => {
                    encerrou = true;
                    break;
                }
            }
        }

        if encerrou {
            for rato in ratos.drain(..) {
                let _ = rato.join();
            }
            log.push(EntradaLog {
                tempo_ms: controle.tempo_ms(),
                rato: None,
                mensagem: format!("join concluído: as {total} threads terminaram"),
            });
        }

        let fase = if encerrou {
            Fase::Finalizada
        } else if controle.esta_pausado() {
            Fase::Pausada
        } else {
            Fase::Rodando
        };

        publicar(Quadro {
            id,
            fase,
            tempo_ms: controle.tempo_ms(),
            ratos: visoes.iter().map(|v| v.lock().unwrap().clone()).collect(),
            log: std::mem::take(&mut log),
            vencedor: controle.vencedor(),
        });

        if encerrou {
            return;
        }
    }
}

#[cfg(test)]
mod testes {
    use super::quadro::StatusRato;
    use super::*;
    use crate::modelo::{gerar_labirinto, sortear_posicoes, Direcao, QUEIJO};
    use std::sync::mpsc::channel;

    fn rodar(labirinto: Labirinto, posicoes: &[Posicao], parar_no_primeiro: bool) -> Quadro {
        let (enviar, receber) = channel();
        let config = ConfigSimulacao {
            id: 1,
            intervalo_ms: 0,
            parar_no_primeiro,
            semente: 3,
        };
        let _sim = Simulacao::iniciar(labirinto, QUEIJO, posicoes, config, move |q| {
            let _ = enviar.send(q);
        });
        loop {
            let quadro = receber
                .recv_timeout(Duration::from_secs(10))
                .expect("simulação travou");
            if quadro.fase == Fase::Finalizada {
                return quadro;
            }
        }
    }

    #[test]
    fn todos_os_ratos_chegam_em_labirinto_perfeito() {
        let mut aleatorio = Aleatorio::novo(11);
        let lab = gerar_labirinto(20, 20, 0.1, &mut aleatorio);
        let posicoes = sortear_posicoes(&lab, 8, QUEIJO, &mut aleatorio);
        let quadro = rodar(lab, &posicoes, false);

        assert!(quadro.ratos.iter().all(|r| r.status == StatusRato::Chegou));
        let mut ordens: Vec<usize> = quadro
            .ratos
            .iter()
            .filter_map(|r| r.ordem_chegada)
            .collect();
        ordens.sort();
        assert_eq!(ordens, (1..=8).collect::<Vec<_>>());
        assert!(quadro.vencedor.is_some());
    }

    #[test]
    fn primeiro_a_chegar_encerra_os_outros() {
        let mut aleatorio = Aleatorio::novo(5);
        let lab = gerar_labirinto(30, 30, 0.0, &mut aleatorio);
        let posicoes = sortear_posicoes(&lab, 6, QUEIJO, &mut aleatorio);
        let quadro = rodar(lab, &posicoes, true);

        let vencedor = quadro.vencedor.expect("deveria haver vencedor");
        let rato = &quadro.ratos[vencedor - 1];
        assert_eq!(rato.status, StatusRato::Chegou);
        assert_eq!(rato.posicao, QUEIJO);
    }

    #[test]
    fn rato_isolado_fica_preso_e_nunca_reentra_em_celula_morta() {
        let mut lab = Labirinto::fechado(4, 4);
        lab.definir_parede(Posicao::nova(2, 2), Direcao::Direita, false);
        lab.definir_parede(Posicao::nova(2, 2), Direcao::Baixo, false);
        lab.definir_parede(Posicao::nova(3, 2), Direcao::Baixo, false);
        let quadro = rodar(lab, &[Posicao::nova(2, 2)], true);

        let rato = &quadro.ratos[0];
        assert_eq!(rato.status, StatusRato::Preso);
        assert_eq!(rato.mortas.len(), 4);
        let mut unicas = rato.mortas.clone();
        unicas.sort_by_key(|p| (p.y, p.x));
        unicas.dedup();
        assert_eq!(unicas.len(), 4, "entrou de novo numa célula morta");
    }
}
