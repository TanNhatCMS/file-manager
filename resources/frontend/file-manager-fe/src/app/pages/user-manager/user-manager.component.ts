import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { Folder, User} from '../../interfaces/model';
import axios from 'axios';
import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {TopMenuComponent} from '../../components/top-menu/top-menu.component';
import {GLOBALS} from '../../global';
import {CommonModule} from '@angular/common';
import {SpinnerComponent} from '../../spinner/spinner.component';
import {FormsModule} from '@angular/forms';
import {containsWithoutDiacritics, getIdsFromTreeNodes, mapFolderToTreeNode} from '../../functions';
import {MobileNavComponent} from '../../mobile-nav/mobile-nav.component';
import {TreeSelectModule} from "primeng/treeselect";
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [
    TopMenuComponent,
    CommonModule,
    SpinnerComponent,
    FormsModule,
    MobileNavComponent,
    TreeSelectModule
  ],
  templateUrl: './user-manager.component.html',
  styleUrl: './user-manager.component.scss'
})
export class UserManagerComponent implements OnInit, AfterViewInit {
  users: User[] = [];
  @ViewChild('name') name!: ElementRef;
  @ViewChild('password') password!: ElementRef;
  @ViewChild('username') username!: ElementRef;
  @ViewChild('closeEditModal') closeEditModal!: ElementRef;
  @ViewChild('selectRole') selectRole!: ElementRef;
  @ViewChild('idShare') idShare!: ElementRef;
  public editingItem?: {
    index: number,
    item: User
  };
  public user = GLOBALS.user;
  public paginations: Array<any> = [];
  public isLoading: boolean = true;
  public searchUsers: string = '';
  public flagViewAddUsers = false;
  public searchUserRoleInFolder: string = '';
  public fromPage = 'user-manager';
  public listFoldersHome: Folder[] = [];
  public currentPage: number = 1;
  public perPage: number = 10;
  listFoldersTree!: any[];
  selectedListFoldersHome: any[] = [];

  constructor(private router: Router) {
    if (this.user.username !== 'admin') window.location.href = "/";
  }

  // instanceOfFile(object: any): object is File {
  //   return 'size' in object;
  // }

  ngOnInit() {
    this.loadUsers();
    this.loadFoldersHome();
  }

  ngAfterViewInit() {
    let eyeShow = document.querySelector('.eye-show') as HTMLElement;
    let eyeHide = document.querySelector('.eye-hide') as HTMLElement;
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
    if (document.querySelectorAll('.modal.show').length == 0) {
      const bodyElement = document.body;
      const overloadModal = document.querySelector('.modal-backdrop.show');
      if (overloadModal) {
        bodyElement.classList.remove("modal-open")
        bodyElement.setAttribute('style', '')
        overloadModal.remove()
      }
    }
  }

  async loadFoldersHome() {
    await axios.post(`${environment.domain}/api/admin/folder/home`).then(res => {
      this.listFoldersHome = res.data.data;
    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason.response.data.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    });
  }

  navigateToLogin() {
    this.router.navigate(['login']);
  }

