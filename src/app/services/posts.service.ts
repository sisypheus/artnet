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
    return firebase.firestore()
      .collectionGroup('userPosts')
      .orderBy('created', 'desc')
      .get()
      .then(async (snapshot: any) => {
        this.auth.user$.subscribe(async (user) => {
          if (user) {
            this.posts = snapshot.docs.map(async (doc: any) => {
              const postdata = doc.data();
              postdata.id = doc.id;
              postdata.liked = await this.isPostLiked(postdata);
              postdata.saved = await this.isPostSaved(postdata);
              postdata.comments = await this.getFirstComments(postdata);
              return { ...postdata};
            });
            this.posts = await Promise.all(this.posts).then((posts) => posts);
          } else {
            this.posts = snapshot.docs.map(async (doc: any) => {
              const postdata = doc.data();
              postdata.id = doc.id;
              postdata.liked = false;
              postdata.saved = false;
              postdata.comments = await this.getFirstComments(postdata);
              return { ...postdata};
            });
            this.posts = await Promise.all(this.posts).then((posts) => posts);
          }
        });
      });
  }

  async fetchAllPostsLogin() {
    return firebase.firestore()
      .collectionGroup('userPosts')
      .orderBy('created', 'desc')
      .get()
      .then(async (snapshot: any) => {
            this.posts = snapshot.docs.map(async (doc: any) => {
              const postdata = doc.data();
              postdata.id = doc.id;

              if (this.auth.user) {
                postdata.saved = await this.isPostSaved(postdata);
                postdata.liked = await this.isPostLiked(postdata);
              } else
                postdata.liked = false;
              return { ...postdata};
            });
            this.posts = await Promise.all(this.posts).then((posts) => posts);
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
          postdata.saved = await this.isPostSaved(postdata);
          return { ...postdata};
        });
        this.posts = await Promise.all(this.posts).then((posts) => posts);
      });
  }

  async isPostLiked(post: any) {
    const exists = firebase.firestore()
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
    return await exists;
  }

  async isPostSaved(post: any) {
    const exists = firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(post.id)
      .collection('saved')
      .doc(this.auth.user?.uid)
      .get()
      .then((doc) => {
        return doc.exists;
      });
    return await exists;
  }

  savePost(postId: string) {
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(postId)
      .collection('saved')
      .doc(this.auth.user?.uid)
      .set({});
    let post = this.posts.find((post: any) => post.id === postId);
    post.saved = true;
  }

  unsavePost(postId: string) {
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(postId)
      .collection('saved')
      .doc(this.auth.user?.uid)
      .delete();
    let post = this.posts.find((post: any) => post.id === postId);
    post.saved = false;
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
    post.likes += 1;
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
    post.likes -= 1;
  }

  async getLikedPosts() {
    await this.fetchAllPostsLogin();
    this.posts = this.posts.filter((post: any) => post.liked);
  }

  async getSavedPosts() {
    await this.fetchAllPostsLogin();
    this.posts = this.posts.filter((post: any) => post.saved);
    console.log(this.posts);
  }

  addComment(post: any, comment: string) {
    const toAdd = {
      content: comment,
      created: firebase.firestore.FieldValue.serverTimestamp(),
      creator: this.auth.user?.uid,
    }
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .add(toAdd);
  }

  async getFirstComments(post: any) {
    const comments = await firebase.firestore()
      .collection('posts')
      .doc(post?.creator)
      .collection('userPosts')
      .doc(post?.id)
      .collection('comments')
      .orderBy('created', 'desc')
      .get()
      .then((querySnapshot) => {
        const comments = querySnapshot.docs.map((doc) => {
          const comment = doc.data();
          comment.id = doc.id;
          return {...comment};
        });
        return comments;
      });
      return comments;
  }

  async getAllComments(post: any) {
    return firebase.firestore()
      .collection('posts')
      .doc(post?.creator)
      .collection('userPosts')
      .doc(post?.id)
      .collection('comments')
      .orderBy('created', 'desc')
      .get()
      .then((querySnapshot) => {
        let comments = querySnapshot.docs.map((doc) => {
          const comment = doc.data();
          comment.id = doc.id;
          return {...comment};
        });
        return comments;
      });
  }

  deletePost(post: any) {
    if (post.file)
      firebase.storage().refFromURL(post.file).delete().catch((err) => {console.log(err);});
    //delete first the subcollections of the post
    const collection = ['likes', 'comments', 'saved'];
    for (let i = 0; i < 3; i++) {
      firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(post.id)
      .collection(collection[i])
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref.delete();
        });
      });
    }
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(post.id)
      .delete();
    this.posts = this.posts.filter((object: any) => object.id !== post.id);
  }
}
