import { PostsService } from './../services/posts.service';
import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/app';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  posts: any[] = [];
  current: string = 'Posts';
  selected: string = 'cursor-pointer text-xl font-bold underline';
  not: string = 'cursor-pointer text-xl font-bold';

  constructor(private auth: AuthService, public postsService: PostsService) { }

  ngOnInit(): void {
    this.postsService.fetchUserPosts();
  }

  setCurrent(selected: string): void {
    if (this.current !== selected) {
      this.current = selected;
      if (selected === 'Liked')
        this.postsService.getLikedPosts();
      else if (selected === 'Posts')
        this.postsService.fetchUserPosts();
      else {
        this.postsService.getSavedPosts();
      }
    }
  }
}
