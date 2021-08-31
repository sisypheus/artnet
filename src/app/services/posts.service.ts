import { Injectable, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import firebase from 'firebase/app';
import { EventEmitter } from '@angular/core';
import { AuthService } from './auth.service';
import { DocumentReference } from '@angular/fire/firestore';
import { concat } from 'rxjs';

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
              return { ...postdata };
            });
          } else {
            this.posts = snapshot.docs.map(async (doc: any) => {
              const postdata = doc.data();
              postdata.id = doc.id;
              postdata.liked = false;
              postdata.saved = false;
              postdata.comments = await this.getFirstComments(postdata);
              return { ...postdata };
            });
          }
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
      .doc(this.auth.user?.uid)
      .collection('userPosts')
      .doc(post.id)
      .collection('likes')
      .doc(this.auth.user?.uid)
      .set({});
    firebase.firestore()
      .collection('posts')
      .doc(this.auth.user?.uid)
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
      .doc(this.auth.user?.uid)
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
    console.log(this.posts);
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
  }

  deleteComment(post: any, comment: any) {
    //deleting all subcollections of this comment
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('likes')
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          console.log(doc.id);
          doc.ref.delete();
        });
      });

    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .collection('replies')
      .get()
      .then((querySnapshot) => {
        querySnapshot.docs.map((doc) => {
          //deleting all likes of each reply
          firebase.firestore()
            .collection('posts')
            .doc(post.creator)
            .collection('userPosts')
            .doc(post.id)
            .collection('comments')
            .doc(comment.id)
            .collection('replies')
            .doc(doc.id)
            .collection('likes')
            .get()
            .then((querySnapshot) => {
              //deleting all likes for this reply
              querySnapshot.forEach((doc) => {
                doc.ref.delete();
              });
            });
          //delete each reply
          doc.ref.delete();
        });
      })

    //delete the post document
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .collection('comments')
      .doc(comment.id)
      .get()
      .then((doc) => {
        doc.ref.delete();
      });
    //update number of comments of post
    firebase.firestore()
      .collection('posts')
      .doc(post.creator)
      .collection('userPosts')
      .doc(post.id)
      .update({ nbComments: firebase.firestore.FieldValue.increment(-1) });
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
      .orderBy('created', 'desc')
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
            //TODO delete each comment of each post
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
