import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import firebase from 'firebase/app';
import { PostsService } from '../services/posts.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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

  constructor( private postsService: PostsService, private uService: UserService, public auth: AuthService, public sanitizer: DomSanitizer) {
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
  }

  setLike() {
    if (this.post.liked)
      this.postsService.unlikePost(this.post.id);
    else
      this.postsService.likePost(this.post.id);
  }

  setSave() {
    if (this.post.saved)
      this.postsService.unsavePost(this.post.id);
    else
      this.postsService.savePost(this.post.id);
  }

  setOptions() {
    this.options = !this.options;
  }

  deletePost() {
    this.postsService.deletePost(this.post);
  }
}
