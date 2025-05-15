import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  output,
  Output,
  ViewChild
} from '@angular/core';
import {File, Folder, User} from '../../interfaces/model';
import {CommonModule} from '@angular/common';
import {convertBytes, scrollToElm, containsWithoutDiacritics} from '../../functions';
import axios from 'axios';
import {GLOBALS} from '../../global';
import Swal from 'sweetalert2';
import {SpinnerComponent} from '../../spinner/spinner.component';
import {FormsModule} from '@angular/forms';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-main-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './main-list.component.html',
  styleUrl: './main-list.component.scss'
})
export class MainListComponent implements AfterViewInit {
  @ViewChild('closeEditModal') closeEditModal!: ElementRef;
  @ViewChild('closePermissionModal') closePermissionModal!: ElementRef;
  @ViewChild('linkUpdateFile') linkUpdateFile!: ElementRef;
  @ViewChild('permissionCreate') permissionCreate!: ElementRef;
  @ViewChild('permissionRead') permissionRead!: ElementRef;
  @ViewChild('permissionUpdate') permissionUpdate!: ElementRef;
  @ViewChild('permissionDelete') permissionDelete!: ElementRef;
  @ViewChild('idShare') idShare!: ElementRef;
  @ViewChild('selectRole') selectRole!: ElementRef;
  @ViewChild('nameUpdateFile') nameUpdateFile!: ElementRef;
  public searchUserRoleInFolder: string = '';
  @Input() allItem: (File | Folder)[] = [];
  @Input() breadcrumb: Folder[] = [];
  @Input() folder_shortcuts?: Folder[] = [];
  @Input() file_shortcuts?: File[] = [];
  @Input() styleView: 'list' | 'grid' = 'grid';
  @Output() breadcrumbChange = new EventEmitter<Folder[]>();
  changeRootFolder = output<Folder>();

  focusInput(inputName?: string) {
    setTimeout(() => {
      this.nameUpdateFile.nativeElement.focus();
    }, 520);
  }

  ngAfterViewInit() {
    if (this.isAdmin()) this.getListUsers();
  }

  public isLoading = false;
  private touchTime = 0;
  private touchID: string | null = null;
  public files: File[] = [];
  @Input() root_folder_opening?: Folder;
  public user = GLOBALS.user;
  public editingItem?: {
    index: number,
    item: File | Folder
  };
  isProcessinglistUserInFolder = false;
  public flagViewAddUsers = true;
  public allUsers: User[] = [];

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

  documentClass(object: any) {
    if (!this.instanceOfFile(object)) {
      return 'folder';
    } else if (object.type == 'link') {
      return 'link';
    } else {
      return 'file';
    }
  }

  containsWithoutDiacritics(str: string, keyword: string) {
    return containsWithoutDiacritics(
      str.replaceAll(' ', ''),
      keyword.replaceAll(' ', '')
    );
  }

