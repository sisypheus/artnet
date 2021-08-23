import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/app';
import { AngularFireStorage } from '@angular/fire/storage';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  caption: string = '';
  fileName: string = '';
  file: File | null = null ;
  constructor(public auth: AuthService, private storage: AngularFireStorage) { }

  async fileUploader(): Promise<any> {
    const path = `post/${this.auth.user?.uid}/${Date.now()}`;
    const task = await this.storage.upload(path, this.file);
    const metadata = await this.storage.ref(path).getMetadata().toPromise().then(value => value);
    const res = await this.storage.ref(path).getDownloadURL().toPromise().then(value => value);
    return [res, metadata.contentType];
  }

  submitPost(caption: string): void {
    if (!caption && !this.file)
      return;

    if (!this.file) {
      firebase.firestore()
        .collection('posts')
        .doc(this.auth.user?.uid)
        .collection('userPosts')
        .add({
          caption: caption,
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
            fileType: metadata
          });
      });
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
}
