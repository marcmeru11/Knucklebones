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
        this.unsubscribeSala = null;

        setPersistence(this.auth, browserLocalPersistence).catch((error) => {
            console.error(error);
        });

        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
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
            if (this.auth.currentUser) {
                this.currentUser = this.auth.currentUser;
                resolve(this.auth.currentUser);
                return;
            }
            const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                unsubscribe();
                this.currentUser = user;
                resolve(user);
            });
            setTimeout(() => {
                resolve(this.auth.currentUser);
            }, 2500);
        });
    }

    async checkActiveSession() {
        const user = await this.esperarUsuario();
        if (!user) return null;
        try {
            const snapshot = await get(ref(this.db, `active_players/${user.uid}`));
            if (snapshot.exists()) {
                const data = snapshot.val();
                return typeof data === 'object' ? data.roomId : data;
            }
        } catch (e) {
            console.warn("Firebase Error: Connection failed", e);
        }
        return null;
    }

    async clearActiveSession() {
        const user = await this.esperarUsuario();
        if (!user) return;
        try {
            await remove(ref(this.db, `active_players/${user.uid}`));
        } catch (e) {
            console.error("Firebase Error: Permission denied or connection lost", e);
        }
    }

    async iniciarSesionConGithub() {
        return signInWithPopup(this.auth, this.githubProvider);
    }
    
    async iniciarSesionConGoogle() {
        return signInWithPopup(this.auth, this.googleProvider);
    }
    
    async cerrarSesion() {
        await this.clearActiveSession();
        return signOut(this.auth);
    }
    
    getRol() {
        return this.miRol;
    }

    async limpiarSalasInactivas() {
        const LIMIT = 300000; 
        const roomsRef = ref(this.db, 'rooms');
        const snapshot = await get(roomsRef);
        if (snapshot.exists()) {
            const nowTime = Date.now();
            snapshot.forEach((child) => {
                const data = child.val();
                if (!data.ultimaActividad || (nowTime - data.ultimaActividad > LIMIT)) {
                    remove(ref(this.db, `rooms/${child.key}`));
                }
            });
        }
    }

    async crearSala(salaId, nombreJugador) {
        const user = await this.esperarUsuario();
        if (!user) throw new Error("Firebase Error: Auth session not found");
        
        this.salaId = salaId;
        this.salaRef = ref(this.db, `rooms/${this.salaId}`);
        const snapshot = await get(this.salaRef);
        
        if(snapshot.exists()) throw new Error("Firebase Error: Room already exists");
        
        this.miRol = 'jugador1';
        await set(this.salaRef, {
            ultimaActividad: serverTimestamp(),
            jugador1: { uid: user.uid, nombre: nombreJugador },
            estado: {
                tablero1: [[], [], []],
                tablero2: [[], [], []],
                dadoActual: 0,
                turno: 'jugador1'
            }
        });

        return set(ref(this.db, `active_players/${user.uid}`), { roomId: this.salaId });
    }

    async unirseASala(salaId, nombreJugador) {
        const user = await this.esperarUsuario();
        if (!user) throw new Error("Firebase Error: Auth session not found");

        this.salaId = salaId;
        this.salaRef = ref(this.db, `rooms/${this.salaId}`);
        const snapshot = await get(this.salaRef);
        
        if(!snapshot.exists()) {
            await this.clearActiveSession();
            throw new Error("Firebase Error: Room not found");
        }
        
        const data = snapshot.val();
        if (data.jugador1 && data.jugador1.uid === user.uid) {
            this.miRol = 'jugador1';
        } else if (!data.jugador2 || (data.jugador2 && data.jugador2.uid === user.uid)) {
            this.miRol = 'jugador2';
            await update(this.salaRef, {
                jugador2: { uid: user.uid, nombre: nombreJugador },
                ultimaActividad: serverTimestamp()
            });
        } else {
            throw new Error("Firebase Error: Room is full");
        }

        return set(ref(this.db, `active_players/${user.uid}`), { roomId: this.salaId });
    }

    escucharCambiosSala(callback) {
        if (!this.salaRef) return;
        if (this.unsubscribeSala) this.unsubscribeSala();
        this.unsubscribeSala = onValue(this.salaRef, (snapshot) => {
            if (!snapshot.exists()) {
                callback(null, this.miRol);
                return;
            }
            callback(snapshot.val(), this.miRol);
        });
    }

    async abandonarSala() {
        await this.clearActiveSession();
        if (this.unsubscribeSala) {
            this.unsubscribeSala();
            this.unsubscribeSala = null;
        }
        this.salaId = null;
        this.salaRef = null;
        this.miRol = null;
    }

    async enviarDado(valorDado) {
        const user = await this.esperarUsuario();
        if (!user || !this.salaId) return;
        return update(ref(this.db, `rooms/${this.salaId}`), {
            "estado/dadoActual": valorDado,
            ultimaActividad: serverTimestamp()
        });
    }

    async enviarMovimiento(tab1, tab2, nextTurn) {
        const user = await this.esperarUsuario();
        if (!user || !this.salaId || !this.miRol) return;
        
        const k1 = this.miRol === 'jugador1' ? 'tablero1' : 'tablero2';
        const k2 = this.miRol === 'jugador1' ? 'tablero2' : 'tablero1';
        
        return update(ref(this.db, `rooms/${this.salaId}`), {
            [`estado/${k1}`]: tab1,
            [`estado/${k2}`]: tab2,
            "estado/dadoActual": 0,
            "estado/turno": nextTurn,
            ultimaActividad: serverTimestamp()
        });
    }

    async reiniciarSala() {
        const user = await this.esperarUsuario();
        if (!user || !this.salaId) return;
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