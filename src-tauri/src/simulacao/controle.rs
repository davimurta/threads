use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use std::sync::{Condvar, Mutex};
use std::time::{Duration, Instant};

const SEM_VENCEDOR: usize = usize::MAX;

struct EstadoPausa {
    pausado: bool,
    pausado_desde: Option<Instant>,
    tempo_pausado: Duration,
}

pub struct Controle {
    pausa: Mutex<EstadoPausa>,
    sinal: Condvar,
    parar: AtomicBool,
    intervalo_ms: AtomicU64,
    parar_no_primeiro: bool,
    chegadas: AtomicUsize,
    vencedor: AtomicUsize,
    inicio: Instant,
}

impl Controle {
    pub fn novo(intervalo_ms: u64, parar_no_primeiro: bool) -> Self {
        Self {
            pausa: Mutex::new(EstadoPausa {
                pausado: false,
                pausado_desde: None,
                tempo_pausado: Duration::ZERO,
            }),
            sinal: Condvar::new(),
            parar: AtomicBool::new(false),
            intervalo_ms: AtomicU64::new(intervalo_ms),
            parar_no_primeiro,
            chegadas: AtomicUsize::new(0),
            vencedor: AtomicUsize::new(SEM_VENCEDOR),
            inicio: Instant::now(),
        }
    }

    pub fn aguardar_passo(&self) -> bool {
        let inicio_espera = Instant::now();
        let mut pausa = self.pausa.lock().unwrap();
        loop {
            if self.deve_parar() {
                return false;
            }
            if pausa.pausado {
                pausa = self.sinal.wait(pausa).unwrap();
                continue;
            }
            let intervalo = Duration::from_millis(self.intervalo_ms.load(Ordering::Relaxed));
            let decorrido = inicio_espera.elapsed();
            if decorrido >= intervalo {
                return true;
            }
            pausa = self
                .sinal
                .wait_timeout(pausa, intervalo - decorrido)
                .unwrap()
                .0;
        }
    }

    pub fn pausar(&self) {
        let mut pausa = self.pausa.lock().unwrap();
        if !pausa.pausado {
            pausa.pausado = true;
            pausa.pausado_desde = Some(Instant::now());
        }
    }

    pub fn continuar(&self) {
        let mut pausa = self.pausa.lock().unwrap();
        if pausa.pausado {
            pausa.pausado = false;
            if let Some(desde) = pausa.pausado_desde.take() {
                pausa.tempo_pausado += desde.elapsed();
            }
        }
        self.sinal.notify_all();
    }

    pub fn solicitar_parada(&self) {
        self.parar.store(true, Ordering::SeqCst);
        let _pausa = self.pausa.lock().unwrap();
        self.sinal.notify_all();
    }

    pub fn deve_parar(&self) -> bool {
        self.parar.load(Ordering::SeqCst)
    }

    pub fn esta_pausado(&self) -> bool {
        self.pausa.lock().unwrap().pausado
    }

    pub fn definir_intervalo(&self, intervalo_ms: u64) {
        self.intervalo_ms.store(intervalo_ms, Ordering::Relaxed);
        self.sinal.notify_all();
    }

    pub fn registrar_chegada(&self, id: usize) -> usize {
        let ordem = self.chegadas.fetch_add(1, Ordering::SeqCst) + 1;
        if ordem == 1 {
            self.vencedor.store(id, Ordering::SeqCst);
            if self.parar_no_primeiro {
                self.solicitar_parada();
            }
        }
        ordem
    }

    pub fn vencedor(&self) -> Option<usize> {
        match self.vencedor.load(Ordering::SeqCst) {
            SEM_VENCEDOR => None,
            id => Some(id),
        }
    }

    pub fn tempo_ms(&self) -> u64 {
        let pausa = self.pausa.lock().unwrap();
        let mut pausado = pausa.tempo_pausado;
        if let Some(desde) = pausa.pausado_desde {
            pausado += desde.elapsed();
        }
        self.inicio.elapsed().saturating_sub(pausado).as_millis() as u64
    }
}
