import { Router } from '@angular/router';
import { AuthService } from './../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  signIn: boolean = true;

  authForm = this.formBuilder.group({
    email: '',
    password: '',
    name: '',
  });

  constructor(private formBuilder: FormBuilder, private router: Router, public authService: AuthService) {
    authService.user$.subscribe(user => {
      if (user)
        this.router.navigate(['/']);
    });
  }

  setAuthMethod() {
    this.signIn = !this.signIn;
  }

  onSubmit() {
    if (this.signIn)
      this.authService.signInWithCredentials(this.authForm.value.email, this.authForm.value.password);
    else
      this.authService.signUpWithCredentials(this.authForm.value.email, this.authForm.value.password, this.authForm.value.name);
  }

  googleLogin() {
    this.authService.signInWithGoogle();
  }
}
