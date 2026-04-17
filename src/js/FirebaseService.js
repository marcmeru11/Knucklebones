import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, GithubAuthProvider, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, update, get, serverTimestamp, remove } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

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

        setPersistence(this.auth, browserLocalPersistence).catch((error) => {
            console.error("Error setting persistence:", error);
        });
    }

    observarEstadoSesion(callback) {
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            callback(user);
        });
    }

    esperarUsuario() {
        return new Promise((resolve) => {
            if (this.currentUser) {
                resolve(this.currentUser);
            } else {
                const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                    unsubscribe();
                    this.currentUser = user;
                    resolve(user);
                });
            }
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

    async limpiarSalasInactivas() {
        const LIMITE_INACTIVIDAD = 5 * 60 * 1000; 
        const roomsRef = ref(this.db, 'rooms');
        const snapshot = await get(roomsRef);

        if (snapshot.exists()) {
            const ahora = Date.now();
            snapshot.forEach((childSnapshot) => {
                const salaId = childSnapshot.key;
                const data = childSnapshot.val();

                if (!data.ultimaActividad || (ahora - data.ultimaActividad > LIMITE_INACTIVIDAD)) {
                    remove(ref(this.db, `rooms/${salaId}`));
                    console.log(`Sala ${salaId} eliminada por inactividad.`);
                }
            });
        }
    }

    async crearSala(salaId, nombreJugador) {
        await this.esperarUsuario();
        if (!this.currentUser) throw new Error("You are not logged in.");
        this.salaId = salaId;
        this.salaRef = ref(this.db, `rooms/${this.salaId}`);
        
        const snapshot = await get(this.salaRef);
        if(snapshot.exists()) {
            throw new Error("Room already exists. Join it or choose another name.");
        }
        
        this.miRol = 'jugador1';
        await set(this.salaRef, {
            ultimaActividad: serverTimestamp(),
            jugador1: { uid: this.currentUser.uid, nombre: nombreJugador },
            estado: {
                tablero1: [[], [], []],
                tablero2: [[], [], []],
                dadoActual: 0,
                turno: 'jugador1'
            }
        });
    }

    async unirseASala(salaId, nombreJugador) {
        await this.esperarUsuario();
        if (!this.currentUser) throw new Error("You are not logged in.");
        this.salaId = salaId;
        this.salaRef = ref(this.db, `rooms/${this.salaId}`);
        
        const snapshot = await get(this.salaRef);
        if(!snapshot.exists()) {
           throw new Error("Room does not exist. Please check the code.");
        }
        
        const data = snapshot.val();
        
        if (data.jugador1 && data.jugador1.uid === this.currentUser.uid) {
            this.miRol = 'jugador1';
        } else if (!data.jugador2 || (data.jugador2 && data.jugador2.uid === this.currentUser.uid)) {
            this.miRol = 'jugador2';
            await update(this.salaRef, {
                jugador2: { uid: this.currentUser.uid, nombre: nombreJugador },
                ultimaActividad: serverTimestamp()
            });
        } else {
            throw new Error("Room is full and the game has started.");
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
        await this.esperarUsuario();
        if (!this.salaId) return;
        return update(ref(this.db, `rooms/${this.salaId}`), {
            "estado/dadoActual": valorDado,
            ultimaActividad: serverTimestamp() 
        });
    }

    async enviarMovimiento(tableroLocalMutado, tableroOponenteMutado, nuevoTurno) {
        await this.esperarUsuario();
        if (!this.salaId || !this.miRol) return;
        
        let keyJugador = this.miRol === 'jugador1' ? 'tablero1' : 'tablero2';
        let keyOponente = this.miRol === 'jugador1' ? 'tablero2' : 'tablero1';
        
        return update(ref(this.db, `rooms/${this.salaId}`), {
            [`estado/${keyJugador}`]: tableroLocalMutado,
            [`estado/${keyOponente}`]: tableroOponenteMutado,
            "estado/dadoActual": 0,
            "estado/turno": nuevoTurno,
            ultimaActividad: serverTimestamp()
        });
    }

    async reiniciarSala() {
        if (!this.salaId) return;
        return update(ref(this.db, `rooms/${this.salaId}`), {
            "estado/tablero1": [[], [], []],
            "estado/tablero2": [[], [], []],
            "estado/dadoActual": 0,
            "estado/turno": 'jugador1',
            ultimaActividad: serverTimestamp()
        });
    }
}

export const redFirebase = new FirebaseService();