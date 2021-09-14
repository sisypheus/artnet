import { UserService } from './../services/user.service';
import { AngularFirestoreDocument } from '@angular/fire/firestore';
import { AuthService } from './../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import firebase from 'firebase/app';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  showProfile: boolean = false;
  hideNavbar: boolean = false;
  redirectToHome: boolean = false;
  searchInput: string = '';
  searchedUsers: any = [];
  showSearchInput: boolean = false;
  innerWidth: number = 0;
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.innerWidth = window.innerWidth;
  }

  constructor(private router: Router, public auth: AuthService, public uService: UserService) {
    //check if we need to display or not the navbar
    //another check is to redirect to home if user is on /profile route
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        if (val.url === '/auth')
          this.hideNavbar = true;
        else if (this.hideNavbar)
          this.hideNavbar = false;
        if (val.url === '/profile')
          this.redirectToHome = true;
        else if (this.redirectToHome)
          this.redirectToHome = false;
      }
    });
  }

  ngOnInit() {
    this.innerWidth = window.innerWidth;
  }

  log(value: any) {
    console.log(value);
  }

  toggleMobileSearch() {
    this.showSearchInput = !this.showSearchInput;
  }

  setShowProfile() {
    this.showProfile = !this.showProfile;
  }

  requestLogout() {
    this.auth.signOut();
    if (this.redirectToHome)
      this.router.navigate(['/']);
  }

  searchInputChanged() {
    if (!this.searchInput)
      return;
    this.uService.searchUsers(this.searchInput);
  }
}
