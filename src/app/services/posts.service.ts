import { HttpClient } from '@angular/common/http';
import { Injectable, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import firebase from 'firebase/app';
import { EventEmitter } from '@angular/core';
import { AuthService } from './auth.service';
import { DocumentReference } from '@angular/fire/firestore';
import { concat } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  posts: any = [];
  API: string = environment.API;

  constructor(private auth: AuthService, private ref: ApplicationRef, private http: HttpClient) { }

  async fetchAllPosts() {
    return firebase.firestore()
      .collectionGroup('userPosts')
      .orderBy('created', 'desc')
      .get()
      .then(async (snapshot: any) => {
        this.auth.user$.subscribe(async (user) => {
          this.posts = snapshot.docs.map(async (doc: any) => {
            const postdata = doc.data();
            postdata.id = doc.id;
            postdata.liked = user ? await this.isPostLiked(postdata) : false;
            postdata.saved = user ? await this.isPostSaved(postdata) : false;
            postdata.comments = user ? await this.getFirstComments(postdata) : false;
            return { ...postdata };
          });
          this.posts = await Promise.all(this.posts).then((posts) => posts);
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

          postdata.saved = await this.isPostSaved(postdata);
          postdata.liked = await this.isPostLiked(postdata);
          postdata.comments = await this.getFirstComments(postdata);

          return { ...postdata };
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
          postdata.comments = await this.getFirstComments(postdata);
          return { ...postdata };
        });
        this.posts = await Promise.all(this.posts).then((posts) => posts);
      });
  }

  async fetchUserPostsFromUid(uid: string) {
    return firebase.firestore()
      .collection('posts')
      .doc(uid)
      .collection('userPosts')
      .orderBy('created', 'desc')
      .get()
      .then(async (querySnapshot) => {
        this.posts = querySnapshot.docs.map(async (doc) => {
          const postdata = doc.data();
          postdata.id = doc.id;
          postdata.liked = await this.isPostLiked(postdata);
          postdata.saved = await this.isPostSaved(postdata);
          postdata.comments = await this.getFirstComments(postdata);
          return { ...postdata };
        });
        this.posts = await Promise.all(this.posts).then((posts) => posts);
      })
  }

  async getLikedPostsFromUid(uid: string) {
    await this.fetchUserPostsFromUid(uid);
    this.posts = this.posts.filter((post: any) => post.liked);
  }

  async getSavedPostsFromUid(uid: string) {
    await this.fetchUserPostsFromUid(uid);
    this.posts = this.posts.filter((post: any) => post.saved);
  }

  async isPostLiked(post: any) {
    const exists = firebase.firestore()
      .collection('posts')
      .doc(post.creator)
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
      .doc(post.creator)
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

  async isCommentLiked(post: any, comment: any) {
    const exists = firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .get()
      .then((doc) => {
        return doc.exists;
      });
    return await exists;
  }

  savePost(post: any) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('saved')
      .doc(this.auth.user?.uid)
      .set({});
    post.saved = true;
  }

  unsavePost(post: any) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('saved')
      .doc(this.auth.user?.uid)
      .delete();
    post.saved = false;
  }

  likePost(post: any) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .set({});
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .update({ likes: firebase.firestore.FieldValue.increment(1) });
    post.liked = true;
    post.likes += 1;
  }

  unlikePost(post: any) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .delete();
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .update({ likes: firebase.firestore.FieldValue.increment(-1) });
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
  }

  addComment(post: any, comment: string) {
    let toAdd = {
      id: '', 
      content: comment,
      created: firebase.firestore.FieldValue.serverTimestamp(),
      creator: this.auth.user?.uid,
      creatorDisplayName: this.auth.user?.displayName,
      replies: [],
      nblikes: 0,
    }
    const docRef = firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .add({
        content: toAdd.content,
        created: toAdd.created,
        creator: toAdd.creator,
        nblikes: 0,
      });
    docRef.then((doc) => {
      toAdd.id = doc.id;
      post.comments.push({ ...toAdd });
    });
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .update({ nbComments: firebase.firestore.FieldValue.increment(1) });
    post.nbComments += 1;
  }

  addReply(post: any, comment: any, reply: string) {
    let toAdd = {
      id: '', 
      content: reply,
      created: firebase.firestore.FieldValue.serverTimestamp(),
      creator: this.auth.user?.uid,
      creatorDisplayName: this.auth.user?.displayName,
      nblikes: 0,
    }
    const docRef = firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('replies')
      .add({
        content: toAdd.content,
        created: toAdd.created,
        creator: toAdd.creator,
        nblikes: 0,
      });
    docRef.then((doc) => {
      toAdd.id = doc.id;
      comment.replies.push({ ...toAdd });
    });
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .update({ nbReplies: firebase.firestore.FieldValue.increment(1) });
    post.nbReplies += 1;
  }

  deleteReply(post: any, comment: any, reply: any) {
    const document = firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('replies')
      .doc(reply.id)

    document.collection('likes')
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref.delete();
        });
      });
    document.delete();
    comment.replies = comment.replies.filter((reply: any) => reply.id !== reply.id);
  }

  deleteComment(post: any, comment: any) {
    const doc = firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .get()
      .then((querySnapshot) => {
        const options = { body: {document: querySnapshot.ref.path} };
        this.http.delete(`${this.API}delete/recursive/`, options).subscribe();
      });
    //update number of comments of post
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .update({ nbComments: firebase.firestore.FieldValue.increment(-1) })
      .catch(() => {
        // The document doesn't exist but we know it.
      });
    //remove the comment from the post variable
    post.comments = post.comments.filter((c: any) => c.id !== comment.id);
    post.nbComments -= 1;
  }

  async getFirstComments(post: any) {
    const comments = await firebase.firestore()
      .collection('posts')
      .doc(post?.creator)
      .collection('userPosts')
      .doc(post?.id)
      .collection('comments')
      .orderBy('created', 'asc')
      .get()
      .then(async (querySnapshot) => {
        const comments = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const comment = doc.data();
          comment.id = doc.id;
          comment.replies = await this.getFirstReply(post, doc.id);
          comment.liked = await this.isCommentLiked(post, comment);
          return { ...comment };
        }));
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
          return { ...comment };
        });
        return comments;
      });
  }

  async getFirstReply(post: any, commentId: string) {
    const reply = await firebase.firestore()
      .collection('posts')
      .doc(post?.creator)
      .collection('userPosts')
      .doc(post?.id)
      .collection('comments')
      .doc(commentId)
      .collection('replies')
      .orderBy('created', 'desc')
      .limit(1)
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.docs.length > 0) {
          const reply = querySnapshot.docs[0].data();
          reply.id = querySnapshot.docs[0].id;
          return [reply];
        } else {
          return [];
        }
      });
    return reply;
  }

  async getAllReplies(post: any, commentId: string) {
    const replies = await firebase.firestore()
      .collection('posts')
      .doc(post?.creator)
      .collection('userPosts')
      .doc(post?.id)
      .collection('comments')
      .doc(commentId)
      .collection('replies')
      .orderBy('created', 'desc')
      .get()
      .then((querySnapshot) => {
        const replies = querySnapshot.docs.map((doc) => {
          const reply = doc.data();
          reply.id = doc.id;
          return { ...reply };
        });
        return replies;
      });
    return replies;
  }

  editComment(post: any, comment: any, newComment: string) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .update({ content: newComment });
    comment.content = newComment;
  }

  editReply(post: any, comment: any, reply: any, newReply: string) {
    console.log(post, comment, reply, newReply);
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('replies')
      .doc(reply.id)
      .update({ content: newReply });
    reply.content = newReply;
  }

  unlikeComment(post: any, comment: any) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .delete();
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .update({ nblikes: firebase.firestore.FieldValue.increment(-1) });
    comment.liked = false;
    comment.nblikes -= 1;
  }

  likeComment(post: any, comment: any) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .set({});
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .update({ nblikes: firebase.firestore.FieldValue.increment(1) });
    comment.liked = true;
    comment.nblikes += 1;
  }

  likeReply(post: any, comment: any, reply: any) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('replies')
      .doc(reply.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .set({});
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('replies')
      .doc(reply.id)
      .update({ nblikes: firebase.firestore.FieldValue.increment(1) });
    reply.liked = true;
    reply.nblikes += 1;
  }

  unlikeReply(post: any, comment: any, reply: any) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('replies')
      .doc(reply.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .delete();
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('replies')
      .doc(reply.id)
      .update({ nblikes: firebase.firestore.FieldValue.increment(-1) });
    reply.liked = false;
    reply.nblikes -= 1;
  }

  deletePost(post: any) {
    if (post.file)
      firebase.storage().refFromURL(post.file).delete().catch((err) => { console.log(err); });
    const doc = firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .get()
      .then((querySnapshot) => {
        const options = { body: {document: querySnapshot.ref.path} };
        this.http.delete(`${this.API}delete/recursive/`, options).subscribe();
      });
    this.posts = this.posts.filter((object: any) => object.id !== post.id);
  }

  addView(post: any) {
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .update({ nbviews: firebase.firestore.FieldValue.increment(1) });
    post.nbviews++;
  }

  //      DANGER DANGER DANGER
  //      DANGER DANGER DANGER
  //      DANGER DANGER DANGER
  // deleteAllUsers() {
  //   firebase.firestore()
  //     .collectionGroup('users')
  //     .get()
  //     .then((querySnapshot) => {
  //       querySnapshot.forEach((doc) => {
  //         const options = { body: {user: doc.ref.path}}
  //         this.http.delete(`${this.API}delete/user/`, options).subscribe(() => {
  //           console.log('user deleted')
  //         }, (err) => {
  //           console.log(err);
  //         });
  //       })
  //     })
  // }

  // deleteAllPosts() {
  //   firebase.firestore()
  //     .collectionGroup('userPosts')
  //     .get()
  //     .then((querySnapshot) => {
  //       querySnapshot.forEach((doc) => {
  //         const options = { body: {document: doc.ref.path}}
  //         this.http.delete(`${this.API}delete/recursive/`, options).subscribe(() => {
  //           console.log('document deleted')
  //         }, (err) => {
  //           console.log(err);
  //         });
  //       })
  //     })
  // }
}
