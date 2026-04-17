class MatatenaLogic {
    constructor() {
        this.tableroJugador = [[], [], []];
        this.tableroOponente = [[], [], []];
        this.dadoActual = 0;
    }

    lanzarDado() {
        this.dadoActual = Math.floor(Math.random() * 6) + 1;
        return this.dadoActual;
    }

    calcularPuntosColumna(columnaArray) {
        let total = 0;
        let conteo = {};

        for (let dado of columnaArray) {
            conteo[dado] = (conteo[dado] || 0) + 1;
        }

        for (let dado in conteo) {
            let valor = parseInt(dado);
            let cantidad = conteo[dado];
            total += (valor * cantidad) * cantidad; 
        }

        return total;
    }

    destruirDados(columnaIndex, numDado, esJugador) {
        if (esJugador) {
            this.tableroOponente[columnaIndex] = this.tableroOponente[columnaIndex].filter(dado => dado !== numDado);
        } else {
            this.tableroJugador[columnaIndex] = this.tableroJugador[columnaIndex].filter(dado => dado !== numDado);
        }
    }

    // 4. El movimiento principal
    colocarDado(columnaIndex, esJugador) {
        let tablero = esJugador ? this.tableroJugador : this.tableroOponente;

        if (tablero[columnaIndex].length >= 3 || this.dadoActual === 0) {
            return false;
        }

        tablero[columnaIndex].push(this.dadoActual);

        this.destruirDados(columnaIndex, this.dadoActual, esJugador);

        this.dadoActual = 0;
        
        return true;
    }
}