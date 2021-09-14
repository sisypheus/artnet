import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
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
  loggedIn: any = true;
  user$: Observable<any> = this.afAuth.authState.pipe(
    switchMap(user => {
      if (user)
        return this.afs.doc('users/' + user.uid).valueChanges();
      else
        return of(null);
    }
  ));
  private API = environment.API;
  loginPersistence: string | null = localStorage.getItem('login');
  user: firebase.User | null = null;

  constructor(private http: HttpClient, public afAuth: AngularFireAuth, public afs: AngularFirestore) {
    this.user$.subscribe(
      (user: firebase.User | null) => {
        this.user = user;
        if (user) {
          localStorage.setItem('login', user.uid);
          this.loginPersistence = localStorage.getItem('login');
        } else {
          localStorage.removeItem('login');
          this.loginPersistence = null;
        }
      }
    );
  }

  signUpWithCredentials(email: string, password: string, name: string) {
    this.afAuth.createUserWithEmailAndPassword(email, password).then(
      (success: any) => {
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
    userRef.get().toPromise().then(
      (doc: any) => {
        const data = {
          uid: user.uid,
          email: user.email,
          displayName: name || doc?.data()?.displayName,
          photoURL: user.photoURL,
        }
        if (doc && doc.data()) {
          if (data.displayName === doc.data().displayName &&
          data.uid === doc.data().uid &&
          data.email === doc.data().email &&
          data.photoURL === doc.data().photoURL) {
            return;
          }
        }
        //backend call to add to algolia index
        this.http.post<any>(this.API + 'create/user', data).toPromise().then(
          (success: any) => {
            console.log(success);
          }, 
          (error: any) => {
            console.log(error);
          }
        );
        //userRef.set(data, { merge: true });
      }
    );
  }

  signOut() {
    this.afAuth.signOut();
  }
}
