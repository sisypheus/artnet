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

  async fileUploader(): Promise<String> {
    const path = `post/${this.auth.user?.uid}/${Date.now()}`;
    const ref = this.storage.ref(path);
    const task = await this.storage.upload(path, this.file);
    return this.storage.ref(path).getDownloadURL().toPromise();
  }

  submitPost(): void {
    if (!this.caption && !this.file)
      return;

    //file handling
    if (!this.file) {
      firebase.firestore()
        .collection('posts')
        .doc(this.auth.user?.uid)
        .collection('userPosts')
        .add({
          caption: this.caption,
        });
        return;
    }
    this.fileUploader().then(url => {
      firebase.firestore()
        .collection('posts')
        .doc(this.auth.user?.uid)
        .collection('userPosts')
        .add({
          caption: this.caption,
          file: url,
        });
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];
    this.file = file;
    this.fileName = file.name;
  }
}
