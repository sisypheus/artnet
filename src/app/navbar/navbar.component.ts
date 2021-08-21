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

  constructor(private router: Router, private auth: AuthService) {
    //check if we need to display or not the navbar
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        if (val.url === '/auth')
          this.hideNavbar = true;
        else if (this.hideNavbar)
          this.hideNavbar = false;
      }
    });

    this.auth.user$.subscribe(
      (user: firebase.User) => {
        console.log(user);
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
  }
}
