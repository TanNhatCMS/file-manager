import { CommonModule } from '@angular/common';
import {AfterViewInit, Component} from '@angular/core';
import axios from 'axios';
import Swal from 'sweetalert2';
import { TopMenuComponent } from '../../components/top-menu/top-menu.component';
import { Router } from '@angular/router';
import { GLOBALS } from '../../global';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, TopMenuComponent],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements AfterViewInit {
  inProcess = false;
  public user = GLOBALS.user;
  constructor(private router: Router){
    if(this.user.username !== 'admin') window.location.href = "/";
  }
  navigateToLogin()
  {
    this.router.navigate(['login']);
  }
  home()
  {
    this.router.navigate(['/']);
  }
  listUsers()
  {
    this.router.navigate(['user-manager']);
  }
  createAccount(event: Event, username: HTMLInputElement, password:HTMLInputElement,password_confirmation: HTMLInputElement, name: HTMLInputElement){
    event.preventDefault();
    this.inProcess = true;
    axios.post(`${environment.domain}/api/auth/register`,
      {
        username: username.value,
        password: password.value,
        name: name.value,
        password_confirmation: password_confirmation.value
      }).then(res=>{
      username.value = password.value = name.value = password_confirmation.value = '';
      Swal.fire({
        title: 'Thành công!',
        text: 'Tạo người dùng mới thành công',
        icon: 'success',
        confirmButtonText: 'Ok'
      });
   }).catch(reason => {
     Swal.fire({
       title: 'Lỗi!',
       text: reason.response.data.message,
       icon: 'error',
       confirmButtonText: 'Ok'
     });
     console.error("Error while Login", reason);
   }).finally(()=>{
      this.inProcess = false;
   })
  }
  ngAfterViewInit() {
    let eyeShow = document.querySelector('.eye-show') as HTMLElement;
    let eyeHide = document.querySelector('.eye-hide') as HTMLElement;
    if(eyeShow && eyeHide)
    {
      eyeShow.addEventListener('click', ()=>{
        let password = document.querySelector('#password') as HTMLElement;
        let password_confirmation = document.querySelector('#password_confirmation') as HTMLElement;
        if(password && password_confirmation)
        {
          password.setAttribute('type', 'text');
          password_confirmation.setAttribute('type', 'text');
          eyeShow.classList.add('d-none');
          eyeHide.classList.remove('d-none');
        }
      });
      eyeHide.addEventListener('click', ()=>{
        let password = document.querySelector('#password') as HTMLElement;
        let password_confirmation = document.querySelector('#password_confirmation') as HTMLElement;
        if(password && password_confirmation)
        {
          password.setAttribute('type', 'password');
          password_confirmation.setAttribute('type', 'password');
          eyeShow.classList.remove('d-none');
          eyeHide.classList.add('d-none');
        }
      });
    }
    if(document.querySelectorAll('.modal.show').length == 0) {
      const bodyElement = document.body;
      const overloadModal = document.querySelector('.modal-backdrop.show');
      if(overloadModal) {
        bodyElement.classList.remove("modal-open")
        bodyElement.setAttribute('style', '')
        overloadModal.remove()
      }
    }
  }
}
