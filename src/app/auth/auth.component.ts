import { AuthService } from './../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  signInForm = this.formBuilder.group({
    email: '',
    password: '',
  });

  constructor(private formBuilder: FormBuilder, private authService: AuthService) { }

  onSubmit() {
    this.authService.signInWithCredentials(this.signInForm.value.email, this.signInForm.value.password);
    // console.log(this.authService.isSignedIn);
  }

  googleLogin() {
    this.authService.signInWithGoogle();
    console.log('iuc');
  }
}