  modalViewManagerUser() {
    this.flagViewAddUsers = !this.flagViewAddUsers;

    if (!this.flagViewAddUsers) this.listUsersInFolder();
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
        title: 'Error!',
        text: reason?.response?.data?.message ?? 'Error while get users',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      this.isLoading = false;
    });
  }

  isSafari() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('safari') && !ua.includes('chrome');
  }

  private chooseFolderOrFile(item: Folder | File) {
    if (this.instanceOfFile(item)) {

      if (item.type == 'link') {
        window.open(item.path, '_blank');
      } else {

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

        if (localStorage.getItem('hideErrorFile') !== 'true') {
          Swal.fire({
            html: `<b style="margin-bottom: 4px;display:block;">Cần cấp quyền truy cập để xem</b>
              <div style="text-align:left; font-size: 16px">
                B1: Vào cài đặt<br>
                B2: Chọn trình duyệt đang dùng<br>
                B3: Tìm mục Chặn cửa sổ bật lên<br>
                B4: Tắt nếu đang cho phép chặn
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'Ok',
          }).then(() => {
            localStorage.setItem('hideErrorFile', 'true');
          });
        }

        if (localStorage.getItem('hideErrorFile') === 'true') this.openFile(item);
      }
    } else
      this.chooseFolder(item);
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

  chooseFolder(folder: Folder) {
    if (!this.isLoading) this.isLoading = true;
    this.root_folder_opening = folder;
    this.changeRootFolder.emit(folder);
    axios.post(`${environment.domain}/api/folders`, {id: folder.id ?? folder.folder_id}).then(res => {
      this.allItem.length = this.files.length = 0;
      let currentFolder = res.data.data.folders;
      this.files = currentFolder.files;
      let folders = currentFolder.children;
      this.files = this.files.map(item => {
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
      if (!this.isAdmin()) this.breadcrumb.push(this.user_test_folder);
      this.breadcrumb = this.breadcrumb.reverse();
      this.breadcrumbChange.emit(this.breadcrumb);
      let shortcuts = document.querySelectorAll('.folder-shortcut.active');
      shortcuts.forEach(elm => elm.classList.remove('active'));

      let shortcutChosen = document.querySelector(`#shortcutItem_${folder.id}`);
      shortcutChosen?.classList.add('active');

      if (shortcutChosen !== null)
        scrollToElm(
          document.querySelector('.folder-list'),
          shortcutChosen,
          500
        )

      this.isLoading = false;

      this.displayEmpty();

    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason?.response?.data?.message ?? 'Error while getting folders',
        icon: 'error',
        confirmButtonText: 'Ok'
      });

      this.isLoading = false;
    });
  }

  setShortcutFolder(fd: Folder, action: 'delete' | 'insert') {

    axios.post(`${environment.domain}/api/folders/set-shortcut`, {
      "folder_id": fd.id,
      "shortcut": action != 'delete'
    }).then(res => {
      if (action == 'delete') {
        let idx = this.folder_shortcuts!.findIndex(item => item.id == fd.id);
        this.folder_shortcuts!.splice(idx, 1);
      } else {
        this.folder_shortcuts!.push(fd);
      }
      Swal.fire({
        title: 'Thành công!',
        text: res.data.message,
        icon: 'success',
        confirmButtonText: 'Ok'
      });
    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason?.response?.data?.message ?? 'Lỗi khi thêm lối tắt!',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    })
  }

  setShortcutFile(file: File, action: 'delete' | 'insert') {

    axios.post(`${environment.domain}/api/file/set-shortcut`, {
      "file_id": file.id,
      "shortcut": action != 'delete'
    }).then(res => {
      if (action == 'delete') {
        let idx = this.file_shortcuts!.findIndex(item => item.id == file.id);
        this.file_shortcuts!.splice(idx, 1);
      } else {
        this.file_shortcuts!.push(file);
      }
      Swal.fire({
        title: 'Thành công!',
        text: res.data.message,
        icon: 'success',
        confirmButtonText: 'Ok'
      });
    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason?.response?.data?.message ?? 'Lỗi khi thêm lối tắt!',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    })
  }

  viewFodlerOrFile(item: Folder | File) {

    this.chooseFolderOrFile(item);
    return;

    // if (this.touchTime == 0) {
    //     // set first click
    //     this.touchTime = new Date().getTime();
    //     this.touchID = item.id;
    // } else {
    //     // compare first click to this click and see if they occurred within double-click threshold
    //     if (((new Date().getTime()) – this.touchTime) < 800 && this.touchID == item.id) {
    //         this.chooseFolderOrFile(item);
    //         this.touchTime = 0;
    //         this.touchID = null;
    //     } else {
    //         // not a double click so set as a new first click
    //         this.touchTime = new Date().getTime();
    //         this.touchID = item.id;
    //     }
    // }
  }

  instanceOfFile(object: any): object is File {
    return 'size' in object;
  }

  instanceOfFolder(object: any): object is Folder {
    return 'permission' in object;
  }

  isAdmin() {
    return this.user.username == 'admin'
  }

  getSize_computed(item: File | Folder) {
    if (this.instanceOfFile(item)) {
      return (item as File)._size;
    } else
      return '';
  }

  getDocumentDescription(item: File | Folder) {
    if (!this.instanceOfFile(item)) {
      return `
        ${item.permission.create ? 'C' : ''}
        ${item.permission.read ? 'R' : ''}
        ${item.permission.update ? 'U' : ''}
        ${item.permission.delete ? 'D' : ''}
      `
    } else {
      if (item.type == 'link')
        return item.path;
      else
        return this.getSize_computed(item);
    }
  }

  onClickEditFileOrFolder(item: Folder | File, index: number, target?: string) {
    this.editingItem = {
      item: item,
      index: index
    };
    if (target == 'permission') this.listUserInFolder();
  }

  deleteFileOrFolder(item: Folder | File, index: number) {
    let object = this.instanceOfFile(item) ? 'tập tin' : 'thư mục';
    let api_ = this.instanceOfFile(item) ? 'file' : 'folders';
    Swal.fire({
      text: `Bạn có chắc chắn muốn xóa ${object} này không?`,
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
        axios.post(`${environment.domain}/api/${api_}/delete`, {
          id: item.id
        }).then(res => {
          this.allItem.splice(index, 1);
          this.displayEmpty();
          Swal.fire({
            title: 'Thành công!',
            text: res.data.message,
            icon: 'success',
            confirmButtonText: 'Ok'
          });
        }).catch(reason => {
          Swal.fire({
            title: 'Lỗi!',
            text: reason?.response?.data?.message ?? 'Lỗi khi xóa!',
            icon: 'error',
            confirmButtonText: 'Ok'
          });
        })
      }
    });

  }

  editPermissionFileOrFolder() {
    if (this.instanceOfFile(this.editingItem?.item) == false) {
      let mPermission = '';
      if (this.permissionCreate.nativeElement.checked)
        mPermission += 'create,'
      if (this.permissionDelete.nativeElement.checked)
        mPermission += 'delete,'
      if (this.permissionRead.nativeElement.checked)
        mPermission += 'read,'
      if (this.permissionUpdate.nativeElement.checked)
        mPermission += 'update,'
      mPermission = mPermission.replace(/,$/, '');

      let object = this.instanceOfFile(this.editingItem?.item) ? 'file' : 'folders';
      Swal.fire({
        html: "<img width='50' height='50' src='/assets/angular/browser/loading.gif'/>",
        showConfirmButton: false
      });
      axios.post(`${environment.domain}/api/${object}/update`, {
        id: this.editingItem?.item.id,
        name: this.editingItem?.item.name,
        permission: mPermission
      }).then(res => {
        this.allItem[this.editingItem!.index] = res.data.data.folder;
        this.closePermissionModal.nativeElement.click();
        Swal.fire({
          title: 'Thành công!',
          text: res.data.message,
          icon: 'success',
          confirmButtonText: 'Ok'
        });

      }).catch(() => {
        Swal.fire({
          title: 'Lỗi!',
          text: 'Lỗi khi chỉnh sửa quyền',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      })
    }
  }

  editFileOrFolder(fileName: string) {
    let item = this.editingItem!.item;
    let object = this.instanceOfFile(item) ? 'file' : 'folders';
    let path = this.linkUpdateFile ? this.linkUpdateFile.nativeElement.value : '';
    let thisInput = this.nameUpdateFile.nativeElement;
    thisInput.disabled = true;
    Swal.fire({
      html: "<img width='50' height='50' src='/assets/angular/browser/loading.gif'/>",
      showConfirmButton: false
    });
    axios.post(`${environment.domain}/api/${object}/update`, {
      id: item.id,
      name: fileName,
      path: path
    }).then(res => {
      item.name = fileName;
      if (this.instanceOfFile(item))
        item.path = path;
      this.closeEditModal.nativeElement.click();
      Swal.fire({
        title: 'Thành công!',
        text: res.data.message,
        icon: 'success',
        confirmButtonText: 'Ok'
      });
      thisInput.disabled = false;
    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason?.response?.data?.message ?? 'Lỗi khi chỉnh sửa',
        icon: 'error',
        confirmButtonText: 'Ok'
      }).then(() => {
        thisInput.disabled = false;
      });
    })
  }

  getListUsers() {
    axios.post(`${environment.domain}/api/admin/list-user?get_all=1`).then(res => {
      this.allUsers = res.data.data.users;
    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason.response.data.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    });
  }

  listUserInFolder() {
    this.isProcessinglistUserInFolder = true;
    axios.post(`${environment.domain}/api/admin/folder/list-user`, {folder_id: this.editingItem?.item.id}).then(res => {
      (this.editingItem?.item as Folder).app_list_user = res.data.data;
    }).catch(reason => {
      Swal.fire({
        title: "Lỗi!",
        text: reason.response.data.message,
        icon: "error"
      });
    }).finally(() => {
      this.isProcessinglistUserInFolder = false;
    })
  }

  info(item: File | Folder) {
    let uploadBy =
      this.instanceOfFile(item) ? `<div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Người tạo:</b> <span>${item.upload_by}</span></div>` : '';
    let permission = this.instanceOfFolder(item) ? `
      <div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Quyền:</b> ${item.permission.create ? '<span class="badge badge-primary">Tạo</span>' : ''} ${item.permission.read ? '<span class="badge badge-primary">Xem</span>' : ''} ${item.permission.update ? '<span class="badge badge-primary">Chỉnh sửa</span>' : ''} ${item.permission.delete ? '<span class="badge badge-primary">Xóa</span>' : ''}</div>
    ` : '';
    let link = this.instanceOfFile(item) && item.type == 'link' ?
      `<div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Link:</b> <a target="_blank" href="${item.path}">${item.path}</a></div>` : '';
    let fileType = this.instanceOfFile(item) && item.type != 'link' ?
      `<div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Loại:</b> <span class="badge badge-info">${item.type}</span></div>` : '';
    Swal.fire({
      html: `
      <hr>
      <div class="d-flex flex-column gap-3 justify-content-start align-items-start">
        <div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>ID:</b> <span>${item.id}</span></div>
        <div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Tên:</b> <span>${item.name}</span></div>
        ${permission}
        ${uploadBy}
        ${link}
        ${fileType}
        <div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Ngày tạo lúc:</b> <span>${
        (new Date(item.created_at))
          .toLocaleString('en-GB', {hour12: false})
      }</span></div>
        <div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Cập nhật lúc:</b> <span>${
        (new Date(item.updated_at))
          .toLocaleString('en-GB', {hour12: false})
      }</span></div>
      </div>
      <hr>
      `,
      icon: "info"
    });
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

  displayEmpty() {
    const noData = document.querySelector('.empty-main-list');
    if (this.allItem.length === 0) {
      noData?.classList.remove('d-none');
    } else {
      noData?.classList.add('d-none');
    }
  }
}
