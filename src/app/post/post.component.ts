import { Component, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {
  @Input('post') post: any;
  @Input('like') like: boolean = false;
  //use a service
  //@Output() deletePost = new EventEmitter<>;
  //@Output() likePost = new EventEmitter<>;
  author: string = '';

  constructor( private uService: UserService, public auth: AuthService) {
  }

  async ngOnInit() {
    this.author = await this.uService.getUserFromUid(this.post.creator);
  }
}
