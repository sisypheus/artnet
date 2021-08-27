import { AngularFirestoreDocument } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private auth: AuthService) { }

  async getUserFromUid(uid: string): Promise<string> {
    return this.auth.afs.doc('users/' + uid).get().toPromise().then(
      (doc: any) => {
        return doc.data()?.displayName;
      }
    ).catch(
      (error) => 'undefined'
    );
  }
}