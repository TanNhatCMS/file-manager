import {Component, Input} from '@angular/core';
import axios from 'axios';
import Swal from 'sweetalert2';
import {File, Folder} from '../../interfaces/model';
import {GLOBALS} from '../../global';
import {CommonModule} from '@angular/common';
import {convertBytes} from '../../functions';
import {SpinnerComponent} from '../../spinner/spinner.component';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-trash-list',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './trash-list.component.html',
})
export class TrashListComponent {

  @Input() allItem: (File | Folder)[] = [];
  @Input() breadcrumb: Folder[] = [];
  @Input() styleView: 'list' | 'grid' = 'grid';
  public files: File[] = [];
  public user = GLOBALS.user;
  public isLoading = false;

  documentClass(object: any) {
    if (!this.instanceOfFile(object)) {
      return 'folder';
    } else if (object.type == 'link') {
      return 'link';
    } else {
      return 'file';
    }
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

  deleteFileOrFolder(item: Folder | File, index: number) {
    let object = this.instanceOfFile(item) ? 'file' : 'folders';
    Swal.fire({
      text: `Bạn muốn xóa VĨNH VIỄN report này?`,
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
        Swal.fire({
          html: "<img width='50' height='50' src='/assets/angular/browser/loading.gif'/>",
          showConfirmButton: false
        });
        axios.post(`${environment.domain}/api/${object}/delete`, {
          id: item.id
        }).then(res => {
          this.allItem.splice(index, 1);
          Swal.fire({
            title: 'Thành công!',
            text: res.data.message,
            icon: 'success',
            confirmButtonText: 'Ok'
          });
        }).catch(reason => {
          Swal.fire({
            title: 'Error!',
            text: 'Error while deleting',
            icon: 'error',
            confirmButtonText: 'Ok'
          });
          console.error('Error while deleting:', reason);
        })
      }
    });

  }

  restoreFileOrFolder(item: Folder | File, index: number) {
    let object = this.instanceOfFile(item) ? 'file' : 'folders';
    Swal.fire({
      html: "<img width='50' height='50' src='/assets/angular/browser/loading.gif'/>",
      showConfirmButton: false
    });
    axios.post(`${environment.domain}/api/${object}/restore`, {
      id: item.id
    }).then(res => {
      this.allItem.splice(index, 1);
      Swal.fire({
        title: 'Thành công!',
        text: res.data.message,
        icon: 'success',
        confirmButtonText: 'Ok'
      });
      this.viewTrash();
    }).catch(reason => {
      Swal.fire({
        title: 'Lỗi!',
        text: reason.response.data.message ?? 'Lỗi khi xóa!',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    })

  }

  viewTrash() {
    axios.post(`${environment.domain}/api/trash`).then(res => {
      this.allItem.length = this.files.length = 0;
      this.files = res.data.data.trash.files;
      let folders = res.data.data.trash.folders;
      this.files = this.files.map(item => {
        item._size = convertBytes(item.size);
        return item;
      });
      this.allItem.push(...folders, ...this.files);

    });
  }

  info(item: File | Folder) {
    let uploadBy =
      (this.instanceOfFile(item) && item!.upload_by) ? `<div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Người tạo:</b> <span>${item.upload_by}</span></div>` : '';
    let permission = item?.permissions?.read ? `
      <div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Quyền:</b> ${item?.permissions?.create ? '<span class="badge badge-primary">Tạo</span>' : ''} ${item?.permissions?.read ? '<span class="badge badge-primary">Xem</span>' : ''} ${item?.permissions?.update ? '<span class="badge badge-primary">Chỉnh sửa</span>' : ''} ${item?.permissions?.delete ? '<span class="badge badge-primary">Xóa</span>' : ''}</div>
    ` : '';
    let deleted_at = item.deleted_at ? `<div class="d-flex flex-wrap gap-1" style=" font-size: 16px; "> <b>Xoá lúc:</b> <span>${
      (new Date(item.deleted_at))
        .toLocaleString('en-GB', {hour12: false})
    }</span></div>` : '';

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
        ${deleted_at}
      </div>
      <hr>
      `,
      icon: "info"
    });
  }

  dropdownMenu($event: Event) {
    $event.preventDefault();
    $event.stopPropagation();
  }
}
