export class MatatenaLogic {
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
        let tablero = esJugador ? this.tableroOponente[columnaIndex] : this.tableroJugador[columnaIndex];
        let originalLength = tablero.length;
        let nuevoTablero = tablero.filter(dado => dado !== numDado);
        let destroyedCount = originalLength - nuevoTablero.length;

        if (esJugador) {
            this.tableroOponente[columnaIndex] = nuevoTablero;
        } else {
            this.tableroJugador[columnaIndex] = nuevoTablero;
        }

        return destroyedCount;
    }

    colocarDado(columnaIndex, esJugador) {
        let tablero = esJugador ? this.tableroJugador : this.tableroOponente;

        if (tablero[columnaIndex].length >= 3 || this.dadoActual === 0) {
            return { success: false, destroyedCount: 0 };
        }

        tablero[columnaIndex].push(this.dadoActual);

        const destroyedCount = this.destruirDados(columnaIndex, this.dadoActual, esJugador);

        this.dadoActual = 0;
        
        return { success: true, destroyedCount };
    }

}