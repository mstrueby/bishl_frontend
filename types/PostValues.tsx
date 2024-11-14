export interface PostValues {
  _id: string;
  title: string;
  alias: string;
  content: string;
  author: {
    firstName: string;
    lastName: string;
  };
  //tags: string[];
  imageUrl: string;
  published: boolean;
  featured: boolean;
  publishDateFrom: Date;
  publishDateTo: Date;
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

export interface PostValuesForm {
  _id: string;
  title: string;
  alias: string;
  imageUrl?: string;
  content: string;
  published: boolean;
  featured: boolean;
  author: {
    firstName: string;
    lastName: string;
  }
}
