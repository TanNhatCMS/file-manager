import {CommonModule} from '@angular/common';
import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import axios from 'axios';
import {GLOBALS} from './global';
import {authenticate} from './functions';
import {User} from './interfaces/model';
import {PrimeNGConfig} from "primeng/api";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private primengConfig: PrimeNGConfig,
  ) {
  }

  ngOnInit(): void {
    this.primengConfig.ripple = true;
    let infoToken = authenticate(this.platformId);
    if (!infoToken) {
      this.router.navigate(['/login']);
    } else {
      axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('jwt')}`;
      try {
        if (Date.now() >= (infoToken.exp! * 1000)) {
          this.router.navigate(['/login']);
        }
        GLOBALS.inLogin = true;
        GLOBALS.user = JSON.parse(localStorage.getItem('user')!) as User
        ;
      } catch (err) {
        alert("jwt is not valid");
      }
    }
  }
}
