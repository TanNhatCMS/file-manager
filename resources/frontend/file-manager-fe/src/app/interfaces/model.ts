export interface User{
  username: string,
  name: string,
  id: string,
  app_list_folders?: Folder[],
}

export interface Global{
  inLogin:boolean,
  user: User
}

export interface Folder{
  created_at:string,
  folder_id: string|number,
  id: string,
  name: string,
  updated_at: string,
  deleted_at?: string,
  parent: Folder|null,
  permission: {
    create: boolean,
    read: boolean,
    update: boolean,
    delete: boolean
  },
  permissions?: {
    create: boolean,
    read: boolean,
    update: boolean,
    delete: boolean
  },
  app_list_user: {
    admin: User[],
    editors: User[],
    viewers: User[]

  },
  role?: string, // this is api my-folder
  breadcrumb?: string, // this is api my-folder
  _display?: boolean,
  childrens?: Folder[], // this is api admin/folder/home
  type?: string // fix type for main-list
}

export interface File{
  created_at: string,
  folder_id: string,
  id: string,
  name: string,
  path: string,
  size: number,
  permissions?: {
    create: boolean,
    read: boolean,
    update: boolean,
    delete: boolean
  },
  /**
   * This size is converted from the `size`
  */
  _size: string,
  type: string,
  updated_at: string,
  upload_by: string,
  deleted_at?: string,
  _display?: boolean,
}
