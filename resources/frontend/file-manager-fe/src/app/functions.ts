import {jwtDecode} from "jwt-decode";
import {isPlatformBrowser} from '@angular/common';
import {File, Folder} from "./interfaces/model";
import {TreeNode} from "primeng/api";

/**
 * Return `null` if it failed and return `token` if user is logged in
 */
export function authenticate(platformId: Object) {
  if (isPlatformBrowser(platformId)) {
    let jwt = localStorage.getItem('jwt');
    if (jwt) {
      let infoToken = jwtDecode(jwt);
      if (Date.now() < (infoToken.exp! * 1000)) {
        return infoToken;
      }
    }
  }
  return null;
}

export function convertBytes(bytes: number) {
  if (bytes < 1024) {
    return bytes + ' Bytes';
  } else if (bytes < 1048576) { // 1024 * 1024
    return (bytes / 1024).toFixed(2) + ' KB';
  } else if (bytes < 1073741824) { // 1024 * 1024 * 1024
    return (bytes / 1048576).toFixed(2) + ' MB';
  } else {
    return (bytes / 1073741824).toFixed(2) + ' GB';
  }
}

export function scrollToElm(container: any, elm: any, duration: any) {

  function getRelativePos(elm: any) {
    const pPos = elm.parentNode.getBoundingClientRect();
    const cPos = elm.getBoundingClientRect();
    return {
      top: cPos.top - pPos.top + elm.parentNode.scrollTop,
      right: cPos.right - pPos.right,
      bottom: cPos.bottom - pPos.bottom,
      left: cPos.left - pPos.left
    };
  }

  function scrollTo(element: any, to: any, duration: any, onDone: any) {
    let start = element.scrollTop,
      change = to - start,
      startTime = performance.now(),
      now, elapsed, t;
    function animateScroll() {
      now = performance.now();
      elapsed = (now - startTime) / 1000;
      t = (elapsed / duration);
      element.scrollTop = start + change * easeInOutQuad(t);
      if (t < 1)
        window.requestAnimationFrame(animateScroll);
      else
        onDone && onDone();
    }
    animateScroll();
  }
  function easeInOutQuad(t: any) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }
  const pos = getRelativePos(elm);
  scrollTo(container, pos.top, duration / 1000, null);
}

export function instanceOfFile(object: any): object is File {
  return 'size' in object;
}

export function removeDiacritics(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

export function containsWithoutDiacritics(string: string, substring: string) {
  const normalizedString = removeDiacritics(string).toLowerCase();
  const normalizedSubstring = removeDiacritics(substring).toLowerCase();
  return normalizedString.includes(normalizedSubstring);
}

export function mapFolderToTreeNode(folder: Folder, app_list_folders: Folder[]): TreeNode<Folder> {
  function checkNotIncludes(folder_id: string, app_list_folders: Folder[]) {
    return !app_list_folders!.find(fd => fd.id === folder_id);
  }
  return {
    label: folder.name,
    data: folder,
    icon: checkNotIncludes(folder.id, app_list_folders) ? 'pi pi-fw pi-folder' : 'pi pi-fw pi-folder-plus',
    key: folder.id.toString(),
    children: folder.childrens?.map(child => mapFolderToTreeNode(child, app_list_folders)) || [],
  };
}

export function getIdsFromTreeNodes(treeNodes: any[]): string[] {
  const ids: string[] = [];
  function extractIds(node: TreeNode<Folder>) {
    if (node.key) {
      ids.push(node.key);
    }
    node.children?.forEach(extractIds);
  }
  if (treeNodes!.length === 0) return [];
  treeNodes.forEach(extractIds);
  return ids;
}


