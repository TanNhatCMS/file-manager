import {Component, Input, Output, EventEmitter, output} from '@angular/core';
import axios from 'axios';
import Swal from 'sweetalert2';
import {convertBytes, scrollToElm} from '../functions';
import {File, Folder} from '../interfaces/model';
import {CommonModule} from '@angular/common';
import {SpinnerComponent} from '../spinner/spinner.component';
import {GLOBALS} from '../global';
import {Router} from '@angular/router';
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [
    CommonModule, SpinnerComponent
  ],
  templateUrl: './mobile-nav.component.html',
  styleUrl: './mobile-nav.component.scss'
})
export class MobileNavComponent {

  @Input() allItem: (File | Folder)[] = [];
  @Input() breadcrumb: Folder[] = [];
  @Input() root_folder_opening?: Folder;
  @Input() fromPage?: string;
  @Output() viewChangeTrash = new EventEmitter<string>();
  @Output() viewChangeMain = new EventEmitter<string>();

  focusInput = output<string>();

  focusInputChange(input: string) {
    this.focusInput.emit(input);
  }

  constructor(private router: Router) {
  }

  ngAfterViewInit() {
    if (localStorage.getItem('fromPage') === 'user-manager') {
      this.toShortcut();
    }
    //set event click outside
    document.addEventListener('click', (e) => {
      let target = e.target as HTMLElement;
      let listAction = document.querySelector('.action-mobile-list');
      let plusAction = document.querySelector('.plus-action');
      if (listAction && plusAction) {
        if (!listAction.contains(target) && !plusAction.contains(target)) {
          listAction.classList.remove('active');
          plusAction.classList.remove('active');
        }
      }
    });
  }

  public files: File[] = [];
  public isLoading = false;
  private currentView: 'main' | 'trash' = 'main';
  public user = GLOBALS.user;
  loadFolderHomeUser = output();

  isAdmin() {
    return this.user.username == 'admin'
  }

  classIsHomeUser() {
    if (this.isAdmin()) return '';
    return !this.root_folder_opening || this.root_folder_opening?.role === 'viewer' ? 'top0' : '';
  }

  isEditFolder() {
    return this.isAdmin() || (this.root_folder_opening && this.root_folder_opening?.role !== 'viewer');
  }

  changeViewTrash() {
    this.currentView = 'trash';
    this.viewChangeTrash.emit();
  }

  changeViewMain() {
    this.currentView = 'main';
    this.viewChangeMain.emit();
  }

  plusActionClick($event: Event) {
    $event.preventDefault();
    $event.stopPropagation();
    let listAction = document.querySelector('.action-mobile-list');
    let plusAction = document.querySelector('.plus-action');
    let dropdownMenu = document.querySelector('.dropdown-menu.action.show');
    dropdownMenu?.classList.remove('show');
    if (listAction && plusAction) {
      listAction.classList.toggle('active');
      plusAction.classList.toggle('active');
    }
  }

  viewTrash() {
    const homeNavActive = document.querySelector('.mobile-nav__link.home.active');
    if (!homeNavActive) this.toHome(false);
    this.changeViewTrash();
    this.isLoading = true;
    const allItems = document.querySelector('.all-list-items');
    if (allItems) allItems.innerHTML = '';
    axios.post(`${environment.domain}/api/trash`).then((res) => {
      this.allItem.length = this.files.length = 0;
      this.files = res.data.data.trash.files;
      let folders = res.data.data.trash.folders;
      this.files = this.files.map((item) => {
        item._size = convertBytes(item.size);
        return item;
      });
      this.allItem.push(...folders, ...this.files);
      this.isLoading = false;
    });
  }

  toHome(flag: true | false = true) {
    if (this.fromPage === 'user-manager')
      this.router.navigate(['/']);
    if (this.currentView === 'trash') {
      this.changeViewMain();
      if (flag) this.chooseFolder(this.root_folder_opening as Folder);
    }

    const documentWrap = document.querySelector('.documentWrap');
    const shortcutWrap = document.querySelector('.shortcutWrap');
    const permissionWrap = document.querySelector('.permissionWrap');
    const actionMobile = document.querySelector('.action-mobile');
    if (documentWrap && shortcutWrap && permissionWrap && actionMobile) {
      let navLinkActive = document.querySelector('.mobile-nav__link.active');
      if (navLinkActive) navLinkActive.classList.remove('active');
      documentWrap.classList.remove('hidden');
      shortcutWrap.classList.remove('show');
      permissionWrap.classList.remove('show');
      let navLink = document.querySelector('.mobile-nav__link.home');
      if (navLink) navLink.classList.add('active');
      actionMobile.classList.remove('d-none');
    }
  }

