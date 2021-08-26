import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  posts: any = [];

  constructor(private auth: AuthService) { }

  fetchAllPosts() {
    firebase.firestore()
      .collectionGroup('userPosts')
      .orderBy('created', 'desc')
      .get()
      .then((snapshot: any) => {
        this.posts = snapshot.docs.map((doc: any) => {
          const postdata = doc.data();
          postdata.id = doc.id;
          postdata.liked = false;
          return { ...postdata};
        });
        //comments later
        this.auth.user$.subscribe((user: any) => {
          if (user) {
            for (let i = 0; i < this.posts.length; i++)
              this.fetchAllLikedPosts(this.posts[i], i);
          }
        });
      });
  }

  fetchAllLikedPosts(post: any, index: number) {
    if (!this.posts.length) {
      console.log('mete');
    }
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(post.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .onSnapshot((snapshot: any) => {
        post.liked = snapshot.exists;
        this.posts = [].concat(this.posts);
      });
  }

  likePost(postId: string) {
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(postId)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .set({});
  }

  unlikePost(postId: string) {
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(postId)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .delete();
  }
}
