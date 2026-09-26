use crate::modelo::{gerar_labirinto, sortear_posicoes, Aleatorio, Labirinto, Posicao, QUEIJO};
use crate::simulacao::Simulacao;
use std::sync::Mutex;

pub struct Cenario {
    pub labirinto: Labirinto,
    pub ratos: Vec<Posicao>,
    pub semente: u64,
    pub aleatorio: Aleatorio,
}

impl Cenario {
    pub fn gerar(
        largura: usize,
        altura: usize,
        quantidade_ratos: usize,
        ciclos: f64,
        semente: u64,
    ) -> Self {
        let mut aleatorio = Aleatorio::novo(semente);
        let labirinto = gerar_labirinto(largura, altura, ciclos, &mut aleatorio);
        let ratos = sortear_posicoes(&labirinto, quantidade_ratos, QUEIJO, &mut aleatorio);
        Self {
            labirinto,
            ratos,
            semente,
            aleatorio,
        }
    }

    pub fn sortear_ratos(&mut self, quantidade: usize) {
        self.ratos = sortear_posicoes(&self.labirinto, quantidade, QUEIJO, &mut self.aleatorio);
    }
}

pub struct EstadoApp {
    pub cenario: Mutex<Cenario>,
    pub simulacao: Mutex<Option<Simulacao>>,
}

impl EstadoApp {
    pub fn novo() -> Self {
        Self {
            cenario: Mutex::new(Cenario::gerar(
                15,
                15,
                4,
                0.08,
                Aleatorio::semente_do_relogio(),
            )),
            simulacao: Mutex::new(None),
        }
    }

    pub fn encerrar_simulacao(&self) {
        let simulacao = self.simulacao.lock().unwrap().take();
        if let Some(mut simulacao) = simulacao {
            simulacao.parar();
        }
    }
}
