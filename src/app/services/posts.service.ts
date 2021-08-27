import { Injectable, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import firebase from 'firebase/app';
import { EventEmitter } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  posts: any = [];

  constructor(private auth: AuthService, private ref: ApplicationRef) { }

  async fetchAllPosts() {
    firebase.firestore()
      .collectionGroup('userPosts')
      .orderBy('created', 'desc')
      .get()
      .then((snapshot: any) => {
        this.auth.user$.subscribe(async (user) => {
            this.posts = snapshot.docs.map(async (doc: any) => {
              const postdata = doc.data();
              postdata.id = doc.id;

              if (user)
                postdata.liked = await this.isPostLiked(postdata);
              else
                postdata.liked = false;
              return { ...postdata};
            });
            this.posts = await Promise.all(this.posts).then((posts) => posts);
          }
        );
      });
  }

  async fetchUserPosts() {
    return firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .orderBy('created', 'desc')
      .get()
      .then(async (querySnapshot) => {
        this.posts = querySnapshot.docs.map(async (doc) => {
          const postdata = doc.data();
          postdata.id = doc.id;
          postdata.liked = await this.isPostLiked(postdata);
          return { ...postdata};
        });
        this.posts = await Promise.all(this.posts).then((posts) => posts);
      });
  }

  async isPostLiked(post: any) {
    const exists = await firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(post.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .get()
      .then((doc) => {
        return doc.exists;
      });
    return exists;
  }

  fetchUserSavedPosts(): void {
    //
  }

  fetchAllLikedPosts(post: any, index: number) {
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(post.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .onSnapshot((snapshot: any) => {
        post.liked = snapshot.exists;
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
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(postId)
      .update({likes: firebase.firestore.FieldValue.increment(1)});
    let post = this.posts.find((post: any) => post.id === postId);
    post.liked = true;
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
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(postId)
      .update({likes: firebase.firestore.FieldValue.increment(-1)});
    let post = this.posts.find((post: any) => post.id === postId);
    post.liked = false;
  }

  async getLikedPosts() {
    await this.fetchUserPosts();
    this.posts = this.posts.filter((post: any) => post.liked);
  }
}
