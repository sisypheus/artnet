import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import firebase from 'firebase/app';
import { PostsService } from '../services/posts.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
})
export class PostComponent implements OnInit {
  @Input('post') post: any;
  author: string = '';
  fields: number = 0;

  constructor( private postsService: PostsService, private uService: UserService, public auth: AuthService, public ref: ChangeDetectorRef) {
    //required to know if user liked it or not
    setInterval(() => {}, 0);
  }

  ngOnInit() {
    this.uService.getUserFromUid(this.post.creator).then(user => this.author = user);
  }

  setLike() {
    if (this.post.liked)
      this.postsService.unlikePost(this.post.id);
    else
      this.postsService.likePost(this.post.id);
  }
}