  async loadUsers(page: number | string = 1) {
    if (!this.isLoading) this.isLoading = true;
    await axios.post(`${environment.domain}/api/admin/list-user?page=${page}`).then(res => {
      this.users = res.data.data.users.data;
      this.users = this.users.filter(user => user.username !== 'admin');
      this.paginations = res.data.data.users.links;
      this.isLoading = false;
      this.currentPage = page as number;
    }).catch(reason => {
      if (reason.response.status == 401) {
        this.router.navigate(['/login']);
      } else {
        Swal.fire({
          title: 'Lỗi!',
          text: reason.response.data.message,
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      }
    });
  }

  openEditModal(user: User, index: number) {
    this.editingItem = {
      index: index,
      item: user
    }
  }

  async saveUser() {
    await axios.post(`${environment.domain}/api/admin/edit-user`,
      {
        id: this.editingItem?.item.id,
        name: this.name.nativeElement.value,
        username: this.username.nativeElement.value,
        password: this.password.nativeElement.value
      }).then(res => {
      this.users[this.editingItem!.index].name = this.name.nativeElement.value;
      this.users[this.editingItem!.index].username = this.username.nativeElement.value;
      this.name.nativeElement.value
      this.username.nativeElement.value
      this.password.nativeElement.value = '';
      Swal.fire({
        title: 'Thành công!',
        text: res.data.message,
        icon: 'success',
        confirmButtonText: 'Ok'
      });
      this.closeEditModal.nativeElement.click();

    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason.response.data.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    });
  }

  deleteUser(userId: string, index: number) {
    Swal.fire({
      text: `Bạn có chắc chắn muốn xóa người dùng này không?`,
      showDenyButton: true,
      confirmButtonText: "Xóa ngay",
      denyButtonText: 'Huỷ',
      customClass: {
        popup: 'popupDeleteModal',
        confirmButton: 'cfBtnDelete',
        denyButton: 'dnBtnDelete'
      },
      icon: "warning"
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        axios.post(`${environment.domain}/api/admin/delete-user`,
          {
            id: userId
          }).then(res => {
          this.users.splice(index, 1);
          Swal.fire({
            title: 'Thành công!',
            text: res.data.message,
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
        });
      }
    });

  }

  getNumberPage(pageLink: string) {
    if (pageLink == null) return;
    let page = pageLink.split('page=')[1] ?? 1;
    this.loadUsers(page);
  }

  containsWithoutDiacritics(str: string, keyword: string) {
    return containsWithoutDiacritics(
      str.replaceAll(' ', ''),
      keyword.replaceAll(' ', '')
    );
  }

  createUser() {
    this.router.navigate(['register']);
  }

  setPermission() {

  }

  dropdownMenu($event?: Event, id?: string) {
    $event?.preventDefault();
    $event?.stopPropagation();
    if (id) {
      const dropdownMenuCurrent = document.querySelector(`[aria-labelledby="dropdownMenuButtonID${id}"]`);
      const attrID = dropdownMenuCurrent?.getAttribute('aria-labelledby');
      const dropdownMenuActive = document.querySelectorAll(`.dropdown-menu.action.show`);
      dropdownMenuActive.forEach(elm => {
        const elmAttr = elm.getAttribute('aria-labelledby');

        if (elmAttr !== attrID) elm.classList.remove('show');
      });
    }
  }

  removeRole(fd: Folder, role: string) {
    const searchFolderOfUser = document.querySelector('#searchUserRoleInFolder');
    (searchFolderOfUser as HTMLInputElement).disabled = true;
    Swal.fire({
      text: "Bạn thực sự muốn xóa quyền của user này?",
      showDenyButton: true,
      confirmButtonText: "Xóa ngay",
      denyButtonText: 'Huỷ',
      customClass: {
        popup: 'popupDeleteModal',
        confirmButton: 'cfBtnDelete',
        denyButton: 'dnBtnDelete'
      },
      icon: "warning"
    }).then((result) => {
      (searchFolderOfUser as HTMLInputElement).disabled = false;
      if (result.isConfirmed) {
        (searchFolderOfUser as HTMLInputElement).disabled = true;
        Swal.fire({
          html: "<img width='50' height='50' src='/assets/angular/browser/loading.gif'/>",
          showConfirmButton: false
        });
        axios.post(`${environment.domain}/api/admin/folder/remove-user`, {
          authorization: [
            {
              "user_id": this.editingItem?.item.id,
              "role": role,
              "folder_id": fd.id
            }
          ]
        }).then(res => {
          this.listFoldersOfUser();
          Swal.fire({
            title: "Thành công!",
            text: res.data.message,
            icon: "success"
          });
          (searchFolderOfUser as HTMLInputElement).disabled = false;
        }).catch(reason => {
          Swal.fire({
            title: "Error",
            text: reason.response.data.message,
            icon: "error"
          });
          (searchFolderOfUser as HTMLInputElement).disabled = false;
        });
      }
    });

  }

  onClickEditFileOrFolder(item: User, index: number) {
    this.editingItem = {
      item: item,
      index: index
    };
    this.searchUserRoleInFolder = '';
    this.flagViewAddUsers = false;
    this.listFoldersOfUser();
  }

  modalViewManagerUser() {
    if (!this.flagViewAddUsers) {
      this.loadSelectFolderTree()
    }
    this.flagViewAddUsers = !this.flagViewAddUsers;
  }

  loadSelectFolderTree() {
    this.listFoldersTree = this.listFoldersHome.map(item => mapFolderToTreeNode(item, this.editingItem?.item.app_list_folders as Folder[]));
  }

  // checkNotIncludes(folder: Folder) {
  //   return !this.editingItem?.item.app_list_folders!.find(fd => fd.id === folder.id);
  // }

  async listFoldersOfUser($event?: Event) {
    this.dropdownMenu($event);
    this.isLoading = true;

    await axios.post(`${environment.domain}/api/admin/list-folder-of-user`, {
      user_id: this.editingItem?.item.id
    }).then(res => {
      const folders = res.data.data.folders;
      const ids = folders.map((item: { id: any; }) => item.id);
      (this.editingItem?.item as User).app_list_folders = folders.filter((item: any) => !ids.includes(item!.parent!.id));
      this.isLoading = false;
    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason?.response?.data?.message ?? 'Lỗi khi lấy thư mục',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      this.isLoading = false;
    });
  }

  addUserOrUpdateRoleForFolder() {
    // let id = this.idShare.nativeElement.value;
    const id = getIdsFromTreeNodes(this.selectedListFoldersHome);
    let role: string = this.selectRole.nativeElement.value;
    this.isLoading = true;
    let dataSend: any = [];
    if (id.length > 0) {
      let ids = id.filter((value: any, index: any, self: any) => self.indexOf(value) === index);
      ids.forEach((_id: string) => {
        if (_id !== "")
          dataSend.push({
            "user_id": this.editingItem?.item.id,
            "role": role,
            "folder_id": _id
          });
      });
    } else {
      Swal.fire({
        title: "Lỗi!",
        text: "Vui lòng chọn thư mục để phân quyền",
        icon: "warning"
      });
      this.isLoading = false;
      return;
    }
    const id_folder = document.querySelector('#treeselect_folder');
    (id_folder as HTMLInputElement).disabled = true;

    axios.post(`${environment.domain}/api/admin/folder/add-user`, {
      authorization: dataSend
    }).then(async () => {
      await this.listFoldersOfUser().then(() => this.loadSelectFolderTree());
      (id_folder as HTMLInputElement).disabled = false;
      this.selectedListFoldersHome.length = 0;
      this.isLoading = false;
      Swal.fire({
        title: "Thành công!",
        text: "Tạo thành công",
        icon: "success"
      });
    }).catch(res => {
      Swal.fire({
        title: "Lỗi!",
        text: res?.response?.data?.message ?? "Lỗi khi thêm người dùng!",
        icon: "error"
      });
      this.isLoading = false;
      (id_folder as HTMLInputElement).disabled = false;
    });
  }
}
