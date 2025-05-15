import {Component, Inject, PLATFORM_ID, OnInit, AfterViewInit } from '@angular/core';
import {Router} from '@angular/router';
import Swal from 'sweetalert2';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import {authenticate} from '../../functions';
import {CommonModule, DOCUMENT} from '@angular/common';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, AfterViewInit {
  protected readonly environment = environment;
  inProcess = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
  ) {
    let infoToken = authenticate(this.platformId);
    if (infoToken) {
      if (Date.now() < (infoToken.exp! * 1000)) {
         this.router.navigate(['/']);
      }
    }
  }

  ngOnInit(): void {
      const loginContainer = this.document.querySelector('.login-container');
      if (loginContainer) loginContainer.classList.remove('d-none');
  }

  ngAfterViewInit() {
      let eyeShow = this.document.querySelector('.eye-show') as HTMLElement;
      let eyeHide = this.document.querySelector('.eye-hide') as HTMLElement;

      if (eyeShow && eyeHide) {
        eyeShow.addEventListener('click', () => {
          let password = document.querySelector('#password') as HTMLElement;
          if (password) {
            password.setAttribute('type', 'text');
            eyeShow.classList.add('d-none');
            eyeHide.classList.remove('d-none');
          }
        });

        eyeHide.addEventListener('click', () => {
          let password = document.querySelector('#password') as HTMLElement;
          if (password) {
            password.setAttribute('type', 'password');
            eyeShow.classList.remove('d-none');
            eyeHide.classList.add('d-none');
          }
        });
      }
      if (this.document.querySelectorAll('.modal.show').length == 0) {
        const bodyElement = this.document.body;
        const overloadModal = this.document.querySelector('.modal-backdrop.show');

        if (overloadModal) {
          bodyElement.classList.remove("modal-open")
          bodyElement.setAttribute('style', '')
          overloadModal.remove()
        }
      }
  }

  login(event: Event, username: string, password: string) {
    event.preventDefault();
    this.inProcess = true;
    axios.post(`${environment.domain}/api/auth/login`,
      {username: username, password: password}).then(res => {
      this.inProcess = false;
      if (res.status == 200 && res.data.success) {
        let jwt = res.data.access_token;
        try {
          jwtDecode(jwt);
          localStorage.setItem('jwt', jwt);
          localStorage.setItem('user', JSON.stringify(res.data.data.user));
          window.location.href = '/';
          // this._router.navigate(['/']);
          // window.location.reload();
        } catch {
           Swal.fire({
            title: 'Lỗi!',
            text: 'Lỗi khi đăng nhập, thử lại! [1]',
            icon: 'error',
            confirmButtonText: 'Ok'
          })
        }

      } else {
        Swal.fire({
          title: 'Lỗi!',
          text: 'Lỗi khi đăng nhập, thử lại ! [2]',
          icon: 'error',
          confirmButtonText: 'Ok'
        })
      }
    }).catch(reason => {
      this.inProcess = false;
      Swal.fire({
        title: 'Lỗi!',
        text: reason.response.data.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    })
  }
}
