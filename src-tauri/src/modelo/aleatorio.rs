use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone, Debug)]
pub struct Aleatorio {
    estado: u64,
}

impl Aleatorio {
    pub fn novo(semente: u64) -> Self {
        Self { estado: semente }
    }

    pub fn semente_do_relogio() -> u64 {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0);
        Aleatorio::novo(nanos).proximo() % 1_000_000
    }

    pub fn proximo(&mut self) -> u64 {
        self.estado = self.estado.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.estado;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }

    pub fn intervalo(&mut self, limite: usize) -> usize {
        (self.proximo() % limite as u64) as usize
    }

    pub fn chance(&mut self, probabilidade: f64) -> bool {
        let amostra = (self.proximo() >> 11) as f64 / (1u64 << 53) as f64;
        amostra < probabilidade
    }

    pub fn embaralhar<T>(&mut self, itens: &mut [T]) {
        for i in (1..itens.len()).rev() {
            let j = self.intervalo(i + 1);
            itens.swap(i, j);
        }
    }
}
