import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Output} from '@angular/core';
import {GLOBALS} from '../../global';
import {Router} from '@angular/router';
import axios from 'axios';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-top-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-menu.component.html',
})
export class TopMenuComponent {
  @Output() navigateToLogin: EventEmitter<void> = new EventEmitter<void>();
  public inLogin: boolean = GLOBALS.inLogin;
  public user = GLOBALS.user;

  constructor(private router: Router) {
  }

  _navigateToLogin() {
    this.navigateToLogin.emit();
  }

  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    axios.post(`${environment.domain}/api/auth/logout`)
      .then((res) => {
        window.location.reload();
      });
  }

  register() {
    this.router.navigate(["/register"])
  }

  userManager() {
    this.router.navigate(['/user-manager']);
  }

  home() {
    this.router.navigate(['/']);
  }
}