  toShortcut() {
    if (this.fromPage === 'user-manager') {
      localStorage.setItem('fromPage', 'user-manager');
      this.router.navigate(['/']);
    }

    const documentWrap = document.querySelector('.documentWrap');
    const shortcutWrap = document.querySelector('.shortcutWrap');
    const permissionWrap = document.querySelector('.permissionWrap');
    const actionMobile = document.querySelector('.action-mobile');

    if (documentWrap && shortcutWrap && permissionWrap && actionMobile) {
      let navLinkActive = document.querySelector('.mobile-nav__link.active');
      if (navLinkActive) navLinkActive.classList.remove('active');
      documentWrap.classList.add('hidden');
      shortcutWrap.classList.add('show');
      permissionWrap.classList.remove('show');
      let navLink = document.querySelector('.mobile-nav__link.shortcut');
      if (navLink) navLink.classList.add('active');
      actionMobile.classList.add('d-none');
    }
  }

  toPermission() {

    if (this.isAdmin())
      this.router.navigate(['/user-manager']);
    const documentWrap = document.querySelector('.documentWrap');
    const shortcutWrap = document.querySelector('.shortcutWrap');
    const permissionWrap = document.querySelector('.permissionWrap');
    const actionMobile = document.querySelector('.action-mobile');

    if (documentWrap && shortcutWrap && permissionWrap && actionMobile) {
      let navLinkActive = document.querySelector('.mobile-nav__link.active');
      if (navLinkActive) navLinkActive.classList.remove('active');
      documentWrap.classList.add('hidden');
      shortcutWrap.classList.remove('show');
      permissionWrap.classList.add('show');
      let navLink = document.querySelector('.mobile-nav__link.permission');
      if (navLink) navLink.classList.add('active');
      actionMobile.classList.add('d-none');
    }
  }

  chooseFolder(folder: Folder) {
    if (!this.isAdmin()) {
      this.currentView = 'main';
      this.loadFolderHomeUser.emit();
      return;
    }
    this.isLoading = true;

    axios
      .post(`${environment.domain}/api/folders`, {id: folder.id ?? folder.folder_id})
      .then((res) => {
        this.allItem.length = this.files.length = 0;
        let currentFolder = res.data.data.folders;
        this.files = currentFolder.files;
        let folders = currentFolder.children;
        this.files = this.files.map((item) => {
          item._size = convertBytes(item.size);
          return item;
        });
        this.allItem.push(...folders, ...this.files);
        // Create a breadcrumb
        this.breadcrumb.length = 0;
        this.breadcrumb.push(currentFolder);
        let myParent = currentFolder;
        while (myParent.parent) {
          if (myParent.parent.parent !== null || this.isAdmin())
            this.breadcrumb.push(myParent.parent);
          myParent = myParent.parent;
        }
        this.breadcrumb = this.breadcrumb.reverse();
        let shortcuts = document.querySelectorAll('.folder-shortcut.active');
        shortcuts.forEach((item) => item.classList.remove('active'));
        let shortcutChosen = document.querySelector(
          `#shortcutItem_${folder.id}`
        );
        shortcutChosen?.classList.add('active');
        if (shortcutChosen !== null)
          scrollToElm(
            document.querySelector('.folder-list'),
            shortcutChosen,
            500
          );

        this.isLoading = false;
        const noData = document.querySelector('.empty-main-list');
        if (this.allItem.length === 0) {
          noData?.classList.remove('d-none');
        } else {
          noData?.classList.add('d-none');
        }

        const shortcutWrap = document.querySelector('.shortcutWrap.show');
        const documentWrap = document.querySelector('.documentWrap.hidden');
        const navLink = document.querySelector('.mobile-nav__link.active');
        const navLinkHome = document.querySelector('.mobile-nav__link.home');

        if (shortcutWrap && documentWrap && navLink && navLinkHome) {
          shortcutWrap.classList.remove('show');
          documentWrap.classList.remove('hidden');
          navLink.classList.remove('active');
          navLinkHome.classList.add('active');
        }
      })
      .catch((reason) => {
        Swal.fire({
          title: 'Lỗi!',
          text: reason.response.data.message,
          icon: 'error',
          confirmButtonText: 'Ok',
        });
        this.isLoading = false;
      });
  }
}
