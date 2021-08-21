import { AngularFirestoreDocument } from '@angular/fire/firestore';
import { AuthService } from './../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import firebase from 'firebase/app';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  showProfile: boolean = false;
  hideNavbar: boolean = false;
  loggedIn: boolean = true;
  user: any = null;
  redirectToHome: boolean = false;

  constructor(private router: Router, private auth: AuthService) {
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

    this.auth.user$.subscribe(
      (user: firebase.User) => {
        if (user) {
          this.user = user;
          this.loggedIn = true;
        } else {
          this.user = null;
          this.loggedIn = false;
        }
      }
    );
  }

  setShowProfile() {
    this.showProfile = !this.showProfile;
  }

  requestLogout() {
    this.auth.signOut();
    if (this.redirectToHome)
      this.router.navigate(['/']);
  }
}
