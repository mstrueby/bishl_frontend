export interface PostValuesDisplay {
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

export interface PostValuesAdd {
  title: string;
  alias: string;
  imageUrl: string;
  content: string;
  published: boolean;
  featured: boolean;
}

export interface PostValuesEdit extends PostValuesAdd {
  _id: string;
}