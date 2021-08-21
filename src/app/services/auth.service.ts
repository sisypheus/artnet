import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isSignedIn: boolean = false;
  user$: Observable<any> = this.afAuth.authState.pipe(
    switchMap(user => {
      if (user) {
        return this.afs.doc('users/' + user.uid).valueChanges();
      } else {
        return of(null);
      }
    }
  ));

  constructor(public afAuth: AngularFireAuth, public afs: AngularFirestore) { }

  signUpWithCredentials(email: string, password: string, name: string) {
    this.afAuth.createUserWithEmailAndPassword(email, password).then(
      (success: any) => {
        console.log(success);
        this.updateUserData(success.user, name);
      }
    ).catch(
      (_: any) => {
        alert('Something went wrong');
      }
    );
  }

  signInWithCredentials(email: string, password: string) {
    this.afAuth.signInWithEmailAndPassword(email, password).then(
      (success: any) => {
        this.updateUserData(success.user);
      }
    ).catch(
      (error: any) => {
        console.log(error);
      }
    );
  }

  signInWithGoogle() {
    const googleAuthProvider = new firebase.auth.GoogleAuthProvider();
    this.afAuth.signInWithPopup(googleAuthProvider).then(
      (success: any) => {
        this.updateUserData(success.user);
      }
    ).catch(
      (_: any) => {
        alert('Something went wrong');
      }
    );
  }

  updateUserData(user: firebase.User, name: string | null = null) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc('users/' + user.uid);

    //necessary to avoid resetting user name
    userRef.get().subscribe(
      (doc: any) => {
        const data = {
          uid: user.uid,
          email: user.email,
          displayName: name || doc?.data()?.displayName,
          photoURL: user.photoURL,
        }
        userRef.set(data, { merge: true });
      }
    );
  }

  signOut() {
    this.afAuth.signOut();
  }
}
