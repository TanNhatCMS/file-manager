import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {Router} from '@angular/router';
import {TopMenuComponent} from '../../components/top-menu/top-menu.component';
import {File, Folder, User} from '../../interfaces/model';
import {containsWithoutDiacritics, convertBytes, scrollToElm} from '../../functions';
import {GLOBALS} from '../../global';
import {CommonModule} from '@angular/common';
import axios from 'axios';
import Swal from 'sweetalert2';
import {MainListComponent} from '../../components/main-list/main-list.component';
import {TrashListComponent} from '../../components/trash-list/trash-list.component';
import {SpinnerComponent} from '../../spinner/spinner.component';
import {MobileNavComponent} from '../../mobile-nav/mobile-nav.component';
import {FormsModule} from '@angular/forms';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TopMenuComponent,
    MainListComponent,
    TrashListComponent,
    SpinnerComponent,
    MobileNavComponent,
    FormsModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('closeNewFolderModal') closeNewFolderModal!: ElementRef;
  @ViewChild('inputUploadFile') inputUploadFile!: ElementRef;
  @ViewChild('closeUploadModal') closeUploadModal!: ElementRef;
  @ViewChild('nameUploadFile') nameUploadFile!: ElementRef;
  @ViewChild('idShare') idShare!: ElementRef;
  @ViewChild('selectRole') selectRole!: ElementRef;
  @ViewChild('folderName') folderName!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;

  focusInput(inputName: string) {
    setTimeout(() => {
      if (inputName == 'folderName') this.folderName.nativeElement.focus();
      if (inputName == 'nameUploadFile') this.nameUploadFile.nativeElement.focus();
    }, 520);
  }

  public user = GLOBALS.user;
  public isLoading = true;
  public folders?: Folder[];
  public folder_shortcuts?: Folder[];
  public file_shortcuts?: File[];
  public files: File[] = [];
  public allItem: (File | Folder)[] = [];
  public root_folder_opening?: Folder;
  public breadcrumb: Folder[] = [];
  public selectedOption_uploadFile: 'link' | 'file' = 'link';
  public styleView: 'list' | 'grid' = localStorage.getItem('styleView') as 'list' | 'grid' || 'grid';
  public searchMyfolder: string = '';
  public searchShortcut: string = '';
  public searchUserRoleInFolder: string = '';
  public paginations: Array<any> = [];
  public editingItem?: {
    index: number,
    item: File | Folder
  };
  public flagViewAddUsers = false;
  public filterShow: string = 'all';
  public start_date: string = this.currentDate();
  public end_date: string = this.addDay(this.currentDate(), 1);
  user_test_folder: Folder = {
    created_at: '',
    folder_id: '123',
    id: "-1_user_folder",
    name: "user_folder",
    updated_at: '',
    parent: null,
    permission: {
      create: false,
      read: false,
      update: false,
      delete: false
    },
    app_list_user: {
      admin: [],
      editors: [],
      viewers: []
    },
  };
  public currentView: 'trash' | 'main' = 'main';

  constructor(private router: Router) {
    this.loadFolder();
    this.loadShortcuts();
  }

  onViewChange(view: 'trash' | 'main') {
    this.currentView = view;
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
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

  navigateToLogin() {
    this.router.navigate(['login']);
  }

  changeRootFolder(folder: Folder) {
    this.root_folder_opening = folder
  }

  chooseFolder(folder: Folder, isAppend = false) {

    if (!this.isLoading) this.isLoading = true;

    this.currentView = 'main';
    this.root_folder_opening = folder;
    axios
      .post(`${environment.domain}/api/folders`, {id: folder.id ?? folder.folder_id})
      .then((res) => {
        if (!isAppend) this.allItem.length = this.files.length = 0;
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
          if (myParent.parent!.parent !== null || this.isAdmin())
            this.breadcrumb.push(myParent.parent);
          myParent = myParent.parent;
        }
        if (!this.isAdmin()) this.breadcrumb.push(this.user_test_folder);
        this.breadcrumb = this.breadcrumb.reverse();
        //
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
        this.displayEmpty();
        const shortcutWrap = document.querySelector('.shortcutWrap.show');
        const documentWrap = document.querySelector('.documentWrap.hidden');
        const permissionWrap = document.querySelector('.permissionWrap.show');
        const navLink = document.querySelector('.mobile-nav__link.active');
        const navLinkHome = document.querySelector('.mobile-nav__link.home');
        const actionMobile = document.querySelector('.action-mobile');
        if (documentWrap && navLink && actionMobile && navLinkHome && localStorage.getItem('fromPage') !== 'user-manager') {
          documentWrap.classList.remove('hidden');
          shortcutWrap?.classList.remove('show');
          permissionWrap?.classList.remove('show');
          navLink.classList.remove('active');
          navLinkHome.classList.add('active');
          actionMobile.classList.remove('d-none');
        }
        localStorage.removeItem('fromPage');
      })
      .catch((reason) => {
        Swal.fire({
          title: 'Lỗi!',
          text: reason!.response?.data!.message ?? "Lỗi khi lấy thư mục!",
          icon: 'error',
          confirmButtonText: 'Ok',
        });
        this.isLoading = false;
      });
  }

  chooseFile(item: File) {
    if (this.instanceOfFile(item)) {
      if (item.type == 'link') {
        window.open(item.path, '_blank');
      } else {
        this.isLoading = true;
        let cleanPath = item.path.replace('files/', '');
        axios.post(`${environment.domain}/api/getfile`, {
          path: cleanPath,
        }).then(res => {
          let myURL = res.data.data.url;
          this.isLoading = false;
          window.open(myURL, '_blank');
        })
      }
    } else {
      Swal.fire({
        title: 'Lỗi!',
        text: 'Đây không phải là một tập tin!',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      this.isLoading = false;
    }
  }

  loadFolder(page: string | number = 1, continueChoose = true) {
    axios.post(`${environment.domain}/api/auth/my-folder?page=${page}`).then((res) => {
      this.folders = Object.values(res.data.data.folders.data);
      this.paginations = res.data.data.folders.links;
      if (this.folders!.length > 0 && continueChoose) {
        if (this.isAdmin()) this.chooseFolder(this.folders![0]);
        else {
          const ids = this.folders.map(item => item.id);
          const filteredFolders = this.folders.filter(item => !ids.includes(item!.parent!.id));
          this.allItem.push(...filteredFolders);
          this.breadcrumb.push(this.user_test_folder);
          this.isLoading = false;
          this.displayEmpty();
        }
      } else {
        this.displayEmpty();
        if (this.isLoading) this.isLoading = false;
      }
    });
  }

  loadFolderHomeUser() {
    this.isLoading = true;
    this.allItem.length = 0;
    this.breadcrumb.length = 0;
    if (!this.isAdmin()) this.root_folder_opening = undefined;
    this.loadFolder();
  }

  loadShortcuts() {
    axios.post(`${environment.domain}/api/auth/my-shortcut`).then((res) => {
      this.folder_shortcuts = res.data.data.folders;
      this.file_shortcuts = res.data.data.files;
    }).catch((reject) => {
      if (reject.response.status == 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('jwt');
        this.router.navigate(['/login']);
      }
    });
  }

  setShortcutFolder(event: Event, fd: Folder, action: 'delete' | 'insert') {
    event.stopPropagation();
    Swal.fire({
      text: `Bạn có muốn xóa lối tắt này?`,
      showDenyButton: true,
      confirmButtonText: "Xóa ngay",
      denyButtonText: 'Thôi',
      customClass: {
        popup: 'popupDeleteModal',
        confirmButton: 'cfBtnDelete',
        denyButton: 'dnBtnDelete'
      },
      icon: "warning"
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        axios
          .post(`${environment.domain}/api/folders/set-shortcut`, {
            folder_id: fd.id,
            shortcut: action != 'delete',
          })
          .then((res) => {
            if (action == 'delete') {
              let idx = this.folder_shortcuts!.findIndex((item) => item.id == fd.id);
              this.folder_shortcuts!.splice(idx, 1);
            } else {
              this.folder_shortcuts!.push(fd);
            }
            Swal.fire({
              title: 'Thành công!',
              text: res.data.message,
              icon: 'success',
              confirmButtonText: 'Ok',
            });
          })
          .catch(() => {
            Swal.fire({
              title: 'Lỗi!',
              text: 'Lỗi khi thêm lối tắt',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          });
      }
    });
  }

  setShortcutFile(event: Event, file: File, action: 'delete' | 'insert') {
    event.stopPropagation();
    Swal.fire({
      text: `Bạn có muốn xóa lối tắt này?`,
      showDenyButton: true,
      confirmButtonText: "Xóa ngay",
      denyButtonText: 'Thôi',
      customClass: {
        popup: 'popupDeleteModal',
        confirmButton: 'cfBtnDelete',
        denyButton: 'dnBtnDelete'
      },
      icon: "warning"
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        axios
          .post(`${environment.domain}/api/file/set-shortcut`, {
            file_id: file.id,
            shortcut: action != 'delete',
          })
          .then((res) => {
            if (action == 'delete') {
              let idx = this.file_shortcuts!.findIndex((item) => item.id == file.id);
              this.file_shortcuts!.splice(idx, 1);
            } else {
              this.file_shortcuts!.push(file);
            }
            Swal.fire({
              title: 'Thành công!',
              text: res.data.message,
              icon: 'success',
              confirmButtonText: 'Ok',
            });
          })
          .catch(() => {
            Swal.fire({
              title: 'Lỗi!',
              text: 'Lỗi khi xóa phím tắt',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          });
      }
    });
  }

  isDuplicate(id: string, index: number): boolean {
    return this.breadcrumb.findIndex(item => item.id === id) < index;
  }

  viewTrash() {
    this.currentView = 'trash';
    this.isLoading = true;
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

  onOptionChange_uploadFile(option: 'link' | 'file') {
    this.selectedOption_uploadFile = option;
  }

  uploadFileOrLink(filesOrLink: FileList | string | null, name: string = '') {
    if (this.breadcrumb[this.breadcrumb.length - 1] == null) {
      Swal.fire({
        title: 'Lỗi!',
        text: 'Bạn không có quyền dùng reports nào cả!',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      return;
    }

    if (filesOrLink) {
      if (this.selectedOption_uploadFile === 'file' && (!filesOrLink || filesOrLink.length === 0)) {
        Swal.fire({
          title: 'Lỗi!',
          text: 'Bạn chưa chọn file!',
          icon: 'error',
          confirmButtonText: 'Ok',
        });
        return;
      }

      let formData = new FormData();
      formData.append('folder_id', this.breadcrumb[this.breadcrumb.length - 1]?.id.toString());
      formData.append('type', this.selectedOption_uploadFile);
      formData.append('path', typeof filesOrLink === 'string' ? filesOrLink : '_');
      formData.append('name', name);

      // Thêm tất cả các tệp vào FormData
      if (filesOrLink instanceof FileList && filesOrLink.length > 0) {
        for (let i = 0; i < filesOrLink.length; i++) {
          formData.append('files[]', filesOrLink[i]); // Sử dụng 'files[]' để có thể thêm nhiều tệp
        }
      }

      Swal.fire({
        html: `
                <h4>Đang tải lên..</h4>
                <div class="progress">
                    <div class="uploadfile progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            `,
        showConfirmButton: false,
        allowOutsideClick: false
      });

      window.onbeforeunload = function (e) {
        var e = e || window.event;
        if (e) e.returnValue = 'Leaving the page';
        return 'Leaving the page';
      };

      axios
        .post(`${environment.domain}/api/file/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: function (progressEvent: any) {
            if (progressEvent.lengthComputable) {
              let percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              let progress = document.querySelector('.uploadfile')!;
              if (progress) {
                progress.setAttribute('style', `width: ${percentComplete}%`);
                progress.innerHTML = `${percentComplete}%`;
              }
            }
          },
        })
        .then((res) => {
          res.data.data.files.forEach((file: any) => {
            file._size = convertBytes(file.size);
            file.upload_by = this.user.name;
            this.allItem.push(file);
          });
          Swal.fire({
            title: 'Thành công!',
            text: res.data.message,
            icon: 'success',
            confirmButtonText: 'Ok',
          });
          this.closeUploadModal.nativeElement.click();
          this.nameUploadFile.nativeElement.value = '';
          this.inputUploadFile.nativeElement.value = '';

          this.displayEmpty();
          window.onbeforeunload = null;
        })
        .catch((reason) => {
          Swal.fire({
            title: 'Lỗi!',
            text: reason.response.data.message,
            icon: 'error',
            confirmButtonText: 'Ok',
          });
          window.onbeforeunload = null;
        });
    }
  }

  createNewFolder(event: Event, folderNameInput: HTMLInputElement) {

    if (this.breadcrumb[this.breadcrumb.length - 1] == null) {
      Swal.fire({
        title: 'Lỗi!',
        text: 'Bạn không có quyền dùng reports nào cả!',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      return;
    }

    event.preventDefault();
    Swal.fire({
      html: "<img width='50' height='50' src='/assets/angular/browser/loading.gif'/>",
      showConfirmButton: false,
    });
    axios
      .post(`${environment.domain}/api/folders/create`, {
        name: folderNameInput.value,
        id: this.breadcrumb[this.breadcrumb.length - 1]?.id, // Current folder
      })
      .then((res) => {
        folderNameInput.value = '';
        this.allItem = [res.data.data.folder, ...this.allItem];
        Swal.fire({
          title: 'Thành công!',
          text: 'Tạo thành công',
          icon: 'success',
        });
        this.displayEmpty();
      })
      .catch((res) => {
        Swal.fire({
          title: 'Lỗi!',
          text: res?.response?.data?.message || 'Lỗi khi tạo thư mục!',
          icon: 'error',
        });
      });
    this.closeNewFolderModal.nativeElement.click();
  }

  instanceOfFile(object: any): object is File {
    return 'size' in object;
  }

  isAdmin() {
    return this.user.username == 'admin';
  }

  clearSearch(event: Event) {
    this.isLoading = true;
    event.preventDefault();
    this.searchInput.nativeElement.value = '';

    // Đặt lại danh sách item để tránh trùng lặp
    this.allItem.length = 0; // Xóa tất cả item trước khi tải lại

    if (this.currentView == 'trash') {
      this.viewTrash();
    } else {
      this.loadFolder();
    }
  }

  search(event: Event, keyword: string) {
    if (keyword.length === 0) {
      this.clearSearch(event); // Gọi clearSearch nếu keyword rỗng
      return;
    }

    this.isLoading = true;
    event.preventDefault();

    // Xóa danh sách item trước khi tìm kiếm
    this.allItem.length = 0; // Đảm bảo không có item cũ nào

    axios
      .post(`${environment.domain}/api/file/search`, {
        name: keyword,
        is_trashed: this.currentView === 'trash' ? 1 : 0,
      })
      .then((res) => {
        const files = (res.data.data.files as File[]).map((item) => {
          item._size = convertBytes(item.size);
          return item;
        });

        const folders = res.data.data.folders;

        // Kết hợp file và folder
        this.allItem.push(...files, ...folders);
        this.isLoading = false;
        this.displayEmpty();
      })
      .catch((error) => {
        console.error('Error searching files:', error);
        this.isLoading = false;
      });
  }

  styleViewClick($event: Event) {
    $event.preventDefault();
    $event.stopPropagation();
    let styleView = localStorage.getItem('styleView') || 'grid';
    this.styleView = styleView == 'list' ? 'grid' : 'list';

    localStorage.setItem('styleView', this.styleView);
  }

  displayEmpty() {
    const noData = document.querySelector('.empty-main-list');

    if (this.allItem.length === 0 || this.allItem.every(item => !item._display)) {
      noData?.classList.remove('d-none');
    } else {
      noData?.classList.add('d-none');
    }
  }

  containsWithoutDiacritics(str: string, keyword: string) {
    return containsWithoutDiacritics(
      str.replaceAll(' ', ''),
      keyword.replaceAll(' ', '')
    );
  }

  getNumberPage(pageLink: string) {
    if (pageLink == null) return;
    this.isLoading = true;
    let page = pageLink.split('page=')[1] ?? 1;
    this.loadFolder(page, false);
  }

  dropdownMenu($event?: Event, id?: string, prefix: string = 'dropdownMenuButtonID') {
    $event?.preventDefault();
    $event?.stopPropagation();
    if (id) {
      const dropdownMenuCurrent = document.querySelector(`[aria-labelledby="${prefix}${id}"]`);
      const attrID = dropdownMenuCurrent?.getAttribute('aria-labelledby');
      const dropdownMenuActive = document.querySelectorAll(`.dropdown-menu.action.show`);
      dropdownMenuActive.forEach(elm => {
        const elmAttr = elm.getAttribute('aria-labelledby');
        if (elmAttr !== attrID) elm.classList.remove('show');
      });
    }
  }

  onClickEditFileOrFolder(item: Folder | File, index: number) {
    this.editingItem = {
      item: item,
      index: index
    };
    this.searchUserRoleInFolder = '';
    this.flagViewAddUsers = false;
    this.listUsersInFolder();
  }

  addUserOrUpdateRoleForFolder() {
    let id = this.idShare.nativeElement.value;
    let role: string = this.selectRole.nativeElement.value;
    this.isLoading = true;
    let dataSend: any = [];
    if (id.includes(',')) {
      let ids = id.split(',')
        .filter((value: any, index: any, self: any) => self.indexOf(value) === index);
      ids.forEach((_id: string) => {
        if (_id.trim() !== "")
          dataSend.push({
            "user_id": _id.trim(),
            "role": role,
            "folder_id": this.editingItem?.item.id
          });
      });
    }

    if (dataSend.length == 0) {
      dataSend.push({
        "user_id": id.trim(),
        "role": role,
        "folder_id": this.editingItem?.item.id
      });
    }

    axios.post(`${environment.domain}/api/admin/folder/add-user`, {
      authorization: dataSend
    }).then(res => {

      Swal.fire({
        title: "Thành công!",
        text: "Tạo thành công",
        icon: "success"
      });

      this.isLoading = false;
    }).catch(res => {
      Swal.fire({
        title: "Lỗi",
        text: res?.response?.data?.message ?? "Lỗi khi thêm người dùng!",
        icon: "error"
      });
      this.isLoading = false;
    });
  }

  listUsersInFolder($event?: Event) {
    this.dropdownMenu($event);
    this.isLoading = true;

    axios.post(`${environment.domain}/api/admin/folder/list-user`, {
      folder_id: this.editingItem?.item.id
    }).then(res => {
      (this.editingItem?.item as Folder).app_list_user = res.data.data;
      this.isLoading = false;
    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason?.response?.data?.message ?? 'Lỗi khi lấy người dùng',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      this.isLoading = false;
    });
  }

  removeRole(user: User, role: string) {
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
      if (result.isConfirmed) {
        Swal.fire({
          html: "<img width='50' height='50' src='/assets/angular/browser/loading.gif'/>",
          showConfirmButton: false
        });
        axios.post(`${environment.domain}/api/admin/folder/remove-user`, {
          authorization: [
            {
              "user_id": user.id,
              "role": role,
              "folder_id": this.editingItem?.item.id
            }
          ]
        }).then(res => {
          this.listUsersInFolder();
          Swal.fire({
            title: "Thành công!",
            text: res.data.message,
            icon: "success"
          });
        }).catch(reason => {
          Swal.fire({
            title: "Lỗi!",
            text: reason.response.data.message,
            icon: "error"
          });
        });
      }
    });

  }

  modalViewManagerUser() {
    this.flagViewAddUsers = !this.flagViewAddUsers;
    if (!this.flagViewAddUsers) this.listUsersInFolder();
  }

  beforeSetFilter() {
    const plusAction = document.querySelector('.plus-action.active');
    const plusActionList = document.querySelector('.action-mobile-list.active');
    plusAction?.classList.remove('active');
    plusActionList?.classList.remove('active');
  }

  setFilter($event: Event, show?: string) {
    const homeFilter = document.querySelector('.homeIcon.filter');
    homeFilter?.classList.add('active');
    let currentElement = $event.target as HTMLElement;
    currentElement.classList.add('active');
    this.filterShow = show ?? '';
    if (show == 'folder') {
      this.allItem.map((item) => {
        if (this.instanceOfFile(item)) item._display = false
        else item._display = true
      });
    } else if (show == 'file') {
      this.allItem.map((item) => {
        item._display = this.instanceOfFile(item);
      });
    } else if (show == 'all') {
      homeFilter?.classList.remove('active');
      this.allItem.map((item) => {
        item._display = true
      });
    } else if (show == 'date_updated' || show == 'date_created') {
      let html = /*html*/ `
        <div class="mb-3" style="text-align:left;">
          <label style=" font-size: 14px; font-weight: 600; " for="start_date" class="form-label">Từ:</label>
          <input id="start_date" type="date" class="form-control" value="${this.start_date}">
        </div>
        <div class="mb-3" style="text-align:left;">
          <label style=" font-size: 14px; font-weight: 600; " for="end_date" class="form-label">Đến:</label>
          <input id="end_date" type="date" class="form-control" value="${this.addDay(this.end_date!, -1)}">
        </div>
      `
      Swal.fire({
        title: `${show === 'date_updated' ? 'NGÀY CẬP NHẬT' : 'NGÀY TẢI LÊN'}`,
        html: html,
        showDenyButton: true,
        confirmButtonText: "Tìm kiếm",
        denyButtonText: "Hủy",
        customClass: {
          popup: 'popupRangeDate',
          confirmButton: 'cfBtn',
          denyButton: 'dnBtn'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const start_date = (<HTMLInputElement>document.querySelector('#start_date'));
          const end_date = (<HTMLInputElement>document.querySelector('#end_date'));
          if (Date.parse(start_date.value) / 1000 > Date.parse(end_date.value) / 1000) {
            Swal.fire({
              title: 'Lỗi!',
              text: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
            currentElement?.classList.remove('active');
            return;
          }

          this.start_date = start_date!.value;
          this.end_date = this.addDay(end_date!.value);

          if (show == 'date_created')
            this.allItem.map(
              item => {
                if (item.created_at < this.end_date && item.created_at > this.start_date)
                  item._display = true;
                else
                  item._display = false;
              }
            );
          if (show == 'date_updated')
            this.allItem.map(
              item => {
                if (item.updated_at < this.end_date && item.updated_at > this.start_date)
                  item._display = true;
                else
                  item._display = false;
              }
            );
        } else {
          currentElement?.classList.remove('active');
        }
        this.displayEmpty();
      });
    }
    this.displayEmpty();
  }

  currentDate() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  }

  addDay(dateString: string | number | Date, diffDay: number = 1) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + diffDay);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    function formatNumber(number: number) {
      return number < 10 ? `0${number}` : number;
    }

    const formattedMonth = formatNumber(month);
    const formattedDay = formatNumber(day);
    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  chooseFileModal(item: File) {
    // Kiểm tra xem nó có phải là file hay không
    if (this.instanceOfFile(item)) {
      if (item.type === 'link') {
        window.open(item.path, '_blank');
      } else {
        // Kiểm tra đường dẫn
        if (!item.path) {
          this.isLoading = false;
          Swal.fire({
            title: 'Lỗi!',
            text: 'Tập tin lỗi, không thể mở. Hãy xoá và tải lên lại!',
            icon: 'error',
            confirmButtonText: 'Ok'
          });
          return;
        }

        // Hiển thị cảnh báo nếu cần
        if (localStorage.getItem('hideErrorFile') !== 'true') {
          Swal.fire({
            html: `<b style="margin-bottom: 4px;display:block;">Cần cấp quyền truy cập để xem</b>
                           <div style="text-align:left; font-size: 16px">
                               B1: Vào cài đặt<br>
                               B2: Chọn trình duyệt đang dùng<br>
                               B3: Tìm mục Chặn cửa sổ bật lên<br>
                               B4: Tắt nếu đang cho phép chặn
                           </div>`,
            icon: 'info',
            confirmButtonText: 'Ok',
          }).then(() => {
            localStorage.setItem('hideErrorFile', 'true');
          });
        } else {
          // Nếu đã ẩn thông báo lỗi, mở file
          this.openFile(item);
        }
      }
    }
  }

  openFile(item: File) {
    let cleanPath = item.path.replace('files/', '');
    const newWindow = window.open;
    // Get presign URL
    if (!this.isLoading) this.isLoading = true;
    axios.post(`${environment.domain}/api/getfile`, {
      path: cleanPath,
    }).then(res => {
      let myURL = res.data.data.url;
      this.isLoading = false;
      let openFileCheck = newWindow(myURL, '_blank');
      if (openFileCheck === null) localStorage.setItem('hideErrorFile', 'false');
    }).catch(() => {
      this.isLoading = false;
      Swal.fire({
        title: 'Lỗi!',
        text: 'Tập tin lỗi, không thể mở!',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    });
  }
}
