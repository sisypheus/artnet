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
  action: 'Editing' | 'Replying' | 'Commenting' = 'Commenting';
  replyEdit: any = null;
  commentReply: any = null;
  replying: any = null;
  editing: any = null;
  comment: string = '';
  playedFile: boolean = false;

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

  ngAfterViewChecked() {
    if (this.post.file && (!this.post.fileType.includes('image/')) && !this.playedFile) {
      const file = document.getElementById(this.post.id) as HTMLMediaElement;
      file.addEventListener('play', () => {
        if (!this.playedFile)
          this.postsService.addView(this.post);
        file.removeEventListener('play', () => {});
        this.playedFile = true;
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
    if (!comment) {
      this.replying = null;
      this.action = 'Commenting';
      return;
    }
    this.action = 'Replying';
    this.editing = null;
    this.replying = comment;
  }

  setEdit(comment: any) {
    if (!comment) {
      this.editing = null;
      this.action = 'Commenting';
      return;
    }
    this.action = 'Editing';
    this.editing = comment;
    this.replying = null;
    this.comment = comment.content;
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
    this.action = 'Commenting';
  }

  async loadAllReplies(comment: any) {
    const replies = await this.postsService.getAllReplies(this.post, comment.id);
    replies.forEach((reply:any) => {
      this.uService.getUserFromUid(reply.creator).then(user => {
        reply.author = user?.displayName;
      });
    })
    comment.replies = replies;
  }

  editComment() {
    this.postsService.editComment(this.post, this.editing, this.comment);
    this.action = 'Commenting';
    this.editing = null;
    this.replying = null;
    this.comment = '';
  }

  setReplyEdit(comment: any, reply: any) {
    if (!reply) {
      this.replyEdit = false;
      this.editing = null;
      this.action = 'Commenting';
      this.commentReply = null;
      return;
    }
    this.commentReply = comment;
    this.replyEdit = true;
    this.action = 'Editing';
    this.editing = reply;
    this.comment = reply.content;
  }

  editReply() {
    this.postsService.editReply(this.post, this.commentReply, this.editing, this.comment);
    this.action = 'Commenting';
    this.editing = null;
    this.replying = null;
    this.comment = '';
    this.commentReply = null;
  }

  resetInput() {
    this.comment = '';
  }
}
