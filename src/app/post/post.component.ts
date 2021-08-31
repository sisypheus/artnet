import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import firebase from 'firebase/app';
import { PostsService } from '../services/posts.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
})
export class PostComponent implements OnInit {
  @Input('post') post: any;
  author: string = '';
  options: boolean = false;
  safeUrl: SafeResourceUrl = '';
  postOwner: boolean = false;
  replying: any = null;
  comment: string = '';

  constructor(private router: Router, private postsService: PostsService, private uService: UserService, public auth: AuthService, public sanitizer: DomSanitizer) {
  }
  
  ngOnInit() {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.post.file);
    this.uService.getUserFromUid(this.post.creator).then(user => {
      this.author = user?.displayName;
      this.auth.user$.subscribe(authuser => {
        if (authuser) {
          if (authuser?.uid === user?.uid)
            this.postOwner = true;
        }
      });
    });
    if (this.post.comments) {
      //setting real name from uid for each comment
      this.post.comments.forEach((comment:any) => {
        comment.options = false;
        this.uService.getUserFromUid(comment.creator).then(user => {
          comment.author = user?.displayName;
        });
        //setting real name from uid for each reply
        comment.replies.forEach((reply:any) => {
          comment.options = false;
          this.uService.getUserFromUid(reply.creator).then(user => {
            reply.author = user?.displayName;
          });
        });
      });
    }
  }

  setAllCommentOptions() {
    if (this.post.comments) {
      this.post.comments.forEach((comment:any) => {
        comment.options = false;
      });
    }
  }

  setAllReplyOptions(comment: any) {
    if (comment.replies) {
      comment.replies.forEach((reply:any) => {
        reply.options = false;
      });
    }
  }

  setCommentOptions(comment: any, state: boolean) {
    this.setAllCommentOptions();
    comment.options = !state;
  }

  needAuth() {
    this.router.navigate(['/auth']);
  }

  addComment() {
    this.postsService.addComment(this.post, this.comment);
    this.comment = '';
  }

  setLike() {
    if (this.post.liked)
      this.postsService.unlikePost(this.post);
    else
      this.postsService.likePost(this.post);
  }

  setSave() {
    if (this.post.saved)
      this.postsService.unsavePost(this.post);
    else
      this.postsService.savePost(this.post);
  }

  setOptions() {
    this.options = !this.options;
  }

  deletePost() {
    this.postsService.deletePost(this.post);
  }

  //comment utilities
  setCommentLike(comment: any) {
    if (!this.auth.user) {
      this.router.navigate(['/auth']);
      return;
    }
    if (comment.liked)
      this.postsService.unlikeComment(this.post, comment);
    else
      this.postsService.likeComment(this.post, comment);
  }

  deleteComment(comment: any) {
    this.postsService.deleteComment(this.post, comment);
  }

  setReply(comment: any) {
    this.replying = comment;
  }

  setReplyOptions(reply: any, state: boolean) {
    this.setAllReplyOptions(reply);
    reply.options = !state;
  }

  setReplyLike(comment: any, reply: any) {
    if (!this.auth.user) {
      this.router.navigate(['/auth']);
      return;
    }
    if (reply.liked)
      this.postsService.unlikeReply(this.post, comment, reply);
    else
      this.postsService.likeReply(this.post, comment, reply);
  }

  deleteReply(comment:any, reply: any) {
    this.postsService.deleteReply(this.post, comment, reply);
  }

  addReply() {
    this.postsService.addReply(this.post, this.replying, this.comment);
    this.comment = '';
    this.replying = null;
  }
}
