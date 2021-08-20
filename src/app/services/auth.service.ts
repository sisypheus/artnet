import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isSignedIn: boolean = false;

  constructor(public afAuth: AngularFireAuth) { 
    //watching for changes in the authentication state
    this.afAuth.authState.subscribe(
      (user: any) => {
        if (user)
          this.isSignedIn = true;
        else
          this.isSignedIn = false;
      }
    );
  }

  signUpWithCredentials(email: string, password: string) {
    this.afAuth.createUserWithEmailAndPassword(email, password).then(
      (success: any) => {
        console.log(success);
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
        console.log(success);
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
        console.log(success);
        console.log(this.afAuth.user);
      }
    ).catch(
      (_: any) => {
        alert('Something went wrong');
      }
    );
  }

  signOut() {
    this.afAuth.signOut();
  }
}
