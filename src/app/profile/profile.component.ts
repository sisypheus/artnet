import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/app';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  posts: any[] = [];

  constructor(private auth: AuthService) { }

  ngOnInit(): void {
    this.fetchUserPosts();
  }

  fetchUserPosts(): void {
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .orderBy('created', 'desc')
      .get()
      .then((querySnapshot) => {
        this.posts = querySnapshot.docs.map((doc) => {
          const postdata = doc.data();
          postdata.id = doc.id;
          return { ...postdata};
        });
        console.log(this.posts);
      });
  }

}
