import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/app';
import { AngularFireStorage } from '@angular/fire/storage';
import { AuthService } from '../services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  caption: string = '';
  fileName: string = '';
  file: File | null = null ;
  posts: any[] = [];

  constructor(private afs: AngularFirestore, public auth: AuthService, private storage: AngularFireStorage, private uService: UserService) {}

  ngOnInit():void {
    this.fetchAllPosts();
  }

  async fileUploader(): Promise<any> {
    const path = `post/${this.auth.user?.uid}/${Date.now()}`;
    const task = await this.storage.upload(path, this.file);
    const metadata = await this.storage.ref(path).getMetadata().toPromise().then((value: any) => value).catch((error: any) => error);
    const res = await this.storage.ref(path).getDownloadURL().toPromise().then((value: any) => value).catch((error: any) => error);
    return [res, metadata.contentType];
  }

  async submitPost(caption: string): Promise<void> {
    if (!caption && !this.file)
      return;
    else if (!this.auth.user)
      return;
    if (!this.file) {
      firebase.firestore()
        .collection('posts')
        .doc(this.auth.user?.uid)
        .collection('userPosts')
        .add({
          caption: caption,
          created: firebase.firestore.FieldValue.serverTimestamp(),
          creator: this.auth.user?.uid
        }).finally(() => {
          this.fetchAllPosts();
        });
        this.caption = '';
    } else {
    //file handling
      this.fileUploader().then(([url, metadata]) => {
        firebase.firestore()
          .collection('posts')
          .doc(this.auth.user?.uid)
          .collection('userPosts')
          .add({
            caption: caption,
            file: url,
            fileType: metadata,
            created: firebase.firestore.FieldValue.serverTimestamp(),
            creator: this.auth.user?.uid,
          }).finally(() => {
            this.fetchAllPosts();
          });
      }).catch(error => alert(error));
    }
    this.caption = '';
    this.file = null;
    this.fileName = '';
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];
    this.file = file;
    this.fileName = file.name;
  }

  fetchAllPosts(): void {
    firebase.firestore()
      .collectionGroup('userPosts')
      .orderBy('created', 'desc')
      .get()
      .then((snapshot: any) => {
        this.posts = snapshot.docs.map((doc: any) => {
          const postdata = doc.data();
          postdata.id = doc.id;
          return { ...postdata};
        });
      });
  }
}
