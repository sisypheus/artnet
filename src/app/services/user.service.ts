import { AngularFirestoreDocument } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
//import environment
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  searchedUsers: any[] = [];
  private API = environment.API;

  constructor(private auth: AuthService, private http: HttpClient) { }

  async getUserFromUid(uid: string): Promise<any> {
    return this.auth.afs.doc('users/' + uid).get().toPromise().then(
      (doc: any) => {
        return doc.data();
      }
    ).catch(
      (error) => 'undefined'
    );
  }

  //search
  async searchUsers(search: string): Promise<any> {
    this.http.get<any>(this.API + 'search/user/' + search).toPromise().then((res: any) => {
      this.searchedUsers = res;
    });
  }
}
