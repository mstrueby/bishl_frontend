export interface DocumentsValues{
  _id: string;
  title: string;
  alias: string;
  category: string;
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSizeByte: number;
  published: boolean;
  createDate: Date;
  createUser: {
    userId: string;
    firstName: string;
    lastName: string;
  }
  updateDate: Date;
  updateUser: {
    userId: string;
    firstName: string;
    lastName: string;
  }
}

export interface DocumentsValuesForm{
  _id: string;
  title: string;
  alias: string;
  category: string;
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSizeByte: number;
  published: boolean;
}