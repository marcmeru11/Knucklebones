import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, GithubAuthProvider, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, update, get } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTHDOMAIN",
  projectId: "FIREBASE_PROJECTID",
  databaseURL: "FIREBASE_DATABASEURL",
  storageBucket: "FIREBASE_STORAGEBUCKET",
  messagingSenderId: "FIREBASE_MESSAGINGSENDERID",
  appId: "FIREBASE_APPID",
  measurementId: "FIREBASE_MEASUREMENTID"
};

class FirebaseService {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.githubProvider = new GithubAuthProvider();
        this.googleProvider = new GoogleAuthProvider();
        this.db = getDatabase(this.app);
        
        this.currentUser = null;
        this.salaId = null;
        this.salaRef = null;
        this.miRol = null;
    }

    observarEstadoSesion(callback) {
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            callback(user);
        });
    }

    async iniciarSesionConGithub() {
        return signInWithPopup(this.auth, this.githubProvider);
    }
    
    async iniciarSesionConGoogle() {
        return signInWithPopup(this.auth, this.googleProvider);
    }
    
    async cerrarSesion() {
        return signOut(this.auth);
    }
    
    getRol() {
        return this.miRol;
    }

    async crearSala(salaId, nombreJugador) {
        if (!this.currentUser) throw new Error("No estás logueado.");
        this.salaId = salaId;
        this.salaRef = ref(this.db, `partidas/${this.salaId}`);
        
        const snapshot = await get(this.salaRef);
        if(snapshot.exists()) {
            throw new Error("Esa sala ya existe. Únete a ella o elige otro nombre.");
        }
        
        this.miRol = 'jugador1';
        await set(this.salaRef, {
            jugador1: { uid: this.currentUser.uid, nombre: nombreJugador },
            jugador2: null,
            estado: {
                tablero1: [[], [], []],
                tablero2: [[], [], []],
                dadoActual: 0,
                turno: 'jugador1'
            }
        });
    }

    async unirseASala(salaId, nombreJugador) {
        if (!this.currentUser) throw new Error("No estás logueado.");
        this.salaId = salaId;
        this.salaRef = ref(this.db, `partidas/${this.salaId}`);
        
        const snapshot = await get(this.salaRef);
        if(!snapshot.exists()) {
           throw new Error("La sala no existe. Verifica el código.");
        }
        
        const data = snapshot.val();
        
        if (data.jugador1 && data.jugador1.uid === this.currentUser.uid) {
            this.miRol = 'jugador1';
        } else if (!data.jugador2 || (data.jugador2 && data.jugador2.uid === this.currentUser.uid)) {
            this.miRol = 'jugador2';
            await update(this.salaRef, {
                jugador2: { uid: this.currentUser.uid, nombre: nombreJugador }
            });
        } else {
            throw new Error("La sala ya está llena y la partida ha empezado.");
        }
    }

    escucharCambiosSala(callback) {
        if (!this.salaRef) return;
        onValue(this.salaRef, (snapshot) => {
            if (!snapshot.exists()) return;
            const data = snapshot.val();
            callback(data, this.miRol);
        });
    }

    async enviarDado(valorDado) {
        if (!this.salaId) return;
        return update(ref(this.db, `partidas/${this.salaId}/estado`), {
            dadoActual: valorDado
        });
    }

    async enviarMovimiento(tableroLocalMutado, tableroOponenteMutado, nuevoTurno) {
        if (!this.salaId || !this.miRol) return;
        
        let keyJugador = this.miRol === 'jugador1' ? 'tablero1' : 'tablero2';
        let keyOponente = this.miRol === 'jugador1' ? 'tablero2' : 'tablero1';
        
        return update(ref(this.db, `partidas/${this.salaId}/estado`), {
            [keyJugador]: tableroLocalMutado,
            [keyOponente]: tableroOponenteMutado,
            dadoActual: 0,
            turno: nuevoTurno
        });
    }

    async reiniciarSala() {
        if (!this.salaId) return;
        return update(ref(this.db, `partidas/${this.salaId}/estado`), {
            tablero1: [[], [], []],
            tablero2: [[], [], []],
            dadoActual: 0,
            turno: 'jugador1'
        });
    }
}

export const redFirebase = new FirebaseService();
