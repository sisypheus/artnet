import { UserService } from './../services/user.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PostsService } from '../services/posts.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  posts: any[] = [];
  current: string = 'Posts';
  selected: string = 'cursor-pointer text-xl font-bold underline';
  not: string = 'cursor-pointer text-xl font-bold';
  user: any = undefined;

  constructor(private router: Router, private route: ActivatedRoute, private uService: UserService, private auth: AuthService, public postsService: PostsService) { }

  async ngOnInit(): Promise<void> {
    //last path parameter
    this.user = await this.uService.getUserFromUid(this.route.snapshot.params.uid);
    if (!this.user || this.user instanceof Error) {
      this.router.navigate(['/404']);
    } else {
      this.postsService.fetchUserPostsFromUid(this.user.uid);
    }
  }

  setCurrent(selected: string): void {
    if (this.current !== selected) {
      this.current = selected;
      if (selected === 'Liked')
        this.postsService.getLikedPostsFromUid(this.user.uid);
      else if (selected === 'Posts')
        this.postsService.fetchUserPostsFromUid(this.user.uid);
      else {
        this.postsService.getSavedPostsFromUid(this.user.uid);
      }
    }
  }
}
